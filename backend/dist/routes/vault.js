"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const server_1 = require("../server");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Get all vault positions for a user
router.get("/positions", auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const positions = await server_1.prisma.vaultPosition.findMany({
            where: {
                userId,
                isActive: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        return res.json(positions);
    }
    catch (error) {
        console.error("Error fetching positions:", error);
        return res.status(500).json({ error: "Failed to fetch positions" });
    }
});
// Create or update vault position
router.post("/positions", auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.id;
        const positionData = req.body;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        // Check if position exists
        const existingPosition = await server_1.prisma.vaultPosition.findFirst({
            where: {
                userId,
                vaultName: positionData.vaultName,
                isActive: true,
            },
        });
        let position;
        if (existingPosition) {
            // Update existing position
            position = await server_1.prisma.vaultPosition.update({
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
        }
        else {
            // Create new position
            position = await server_1.prisma.vaultPosition.create({
                data: {
                    userId,
                    ...positionData,
                },
            });
        }
        return res.json(position);
    }
    catch (error) {
        console.error("Error saving position:", error);
        return res.status(500).json({ error: "Failed to save position" });
    }
});
// Update position earnings
router.patch("/positions/:id/earnings", auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        const { earnings, wbtcEarnings, stcoreEarnings, currentValue } = req.body;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        // Verify ownership
        const position = await server_1.prisma.vaultPosition.findFirst({
            where: {
                id,
                userId,
            },
        });
        if (!position) {
            return res.status(404).json({ error: "Position not found" });
        }
        // Update earnings
        const updated = await server_1.prisma.vaultPosition.update({
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
        await server_1.prisma.earningsHistory.create({
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
    }
    catch (error) {
        console.error("Error updating earnings:", error);
        return res.status(500).json({ error: "Failed to update earnings" });
    }
});
// Close vault position
router.delete("/positions/:id", auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        // Verify ownership
        const position = await server_1.prisma.vaultPosition.findFirst({
            where: {
                id,
                userId,
            },
        });
        if (!position) {
            return res.status(404).json({ error: "Position not found" });
        }
        // Soft delete (mark as inactive)
        await server_1.prisma.vaultPosition.update({
            where: { id },
            data: {
                isActive: false,
            },
        });
        return res.json({ message: "Position closed successfully" });
    }
    catch (error) {
        console.error("Error closing position:", error);
        return res.status(500).json({ error: "Failed to close position" });
    }
});
// Get earnings history
router.get("/earnings", auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { limit = 100, offset = 0 } = req.query;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const earnings = await server_1.prisma.earningsHistory.findMany({
            where: { userId },
            orderBy: { date: "desc" },
            take: Number(limit),
            skip: Number(offset),
        });
        return res.json(earnings);
    }
    catch (error) {
        console.error("Error fetching earnings:", error);
        return res.status(500).json({ error: "Failed to fetch earnings" });
    }
});
exports.default = router;
//# sourceMappingURL=vault.js.map