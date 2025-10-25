# ProficiencyAI Design Guidelines

## Design Approach

**Selected Framework:** Material Design with enterprise education platform inspiration (Canvas, Google Classroom, Moodle modernized)

**Rationale:** As an information-dense, multi-role educational platform requiring stability and trust, Material Design's structured component system provides the clarity needed for complex dashboards and assessment interfaces while maintaining accessibility standards.

**Core Principles:**
- Clarity over decoration: Every element serves a functional purpose
- Hierarchy through structure: Use elevation, spacing, and typography—not color—to establish importance
- Predictable interactions: Consistent patterns across all user roles
- Trust through restraint: Professional, composed layouts that inspire confidence

---

## Typography System

**Font Families:**
- Primary: Inter (via Google Fonts) - headings and UI elements
- Secondary: IBM Plex Sans - body text and data displays
- Monospace: JetBrains Mono - code snippets, IDs, technical data

**Type Scale (Desktop):**
- Hero/Display: 3.5rem (56px), font-weight: 700
- H1: 2.5rem (40px), font-weight: 600
- H2: 2rem (32px), font-weight: 600
- H3: 1.5rem (24px), font-weight: 600
- H4: 1.25rem (20px), font-weight: 600
- Body Large: 1.125rem (18px), font-weight: 400
- Body: 1rem (16px), font-weight: 400
- Body Small: 0.875rem (14px), font-weight: 400
- Caption: 0.75rem (12px), font-weight: 500

**Mobile Adjustments:** Scale down hero/display by 30%, H1-H3 by 20%

**Line Heights:** 1.6 for body text, 1.3 for headings

---

## Layout System

**Spacing Units (Tailwind):** Consistently use 1, 2, 3, 4, 6, 8, 12, 16, 20, 24 for all spacing

**Common Patterns:**
- Card padding: p-6 (desktop), p-4 (mobile)
- Section padding: py-16 md:py-24 (desktop), py-12 (mobile)
- Element gaps: gap-4 for related items, gap-8 for sections
- Container max-width: max-w-7xl with px-4 md:px-6 lg:px-8

**Grid Systems:**
- Dashboard widgets: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Data tables: Full-width with horizontal scroll on mobile
- Forms: max-w-2xl for optimal readability

**Responsive Breakpoints:** Follow Tailwind defaults (sm: 640px, md: 768px, lg: 1024px, xl: 1280px)

---

## Component Library

### Navigation
**Main Header:** Fixed top navigation (h-16), logo left, role-based menu center, user profile/notifications right. Include role indicator badge next to username.

**Sidebar (Dashboard Views):** 
- Width: w-64 on desktop, collapsible to w-16 with icons only
- Mobile: Slide-over drawer
- Structure: Logo top, navigation groups with icons, user profile bottom
- Active state: Subtle left border (4px) and background treatment

**Breadcrumbs:** Always present in dashboard views below header, separated by chevron icons

### Cards & Containers
**Standard Card:** Rounded corners (rounded-lg), subtle shadow (shadow-sm), hover lift (shadow-md transition)
**Dashboard Widget:** Header with icon and title, content area, optional footer with actions
**Stat Cards:** Large number display, label, trend indicator (arrow + percentage)
**Question Card:** Question text, media preview, metadata footer (type, difficulty, tags)

### Forms & Inputs
**Text Inputs:** 
- Height: h-12, rounded-md, border with focus ring
- Label above input (font-weight: 500)
- Helper text below (text-sm)
- Error state: Red border, error icon, error message

**Select/Dropdowns:** Match input height, chevron icon right-aligned

**Checkboxes/Radio:** Larger touch targets (w-5 h-5), clear labels

**File Upload:** Drag-and-drop zone with dashed border, upload icon, file size limits shown

**Rich Text Editor:** Toolbar with formatting options, clean editing area, character count

