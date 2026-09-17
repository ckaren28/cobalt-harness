# Button

## Status
**In progress** — Sept 17, 2026. Figma component built (9 variants: primary/secondary/ghost × sm/md × 6 states). React implementation not started.

Legend: `[ ]` not started · `[~]` in progress / pending · `[x]` complete · `[!]` blocked

## Purpose
Primary interactive trigger. Used standalone and inside the table row (as the ghost/sm row action).

## API
| Prop | Type | Default |
|---|---|---|
| variant | `'primary' \| 'secondary' \| 'ghost'` | `'primary'` |
| size | `'sm' \| 'md'` | `'md'` |
| disabled | `boolean` | `false` |
| loading | `boolean` | `false` |

## Tokens this component may reference
`--color-accent`, `--color-accent-text`, `--color-surface`, `--color-surface-raised`,
`--color-text`, `--color-border`, `--color-focus`, `--space-2`, `--space-4`, `--radius-pill`

## Acceptance criteria
- [ ] All color values reference tokens; no raw hex or rgb — gate: token-only
- [ ] All spacing references the space scale; no bare px — gate: token-only
- [ ] Every required state has a rule: default, hover, focus, active, disabled, loading — gate: states-present
- [ ] Visible focus ring using `--color-focus`, not the browser default outline — gate: focus-visible
- [ ] Token contrast pairs meet WCAG AA — gate: contrast
- [ ] Props match the API table exactly — gate: props-match
- [ ] Renders in isolation with no console errors — gate: renders-clean

## Exit criteria
All three variants and every listed state render from tokens only, the focus ring is visibly
distinct from every other state, and the component can be dropped into the table row without
a design review catching a drift from the Figma spec.

## Notes (ungated — judgment calls, not mechanical checks)
- Ghost variant needs a hover treatment that doesn't rely on color alone (border or shadow), since it has no fill to darken.
- Loading spinner color should be `--color-accent-text` so it reads on any variant.
