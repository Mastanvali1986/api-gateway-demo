import jwt from 'jsonwebtoken';

export const issueToken = (userId, role, secret) =>
  jwt.sign({ sub: userId, role }, secret, { expiresIn: '1h' });

export const jwtAuth = secret => (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, secret);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};
