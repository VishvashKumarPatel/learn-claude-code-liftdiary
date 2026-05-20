# UI Coding Standards

## Component Library

**All UI components must use [shadcn/ui](https://ui.shadcn.com/) exclusively.**

- Do **not** create custom UI components. Every interactive element, layout primitive, form control, feedback widget, and display component must come from shadcn/ui.
- If a needed component does not yet exist in the project, install it via the CLI:
  ```bash
  npx shadcn@latest add <component-name>
  ```
- Components are installed into `components/ui/` — never modify these generated files directly. Extend behavior by composing them, not by editing the source.
- Tailwind utility classes may be used to adjust spacing, sizing, or color tokens on top of shadcn/ui components, but structural or behavioural overrides must not bypass the component API.

## Date Formatting

All dates must be formatted using [date-fns](https://date-fns.org/).

### Required Format

```
1st Sept 2025
2nd Aug 2025
3rd Sept 2026
4th Jun 2026
```

This is: **ordinal day · abbreviated month · 4-digit year** (`do MMM yyyy` in date-fns format tokens).

### Usage

```ts
import { format } from "date-fns";

format(date, "do MMM yyyy"); // "1st Sept 2025"
```

### Rules

- Never use `new Date().toLocaleDateString()`, `Intl.DateTimeFormat`, or hand-rolled date strings.
- Always pass a valid `Date` object to `format`. Parse strings with `parseISO` before formatting:
  ```ts
  import { format, parseISO } from "date-fns";

  format(parseISO(isoString), "do MMM yyyy");
  ```
- Relative time labels (e.g. "3 days ago") must also use date-fns utilities such as `formatDistanceToNow`.
