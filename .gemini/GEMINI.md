
You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

## TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain

## Angular Best Practices

- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default in Angular v20+.
- Use signals for state management
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.

## Accessibility Requirements

- It MUST pass all AXE checks.
- It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes.

### Components

- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `computed()` for derived state
- Set `changeDetection: ChangeDetectionStrategy.OnPush` in `@Component` decorator
- Prefer inline templates for small components
- Prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead
- When using external templates/styles, use paths relative to the component TS file.

## State Management

- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead

## Templates

- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables
- Do not assume globals like (`new Date()`) are available.
- Do not write arrow functions in templates (they are not supported).

## Services

- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Use the `inject()` function instead of constructor injection

---

## 🎨 Design System – Colors (MANDATORY)

This project uses a **strict global semantic color system**.

🚨 AI MUST FOLLOW THESE RULES:

* Never invent new colors.
* Never hardcode hex values outside this list.
* Never use random Tailwind colors.
* Never inline color styles in components.
* All UI colors must reference these tokens only.
* Always use CSS variables (`var(--color-*)`).
* Must support dynamic theme switching.
* If a required color is missing → STOP and request approval.

---

# 🎯 Approved Color Tokens

## Primary (Brand)

* primary-main: `#CAC7FF`
* primary-light: `#E4E2FF`
* primary-dark: `#A5A1E8`

---

## Secondary (Accent)

* secondary-main: `#F1DAFB`
* secondary-light: `#FAEDFF`
* secondary-dark: `#D8B9E6`

---

## Info

* info-main: `#0284C7`
* info-light: `#7DD3FC`
* info-dark: `#0369A1`

---

## Success

* success-main: `#16A34A`
* success-light: `#86EFAC`
* success-dark: `#166534`

---

## Warning

* warning-main: `#F59E0B`
* warning-light: `#FCD34D`
* warning-dark: `#B45309`

---

## Error

* error-main: `#DC2626`
* error-light: `#FCA5A5`
* error-dark: `#991B1B`

---

# 🧠 Usage Rules (STRICT)

## ✅ Always

* Use semantic tokens only
* Use `*-main` for primary actions
* Use `*-light` for soft backgrounds
* Use `*-dark` for hover/active states
* Reference via CSS variables
* Follow Angular Material theme system

## ❌ Never

* Hardcode hex values
* Use rgb(), hsl(), or named colors
* Use inline styles
* Create custom color names
* Override theme locally

---

# 🎨 CSS Variable Definition Location

All tokens must be defined in:

```
src/styles/_colors.scss
```

Example:

```scss
:root {
  --color-primary-main: #CAC7FF;
  --color-primary-light: #E4E2FF;
  --color-primary-dark: #A5A1E8;

  --color-secondary-main: #F1DAFB;
  --color-secondary-light: #FAEDFF;
  --color-secondary-dark: #D8B9E6;
}
```

---

# 🧩 Example Usage

```css
.button--primary {
  background-color: var(--color-primary-main);
  color: white;
}

.button--primary:hover {
  background-color: var(--color-primary-dark);
}

.badge--secondary {
  background-color: var(--color-secondary-light);
  color: var(--color-primary-main);
}

.alert--error {
  background-color: var(--color-error-light);
  border: 1px solid var(--color-error-main);
}
```

---

# 🅰️ Angular Material Usage (MANDATORY)

### Theme Configuration Required

* Configure palette using these values
* Do NOT hardcode hex inside components

### Buttons

```html
<button mat-raised-button color="primary">Save</button>
<button mat-raised-button color="accent">Secondary</button>
<button mat-raised-button color="warn">Delete</button>
```

### Alert Mapping

| UI State | Token        |
| -------- | ------------ |
| info     | info-main    |
| success  | success-main |
| warning  | warning-main |
| error    | error-main   |

---

# 🔒 Enforcement Checklist

Before generating CSS:

* [ ] No hardcoded hex
* [ ] No Tailwind random colors
* [ ] No inline styles
* [ ] Only approved tokens used
* [ ] Supports dark mode
* [ ] Angular Material compliant

