/**
 * Real-time cryptocurrency price fetching utilities
 */

interface CoinGeckoResponse {
  bitcoin: {
    usd: number;
  };
}

interface CoinbaseResponse {
  data: {
    amount: string;
    currency: string;
  };
}

/**
 * Fetch BTC price from CoinGecko API (free tier)
 */
export const getBTCPriceFromCoinGecko = async (): Promise<number> => {
  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd"
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data: CoinGeckoResponse = await response.json();
    return data.bitcoin.usd;
  } catch (error) {
    console.error("Error fetching BTC price from CoinGecko:", error);
    throw error;
  }
};

/**
 * Fetch BTC price from Coinbase API (backup)
 */
export const getBTCPriceFromCoinbase = async (): Promise<number> => {
  try {
    const response = await fetch(
      "https://api.coinbase.com/v2/exchange-rates?currency=BTC"
    );

    if (!response.ok) {
      throw new Error(`Coinbase API error: ${response.status}`);
    }

    const data: CoinbaseResponse = await response.json();
    return parseFloat(data.data.amount);
  } catch (error) {
    console.error("Error fetching BTC price from Coinbase:", error);
    throw error;
  }
};

/**
 * Fetch BTC price from Binance API (another backup)
 */
export const getBTCPriceFromBinance = async (): Promise<number> => {
  try {
    const response = await fetch(
      "https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT"
    );

    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status}`);
    }

    const data = await response.json();
    return parseFloat(data.price);
  } catch (error) {
    console.error("Error fetching BTC price from Binance:", error);
    throw error;
  }
};

/**
 * Get current BTC price with fallback to multiple APIs
 */
export const getCurrentBTCPrice = async (): Promise<number> => {
  const APIs = [
    { name: "CoinGecko", fn: getBTCPriceFromCoinGecko },
    { name: "Coinbase", fn: getBTCPriceFromCoinbase },
    { name: "Binance", fn: getBTCPriceFromBinance },
  ];

  for (const api of APIs) {
    try {
      console.log(`Trying to fetch BTC price from ${api.name}...`);
      const price = await api.fn();
      console.log(`✅ BTC price from ${api.name}: $${price.toLocaleString()}`);
      return price;
    } catch (error) {
      console.warn(`❌ ${api.name} failed:`, error);
      continue;
    }
  }

  // If all APIs fail, use fallback
  console.warn("⚠️ All BTC price APIs failed, using fallback price of $43,000");
  return 43000; //TODO: Remove this fallback price
};

/**
 * Cache for BTC price to avoid excessive API calls
 */
class BTCPriceCache {
  private price: number | null = null;
  private lastFetch: number = 0;
  private readonly CACHE_DURATION = 10 * 1000; // 10 seconds

  async getPrice(): Promise<number> {
    const now = Date.now();

    // Return cached price if it's still fresh
    if (this.price && now - this.lastFetch < this.CACHE_DURATION) {
      console.log(`📦 Using cached BTC price: $${this.price.toLocaleString()}`);
      return this.price;
    }

    // Fetch fresh price
    try {
      this.price = await getCurrentBTCPrice();
      this.lastFetch = now;
      return this.price;
    } catch (error) {
      // If fetch fails but we have a cached price, use it
      if (this.price) {
        console.warn("Using stale cached BTC price due to fetch error:", error);
        return this.price;
      }
      // Otherwise, use fallback
      return 43000;
    }
  }

  // Force refresh the cache
  async refresh(): Promise<number> {
    this.price = null;
    this.lastFetch = 0;
    return this.getPrice();
  }
}

// Export singleton instance
export const btcPriceCache = new BTCPriceCache();
