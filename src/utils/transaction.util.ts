import mongoose from "mongoose";

export class TransactionUtil {
    /**
     * Execute operations within a database transaction
     * @param operations - Array of operations to execute within the transaction
     * @returns Promise with the results of all operations
     */
    static async executeTransaction<T>(operations: (session: mongoose.ClientSession) => Promise<T>): Promise<T> {
        const session = await mongoose.startSession();

        try {
            let result: T;
            await session.withTransaction(async (session) => {
                result = await operations(session);
                return result;
            });
            return result!;
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
        operations: Array<(session: mongoose.ClientSession) => Promise<T>>,
    ): Promise<T[]> {
        const session = await mongoose.startSession();

        try {
            let results: T[] = [];
            await session.withTransaction(async (session) => {
                const batchResults: T[] = [];
                for (const operation of operations) {
                    const result = await operation(session);
                    batchResults.push(result);
                }
                results = batchResults;
                return results;
            });
            return results;
        } finally {
            session.endSession();
        }
    }
}
