// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ICustodianAdapter
 * @author Team
 * @notice Interface for a custodian adapter that calculates BTC-backed value of assets
 * @dev This interface defines the core functions for:
 *      - Valuing deposits (wBTC + LST)
 *      - Converting BTC amounts to token amounts
 *      - Querying total BTC backing of the vault
 *      Implementations may use price oracles, yield models, or off-chain data.
 */
interface ICustodianAdapter {

    /**
     * @notice Calculates the total BTC value of a wBTC and LST deposit
     * @dev Value is returned in 8 decimal places (sats)
     *      LST value is computed using internal price oracle (CORE-based)
     * @param amountWBTC Amount of wBTC in sats (8 decimals)
     * @param amountLST Amount of LST token in its native decimals (e.g., 18)
     * @param lstToken Address of the LST token
     * @return totalSats Total value in BTC sats (8 decimals)
     */
    function getValue(
        uint256 amountWBTC,
        uint256 amountLST,
        address lstToken
    ) external view returns (uint256 totalSats);

    /**
     * @notice Converts a BTC amount in 18 decimals to wBTC in 8 decimals (sats)
     * @dev Used to convert internal 18-decimal BTC calculations to wBTC units
     *      Truncates precision from 1e18 → 1e8
     * @param valueBTC BTC amount in 18 decimal places (e.g., 1e18 = 1 BTC)
     * @return wBTC amount in 8 decimal places (sats, e.g., 1e8 = 1 wBTC)
     */
    function btcToWBTC(uint256 valueBTC) external pure returns (uint256);

    /**
     * @notice Converts a BTC amount to the equivalent LST token amount
     * @dev Uses internal price oracle to determine LST/CORE and CORE/BTC rates
     *      Reverts if LST price is not set
     * @param valueBTC BTC amount in 18 decimal places
     * @param lstToken Address of the LST token to convert to
     * @return Amount of LST tokens equivalent to the BTC value
     */
    function btcToLST(uint256 valueBTC, address lstToken) external view returns (uint256);

    /**
     * @notice Calculates the total BTC backing of the entire vault
     * @dev Includes wBTC balance and BTC value of all LST holdings
     *      Value is returned in 18 decimal places for high precision
     *      Used for calculating exchange rates and redemption payouts
     * @return totalBTC Total BTC backing in 18 decimal places
     */
    function getTotalVaultBTCBacking() external view returns (uint256 totalBTC);
}