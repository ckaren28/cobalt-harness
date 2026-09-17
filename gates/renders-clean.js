// GATE: renders-clean  [STUB — wire up once a real component + vitest exist]
// Will mount every variant/state combination in a test renderer (Vitest +
// @testing-library/react) and fail on any thrown error or console warning.
//
// Deliberately not faked: needs an actual React component to mount.
// Implement once Button.tsx lands (Day: Sun Sept 20 in harness-spec.md).

function run() {
  return {
    gate: 'renders-clean',
    pass: null,
    reason: 'not yet implemented — needs a real React component to mount in a test renderer.',
  };
}

module.exports = { run };
