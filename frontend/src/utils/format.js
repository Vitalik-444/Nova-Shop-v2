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
