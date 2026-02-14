import { Request, Response, NextFunction } from "express";

/**
 * Middleware to capture raw body for webhook signature verification
 * Must be used with express.raw() middleware before express.json()
 */
export const webhookRawBodyMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
    try {
        // Store raw body as string for signature verification
        const rawBody = (req.body as Buffer).toString("utf8");
        (req as any).rawBody = rawBody;
        // Parse JSON for easy access
        req.body = JSON.parse(rawBody);
        next();
    } catch (error) {
        console.error("Error parsing webhook body:", error);
        next(error);
    }
};
