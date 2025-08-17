/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3001/api";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token expiry
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("authToken");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  getNonce: async (walletAddress: string) => {
    const { data } = await api.post("/auth/nonce", { walletAddress });
    return data;
  },

  verify: async (walletAddress: string, message: string, signature: string) => {
    const { data } = await api.post("/auth/verify", {
      walletAddress,
      message,
      signature,
    });
    localStorage.setItem("authToken", data.token);
    return data;
  },

  logout: () => {
    localStorage.removeItem("authToken");
  },
};

// Vault API
export const vaultAPI = {
  getPositions: async () => {
    const { data } = await api.get("/vault/positions");
    return data;
  },

  savePosition: async (position: any) => {
    const { data } = await api.post("/vault/positions", position);
    return data;
  },

  updateEarnings: async (id: string, earnings: any) => {
    const { data } = await api.patch(
      `/vault/positions/${id}/earnings`,
      earnings
    );
    return data;
  },

  closePosition: async (id: string) => {
    const { data } = await api.delete(`/vault/positions/${id}`);
    return data;
  },

  getEarningsHistory: async (limit = 100, offset = 0) => {
    const { data } = await api.get(
      `/vault/earnings?limit=${limit}&offset=${offset}`
    );
    return data;
  },
};

// Transaction API
export const transactionAPI = {
  getTransactions: async (params?: {
    type?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }) => {
    const { data } = await api.get("/transactions", { params });
    return data;
  },

  createTransaction: async (transaction: any) => {
    const { data } = await api.post("/transactions", transaction);
    return data;
  },

  updateStatus: async (
    id: string,
    status: string,
    tokensAvailable?: boolean
  ) => {
    const { data } = await api.patch(`/transactions/${id}/status`, {
      status,
      tokensAvailable,
    });
    return data;
  },

  refreshEpochs: async () => {
    const { data } = await api.post("/transactions/refresh-epochs");
    return data;
  },

  getStats: async () => {
    const { data } = await api.get("/transactions/stats");
    return data;
  },
};

// User API
export const userAPI = {
  getProfile: async () => {
    const { data } = await api.get("/user/profile");
    return data;
  },

  getDashboard: async () => {
    const { data } = await api.get("/user/dashboard");
    return data;
  },

  deleteData: async () => {
    const { data } = await api.delete("/user/data");
    return data;
  },
};

export default api;
