---
title: Smart Contracts
---

# Core Contracts

## `Vault.sol`

- **Primary user-facing contract** handling deposits, redemptions, and yield distribution.
- **Mints and burns** `lstBTC` to represent BTC-equivalent value of user positions.
- **Supports dual-asset deposits**:
  - Wrapped Bitcoin (`wBTC`)
  - Staked CORE (`stCORE`)
- **Epoch-based system**:
  - Operates in fixed 24-hour rounds (“epochs”).
  - New deposits and redemption requests are locked until the next epoch.
  - Yield is calculated and distributed only at epoch close.
- **Operator-driven yield injection**:
  - Only the designated `operator` can close an epoch, inject yield, and trigger distribution.
  - Yield can be in either wBTC, stCORE, or both.
- **Per-asset yield tracking**:
  - Yields accrued on `wBTC` and `stCORE` are tracked separately.
  - Yield distribution is proportional to the user’s deposit ratio in each asset.
- **Security features**:
  - Enforces minimum deposit/redeem amounts.
  - Admin-controlled operator and fee receiver settings.
  - Protocol fee collection in CORE native token.

---

## `Custodian.sol`

- **Secure asset custody** for wBTC and stCORE.
- Handles deposit ratio calculations for BTC-equivalent valuation.
- Acts as the vault’s trusted settlement layer for:
  - Receiving deposits from the vault.
  - Holding yield before distribution.
  - Returning assets during redemption.
- Works with `PriceOracle` to ensure fair BTC value calculations for mixed assets.

---

## `LstBTCNew.sol`

- ERC-20 token representing **liquid staked BTC value**.
- **1 lstBTC = 1 BTC** in value, based on the vault’s BTC-equivalent accounting.
- Minting rights are restricted to the `Vault`.
- Supports minting both for:
  - Initial deposits.
  - Yield distributions at epoch close.

---

## `PriceOracle.sol`

- On-chain price feed provider for:
  - `stCORE` → `CORE`
  - `CORE` → `BTC`
- Used by `Vault` and `Custodian` for:
  - Converting deposits and redemptions into BTC-equivalent values.
  - Calculating mixed-asset yields.
- Flexible for upgrading or replacing data sources.

---

## Key System Flow

1. **Deposit Phase**

   - Users deposit any combination of wBTC and stCORE into the vault.
   - Deposits are locked until the next epoch close.

2. **Epoch Close (24h)**

   - Operator closes the epoch.
   - Yield (wBTC, stCORE, or both) is injected into the custodian.
   - Vault calculates per-asset yield share and distributes additional lstBTC to depositors.

3. **Redemption Phase**
   - Users request redemption of lstBTC.
   - Redemption is processed at the next epoch close, ensuring yield calculations remain accurate.

---

## Professional Notes

- **Epoch-based locking** simplifies yield accounting and ensures fair distribution.
- **Dual-asset yield accounting** allows the protocol to support diverse strategies for wBTC and stCORE separately.
- **Operator role** is critical for secure yield injection and timing control.
