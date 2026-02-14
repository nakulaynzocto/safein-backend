import morgan from "morgan";

morgan.token("reqId", (req: any) => req.id || "unknown");

morgan.token("responseTime", (_req: any, res: any) => {
    const responseTime = res.get("X-Response-Time");
    return responseTime ? `${responseTime}ms` : "unknown";
});

export const devFormat = ":method :url :status :response-time ms - :res[content-length]";

export const combinedFormat =
    ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms';

export const apiFormat = ":method :url :status :response-time ms - :res[content-length] - :user-agent";

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
