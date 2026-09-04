/**
 * Validate request data using Zod schema
 * @param {ZodSchema} schema - Zod schema to validate against
 * @param {string} source - Where to validate: 'body', 'query', or 'params' (default: 'body')
 */
const validate = (schema, source = 'body') => (req, res, next) => {
  let dataToValidate;

  // Choose which part of the request to validate
  switch (source) {
    case 'query':
      dataToValidate = req.query;
      break;
    case 'params':
      dataToValidate = req.params;
      break;
    case 'body':
    default:
      dataToValidate = req.body;
      break;
  }

  const result = schema.safeParse(dataToValidate);

  if (!result.success) {
    const errors = result.error.issues.map((e) => ({
      field: e.path.join(".") || "unknown",
      message: e.message,
    }));

    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  // Store validated data back in the appropriate location
  if (source === 'body') {
    req.body = result.data;
  } else if (source === 'query') {
    req.query = result.data;
  } else if (source === 'params') {
    req.params = result.data;
  }

  next();
};

export const validateObjectId = (paramName) => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: `Missing parameter: ${paramName}`,
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ID format for: ${paramName}`,
      });
    }

    next();
  };
};
export default validate;