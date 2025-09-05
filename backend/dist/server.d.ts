import { PrismaClient } from "@prisma/client";
export declare const prisma: PrismaClient<{
    log: ("error" | "query" | "warn")[];
}, "error" | "query" | "warn", import("@prisma/client/runtime/library").DefaultArgs>;
declare const app: import("express-serve-static-core").Express;
export default app;
//# sourceMappingURL=server.d.ts.map