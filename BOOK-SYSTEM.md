# ASC3ND Book System — Locked Shell

This project is a reusable interactive-book product, not a one-off presentation.

## Locked

- 13:18 physical page proportion
- Leather cover treatment and paper system
- Page-turn mechanics, arrows, swipe, keyboard navigation, and optional sound
- Black, warm-paper, gold, and teal presentation palette
- Official brand spelling: `ASC3ND`—never `ASCEND` or `Ascend`
- One-page portrait behavior on phones and book-spread behavior where space allows
- Accessibility labels, reduced-motion support, and print behavior

Changes to the locked shell require an explicit design-system decision and a new verified checkpoint.

## Editable

- Page copy and headings
- Page order and table-of-contents labels
- Images, campaign artifacts, QR codes, and links
- Status labels and calls to action
- Client logo assets and brand tokens when creating a new branded edition

## Mobile acceptance rule

Every page must fit inside a single portrait page without horizontal scrolling, clipped text, or type below the page-specific minimums in `app/globals.css`. Dense grids must recompose for the page rather than shrinking indefinitely.

## Reuse workflow

1. Duplicate the latest verified checkpoint.
2. Replace editable content and assets only.
3. Check every physical page at phone portrait, tablet portrait, desktop spread, and short landscape sizes.
4. Verify arrows, swipe, keyboard navigation, sound preference, links, and print output.
5. Save an immutable checkpoint before client review.
