// GATE: token-only
// Fails a component's CSS if it uses a raw hex/rgb color or a bare px value
// instead of referencing a design token via var(--...).
// This is the gate that's meant to fail on stage — see fixtures/button-bad.css.

const fs = require('fs');

const HEX_RE = /#[0-9a-fA-F]{3,8}\b/g;
const RGB_RE = /\brgb[a]?\(\s*\d/g;
// bare px NOT immediately preceded by "var(--...)" content — a rough but effective check:
// flag any px value that isn't part of a var() call on the same declaration.
const PX_DECL_RE = /([a-zA-Z-]+)\s*:\s*([^;]+);/g;

function findOffenders(css) {
  const offenders = [];
  const lines = css.split('\n');

  lines.forEach((line, i) => {
    const hexMatches = line.match(HEX_RE);
    if (hexMatches) {
      offenders.push({ line: i + 1, text: line.trim(), reason: `raw hex color: ${hexMatches.join(', ')}` });
    }
    const rgbMatches = line.match(RGB_RE);
    if (rgbMatches) {
      offenders.push({ line: i + 1, text: line.trim(), reason: `raw rgb() color` });
    }
  });

  // bare px: any declaration containing "px" that does NOT also contain "var(--"
  let m;
  PX_DECL_RE.lastIndex = 0;
  while ((m = PX_DECL_RE.exec(css))) {
    const [full, prop, value] = m;
    if (/px/.test(value) && !/var\(--/.test(value)) {
      const upTo = css.slice(0, m.index);
      const lineNum = upTo.split('\n').length;
      offenders.push({ line: lineNum, text: full.trim(), reason: `bare px, not a token: "${prop}: ${value.trim()}"` });
    }
  }

  return offenders;
}

function run(cssPath) {
  const css = fs.readFileSync(cssPath, 'utf8');
  const offenders = findOffenders(css);
  return { gate: 'token-only', pass: offenders.length === 0, offenders, file: cssPath };
}

if (require.main === module) {
  const target = process.argv[2];
  if (!target) {
    console.error('usage: node gates/token-only.js <path-to-css>');
    process.exit(2);
  }
  const { pass, offenders } = run(target);
  if (pass) {
    console.log(`✓ token-only: no raw hex/rgb/px found`);
  } else {
    console.log(`✗ token-only: ${offenders.length} offender(s)`);
    for (const o of offenders) console.log(`  line ${o.line}: ${o.reason}\n    ${o.text}`);
  }
  process.exit(pass ? 0 : 1);
}

module.exports = { run, findOffenders };
