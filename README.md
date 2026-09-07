# ASC3ND Progress Book

Interactive client-delivery book for ASC3ND Collective.

## Experience

- Two-page desktop spreads and portrait mobile reading
- Drag, swipe, keyboard, and visible navigation
- Page-turn sound only after reader opt-in
- Reduced-motion support
- Print stylesheet
- Downloadable staff-portal access card without stored credentials

## Local development

```bash
npm run dev
```

## Production build

```bash
npm run build
```

## Vercel deployment

The Vercel project builds the verified Sites-compatible source and publishes
the generated browser bundle from `vercel-static/`.

```bash
npm run build:vercel
```

Vercel project: `prj_LxyjUfKJ8zv2uQGfSY0BIRedXWuR`

The deployment entry is `vercel-static/index.html`. The committed static output
is the immutable browser artifact recovered from the accepted book. Every
Vercel build compiles the source, validates the entry, checks required identity
markers, and confirms that every local asset referenced by the entry exists.

The current `vinext` adapter emits the production Cloudflare Worker but does not
emit a standalone `index.html`. Do not delete or silently regenerate
`vercel-static/`; replace it only after a newly rendered book has passed the
same responsive and interaction checks as the accepted version.

## Content editing

The client manuscript and page layouts currently live in `app/page.tsx`.
Global book materials, page dimensions, typography, leather, paper, and print
rules live in `app/globals.css`.

Project imagery lives under `public/assets/`. Replace an image only with an
approved artifact using the same filename, or update the corresponding source
reference and alt text together.

## Evidence and status

`public/evidence-ledger.json` records the difference between verified evidence,
live validation still required, client decisions, and recommended future work.
Do not promote a claim to verified without evidence.

## Staff access

`public/downloads/asc3nd-staff-portal-card.html` is intentionally safe to share:
it contains routes and account identity but no password. Never commit passwords,
service-role keys, recovery codes, or private database credentials.

## Navigation and sound

The book uses `react-pageflip`. Reader sound is synthesized in the browser and
is disabled until the reader opts in. The contents drawer uses direct page
navigation; arrow buttons and keyboard arrows remain accessible fallbacks.

## Rollback

Every Sites checkpoint is immutable. If a later version introduces a problem,
restore the last verified checkpoint rather than editing production in place.
