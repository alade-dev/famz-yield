// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { Address } from "@openzeppelin/contracts/utils/Address.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import "./LstBTC.sol";
import "./interface/ICustodianAdapter.sol";
import "./interface/IEarn.sol";

/**
 * @title Vault
 * @author Team
 * @notice Core vault contract for depositing wBTC and LST to receive yield-bearing lstBTC
 * @dev Users deposit wBTC and LST to mint lstBTC. They can later redeem lstBTC to receive
 *      underlying assets back based on current BTC backing and deposit composition.
 *      The exchange rate increases as yield is realized.
 */
contract Vault is Ownable, ReentrancyGuard {
    using Address for address payable;

    /// @notice Base unit for fee calculations (1e6 = 100%)
    uint256 private constant RATE_BASE = 1e6;

    /// @notice Address of the wBTC token (8 decimals)
    address public wBTC;

    /// @notice Address of the custodian adapter for BTC valuation
    address public custodianAdapter;

    /// @notice The lstBTC token representing staked position
    LstBTC public lstBTC;

    /// @notice Yield-bearing contract (e.g., stCORE vault)
    IEarn public earn;

    /// @notice Price of 1 wBTC in USD (8 decimals, e.g., $118,000 = 118_000 * 1e8)
    uint256 public wbtcPriceUSD;

    /// @notice Price of 1 CORE in USD (8 decimals, e.g., $0.5 = 0.5 * 1e8)
    uint256 public corePriceUSD;

    /// @notice Minimum wBTC deposit amount in sats (8 decimals)
    uint256 public depositMinAmount;

    /// @notice Minimum lstBTC amount required to redeem
    uint256 public redeemMinAmount;

    /// @notice Fee points for protocol fee (1e6 = 100%, e.g., 10,000 = 1%)
    uint256 public protocolFeePoints;

    /// @notice Address to receive protocol fees in ETH (CORE)
    address public protocolFeeReceiver;

    /// @notice Address authorized to perform operator functions (e.g., update prices)
    address public operator;

    /// @notice Mapping of LST tokens that are whitelisted for deposit
    mapping(address => bool) public isLSTWhitelisted;

    /// @notice User deposit history: tracks each deposit's wBTC, LST, and timestamp
    struct Deposit {
        uint256 wbtcAmount;      // Amount of wBTC deposited (in sats)
        uint256 lstTokenAmount;  // Amount of LST token deposited (in its native decimals)
        address lstToken;        // Address of the LST token
        uint256 depositTime;     // Timestamp of deposit
    }

    /// @notice Mapping from user address to their deposit history
    mapping(address => Deposit[]) public deposits;

    // --- EVENTS ---

    /**
     * @notice Emitted when a user successfully deposits assets
     * @param user The address of the depositor
     * @param amountWBTC The amount of wBTC deposited (in sats)
     * @param amountLST The amount of LST deposited
     * @param lstToken The address of the LST token
     * @param lstBTC The amount of lstBTC minted
     */
    event DepositSuccessful(address indexed user, uint256 amountWBTC, uint256 amountLST, address indexed lstToken, uint256 lstBTC);

    /**
     * @notice Emitted when a user redeems lstBTC for underlying assets
     * @param user The address of the redeemer
     * @param lstBTC The amount of lstBTC burned
     * @param wbtcOut The amount of wBTC transferred out (in sats)
     * @param lstOut The amount of LST transferred out
     */
    event Redeem(address indexed user, uint256 lstBTC, uint256 wbtcOut, uint256 lstOut);

    /**
     * @notice Emitted when the exchange rate is updated due to yield
     * @param newRate The new exchange rate (1e18 base), where 1 lstBTC = newRate / 1e18 BTC
     */
    event UpdateExchangeRate(uint256 newRate);

    /**
     * @notice Emitted when oracle prices are updated
     * @param wbtcPrice New wBTC price in USD (8 decimals)
     * @param corePrice New CORE price in USD (8 decimals)
     */
    event UpdateOraclePrices(uint256 wbtcPrice, uint256 corePrice);

    /**
     * @notice Emitted when the fee receiver address is updated
     * @param receiver The new fee receiver address
     */
    event UpdateFeeReceiver(address receiver);

    /**
     * @notice Emitted when the protocol fee points are updated
     * @param points The new fee points (1e6 = 100%)
     */
    event UpdateFeePoints(uint256 points);

    /**
     * @notice Emitted when the operator address is updated
     * @param operator The new operator address
     */
    event UpdateOperator(address operator);

    /**
     * @notice Emitted when protocol fees are collected in ETH (CORE)
     * @param amountCORE The amount of ETH collected
     */
    event FeeCollectedInCORE(uint256 amountCORE);

    /**
     * @notice Emitted when the minimum deposit amount is updated
     * @param amount The new minimum deposit amount in sats
     */
    event UpdateDepositMinAmount(uint256 amount);

    /**
     * @notice Emitted when the minimum redeem amount is updated
     * @param amount The new minimum redeem amount in lstBTC
     */
    event UpdateRedeemMinAmount(uint256 amount);

    /**
     * @notice Constructs the Vault with required dependencies
     * @param _lstBTC Address of the lstBTC token contract
     * @param _adapter Address of the custodian adapter for BTC valuation
     * @param _wbtc Address of the wBTC token
     * @param _earn Address of the yield-bearing contract (e.g., stCORE vault)
     * @param initialOwner The initial owner of the contract
     */
    constructor(
        address _lstBTC,
        address _adapter,
        address _wbtc,
        address _earn,
        address initialOwner
    ) Ownable(initialOwner) {
        require(_lstBTC != address(0) && _adapter != address(0), "Zero address");
        require(_wbtc != address(0), "Zero WBTC");
        wBTC = _wbtc;
        lstBTC = LstBTC(_lstBTC);
        custodianAdapter = _adapter;
        earn = IEarn(_earn);

        depositMinAmount = 100;  // 0.000001 BTC in sats
        redeemMinAmount = 1e18;  // 1 lstBTC
        protocolFeePoints = 0;
        wbtcPriceUSD = 118_000 * 1e8; // $118k
        corePriceUSD = 0.5 * 1e8;    // $0.5
    }

    /// @notice Modifier to restrict access to the operator
    modifier onlyOperator() {
        require(msg.sender == operator, "Not operator");
        _;
    }

    /// @notice Modifier to ensure only whitelisted LST tokens can be deposited
    /// @param token The LST token address to check
    modifier onlyWhitelistedLST(address token) {
        require(isLSTWhitelisted[token], "LST not whitelisted");
        _;
    }

    /**
     * @notice Deposit wBTC and LST to mint lstBTC
     * @dev Pulls tokens via transferFrom. Records deposit for redemption ratio calculation.
     * @param amountWBTC Amount of wBTC to deposit (in sats, 8 decimals)
     * @param amountLST Amount of LST to deposit (in its native decimals)
     * @param lstToken Address of the LST token
     */
    function deposit(
        uint256 amountWBTC,
        uint256 amountLST,
        address lstToken
    ) external nonReentrant onlyWhitelistedLST(lstToken) {
        require(amountWBTC > 0 && amountLST > 0, "Must deposit both wBTC and LST");

        IERC20(wBTC).transferFrom(msg.sender, address(this), amountWBTC);
        IERC20(lstToken).transferFrom(msg.sender, address(this), amountLST);

        uint256 totalBTCValue = ICustodianAdapter(custodianAdapter).getValue(amountWBTC, amountLST, lstToken);
        require(totalBTCValue >= depositMinAmount, "Deposit too small");

        deposits[msg.sender].push(Deposit({
            wbtcAmount: amountWBTC,
            lstTokenAmount: amountLST,
            lstToken: lstToken,
            depositTime: block.timestamp
        }));

        uint256 btcAmount18 = totalBTCValue * 1e10; // Convert sats to 1e18
        lstBTC.mintAtValue(msg.sender, btcAmount18);

        emit DepositSuccessful(msg.sender, amountWBTC, amountLST, lstToken, btcAmount18);
    }

    /**
     * @notice Redeem lstBTC to receive underlying wBTC and LST
     * @dev Calculates user's share of total BTC backing and distributes assets
     *      based on original deposit composition.
     * @param lstBTCAmount Amount of lstBTC to burn
     */
    function redeem(uint256 lstBTCAmount) external nonReentrant {
        require(lstBTCAmount >= redeemMinAmount, "Too small");
        require(lstBTC.balanceOf(msg.sender) >= lstBTCAmount, "Insufficient");
        uint256 totalSupply = lstBTC.totalSupply();
        require(totalSupply > 0, "No supply");

        uint256 userShare = (lstBTCAmount * 1e18) / totalSupply;
        uint256 totalBTCBacking18 = ICustodianAdapter(custodianAdapter).getTotalVaultBTCBacking();

        (uint256 wbtcRatio, uint256 lstRatio, address lstToken) = _getDepositRatios(msg.sender);

        // Calculate wBTC output in BTC (1e18), then convert to sats (1e8)
        uint256 wbtcOut = (totalBTCBacking18 * userShare * wbtcRatio) / 1e36;
        wbtcOut = wbtcOut / 1e10;

        uint256 lstValueBTC = (totalBTCBacking18 * userShare * lstRatio) / 1e36;
        uint256 lstOut = ICustodianAdapter(custodianAdapter).btcToLST(lstValueBTC, lstToken);

        require(wbtcOut <= IERC20(wBTC).balanceOf(address(this)), "Insufficient wBTC");
        require(lstOut <= IERC20(lstToken).balanceOf(address(this)), "Insufficient LST");

        lstBTC.burn(msg.sender, lstBTCAmount);
        IERC20(wBTC).transfer(msg.sender, wbtcOut);
        IERC20(lstToken).transfer(msg.sender, lstOut);

        emit Redeem(msg.sender, lstBTCAmount, wbtcOut, lstOut);
    }

    /**
     * @notice Calculates the deposit composition ratios for a user
     * @dev Uses BTC value (not token amount) to determine the proportion of wBTC and LST
     *      in the user's deposits. This ensures accurate redemption based on value, not quantity.
     * @param user The address of the user
     * @return wbtcRatio Proportion of wBTC in user's deposits (1e18 base)
     * @return lstRatio Proportion of LST in user's deposits (1e18 base)
     * @return lstToken The LST token address used in deposits
     */
    function _getDepositRatios(address user) private view returns (
        uint256 wbtcRatio,
        uint256 lstRatio,
        address lstToken
    ) {
        Deposit[] storage deps = deposits[user];
        require(deps.length > 0, "No deposits");

        uint256 totalDepositedBTC = 0;
        uint256 totalDepositedWBTC = 0;
        uint256 totalDepositedLST = 0;

        for (uint256 i = 0; i < deps.length; i++) {
            Deposit storage dep = deps[i];
            uint256 depValue = ICustodianAdapter(custodianAdapter).getValue(
                dep.wbtcAmount,
                dep.lstTokenAmount,
                dep.lstToken
            );
            totalDepositedBTC += depValue;
            totalDepositedWBTC += dep.wbtcAmount;
            totalDepositedLST += dep.lstTokenAmount;
        }

        // Use BTC value, not token amount
        uint256 wbtcValue = totalDepositedWBTC;
        uint256 lstValue = ICustodianAdapter(custodianAdapter).getValue(0, totalDepositedLST, deps[0].lstToken);

        wbtcRatio = (wbtcValue * 1e18) / totalDepositedBTC;
        lstRatio = (lstValue * 1e18) / totalDepositedBTC;
        lstToken = deps[0].lstToken;
    }

    // --- Admin & Utility Functions ---

    /**
     * @notice Updates yield state and exchange rate
     * @dev Called by operator. Calculates total BTC backing from wBTC and staked CORE.
     *      Updates lstBTC exchange rate to reflect increased backing.
     *      Optionally collects protocol fees in ETH.
     */
    function updateYield() external onlyOperator nonReentrant {
        uint256 currentRate = earn.getCurrentExchangeRate();
        uint256 stcoreBalance = IERC20(address(earn)).balanceOf(address(this));
        uint256 coreValue = (stcoreBalance * currentRate) / RATE_BASE;

        uint256 wbtcBalance = IERC20(wBTC).balanceOf(address(this));
        uint256 totalBTCBacking = wbtcBalance + (coreValue * 1e8) / wbtcPriceUSD;
        uint256 totalBTCBacking18 = totalBTCBacking * 1e10;

        uint256 supply = lstBTC.totalSupply();
        if (supply > 0) {
            uint256 newRate = (totalBTCBacking18 * 1e18) / supply;
            lstBTC.updateExchangeRate(newRate);
            emit UpdateExchangeRate(newRate);
        }

        if (protocolFeePoints > 0 && address(this).balance > 0 && protocolFeeReceiver != address(0)) {
            uint256 feeInCORE = (address(this).balance * protocolFeePoints) / RATE_BASE;
            if (feeInCORE > 0) {
                payable(protocolFeeReceiver).transfer(feeInCORE);
                emit FeeCollectedInCORE(feeInCORE);
            }
        }
    }

    /**
     * @notice Sets the yield contract address
     * @param _earn Address of the new yield contract
     */
    function setEarn(address _earn) external onlyOwner {
        require(_earn != address(0), "Zero earn");
        earn = IEarn(_earn);
    }

    /**
     * @notice Sets the protocol fee receiver address
     * @param receiver Address to receive collected fees
     */
    function setFeeReceiver(address receiver) external onlyOwner {
        require(receiver != address(0), "Zero address");
        protocolFeeReceiver = receiver;
        emit UpdateFeeReceiver(receiver);
    }

    /**
     * @notice Sets the protocol fee rate
     * @param points Fee points (1e6 = 100%). Must not exceed RATE_BASE.
     */
    function setProtocolFeePoints(uint256 points) external onlyOwner {
        require(points <= RATE_BASE, "Too high");
        protocolFeePoints = points;
        emit UpdateFeePoints(points);
    }

    /**
     * @notice Sets the operator address
     * @param _op Address of the operator
     */
    function setOperator(address _op) external onlyOwner {
        require(_op != address(0), "Zero address");
        operator = _op;
        emit UpdateOperator(_op);
    }

    /**
     * @notice Updates the custodian adapter address
     * @param _adapter Address of the new custodian adapter
     */
    function setCustodianAdapter(address _adapter) external onlyOwner {
        require(_adapter != address(0), "Zero address");
        custodianAdapter = _adapter;
    }

    /**
     * @notice Whitelists or removes an LST token for deposits
     * @param token Address of the LST token
     * @param status true to whitelist, false to remove
     */
    function whitelistLST(address token, bool status) external onlyOwner {
        isLSTWhitelisted[token] = status;
    }

    /**
     * @notice Updates the price oracles for wBTC and CORE
     * @param _wbtc New wBTC price in USD (8 decimals)
     * @param _core New CORE price in USD (8 decimals)
     */
    function updateOraclePrices(uint256 _wbtc, uint256 _core) external onlyOperator {
        require(_wbtc > 0 && _core > 0, "Zero price");
        wbtcPriceUSD = _wbtc;
        corePriceUSD = _core;
        emit UpdateOraclePrices(_wbtc, _core);
    }

    /**
     * @notice Updates the minimum deposit amount
     * @param amount New minimum deposit amount in sats
     */
    function setDepositMinAmount(uint256 amount) external onlyOwner {
        require(amount > 0, "Zero amount");
        depositMinAmount = amount;
        emit UpdateDepositMinAmount(amount);
    }

    /**
     * @notice Updates the minimum redeem amount
     * @param amount New minimum redeem amount in lstBTC
     */
    function setRedeemMinAmount(uint256 amount) external onlyOwner {
        require(amount > 0, "Zero amount");
        redeemMinAmount = amount;
        emit UpdateRedeemMinAmount(amount);
    }

    /**
     * @notice Retrieves all deposits for a user
     * @param user The user's address
     * @return An array of Deposit structs
     */
    function getUserDeposits(address user) external view returns (Deposit[] memory) {
        return deposits[user];
    }

    /**
     * @notice Allows the contract to receive ETH (CORE)
     * @dev ETH is used for protocol fees
     */
    receive() external payable {}
}