import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { isAuthenticated } from '@/api/_auth';
import { rateLimit } from '@/api/_ratelimit';

export const runtime = 'nodejs';
export const maxDuration = 120;
export const dynamic = 'force-dynamic';

const TARGET_URL = process.env.DIAGNOSE_TARGET_URL || 'https://store.aeroblast.my.id/';
const PSI_ENDPOINT = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';
const MODEL = 'claude-sonnet-5';

const SYSTEM_PROMPT =
  'Kamu adalah Web Performance Expert. Analisis metrik kecepatan dari website ' +
  `${TARGET_URL} ini. Deteksi secara spesifik apa saja yang menyebabkannya lambat ` +
  'dan berikan instruksi perbaikan teknis yang langsung bisa dieksekusi. ' +
  'Jawab dalam Bahasa Indonesia. Urutkan temuan dari dampak terbesar ke terkecil, ' +
  'dan untuk setiap temuan sebutkan: (1) metrik/audit yang terpengaruh, ' +
  '(2) akar penyebabnya, (3) langkah perbaikan konkret yang bisa langsung dikerjakan. ' +
  'Jangan mengarang audit yang tidak ada di data.';

/** Audits that carry no optimisation signal — dropped before sending to the model. */
const IGNORED_AUDITS = new Set([
  'network-requests', 'network-rtt', 'network-server-latency', 'main-thread-tasks',
  'metrics', 'screenshot-thumbnails', 'final-screenshot', 'script-treemap-data',
  'resource-summary', 'third-party-summary', 'largest-contentful-paint-element',
  'layout-shift-elements', 'long-tasks', 'user-timings', 'diagnostics',
]);

function pickMetrics(audits) {
  const m = (id) => {
    const a = audits?.[id];
    if (!a) return null;
    return { display: a.displayValue ?? null, score: a.score ?? null, raw: a.numericValue ?? null };
  };
  return {
    LCP: m('largest-contentful-paint'),
    CLS: m('cumulative-layout-shift'),
    TBT: m('total-blocking-time'),
    FCP: m('first-contentful-paint'),
    SI: m('speed-index'),
    TTI: m('interactive'),
    TTFB: m('server-response-time'),
  };
}

/**
 * Keeps only audits that actually failed, sorted worst-first, and strips the
 * verbose `details.items` tables down to a handful of rows. A raw PSI response
 * is ~600KB of JSON — far past what is useful (or affordable) to hand a model.
 */
function pickFailedAudits(audits, limit = 18) {
  return Object.values(audits ?? {})
    .filter((a) => {
      if (IGNORED_AUDITS.has(a.id)) return false;
      if (a.scoreDisplayMode === 'notApplicable' || a.scoreDisplayMode === 'manual') return false;
      return typeof a.score === 'number' && a.score < 0.9;
    })
    .sort((a, b) => (a.score ?? 0) - (b.score ?? 0))
    .slice(0, limit)
    .map((a) => ({
      id: a.id,
      title: a.title,
      score: a.score,
      displayValue: a.displayValue ?? null,
      savingsMs: a.details?.overallSavingsMs ?? null,
      savingsBytes: a.details?.overallSavingsBytes ?? null,
      // Top offenders only — enough to name the culprit without dumping the table.
      offenders: (a.details?.items ?? []).slice(0, 5).map((it) => ({
        url: it.url ?? it.source ?? it.node?.selector ?? null,
        wastedMs: it.wastedMs ?? null,
        wastedBytes: it.wastedBytes ?? null,
        totalBytes: it.totalBytes ?? null,
      })),
    }));
}

async function runPageSpeed(strategy, apiKey) {
  const url = new URL(PSI_ENDPOINT);
  url.searchParams.set('url', TARGET_URL);
  url.searchParams.set('key', apiKey);
  url.searchParams.set('strategy', strategy);
  url.searchParams.append('category', 'PERFORMANCE');

  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`PageSpeed ${strategy} HTTP ${res.status}: ${body.slice(0, 300)}`);
  }

  const json = await res.json();
  const lh = json.lighthouseResult ?? {};
  return {
    strategy,
    score: Math.round((lh.categories?.performance?.score ?? 0) * 100),
    metrics: pickMetrics(lh.audits),
    failedAudits: pickFailedAudits(lh.audits),
    // Field data from real Chrome users, when Google has enough samples.
    fieldData: json.loadingExperience?.metrics
      ? Object.fromEntries(
          Object.entries(json.loadingExperience.metrics).map(([k, v]) => [k, v.category])
        )
      : null,
  };
}

export async function GET(request) {
  // Diagnostics expose infrastructure detail and burn quota on two paid APIs,
  // so this is admin-only and rate limited — same posture as the other admin routes.
  if (!(await isAuthenticated({ headers: { cookie: request.headers.get('cookie') || '' } }))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const rl = rateLimit(`diagnose:${ip}`, { max: 5, windowMs: 10 * 60 * 1000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Terlalu banyak request. Coba lagi nanti.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
    );
  }

  const psiKey = process.env.PAGESPEED_API_KEY;
  const aiKey = process.env.ANTHROPIC_API_KEY;
  if (!psiKey) {
    return NextResponse.json({ error: 'PAGESPEED_API_KEY belum diset' }, { status: 500 });
  }
  if (!aiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY belum diset' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const strategy = searchParams.get('strategy') === 'desktop' ? 'desktop' : 'mobile';
  const skipAi = searchParams.get('ai') === '0';

  try {
    const report = await runPageSpeed(strategy, psiKey);

    if (skipAi) {
      return NextResponse.json({ target: TARGET_URL, report, analysis: null });
    }

    const anthropic = new Anthropic({ apiKey: aiKey });
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content:
            `Data PageSpeed Insights (strategy: ${strategy}) untuk ${TARGET_URL}:\n\n` +
            '```json\n' +
            JSON.stringify(report, null, 2) +
            '\n```',
        },
      ],
    });

    const analysis = message.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();

    return NextResponse.json({
      target: TARGET_URL,
      strategy,
      score: report.score,
      metrics: report.metrics,
      failedAudits: report.failedAudits,
      fieldData: report.fieldData,
      analysis,
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Gagal menjalankan diagnosa', detail: err.message },
      { status: 502 }
    );
  }
}
