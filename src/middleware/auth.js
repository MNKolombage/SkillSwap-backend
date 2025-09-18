// ESM
import jwt from "jsonwebtoken";

const COOKIE_NAME = process.env.COOKIE_NAME || "skill_swap_jwt";

function extractToken(req) {
  const hdr = req.headers.authorization;
  const bearer = hdr && hdr.startsWith("Bearer ") ? hdr.slice(7).trim() : null;
  const cookieToken = req.cookies?.[COOKIE_NAME] || null;
  return bearer || cookieToken || null;
}

export function authRequired(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.id;
    req.user = { id: payload.id, ...(payload.role ? { role: payload.role } : {}) };
    return next();
  } catch (err) {
    if (err?.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Session expired" });
    }
    return res.status(401).json({ message: "Unauthorized" });
  }
}

export function maybeAuth(req, _res, next) {
  try {
    const token = extractToken(req);
    if (!token) return next();
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.id;
    req.user = { id: payload.id, ...(payload.role ? { role: payload.role } : {}) };
  } catch {}
  return next();
}

export function requireRole(roles = []) {
  return function roleGuard(req, res, next) {
    if (!req.user?.id) return res.status(401).json({ message: "Unauthorized" });
    if (roles.length && !roles.includes(req.user?.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    return next();
  };
}
