# Agent Orchestration Guide

*This document serves as the "Operating System" for the Autonomous Agent Team. It defines the Universal Protocols for this project.*

## 1. The Team

| Agent | File | Role |
| :--- | :--- | :--- |
| **System Architect** | [SysArchitect.md](file:///c:/Users/Guneev/AppDev/SchoolMatica/SchoolMatica/.agent/roles/SysArchitect.md) | Planner, DB Designer, Technical Lead |
| **CodeSmith** | [CodeSmith.md](file:///c:/Users/Guneev/AppDev/SchoolMatica/SchoolMatica/.agent/roles/CodeSmith.md) | Builder, Refactorer, Type Specialist |
| **PixelPerfect** | [PixelPerfect.md](file:///c:/Users/Guneev/AppDev/SchoolMatica/SchoolMatica/.agent/roles/PixelPerfect.md) | UI/UX Designer, Motion Specialist |
| **GuardRail** | [GuardRail.md](file:///c:/Users/Guneev/AppDev/SchoolMatica/SchoolMatica/.agent/roles/GuardRail.md) | QA, Security Auditor, Optimizer |

## 2. Universal Workflows

| Outcome Needed | Workflow | Description |
| :--- | :--- | :--- |
| **New Feature** | [feature_kickoff.md](file:///c:/Users/Guneev/AppDev/SchoolMatica/SchoolMatica/.agent/workflows/feature_kickoff.md) | End-to-end planning, build, and verify. |
| **Fix "Ugly" UI** | [ui_revamp.md](file:///c:/Users/Guneev/AppDev/SchoolMatica/SchoolMatica/.agent/workflows/ui_revamp.md) | Polish a component to world-class standards. |
| **Fix Bugs/Security** | [code_review.md](file:///c:/Users/Guneev/AppDev/SchoolMatica/SchoolMatica/.agent/workflows/code_review.md) | Audit files and auto-refactor issues. |

## 3. The "Self-Correction" Protocol

**All Agents MUST follow this loop:**

1.  **Execute** the instruction.
2.  **Verify** the output (e.g., "Did the build pass?").
3.  **Correct**: If failed, analyze -> hypothesize -> fix.
4.  **Escalate**: If failed 3x, stop and notify the User.
5.  **Learn**: If a new pattern is discovered, append it to `project_intelligence.md`.
