// GATE: states-present
// Given a CSS file and the list of required states from the component's PRD,
// checks a selector exists for each one. Doesn't judge whether the state
// LOOKS right — only that the developer didn't forget it exists.

const fs = require('fs');

// Maps a state name (as written in a PRD) to the selector pattern(s) that would satisfy it.
// Accepts either a real pseudo-class or a data-attribute pattern, since some states
// (disabled, loading, error, selected) aren't native CSS pseudo-classes.
const STATE_PATTERNS = {
  default: [/\.component\s*\{/, /:root/], // base rule always counts
  hover: [/:hover/],
  focus: [/:focus-visible/, /:focus\b/],
  active: [/:active/],
  disabled: [/:disabled/, /\[disabled\]/, /\[data-state=["']?disabled/],
  loading: [/\[data-state=["']?loading/, /\.is-loading/],
  filled: [/\[data-state=["']?filled/, /:not\(:placeholder-shown\)/],
  error: [/\[data-state=["']?error/, /\.is-error/, /:invalid/],
  selected: [/\[data-state=["']?selected/, /\.is-selected/, /\[aria-selected=["']?true/],
};

function run(cssPath, requiredStates) {
  const css = fs.readFileSync(cssPath, 'utf8');
  const missing = [];

  for (const state of requiredStates) {
    const patterns = STATE_PATTERNS[state];
    if (!patterns) {
      missing.push({ state, reason: `no known selector pattern registered for state "${state}" — add one to STATE_PATTERNS` });
      continue;
    }
    const found = patterns.some(re => re.test(css));
    if (!found) {
      missing.push({ state, reason: `no rule found matching any of: ${patterns.map(String).join(', ')}` });
    }
  }

  return { gate: 'states-present', pass: missing.length === 0, missing, file: cssPath, requiredStates };
}

if (require.main === module) {
  const [cssPath, statesArg] = process.argv.slice(2);
  if (!cssPath || !statesArg) {
    console.error('usage: node gates/states-present.js <path-to-css> <comma,separated,states>');
    process.exit(2);
  }
  const required = statesArg.split(',').map(s => s.trim());
  const { pass, missing } = run(cssPath, required);
  if (pass) {
    console.log(`✓ states-present: all ${required.length} required states found`);
  } else {
    console.log(`✗ states-present: ${missing.length} missing`);
    for (const m of missing) console.log(`  "${m.state}": ${m.reason}`);
  }
  process.exit(pass ? 0 : 1);
}

module.exports = { run };