### Buttons
**Primary:** High contrast, h-12, px-6, rounded-md, font-weight: 600
**Secondary:** Outlined variant of primary
**Tertiary/Ghost:** Text-only with subtle hover background
**Icon Buttons:** Square (w-10 h-10), centered icon
**Button Groups:** Connected buttons with shared borders

**Blurred Background (Hero/Image Overlays):** backdrop-blur-sm with semi-transparent background

### Data Display
**Tables:**
- Zebra striping for rows
- Sticky header on scroll
- Sortable columns with icon indicator
- Row actions dropdown (3-dot menu)
- Pagination controls at bottom
- Empty state with illustration and CTA

**Charts:** Use Chart.js or Recharts
- Line charts: Trends over time
- Bar charts: Comparisons
- Pie/Donut: Distributions
- Consistent chart colors aligned with role theming

**Progress Indicators:**
- Linear: Full-width bars for quiz completion, upload status
- Circular: Percentage completion for assessments
- Stepped: Multi-stage processes (exam setup, grading workflow)

### Modals & Overlays
**Modal:** Center screen, max-w-2xl, backdrop blur, close button top-right
**Drawer:** Slide from right, w-96 or w-1/3, for detailed views/forms
**Toast Notifications:** Top-right corner, auto-dismiss, icon + message + close
**Tooltips:** Appear on hover, small arrow pointer, brief explanations

### Specialized Components
**Live Proctoring Panel:**
- Webcam feed (small, corner positioned)
- Screen capture indicator
- Violation alerts with timestamp
- Recording status indicator

**Question Bank Browser:**
- Left: Filter sidebar (subject, difficulty, type, tags)
- Center: Question grid with preview cards
- Right: Selected question detail panel

**CAT Exam Interface:**
- Clean, distraction-free layout
- Single question centered
- Progress bar (questions, not time)
- Navigation controls bottom-right
- Timer top-right (if timed)

**Analytics Dashboard:**
- KPI cards in grid at top (3-4 key metrics)
- Charts section (2-column layout for comparisons)
- Data table for detailed breakdowns
- Export/filter controls in header

---

## Loading & Feedback States

**Skeleton Screens:** For initial page loads, match layout structure with pulsing placeholders
**Spinners:** Small inline for button actions, large centered for page loads
**Success States:** Green checkmark with brief success message
**Error States:** Red alert icon with clear error message and action steps
**Empty States:** Illustration + helpful message + primary action button

---

## Accessibility Implementation

**Focus Indicators:** 2px solid ring with 2px offset, high contrast
**Keyboard Navigation:** All interactive elements accessible via Tab, Enter, Space
**Screen Reader:** Semantic HTML, ARIA labels for icons, live regions for dynamic content
**Contrast Ratios:** Minimum 4.5:1 for body text, 3:1 for large text and UI components
**Touch Targets:** Minimum 44x44px for all interactive elements

---

## Images

**Hero Section (Marketing/Landing):**
- Full-width, 60vh height
- Image: Modern classroom setting with diverse students using tablets/laptops, professional photography style
- Overlay: Dark gradient from bottom (30% opacity) for text legibility
- Positioned: Students engaged with devices in foreground, bright learning environment background

**Dashboard Illustrations:**
- Empty state graphics: Friendly, minimalist line illustrations
- 404/Error pages: Professional but approachable illustration
- Onboarding: Step-by-step visual guides

**User Avatars:** Circular, consistent sizes (w-8, w-10, w-12), placeholder initials when no photo

**Role-Based Imagery:**
- Student views: Encouraging, achievement-focused imagery
- Teacher dashboards: Instructional, organized workspace themes
- Admin panels: Data visualization, system management graphics

---

## Animations (Minimal)

Use only for functional feedback:
- Page transitions: 200ms fade
- Card hover: 150ms transform and shadow
- Button press: 100ms scale (0.98)
- Drawer/modal: 250ms slide/fade
- Loading spinners: Smooth rotation

**No decorative animations** - every motion serves a purpose.