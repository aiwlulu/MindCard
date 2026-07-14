export function normalizeExternalUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const hasScheme = /^[a-z][a-z\d+.-]*:/i.test(trimmed);
  if (!hasScheme && (/[\s]/.test(trimmed) || !trimmed.includes("."))) {
    return null;
  }
  const candidate = hasScheme ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(candidate);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

export function formatExternalLinkLabel(value: string): string {
  try {
    return new URL(value).hostname.replace(/^www\./, "") || "External link";
  } catch {
    return "External link";
  }
}
