/**
 * Epoch Helper Functions for 24-hour withdrawal rounds
 *
 * The epoch system works as follows:
 * - Each epoch lasts exactly 24 hours
 * - Epochs start at 00:00:00 UTC each day
 * - When a user redeems, their tokens become available at the end of the current epoch
 * - If they redeem at 23:58 UTC, they only wait 2 minutes
 * - If they redeem at 00:02 UTC, they wait almost 24 hours
 */

export interface EpochInfo {
  currentEpoch: number;
  epochStartTime: number;
  epochEndTime: number;
  timeUntilEpochEnd: number;
  isEpochActive: boolean;
}

export interface RedeemEpochInfo {
  epochRound: number;
  epochEndTime: number;
  timeUntilAvailable: number;
  tokensAvailable: boolean;
}

/**
 * Get the current epoch information
 * Epochs are 24-hour periods starting at 00:00:00 UTC
 */
export const getCurrentEpochInfo = (): EpochInfo => {
  const now = new Date();
  const currentTime = now.getTime();

  // Get start of current day in UTC
  const startOfDay = new Date(now);
  startOfDay.setUTCHours(0, 0, 0, 0);
  const epochStartTime = startOfDay.getTime();

  // End of current epoch (start of next day)
  const epochEndTime = epochStartTime + 24 * 60 * 60 * 1000;

  // Calculate epoch number (days since Unix epoch)
  const epochNumber = Math.floor(epochStartTime / (24 * 60 * 60 * 1000));

  // Time remaining in current epoch
  const timeUntilEpochEnd = epochEndTime - currentTime;

  return {
    currentEpoch: epochNumber,
    epochStartTime,
    epochEndTime,
    timeUntilEpochEnd,
    isEpochActive: timeUntilEpochEnd > 0,
  };
};

/**
 * Calculate when redeemed tokens will be available
 * Tokens become available at the end of the current epoch
 */
export const calculateRedeemAvailability = (
  redeemTimestamp: number
): RedeemEpochInfo => {
  const redeemDate = new Date(redeemTimestamp);

  // Get the epoch info for when the redeem happened
  const redeemEpochStartTime = new Date(redeemDate);
  redeemEpochStartTime.setUTCHours(0, 0, 0, 0);
  const epochStartTime = redeemEpochStartTime.getTime();

  // End of the epoch when redeem happened (when tokens become available)
  const epochEndTime = epochStartTime + 24 * 60 * 60 * 1000;

  // Calculate epoch number
  const epochRound = Math.floor(epochStartTime / (24 * 60 * 60 * 1000));

  // Check if tokens are available now
  const currentTime = Date.now();
  const tokensAvailable = currentTime >= epochEndTime;
  const timeUntilAvailable = Math.max(0, epochEndTime - currentTime);

  return {
    epochRound,
    epochEndTime,
    timeUntilAvailable,
    tokensAvailable,
  };
};

/**
 * Format time remaining until epoch end
 */
export const formatEpochTimeRemaining = (timeRemaining: number): string => {
  if (timeRemaining <= 0) return "Available now";

  const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
  const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
};

/**
 * Format UTC date/time for display
 */
export const formatUTCDateTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  });
};

/**
 * Get user's local timezone for display purposes
 */
export const getUserTimezone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

/**
 * Format date/time in user's timezone with UTC comparison
 */
export const formatUserDateTime = (timestamp: number): string => {
  const userTz = getUserTimezone();
  const userTime = new Date(timestamp).toLocaleString("en-US", {
    timeZone: userTz,
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  });

  const utcTime = new Date(timestamp).toLocaleString("en-US", {
    timeZone: "UTC",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });

  return `${userTime} (${utcTime})`;
};

/**
 * Calculate example scenario for user education
 * Shows what happens if they redeem at different times
 */
export const getRedeemTimingExample = (
  userTimezone?: string
): {
  scenario: string;
  redeemTime: string;
  availableTime: string;
  waitTime: string;
} => {
  const now = new Date();
  const tz = userTimezone || getUserTimezone();

  // Example: Redeem at 11:58 PM in user's timezone
  const lateRedeem = new Date(now);
  lateRedeem.setHours(23, 58, 0, 0);

  // Convert to UTC to calculate epoch
  const lateRedeemUTC = lateRedeem.getTime();
  const lateRedeemInfo = calculateRedeemAvailability(lateRedeemUTC);

  // Example: Redeem at 12:02 AM in user's timezone
  const earlyRedeem = new Date(now);
  earlyRedeem.setHours(0, 2, 0, 0);
  earlyRedeem.setDate(earlyRedeem.getDate() + 1); // Next day

  const earlyRedeemUTC = earlyRedeem.getTime();
  const earlyRedeemInfo = calculateRedeemAvailability(earlyRedeemUTC);

  return {
    scenario: "late",
    redeemTime: lateRedeem.toLocaleString("en-US", {
      timeZone: tz,
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    }),
    availableTime: new Date(lateRedeemInfo.epochEndTime).toLocaleString(
      "en-US",
      {
        timeZone: tz,
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short",
      }
    ),
    waitTime: formatEpochTimeRemaining(lateRedeemInfo.timeUntilAvailable),
  };
};

/**
 * Validate if a timestamp represents a valid epoch boundary
 */
export const isValidEpochBoundary = (timestamp: number): boolean => {
  const date = new Date(timestamp);
  return (
    date.getUTCHours() === 0 &&
    date.getUTCMinutes() === 0 &&
    date.getUTCSeconds() === 0 &&
    date.getUTCMilliseconds() === 0
  );
};

/**
 * Get the next several epoch boundaries for planning
 */
export const getUpcomingEpochs = (count: number = 5): EpochInfo[] => {
  const epochs: EpochInfo[] = [];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const futureTime = now + i * 24 * 60 * 60 * 1000;
    const futureDate = new Date(futureTime);

    // Get start of that day
    const epochStart = new Date(futureDate);
    epochStart.setUTCHours(0, 0, 0, 0);
    const epochStartTime = epochStart.getTime();

    const epochEndTime = epochStartTime + 24 * 60 * 60 * 1000;
    const epochNumber = Math.floor(epochStartTime / (24 * 60 * 60 * 1000));

    epochs.push({
      currentEpoch: epochNumber,
      epochStartTime,
      epochEndTime,
      timeUntilEpochEnd: epochEndTime - now,
      isEpochActive: now >= epochStartTime && now < epochEndTime,
    });
  }

  return epochs;
};
