# Task 7 fix 4 report

SHA: `a9160584ac0878246607dc53cc23f17ffaaf824c`.

Root cause: intake accepted blank derivative/exterior although persisted vehicles require nonempty values; reload recovered seed. Submission now uses `Standard` and `Unspecified` defaults.

Tests: `completes four-step intake, persists the vehicle, gallery paths, and audit`; `writes typed targets for task, lead, deal, finance, and service mutations`; `recovers deterministic seed from legacy activity without targets`; `recovers deterministic seed from unknown activity target type`; `recovers deterministic seed from dangling activity target`.

Verification: focused Task 7/repository/seed suite 45/45 passed; typecheck passed; full suite 84/84 passed (up from 79); production build and `git diff --check` passed; working tree clean.
