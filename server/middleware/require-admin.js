function requireAdmin(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'not_authenticated' });
  }
  if (req.session.role !== 'admin') {
    return res.status(403).json({ error: 'admin_only' });
  }
  next();
}

module.exports = { requireAdmin };
