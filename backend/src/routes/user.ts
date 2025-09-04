import { Router } from "express";
import { prisma } from "../server";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router = Router();

// Get user profile
router.get("/profile", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            positions: true,
            transactions: true,
            earnings: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json(user);
  } catch (error) {
    console.error("Error fetching profile:", error);
    return res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// Get user dashboard data
router.get("/dashboard", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Fetch all user data in parallel
    const [positions, recentTransactions, earnings] = await Promise.all([
      // Active positions
      prisma.vaultPosition.findMany({
        where: {
          userId,
          isActive: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      // Recent transactions
      prisma.transaction.findMany({
        where: { userId },
        orderBy: { timestamp: "desc" },
        take: 10,
      }),
      // Earnings summary
      prisma.earningsHistory.aggregate({
        where: { userId },
        _sum: {
          wbtcEarned: true,
          stcoreEarned: true,
          usdValue: true,
        },
      }),
    ]);

    // Calculate totals
    const totalDeposited = positions.reduce(
      (acc: any, pos: any) => ({
        wbtc: acc.wbtc + pos.wbtcDeposited,
        stcore: acc.stcore + pos.stcoreDeposited,
      }),
      { wbtc: 0, stcore: 0 }
    );

    const totalLstBTC = positions.reduce(
      (acc: any, pos: any) => acc + pos.lstbtcGenerated,
      0
    );

    const totalEarnings = positions.reduce(
      (acc: any, pos: any) => acc + pos.earnings,
      0
    );

    return res.json({
      positions,
      recentTransactions,
      summary: {
        totalDeposited,
        totalLstBTC,
        totalEarnings,
        lifetimeEarnings: earnings._sum,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard:", error);
    return res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
});

// Delete user data (GDPR compliance)
router.delete("/data", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Delete all user data (cascading delete)
    await prisma.user.delete({
      where: { id: userId },
    });

    return res.json({ message: "User data deleted successfully" });
  } catch (error) {
    console.error("Error deleting user data:", error);
    return res.status(500).json({ error: "Failed to delete user data" });
  }
});

export default router;
