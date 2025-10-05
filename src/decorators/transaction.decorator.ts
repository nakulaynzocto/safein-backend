import { TransactionUtil } from '../utils/transaction.util';
import { AppError } from '../middlewares/errorHandler';

/**
 * Decorator to automatically wrap a method with database transaction
 * @param errorMessage - Custom error message for transaction failures
 */
export function Transaction(_errorMessage: string = 'Transaction failed') {
    return function (_target: any, _propertyName: string, descriptor: PropertyDescriptor) {
        const method = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            return TransactionUtil.executeTransaction(async (session) => {
                // Create a copy of args to avoid mutating the original
                const newArgs = [...args];
                
                // Add session to the last argument (usually the service method)
                const lastArg = newArgs[newArgs.length - 1];
                if (typeof lastArg === 'object' && lastArg !== null && !lastArg.session) {
                    // Create a new object to avoid mutating the original
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
export function TryCatch(errorMessage: string = 'Operation failed') {
    return function (_target: any, _propertyName: string, descriptor: PropertyDescriptor) {
        const method = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            try {
                return await method.apply(this, args);
            } catch (error) {
                if (error instanceof AppError) {
                    throw error;
                }
                throw new AppError(`${errorMessage}: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
            }
        };
    };
}