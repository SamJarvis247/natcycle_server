function logRoute(req, res, next) {
  const { method, url } = req;
  const timestamp = new Date().toISOString();
  console.log(`📍 [${timestamp}] ${method} request to ${url}`);
  next();
}

module.exports = logRoute;
