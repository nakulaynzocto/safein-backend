import { TransactionUtil } from '../utils/transaction.util';

/**
 * Decorator to automatically wrap a method with database transaction
 * @param errorMessage - Custom error message for transaction failures
 */
export function Transaction(_errorMessage: string = 'Transaction failed') {
    return function (_target: any, _propertyName: string, descriptor: PropertyDescriptor) {
        const method = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            return TransactionUtil.executeTransaction(async (session) => {
                // Add session to the last argument (usually the service method)
                const lastArg = args[args.length - 1];
                if (typeof lastArg === 'object' && lastArg !== null) {
                    lastArg.session = session;
                } else {
                    args.push({ session });
                }

                return await method.apply(this, args);
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
                if (error instanceof Error && error.name === 'AppError') {
                    throw error;
                }
                throw new Error(`${errorMessage}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        };
    };
}