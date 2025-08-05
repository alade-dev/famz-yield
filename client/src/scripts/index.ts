const SCALE = BigInt(10 ** 18);
const LST_TOKEN_ADDRESS = "0x6401f24EF7C54032f4F54E67492928973Ab87650";

interface RedemptionResult {
  wBTCReturned: bigint;
  stCOREReturned: bigint;
}

interface UserRatios {
  r_wBTC: bigint;
  r_stCORE: bigint;
}

interface PriceData {
  priceStCORE_CORE: bigint;
  priceCORE_BTC: bigint;
}

//  Calculate BTC value of stCORE
function btcValueOfStCORE(
  amountOfStCORE: bigint,
  priceStCORE_CORE: bigint,
  priceCORE_BTC: bigint
): bigint {
  // TODO: Implement actual BTC value calculation
  // Convert stCORE -> CORE -> BTC
  return (amountOfStCORE * priceStCORE_CORE * priceCORE_BTC) / (SCALE * SCALE); // Will replace if needed
}

//  Calculate the amount of lstBTC to mint based on wBTC and stCORE deposits
function calculateLstBTCToMint(
  amountOfwBTC: bigint,
  amountOfStCORE: bigint,
  priceStCORE_CORE: bigint,
  priceCORE_BTC: bigint
): bigint {
  const stCOREinBTC = btcValueOfStCORE(
    amountOfStCORE,
    priceStCORE_CORE,
    priceCORE_BTC
  );
  return amountOfwBTC + stCOREinBTC;
}

// Deposit function
async function deposit(
  amountWBTC: bigint,
  amountLST: bigint,
  lstToken: string = LST_TOKEN_ADDRESS
): Promise<void> {
  // TODO: Implement actual deposit logic
  // await contract.deposit(amountWBTC, amountLST);
  console.log(
    `Depositing ${amountWBTC} wBTC and ${amountLST} LST to ${lstToken}`
  );
  throw new Error(
    "deposit function needs to be implemented with your web3 library"
  );
}

//  Calculate redemption amounts for withdrawing lstBTC
function calculateRedemption(
  amountOfLstBTC: bigint,
  r_wBTC: bigint,
  r_stCORE: bigint,
  priceStCORE_CORE: bigint,
  priceCORE_BTC: bigint
): RedemptionResult {
  // Calculate wBTC returned based on user's ratio
  const wBTCReturned = (amountOfLstBTC * r_wBTC) / SCALE;

  // Calculate BTC value allocated for stCORE
  const btcValueForStCORE = (amountOfLstBTC * r_stCORE) / SCALE;

  // Convert BTC value back to stCORE amount
  // btcValue / (stCORE_CORE_price * CORE_BTC_price)
  const stCOREReturned =
    (btcValueForStCORE * SCALE * SCALE) / (priceStCORE_CORE * priceCORE_BTC);

  return {
    wBTCReturned,
    stCOREReturned,
  };
}

// Withdrawal flow

// Get current prices
async function getPrices(): Promise<PriceData> {
  // TODO: Implement actual price fetching logic
  return {
    priceStCORE_CORE: BigInt("1000000000000000000"),
    priceCORE_BTC: BigInt("100000000000000000000"),
  };
}

async function getUserRatios(userAddress: string): Promise<UserRatios> {
  // TODO: Implement actual user ratio fetching logic
  return {
    r_wBTC: BigInt("500000000000000000"),
    r_stCORE: BigInt("500000000000000000"),
  };
}

// Complete withdrawal flow
async function withdrawFlow(
  userAddress: string,
  lstBTCAmount: bigint
): Promise<RedemptionResult> {
  // Step 1: Get current prices
  const prices = await getPrices();

  // Step 2: Get user ratios
  const ratios = await getUserRatios(userAddress);

  // Step 3: Calculate redemption
  const redemption = calculateRedemption(
    lstBTCAmount,
    ratios.r_wBTC,
    ratios.r_stCORE,
    prices.priceStCORE_CORE,
    prices.priceCORE_BTC
  );

  return redemption;
}

// Confirm withdrawal
async function confirmWithdrawal(lstBTCAmount: bigint): Promise<void> {
  // TODO: Implement actual withdrawal confirmation logic
  console.log(`Confirming withdrawal of ${lstBTCAmount} lstBTC`);
  throw new Error(
    "confirmWithdrawal function needs to be implemented with your web3 library"
  );
}

export {
  calculateLstBTCToMint,
  deposit,
  calculateRedemption,
  withdrawFlow,
  confirmWithdrawal,
  getPrices,
  getUserRatios,
  btcValueOfStCORE,
  LST_TOKEN_ADDRESS,
  SCALE,
};

export type { RedemptionResult, UserRatios, PriceData };
