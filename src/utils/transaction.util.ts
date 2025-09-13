import mongoose from 'mongoose';

export class TransactionUtil {
    /**
     * Execute operations within a database transaction
     * @param operations - Array of operations to execute within the transaction
     * @returns Promise with the results of all operations
     */
    static async executeTransaction<T>(
        operations: (session: mongoose.ClientSession) => Promise<T>
    ): Promise<T> {
        const session = await mongoose.startSession();

        try {
            session.startTransaction();

            const result = await operations(session);

            await session.commitTransaction();
            return result;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    /**
     * Execute multiple operations within a transaction
     * @param operations - Array of operations to execute
     * @returns Promise with array of results
     */
    static async executeMultipleOperations<T>(
        operations: Array<(session: mongoose.ClientSession) => Promise<T>>
    ): Promise<T[]> {
        const session = await mongoose.startSession();

        try {
            session.startTransaction();

            const results: T[] = [];
            for (const operation of operations) {
                const result = await operation(session);
                results.push(result);
            }

            await session.commitTransaction();
            return results;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }
}
