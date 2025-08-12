---
title: Smart Contracts
---

# Core Contracts

## `VaultNew.sol`

- User-facing contract for deposits, redemptions, and yield.
- Mints and burns `lstBTC`.

## `Custodian.sol`

- Securely holds wBTC and stCORE.
- Manages deposit ratios and redemption logic.

## `LstBTCNew.sol`

- ERC-20 token where 1 lstBTC = 1 BTC in value.
- Only `VaultNew` can mint.

## `PriceOracle.sol`

- Provides `stCORE/CORE` and `CORE/BTC` prices.
- Used for fair BTC-equivalent valuation.
