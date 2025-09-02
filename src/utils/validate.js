import validator from "validator";

/**
 * Email: RFC-compliant + normalized
 */
export function validateEmail(raw) {
  const email = (raw || "").trim().toLowerCase();
  if (!validator.isEmail(email)) {
    return { ok: false, message: "Please enter a valid email address" };
  }
  return { ok: true, email };
}

/**
 * Password policy (tweak as you like):
 * - min 8 chars
 * - at least 1 lowercase, 1 uppercase, 1 number, 1 symbol
 */
export function validatePassword(pw) {
  const password = String(pw || "");
  if (password.length < 8)
    return { ok: false, message: "Password must be at least 8 characters" };
  if (!/[a-z]/.test(password))
    return { ok: false, message: "Add at least one lowercase letter" };
  if (!/[A-Z]/.test(password))
    return { ok: false, message: "Add at least one uppercase letter" };
  if (!/[0-9]/.test(password))
    return { ok: false, message: "Add at least one number" };
  if (!/[^\w\s]/.test(password))
    return { ok: false, message: "Add at least one symbol (e.g., !@#$%)" };
  return { ok: true };
}

export function validateFullName(name) {
  const fullName = (name || "").trim();
  if (!fullName) return { ok: false, message: "Full name is required" };
  if (fullName.length < 2)
    return { ok: false, message: "Full name is too short" };
  if (fullName.length > 80)
    return { ok: false, message: "Full name is too long" };
  return { ok: true, fullName };
}
