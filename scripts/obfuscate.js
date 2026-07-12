import JavaScriptObfuscator from 'javascript-obfuscator';
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const DIST_JS = join(process.cwd(), 'dist', 'assets', 'js');

function walkJs(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...walkJs(full));
    } else if (extname(entry) === '.js') {
      files.push(full);
    }
  }
  return files;
}

const files = walkJs(DIST_JS);
let total = 0;

for (const file of files) {
  const src = readFileSync(file, 'utf8');
  const result = JavaScriptObfuscator.obfuscate(src, {
    compact: true,
    controlFlowFlattening: false,   // slows runtime too much
    deadCodeInjection: false,
    debugProtection: true,
    debugProtectionInterval: 4000,
    disableConsoleOutput: true,
    identifierNamesGenerator: 'hexadecimal',
    renameGlobals: false,           // must stay false — breaks module scope
    selfDefending: true,
    stringArray: true,
    stringArrayCallsTransform: true,
    stringArrayCallsTransformThreshold: 1,
    stringArrayEncoding: ['rc4'],
    stringArrayIndexShift: true,
    stringArrayRotate: true,
    stringArrayShuffle: true,
    stringArrayWrappersCount: 3,
    stringArrayWrappersChainedCalls: true,
    stringArrayWrappersParametersMaxCount: 3,
    stringArrayWrappersType: 'function',
    stringArrayThreshold: 1,
    transformObjectKeys: true,
    unicodeEscapeSequence: false,   // huge file size if enabled
  });
  writeFileSync(file, result.getObfuscatedCode(), 'utf8');
  total++;
}

console.log(`Obfuscated ${total} JS file(s) in dist/assets/js`);
