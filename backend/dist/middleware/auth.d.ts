import { Request, Response, NextFunction } from "express";
export interface AuthRequest extends Request {
    user?: {
        id: string;
        walletAddress: string;
    };
}
export declare const authenticateToken: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const verifyWalletSignature: (message: string, signature: string, expectedAddress: string) => boolean;
export declare const generateToken: (userId: string, walletAddress: string) => string;
//# sourceMappingURL=auth.d.ts.map