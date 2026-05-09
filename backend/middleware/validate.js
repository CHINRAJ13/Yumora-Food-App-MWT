import AppError from '../utils/AppError.js';

const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (err) {
    const issues = err.issues || err.errors || [];
    const message = issues.map((i) => i.message).join('. ');
    return next(new AppError(message || 'Validation failed', 400));
  }
};

export default validate;
