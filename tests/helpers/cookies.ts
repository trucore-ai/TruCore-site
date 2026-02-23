export function parseSetCookie(setCookieHeader: string) {
  const parts = setCookieHeader.split(";").map((part) => part.trim());
  const [nameValue, ...attributeParts] = parts;
  const [name = "", ...valueParts] = nameValue.split("=");

  const attributes = new Map<string, string | true>();
  for (const attribute of attributeParts) {
    const [rawKey, ...rawValue] = attribute.split("=");
    const key = rawKey.toLowerCase();
    if (!key) continue;
    if (rawValue.length === 0) {
      attributes.set(key, true);
      continue;
    }
    attributes.set(key, rawValue.join("="));
  }

  return {
    name,
    value: valueParts.join("="),
    attributes,
  };
}