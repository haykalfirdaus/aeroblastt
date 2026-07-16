import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/api/_auth';
import { grantRank, giveMoney, giveKey, giveBansos, bansosCancel, bansosList, eventAdd, eventClear, eventTime, KEY_NAMES } from '@/api/_rcon';

const VALID_ACTIONS = ['rank', 'money', 'key', 'bansos', 'event'];

function makeReq(request) {
  return { headers: { cookie: request.headers.get('cookie') || '' } };
}

export async function POST(request) {
  if (!(await isAuthenticated(makeReq(request)))) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 }); }

  const { action } = body || {};
  if (!VALID_ACTIONS.includes(action)) return NextResponse.json({ ok: false, error: `action tidak valid` }, { status: 400 });

  let result;

  if (action === 'rank') {
    const { nick, rankKey, duration } = body;
    if (!nick?.trim()) return NextResponse.json({ ok: false, error: 'nick diperlukan' }, { status: 400 });
    result = await grantRank(nick.trim(), rankKey, duration ?? 'permanent');
  } else if (action === 'money') {
    const { nick } = body; const amount = Number(body.amount);
    if (!nick?.trim()) return NextResponse.json({ ok: false, error: 'nick diperlukan' }, { status: 400 });
    if (!amount || amount <= 0) return NextResponse.json({ ok: false, error: 'amount harus angka positif' }, { status: 400 });
    result = await giveMoney(nick.trim(), amount);
  } else if (action === 'key') {
    const { nick, keyName } = body; const qty = Number(body.qty);
    if (!nick?.trim()) return NextResponse.json({ ok: false, error: 'nick diperlukan' }, { status: 400 });
    if (!keyName || !KEY_NAMES.includes(keyName)) return NextResponse.json({ ok: false, error: `keyName tidak valid` }, { status: 400 });
    if (!qty || qty <= 0) return NextResponse.json({ ok: false, error: 'qty harus angka positif' }, { status: 400 });
    result = await giveKey(nick.trim(), keyName, qty);
  } else if (action === 'bansos') {
    const { subAction, keyName } = body;
    if (subAction === 'list') { result = await bansosList(); }
    else if (subAction === 'cancel') { const { bansosId } = body; if (!bansosId) return NextResponse.json({ ok: false, error: 'bansosId diperlukan' }, { status: 400 }); result = await bansosCancel(bansosId); }
    else { if (!keyName || !KEY_NAMES.includes(keyName)) return NextResponse.json({ ok: false, error: `keyName tidak valid` }, { status: 400 }); const amount = Number(body.amount); if (!amount || amount <= 0) return NextResponse.json({ ok: false, error: 'amount harus angka positif' }, { status: 400 }); result = await giveBansos(keyName, amount, body.duration?.trim() || null); }
  } else if (action === 'event') {
    const { subAction } = body;
    if (subAction === 'add') { const { name, startTime, duration } = body; if (!name?.trim() || !startTime?.trim() || !duration?.trim()) return NextResponse.json({ ok: false, error: 'name, startTime, duration diperlukan' }, { status: 400 }); result = await eventAdd(name.trim(), startTime.trim(), duration.trim()); }
    else if (subAction === 'clear') { const { target } = body; if (!target?.trim()) return NextResponse.json({ ok: false, error: 'target diperlukan' }, { status: 400 }); result = await eventClear(target.trim()); }
    else if (subAction === 'time') { const { timeAction, target, time } = body; if (!['add', 'reduce'].includes(timeAction) || !target?.trim() || !time?.trim()) return NextResponse.json({ ok: false, error: 'timeAction, target, time diperlukan' }, { status: 400 }); result = await eventTime(timeAction, target.trim(), time.trim()); }
    else return NextResponse.json({ ok: false, error: 'subAction tidak valid' }, { status: 400 });
  }

  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}

export async function OPTIONS() { return new NextResponse(null, { status: 204 }); }
