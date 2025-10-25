# ProficiencyAI Design Guidelines - Instagram/Facebook Inspired

## Design Approach

**Selected Framework:** Instagram/Facebook/Canvas LMS Fusion - Social Media Aesthetic for Educational Platform

**Rationale:** Modern educational platforms need the approachable, engaging feel of social media while maintaining the organizational structure of LMS systems. This hybrid approach creates a fresh, delightful experience that feels native on mobile yet professional for education.

**Core Principles:**
- Delightful interactions: Every click, hover, scroll feels polished
- Card-centric design: Instagram-style content cards with depth
- Vibrant yet professional: Gradients and colors that energize without overwhelming
- Mobile-native feel: Smooth, app-like experience across devices

---

## Color System

**Primary Palette:**
- Primary Blue: #2563eb to #3b82f6 (use as gradients: bg-gradient-to-r from-blue-600 to-blue-500)
- Success Green: #10b981 (completion, correct answers, positive actions)
- Warning Amber: #f59e0b (alerts, incomplete states)
- Error Red: #ef4444 (validation errors, failures)

**Neutral Scale:**
- Background: #ffffff (primary), #f9fafb (secondary), #f3f4f6 (tertiary)
- Text: #111827 (primary), #6b7280 (secondary), #9ca3af (tertiary)
- Borders: #e5e7eb (subtle), #d1d5db (standard)

**Gradient Applications:**
- Hero overlays: Linear gradients from primary to darker shade
- Card headers: Subtle gradients for section emphasis
- Button accents: Hover states with gradient shifts
- Dashboard stats: Background gradients in stat cards

---

## Typography

**Font Stack:** Inter (Google Fonts) for all text

**Scale & Weights:**
- Hero: 3.5rem/56px, weight 700
- H1: 2.5rem/40px, weight 700
- H2: 2rem/32px, weight 600
- H3: 1.5rem/24px, weight 600
- H4: 1.25rem/20px, weight 600
- Body Large: 1.125rem/18px, weight 500
- Body: 1rem/16px, weight 400
- Caption: 0.875rem/14px, weight 400
- Label: 0.75rem/12px, weight 600 (uppercase, tracking-wide)

**Mobile Scale:** Reduce hero by 30%, H1-H3 by 25%, maintain body sizes
**Line Heights:** 1.6 body, 1.2 headings

---

## Layout System

**Spacing (Tailwind):** 2, 3, 4, 6, 8, 12, 16, 20, 24, 32

**Container Strategy:**
- Max widths: max-w-7xl (dashboards), max-w-4xl (content), max-w-2xl (forms)
- Padding: px-4 md:px-6 lg:px-8
- Section spacing: py-12 md:py-16 lg:py-24

**Card Grids:**
- Dashboard: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
- Content feed: grid-cols-1 gap-4 (mobile stacking)
- Stat cards: grid-cols-2 md:grid-cols-4 gap-4

**Responsive Approach:** Mobile-first with smooth breakpoint transitions

---

## Component Library

### Navigation

**Desktop Sidebar:**
- Width: w-72, bg-white, shadow-lg, fixed left
- Logo section: py-6 px-6, gradient background
- Nav items: py-3 px-6, rounded-xl mx-3, icon + label, active state with gradient background
- User profile: bottom pinned, py-4 px-6, avatar + name + role badge

**Mobile Bottom Tab:**
- Fixed bottom, h-16, bg-white, shadow-2xl, rounded-t-3xl
- 4-5 icons with labels, active state with gradient text and icon fill
- Floating action button centered above tabs

**Top Header:**
- h-16, sticky top-0, bg-white/95 backdrop-blur-md, shadow-md
- Breadcrumbs left, search center, notifications + profile right
- Slide-in search drawer on mobile

### Cards & Containers

**Primary Card:**
- rounded-2xl, shadow-lg, bg-white, hover:shadow-xl transition-all duration-300
- Header: p-6, gradient background (subtle), bold title + icon
- Content: p-6, well-spaced elements
- Footer: px-6 py-4, border-t, actions right-aligned

**Stat Card:**
- rounded-2xl, p-6, gradient background, shadow-lg
- Large number: 3rem, weight 700, text-white
- Label: text-sm, weight 600, text-white/80
- Icon: absolute top-right, w-12 h-12, opacity-20
- Trend indicator: small arrow + percentage, text-white/90

**Feed Card (Question/Assignment):**
- rounded-2xl, bg-white, shadow-md, hover:shadow-xl
- User avatar + metadata header
- Content preview with image (16:9 ratio if visual)
- Interaction footer: like, comment, share icons with counts
- Tags: rounded-full pills with gradient backgrounds

### Forms & Inputs

**Text Input:**
- Floating label: absolute positioning, moves up on focus/filled
- h-14, rounded-xl, border-2, border-gray-200
- Focus: border-blue-500, ring-4 ring-blue-100
- Error: border-red-500, ring-red-100, error icon right
- Success: border-green-500, ring-green-100, checkmark icon

**Select/Dropdown:**
- Same styling as input, chevron icon right
- Dropdown menu: rounded-2xl, shadow-2xl, p-2, max-h-60 overflow-y-auto
- Options: rounded-xl px-4 py-3, hover:bg-blue-50

**Checkbox/Radio:**
- w-6 h-6, rounded-md (checkbox) / rounded-full (radio)
- Checked: gradient background, white checkmark, scale-105 animation
- Label: font-medium, ml-3

**Toggle Switch:**
- w-12 h-6, rounded-full, smooth slide transition
- Active: gradient background

### Buttons

