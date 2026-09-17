// GATE: contrast
// Checks every declared text/background pair in tokens.json meets WCAG AA,
// and every non-text pair (e.g. focus ring against its likely background) meets 3:1.
// This gate needs NO component code — it validates the token file itself,
// which is why it can run today even though no component exists yet.

const path = require('path');
const { contrastRatio } = require('../lib/color');

const TEXT_MIN = 4.5;    // WCAG AA, normal text
const NON_TEXT_MIN = 3.0; // WCAG AA, UI components / graphical objects

function resolve(tokens, name) {
  const paletteKey = tokens.color[name];
  if (!paletteKey) throw new Error(`Unknown semantic color "${name}"`);
  const hex = tokens.palette[paletteKey];
  if (!hex) throw new Error(`Semantic "${name}" points at unknown palette key "${paletteKey}"`);
  return hex;
}

function run(tokensPath = path.join(__dirname, '../tokens/tokens.json')) {
  const tokens = require(tokensPath);
  const results = [];

  for (const [bg, fg] of tokens.textPairs) {
    const ratio = contrastRatio(resolve(tokens, bg), resolve(tokens, fg));
    results.push({
      pair: `${fg} on ${bg}`,
      ratio: Number(ratio.toFixed(2)),
      min: TEXT_MIN,
      pass: ratio >= TEXT_MIN,
    });
  }

  for (const [bg, fg] of tokens.nonTextPairs) {
    const ratio = contrastRatio(resolve(tokens, bg), resolve(tokens, fg));
    results.push({
      pair: `${fg} on ${bg} (non-text)`,
      ratio: Number(ratio.toFixed(2)),
      min: NON_TEXT_MIN,
      pass: ratio >= NON_TEXT_MIN,
    });
  }

  const pass = results.every(r => r.pass);
  return { gate: 'contrast', pass, results };
}

if (require.main === module) {
  const { pass, results } = run();
  for (const r of results) {
    const mark = r.pass ? '✓' : '✗';
    console.log(`${mark} ${r.pair.padEnd(28)} ${r.ratio.toFixed(2)}:1  (min ${r.min}:1)`);
  }
  console.log(pass ? '\nPASS' : '\nFAIL');
  process.exit(pass ? 0 : 1);
}

module.exports = { run };
