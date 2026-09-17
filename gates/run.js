#!/usr/bin/env node
// Gate runner — this is the script projected live on Sept 23.
// Runs the CSS-checkable gates against a component's stylesheet and prints
// a pass/fail table, exactly like the loop would see it before deciding
// whether to check a PRD box.
//
// usage: node gates/run.js <css-file> <comma,separated,required,states>
// example: node gates/run.js fixtures/button-good.css default,hover,focus,active,disabled,loading

const path = require('path');
const tokenOnly = require('./token-only');
const statesPresent = require('./states-present');
const focusVisible = require('./focus-visible');
const contrast = require('./contrast');
const propsMatch = require('./props-match');
const rendersClean = require('./renders-clean');

function main() {
  const [cssPath, statesArg] = process.argv.slice(2);
  if (!cssPath) {
    console.error('usage: node gates/run.js <css-file> [comma,separated,states]');
    process.exit(2);
  }
  const requiredStates = (statesArg || 'default,hover,focus,active,disabled').split(',').map(s => s.trim());

  const results = [];
  results.push(tokenOnly.run(cssPath));
  results.push(statesPresent.run(cssPath, requiredStates));
  results.push(focusVisible.run(cssPath));
  results.push(contrast.run()); // checks the token file itself, not this component's css
  results.push(propsMatch.run());
  results.push(rendersClean.run());

  console.log(`\nGates for ${path.basename(cssPath)}\n${'─'.repeat(50)}`);
  for (const r of results) {
    const mark = r.pass === true ? '✓ PASS' : r.pass === false ? '✗ FAIL' : '… PENDING';
    console.log(`${mark.padEnd(10)} ${r.gate}`);
    if (r.pass === false) {
      const detail = r.offenders || r.missing || (r.reason ? [{ reason: r.reason }] : []);
      for (const d of detail) console.log(`           ${d.reason || d.state}`);
    }
  }

  const hardFails = results.filter(r => r.pass === false);
  console.log('─'.repeat(50));
  console.log(hardFails.length === 0 ? 'RESULT: all checkable gates pass\n' : `RESULT: ${hardFails.length} gate(s) failing\n`);
  process.exit(hardFails.length === 0 ? 0 : 1);
}

main();
