"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const server_1 = require("../server");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Get user profile
router.get("/profile", auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const user = await server_1.prisma.user.findUnique({
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
    }
    catch (error) {
        console.error("Error fetching profile:", error);
        return res.status(500).json({ error: "Failed to fetch profile" });
    }
});
// Get user dashboard data
router.get("/dashboard", auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        // Fetch all user data in parallel
        const [positions, recentTransactions, earnings] = await Promise.all([
            // Active positions
            server_1.prisma.vaultPosition.findMany({
                where: {
                    userId,
                    isActive: true,
                },
                orderBy: {
                    createdAt: "desc",
                },
            }),
            // Recent transactions
            server_1.prisma.transaction.findMany({
                where: { userId },
                orderBy: { timestamp: "desc" },
                take: 10,
            }),
            // Earnings summary
            server_1.prisma.earningsHistory.aggregate({
                where: { userId },
                _sum: {
                    wbtcEarned: true,
                    stcoreEarned: true,
                    usdValue: true,
                },
            }),
        ]);
        // Calculate totals
        const totalDeposited = positions.reduce((acc, pos) => ({
            wbtc: acc.wbtc + pos.wbtcDeposited,
            stcore: acc.stcore + pos.stcoreDeposited,
        }), { wbtc: 0, stcore: 0 });
        const totalLstBTC = positions.reduce((acc, pos) => acc + pos.lstbtcGenerated, 0);
        const totalEarnings = positions.reduce((acc, pos) => acc + pos.earnings, 0);
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
    }
    catch (error) {
        console.error("Error fetching dashboard:", error);
        return res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
});
// Delete user data (GDPR compliance)
router.delete("/data", auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        // Delete all user data (cascading delete)
        await server_1.prisma.user.delete({
            where: { id: userId },
        });
        return res.json({ message: "User data deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting user data:", error);
        return res.status(500).json({ error: "Failed to delete user data" });
    }
});
exports.default = router;
//# sourceMappingURL=user.js.map