#!/usr/bin/env node
// THE LOOP.
//
// Reads a PRD's checklist, runs each criterion's gate against a target
// component file, and updates the checklist in place:
//   [ ] -> [x]  the gate passed
//   [ ] -> [!]  the gate failed and nothing safe could be done about it automatically
//   [ ] -> [~]  the gate isn't wired up yet (props-match / renders-clean, pending real component code)
//
// The ONE thing this loop will fix by itself: a hardcoded color that exactly
// matches an existing design token's value. That's not a judgment call — the
// correct token reference is unambiguous, so it's safe to apply without a
// human or a model in the loop. Anything else (a missing focus rule, a
// missing state) requires a real decision about what to build, so it's
// flagged BLOCKED and handed back rather than guessed at.
//
// usage: node lib/loop.js <prd.md> <target.css> [comma,separated,states]

const fs = require('fs');
const path = require('path');

const tokenOnly = require('../gates/token-only');
const statesPresent = require('../gates/states-present');
const focusVisible = require('../gates/focus-visible');
const contrast = require('../gates/contrast');
const propsMatch = require('../gates/props-match');
const rendersClean = require('../gates/renders-clean');

const GATES = {
  'token-only': (cssPath) => tokenOnly.run(cssPath),
  'states-present': (cssPath, states) => statesPresent.run(cssPath, states),
  'focus-visible': (cssPath) => focusVisible.run(cssPath),
  'contrast': () => contrast.run(),
  'props-match': () => propsMatch.run(),
  'renders-clean': () => rendersClean.run(),
};

const CRITERION_RE = /^(\s*)- \[( |x|~|!)\] (.+?)(?: — gate: (\S+))?$/;

function parsePrd(prdText) {
  const lines = prdText.split('\n');
  return lines.map((line, i) => {
    const m = line.match(CRITERION_RE);
    if (!m) return { raw: line, isCriterion: false };
    const [, indent, mark, text, gate] = m;
    return { raw: line, isCriterion: true, indent, mark, text, gate, lineIndex: i };
  });
}

// The one deterministic auto-fix: a raw hex in the CSS that exactly matches
// a known token's value gets swapped for the var() reference.
function attemptTokenFix(cssPath, offenders) {
  const tokens = require('../tokens/tokens.json');
  let css = fs.readFileSync(cssPath, 'utf8');
  const fixed = [];
  const unfixable = [];

  for (const o of offenders) {
    const hexMatch = o.reason.match(/#[0-9a-fA-F]{3,8}/);
    if (!hexMatch) { unfixable.push(o); continue; }
    const hex = hexMatch[0].toUpperCase();

    let matchedVarName = null;
    for (const [semName, paletteKey] of Object.entries(tokens.color)) {
      const paletteHex = tokens.palette[paletteKey];
      if (paletteHex && paletteHex.toUpperCase() === hex) {
        matchedVarName = `--color-${semName}`;
        break;
      }
    }
    if (!matchedVarName) {
      for (const [paletteName, paletteHex] of Object.entries(tokens.palette)) {
        if (paletteHex.toUpperCase() === hex) { matchedVarName = `--palette-${paletteName}`; break; }
      }
    }

    if (!matchedVarName) { unfixable.push(o); continue; }

    const re = new RegExp(hex.replace('#', '#'), 'gi');
    if (re.test(css)) {
      css = css.replace(re, `var(${matchedVarName})`);
      fixed.push({ ...o, fixedTo: matchedVarName });
    } else {
      unfixable.push(o);
    }
  }

  if (fixed.length > 0) fs.writeFileSync(cssPath, css);
  return { fixed, unfixable };
}

function setMark(entries, lineIndex, mark, suffix) {
  const e = entries[lineIndex];
  let newLine = e.raw.replace(/\[( |x|~|!)\]/, `[${mark}]`);
  newLine = newLine.replace(/\s+\(loop:.*\)$/, ''); // strip any previous loop annotation
  if (suffix) newLine += ` (loop: ${suffix})`;
  entries[lineIndex].raw = newLine;
}

function run(prdPath, cssPath, states) {
  const prdText = fs.readFileSync(prdPath, 'utf8');
  const entries = parsePrd(prdText);

  const report = [];

  for (const e of entries) {
    if (!e.isCriterion || !e.gate) continue;
    if (e.mark === 'x') { report.push({ text: e.text, gate: e.gate, status: 'already complete' }); continue; }

    const gateFn = GATES[e.gate];
    if (!gateFn) {
      setMark(entries, e.lineIndex, '!', `unknown gate "${e.gate}"`);
      report.push({ text: e.text, gate: e.gate, status: 'BLOCKED', reason: 'unknown gate' });
      continue;
    }

    let result = gateFn(cssPath, states);

    if (result.pass === null) {
      setMark(entries, e.lineIndex, '~', 'gate not yet implemented');
      report.push({ text: e.text, gate: e.gate, status: 'PENDING', reason: result.reason });
      continue;
    }

    if (result.pass === true) {
      setMark(entries, e.lineIndex, 'x', null);
      report.push({ text: e.text, gate: e.gate, status: 'PASS' });
      continue;
    }

    // failed -- try the one deterministic auto-fix for token-only, nothing else
    if (e.gate === 'token-only' && result.offenders && result.offenders.length) {
      const { fixed, unfixable } = attemptTokenFix(cssPath, result.offenders);
      if (fixed.length && unfixable.length === 0) {
        const retry = gateFn(cssPath, states);
        if (retry.pass === true) {
          setMark(entries, e.lineIndex, 'x', `auto-fixed: ${fixed.map(f => f.fixedTo).join(', ')}`);
          report.push({ text: e.text, gate: e.gate, status: 'AUTO-FIXED', detail: fixed });
          continue;
        }
      }
    }

    const reason = (result.offenders || result.missing || [{ reason: result.reason }])
      .map(x => x.reason || x.state).join('; ');
    setMark(entries, e.lineIndex, '!', reason);
    report.push({ text: e.text, gate: e.gate, status: 'BLOCKED', reason });
  }

  const newPrdText = entries.map(e => e.raw).join('\n');
  fs.writeFileSync(prdPath, newPrdText);

  return report;
}

if (require.main === module) {
  const [prdPath, cssPath, statesArg] = process.argv.slice(2);
  if (!prdPath || !cssPath) {
    console.error('usage: node lib/loop.js <prd.md> <target.css> [comma,separated,states]');
    process.exit(2);
  }
  const states = (statesArg || 'default,hover,focus,active,disabled,loading').split(',').map(s => s.trim());

  console.log(`\nRunning the loop against ${path.basename(cssPath)} using ${path.basename(prdPath)}\n${'─'.repeat(60)}`);
  const report = run(prdPath, cssPath, states);
  for (const r of report) {
    const icon = { PASS: '✓', 'AUTO-FIXED': '⟳', BLOCKED: '✗', PENDING: '…', 'already complete': '✓' }[r.status] || '?';
    console.log(`${icon} [${r.status.padEnd(16)}] ${r.text}`);
    if (r.reason) console.log(`    ${r.reason}`);
    if (r.detail) for (const d of r.detail) console.log(`    ${d.reason} -> ${d.fixedTo}`);
  }
  console.log('─'.repeat(60));
  const blocked = report.filter(r => r.status === 'BLOCKED').length;
  console.log(blocked === 0 ? 'Loop finished, nothing blocked.\n' : `Loop finished, ${blocked} item(s) blocked — see reasons above.\n`);
}

module.exports = { run, parsePrd, attemptTokenFix };
