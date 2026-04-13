const winston = require("winston");
const path = require("path");

// Define log format using combine
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: logFormat,
  defaultMeta: { service: "property-sales-service" },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp, ...meta }) => {
          const metaStr = Object.keys(meta).length
            ? JSON.stringify(meta, null, 2)
            : "";
          return `${timestamp} [${level}]: ${message} ${metaStr}`;
        }),
      ),
    }),
    // Error Log File
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
    }),
    // Combined Log File
    new winston.transports.File({
      filename: "logs/combined.log",
    }),
  ],
});

// Don't log in test environment
if (process.env.NODE_ENV === "test") {
  logger.silent = true;
}

module.exports = logger;