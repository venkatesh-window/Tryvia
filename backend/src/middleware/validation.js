export const validate = (schema) => async (req, res, next) => {
  try {
    // We can validate body, query, and params
    const validatedData = await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    // Only replace req properties that the schema explicitly validated
    if (validatedData.body !== undefined) req.body = validatedData.body;
    if (validatedData.query !== undefined) req.query = validatedData.query;
    if (validatedData.params !== undefined) req.params = validatedData.params;

    next();
  } catch (error) {
    const issues = error.issues || error.errors;
    const errorDetails = Array.isArray(issues)
      ? issues
          .map((e) => {
            const field = e.path ? e.path.filter((p) => p !== "body").join(".") : "";
            return field ? `${field}: ${e.message}` : e.message;
          })
          .join(", ")
      : error.message;

    res.status(400).json({
      detail: `Validation failed: ${errorDetails || "Invalid input data"}`,
      errors: issues,
    });
  }
};
