export const errorHandler = (err, req, res, next) => {
  console.error("Server Error:", err);

  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || "Internal Server Error";

  if (err.name === "MulterError" || message.includes("Invalid file type")) {
    statusCode = 400;
  }

  // Prevent internal database and operational stack leaks in production
  if (process.env.NODE_ENV === "production" && statusCode >= 500) {
    message = "An unexpected error occurred. Please try again later.";
  }

  res.status(statusCode).json({
    detail: message,
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
};

