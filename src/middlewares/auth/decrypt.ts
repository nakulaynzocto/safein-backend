import { Request, Response, NextFunction } from "express";
import { decryptData } from "../../utils/crypto";
import { AppError } from "../errorHandler";
import { ERROR_CODES } from "../../utils/constants";

export const decryptLoginPayload = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  try {

    if (req.body.email && typeof req.body.email === "string") {
      req.body.email = decryptData(req.body.email);
    }

    if (req.body.password && typeof req.body.password === "string") {
      req.body.password = decryptData(req.body.password);
    }
    next();
  } catch (err) {
    throw new AppError(
      "Unauthorized: Invalid encrypted payload",
      ERROR_CODES.UNAUTHORIZED
    );
  }
};
export const decryptRegisterPayload = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  try {

    if (req.body.email && typeof req.body.email === "string") {
      req.body.email = decryptData(req.body.email);
    }

    if (req.body.password && typeof req.body.password === "string") {
      req.body.password = decryptData(req.body.password);
    }

    if (req.body.companyName && typeof req.body.companyName === "string") {
      req.body.companyName = decryptData(req.body.companyName);
    }
    next();
  } catch (err) {
    throw new AppError(
      "Unauthorized: Invalid encrypted register payload",
      ERROR_CODES.UNAUTHORIZED
    );
  }
};