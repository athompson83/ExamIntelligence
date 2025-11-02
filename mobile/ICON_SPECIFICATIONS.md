# ProficiencyAI Mobile App Icon Specifications

Complete guide for creating and preparing app icons for iOS and Android submission.

---

## Table of Contents

1. [Quick Reference](#quick-reference)
2. [iOS Icon Requirements](#ios-icon-requirements)
3. [Android Icon Requirements](#android-icon-requirements)
4. [Design Guidelines](#design-guidelines)
5. [Expo Automatic Icon Generation](#expo-automatic-icon-generation)
6. [Android Adaptive Icons](#android-adaptive-icons)
7. [Tools & Resources](#tools--resources)
8. [Icon Checklist](#icon-checklist)

---

## Quick Reference

### Master Source Icon

Create **ONE** master icon that Expo will use to generate all sizes:

- **Size**: 1024×1024 pixels
- **Format**: PNG (with transparency) or SVG
- **Color Mode**: RGB
- **File**: `mobile/assets/icon.png` or `mobile/assets/icon.svg`

### Android Adaptive Icon (Foreground)

For Android's adaptive icon system:

- **Size**: 1024×1024 pixels
- **Format**: PNG (with transparency) or SVG
- **Safe Zone**: Content within 864×864 center
- **File**: `mobile/assets/adaptive-icon.png` or `mobile/assets/adaptive-icon.svg`

### App Store Icon (iOS)

For App Store Connect listing:

- **Size**: 1024×1024 pixels
- **Format**: PNG (NO transparency)
- **Corners**: Square (no rounded corners)
- **File**: Upload separately to App Store Connect

---

## iOS Icon Requirements

### Required Sizes for iOS

Expo automatically generates these from your 1024×1024 source:

| Device/Context | Size (pt) | Size (px) | Scale | Notes |
|----------------|-----------|-----------|-------|-------|
| **iPhone** |
| App Icon (Home) | 60×60 | 180×180 | @3x | iPhone 6s+ |
| App Icon (Home) | 60×60 | 120×120 | @2x | Older iPhones |
| Settings | 29×29 | 87×87 | @3x | Settings app |
| Settings | 29×29 | 58×58 | @2x | Settings app |
| Spotlight | 40×40 | 120×120 | @3x | Search results |
| Spotlight | 40×40 | 80×80 | @2x | Search results |
| Notification | 20×20 | 60×60 | @3x | Notification badge |
| Notification | 20×20 | 40×40 | @2x | Notification badge |
| **iPad** |
| App Icon | 76×76 | 152×152 | @2x | iPad home |
| App Icon | 76×76 | 76×76 | @1x | iPad home (older) |
| App Icon Pro | 83.5×83.5 | 167×167 | @2x | iPad Pro |
| Spotlight | 40×40 | 80×80 | @2x | iPad search |
| Spotlight | 40×40 | 40×40 | @1x | iPad search |
| Settings | 29×29 | 58×58 | @2x | iPad settings |
| Settings | 29×29 | 29×29 | @1x | iPad settings |
| Notification | 20×20 | 40×40 | @2x | iPad notification |
| Notification | 20×20 | 20×20 | @1x | iPad notification |
| **App Store** |
| App Store Icon | 1024×1024 | 1024×1024 | @1x | Required upload |

### iOS Design Requirements

**Mandatory**:
- ✅ 1024×1024 pixels
- ✅ PNG format
- ✅ RGB color mode (not CMYK)
- ✅ Square corners (no pre-rounded corners)
- ✅ 72 DPI or higher
- ✅ Flat design (no alpha/transparency)

**Prohibited**:
- ❌ Transparency/alpha channel
- ❌ Rounded corners (iOS applies automatically)
- ❌ Photographs of physical objects
- ❌ Apple hardware in icon
- ❌ Text that's too small to read
- ❌ App name text (shown separately)

### iOS Safe Zone

iOS applies rounded corners automatically. Keep important content within safe zone:

```
┌─────────────────────────────┐
│ ■                         ■ │  Corners will be rounded
│                             │
│    ┌───────────────────┐    │
│    │                   │    │  Safe zone: 854×854
│    │   Your Content    │    │  (center area)
│    │                   │    │
│    └───────────────────┘    │
│                             │
│ ■                         ■ │
└─────────────────────────────┘
```

**Safe Zone**: Keep critical elements (logo, text) within central **854×854 pixels** (83.4% of total area)

### App Store Connect Upload

When submitting to App Store Connect:

1. **Size**: Exactly 1024×1024 pixels
2. **Format**: PNG only (no JPEG)
3. **Transparency**: NOT allowed (flatten to solid color)
4. **Compression**: Use lossless compression
5. **Color Profile**: sRGB or Display P3
6. **Corners**: Square (do not round)

**Export Settings** (Photoshop):
- Save for Web: PNG-24
- Transparency: OFF
- Interlaced: OFF
- Convert to sRGB: ON

---

## Android Icon Requirements

### Required Sizes for Android

Expo automatically generates these from your 1024×1024 source:

| Density | Size (px) | Scale | Usage |
|---------|-----------|-------|-------|
| **MDPI** | 48×48 | 1x | Low-res devices (rare) |
| **HDPI** | 72×72 | 1.5x | Medium-res devices |
| **XHDPI** | 96×96 | 2x | High-res devices |
| **XXHDPI** | 144×144 | 3x | Very high-res devices |
| **XXXHDPI** | 192×192 | 4x | Ultra high-res devices |
| **Play Store** | 512×512 | - | Play Store listing |
| **Feature Graphic** | 1024×500 | - | Play Store banner |

### Play Store Requirements

**App Icon** (512×512):
- 32-bit PNG (with alpha channel)
- Transparency allowed
- Size: Exactly 512×512 pixels
- Max file size: 1MB
- Will be displayed with circular or rounded square mask

**Feature Graphic** (1024×500):
- 24-bit PNG or JPEG
- No transparency
- Size: Exactly 1024×500 pixels
- Max file size: 1MB
- Used in store listing, promotional materials

### Android Design Requirements

**Recommended**:
- ✅ Simple, recognizable design
- ✅ Transparency allowed (for adaptive icons)
- ✅ Vector graphics preferred (SVG)
- ✅ Test with different shape masks
- ✅ Contrasting background for adaptive icon

**Avoid**:
- ❌ Tiny details (won't be visible at small sizes)
- ❌ Relying on outer edges (may be masked)
- ❌ Text smaller than 20% of icon
- ❌ Low contrast designs

---

## Design Guidelines

### General Principles

1. **Simplicity**: Icons should be simple and recognizable
2. **Scalability**: Design should work at all sizes (20px to 1024px)
3. **Uniqueness**: Stand out from competitors
4. **Relevance**: Reflect your app's purpose
5. **Consistency**: Match your brand identity

### Color Guidelines

**For ProficiencyAI**:
- Primary Color: **#2563eb** (Blue 600)
- Gradient: Blue 600 to Blue 500 (#2563eb → #3b82f6)
- Accent: White or Light Blue for contrast
- Background: Blue gradient or white (depending on adaptive icon)

**Best Practices**:
- Use 2-3 colors maximum
- Ensure high contrast (accessible to colorblind users)
- Test in grayscale (should still be recognizable)
- Avoid neon or overly bright colors
- Use gradients sparingly

### Shape & Composition

**Recommended Shapes**:
- Centered logo/symbol
- Geometric shapes (circles, squares, triangles)
- Abstract representations of concept
- Single letter (stylized "P" for ProficiencyAI)

**Avoid**:
- Photographs (don't scale well)
- Realistic illustrations (too complex)
- Multiple objects (cluttered)
- Text-heavy designs (illegible at small sizes)

### Safe Zones by Platform

**iOS**: Keep content within **854×854** center (83.4%)
- iOS rounds corners to ~22.3% radius
- Outer edges will be clipped

**Android**: Keep content within **864×864** center (84.4%)
- Android masks can be circle, rounded square, or squircle
- Outer 8% on each side may be clipped

**Universal Safe Zone**: **864×864 pixels** works for both platforms

```
1024×1024 Icon Layout:
┌─────────────────────────────┐
│ 80px margin                 │
│   ┌─────────────────────┐   │
│   │                     │   │
│   │   Safe Zone         │   │ Content within
│   │   864×864           │   │ this area is
│   │                     │   │ always visible
│   │                     │   │
│   └─────────────────────┘   │
│                             │
└─────────────────────────────┘
```

### Accessibility

- **Contrast**: Minimum 3:1 ratio for icon colors
- **Simplicity**: Should be understandable without color
- **Testing**: View icon at 1-inch size (actual phone size)
- **Colorblindness**: Test with colorblind filters

### Brand Consistency

Match your icon to:
- Website design
- Marketing materials
- App UI theme
- Company logo

---

## Expo Automatic Icon Generation

### How It Works

Expo's build system automatically generates all required icon sizes from your master icon(s):

1. You provide: `assets/icon.png` (1024×1024)
2. Expo generates: All iOS and Android sizes
3. Result: Proper icons for all devices

### Configuration in app.json

```json
{
  "expo": {
    "icon": "./assets/icon.png",
    "ios": {
      "icon": "./assets/icon.png"  // Optional: iOS-specific
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#2563eb"
      }
    }
  }
}
```

### Master Icon Best Practices

**Format**:
- **PNG**: 1024×1024, 32-bit with alpha
- **SVG**: Vector format (scales perfectly)

**For PNG Icons**:
```bash
# Check icon specifications
file icon.png
# Should show: PNG image data, 1024 x 1024, 8-bit/color RGBA

# Optimize file size
pngcrush icon.png icon-optimized.png
# Or use ImageOptim (Mac), TinyPNG (online)
```

**For SVG Icons**:
```xml
<!-- Ensure viewBox is square -->
<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <!-- Your icon content -->
</svg>
```

### Current ProficiencyAI Setup

Based on `app.json`:
- Main icon: `./assets/icon.svg` ✅
- Adaptive icon: `./assets/adaptive-icon.svg` ✅
- Favicon: `./assets/favicon.svg` ✅
- Splash: `./assets/splash.svg` ✅

All using SVG for perfect scaling!

---

## Android Adaptive Icons

### What Are Adaptive Icons?

Introduced in Android 8.0 (API 26), adaptive icons consist of:

1. **Foreground**: Your icon/logo (with transparency)
2. **Background**: Solid color or simple pattern
3. **Mask**: Applied by device (circle, squircle, rounded square)

This allows:
- Consistent shapes across launchers
- Parallax animation effects
- Themed icons (Android 13+)

### Adaptive Icon Structure

```
Adaptive Icon = Foreground + Background + Mask

Foreground (1024×1024):
┌─────────────────────────────┐
│                             │
│    ┌───────────────────┐    │
│    │                   │    │
│    │   Logo (trans)    │    │  Safe: 864×864 center
│    │                   │    │  Full: 1024×1024
│    └───────────────────┘    │
│                             │
└─────────────────────────────┘

Background (#2563eb or pattern):
┌─────────────────────────────┐
│█████████████████████████████│
│█████████████████████████████│
│█████████████████████████████│
│█████████████████████████████│  Solid color or
│█████████████████████████████│  subtle gradient
│█████████████████████████████│
│█████████████████────█████████│
└─────────────────────────────┘

Applied Mask (varies by device):
   Circle         Squircle       Rounded Square
    ○○○○            ▢▢▢▢              ▢▢▢▢
  ○○    ○○        ▢      ▢          ▢      ▢
 ○        ○      ▢        ▢        ▢        ▢
 ○        ○      ▢        ▢        ▢        ▢
  ○○    ○○        ▢      ▢          ▢      ▢
    ○○○○            ▢▢▢▢              ▢▢▢▢
```

### Adaptive Icon Safe Zone

**Full Canvas**: 1024×1024 pixels (100%)
**Safe Zone**: 864×864 pixels (84.4%)
**Margin**: 80 pixels on each side (15.6%)

**Why?**
- Circle mask clips corners (uses ~78% of canvas)
- Square mask uses ~84% of canvas
- Safe zone ensures visibility on all masks

### Configuration

In `app.json`:

```json
{
  "expo": {
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#2563eb"
      }
    }
  }
}
```

**Options**:

1. **Solid Background Color** (Recommended for simple icons):
```json
"adaptiveIcon": {
  "foregroundImage": "./assets/adaptive-icon.png",
  "backgroundColor": "#2563eb"  // Blue
}
```

2. **Background Image** (For complex designs):
```json
"adaptiveIcon": {
  "foregroundImage": "./assets/adaptive-icon-foreground.png",
  "backgroundImage": "./assets/adaptive-icon-background.png"
}
```

### Creating Adaptive Icons

**Option 1: Use Same Icon as Foreground**

If your main icon has transparent background:
```json
"adaptiveIcon": {
  "foregroundImage": "./assets/icon.png",
  "backgroundColor": "#2563eb"
}
```

**Option 2: Create Dedicated Adaptive Icon**

For better control:
1. Create `adaptive-icon.png` (1024×1024)
2. Logo centered in 864×864 safe zone
3. Transparent background (PNG with alpha)
4. Export as 32-bit PNG

### Design Tips for Adaptive Icons

1. **Center Your Logo**: Keep main elements in 864×864 center
2. **Test All Masks**: Preview with circle, square, and squircle
3. **Avoid Edge Details**: Don't place important info in outer 80px
4. **Contrasting Background**: Ensure foreground pops against background
5. **Simple Foreground**: Complex designs don't work well with masks

### Testing Adaptive Icons

**Online Tool**:
- [Adaptive Icon Preview](https://adapticon.tooo.io/)
- Upload your foreground and background
- Preview all mask shapes

**Android Studio**:
- Create new image asset
- Test with different shapes
- Preview on various launchers

**On Device**:
- Build APK and install
- Check on Pixel Launcher (circle mask)
- Check on Samsung Launcher (squircle mask)
- Check on Nova Launcher (customizable)

---

## Tools & Resources

### Design Tools

**Vector Editors** (Recommended):
- **Figma**: Free, browser-based, collaborative
- **Sketch**: Mac only, $99/year
- **Adobe Illustrator**: Professional, $20.99/month
- **Inkscape**: Free, open-source

**Raster Editors**:
- **Photoshop**: Professional, $20.99/month
- **GIMP**: Free, open-source
- **Affinity Photo**: One-time purchase, $69.99

**Icon-Specific Tools**:
- **Icon Slate**: Mac, $9.99, generates all sizes
- **Asset Catalog Creator**: Mac, free
- **App Icon Generator**: Online, free

### Online Icon Generators

**All-in-One**:
- [MakeAppIcon](https://makeappicon.com/): Upload 1024px, download all sizes
- [App Icon Resizer](https://appicon.co/): Free, generates iOS & Android
- [Icon Kitchen](https://icon.kitchen/): Free, adaptive icon support

**Adaptive Icon Tools**:
- [Adaptive Icon Generator](https://easyappicon.com/): Preview masks
- [Ape Tools](https://apetools.webprofusion.com/): Android asset generator

**Placeholder Generators** (for testing):
- [Icon Generator](https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html): Android focused
- [Expo Icon Template](https://docs.expo.dev/guides/app-icons/): Official guide

### Optimization Tools

**PNG Compression**:
- [TinyPNG](https://tinypng.com/): Reduces file size by ~70%
- [ImageOptim](https://imageoptim.com/): Mac app, drag & drop
- [PNGCrush](https://pmt.sourceforge.io/pngcrush/): Command-line tool

**SVG Optimization**:
- [SVGOMG](https://jakearchibald.github.io/svgomg/): Online SVG compressor
- [SVGO](https://github.com/svg/svgo): Command-line SVG optimizer

### Validation Tools

**App Store Validation**:
- Xcode: Open `.xcassets`, add icon, check warnings
- [Prepo](https://apps.apple.com/app/prepo/id476533227): Mac app, validates sizes

**Play Store Validation**:
- Play Console: Upload icon, see instant preview
- [Android Asset Studio](https://romannurik.github.io/AndroidAssetStudio/): Test adaptive icons

### Testing Tools

**Accessibility**:
- [Coblis Color Blindness Simulator](https://www.color-blindness.com/coblis-color-blindness-simulator/): Test colorblindness
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/): Verify contrast

**Preview**:
- [App Mockup](https://app-mockup.com/): See icon on device mockups
- [Smartmockups](https://smartmockups.com/): Generate store screenshots with icon

---

## Icon Checklist

### Design Phase

- [ ] Icon designed at 1024×1024 pixels
- [ ] Simple, recognizable design
- [ ] Works in grayscale
- [ ] Passes colorblind test
- [ ] Important content within 854×854 safe zone
- [ ] Tested at small sizes (48px, 72px, 96px)
- [ ] Matches brand guidelines
- [ ] No text or text is legible
- [ ] High contrast colors

### File Preparation

**Main Icon**:
- [ ] `icon.png`: 1024×1024, 32-bit PNG with alpha
- [ ] Or `icon.svg`: Vector format, viewBox="0 0 1024 1024"
- [ ] File size < 1MB
- [ ] RGB color mode (not CMYK)
- [ ] Saved with proper compression

**Android Adaptive Icon**:
- [ ] `adaptive-icon.png`: 1024×1024, transparent foreground
- [ ] Content within 864×864 safe zone
- [ ] Contrasting background color chosen
- [ ] Tested with circle, square, squircle masks
- [ ] Looks good with parallax animation

**App Store Icon** (iOS):
- [ ] 1024×1024 pixels exactly
- [ ] PNG format (no transparency)
- [ ] Square corners (not rounded)
- [ ] sRGB color profile
- [ ] File size < 1MB
- [ ] Lossless compression

**Play Store Icon** (Android):
- [ ] 512×512 pixels exactly
- [ ] 32-bit PNG with alpha
- [ ] Transparency allowed but optional
- [ ] File size < 1MB

**Feature Graphic** (Android):
- [ ] 1024×500 pixels exactly
- [ ] 24-bit PNG or JPEG
- [ ] No transparency
- [ ] File size < 1MB
- [ ] Eye-catching design

### app.json Configuration

- [ ] `icon` path is correct
- [ ] `android.adaptiveIcon.foregroundImage` path is correct
- [ ] `android.adaptiveIcon.backgroundColor` is set
- [ ] `favicon` path is correct (for web)
- [ ] `splash` image configured

### Pre-Build Testing

- [ ] Run `eas build --platform ios --profile production`
- [ ] Download and install .ipa on iOS device
- [ ] Verify icon appears correctly on home screen
- [ ] Verify icon in Settings app
- [ ] Verify icon in Spotlight search
- [ ] Run `eas build --platform android --profile production`
- [ ] Download and install .aab on Android device
- [ ] Verify icon on launcher (test multiple launchers if possible)
- [ ] Verify adaptive icon animates correctly
- [ ] Verify icon in app drawer
- [ ] Take screenshot of icon on home screen for reference

### App Store Submission

**iOS**:
- [ ] Upload 1024×1024 PNG to App Store Connect
- [ ] Verify icon displays correctly in listing preview
- [ ] No validation errors

**Android**:
- [ ] Upload 512×512 PNG to Play Console
- [ ] Upload 1024×500 feature graphic
- [ ] Verify icon displays correctly in listing preview
- [ ] Test with Play Store's circular mask

### Post-Submission

- [ ] Check icon on live App Store listing
- [ ] Check icon on live Play Store listing
- [ ] Verify icon on users' devices (ask beta testers)
- [ ] Monitor for any icon-related feedback
- [ ] Update icon as needed for major app updates

---

## Example: ProficiencyAI Icon

### Design Concept

**Primary Icon** (Current: SVG):
- Blue gradient background (#2563eb to #3b82f6)
- White "P" letter or brain/education symbol
- Centered design
- Works with all masks

**Adaptive Icon** (Current: SVG):
- Foreground: White logo on transparent background
- Background color: #2563eb (brand blue)
- Safe zone: Logo contained within 864×864 center

### File Structure

```
mobile/
  assets/
    icon.svg              # Main icon (1024×1024)
    adaptive-icon.svg     # Android adaptive foreground (1024×1024)
    favicon.svg           # Web favicon
    splash.svg            # Splash screen
```

### Generation Process

1. **Design**: Create master icon in Figma/Illustrator
2. **Export**: Save as SVG and PNG (1024×1024)
3. **Optimize**: Run through SVGOMG
4. **Place**: Copy to `mobile/assets/`
5. **Configure**: Update `app.json` paths
6. **Build**: Run `eas build`
7. **Verify**: Check generated icons in build output

---

## Frequently Asked Questions

**Q: Do I need to create all icon sizes manually?**  
A: No! Expo automatically generates all required sizes from your 1024×1024 source icon.

**Q: Should I use PNG or SVG for my icon?**  
A: SVG is preferred for perfect scaling. Use PNG if you have photographic elements.

**Q: Why does my iOS icon have rounded corners?**  
A: iOS applies rounded corners automatically. Don't round them yourself!

**Q: Can I use transparency in my icon?**  
A: Yes for Android and source icon. No for iOS App Store Connect upload (flatten to solid color).

**Q: What's the difference between icon and adaptive icon?**  
A: Regular icon is used on iOS and older Android. Adaptive icon (Android 8+) has separate foreground/background for dynamic effects.

**Q: How do I test my icon before submission?**  
A: Build with EAS and install on physical devices. Check home screen, settings, app drawer.

**Q: My icon looks blurry on Android. Why?**  
A: Ensure your source is 1024×1024 and high quality. Check that Expo is generating proper densities.

**Q: Can I change my icon after app is published?**  
A: Yes, submit an app update with new icon. Users get it with next update.

**Q: Do I need a splash screen icon too?**  
A: Yes, but it's configured separately in `app.json` under `splash`.

**Q: What's a feature graphic and do I need it?**  
A: It's a 1024×500 banner for Play Store listings. Required for Android submission.

---

**Document Version**: 1.0.0  
**Last Updated**: November 2025  
**Maintained By**: ProficiencyAI Development Team
