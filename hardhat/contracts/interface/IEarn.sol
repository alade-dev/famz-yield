// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IEarn
 * @author Team
 * @notice Interface for yield-bearing or staking contracts
 * @dev Defines the minimal functionality required for integration with the Vault
 *      to track and realize yield from staked assets (e.g., stCORE, stETH)
 *      Implementations may represent liquid staking tokens, staking pools, or vaults
 */
interface IEarn {
    /**
     * @notice Returns the current exchange rate between the yield-bearing token and its underlying base token
     * @dev The rate is typically expressed in 18 decimals.
     *      For example, if 1 stCORE = 1.41 CORE, this function returns 1.41e18.
     *      Used by the Vault to calculate the total BTC-backed value of staked assets.
     * @return The current exchange rate (yield-bearing token : base token) in 18 decimal places
     */
    function getCurrentExchangeRate() external view returns (uint256);
}