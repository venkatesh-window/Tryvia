export const validate = (schema) => async (req, res, next) => {
  try {
    // We can validate body, query, and params
    const validatedData = await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    
    // Replace req properties with validated ones (strips unexpected fields if schema uses .strip())
    req.body = validatedData.body;
    req.query = validatedData.query;
    req.params = validatedData.params;
    
    next();
  } catch (error) {
    const errorDetails = error.errors
      ? error.errors
          .map((e) => {
            const field = e.path ? e.path.filter((p) => p !== "body").join(".") : "";
            return field ? `${field}: ${e.message}` : e.message;
          })
          .join(", ")
      : error.message;

    res.status(400).json({
      detail: `Validation failed: ${errorDetails || "Invalid input data"}`,
      errors: error.errors,
    });
  }
};
