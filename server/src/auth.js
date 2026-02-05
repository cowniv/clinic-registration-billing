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
