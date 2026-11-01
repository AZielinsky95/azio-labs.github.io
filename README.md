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

Assets are self-contained in `public/portfolio/`. Videos use native controls and `preload="none"`, with no autoplay. Bento uses the user-selected `Projects/Unity/BentoMarketing/BentoMarketing/OctoberAds/Polished Demo Music v6.1.mp4`, with fast-start metadata for web playback. Poly Vita uses a web-optimized H.264/AAC export of `Documents/Stuff/PolyVitaTrailerShort.mp4`. Sticker Llama uses `designmocks/launch-trailer-v2/sticker-llama-launch-v2.mp4` (Oct 29, 2026). Poster frames are extracted from those videos.

The coral logo preserves the original SVG geometry and replaces the teal accent with `#FA806F`. The original logo file is unchanged.

## Mobile delivery

Page images use responsive WebP variants from `scripts/image-assets.json`; original source assets are retained. To regenerate after changing an image, run `python3 scripts/optimize-images.py` with Pillow installed, then run the normal build. The production build itself needs no image library.

Fonts are served locally from `public/fonts/`, including their SIL Open Font Licenses. The animated Voronoi field uses a smaller grid and a 12 fps limit on narrow or touch viewports, while retaining the desktop settings. The keyboard skip link is clipped until focused instead of being translated above Safari’s visible viewport.

## Link previews

All portfolio routes use the static AZ / IO wordmark over the actual Voronoi field in `public/portfolio/azio-voronoi-share-v1.png` (1200×630), with Open Graph and large-image card metadata. The image has its own URL rather than reusing the old avatar URL. To regenerate the artwork on macOS with Node.js and Pillow installed, run `python3 scripts/generate-share-preview.py`; the normal site build uses the committed PNG.

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

The GainIQ contract is shown as “Nov 2025–Nov 2026” as supplied by Alejandro. Sticker Llama is marked “Coming soon” in line with its public website.

## Asset provenance

- Portrait: a pencil sketch derived from Alejandro’s supplied smiling portrait, with a shared circle mask on Overview and About Me.
- Bento imagery: `Projects/bento-app.github.io/public/images/` and app icon from that site.
- Sticker Llama icon/collage: `Projects/StickerLLamaSite/public/assets/`.
- Letterbox imagery: three selected iPhone screenshots from the official App Store listing; the full set was retrieved November 1, 2026. Source URLs are recorded in `scripts/letterbox-app-store-sources.json`.
- Poly Vita promotional art: `Projects/react-portfolio/public/images/library_capsule.png`; gameplay images from supplied portfolio PDF page 8.
- Professional product imagery/icons: extracted from supplied portfolio PDF pages 4–6.

Do not replace contribution copy with claims inferred from product marketing. Do not add unverified traction or outcome metrics.
