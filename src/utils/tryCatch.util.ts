import { AppError } from "../middlewares/errorHandler";
import { ERROR_CODES } from "./constants";

export const tryCatch = async <T>(
    operation: () => Promise<T>,
    errorMessage: string = "Operation failed",
): Promise<T> => {
    try {
        return await operation();
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }
        throw new AppError(errorMessage, ERROR_CODES.INTERNAL_SERVER_ERROR);
    }
};
