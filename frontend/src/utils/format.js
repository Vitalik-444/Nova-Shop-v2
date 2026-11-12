export function formatOrderDate(value, language) {
  const source = String(value || "");
  const date = new Date(source.replace(" ", "T"));
  if (isNaN(date.getTime())) return source;
  return new Intl.DateTimeFormat(language === "en" ? "en-US" : "uk-UA", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

export function preventDefault(event) {
  event.preventDefault();
}

/**
 * Checks if the given phone number is valid.
 * Supports Ukrainian formats (+380..., 380..., 0...) and standard international numbers (10 to 15 digits).
 */
export function isValidPhone(phone) {
  if (!phone || typeof phone !== "string") return false;
  const trimmed = phone.trim();

  // Allowed characters: digits, spaces, hyphens, parentheses, optional leading '+'
  if (!/^\+?[\d\s\-()]+$/.test(trimmed)) return false;

  const digits = trimmed.replace(/\D/g, "");
  // Standard phone numbers require between 10 and 15 digits (ITU-T E.164)
  if (digits.length < 10 || digits.length > 15) return false;

  // Ukrainian national number starting with 0: exactly 10 digits
  if (digits.startsWith("0")) {
    return digits.length === 10;
  }

  // Ukrainian international number starting with 380: exactly 12 digits
  if (digits.startsWith("380")) {
    return digits.length === 12;
  }

  return true;
}

/**
 * Formats a phone number for display/convenience.
 */
export function formatPhoneNumber(value) {
  if (!value || typeof value !== "string") return "";
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, "");

  // Format Ukrainian national number 0XX XXX XX XX
  if (digits.startsWith("0") && digits.length === 10 && !trimmed.startsWith("+")) {
    return `0${digits.slice(1, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`;
  }

  // Format Ukrainian international number +380 XX XXX XX XX
  if (digits.startsWith("380") && digits.length === 12) {
    return `+380 ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 10)} ${digits.slice(10, 12)}`;
  }

  return trimmed;
}

