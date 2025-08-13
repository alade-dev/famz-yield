---
title: Testing
---

# Running Tests

To run the full test suite:

```bash
npx hardhat test
```

---

## Test Coverage

The test suite covers all major flows of the **Famz Vault** system:

### 1. Deployment

- Ensures all contracts (`Vault`, `Custodian`, `LstBTC`, `PriceOracle`) deploy successfully.
- Verifies initial configuration and authorizations (operator, fee receiver, minter rights).

### 2. Deposits

- User deposits **wBTC** and **stCORE** in various ratios.
- Checks that:

  - Assets are transferred to the **Custodian**.
  - The correct amount of `lstBTC` is minted.
  - Deposit ratio calculations match oracle prices.

- Validates reverts for:

  - Deposits below minimum thresholds.
  - Zero-value deposits.

### 3. Redemptions

- Redeems `lstBTC` for underlying assets.
- Tests:

  - Partial and full redemption flows.
  - Burning of `lstBTC`.
  - Asset return from **Custodian**.

- Reverts if:

  - Amount below redemption minimum.
  - User balance is insufficient.

### 4. Yield Distribution (Epoch Flow)

- **Operator-only** actions:

  - `closeEpoch()` – marks end of an epoch.
  - `notifyYield()` – registers yield amounts in wBTC and/or stCORE.
  - `distributeEpochYield()` – mints new `lstBTC` proportionally to holders.

- Tests:

  - wBTC-only yield distribution.
  - stCORE-only yield distribution.
  - Mixed yield distribution.

- Ensures correct total supply growth after yield.

### 5. Admin Functions

- Owner can:

  - Set operator.
  - Change fee receiver.
  - Adjust deposit/redeem minimums.

- Non-owners are restricted from admin actions.

### 6. View Functions

- Retrieves:

  - Total BTC-equivalent value.
  - Current oracle prices.
  - User balances and BTC values.

### 7. Fee Collection

- Allows fee receiver to collect ETH fees from the vault.
- Reverts if no fees are available.

---

## Example: Running a Specific Test File

```bash
npx hardhat test test/vault-new.test.js
```

---

## Example: Running a Specific Test Case

```bash
npx hardhat test --grep "Should inject and distribute epoch yield correctly"
```

---

## Notes

- The tests simulate **time travel** using Hardhat’s `evm_increaseTime` to move past the epoch duration.
- All token amounts respect their decimal places:

  - **wBTC:** 8 decimals.
  - **stCORE & lstBTC:** 18 decimals.

- Mock tokens and a mock price oracle are used for consistent results.

---

✅ If all tests pass, you should see:

```
21 passing (YYs)
0 failing
```
