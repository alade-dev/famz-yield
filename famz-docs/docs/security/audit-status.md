---
title: Audit Status
---

# Audit Status

- 🧪 **Current**: Testnet only — not yet audited
- 🛠️ **Planned**: Third-party audit (e.g., Halborn, CertiK) before mainnet launch
- ✅ **Internal Testing**:
  - 21+ passing Hardhat tests covering deposits, redemptions, epoch rollovers, and yield distribution
  - Dual-asset yield tracking verified for both wBTC and stCORE
- 🔍 **Static Analysis**:
  - Slither vulnerability review completed — no critical issues found
- 🔒 **Security Features**:
  - `nonReentrant` protection on state-changing functions
  - `onlyOwner` and `onlyOperator` access control
  - Pausable contract for emergency stops
  - Oracle price validation to prevent manipulation
  - Epoch-based withdrawal delay to protect against flash-loan exploits

> ⚠️ Use only on testnet. Do not deposit real funds until third-party audit is complete.
