import mongoose from "mongoose";
import { CONSTANTS } from "../utils/constants";

export const connectDatabase = async (): Promise<void> => {
    try {
        const mongoUri = CONSTANTS.MONGODB_URI || "mongodb://localhost:27017/my-project-db";

        await mongoose.connect(mongoUri);

        mongoose.connection.on("error", (error) => {
            console.error("MongoDB connection error:", error);
        });

        mongoose.connection.on("disconnected", () => {});

        mongoose.connection.on("reconnected", () => {});

        process.on("SIGINT", async () => {
            await mongoose.connection.close();
            process.exit(0);
        });
    } catch (error) {
        console.error("Failed to connect to MongoDB:", error);
        process.exit(1);
    }
};
