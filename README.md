# Alejandro Zielinsky portfolio

A buildless, statically rendered portfolio with real HTML routes, a responsive sidebar, an overview-only profile card, and dedicated professional and independent project pages.

## Edit and preview

- Edit page content in `scripts/build.mjs`.
- Edit styling in `css/portfolio.css` and navigation behavior in `js/portfolio.js`.
- Run `npm run build` to regenerate route HTML.
- Run `npm run preview` and open the printed local URL.
- Run `npm run verify` for local route, image, stylesheet, and profile-card placement checks.

The site remains compatible with the repository’s static GitHub Pages deployment. Existing Plaid redirects, CNAME, and unrelated files are preserved. No deployment occurs as part of the build.

## Media

Assets are self-contained in `public/portfolio/`. Videos use native controls and `preload="none"`, with no autoplay. Bento is a web-optimized H.264/AAC export of the user-confirmed `Downloads/Ad Ready Bento.mov`. Sticker Llama uses `designmocks/launch-trailer-v2/sticker-llama-launch-v2.mp4` (Oct 29, 2026). Poster frames are extracted from those videos.

The coral logo preserves the original SVG geometry and replaces the teal accent with `#FA806F`. The original logo file is unchanged.

## Content sources

Professional contributions are based on Alejandro’s supplied resume and portfolio PDFs. Product descriptions are independently sourced from official listings and websites. Historical responsibilities are kept separate from current capabilities.

- Spirea: https://iq.thisisgain.com/spirea
- GLO: https://apps.apple.com/us/app/glo-augmented-reality-graffiti/id6749247722
- GuideAlong: https://apps.apple.com/us/app/guidealong-gps-audio-tours/id1460032075
- Ora Organic: https://apps.apple.com/us/app/ora/id1533718404
- Ridwell: https://apps.apple.com/us/app/ridwell/id1623854075
- Zipline: https://apps.apple.com/us/app/zipline-inc/id1221555019
- RBC Mobile: https://apps.apple.com/us/app/rbc-mobile/id407597290
- Optimity: https://apps.apple.com/us/app/optimity-health-rewards/id975041781
- Teleport (historical): https://www.linkedin.com/company/teleportxyz
- Letterbox: https://letterboxgames.com/ and https://apps.apple.com/ca/app/letterbox-daily-word-games/id6452469243
- Poly Vita: https://store.steampowered.com/app/1831410/Poly_Vita/

The GainIQ contract is shown as “Nov 2025–present” because the supplied November 2026 end date is in the future at this revision (October 30, 2026). Update when the engagement ends. Sticker Llama is marked “Coming soon” in line with its public website.

## Asset provenance

- Portrait: `Projects/portfolio-site/images/az.jpeg`.
- Bento imagery: `Projects/bento-app.github.io/public/images/` and app icon from that site.
- Sticker Llama icon/collage: `Projects/StickerLLamaSite/public/assets/`.
- Letterbox imagery: `Projects/iOS/LetterBox/screenshots/final/`.
- Poly Vita promotional art: `Projects/react-portfolio/public/images/library_capsule.png`; gameplay images from supplied portfolio PDF page 8.
- Professional product imagery/icons: extracted from supplied portfolio PDF pages 4–6.

Do not replace contribution copy with claims inferred from product marketing. Do not add unverified traction or outcome metrics.
