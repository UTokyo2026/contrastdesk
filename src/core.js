export function hexColor(value) {
  let hex = value.trim().replace(/^#/, "");
  if (/^[a-f\d]{3}$/i.test(hex)) hex = [...hex].map((c) => c + c).join("");
  if (!/^[a-f\d]{6}$/i.test(hex))
    throw new Error("Use opaque #RGB or #RRGGBB colors.");
  return "#" + hex.toLowerCase();
}
export function rgb(color) {
  const hex = hexColor(color);
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
}
export function luminance(color) {
  const linear = rgb(color).map((v) => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}
export function contrast(a, b) {
  const x = luminance(a),
    y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
export const rating = (ratio) =>
  ratio >= 7
    ? "AAA normal"
    : ratio >= 4.5
      ? "AA normal"
      : ratio >= 3
        ? "AA large only"
        : "Below AA text";
export function parsePalette(text) {
  const rows = text
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean);
  if (rows.length < 2 || rows.length > 24)
    throw new Error("Use between 2 and 24 colors, one per line.");
  const names = new Set();
  return rows.map((line, i) => {
    const match = line.match(
      /^(?:--)?([a-zA-Z][\w-]*)\s*:\s*(#[a-f\d]{3}|#[a-f\d]{6})\s*;?$/i,
    );
    const name = match ? match[1] : `color-${i + 1}`,
      color = hexColor(match ? match[2] : line);
    if (names.has(name)) throw new Error(`Duplicate color name: ${name}`);
    names.add(name);
    return { name, color };
  });
}
export function suggest(foreground, background, target = 4.5) {
  if (contrast(foreground, background) >= target) return hexColor(foreground);
  const source = rgb(foreground);
  const candidates = [];
  for (const endpoint of [0, 255]) {
    const mix = (t) =>
      "#" +
      source
        .map((c) =>
          Math.round(c + (endpoint - c) * t)
            .toString(16)
            .padStart(2, "0"),
        )
        .join("");
    if (contrast(mix(1), background) < target) continue;
    let low = 0,
      high = 1;
    for (let i = 0; i < 16; i++) {
      const mid = (low + high) / 2;
      if (contrast(mix(mid), background) >= target) high = mid;
      else low = mid;
    }
    const color = mix(high);
    if (contrast(color, background) >= target)
      candidates.push({
        color,
        distance: rgb(color).reduce((n, c, i) => n + (c - source[i]) ** 2, 0),
      });
  }
  return candidates.sort((a, b) => a.distance - b.distance)[0]?.color || null;
}
