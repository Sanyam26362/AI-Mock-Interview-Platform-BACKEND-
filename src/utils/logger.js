const { createLogger, format, transports } = require("winston");
const { combine, timestamp, colorize, printf, json } = format;

const devFormat = printf(({ level, message, timestamp, ...meta }) => {
  const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : "";
  return `${timestamp} [${level}]: ${message}${metaStr}`;
});

const logger = createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: combine(timestamp({ format: "YYYY-MM-DD HH:mm:ss" })),
  transports: [
    // Console — pretty in dev, JSON in prod
    new transports.Console({
      format:
        process.env.NODE_ENV === "production"
          ? combine(timestamp(), json())
          : combine(colorize(), timestamp({ format: "HH:mm:ss" }), devFormat),
    }),

    // File — errors always go to file
    new transports.File({
      filename: "logs/error.log",
      level: "error",
      format: combine(timestamp(), json()),
    }),

    // File — all logs in production
    ...(process.env.NODE_ENV === "production"
      ? [new transports.File({ filename: "logs/combined.log", format: combine(timestamp(), json()) })]
      : []),
  ],
});

// Stream for Morgan HTTP request logging
logger.stream = {
  write: (message) => logger.http(message.trim()),
};

module.exports = logger;
