// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { Address } from "@openzeppelin/contracts/utils/Address.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import "./LstBTC-New.sol";
import "./Custodian.sol";

/**
 * @title Vault-New
 * @author Team
 * @notice Core vault contract for depositing wBTC and stCORE to receive lstBTC
 * @dev Users interact with this contract to deposit/redeem. Actual tokens are stored in Custodian.
 *      1 lstBTC = 1 BTC (fixed rate). Yield is distributed by increasing lstBTC balances.
 *      Only this vault has minting rights for lstBTC.
 */
contract VaultNew is Ownable, ReentrancyGuard {
    using Address for address payable;

    /// @notice Base unit for fee calculations (1e6 = 100%)
    uint256 private constant RATE_BASE = 1e6;

    /// @notice Address of the wBTC token
    IERC20 public immutable wBTC;

    /// @notice Address of the stCORE token
    IERC20 public immutable stCORE;

    /// @notice The custodian contract that stores tokens
    Custodian public immutable custodian;

    /// @notice The lstBTC token
    LstBTCNew public immutable lstBTC;

    /// @notice Minimum wBTC deposit amount (1e18 scale)
    uint256 public depositMinAmount;

    /// @notice Minimum lstBTC amount required to redeem
    uint256 public redeemMinAmount;

    /// @notice Fee points for protocol fee (1e6 = 100%, e.g., 10,000 = 1%)
    uint256 public protocolFeePoints;

    /// @notice Address to receive protocol fees
    address public protocolFeeReceiver;

    /// @notice Address authorized to perform operator functions
    address public operator;

    /// @notice Total protocol fees collected (in ETH/CORE)
    uint256 public totalFeesCollected;

    /// @notice Mapping of LST tokens that are whitelisted for deposit
    mapping(address => bool) public isLSTWhitelisted;

    /// @notice List of all depositors (to support proportional yield)
    address[] public depositors;

    /// @notice Tracks individual user's lstBTC balance (mirror of ERC20, for easier iteration)
    mapping(address => uint256) public userBalances;

    /// @notice Checks if a user has been added to depositors list
    mapping(address => bool) private hasDepositor;

    address public constant CORE_NATIVE = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

    // --- EVENTS ---

    /**
     * @notice Emitted when a user successfully deposits assets
     * @param user The address of the depositor
     * @param amountWBTC The amount of wBTC deposited (1e18)
     * @param amountStCORE The amount of stCORE deposited
     * @param lstBTCMinted The amount of lstBTC minted
     */
    event DepositSuccessful(
        address indexed user, 
        uint256 amountWBTC, 
        uint256 amountStCORE, 
        uint256 lstBTCMinted
    );

    /**
     * @notice Emitted when a user redeems lstBTC for underlying assets
     * @param user The address of the redeemer
     * @param lstBTCAmount The amount of lstBTC burned
     * @param wBTCReturned The amount of wBTC returned
     * @param stCOREReturned The amount of stCORE returned
     */
    event RedeemSuccessful(
        address indexed user, 
        uint256 lstBTCAmount, 
        uint256 wBTCReturned, 
        uint256 stCOREReturned
    );

    /**
     * @notice Emitted when yield is distributed to users
     * @param totalYieldDistributed Total yield distributed
     * @param recipientCount Number of recipients
     */
    event YieldDistributed(uint256 totalYieldDistributed, uint256 recipientCount);

    /**
     * @notice Emitted when the operator address is updated
     * @param operator The new operator address
     */
    event OperatorUpdated(address indexed operator);

    /**
     * @notice Emitted when the fee receiver address is updated
     * @param feeReceiver The new fee receiver address
     */
    event FeeReceiverUpdated(address indexed feeReceiver);

    /**
     * @notice Emitted when the protocol fee points are updated
     * @param feePoints The new fee points
     */
    event ProtocolFeeUpdated(uint256 feePoints);

    /**
     * @notice Emitted when protocol fees are collected
     * @param amount The amount of fees collected
     */
    event FeesCollected(uint256 amount);

    /**
     * @notice Emitted when minimum amounts are updated
     * @param depositMin New minimum deposit amount
     * @param redeemMin New minimum redeem amount
     */
    event MinimumAmountsUpdated(uint256 depositMin, uint256 redeemMin);

    event YieldInjected(address indexed caller, uint256 amount);

    /**
     * @notice Constructs the Vault with required dependencies
     * @param _wBTC Address of the wBTC token
     * @param _custodian Address of the custodian contract
     * @param _lstBTC Address of the lstBTC token contract
     * @param initialOwner The initial owner of the contract
     */
    constructor(
        address _wBTC,
        address _custodian,
        address _lstBTC,
        address initialOwner
    ) Ownable(initialOwner) {
        require(_wBTC != address(0), "Invalid wBTC address");
        require(_custodian != address(0), "Invalid custodian address");
        require(_lstBTC != address(0), "Invalid lstBTC address");

        wBTC = IERC20(_wBTC); 
        custodian = Custodian(_custodian);
        lstBTC = LstBTCNew(_lstBTC);

        depositMinAmount = 1e15; // 0.001 BTC minimum
        redeemMinAmount = 1e15;  // 0.001 lstBTC minimum
        protocolFeePoints = 0;   // No fees initially
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
     * @notice Deposit wBTC and stCORE to mint lstBTC
     * @dev Transfers tokens to vault, then vault transfers to custodian for processing
     * @param amountWBTC Amount of wBTC to deposit (1e18 scale)
     * @param amountStCORE Amount of stCORE to deposit (token units)
     */
    function deposit(
        uint256 amountWBTC,
        uint256 amountStCORE,
        address lstToken
    ) external nonReentrant onlyWhitelistedLST(lstToken) {
        require(amountWBTC > 0 && amountStCORE > 0, "Deposits must be greater than zero");

        //(uint256 stCOREPrice, uint256 coreBTCPrice) = custodian.getCurrentPrices();
        uint256 stCOREPrice = custodian.priceOracle().getPrice(lstToken);
        uint256 coreBTCPrice = custodian.priceOracle().getPrice(CORE_NATIVE);
        uint256 stCOREInBTC = 0;
        if (amountStCORE > 0) {
            stCOREInBTC = (amountStCORE * stCOREPrice * coreBTCPrice) / (1e18 * 1e18);
        }
        uint256 totalBTCValue = amountWBTC + stCOREInBTC;
        require(totalBTCValue >= depositMinAmount, "Deposit below minimum");

        // Transfer tokens from user to vault
        if (amountWBTC > 0) {
            IERC20(wBTC).transferFrom(msg.sender, address(this), amountWBTC);
            // Approve custodian to spend wBTC
            IERC20(wBTC).approve(address(custodian), amountWBTC);
        }
        if (amountStCORE > 0) {
            IERC20(lstToken).transferFrom(msg.sender, address(this), amountStCORE);
            // Approve custodian to spend stCORE
            IERC20(lstToken).approve(address(custodian), amountStCORE);
        }

        // Call custodian to process deposit and get mint amount
        uint256 lstBTCMinted = custodian.deposit(msg.sender, amountWBTC, amountStCORE);

        lstBTC.mint(msg.sender, lstBTCMinted);

        // After minting lstBTC
        if (!hasDepositor[msg.sender]) {
            hasDepositor[msg.sender] = true;
            depositors.push(msg.sender);
        }
        userBalances[msg.sender] += lstBTCMinted;

        emit DepositSuccessful(msg.sender, amountWBTC, amountStCORE, lstBTCMinted);
    }

    /**
     * @notice Redeem lstBTC to receive underlying wBTC and stCORE
     * @dev Burns lstBTC and receives assets from custodian
     * @param lstBTCAmount Amount of lstBTC to redeem
     */
    function redeem(uint256 lstBTCAmount, address lstToken) external nonReentrant {
        require(lstBTCAmount >= redeemMinAmount, "Below minimum redeem amount");
        require(lstBTC.balanceOf(msg.sender) >= lstBTCAmount, "Insufficient lstBTC balance");

        // Burn lstBTC from user first (vault has burning rights)
        lstBTC.burn(msg.sender, lstBTCAmount);

        // After burning lstBTC
        userBalances[msg.sender] -= lstBTCAmount;

        // Call custodian to process redemption
        (uint256 wBTCReturned, uint256 stCOREReturned) = custodian.redeem(msg.sender, lstBTCAmount);

        // Transfer assets from vault to user
        if (wBTCReturned > 0) {
            IERC20(wBTC).transfer(msg.sender, wBTCReturned);
        }
        if (stCOREReturned > 0) {
            IERC20(lstToken).transfer(msg.sender, stCOREReturned);
        }

        emit RedeemSuccessful(msg.sender, lstBTCAmount, wBTCReturned, stCOREReturned);
    }

    /**
     * @notice Distributes yield to lstBTC holders (called by operator)
     * @dev Uses balance increasing method - mints additional lstBTC to users
     * @param recipients Array of addresses to receive yield
     * @param amounts Array of yield amounts for each recipient
     */
    function distributeYield(
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external onlyOperator nonReentrant {
        require(recipients.length == amounts.length, "Array length mismatch");
        require(recipients.length > 0, "No recipients provided");

        uint256 totalYield = 0;
        for (uint256 i = 0; i < recipients.length; i++) {
            if (amounts[i] > 0) {
                lstBTC.distributeYieldToUser(recipients[i], amounts[i]);
                totalYield += amounts[i];
            }
        }

        emit YieldDistributed(totalYield, recipients.length);
    }

    /**
     * @notice Distributes yield to all lstBTC holders proportionally
     * @dev Calculates proportional yield for all holders and distributes
     * @param totalYieldAmount Total yield to distribute
     */
    function _distributeYieldProportionally(uint256 totalYieldAmount) internal {
        require(totalYieldAmount > 0, "Yield amount must be positive");
        uint256 totalSupply = lstBTC.totalSupply();
        require(totalSupply > 0, "No lstBTC supply");

        address[] memory recipients = new address[](depositors.length);
        uint256[] memory amounts = new uint256[](depositors.length);
        uint256 count = 0;

        for (uint256 i = 0; i < depositors.length; i++) {
            address user = depositors[i];
            uint256 balance = userBalances[user];
            if (balance > 0) {
                uint256 share = (balance * totalYieldAmount) / totalSupply;
                if (share > 0) {
                    recipients[count] = user;
                    amounts[count] = share;
                    count++;
                }
            }
        }

        assembly {
            mstore(recipients, count)
            mstore(amounts, count)
        }

        lstBTC.distributeYield(recipients, amounts);
        emit YieldDistributed(totalYieldAmount, count);
    }

    /**
     * @notice Internally distributes yield to all lstBTC holders proportionally
     * @dev Uses depositors list and userBalances to calculate shares
     * @param totalYieldAmount Total yield to distribute (in BTC units, 1e18 scale)
     */
    function distributeYieldProportionally(uint256 totalYieldAmount) external onlyOperator {
        _distributeYieldProportionally(totalYieldAmount);
    }

    /**
     * @notice Collects protocol fees from the vault balance
     * @dev Transfers accumulated fees to the fee receiver
     */
    function collectFees() external nonReentrant {
        require(protocolFeeReceiver != address(0), "Fee receiver not set");
        require(address(this).balance > 0, "No fees to collect");

        uint256 feeAmount = address(this).balance;
        totalFeesCollected += feeAmount;

        payable(protocolFeeReceiver).transfer(feeAmount);
        emit FeesCollected(feeAmount);
    }

    /// @notice Notifies the custodian of new BTC-denominated yield and triggers distribution
    /// @dev Only owner (operator) can call. Yield is backed by wBTC in custody.
    /// @param amount Amount of yield to inject (in BTC, 1e18 scale)
    function notifyYield(uint256 amount) external onlyOperator {
        require(amount > 0, "Custodian: yield amount must be positive");
        require(
            wBTC.balanceOf(address(custodian)) >= amount,
            "Custodian: insufficient wBTC balance for yield injection"
        );

        // sanity check for max yield rate (e.g., 10% per week max)
        uint256 totalBTC = custodian.getTotalBTCValue();
        require(amount <= totalBTC / 10, "Custodian: yield too high");

        emit YieldInjected(msg.sender, amount);

        _distributeYieldProportionally(amount);
    }

    // --- Admin Functions ---

    /**
     * @notice Sets the operator address
     * @param _operator Address of the new operator
     */
    function setOperator(address _operator) external onlyOwner {
        require(_operator != address(0), "Invalid operator address");
        operator = _operator;
        emit OperatorUpdated(_operator);
    }

    /**
     * @notice Sets the protocol fee receiver address
     * @param _feeReceiver Address to receive protocol fees
     */
    function setFeeReceiver(address _feeReceiver) external onlyOwner {
        require(_feeReceiver != address(0), "Invalid fee receiver address");
        protocolFeeReceiver = _feeReceiver;
        emit FeeReceiverUpdated(_feeReceiver);
    }

    /**
     * @notice Sets the protocol fee rate
     * @param _feePoints Fee points (1e6 = 100%)
     */
    function setProtocolFeePoints(uint256 _feePoints) external onlyOwner {
        require(_feePoints <= RATE_BASE, "Fee too high");
        protocolFeePoints = _feePoints;
        emit ProtocolFeeUpdated(_feePoints);
    }

    /**
     * @notice Updates minimum deposit and redeem amounts
     * @param _depositMin New minimum deposit amount
     * @param _redeemMin New minimum redeem amount
     */
    function setMinimumAmounts(uint256 _depositMin, uint256 _redeemMin) external onlyOwner {
        require(_depositMin > 0 && _redeemMin > 0, "Amounts must be positive");
        depositMinAmount = _depositMin;
        redeemMinAmount = _redeemMin;
        emit MinimumAmountsUpdated(_depositMin, _redeemMin);
    }

    /**
     * @notice Authorizes the vault as a minter for lstBTC
     * @dev Should be called after deployment to enable minting
     */
    function authorizeMinting() external onlyOwner {
        lstBTC.setMinter(address(this), true);
        lstBTC.setYieldDistributor(address(this), true);
    }

    /**
     * @notice Whitelists or removes an LST token for deposits
     * @param token Address of the LST token
     * @param status true to whitelist, false to remove
     */
    function whitelistLST(address token, bool status) external onlyOwner {
        isLSTWhitelisted[token] = status;
    }

    // --- View Functions ---

    /**
     * @notice Gets the total BTC value stored in the custodian
     * @return Total BTC value (1e18 scale)
     */
    function getTotalBTCValue() external view returns (uint256) {
        return custodian.getTotalBTCValue();
    }

    /**
     * @notice Gets current oracle prices
     * @return stCOREPrice stCORE to CORE price
     * @return coreBTCPrice CORE to BTC price
     */
    function getCurrentPrices() external view returns (uint256 stCOREPrice, uint256 coreBTCPrice) {
        stCOREPrice = custodian.priceOracle().getPrice(address(custodian.stCORE()));
        coreBTCPrice = custodian.priceOracle().getPrice(CORE_NATIVE);
    }

    /**
     * @notice Gets user's deposit ratios
     * @param user User address
     * @return r_wBTC wBTC ratio
     * @return r_stCORE stCORE ratio
     */
    function getUserRatios(address user) external view returns (uint256 r_wBTC, uint256 r_stCORE) {
        return custodian.getUserRatios(user);
    }

    /**
     * @notice Gets user's lstBTC balance and BTC value
     * @param user User address
     * @return balance lstBTC balance
     * @return btcValue BTC value (since 1 lstBTC = 1 BTC)
     */
    function getUserInfo(address user) external view returns (uint256 balance, uint256 btcValue) {
        balance = lstBTC.balanceOf(user);
        btcValue = balance;
    }

    /**
     * @notice Allows the contract to receive CORE for fees
     */
    receive() external payable {
        // Fees can be sent directly to the contract
    }

    /**
     * @notice Emergency withdrawal function for owner
     * @param token Token address to withdraw
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).transfer(owner(), amount);
    }
}
