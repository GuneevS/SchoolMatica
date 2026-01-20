# Project Intelligence & Learned Rules

*This document serves as the shared memory for the Autonomous Agents. As workflows succeed or fail, lessons learned should be recorded here to prevent regression.*

## 1. Architectural Patterns
-   **Multi-tenancy**: All DB queries MUST be scoped by `schoolId`.
-   **Auth**: Never rely on `x-user-email` in production code.

## 2. Coding Standards (Learned)
-   *Populate this as CodeSmith encounters recurring linting/type issues.*

## 3. UI/UX Preferences
-   *Populate this as PixelPerfect refines the design language.*
