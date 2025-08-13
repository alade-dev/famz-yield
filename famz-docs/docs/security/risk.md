---
title: Risk Considerations
---

# Risk Model

## Custodial Risk

All wBTC and stCORE deposits are held by `Custodian.sol`.  
While the code is open-source and protected by strict access controls, the custodian is a central point of asset storage.  
Loss or compromise of this contract could impact all user funds.

## Oracle Risk

Accurate BTC and CORE price feeds are critical for fair BTC-equivalent valuations and yield calculations.  
If the oracle is compromised or provides stale data, redemption values and yield distributions may be incorrect.

## Operator Risk

An authorized operator is responsible for:
- Closing each 24-hour epoch
- Injecting and notifying yields for both wBTC and stCORE  
- Initiating yield distribution

Until governance is decentralized, yield timing and amounts depend on the honesty and availability of the operator.

## Epoch Timing Risk

The 24-hour epoch system means:
- Deposits start earning yield only in the next epoch
- Redemptions are processed at the end of an epoch  
This delay improves yield accounting but reduces instant liquidity.

## Smart Contract Risk

- **Audit Status**: Internal tests + Slither vulnerability review (no critical findings), but **no external audit yet**.
- Bugs, logic errors, or unforeseen interactions with other protocols could cause loss of funds.

> ⚠️ **Use only on testnet** until the system undergoes a full third-party audit.
