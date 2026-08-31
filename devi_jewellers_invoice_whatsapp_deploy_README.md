# Deploy Devi Jewellers Invoice App on Vercel

This is a static HTML app that can be deployed on Vercel.

## What was updated
- Replaced hard-coded `/mnt/user-data/uploads/icon.png` image references with an embedded SVG icon.
- The HTML file is now deployable as a static site.

## How to deploy
1. Open `C:\Users\Gusts\Downloads\devi_jewellers_invoice_whatsapp.html` in a browser or editor.
2. Save it as `index.html` in a new folder, e.g. `devi_jewellers_invoice_whatsapp_vercel`.
3. In Vercel, choose "Import Project" and select that folder.
4. Or use the Vercel CLI:
   - `npm install -g vercel`
   - `cd <path-to-folder>`
   - `vercel`
5. Follow the prompts.

## Notes
- This is a static site, so no build step is required.
- The app uses `jspdf` from CDN and does not depend on server-side code.
- If you want a custom icon, replace the embedded SVG data URL image source with your own `icon.png` file and update the `src` path accordingly.
