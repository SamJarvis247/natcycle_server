const catchAsync = (asyncFunction) => (req, res, next) => {
  try {
    const result = asyncFunction(req, res, next);

    if (result instanceof Promise) {
      result.catch((err) => next(err));
    } else {
      Promise.resolve(result).catch((err) => next(err));
    }
  } catch (err) {
    next(err);
  }
};

module.exports = { catchAsync };
