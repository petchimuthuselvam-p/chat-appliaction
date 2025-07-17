const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'JWT token required' });

  jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ message: 'Token Expired' });
    req.user = user;
    next();
  });
};

module.exports = authenticateToken;
