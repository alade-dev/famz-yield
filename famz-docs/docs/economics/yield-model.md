---
title: Yield Model
---

# Yield Generation

## Yield Sources

- **wBTC**: Simulated on testnet. Future: Lending on Venus.
- **stCORE**: Staking rewards from Earn protocol.

## Yield Distribution

- Operator calls `notifyYield(amount)` weekly.
- Vault mints new `lstBTC` and distributes proportionally.
- Users see balance increase.

## APY Example

- Total Supply: 10 lstBTC
- Weekly Yield: 0.1 BTC
- APY ≈ (0.1 / 10) \* 52 ≈ **5.2%**
