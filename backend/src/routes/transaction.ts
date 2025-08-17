import { Router } from "express";
import { prisma } from "../server";
import { authenticateToken, AuthRequest } from "../middleware/auth";
// Define types locally since Prisma enums aren't exported
type TransactionType = "DEPOSIT" | "REDEEM" | "APPROVE";
type TransactionStatus = "PENDING" | "COMPLETED" | "FAILED";

const router = Router();

// Get all transactions for a user
router.get("/", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const { type, status, limit = 100, offset = 0 } = req.query;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const where: any = { userId };

    if (type) {
      where.type = type as TransactionType;
    }

    if (status) {
      where.status = status as TransactionStatus;
    }

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take: Number(limit),
      skip: Number(offset),
    });

    return res.json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

// Create new transaction
router.post("/", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const transactionData = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Check if transaction already exists (by txHash)
    const existing = await prisma.transaction.findUnique({
      where: { txHash: transactionData.txHash },
    });

    if (existing) {
      return res.status(409).json({ error: "Transaction already exists" });
    }

    // Convert timestamp to DateTime if it's a number
    const processedData = { ...transactionData };
    if (typeof processedData.timestamp === "number") {
      processedData.timestamp = new Date(processedData.timestamp);
    }
    if (typeof processedData.epochEndTime === "number") {
      processedData.epochEndTime = new Date(processedData.epochEndTime);
    }

    // Convert status to uppercase to match Prisma enum
    if (processedData.status) {
      processedData.status = processedData.status.toUpperCase();
    }

    const transaction = await prisma.transaction.create({
      data: {
        userId,
        ...processedData,
      },
    });

    return res.status(201).json(transaction);
  } catch (error) {
    console.error("Error creating transaction:", error);
    return res.status(500).json({ error: "Failed to create transaction" });
  }
});

// Update transaction status
router.patch(
  "/:id/status",
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      const { status, tokensAvailable } = req.body;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Verify ownership
      const transaction = await prisma.transaction.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      const updated = await prisma.transaction.update({
        where: { id },
        data: {
          status: status.toUpperCase(),
          ...(tokensAvailable !== undefined && { tokensAvailable }),
        },
      });

      return res.json(updated);
    } catch (error) {
      console.error("Error updating transaction:", error);
      return res.status(500).json({ error: "Failed to update transaction" });
    }
  }
);

// Update transaction by txHash (for webhook updates)
router.patch("/tx/:txHash", async (req, res) => {
  try {
    const { txHash } = req.params;
    const updateData = req.body;

    // Convert timestamp to DateTime if it's a number
    const processedData = { ...updateData };
    if (typeof processedData.timestamp === "number") {
      processedData.timestamp = new Date(processedData.timestamp);
    }
    if (typeof processedData.epochEndTime === "number") {
      processedData.epochEndTime = new Date(processedData.epochEndTime);
    }

    // Convert status to uppercase to match Prisma enum
    if (processedData.status) {
      processedData.status = processedData.status.toUpperCase();
    }

    const transaction = await prisma.transaction.update({
      where: { txHash },
      data: processedData,
    });

    return res.json(transaction);
  } catch (error) {
    console.error("Error updating transaction by txHash:", error);
    return res.status(500).json({ error: "Failed to update transaction" });
  }
});

// Refresh epoch status for redeem transactions
router.post(
  "/refresh-epochs",
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Get all pending redeem transactions
      const pendingRedeems = await prisma.transaction.findMany({
        where: {
          userId,
          type: "REDEEM",
          status: "PENDING",
        },
      });

      const now = new Date();
      const updates = [];

      for (const tx of pendingRedeems) {
        if (tx.epochEndTime && tx.epochEndTime <= now) {
          // Epoch has been reached, update status
          updates.push(
            prisma.transaction.update({
              where: { id: tx.id },
              data: {
                status: "COMPLETED",
                tokensAvailable: true,
              },
            })
          );
        }
      }

      const results = await Promise.all(updates);

      return res.json({
        message: `Updated ${results.length} transactions`,
        updated: results.length,
      });
    } catch (error) {
      console.error("Error refreshing epochs:", error);
      return res.status(500).json({ error: "Failed to refresh epochs" });
    }
  }
);

// Get transaction statistics
router.get("/stats", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const [deposits, redeems, pending] = await Promise.all([
      prisma.transaction.count({
        where: {
          userId,
          type: "DEPOSIT",
        },
      }),
      prisma.transaction.count({
        where: {
          userId,
          type: "REDEEM",
        },
      }),
      prisma.transaction.count({
        where: {
          userId,
          status: "PENDING",
        },
      }),
    ]);

    return res.json({
      totalDeposits: deposits,
      totalRedeems: redeems,
      pendingTransactions: pending,
      totalTransactions: deposits + redeems,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return res.status(500).json({ error: "Failed to fetch statistics" });
  }
});

export default router;
