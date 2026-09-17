#!/bin/bash
# Resets the demo working files back to a pristine broken state.
# Run this before every rehearsal (and right before the real thing on Sept 23) --
# the loop mutates demo/button.css and demo/button-prd.md in place, so a
# rerun without resetting won't show the fix/catch moment again.
set -e
cd "$(dirname "$0")/.."
cp fixtures/button-bad.css demo/button.css
cp prds/button.md demo/button-prd.md
# force the checklist back to all-unchecked so the loop has real work to do
sed -i.bak 's/- \[[x~!]\]/- [ ]/g; s/ (loop:.*)$//' demo/button-prd.md && rm -f demo/button-prd.md.bak
echo "Reset: demo/button.css <- fixtures/button-bad.css, demo/button-prd.md <- prds/button.md (all criteria unchecked)"
