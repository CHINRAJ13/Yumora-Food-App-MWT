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
    const message = err.errors.map((i) => i.message).join('. ');
    return next(new AppError(message, 400));
  }
};

export default validate;
