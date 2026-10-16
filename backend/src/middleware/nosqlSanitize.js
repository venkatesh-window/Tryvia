/**
 * NoSQL Injection sanitizer middleware.
 * Recursively strips keys starting with '$' or containing '.' from object payloads.
 */
function sanitizeObject(obj) {
  if (!obj || typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  const clean = {};
  for (const [key, value] of Object.entries(obj)) {
    // Drop keys containing MongoDB query operators or dot notation paths
    if (key.startsWith("$") || key.includes(".")) {
      continue;
    }
    clean[key] = sanitizeObject(value);
  }
  return clean;
}

export const nosqlSanitize = (req, _res, next) => {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeObject(req.body);
  }
  if (req.query && typeof req.query === "object") {
    req.query = sanitizeObject(req.query);
  }
  if (req.params && typeof req.params === "object") {
    req.params = sanitizeObject(req.params);
  }
  next();
};
