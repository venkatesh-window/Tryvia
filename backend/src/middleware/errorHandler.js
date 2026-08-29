export const errorHandler = (err, req, res, next) => {
  console.error("Server Error:", err);

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    detail: message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};
