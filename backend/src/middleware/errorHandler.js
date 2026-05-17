module.exports = (err, req, res, next) => {
  // Log error (skip in test to keep output clean)
  if (process.env.NODE_ENV !== 'test') {
    console.error(err.stack);
  }
  const status = err.status || 500;
  // Return `error` key so the frontend can read err.response?.data?.error
  res.status(status).json({
    error: err.message || 'Internal Server Error',
  });
};
