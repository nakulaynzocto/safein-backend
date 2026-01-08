import morgan from "morgan";
import fs from "fs";
import path from "path";

const logDir = path.join(process.cwd(), "logs");

const ensureLogDirectory = () => {
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
        console.log(`📁 Created logs directory: ${logDir}`);
    }
};

ensureLogDirectory();

let accessLogStream: fs.WriteStream;
let errorLogStream: fs.WriteStream;

try {
    accessLogStream = fs.createWriteStream(path.join(logDir, "access.log"), { flags: "a" });
    errorLogStream = fs.createWriteStream(path.join(logDir, "error.log"), { flags: "a" });
} catch (error) {
    console.error("Failed to create log streams:", error);
    accessLogStream = process.stdout as any;
    errorLogStream = process.stderr as any;
}

morgan.token("reqId", (req: any) => req.requestId || "unknown");

morgan.token("responseTime", (_req: any, res: any) => {
    const responseTime = res.get("X-Response-Time");
    return responseTime ? `${responseTime}ms` : "unknown";
});

export const devFormat = ":method :url :status :response-time ms - :res[content-length] - :reqId";

export const combinedFormat =
    ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms :reqId';

export const apiFormat = ":method :url :status :response-time ms - :res[content-length] - :user-agent - :reqId";

export const skipFunction = (req: any, _res: any) => {
    if (req.url === "/health" || req.url === "/ping") {
        return true;
    }

    if (process.env.NODE_ENV === "production" && (req.url.startsWith("/static/") || req.url.includes("."))) {
        return true;
    }

    return false;
};

export const morganOptions = {
    skip: skipFunction,
    stream: {
        write: (message: string) => {
            console.log(message.trim());
        },
    },
};

export const morganFileOptions = {
    skip: skipFunction,
    stream: accessLogStream,
};

export const morganErrorOptions = {
    skip: (_req: any, res: any) => {
        return res.statusCode < 400;
    },
    stream: errorLogStream,
};

export const errorFormat =
    ':remote-addr - [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms :reqId - ERROR';

export { accessLogStream, errorLogStream };
