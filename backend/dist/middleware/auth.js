"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = exports.verifyWalletSignature = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const ethers_1 = require("ethers");
// Verify JWT token
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];
        if (!token) {
            res.status(401).json({ error: "Access token required" });
            return;
        }
        jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || "secret", (err, decoded) => {
            if (err) {
                res.status(403).json({ error: "Invalid or expired token" });
                return;
            }
            req.user = decoded;
            next();
        });
    }
    catch (error) {
        res.status(500).json({ error: "Authentication failed" });
        return;
    }
};
exports.authenticateToken = authenticateToken;
// Verify wallet signature for authentication
const verifyWalletSignature = (message, signature, expectedAddress) => {
    try {
        const recoveredAddress = ethers_1.ethers.verifyMessage(message, signature);
        return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
    }
    catch (error) {
        console.error("Signature verification failed:", error);
        return false;
    }
};
exports.verifyWalletSignature = verifyWalletSignature;
// Generate JWT token
const generateToken = (userId, walletAddress) => {
    return jsonwebtoken_1.default.sign({ id: userId, walletAddress }, process.env.JWT_SECRET || "secret", { expiresIn: "7d" });
};
exports.generateToken = generateToken;
//# sourceMappingURL=auth.js.map