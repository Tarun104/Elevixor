module.exports = function (err, req, res, next) {
  // Always log the full error for debugging (server logs only)
  console.error(err && err.stack ? err.stack : err);

  const status = err && err.status ? err.status : 500;
  const message = err && err.message ? err.message : 'Server error';

  // Structured response expected by clients
  res.status(status).json({ success: false, message });
};
