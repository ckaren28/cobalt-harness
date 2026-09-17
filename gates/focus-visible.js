// GATE: focus-visible
// Fails if there's no :focus-visible rule, or if that rule doesn't actually
// draw something visible (an outline or a box-shadow ring) — an empty or
// `outline: none` rule doesn't count.

const fs = require('fs');

function run(cssPath) {
  const css = fs.readFileSync(cssPath, 'utf8');

  const ruleMatch = css.match(/:focus-visible\s*\{([^}]*)\}/);
  if (!ruleMatch) {
    return { gate: 'focus-visible', pass: false, reason: 'no :focus-visible rule found at all', file: cssPath };
  }

  const body = ruleMatch[1];
  const killsOutline = /outline\s*:\s*none/.test(body) || /outline\s*:\s*0\b/.test(body);
  const drawsOutline = /outline\s*:\s*(?!none|0\b)/.test(body);
  const drawsShadowRing = /box-shadow\s*:\s*[^;]*var\(--color-focus\)/.test(body);

  if (killsOutline && !drawsShadowRing) {
    return { gate: 'focus-visible', pass: false, reason: 'outline suppressed and no box-shadow ring using --color-focus to replace it', file: cssPath };
  }
  if (!drawsOutline && !drawsShadowRing) {
    return { gate: 'focus-visible', pass: false, reason: ':focus-visible rule exists but draws nothing visible', file: cssPath };
  }

  return { gate: 'focus-visible', pass: true, reason: 'visible focus treatment present', file: cssPath };
}

if (require.main === module) {
  const target = process.argv[2];
  if (!target) {
    console.error('usage: node gates/focus-visible.js <path-to-css>');
    process.exit(2);
  }
  const { pass, reason } = run(target);
  console.log(`${pass ? '✓' : '✗'} focus-visible: ${reason}`);
  process.exit(pass ? 0 : 1);
}

module.exports = { run };
