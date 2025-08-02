// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../interface/ICustodianAdapter.sol";
import "hardhat/console.sol";

/**
 * @title IVault Interface
 * @author Team
 * @notice Minimal interface to access wBTC token address from Vault
 * @dev Used by MockCustodianAdapter to query the wBTC token address
 */
interface IVault {
    /**
     * @notice Returns the address of the wBTC token used by the Vault
     * @return The wBTC token contract address
     */
    function wBTC() external view returns (address);
}

/**
 * @title MockCustodianAdapter
 * @author Team
 * @notice A mock implementation of ICustodianAdapter for testing
 * @dev Simulates BTC backing value of assets held in the Vault
 *      Uses internal price oracles for wBTC and LST tokens
 *      Intended for test environments only
 */
contract MockCustodianAdapter is Ownable, ICustodianAdapter {
    /// @notice Address of the Vault contract
    address public vault;

    /// @notice Price of 1 BTC in CORE (1e18 base), e.g., 234,000 CORE/BTC
    uint256 public btcPriceInCORE = 234000 * 1e18;

    /// @notice Mapping of LST token addresses to their CORE price (1e18 base)
    mapping(address => uint256) public lstPriceInCORE;

    /// @notice List of known LST tokens tracked for BTC backing calculation
    address[] public knownLSTs;

    /**
     * @notice Constructs the MockCustodianAdapter with an owner
     * @param initialOwner The initial owner of the contract
     */
    constructor(address initialOwner) Ownable(initialOwner) {}

    // --- Admin Functions --- //

    /**
     * @notice Sets the price of a given LST token in CORE
     * @dev Only callable by the owner
     * @param lst The LST token address
     * @param priceCORE The price of 1 LST in CORE (1e18 base)
     */
    function setLSTPriceInCORE(address lst, uint256 priceCORE) external onlyOwner {
        require(priceCORE > 0, "Price must be > 0");
        lstPriceInCORE[lst] = priceCORE;
    }

    /**
     * @notice Updates the BTC to CORE price
     * @dev Only callable by the owner
     * @param price The new BTC price in CORE (1e18 base)
     */
    function setBTCToCOREPrice(uint256 price) external onlyOwner {
        require(price > 0, "Price must be > 0");
        btcPriceInCORE = price;
    }

    /**
     * @notice Adds an LST token to the list of tracked tokens
     * @dev Only callable by the owner
     * @param token The LST token address to add
     */
    function addKnownLST(address token) external onlyOwner {
        knownLSTs.push(token);
    }

    /**
     * @notice Returns the list of all known LST tokens
     * @return An array of LST token addresses
     */
    function getKnownLSTs() external view returns (address[] memory) {
        return knownLSTs;
    }

    /**
     * @notice Sets the Vault contract address
     * @dev Only callable by the owner
     * @param _vault The Vault contract address
     */
    function setVault(address _vault) external onlyOwner {
        require(_vault != address(0), "Zero vault");
        vault = _vault;
    }

    // --- Core Logic --- //

    /// @inheritdoc ICustodianAdapter
    function getValue(
        uint256 amountWBTC,
        uint256 amountLST,
        address lstToken
    ) external view override returns (uint256 totalSats) {
        // wBTC is already in 8 decimals (sats)
        totalSats = amountWBTC;

        if (amountLST > 0) {
            uint256 lstPriceCORE = lstPriceInCORE[lstToken];
            require(lstPriceCORE > 0, "LST price not set");

            // Step 1: LST → CORE
            uint256 lstValueCORE = (amountLST * lstPriceCORE) / 1e18;

            // Step 2: CORE → BTC (in 18 decimals)
            uint256 lstValueBTC18 = (lstValueCORE * 1e18) / btcPriceInCORE;

            // Step 3: Convert 18-decimal BTC → 8-decimal sats
            uint256 lstValueSats = lstValueBTC18 / 1e10;

            totalSats += lstValueSats;
        }
    }

    /// @inheritdoc ICustodianAdapter
    function btcToWBTC(uint256 valueBTC) external pure override returns (uint256) {
        return valueBTC / 1e10; // 1e18 → 1e8
    }

    /// @inheritdoc ICustodianAdapter
    function btcToLST(uint256 valueBTC, address lstToken) external view override returns (uint256) {
        uint256 lstPriceCORE = lstPriceInCORE[lstToken];
        require(lstPriceCORE > 0, "LST price not set");

        // BTC → CORE
        uint256 coreValue = (valueBTC * btcPriceInCORE) / 1e18;

        // CORE → LST
        return (coreValue * 1e18) / lstPriceCORE;
    }

    /// @inheritdoc ICustodianAdapter
    function getTotalVaultBTCBacking() external view override returns (uint256 totalBTC) {
        require(vault != address(0), "Vault not set");

        address wbtc = IVault(vault).wBTC();
        uint256 wbtcBalance = IERC20(wbtc).balanceOf(vault);

        // Convert wBTC balance (8 decimals) to BTC in 18 decimals
        totalBTC = wbtcBalance * 1e10;

        // Add BTC value of each known LST
        for (uint256 i = 0; i < knownLSTs.length; i++) {
            address lst = knownLSTs[i];
            uint256 bal = IERC20(lst).balanceOf(vault);
            uint256 priceCORE = lstPriceInCORE[lst];
            if (priceCORE > 0) {
                uint256 coreValue = (bal * priceCORE) / 1e18;
                uint256 btcValue18 = (coreValue * 1e18) / btcPriceInCORE;
                totalBTC += btcValue18;
            }
        }
    }
}