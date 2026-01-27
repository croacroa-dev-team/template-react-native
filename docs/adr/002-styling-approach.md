# ADR-002: Use NativeWind (Tailwind CSS) for Styling

## Status

Accepted

## Date

2024-01-01

## Context

We need a consistent styling approach for our React Native application. The requirements are:

1. Developer productivity (fast to write styles)
2. Consistent design system
3. Dark mode support
4. Good performance
5. Familiar to web developers

Options considered:

- **StyleSheet.create**: React Native's built-in solution
- **Styled Components**: CSS-in-JS, popular in web
- **NativeWind**: Tailwind CSS for React Native
- **Tamagui**: Universal design system
- **Dripsy**: Responsive design system

## Decision

We chose **NativeWind** (Tailwind CSS for React Native).

## Rationale

1. **Developer Experience**: Utility classes are fast to write

   ```tsx
   // NativeWind
   <View className="p-4 bg-white rounded-xl shadow-lg">

   // StyleSheet
   <View style={[styles.container, styles.rounded, styles.shadow]}>
   ```

2. **Design System**: Tailwind's design tokens ensure consistency

3. **Dark Mode**: Built-in support with `dark:` prefix

   ```tsx
   <View className="bg-white dark:bg-slate-900">
   ```

4. **Responsive Design**: Support for breakpoints

   ```tsx
   <View className="p-2 md:p-4 lg:p-6">
   ```

5. **Familiarity**: Web developers already know Tailwind

6. **Performance**: Compiled at build time, no runtime overhead

## Consequences

### Positive

- Faster styling with utility classes
- Consistent spacing, colors, typography
- Easy dark mode implementation
- Small runtime footprint
- Web developers can contribute quickly

### Negative

- Long className strings can be hard to read
- Learning curve for Tailwind utilities
- Some RN-specific styles need custom config

### Mitigation

- Use `cn()` utility to organize classes
- Create component abstractions for complex patterns
- Document custom Tailwind config

## Implementation

### Configuration

```js
// tailwind.config.js
module.exports = {
  content: ["./app/**/*.{js,tsx}", "./components/**/*.{js,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          /* ... */
        },
        background: { light: "#fff", dark: "#0f172a" },
      },
    },
  },
};
```

### Usage Pattern

```tsx
import { cn } from "@/utils/cn";

function Card({ className, ...props }) {
  return (
    <View
      className={cn(
        "p-4 rounded-xl",
        "bg-white dark:bg-slate-800",
        "border border-gray-200 dark:border-gray-700",
        className
      )}
      {...props}
    />
  );
}
```

## References

- [NativeWind Documentation](https://www.nativewind.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
