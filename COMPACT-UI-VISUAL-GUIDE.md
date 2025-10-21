# Modern Compact UI/UX - Visual Design Guide

## Color Scheme

### Light Mode
```
Background:        #FFFFFF (white)
Surface:           #F9FAFB (gray-50)
Secondary Surface: #F3F4F6 (gray-100)
Border:            #E5E7EB (gray-200)
Text Primary:      #111827 (gray-900)
Text Secondary:    #6B7280 (gray-600)
Text Disabled:     #D1D5DB (gray-300)
Accent Primary:    #2563EB (blue-600)
Accent Hover:      #1D4ED8 (blue-700)
Danger:            #DC2626 (red-600)
Success:           #16A34A (green-600)
```

### Dark Mode
```
Background:        #111827 (gray-900)
Surface:           #1F2937 (gray-800)
Secondary Surface: #374151 (gray-700)
Border:            #4B5563 (gray-700)
Text Primary:      #FFFFFF (white)
Text Secondary:    #9CA3AF (gray-400)
Text Disabled:     #6B7280 (gray-600)
Accent Primary:    #3B82F6 (blue-500)
Accent Hover:      #60A5FA (blue-400)
Danger:            #EF4444 (red-500)
Success:           #22C55E (green-500)
```

## Spacing Scale

```
Property    Value    Tailwind    Usage
──────────────────────────────────────────
Minimal     2px      space-0.5   Menu gaps
Compact     4px      p-2, space-1  Form spacing
Standard    6px      p-3, space-1.5  Cell padding
Normal      8px      space-2     Section gaps
Comfortable 12px     p-3         Form sections
Spacious    16px     p-4         Page padding
Relaxed     24px     p-6         (Removed)
```

## Typography Scale

```
Size    Font Weight    Tailwind        Usage
──────────────────────────────────────────
24px    bold           text-2xl/bold   Page title
16px    semibold       text-sm/semibold Section title
14px    medium/normal  text-sm         Body/inputs/tables
12px    medium/normal  text-xs         Labels/small text
10px    medium/normal  text-xs/small   Badges/tags (rare)
```

## Component Specifications

### Buttons

**Primary Action**
```
Padding:       px-3 py-1.5
Font:          text-sm font-medium
Background:    bg-blue-600
Hover:         hover:bg-blue-700
Border Radius: rounded
Transition:    transition-colors
```

**Secondary Action**
```
Padding:       px-3 py-1.5
Font:          text-sm font-medium
Background:    transparent
Border:        border border-gray-300
Hover:         hover:bg-gray-50
```

**Icon-Only (Emoji)**
```
Size:          text-lg emoji
Padding:       inline (no padding)
Usage:         Edit (✏️), Delete (🗑️)
```

### Form Inputs

**Text Input**
```
Padding:       px-2.5 py-1.5
Font:          text-sm
Border:        border border-gray-300
Border Radius: rounded
Focus:         focus:border-blue-500 focus:outline-none
Background:    bg-white
Dark Mode:     dark:bg-gray-800 dark:border-gray-600
```

**Label**
```
Font Size:     text-xs
Font Weight:   font-medium
Color:         text-gray-700
Dark Mode:     dark:text-gray-300
Margin:        mb-1
```

**Select/Textarea**
```
Same as text input
Textarea: rows-2 (descriptions)
```

### Tables

**Header Row**
```
Background:    bg-gray-50 dark:bg-gray-800
Border:        border-b border-gray-200
Padding:       px-3 py-2
Font:          text-sm font-semibold
```

**Data Row**
```
Padding:       px-3 py-2
Font:          text-sm
Border:        border-b border-gray-200
Hover:         hover:bg-gray-50 dark:hover:bg-gray-800
```

**Cell Values**
```
Number:        font-medium text-gray-900
Status:        Badge with small padding
Action:        Icon button with emoji
```

### Cards/Sections

**Stats Card**
```
Padding:       p-3
Border:        border border-gray-200
Border Radius: rounded
Background:    bg-white dark:bg-gray-900
```

**Form Section**
```
Padding:       p-4
Border:        border border-gray-200
Border Radius: rounded
Background:    bg-white dark:bg-gray-900
Spacing:       space-y-3 between fields
```

### Badges/Tags

**Status Badge**
```
Padding:       px-2 py-0.5
Font:          text-xs font-medium
Border Radius: rounded
Examples:
  System:      bg-purple-100 text-purple-700
  Tenant:      bg-blue-100 text-blue-700
```

**Abbreviation Tag**
```
Padding:       px-1.5 py-0.5
Font:          text-xs font-medium
Border Radius: rounded
Examples:
  SYS → System
  TNT → Tenant
  V/C/E/D → View/Create/Edit/Delete
```

## Layout Patterns

### Page Layout
```
┌─────────────────────────────────┐
│   Header (compact)              │  p-4
├─────────────────────────────────┤
│   Subheader text (text-xs)      │  
├─────────────────────────────────┤
│   Stats/Controls (gap-2)        │  3-column grid
├─────────────────────────────────┤
│                                 │
│   Content Area (p-4)            │  rounded border
│                                 │
├─────────────────────────────────┤
│   Actions (flex gap-2)          │  Footer buttons
└─────────────────────────────────┘
```

