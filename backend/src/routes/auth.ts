import { Router } from "express";
import { prisma } from "../server";
import { verifyWalletSignature, generateToken } from "../middleware/auth";

const router = Router();

// Generate nonce for wallet signature
router.post("/nonce", async (req, res) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ error: "Wallet address required" });
    }

    // Generate a random nonce
    const nonce = Math.floor(Math.random() * 1000000).toString();
    const message = `Sign this message to authenticate with Famz Yield.\n\nNonce: ${nonce}\nTimestamp: ${new Date().toISOString()}`;

    return res.json({ message, nonce });
  } catch (error) {
    console.error("Nonce generation error:", error);
    return res.status(500).json({ error: "Failed to generate nonce" });
  }
});

// Verify signature and authenticate
router.post("/verify", async (req, res) => {
  try {
    const { walletAddress, message, signature } = req.body;

    if (!walletAddress || !message || !signature) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Verify the signature
    const isValid = verifyWalletSignature(message, signature, walletAddress);

    if (!isValid) {
      return res.status(401).json({ error: "Invalid signature" });
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { walletAddress: walletAddress.toLowerCase() },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          walletAddress: walletAddress.toLowerCase(),
          lastSeen: new Date(),
        },
      });
    } else {
      // Update last seen
      await prisma.user.update({
        where: { id: user.id },
        data: { lastSeen: new Date() },
      });
    }

    // Generate JWT token
    const token = generateToken(user.id, user.walletAddress);

    return res.json({
      token,
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Verification error:", error);
    return res.status(500).json({ error: "Authentication failed" });
  }
});

export default router;
