# App Icons

Add the following icon files to this directory for PWA and app store support:

## Required Icons

| Filename | Size | Purpose |
|----------|------|---------|
| `icon-32.png` | 32x32 | Browser favicon |
| `icon-192.png` | 192x192 | Android home screen |
| `icon-192-maskable.png` | 192x192 | Android adaptive icon (with safe zone padding) |
| `icon-512.png` | 512x512 | Android splash screen, PWA install |
| `icon-512-maskable.png` | 512x512 | Android adaptive icon large |
| `apple-touch-icon.png` | 180x180 | iOS home screen |

## Also Needed in `/public/`

| Filename | Size | Purpose |
|----------|------|---------|
| `favicon.ico` | 16x16, 32x32 | Browser tab icon |
| `og-image.png` | 1200x630 | Social media sharing preview |

## Maskable Icons

Maskable icons should have extra padding (safe zone) around the main logo.
The safe zone is a circle with radius 40% of the icon size.
See: https://web.dev/maskable-icon/

## Recommended Design

- Use the emerald color (#059669) as primary brand color
- Simple garden/plant icon that works at small sizes
- White or light background for maskable icons

## Screenshots (in `/public/screenshots/`)

For enhanced PWA install experience:
- `garden-view.png` - 1280x720 - Screenshot of garden layout
- `schedule.png` - 1280x720 - Screenshot of planting schedule
