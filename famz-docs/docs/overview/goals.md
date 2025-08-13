---
title: Goals
---

# Project Goals

- Provide a **seamless BTC-based yield mechanism** on CORE.
- Allow users to deposit **wBTC** and approved **Liquid Staking Tokens (LSTs)** like `stCORE` into a **single yield-bearing token** (`lstBTC`).
- Implement a **dual-asset yield model**, tracking and distributing yields from wBTC and stCORE separately for fairness.
- Operate on a **24-hour epoch system**:
  - Users start earning yield from the next epoch after deposit.
  - Withdrawals are processed at the end of the current epoch.
  - Simplifies yield accounting and ensures equitable distribution.
- Maintain **liquidity** while enabling users to earn staking rewards and lending returns.
- Ensure **secure and transparent asset custody** via the `Custodian` contract.
- Use `PriceOracle` to fairly convert all assets into BTC-equivalent values for minting, redemption, and yield distribution.
