import { Request, Response, NextFunction } from 'express';
import { ResponseUtil } from '../utils';

export const notFoundHandler = (req: Request, res: Response, _next: NextFunction): void => {
  ResponseUtil.notFound(res, `Route ${req.originalUrl} not found`);
};
