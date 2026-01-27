# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records (ADRs) documenting significant technical decisions made in this project.

## What is an ADR?

An ADR is a document that captures an important architectural decision made along with its context and consequences.

## ADR Template

```markdown
# ADR-XXX: Title

## Status

[Proposed | Accepted | Deprecated | Superseded by ADR-XXX]

## Date

YYYY-MM-DD

## Context

[What is the issue that we're seeing that is motivating this decision?]

## Decision

[What is the change that we're proposing and/or doing?]

## Consequences

### Positive

[What are the benefits?]

### Negative

[What are the drawbacks?]

### Mitigation

[How do we address the drawbacks?]

## References

[Links to relevant documentation, articles, or discussions]
```

## Index

| ADR                                  | Title                             | Status   | Date       |
| ------------------------------------ | --------------------------------- | -------- | ---------- |
| [001](./001-state-management.md)     | Use Zustand for State Management  | Accepted | 2024-01-01 |
| [002](./002-styling-approach.md)     | Use NativeWind for Styling        | Accepted | 2024-01-01 |
| [003](./003-data-fetching.md)        | Use React Query for Data Fetching | Accepted | 2024-01-01 |
| [004](./004-auth-adapter-pattern.md) | Auth Adapter Pattern              | Accepted | 2024-01-15 |

## When to Write an ADR

Write an ADR when:

1. Making a significant architectural decision
2. Choosing between multiple valid options
3. The decision will be hard to change later
4. Team members need to understand "why"

## How to Create a New ADR

1. Copy the template above
2. Number it sequentially (e.g., `005-your-decision.md`)
3. Fill in all sections
4. Add it to the index in this README
5. Submit for review with your PR

## Resources

- [ADR GitHub Organization](https://adr.github.io/)
- [Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
