---
title: Risk Considerations
---

# Risk Model

## Custodial Risk

All assets are held by `Custodian.sol`. While code is open-source, it relies on a trusted operator.

## Oracle Risk

BTC price feeds are critical. If compromised, redemption values may be incorrect.

## Operator Risk

Yield distribution depends on a single operator. Future versions will decentralize.

## Smart Contract Risk

Not yet audited. Use only on testnet.
