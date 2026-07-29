/**
 * Validates an Indian mobile number.
 * Accepts:  9876543210  |  +919876543210  |  919876543210  |  09876543210
 * Rules: starts with 6–9, exactly 10 digits (after stripping country code / leading 0).
 */
export function validatePhone(value: string): string | null {
  if (!value) return null; // empty is handled by `required` attr separately
  const cleaned = value.replace(/[\s\-()]/g, "");
  const digits  = cleaned.replace(/^(\+91|91|0)/, "");
  if (!/^[6-9]\d{9}$/.test(digits)) {
    return "Enter a valid 10-digit Indian mobile number (e.g. 98765 43210)";
  }
  return null;
}

/** Standard email validation */
export function validateEmail(value: string): string | null {
  if (!value) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())) {
    return "Enter a valid email address (e.g. name@example.com)";
  }
  return null;
}
