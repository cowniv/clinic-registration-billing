import jwt from "jsonwebtoken";

const secret = () => process.env.JWT_SECRET || "dev-only-secret";

export function signToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, name: user.full_name },
    secret(),
