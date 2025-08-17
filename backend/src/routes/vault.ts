import { Router } from "express";
import { prisma } from "../server";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router = Router();

// Get all vault positions for a user
router.get("/positions", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const positions = await prisma.vaultPosition.findMany({
      where: {
        userId,
        isActive: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json(positions);
  } catch (error) {
    console.error("Error fetching positions:", error);
    return res.status(500).json({ error: "Failed to fetch positions" });
  }
});

// Create or update vault position
router.post("/positions", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const positionData = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Check if position exists
    const existingPosition = await prisma.vaultPosition.findFirst({
      where: {
        userId,
        vaultName: positionData.vaultName,
        isActive: true,
      },
    });

    let position;
    if (existingPosition) {
      // Update existing position
      position = await prisma.vaultPosition.update({
        where: { id: existingPosition.id },
        data: {
          wbtcDeposited: positionData.wbtcDeposited,
          stcoreDeposited: positionData.stcoreDeposited,
          lstbtcGenerated: positionData.lstbtcGenerated,
          currentValue: positionData.currentValue,
          earnings: positionData.earnings,
          wbtcEarnings: positionData.wbtcEarnings,
          stcoreEarnings: positionData.stcoreEarnings,
          lastEarningsUpdate: new Date(),
        },
      });
    } else {
      // Create new position
      position = await prisma.vaultPosition.create({
        data: {
          userId,
          ...positionData,
        },
      });
    }

    return res.json(position);
  } catch (error) {
    console.error("Error saving position:", error);
    return res.status(500).json({ error: "Failed to save position" });
  }
});

// Update position earnings
router.patch(
  "/positions/:id/earnings",
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      const { earnings, wbtcEarnings, stcoreEarnings, currentValue } = req.body;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Verify ownership
      const position = await prisma.vaultPosition.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!position) {
        return res.status(404).json({ error: "Position not found" });
      }

      // Update earnings
      const updated = await prisma.vaultPosition.update({
        where: { id },
        data: {
          earnings,
          wbtcEarnings,
          stcoreEarnings,
          currentValue,
          lastEarningsUpdate: new Date(),
        },
      });

      // Record earnings history
      await prisma.earningsHistory.create({
        data: {
          userId,
          vaultPositionId: id,
          wbtcEarned: wbtcEarnings,
          stcoreEarned: stcoreEarnings,
          lstbtcValue: position.lstbtcGenerated,
          usdValue: currentValue,
        },
      });

      return res.json(updated);
    } catch (error) {
      console.error("Error updating earnings:", error);
      return res.status(500).json({ error: "Failed to update earnings" });
    }
  }
);

// Close vault position
router.delete(
  "/positions/:id",
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Verify ownership
      const position = await prisma.vaultPosition.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!position) {
        return res.status(404).json({ error: "Position not found" });
      }

      // Soft delete (mark as inactive)
      await prisma.vaultPosition.update({
        where: { id },
        data: {
          isActive: false,
        },
      });

      return res.json({ message: "Position closed successfully" });
    } catch (error) {
      console.error("Error closing position:", error);
      return res.status(500).json({ error: "Failed to close position" });
    }
  }
);

// Get earnings history
router.get("/earnings", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const { limit = 100, offset = 0 } = req.query;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const earnings = await prisma.earningsHistory.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: Number(limit),
      skip: Number(offset),
    });

    return res.json(earnings);
  } catch (error) {
    console.error("Error fetching earnings:", error);
    return res.status(500).json({ error: "Failed to fetch earnings" });
  }
});

export default router;
