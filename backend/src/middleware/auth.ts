import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ethers } from "ethers";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    walletAddress: string;
  };
}

// Verify JWT token
export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      res.status(401).json({ error: "Access token required" });
      return;
    }

    jwt.verify(
      token,
      process.env.JWT_SECRET || "secret",
      (err: any, decoded: any) => {
        if (err) {
          res.status(403).json({ error: "Invalid or expired token" });
          return;
        }

        req.user = decoded;
        next();
      }
    );
  } catch (error) {
    res.status(500).json({ error: "Authentication failed" });
    return;
  }
};

// Verify wallet signature for authentication
export const verifyWalletSignature = (
  message: string,
  signature: string,
  expectedAddress: string
): boolean => {
  try {
    const recoveredAddress = ethers.verifyMessage(message, signature);
    return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
  } catch (error) {
    console.error("Signature verification failed:", error);
    return false;
  }
};

// Generate JWT token
export const generateToken = (
  userId: string,
  walletAddress: string
): string => {
  return jwt.sign(
    { id: userId, walletAddress },
    process.env.JWT_SECRET || "secret",
    { expiresIn: "7d" }
  );
};
