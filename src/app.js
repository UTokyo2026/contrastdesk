import { parsePalette, contrast, rating, suggest } from "./core.js";
import {
  $,
  init,
  message,
  table,
  stats,
  csv,
  download,
  guard,
  ready,
} from "./ui.js";
init();
let palette = [],
  pairs = [];
function preview() {
  const fg = $("foreground").value,
    bg = $("background").value;
  if (!fg || !bg) return;
  const ratio = contrast(fg, bg);
  $("preview").style.color = fg;
  $("preview").style.background = bg;
  $("preview-ratio").textContent = `${ratio.toFixed(2)}:1 · ${rating(ratio)}`;
  const next = suggest(fg, bg, Number($("target").value));
  $("suggestion").textContent = next
    ? `Suggested text color: ${next} (${contrast(next, bg).toFixed(2)}:1)`
    : "Neither black nor white meets this target on the selected background.";
}
function run() {
  palette = parsePalette($("source").value);
  pairs = palette.flatMap((a) =>
    palette
      .filter((b) => b.name !== a.name)
      .map((b) => ({ a, b, ratio: contrast(a.color, b.color) })),
  );
  stats([
    ["Colors", palette.length],
    ["Pairs", pairs.length],
    ["AA normal", pairs.filter((p) => p.ratio >= 4.5).length],
    ["AAA normal", pairs.filter((p) => p.ratio >= 7).length],
  ]);
  table(
    ["Text", "Background", "Contrast", "WCAG 2 text threshold"],
    pairs.map((p) => [
      `${p.a.name} ${p.a.color}`,
      `${p.b.name} ${p.b.color}`,
      p.ratio.toFixed(2) + ":1",
      rating(p.ratio),
    ]),
  );
  for (const id of ["foreground", "background"]) {
    $(id).replaceChildren();
    for (const p of palette) {
      const option = document.createElement("option");
      option.value = p.color;
      option.textContent = `${p.name} ${p.color}`;
      $(id).append(option);
    }
  }
  $("background").selectedIndex = 1;
  preview();
  message(
    "Pass/fail uses the unrounded ratio. Large text means at least 18 pt, or 14 pt bold.",
  );
  ready();
}
$("run").onclick = guard(run);
for (const id of ["foreground", "background", "target"])
  $(id).onchange = preview;
$("export").onclick = () =>
  download(
    csv([
      ["foreground", "background", "ratio", "rating"],
      ...pairs.map((p) => [
        p.a.name,
        p.b.name,
        p.ratio.toFixed(6),
        rating(p.ratio),
      ]),
    ]),
    "contrastdesk-report.csv",
    "text/csv;charset=utf-8",
  );
$("css").onclick = () =>
  download(
    ":root {\n" +
      palette.map((p) => `  --${p.name}: ${p.color};`).join("\n") +
      "\n}\n",
    "palette.css",
    "text/css",
  );
$("demo").onclick = guard(() => {
  $("source").value =
    "ink: #25362b\npaper: #f6f7f2\nleaf: #5d7950\nmuted: #8b9584\nsun: #e6b15b";
  run();
});
