// GATE: props-match  [STUB — wire up once a real component + PRD exist]
// Will compare a component's declared prop types against the PRD's API table
// (see prds/button.md) and fail on any missing prop, extra undocumented prop,
// or a value union that doesn't match the Figma variant axes.
//
// Deliberately not faked with a fixture: this gate reads actual TypeScript/PropTypes,
// which don't exist until Button is built in code. Implement once Button.tsx lands.

function run() {
  return {
    gate: 'props-match',
    pass: null,
    reason: 'not yet implemented — needs a real component file to introspect. See prds/button.md for the target API.',
  };
}

module.exports = { run };
