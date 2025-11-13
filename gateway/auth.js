const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-demo-key";

function jwtAuth(required = true) {
  return (req, res, next) => {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
      return required
        ? res.status(401).json({ error: "Missing Bearer JWT token" })
        : next();
    }
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      req.user = payload;
      if(req.user.role !== 'admin'){
        res.status(403).json({ error: "Forbidden, Unauthorized Access" });
      }
      next();
    } catch {
      res.status(401).json({ error: "Invalid token" });
    }
  };
}

function login(req, res) {
  const { userId = "demo-user", role = "user" } = req.body || {};
  const token = jwt.sign({ sub: userId, role }, JWT_SECRET, { expiresIn: "1h" });
  res.json({ token });
}

module.exports = {
  jwtAuth,
  login,
};
