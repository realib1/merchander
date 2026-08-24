---
name: web-accessibility-a11y
description: >-
  Use this skill when implementing UI components, modal dialogs, navigation menus, forms,
  or testing accessibility (WCAG 2.1 AA compliance), keyboard focus, screen reader compatibility,
  and color contrast.
---

# Web Accessibility (A11y) & Usability Guide

This skill provides mandatory standards and practical patterns to ensure the Merchander platform is fully accessible, usable with screen readers, navigable by keyboard, and compliant with **WCAG 2.1 Level AA**.

---

## 1. Core Accessibility Standards

### 1.1 Semantic HTML Structure
Always use proper native HTML elements rather than `<div>` soups:
- Use `<main>`, `<nav>`, `<aside>`, `<header>`, `<footer>`, `<section>` for layout landmarks.
- Headings must follow strict hierarchy: Single `<h1>` per page, followed by `<h2>`, `<h3>` with no skipped levels.
- Interactive controls must use native `<button>` or `<a>` with `href`. Never use `<div onClick={...}>` without `role="button"`, `tabIndex={0}`, and `onKeyDown`.

### 1.2 Accessible Forms & Validation
- **Label Associations**: Every input must have a `<label htmlFor="field-id">` or `aria-label`.
- **Error Linkage**: Associate error messages with inputs using `aria-describedby="error-id"` and `aria-invalid="true"`:
```tsx
<div className="space-y-1.5">
  <label htmlFor="product-price" className="block text-sm font-medium text-slate-200">
    Price (GH₵) <span className="text-rose-400" aria-hidden="true">*</span>
  </label>
  <input
    id="product-price"
    name="price"
    type="number"
    step="0.01"
    required
    aria-required="true"
    aria-invalid={Boolean(errors.price)}
    aria-describedby={errors.price ? "price-error" : undefined}
    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
  />
  {errors.price && (
    <p id="price-error" role="alert" className="text-xs text-rose-400">
      {errors.price}
    </p>
  )}
</div>
```

---

## 2. Keyboard Navigation & Focus Management

### 2.1 Visible Focus Indicators
Never remove focus outlines with `outline: none` without providing a distinct replacement:
```css
/* Accessible focus ring */
*:focus-visible {
  outline: 2px solid #10b981;
  outline-offset: 2px;
}
```

### 2.2 Modal Dialogs & Focus Trapping
When a modal opens:
1. Save the previous focused element.
2. Trap focus inside the modal dialog container (`Escape` key closes dialog).
3. Set `aria-modal="true"` and `role="dialog"`.
4. Restore focus to the triggering element when the modal closes.

```tsx
import { useEffect, useRef } from "react";

export function AccessibleModal({ isOpen, onClose, title, children }: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" role="presentation">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h2 id="modal-title" className="text-lg font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            ✕
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
```

---

## 3. Screen Reader & Dynamic Announcements

### 3.1 Live Regions for Dynamic Updates
Use `aria-live="polite"` for non-critical status updates (e.g. order saved toast) and `aria-live="assertive"` for critical error alerts:
```tsx
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {statusAnnouncement}
</div>
```

### 3.2 Color Contrast Ratios (WCAG AA)
- Normal text (< 18pt): Minimum contrast ratio of **4.5:1** against background.
- Large text (≥ 18pt or 14pt bold): Minimum contrast ratio of **3:1**.
- UI components and graphical objects: Minimum contrast ratio of **3:1**.
- Never rely on color alone to convey meaning (e.g., indicate status with both an icon and text label).