### Form Layout
```
┌──────────────────────┐
│  Label (text-xs)     │
│  Input (py-1.5)      │
│  [mb-3]              │
│  Label               │
│  Input               │
│  [mb-3]              │
│  [Buttons below]     │
└──────────────────────┘
```

### Table Layout
```
┌─────────┬─────────┬─────────┐
│ Header  │ Header  │ Header  │  bg-gray-50
├─────────┼─────────┼─────────┤
│ Data    │ Data    │ Data    │  px-3 py-2
├─────────┼─────────┼─────────┤
│ Data    │ Data    │ Data    │  hover:bg-gray-50
├─────────┼─────────┼─────────┤
│ Data    │ Data    │ Data    │
└─────────┴─────────┴─────────┘
```

### Sidebar Layout
```
┌──────────────────┐
│  Logo (h-14)     │  Compact header
├──────────────────┤
│  Menu Item       │  py-1.5 px-2
│  Menu Item       │  space-y-0.5
│  ▶ Group        │  
│    Sub Item      │  text-xs
│    Sub Item      │
│  Menu Item       │
│                  │
│  [Scrollable]    │
└──────────────────┘
```

## State Variations

### Hover States
```
Button:         bg-color → darker shade
Link:           text-color → darker shade
Row:            transparent → bg-gray-50 (light) / bg-gray-800 (dark)
Input:          border-gray-300 → border-blue-500
```

### Focus States
```
Input:          outline: none, border-blue-500
Button:         outline-offset, visible focus ring
Link:           outline or underline
```

### Disabled States
```
Button:         opacity-50, cursor-not-allowed
Input:          opacity-50, cursor-not-allowed
Field:          bg-gray-100, text-gray-400
```

### Loading States
```
Spinner:        Animation while loading
Text:           "Loading..." message
Opacity:        Can be reduced to 50%
```

## Icon Guidelines

### Size Usage
```
Page Title Icon:     text-lg (24px)
Menu Item Icon:      text-lg (24px)
Table Action:        text-lg (emoji: ✏️, 🗑️)
Indicator:           Inline (✓, —)
Badge Icon:          text-xs (rare)
```

### Color Usage
```
Informational:    gray (default)
Action:           blue (primary)
Destructive:      red (delete)
Success:          green
Warning:          yellow/orange
```

## Responsive Breakpoints

### Mobile (<640px)
```
Sidebar:          Fixed overlay
Tables:           Horizontal scroll
Grids:            Single column
Padding:          p-3 or p-4
Font:             Readable (min 14px)
Touch Target:     Min 32x32px
```

### Tablet (640px - 1024px)
```
Sidebar:          Sticky on desktop, overlay on mobile
Tables:           Mostly visible
Grids:            2 columns
Padding:          p-4
Layout:           Adaptive
```

### Desktop (>1024px)
```
Sidebar:          Always visible, sticky
Tables:           Full width, all columns
Grids:            Full multi-column
Padding:          p-4 to p-6
Layout:           Optimized
```

## Shadow & Elevation

```
None:             flat design
Subtle:           drop-shadow-sm
Normal:           drop-shadow
Elevated:         drop-shadow-lg (rare)
Hover:            Can add subtle shadow
```

(Current design: No shadows, clean flat design)

## Animation & Transitions

```
Duration:         300ms standard
Easing:           ease-in-out typical
Effects:
  - Color change:     transition-colors
  - All changes:      transition-all
  - Opacity:          transition-opacity
  - Transform:        transition-transform

Examples:
  Hover:              smooth color/bg change
  Menu expand:        rotate-180 arrow
  Page load:          fade in
```

## Accessibility

### Color Contrast
```
Text on White:     #111827 (gray-900) - 19:1
Text on Gray-50:   #111827 (gray-900) - 18:1
Text on Blue:      #FFFFFF (white)   - 7:1
Button Text:       #FFFFFF on blue   - 7:1
Dark Mode:         Proper ratios maintained
```

### Focus Indicators
```
Outline:           Visible, contrasting
Color:             Blue (accent color)
Width:             2px
Offset:            2px
```

### Touch Targets
```
Minimum:           32x32px
Spacing:           8px minimum between targets
Buttons:           Always 32px+ in height
Links:             Sufficient padding
```

## Motion & Microinteractions

### Button Feedback
```
Hover:             Instant color change
Active:            Slightly darker shade
Disabled:          Opacity change + cursor change
```

### Menu Interactions
```
Expand:            Smooth rotation of arrow
Sub-item hover:    Subtle background highlight
Active:            Bold/color indicator
```

### Form Feedback
```
Valid:             Green border optional
Invalid:           Red border
Focus:             Blue border + no outline
Error Message:     Red text below field
```

## Implementation Notes

1. **All Paddings Use Tailwind Scale**
   - No custom pixel values
   - Consistent spacing throughout

2. **Dark Mode Always On**
   - All components use dark: variants
   - Colors properly adapted

3. **No Rounded Corners**
   - Use `rounded` (4px) for subtle effect
   - No large border-radius

4. **Minimal Color Palette**
   - Primary: Blue
   - Neutral: Gray scale
   - Alert: Red
   - Success: Green

5. **Typography Limited**
   - 3 sizes max per component
   - 2-3 font weights
   - Clear hierarchy

---

**This guide ensures consistent, professional UI/UX across all admin components.**
