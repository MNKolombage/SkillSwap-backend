import jwt from "jsonwebtoken";

export function authRequired(req, res, next) {
  try {
    const bearer = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : null;
    const cookieToken = req.cookies?.[process.env.COOKIE_NAME];

    const token = bearer || cookieToken;
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.id };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized" });
  }
}
