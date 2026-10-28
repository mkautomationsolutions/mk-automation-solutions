# Website interaction upgrade — 28 October 2026

## Result

- Replaces the decorative homepage platform with a six-face CSS 3D workspace sculpture, orbital planes, satellite cubes and light particles. Visitors can rotate it by dragging or using arrow keys, zoom and reset. The scene is an illustration, not an actual application interface or product model.
- Adds a cinematic product collection dialog using the existing artwork, accurate product summaries, four chapters, next/previous navigation and a handoff back to the selected workflow.
- Adds a page motion preference, persisted locally, honoring the operating-system reduced-motion setting; page reading progress; and subtle pointer-driven depth on product artwork.
- Reuses the existing 193 KB artwork. No runtime package or third-party generation service is required. No credentials or provider calls were added.

## Verification performed in Chrome

- JavaScript syntax checks: 3d-core.js, experience.js, cinema-gallery.js, product-studio.js.
- Static HTML: unique IDs, all internal anchors present, referenced local CSS/scripts exist, native Netlify form name/method/detection attributes retained.
- Desktop: scene renders, drag changes rotation while automatic motion is paused; arrow/zoom controls change the view; reset is available. Saved motion-off preference survives reload.
- Cinematic view: all four chapter titles change with the arrow keys; product buttons switch the displayed summary; Shift+Tab wraps from Close to Next, Tab wraps back; Escape closes the dialog and restores focus to its launch button.
- Responsive checks: separate 390 × 844 and 768 × 844 iframe viewports (with native scrollbar gutters), no horizontal document overflow. Phone menu opens and closes after selecting a link. Cinematic dialog fits vertically with internal scrolling and a sticky close toolbar.
- Phone workflow: cinematic Service Follow-up selection hands off to the main product; Book a tailored demo pre-fills service-followup and its matching message.
- Screenshots inspected for the homepage, desktop cinematic view and phone dialog.

## Boundaries

These are browser viewport checks, not tests on physical iOS/Android devices or an exhaustive browser/accessibility audit. Reduced-motion and unsupported-3D branches have source-level checks; operating-system preference changes were not emulated. No FPS, battery, server-load or endurance certification is implied. Code pauses the 3D render loop when the viewer is off screen or the document is hidden.

Public contact intake remains Netlify Forms. No new form notification was sent in this change. Live CRM database reconnection, email inbox receipt and WhatsApp notification setup are separate outstanding work and are not certified by these visual checks.
