import winston from "winston";

const { combine, timestamp, colorize, simple, json, errors } = winston.format;

// In containers, write everything to stdout/stderr so the runtime (Docker,
// Kubernetes, Railway, etc.) can collect and forward logs. File transports
// write to the ephemeral container filesystem — they don't survive a restart
// and are invisible to log aggregators.
const isProduction = process.env.NODE_ENV === "production";

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  transports: isProduction
    ? [
        // stdout — info and below
        new winston.transports.Console({
          stderrLevels: ["error"],
          format: combine(errors({ stack: true }), timestamp(), json()),
        }),
      ]
    : [
        new winston.transports.Console({
          format: combine(colorize(), simple()),
        }),
      ],
});

export default logger;
