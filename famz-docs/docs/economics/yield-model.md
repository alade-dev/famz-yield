---
title: Yield Model
---

# Yield Generation

## Yield Sources

- **wBTC**: Simulated on testnet. In production, could come from lending protocols (e.g., Venus) or BTC-native yield strategies.
- **stCORE**: Staking rewards from Earn protocol or other CORE-based strategies.

## Epoch-Based Yield System

- The system operates in **24-hour epochs**.
- Users who deposit **must wait until the current epoch ends** before becoming eligible for yield in the next epoch.
- Withdrawals are also delayed until the end of the epoch to simplify accounting and yield distribution.
- This batching mechanism ensures:
  - Yield is distributed fairly to only active participants in a given epoch.
  - Clear tracking of funds per epoch for strategy allocation.

## Dual-Asset Yield Tracking

- Yields for **wBTC** and **stCORE** are tracked **separately**.
- Each asset’s yield is calculated in its native token and converted to a BTC-equivalent value using the `PriceOracle`.
- A user’s yield share is based on:
  1. Their deposit ratio of wBTC to stCORE (BTC-equivalent value at deposit).
  2. The yield accrued by each asset class in the epoch.

## Yield Flow

1. **Epoch Close**

   - Operator calls `closeEpoch()` to lock in participants for the round.

2. **Yield Injection**

   - Operator transfers yield (wBTC and/or stCORE) to the `Custodian`.
   - Operator calls `notifyYield(wBTCYield, stCOREYield)`.

3. **Distribution**

   - Operator calls `distributeEpochYield()` to mint new `lstBTC` to participants proportionally to their share of BTC-equivalent value in that epoch.

4. **User Balances Update**
   - Users see increased `lstBTC` balances, representing both principal and yield.

## APY Example

- Total Supply: 10 lstBTC
- Epoch Yield (1 day): 0.02 BTC (0.015 BTC from wBTC strategies, 0.005 BTC from stCORE strategies)
- Daily APY ≈ (0.02 / 10) × 365 ≈ **73% annualized**  
  _(For illustration; real APY depends on strategy performance.)_

---

## Advantages of Epoch-Based Model

- **Fairness:** Only participants within the epoch share the yield.
- **Operational Efficiency:** Batch deposits/withdrawals and yield distribution.
- **Transparency:** Clear record of yields per asset type and epoch.
- **Flexibility:** Supports multiple yield sources with different schedules.
