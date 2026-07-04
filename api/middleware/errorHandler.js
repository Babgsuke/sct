function errorHandler(err, req, res, next) {
  console.error('[ERROR]', err.stack || err.message || err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
}

module.exports = errorHandler;
