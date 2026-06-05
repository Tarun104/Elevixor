exports.notImplemented = (req, res) => {
  res.status(501).json({ message: 'This API is a placeholder for future features.' });
};
