import jwt from "jsonwebtoken";

const secret = () => process.env.JWT_SECRET || "dev-only-secret";

export function signToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, name: user.full_name },
    secret(),
    { expiresIn: "10h" } // about one clinic shift
  );
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Not logged in" });
  try {
    const payload = jwt.verify(token, secret());
    req.user = { id: payload.sub, role: payload.role, name: payload.name };
    next();
  } catch {
    res.status(401).json({ error: "Session expired, please log in again" });
  }
}

// Admin can always do everything.
export const allow =
  (...roles) =>
  (req, res, next) => {
    if (req.user.role === "admin" || roles.includes(req.user.role)) return next();
    res.status(403).json({ error: "Your role can't do that" });
  };
