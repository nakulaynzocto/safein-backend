import { Request, Response, NextFunction } from "express";
import { ERROR_CODES } from "../utils/constants";
import { sendErrorResponse } from "../utils/errorResponse.util";

export const notFoundHandler = (req: Request, res: Response, _next: NextFunction): void => {
    sendErrorResponse(res, `Route ${req.originalUrl} not found`, ERROR_CODES.NOT_FOUND);
};
