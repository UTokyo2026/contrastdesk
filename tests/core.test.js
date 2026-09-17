import test from "node:test";
import assert from "node:assert/strict";
import { contrast, rating, parsePalette, suggest } from "../src/core.js";
test("black-white is 21, equal colors are 1, ratio is symmetric", () => {
  assert.equal(contrast("#000", "#fff"), 21);
  assert.equal(contrast("#abc", "#abc"), 1);
  assert.equal(contrast("#777", "#fff"), contrast("#fff", "#777"));
});
test("does not round failing colors into a pass", () => {
  assert.ok(contrast("#777", "#fff") < 4.5);
  assert.equal(rating(contrast("#777", "#fff")), "AA large only");
});
test("suggested colors truly meet threshold or explicitly fail", () => {
  const c = suggest("#aaa", "#fff", 4.5);
  assert.ok(contrast(c, "#fff") >= 4.5);
  assert.equal(suggest("#aaa", "#777", 7), null);
});
test("palette requires valid unique opaque colors", () => {
  assert.equal(parsePalette("a: #abc\nb: #ffffff")[0].color, "#aabbcc");
  assert.throws(() => parsePalette("a: #000\na: #fff"));
  assert.throws(() => parsePalette("#00000000\n#fff"));
});
