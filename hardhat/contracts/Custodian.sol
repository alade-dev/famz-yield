// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./VaultMath.sol";
import "./LstBTC-New.sol";

// Chainlink Aggregator interface
interface AggregatorV3Interface {
    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        );
}

/// @title lstBTC Yield Vault Custodian Contract
/// @notice Manages deposits of wBTC and stCORE, minting of lstBTC, and redemptions
/// @dev This contract stores the actual tokens and handles conversion logic
contract Custodian is Ownable, Pausable, ReentrancyGuard {
    using VaultMath for uint256;

    IERC20 public immutable wBTC;
    IERC20 public immutable stCORE;
    LstBTCNew public immutable lstBTC;

    // Chainlink oracles for price feeds
    AggregatorV3Interface public priceStCORE_COREFeed;
    AggregatorV3Interface public priceCORE_BTCFeed;

    /// @notice Authorized vault contract that can trigger operations
    address public authorizedVault;

    struct DepositRatio {
        uint256 r_wBTC;     // wBTC ratio (1e18-scaled)
        uint256 r_stCORE;   // stCORE ratio (1e18-scaled)
        bool hasDeposited;  // Flag to check if user has ever deposited
    }
    
    /// @notice Mapping from user address to their deposit ratios
    mapping(address => DepositRatio) public userRatios;

    uint256 public constant SCALE = 1e18;

    // Events
    event Deposited(address indexed user, uint256 wBTCAmount, uint256 stCOREAmount, uint256 lstBTCMinted);
    event Redeemed(address indexed user, uint256 lstBTCBurned, uint256 wBTCReturned, uint256 stCOREReturned);
    event VaultAuthorized(address indexed vault);
    event PriceFeedsUpdated(address stCOREFeed, address coreBTCFeed);
    event YieldGenerated(uint256 totalYield);

    constructor(
        address _wBTC,
        address _stCORE,
        address _lstBTC,
        address _priceStCORE_COREFeed,
        address _priceCORE_BTCFeed,
        address initialOwner
    ) Ownable(initialOwner) {
        require(_wBTC != address(0), "Invalid wBTC address");
        require(_stCORE != address(0), "Invalid stCORE address");
        require(_lstBTC != address(0), "Invalid lstBTC address");
        
        wBTC = IERC20(_wBTC);
        stCORE = IERC20(_stCORE);
        lstBTC = LstBTCNew(_lstBTC);
        priceStCORE_COREFeed = AggregatorV3Interface(_priceStCORE_COREFeed);
        priceCORE_BTCFeed = AggregatorV3Interface(_priceCORE_BTCFeed);
    }

    /// @notice Modifier to check if caller is authorized vault
    modifier onlyVault() {
        require(msg.sender == authorizedVault, "Not authorized vault");
        _;
    }

    /**
     * @notice Sets the authorized vault contract
     * @param vault Address of the vault contract
     */
    function setAuthorizedVault(address vault) external onlyOwner {
        require(vault != address(0), "Zero address");
        authorizedVault = vault;
        emit VaultAuthorized(vault);
    }

    /**
     * @notice Sets or updates price feeds
     * @param _stCOREFeed Address of stCORE/CORE price feed
     * @param _coreBTCFeed Address of CORE/BTC price feed
     */
    function setPriceFeeds(address _stCOREFeed, address _coreBTCFeed) external onlyOwner {
        require(_stCOREFeed != address(0) && _coreBTCFeed != address(0), "Zero address");
        priceStCORE_COREFeed = AggregatorV3Interface(_stCOREFeed);
        priceCORE_BTCFeed = AggregatorV3Interface(_coreBTCFeed);
        emit PriceFeedsUpdated(_stCOREFeed, _coreBTCFeed);
    }

    /**
     * @notice Deposits wBTC & stCORE, mints lstBTC (called by Vault)
     * @param user The user making the deposit
     * @param amountOfwBTC Amount of wBTC to deposit (1e18-scaled)
     * @param amountOfStCORE Amount of stCORE to deposit (token units)
     */
    function deposit(
        address user, 
        uint256 amountOfwBTC, 
        uint256 amountOfStCORE
    ) external onlyVault nonReentrant whenNotPaused returns (uint256 lstBTCMinted) {
        require(amountOfwBTC > 0 || amountOfStCORE > 0, "Must deposit assets");
        
        // Transfer assets from vault to custodian
        if (amountOfwBTC > 0) {
            wBTC.transferFrom(authorizedVault, address(this), amountOfwBTC);
        }
        if (amountOfStCORE > 0) {
            stCORE.transferFrom(authorizedVault, address(this), amountOfStCORE);
        }

        // Fetch prices (1e18-scaled)
        uint256 p_stCORE_CORE = uint256(getLatestPrice(priceStCORE_COREFeed));
        uint256 p_CORE_BTC = uint256(getLatestPrice(priceCORE_BTCFeed));

        // Calculate mint amount using VaultMath
        lstBTCMinted = VaultMath.calculateLstBTCToMint(
            amountOfwBTC,
            amountOfStCORE,
            p_stCORE_CORE,
            p_CORE_BTC
        );

        // Calculate and store ratios for redemption
        (uint256 r_w, uint256 r_s) = VaultMath.calculateDepositRatios(
            amountOfwBTC,
            amountOfStCORE,
            p_stCORE_CORE,
            p_CORE_BTC
        );

        // Update user ratios (weighted average if user has previous deposits)
        DepositRatio storage userRatio = userRatios[user];
        if (userRatio.hasDeposited) {
            uint256 currentBalance = lstBTC.balanceOf(user);
            uint256 totalAfterMint = currentBalance + lstBTCMinted;
            
            // Weighted average of ratios
            userRatio.r_wBTC = (userRatio.r_wBTC * currentBalance + r_w * lstBTCMinted) / totalAfterMint;
            userRatio.r_stCORE = (userRatio.r_stCORE * currentBalance + r_s * lstBTCMinted) / totalAfterMint;
        } else {
            userRatio.r_wBTC = r_w;
            userRatio.r_stCORE = r_s;
            userRatio.hasDeposited = true;
        }

        emit Deposited(user, amountOfwBTC, amountOfStCORE, lstBTCMinted);
    }

    /**
     * @notice Redeems lstBTC to wBTC & stCORE (called by Vault)
     * @param user The user redeeming
     * @param amountOfLstBTC Amount of lstBTC to redeem
     */
    function redeem(
        address user, 
        uint256 amountOfLstBTC
    ) external onlyVault nonReentrant whenNotPaused returns (uint256 wBTCReturned, uint256 stCOREReturned) {
        // Note: lstBTC balance check and burning is handled by the vault

        DepositRatio memory ratio = userRatios[user];
        require(ratio.hasDeposited, "No deposit ratio recorded");

        // Fetch current prices
        uint256 p_stCORE_CORE = uint256(getLatestPrice(priceStCORE_COREFeed));
        uint256 p_CORE_BTC = uint256(getLatestPrice(priceCORE_BTCFeed));

        // Calculate returns using VaultMath
        (wBTCReturned, stCOREReturned) = VaultMath.calculateRedemption(
            amountOfLstBTC,
            ratio.r_wBTC,
            ratio.r_stCORE,
            p_stCORE_CORE,
            p_CORE_BTC
        );

        // Ensure sufficient balance in custodian
        require(wBTCReturned <= wBTC.balanceOf(address(this)), "Insufficient wBTC in custodian");
        require(stCOREReturned <= stCORE.balanceOf(address(this)), "Insufficient stCORE in custodian");

        // Transfer assets to vault (vault will transfer to user)
        if (wBTCReturned > 0) {
            wBTC.transfer(authorizedVault, wBTCReturned);
        }
        if (stCOREReturned > 0) {
            stCORE.transfer(authorizedVault, stCOREReturned);
        }

        emit Redeemed(user, amountOfLstBTC, wBTCReturned, stCOREReturned);
    }

    /**
     * @notice Generates and distributes yield to lstBTC holders
     * @dev This would be called periodically to distribute earned yield
     */
    function generateYield() external onlyOwner {
        uint256 totalSupply = lstBTC.totalSupply();
        if (totalSupply == 0) return;

        // Example: 0.1% yield (this would be calculated based on actual yield earned)
        uint256 yieldRate = 1000; // 0.1% = 1000 / 1000000
        uint256 totalYield = (totalSupply * yieldRate) / 1000000;

        if (totalYield > 0) {
            lstBTC.mint(address(this), totalYield);
            emit YieldGenerated(totalYield);
        }
    }

    /**
     * @notice Gets current prices from oracles
     * @return stCOREPrice stCORE to CORE price (1e18-scaled)
     * @return coreBTCPrice CORE to BTC price (1e18-scaled)
     */
    function getCurrentPrices() external view returns (uint256 stCOREPrice, uint256 coreBTCPrice) {
        stCOREPrice = uint256(getLatestPrice(priceStCORE_COREFeed));
        coreBTCPrice = uint256(getLatestPrice(priceCORE_BTCFeed));
    }

    /**
     * @notice Gets total BTC value held in custodian
     * @return Total BTC value (1e18-scaled)
     */
    function getTotalBTCValue() external view returns (uint256) {
        uint256 wBTCBalance = wBTC.balanceOf(address(this));
        uint256 stCOREBalance = stCORE.balanceOf(address(this));
        
        if (stCOREBalance == 0) return wBTCBalance;
        
        uint256 p_stCORE_CORE = uint256(getLatestPrice(priceStCORE_COREFeed));
        uint256 p_CORE_BTC = uint256(getLatestPrice(priceCORE_BTCFeed));
        
        uint256 stCOREInBTC = VaultMath.btcValueOfStCORE(stCOREBalance, p_stCORE_CORE, p_CORE_BTC);
        
        return wBTCBalance + stCOREInBTC;
    }

    /**
     * @notice Gets user's deposit ratios
     * @param user User address
     * @return r_wBTC wBTC ratio (1e18-scaled)
     * @return r_stCORE stCORE ratio (1e18-scaled)
     */
    function getUserRatios(address user) external view returns (uint256 r_wBTC, uint256 r_stCORE) {
        DepositRatio memory ratio = userRatios[user];
        return (ratio.r_wBTC, ratio.r_stCORE);
    }

    /**
     * @notice Pauses deposits and redemptions
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpauses deposits and redemptions
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Emergency withdrawal function for owner
     * @param token Token address to withdraw
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).transfer(owner(), amount);
    }

    /**
     * @dev Returns latest price from Chainlink feed
     * @param feed Chainlink price feed
     * @return Latest price
     */
    function getLatestPrice(AggregatorV3Interface feed) internal view returns (int256) {
        (, int256 price,,,) = feed.latestRoundData();
        require(price > 0, "Invalid price from oracle");
        return price;
    }
}