**Primary:**
- h-12 px-8, rounded-xl, bg-gradient-to-r from-blue-600 to-blue-500
- text-white font-semibold, shadow-lg, hover:shadow-xl hover:scale-105
- Active: scale-95
- Disabled: opacity-50, cursor-not-allowed

**Secondary:**
- Same dimensions, border-2 border-blue-500, text-blue-600
- Hover: bg-blue-50

**Floating Action Button (FAB):**
- w-14 h-14, rounded-full, gradient background, shadow-2xl
- Icon centered, fixed position
- Hover: scale-110, shadow-3xl
- Ripple animation on click

**Buttons on Images:** backdrop-blur-md bg-white/20 border border-white/30 text-white

### Data Display

**Tables:**
- rounded-2xl overflow, shadow-lg
- Header: gradient background, sticky top, font-semibold, py-4
- Rows: hover:bg-blue-50, transition, py-4 px-6
- Actions: 3-dot menu, slide-in action panel
- Empty state: py-16, illustration + gradient text CTA

**Charts:**
- Container: rounded-2xl, bg-white, shadow-lg, p-6
- Use gradient fills for areas, vibrant line colors
- Interactive tooltips with rounded-xl styling
- Legend: rounded-full pills

**Progress Indicators:**
- Linear: h-3, rounded-full, gradient fill, animated stripe pattern
- Circular: gradient stroke, percentage centered, smooth animation
- Ring: w-20 h-20, gradient stroke, label below

### Modals & Overlays

**Modal:**
- max-w-2xl, rounded-3xl, shadow-2xl, bg-white
- Header: gradient background, p-6, close button (hover:scale-110)
- Content: p-6, max-h-[70vh] overflow-y-auto
- Footer: p-6, border-t, buttons right-aligned
- Backdrop: bg-black/50 backdrop-blur-sm

**Toast Notifications:**
- Top-right, rounded-2xl, shadow-2xl, p-4, slide-in animation
- Icon + message + close, auto-dismiss 4s
- Success: gradient green, Warning: gradient amber, Error: gradient red

**Bottom Sheet (Mobile):**
- Slide up from bottom, rounded-t-3xl, shadow-2xl
- Drag handle: w-12 h-1.5 bg-gray-300 rounded-full, centered top

### Specialized Components

**Live Proctoring Panel:**
- Fixed corner position, rounded-2xl, shadow-2xl
- Webcam: 240x180, rounded-xl
- Status indicators: pulsing dot + label
- Expandable to full view with smooth animation

**Question Bank Browser:**
- 3-column layout: Filters (w-64) | Grid | Details (w-96)
- Filter cards: rounded-xl, checkboxes with gradients
- Question cards: hover lift, preview image top, meta footer
- Detail panel: slide-in from right, full question view

**CAT Exam Interface:**
- Minimal distraction: single centered card max-w-4xl
- Question number badges: gradient circular pills
- Navigation: floating bottom bar with rounded-full buttons
- Timer: top-right, pulsing animation when < 5 min

**Dashboard Hero:**
- h-80 md:h-96, gradient background (brand colors)
- Welcome message: text-4xl font-bold text-white
- Quick stats: 3-4 cards overlapping hero bottom edge (absolute positioning)
- Decorative elements: floating shapes with subtle animations

---

## Animations & Interactions

**Page Transitions:** 300ms fade + slide-up
**Card Hover:** transform scale-105, shadow-lg to shadow-2xl, 200ms
**Button Press:** scale-95, 100ms
**Skeleton Loaders:** Shimmer animation, gradient sweep left-to-right
**Scroll Reveals:** fade-in + slide-up on viewport entry
**Input Focus:** ring grows, label floats, 150ms ease-out
**Ripple Effect:** Click position origin, expanding circle, 600ms
**Micro-interactions:** Icon bounces, checkmarks draw in, success confetti

**Scroll Behavior:** smooth, no abrupt jumps

---

## Images

**Hero Section (Landing/Marketing):**
- Full-width, h-[500px] md:h-[600px]
- Image: Diverse students collaborating with laptops and tablets in modern bright classroom, natural lighting, professional photography
- Overlay: bg-gradient-to-r from-blue-900/80 to-blue-600/60
- Content: Centered, text-white, CTA buttons with backdrop-blur

**Dashboard Imagery:**
- Empty states: Colorful line illustrations (undraw.co style), max-w-xs centered
- Profile avatars: rounded-full, border-4 border-white shadow-lg
- Achievement badges: gradient circular badges with icons
- Background patterns: Subtle geometric shapes, low opacity

**Content Cards:**
- Assignment thumbnails: 16:9 ratio, rounded-t-2xl
- User-generated: rounded-xl within cards
- Placeholder: gradient backgrounds with centered icons

---

## Accessibility

**Focus States:** ring-4 with brand color, 3px offset, always visible
**Touch Targets:** min 48x48px all interactive elements
**Contrast:** 4.5:1 minimum body, ensure gradients maintain readability
**Screen Readers:** ARIA labels for icons, live regions for dynamic updates
**Keyboard:** Tab navigation through all elements, Enter/Space activation, Escape closes modals
**Reduced Motion:** Respect prefers-reduced-motion, disable animations

---

## Loading & Feedback States

**Skeleton:** Match layout exactly, shimmer gradient animation
**Spinners:** Gradient circular spinner for page loads, small inline for buttons
**Success:** Green gradient card with checkmark animation, 2s auto-dismiss
**Error:** Red gradient alert, icon + message + retry button
**Empty:** Illustration + heading + description + gradient CTA button