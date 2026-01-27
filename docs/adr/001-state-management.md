# ADR-001: Use Zustand for State Management

## Status

Accepted

## Date

2024-01-01

## Context

We need a state management solution for our React Native application. The requirements are:

1. Simple API with minimal boilerplate
2. Good TypeScript support
3. Small bundle size (mobile performance matters)
4. Support for persistence
5. Devtools support for debugging
6. No need for complex middleware or actions

Options considered:

- **Redux Toolkit**: Industry standard, but verbose for our needs
- **MobX**: Powerful but adds complexity with observables
- **Jotai**: Atomic state, good for simple cases
- **Zustand**: Simple, small, flexible
- **React Context**: Built-in, but can cause performance issues

## Decision

We chose **Zustand** for global state management.

## Rationale

1. **Simplicity**: Creating a store is just a function call

   ```ts
   const useStore = create((set) => ({
     count: 0,
     increment: () => set((s) => ({ count: s.count + 1 })),
   }));
   ```

2. **Bundle size**: ~1KB gzipped vs Redux's ~7KB

3. **TypeScript**: Excellent inference, minimal type annotations needed

4. **Persistence**: Easy integration with AsyncStorage via middleware

5. **No Providers**: Works outside React components, useful for API services

6. **Selective subscriptions**: Components only re-render when selected state changes

## Consequences

### Positive

- Faster development with less boilerplate
- Smaller bundle size
- Easy to test stores
- Can use stores outside React (e.g., in API handlers)

### Negative

- Less structured than Redux (could lead to inconsistent patterns)
- Smaller ecosystem than Redux
- Team needs to establish conventions

### Mitigation

- Document store patterns in CONTRIBUTING.md
- Use TypeScript for store definitions
- Keep stores focused (one concern per store)

## References

- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [React Native Performance](https://reactnative.dev/docs/performance)
