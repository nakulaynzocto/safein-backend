import { TransactionUtil } from "../utils/transaction.util";
import { AppError } from "../middlewares/errorHandler";

/**
 * Decorator to automatically wrap a method with database transaction
 * @param errorMessage - Custom error message for transaction failures
 */
export function Transaction(_errorMessage: string = "Transaction failed") {
    return function (_target: any, _propertyName: string, descriptor: PropertyDescriptor) {
        const method = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            return TransactionUtil.executeTransaction(async (session) => {
                const newArgs = [...args];

                const lastArg = newArgs[newArgs.length - 1];
                if (typeof lastArg === "object" && lastArg !== null && !lastArg.session) {
                    newArgs[newArgs.length - 1] = { ...lastArg, session };
                } else {
                    newArgs.push({ session });
                }

                return await method.apply(this, newArgs);
            });
        };
    };
}

/**
 * Decorator to automatically wrap a method with try-catch
 * @param errorMessage - Custom error message for failures
 */
export function TryCatch(errorMessage: string = "Operation failed") {
    return function (_target: any, _propertyName: string, descriptor: PropertyDescriptor) {
        const method = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            try {
                return await method.apply(this, args);
            } catch (error) {
                const next = args.length > 2 && typeof args[2] === "function" ? args[2] : null;

                if (next) {
                    if (error instanceof AppError) {
                        return next(error);
                    }
                    return next(
                        new AppError(
                            `${errorMessage}: ${error instanceof Error ? error.message : "Unknown error"}`,
                            500,
                        ),
                    );
                }

                if (error instanceof AppError) {
                    throw error;
                }
                throw new AppError(`${errorMessage}: ${error instanceof Error ? error.message : "Unknown error"}`, 500);
            }
        };
    };
}
