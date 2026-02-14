import mongoose from "mongoose";

export const extractIdString = (id: unknown): string | undefined => {
    if (!id) return undefined;
    if (typeof id === "string") return id.trim() || undefined;
    if (typeof id === "object" && id !== null) {
        const obj = id as any;
        if (obj._id) return String(obj._id).trim();
        if (typeof obj.toString === "function") {
            const str = obj.toString();
            if (str !== "[object Object]" && /^[0-9a-fA-F]{24}$/.test(str)) return str.trim();
        }
    }
    const str = String(id).trim();
    return str !== "[object Object]" && str !== "undefined" && str !== "null" ? str : undefined;
};

export const toObjectId = (id: string | undefined): mongoose.Types.ObjectId | null => {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) return null;
    return new mongoose.Types.ObjectId(id);
};
