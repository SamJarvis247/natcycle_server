exports.errorHandler = (err, req, res, next) => {
  console.log("Middleware Error handling");
  const errStatus = err.statusCode || 500;
  const errMsg = err.message || "Something went wrong";
  console.log(err);
  res.status(errStatus).json({
    success: false,
    status: errStatus,
    message: errMsg,
    stack: process.env.NODE_ENV === "development" ? err.stack : {},
  });
};
