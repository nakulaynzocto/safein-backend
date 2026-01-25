// import { Request } from 'express';
// // @ts-ignore
// import { CONSTANTS } from '../../utils/constants';
// import { AppError } from '../errorHandler';
// import { ERROR_CODES } from '../../utils/constants';
// import jwt from 'jsonwebtoken';
// import fs from 'fs';
// import path from 'path';

// // Load Public Key
// // Priority: Environment Variable -> File System
// let PUBLIC_KEY = process.env.SUPER_ADMIN_PUBLIC_KEY || '';

// if (!PUBLIC_KEY) {
//     const PUBLIC_KEY_PATH = path.join(process.cwd(), 'certs', 'public.pem');
//     try {
//         if (fs.existsSync(PUBLIC_KEY_PATH)) {
//             PUBLIC_KEY = fs.readFileSync(PUBLIC_KEY_PATH, 'utf8');
//         } else {
//             // Only log error if neither Env Var nor File is found
//             // console.error('Warning: Public Key not found at ' + PUBLIC_KEY_PATH); 
//         }
//     } catch (e) {
//         console.error('CRITICAL: Failed to load Public Key from file', e);
//     }
// }
// if (PUBLIC_KEY) {
//     // If key is base64 encoded (common in env vars to avoid newlines issues), decode it
//     if (!PUBLIC_KEY.includes("BEGIN PUBLIC KEY")) {
//         try {
//             PUBLIC_KEY = Buffer.from(PUBLIC_KEY, 'base64').toString('utf-8');
//         } catch (e) {
//             // keep original if fail
//         }
//     }
// }

// /**
//  * Attempts to authenticate the request using the Master Token headers.
//  * Now supports RS256 Signed JWTs.
//  * 
//  * @param req Express Request object
//  * @returns The populated user object if authentication is successful
//  * @throws AppError if Master Token is invalid or Verification fails
//  */
// export const authenticateWithMasterToken = (req: Request) => {
//     const token = req.headers['x-master-token'] as string;

//     if (!token) {
//         return null;
//     }

//     // LEGACY CHECK (Optional: remove if hard swtich)
//     // For now, if verification fails (e.g. string token), we might want to fail? 
//     // Or check if it LOOKS like a JWT?
//     // User requested "Apply", which usually implies replacing the logic.
//     // The previous logic used CONSTANTS.MASTER_TOKEN.

//     // I will enforce JWT verification securely.

//     if (!PUBLIC_KEY) {
//         throw new AppError('Server Misconfiguration: Public Key Missing', ERROR_CODES.INTERNAL_SERVER_ERROR);
//     }

//     try {
//         const decoded = jwt.verify(token, PUBLIC_KEY, {
//             algorithms: ['RS256'],
//             issuer: 'safein-super-admin-backend',
//             audience: 'gatekeeper-visitor-api'
//         }) as any;

//         return {
//             _id: decoded.sub,
//             companyName: decoded.companyName || decoded.name,
//             email: decoded.email,
//             roles: [decoded.role || 'superadmin'],
//             isActive: true,
//         };

//     } catch (err) {
//         // Verification failed
//         throw new AppError('Unauthorized: Invalid Master Token Signature', ERROR_CODES.UNAUTHORIZED);
//     }
// };
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
    console.log("Loading PUBLIC_KEY from file:", publicPath);
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

    console.log("Token received:", token);

    try {
        const decoded = jwt.verify(token, PUBLIC_KEY, {
            algorithms: ["RS256"],
            issuer: "safein-super-admin-backend",
            audience: "gatekeeper-visitor-api",
        }) as any;

        console.log("Decoded token:", decoded);

        return {
            _id: decoded.sub,
            companyName: decoded.companyName || decoded.name,
            email: decoded.email,
            roles: [decoded.role || "superadmin"],
            isActive: true,
        };
    } catch (err: any) {
        console.error("JWT verification error:", err.message);
        throw new AppError(
            "Unauthorized: Invalid Master Token Signature",
            ERROR_CODES.UNAUTHORIZED
        );
    }
};
