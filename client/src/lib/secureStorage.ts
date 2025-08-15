import { useAccount } from "wagmi";
import { useCallback } from "react";

// Simple encryption/decryption using base64 and wallet address as key
const encryptData = (data: string, walletAddress: string): string => {
  const key = btoa(walletAddress);
  const encrypted = btoa(data + key);
  return encrypted;
};

const decryptData = (encryptedData: string, walletAddress: string): string => {
  try {
    const key = btoa(walletAddress);
    const decrypted = atob(encryptedData);
    const originalData = decrypted.replace(key, "");
    return originalData;
  } catch (error) {
    console.error("Failed to decrypt data:", error);
    return "";
  }
};

// Validate data structure to prevent injection attacks
const validateData = (data: unknown, expectedStructure: unknown): boolean => {
  if (typeof data !== typeof expectedStructure) return false;

  if (Array.isArray(expectedStructure)) {
    return (
      Array.isArray(data) &&
      data.every((item) => typeof item === "object" && item !== null)
    );
  }

  if (typeof expectedStructure === "object" && expectedStructure !== null) {
    return typeof data === "object" && data !== null;
  }

  return true;
};

export class SecureStorage {
  private static getStorageKey(key: string, walletAddress: string): string {
    return `${key}_${walletAddress}`;
  }

  static setItem<T>(key: string, value: T, walletAddress: string): void {
    if (!walletAddress) {
      console.warn("Cannot store data without wallet address");
      return;
    }

    try {
      const serializedValue = JSON.stringify(value);
      const encryptedValue = encryptData(serializedValue, walletAddress);
      const storageKey = this.getStorageKey(key, walletAddress);
      localStorage.setItem(storageKey, encryptedValue);
    } catch (error) {
      console.error("Failed to store encrypted data:", error);
    }
  }

  static getItem<T>(
    key: string,
    walletAddress: string,
    defaultValue: T,
    expectedStructure?: unknown
  ): T {
    if (!walletAddress) {
      console.warn("Cannot retrieve data without wallet address");
      return defaultValue;
    }

    try {
      const storageKey = this.getStorageKey(key, walletAddress);
      const encryptedValue = localStorage.getItem(storageKey);

      if (!encryptedValue) {
        return defaultValue;
      }

      const decryptedValue = decryptData(encryptedValue, walletAddress);
      if (!decryptedValue) {
        return defaultValue;
      }

      const parsedValue = JSON.parse(decryptedValue);

      // Validate data structure if expected structure is provided
      if (expectedStructure && !validateData(parsedValue, expectedStructure)) {
        console.warn("Data validation failed, returning default value");
        return defaultValue;
      }

      return parsedValue;
    } catch (error) {
      console.error("Failed to retrieve encrypted data:", error);
      return defaultValue;
    }
  }

  static removeItem(key: string, walletAddress: string): void {
    if (!walletAddress) {
      console.warn("Cannot remove data without wallet address");
      return;
    }

    const storageKey = this.getStorageKey(key, walletAddress);
    localStorage.removeItem(storageKey);
  }

  static clearUserData(walletAddress: string): void {
    if (!walletAddress) return;

    const keysToRemove = ["vaultPositions", "userBalances", "earningsHistory"];

    keysToRemove.forEach((key) => {
      this.removeItem(key, walletAddress);
    });
  }

  // Clean up old data from previous non-secure storage
  static migrateOldData(walletAddress: string): void {
    if (!walletAddress) return;

    const oldKeys = ["vaultPositions", "userBalances", "earningsHistory"];

    oldKeys.forEach((key) => {
      const oldData = localStorage.getItem(key);
      if (oldData) {
        try {
          const parsedData = JSON.parse(oldData);
          this.setItem(key, parsedData, walletAddress);
          localStorage.removeItem(key); // Remove old unsecured data
        } catch (error) {
          console.error(`Failed to migrate ${key}:`, error);
        }
      }
    });
  }
}

// Hook for secure storage operations
export const useSecureStorage = () => {
  const { address, isConnected } = useAccount();

  const setSecureItem = useCallback(
    <T>(key: string, value: T) => {
      if (!isConnected || !address) {
        console.warn("Cannot store data: wallet not connected");
        return;
      }
      SecureStorage.setItem(key, value, address);
    },
    [isConnected, address]
  );

  const getSecureItem = useCallback(
    <T>(key: string, defaultValue: T, expectedStructure?: unknown): T => {
      if (!isConnected || !address) {
        return defaultValue;
      }
      return SecureStorage.getItem(
        key,
        address,
        defaultValue,
        expectedStructure
      );
    },
    [isConnected, address]
  );

  const removeSecureItem = useCallback(
    (key: string) => {
      if (!isConnected || !address) {
        console.warn("Cannot remove data: wallet not connected");
        return;
      }
      SecureStorage.removeItem(key, address);
    },
    [isConnected, address]
  );

  const clearUserData = useCallback(() => {
    if (!isConnected || !address) {
      console.warn("Cannot clear data: wallet not connected");
      return;
    }
    SecureStorage.clearUserData(address);
  }, [isConnected, address]);

  return {
    setSecureItem,
    getSecureItem,
    removeSecureItem,
    clearUserData,
    isWalletConnected: isConnected,
    walletAddress: address,
  };
};
