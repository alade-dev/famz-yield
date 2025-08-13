---
title: Understanding Yield
---

# How Yield Works

Famz Yield distributes rewards from **two asset types** — **wBTC** and **stCORE** — using a **24-hour epoch system**.  
This ensures fair, predictable yield allocation while allowing transparent tracking of each asset’s contribution.

---

## Yield Sources

- **wBTC**: Lending strategies or Bitcoin-native yield opportunities (simulated on testnet).
- **stCORE**: Staking rewards from other LST-based strategies.

---

## Epoch-Based Distribution

- **Epoch Duration**: 24 hours
- **Start Time**: Set at contract deployment
- **Next Epoch**: Users depositing or redeeming must wait until the next epoch to see the change reflected.

### Flow:

1. **Deposit Phase** — Users deposit wBTC and/or stCORE into the Vault.
2. **Earning Phase** — Funds are held by `Custodian.sol` and may be deployed in yield strategies.
3. **Operator Action** — At the end of each epoch, the operator:
   - Transfers accrued wBTC and stCORE yield to the Custodian.
   - Calls `notifyYield(wBTCYield, stCOREYield)`.
4. **Distribution Phase** — Vault calculates each user’s share based on:
   - Their **BTC-equivalent balance**.
   - Their original **deposit ratio** between wBTC and stCORE.
5. **Minting** — New `lstBTC` is minted and distributed to holders in proportion to their BTC-equivalent holdings.

---

## Dual-Asset Yield Tracking

Yield is tracked **separately** for each asset type:

- **wBTC Yield**: Calculated using wBTC decimals (8).
- **stCORE Yield**: Calculated using 18 decimals and converted to BTC-equivalent value using `PriceOracle.sol`.
- The final reward is the **sum** of BTC-equivalent yields, issued as `lstBTC`.

---

## Example Calculation

**User A** deposits:

- 1.0 wBTC
- 10 stCORE (worth 0.05 BTC via price oracle)

**Epoch Yield**:

- wBTC Yield: 0.10 wBTC
- stCORE Yield: 1 stCORE (worth 0.005 BTC)

**User’s Share**:

- BTC-equivalent deposit: 1.05 BTC (≈ 95% of total vault BTC value)
- User receives: 0.095 BTC in new `lstBTC`.

---

## Key Benefits of Epoch System

- **Fairness** — Only users present for a full epoch share in its yield.
- **Transparency** — Yield sources tracked separately for wBTC and stCORE.
- **Predictability** — Users know when yield will be distributed.
- **Simplicity** — Single mint event per epoch.

---

> ⚠️ **Reminder**: This system is live on testnet only. Mainnet deployment will follow after a full security audit.
