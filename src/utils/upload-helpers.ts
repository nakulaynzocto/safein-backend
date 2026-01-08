import { UPLOAD_CONFIG } from "./cloudinary";

/**
 * Upload Helper Functions
 * Reusable utilities for file upload operations
 */

/**
 * Format file size to human-readable string
 */
export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Validate file size
 */
export const isValidFileSize = (size: number): boolean => {
    return size <= UPLOAD_CONFIG.MAX_FILE_SIZE;
};

/**
 * Validate file type
 */
export const isValidFileType = (mimetype: string): boolean => {
    return mimetype.startsWith("image/");
};

/**
 * Get file extension from filename
 */
export const getFileExtension = (filename: string): string => {
    return filename.split(".").pop()?.toLowerCase() || "";
};

/**
 * Generate a unique filename with timestamp
 */
export const generateUniqueFilename = (originalname: string): string => {
    const timestamp = Date.now();
    const extension = getFileExtension(originalname);
    const nameWithoutExt = originalname.replace(/\.[^/.]+$/, "");
    return `${nameWithoutExt}_${timestamp}.${extension}`;
};

/**
 * Validate upload request
 */
export const validateUploadRequest = (
    file: Express.Multer.File | undefined,
): {
    valid: boolean;
    error?: string;
} => {
    if (!file) {
        return { valid: false, error: "No file uploaded" };
    }

    if (!isValidFileType(file.mimetype)) {
        return { valid: false, error: `Invalid file type: ${file.mimetype}` };
    }

    if (!isValidFileSize(file.size)) {
        const maxSize = formatFileSize(UPLOAD_CONFIG.MAX_FILE_SIZE);
        return { valid: false, error: `File size exceeds ${maxSize} limit` };
    }

    return { valid: true };
};

/**
 * Extract folder name from path or use default
 */
export const getUploadFolder = (folder?: string): string => {
    return folder || UPLOAD_CONFIG.UPLOAD_FOLDER;
};

/**
 * Get upload metadata (removed logging for production)
 */
export const getUploadMetadata = (file: Express.Multer.File, folder?: string) => {
    return {
        filename: file.originalname,
        type: file.mimetype,
        size: formatFileSize(file.size),
        folder: getUploadFolder(folder),
    };
};
