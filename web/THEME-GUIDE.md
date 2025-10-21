# Theme Testing Guide

## Current Setup

### 1. Theme Service
- **Location**: `src/app/core/services/theme.service.ts`
- **Initialization**: Reads from localStorage, defaults to dark mode
- **Mechanism**: Uses Angular signals (`isDark`) and effects to manage theme
- **DOM Updates**: Adds/removes 'dark' class on `document.documentElement`

### 2. Tailwind Configuration
- **Location**: `tailwind.config.js`
- **Dark Mode**: Configured as `'class'` selector
- **Content**: Scans `src/**/*.{html,ts}` for classes

### 3. PostCSS Configuration
- **Location**: `.postcssrc.json`
- **Plugin**: Uses `@tailwindcss/postcss` v4.1.15
- **Purpose**: Processes Tailwind CSS v4

### 4. Styles Import
- **Location**: `src/styles.css`
- **Import**: `@import "tailwindcss";`
- **Additional**: Custom scrollbar and transition styles

### 5. Boot Script
- **Location**: `src/index.html`
- **Timing**: Runs before Angular loads
- **Purpose**: Applies dark class immediately to prevent flash
- **Logic**: Checks localStorage, defaults to dark

## How It Works

1. **Page Load**: `index.html` boot script reads localStorage and applies 'dark' class
2. **Angular Init**: ThemeService initializes with stored preference
3. **Signal Updates**: `isDark` signal triggers effect that updates DOM and localStorage
4. **Toggle**: `themeService.toggle()` updates signal, which triggers effect
5. **Tailwind**: CSS is generated with both light and dark variants based on 'class' selector

## Testing

### Manual Browser Test
1. Open DevTools (F12)
2. Go to Console
3. Run: `document.documentElement.classList.toggle('dark')`
4. Verify page colors change
5. Run: `localStorage.getItem('theme')`
6. Click theme toggle button in app

### Debugging

Check console for logs:
- `🎨 [BOOT]` - Boot script messages
- `🎨 ThemeService` - Service initialization and updates

## Component Usage

### Reading Theme State
```typescript
// In component
themeService.isDark() // Returns boolean

// In template
@if (themeService.isDark()) {
  <!-- Show dark mode icon -->
}
```

### Applying Dark Styles
```html
<div class="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
  This element changes based on dark class on html element
</div>
```

## Troubleshooting

### Theme not changing visually
1. Check DevTools: Is 'dark' class on `<html>` element?
2. Check browser console for errors
3. Clear localStorage: `localStorage.clear()`
4. Hard refresh: Ctrl+Shift+R

### CSS not compiled
1. Check if `tailwindcss` is installed: `npm list tailwindcss`
2. Check if `@tailwindcss/postcss` is installed: `npm list @tailwindcss/postcss`
3. Verify `.postcssrc.json` exists with correct plugin
4. Restart dev server: `npm start`

### Signal not triggering
1. Check ThemeService is injected correctly
2. Verify `effect()` is imported from '@angular/core'
3. Check component uses signals correctly (call with `()`)
