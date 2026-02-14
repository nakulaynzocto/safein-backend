import { Request } from "express";
import { AppError } from "../errorHandler";
import { ERROR_CODES } from "../../utils/constants";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";

// Load Public Key
let PUBLIC_KEY = process.env.SUPER_ADMIN_PUBLIC_KEY || "";

if (!PUBLIC_KEY) {
    const publicPath = path.join(process.cwd(), "certs", "public.pem");
    if (!fs.existsSync(publicPath)) {
        throw new Error(`Public key not found at ${publicPath}`);
    }
    PUBLIC_KEY = fs.readFileSync(publicPath, "utf-8");
}

// Handle .env formatting issues
if (!PUBLIC_KEY.includes("BEGIN PUBLIC KEY")) {
    PUBLIC_KEY = Buffer.from(PUBLIC_KEY, "base64").toString("utf-8");
} else {
    PUBLIC_KEY = PUBLIC_KEY.replace(/\\n/g, "\n");
}

export const authenticateWithMasterToken = (req: Request) => {
    const token = req.headers["x-master-token"] as string;
    if (!token) return null;

    try {
        const decoded = jwt.verify(token, PUBLIC_KEY, {
            algorithms: ["RS256"],
            issuer: "safein-super-admin-backend",
            audience: "gatekeeper-visitor-api",
        }) as any;

        return {
            _id: decoded.sub,
            companyName: decoded.companyName || decoded.name,
            email: decoded.email,
            roles: [decoded.role || "superadmin"],
            isActive: true,
        };
    } catch (err: any) {
        throw new AppError(
            "Unauthorized: Invalid Master Token Signature",
            ERROR_CODES.UNAUTHORIZED
        );
    }
};
