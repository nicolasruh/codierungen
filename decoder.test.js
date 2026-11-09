"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const D = require("./decoder.js");
const Lesson = require("./learning.js");
const defaults = { integerSize: 8, charset: "ascii", colorDepth: 24, colorSpace: "rgb", reverseBoolean: false };
const decode = (bits, type = "integer", settings = {}) => D.interpret(bits, type, { ...defaults, ...settings });
const first = (...args) => decode(...args).blocks[0].decoded;

test("input validation and empty state", () => {
  for (const value of ["", "0", "1", "0".repeat(64)]) assert.equal(D.validateInput(value).valid, true);
  for (const value of ["01 01", "01\n", "02", "A", "1".repeat(65)]) assert.equal(D.validateInput(value).valid, false);
  assert.deepEqual(decode("").blocks, []);
  assert.throws(() => decode("2"));
  assert.throws(() => D.partition("01", 0));
});

test("left padding preserves original input and can exceed 64 bits", () => {
  const short = decode("101", "integer");
  assert.equal(short.original, "101");
  assert.equal(short.padded, "00000101");
  assert.equal(short.padding, 5);
  assert.equal(short.blocks[0].padding, 5);
  assert.equal(short.blocks[0].decoded.value, 5n);
  const colors = decode("1".repeat(64), "color");
  assert.equal(colors.original.length, 64);
  assert.equal(colors.padded.length, 72);
  assert.equal(colors.blocks.length, 3);
  assert.equal(colors.blocks[0].padding, 8);
  assert.equal(colors.blocks[1].padding, 0);
});

test("all input lengths and block sizes form complete blocks with left-only padding", () => {
  for (let length = 0; length <= 64; length += 1) {
    const bits = "10".repeat(32).slice(0, length);
    for (let size = 1; size <= 64; size += 1) {
      const result = D.partition(bits, size);
      assert.equal(result.original, bits);
      assert.equal(result.padded, "0".repeat(result.padding) + bits);
      assert.equal(result.padded.length % size, 0);
      assert.equal(result.blocks.map(block => block.bits).join(""), result.padded);
      assert.equal(result.blocks.reduce((sum, block) => sum + block.padding, 0), result.padding);
      assert.ok(result.blocks.every(block => block.bits.length === size));
      assert.ok(result.padding < size);
    }
  }
});

test("all integer block sizes retain exact BigInt values", () => {
  for (const size of D.INTEGER_SIZES) {
    assert.equal(first("1".repeat(size), "integer", { integerSize: size }).value, (1n << BigInt(size)) - 1n);
  }
  assert.equal(first("0".repeat(64), "integer", { integerSize: 64 }).value, 0n);
  assert.equal(first("1".repeat(64), "integer", { integerSize: 64 }).value, 18446744073709551615n);
  assert.equal(first("01001011").value, 75n);
  assert.throws(() => decode("1", "integer", { integerSize: 9 }));
});

test("signed integers retain exact minimum, maximum, zero and minus one at every supported size", () => {
  for (const size of D.INTEGER_SIZES) {
    const settings = { integerSize: size };
    const minimum = first("1" + "0".repeat(size - 1), "signed", settings);
    assert.equal(minimum.type, "integer");
    assert.equal(minimum.signed, true);
    assert.equal(minimum.value, -(1n << BigInt(size - 1)));
    assert.equal(first("0" + "1".repeat(size - 1), "signed", settings).value, (1n << BigInt(size - 1)) - 1n);
    assert.equal(first("0".repeat(size), "signed", settings).value, 0n);
    assert.equal(first("1".repeat(size), "signed", settings).value, -1n);
  }
  assert.throws(() => decode("1", "signed", { integerSize: 9 }));
});

test("every signed pattern up to eight bits equals the sum with a negative most significant weight", () => {
  for (let size = 1; size <= 8; size += 1) {
    for (let raw = 0; raw < 2 ** size; raw += 1) {
      const bits = raw.toString(2).padStart(size, "0");
      const expected = Array.from(bits, (bit, index) =>
        BigInt(bit) * (index === 0 ? -1n : 1n) * (1n << BigInt(size - index - 1))
      ).reduce((sum, term) => sum + term, 0n);
      assert.equal(first(bits, "signed", { integerSize: size }).value, expected, bits);
    }
  }
});

test("signed blocks preserve zero padding and interpret each complete block independently", () => {
  const padded = decode("111", "signed", { integerSize: 4 });
  assert.equal(padded.original, "111");
  assert.equal(padded.padded, "0111");
  assert.equal(padded.blocks[0].decoded.value, 7n);
  assert.equal(first("1111", "signed", { integerSize: 4 }).value, -1n);
  const mixed = decode("1".repeat(9), "signed");
  assert.equal(mixed.padding, 7);
  assert.deepEqual(mixed.blocks.map(block => block.decoded.value), [1n, -1n]);
  assert.deepEqual(decode("0111111110000000", "signed").blocks.map(block => block.decoded.value), [127n, -128n]);
});

test("signed answer parsing permits mathematical negative notation only when explicitly enabled", () => {
  for (const [text, base, expected] of [
    ["-128", 10, -128n], [" -80 ", 16, -128n], ["-ff", 16, -255n],
    ["-8000000000000000", 16, -9223372036854775808n],
    ["-9223372036854775808", 10, -9223372036854775808n], ["-0", 10, 0n]
  ]) {
    assert.equal(D.parseAnswer(text, base, true), expected);
    assert.equal(D.parseAnswer(text, base), null);
    assert.equal(D.digits(expected, base), expected.toString(base).toUpperCase());
  }
  for (const base of [10, 16]) {
    for (const text of ["", "-", "--1", "- 1", "-0x80", "-1.0"]) assert.equal(D.parseAnswer(text, base, true), null);
    assert.equal(D.parseAnswer("127", base, true), D.parseAnswer("127", base));
  }
});

test("signed exercises check both signs and preserve negative drafts across base changes", () => {
  for (const value of [-128n, -1n, 0n, 127n]) {
    for (const base of [10, 16]) {
      const lesson = new Lesson(decode(BigInt.asUintN(8, value).toString(2).padStart(8, "0"), "signed"));
      lesson.open(0).answer = D.digits(value, base);
      assert.equal(lesson.check(base), true);
    }
  }
  const lesson = new Lesson(decode("100000001111111101111111", "signed"));
  lesson.open(0).answer = "128";
  assert.equal(lesson.check(10), false);
  assert.match(lesson.current.feedback, /negativen Stellenwert/);
  lesson.current.answer = "-128";
  lesson.open(1).answer = "-1";
  lesson.open(2).answer = "127";
  lesson.changeBase(10, 16);
  assert.deepEqual(lesson.drafts.map(draft => draft.answer), ["-80", "-1", "7F"]);
  lesson.open(0);
  assert.equal(lesson.check(16), true);
  lesson.changeBase(16, 10);
  assert.deepEqual(lesson.drafts.map(draft => draft.answer), ["-128", "-1", "127"]);
  assert.deepEqual([...lesson.solved], [0]);
  for (const encoding of ["integer", "character"]) {
    const unsignedLesson = new Lesson(decode("01000001", encoding, { charset: encoding === "character" ? "utf8" : "ascii" }));
    unsignedLesson.open(0).answer = "-65";
    assert.equal(unsignedLesson.check(10), false);
    assert.equal(unsignedLesson.solved.size, 0);
  }
});

test("ASCII and explicitly defined code-page extensions", () => {
  assert.equal(first("01000001", "character").label, "A");
  assert.equal(first("10000001", "character").assigned, false);
  for (const charset of Object.keys(D.CHARSETS)) {
    const table = D.characterTable(charset);
    assert.equal(table.length, 256);
    assert.equal(table[0].label, "NUL");
    assert.equal(table[10].label, "LF");
    assert.equal(table[32].label, "SP");
    assert.equal(table[127].label, "DEL");
    assert.equal(table[129].assigned, charset === "cyrillic");
    for (let i = 0; i < 128; i += 1) assert.equal(table[i].character, String.fromCharCode(i));
  }
  assert.ok(D.characterTable("ascii").slice(128).every(entry => !entry.assigned));
  assert.equal(D.characterTable("de")[0xC4].character, "Ä");
  assert.equal(D.characterTable("de")[0xDF].character, "ß");
  assert.equal(D.characterTable("pl")[0xA5].character, "Ą");
  assert.equal(D.characterTable("cyrillic")[0xC0].character, "А");
  assert.equal(D.characterTable("cyrillic")[0x81].character, "Ѓ");
  assert.equal(D.characterTable("cyrillic")[0x98].assigned, false);
  assert.throws(() => D.characterTable("unknown"));
});

test("three language/script extensions have distinct second halves", () => {
  assert.deepEqual(Object.keys(D.CHARSETS), ["ascii", "de", "pl", "cyrillic"]);
  const differences = (left, right) => D.characterTable(left).slice(128).filter((entry, index) =>
    entry.character !== D.characterTable(right)[index + 128].character
  ).length;
  assert.ok(differences("de", "pl") >= 40);
  assert.ok(differences("de", "cyrillic") >= 80);
  assert.ok(differences("pl", "cyrillic") >= 80);
  assert.equal(D.characterTable("de")[0xC0].character, "À");
  assert.equal(D.characterTable("pl")[0xC0].character, "Ŕ");
  assert.equal(D.characterTable("cyrillic")[0xC0].character, "А");
});

test("RGB24 sample and all 24 color depths", () => {
  const sample = first("100000000011111111000000", "color");
  assert.deepEqual(sample.rgb, [128, 63, 192]);
  assert.deepEqual(sample.channels.map(channel => channel.raw), [128, 63, 192]);
  for (let depth = 1; depth <= 24; depth += 1) {
    const color = first("1".repeat(depth), "color", { colorDepth: depth });
    assert.equal(color.gray, depth % 3 !== 0);
    assert.equal(color.channels.length, depth % 3 === 0 ? 3 : 1);
    assert.ok(color.channels.every(channel => channel.raw === channel.max && channel.fraction === 1));
    assert.deepEqual(color.rgb, [255, 255, 255]);
    assert.deepEqual(first("0".repeat(depth), "color", { colorDepth: depth }).rgb, [0, 0, 0]);
  }
});

test("HSB normalization, hue wrap, grayscale independence and LAB gamut", () => {
  assert.deepEqual(first("000000001111111111111111", "color", { colorSpace: "hsb" }).rgb, [255, 0, 0]);
  assert.deepEqual(first("111111111111111111111111", "color", { colorSpace: "hsb" }).rgb, [255, 0, 0]);
  for (const colorSpace of ["rgb", "cmy", "hsb", "lab"]) {
    assert.deepEqual(first("1010", "color", { colorDepth: 4, colorSpace }).rgb, [170, 170, 170]);
  }
  const extreme = first("111111111111111111111111", "color", { colorSpace: "lab" });
  assert.deepEqual(extreme.physical, [100, 127, 127]);
  assert.equal(extreme.clipped, true);
  const neutral = D.labToRgb(50, 0, 0);
  assert.equal(neutral.clipped, false);
  assert.ok(neutral.rgb.every(value => Math.abs(value * 255 - 119) < 1));
  const white = D.labToRgb(100, 0, 0);
  assert.equal(white.clipped, false);
  assert.ok(white.rgb.every(value => Math.abs(value - 1) < 0.00001));
});

test("CMY complements each channel at every three-channel depth and preserves independent grayscale", () => {
  for (let depth = 1; depth <= 24; depth += 1) {
    if (depth % 3 !== 0) {
      const bits = "10".repeat(12).slice(0, depth);
      assert.deepEqual(D.decodeColor(bits, "cmy").rgb, D.decodeColor(bits, "rgb").rgb);
      continue;
    }
    const size = depth / 3;
    const max = 2 ** size - 1;
    for (const raw of [[0, 0, 0], [max, max, max], [max, 0, 0], [0, max, 0], [0, 0, max],
      [0, max, max], [max, 0, max], [max, max, 0], [Math.floor(max / 2), Math.floor(max / 3), max]]) {
      const bits = raw.map(value => value.toString(2).padStart(size, "0")).join("");
      const color = first(bits, "color", { colorDepth: depth, colorSpace: "cmy" });
      assert.deepEqual(color.channels.map(channel => channel.name), ["Cyan", "Magenta", "Gelb"]);
      assert.deepEqual(color.channels.map(channel => channel.raw), raw);
      assert.deepEqual(color.rgb, raw.map(value => Math.round((1 - value / max) * 255)));
      assert.equal(color.clipped, false);
    }
  }
  assert.equal(first("100000000011111111000000", "color", { colorSpace: "cmy" }).hex, "#7FC03F");
  const lesson = new Lesson(decode("100000000011111111000000", "color", { colorSpace: "cmy" }));
  lesson.open(0).channels = [128, 63, 192];
  assert.equal(lesson.check(16), true);
});

test("Boolean mapping and shared numeric bases", () => {
  assert.deepEqual(decode("01", "boolean").blocks.map(block => block.decoded.value), [false, true]);
  assert.deepEqual(decode("01", "boolean", { reverseBoolean: true }).blocks.map(block => block.decoded.value), [true, false]);
  assert.equal(D.digits(18446744073709551615n, 16), "FFFFFFFFFFFFFFFF");
  assert.equal(D.parseAnswer("ffffffffffffffff", 16), 18446744073709551615n);
  assert.equal(D.parseAnswer("75", 10), 75n);
  for (const answer of ["", "0x4B", "-1", "4 G", "4.5"]) assert.equal(D.parseAnswer(answer, 16), null);
  assert.equal(D.parseAnswer("4B", 10), null);
});

test("blocks can be solved in any order and automation solves only its target", () => {
  const lesson = new Lesson(decode("000000010100101100000010"));
  assert.equal(lesson.solved.size, 0);
  lesson.open(1).answer = "74";
  assert.equal(lesson.check(10), false);
  assert.equal(lesson.current.feedbackKind, "error");
  lesson.current.answer = "75";
  assert.equal(lesson.check(10), true);
  assert.deepEqual([...lesson.solved], [1]);
  lesson.automate(0);
  assert.equal(lesson.index, 1);
  assert.deepEqual([...lesson.solved], [1, 0]);
  lesson.automate(0);
  assert.equal(lesson.solved.size, 2);
  lesson.open(2).answer = "2";
  assert.equal(lesson.check(10), true);
  assert.equal(lesson.solved.size, 3);
});

test("unfinished answers and feedback are retained separately per block", () => {
  const lesson = new Lesson(decode("0000000101001011"));
  lesson.open(1).answer = "74";
  lesson.check(10);
  lesson.open(0).answer = "1";
  lesson.check(10);
  assert.equal(lesson.solved.size, 1);
  assert.equal(lesson.open(1).answer, "74");
  assert.equal(lesson.current.feedbackKind, "error");
  lesson.current.answer = "75";
  assert.equal(lesson.check(10), true);
  assert.equal(lesson.open(0).answer, "1");
});

test("next open block follows display order, skips solved blocks and wraps", () => {
  const lesson = new Lesson(decode("000000010100101100000010"));
  lesson.automate(1);
  assert.equal(lesson.nextUnsolved(1), 2);
  lesson.automate(2);
  assert.equal(lesson.nextUnsolved(1), 0);
  assert.equal(lesson.nextUnsolved(2), 0);
  lesson.open(0).answer = "1";
  lesson.check(10);
  assert.equal(lesson.nextUnsolved(0), null);
  assert.equal(lesson.nextUnsolved(2), null);
  assert.throws(() => lesson.nextUnsolved(3), RangeError);
  const single = new Lesson(decode("1"));
  single.automate(0);
  assert.equal(single.nextUnsolved(0), null);
});

test("learning checks characters, unassigned entries, channels and booleans", () => {
  for (const [result, correct, wrong] of [
    [decode("01000001", "character"), 65, 66],
    [decode("10000001", "character"), 129, 130],
    [decode("1", "boolean"), true, false],
    [decode("0", "boolean", { reverseBoolean: true }), true, false]
  ]) {
    const lesson = new Lesson(result);
    lesson.open(0);
    assert.equal(lesson.check(10), false);
    lesson.current.choice = wrong;
    assert.equal(lesson.check(10), false);
    lesson.current.choice = correct;
    assert.equal(lesson.check(10), true);
  }
  const color = new Lesson(decode("100000000011111111000000", "color"));
  color.open(0).channels = [128, 63];
  assert.equal(color.check(10), false);
  color.current.channels = [128, 63, 192];
  assert.equal(color.check(16), true);
  const gray = new Lesson(decode("1010", "color", { colorDepth: 4 }));
  gray.open(0).channels = [10];
  assert.equal(gray.check(10), true);
});

test("calculated character suggestions remain unconfirmed, block-specific and independent of the numeric base", () => {
  const lesson = new Lesson(decode("0100000101000010", "character"));
  assert.equal(lesson.open(0).suggestion, null);
  lesson.current.suggestion = 65;
  assert.equal(lesson.current.choice, null);
  assert.equal(lesson.check(10), false);
  assert.equal(lesson.solved.size, 0);
  lesson.open(1).suggestion = 66;
  lesson.changeBase(10, 16);
  assert.equal(lesson.open(0).suggestion, 65);
  assert.equal(lesson.current.choice, null);
  lesson.current.choice = 65;
  assert.equal(lesson.check(16), true);
  assert.equal(lesson.open(1).suggestion, 66);
  assert.equal(lesson.current.choice, null);
});

test("base changes translate every numeric draft and preserve selected block and progress", () => {
  const lesson = new Lesson(decode("0100101100001111"));
  lesson.open(1).answer = "15";
  lesson.check(10);
  lesson.open(0).answer = "75";
  lesson.changeBase(10, 16);
  assert.equal(lesson.current.answer, "4B");
  assert.equal(lesson.drafts[1].answer, "F");
  assert.equal(lesson.index, 0);
  assert.equal(lesson.check(16), true);
  lesson.changeBase(16, 10);
  assert.equal(lesson.current.answer, "75");
  assert.equal(lesson.solved.size, 2);
  lesson.current.answer = "invalid";
  lesson.changeBase(10, 16);
  assert.equal(lesson.current.answer, "");
  assert.equal(lesson.current.feedbackKind, "error");
  const color = new Lesson(decode("1010", "color", { colorDepth: 4 }));
  color.open(0).channels = [10];
  color.changeBase(10, 16);
  assert.deepEqual(color.current.channels, [10]);
});

test("empty lessons and invalid indices cannot start or automate an exercise", () => {
  const empty = new Lesson(decode(""));
  assert.equal(empty.solved.size, 0);
  assert.throws(() => empty.open(0), RangeError);
  assert.throws(() => empty.automate(0), RangeError);
  const lesson = new Lesson(decode("1"));
  assert.throws(() => lesson.current, RangeError);
  for (const index of [-1, 1, 0.5]) assert.throws(() => lesson.open(index), RangeError);
  lesson.open(0).answer = "0x1";
  assert.equal(lesson.check(16), false);
  assert.equal(lesson.current.feedbackKind, "error");
  lesson.current.answer = "1";
  assert.equal(lesson.check(16), true);
});

const byteBits = bytes => Array.from(bytes, byte => byte.toString(2).padStart(8, "0")).join("");
const utf8 = bits => decode(bits, "character", { charset: "utf8" });
const utf8Text = text => utf8(byteBits(new TextEncoder().encode(text)));

test("UTF-8 groups ASCII, umlauts and emoji by codepoint, not by byte", () => {
  const result = utf8Text("Aä😀");
  assert.equal(result.original.length, 56);
  assert.equal(result.size, null);
  assert.deepEqual(result.blocks.map(block => block.bits.length), [8, 16, 32]);
  assert.deepEqual(result.blocks.map(block => block.decoded.character), ["A", "ä", "😀"]);
  assert.deepEqual(result.blocks.map(block => block.decoded.value), [65n, 228n, 128512n]);
  assert.deepEqual(result.blocks.map(block => block.utf8.byteOffset), [0, 1, 3]);
  assert.deepEqual(result.blocks[1].utf8.bytes.map(byte => byte.prefixLength), [3, 2]);
  assert.equal(result.blocks[1].utf8.payload, "00011100100");
  assert.equal(result.blocks[2].decoded.identifier, "U+1F600");
  assert.equal(utf8Text("😀🚀").original.length, 64);
  assert.deepEqual(utf8Text("e\u0301").blocks.map(block => block.decoded.codePoint), [101, 769]);
});

test("UTF-8 scalar boundaries and sampled scalars agree with the strict native decoder", () => {
  const points = [0, 0x7F, 0x80, 0x7FF, 0x800, 0xD7FF, 0xE000, 0xFFFF,
    0x10000, 0x10FFFF, 0xFEFF, 0xFFFD, 0x378, 0x1F600];
  for (let point = 0; point <= 0x10FFFF; point += 7919) {
    if (point < 0xD800 || point > 0xDFFF) points.push(point);
  }
  const reference = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });
  for (const point of points) {
    const text = String.fromCodePoint(point);
    const bytes = new TextEncoder().encode(text);
    const block = utf8(byteBits(bytes)).blocks[0];
    assert.equal(block.decoded.type, "utf8");
    assert.equal(block.decoded.character, reference.decode(bytes));
    assert.equal(block.decoded.codePoint, point);
    assert.equal(Number(D.unsigned(block.utf8.payload)), point);
  }
  assert.equal(utf8Text("\uFEFFA").blocks[0].decoded.label, "BOM");
  assert.deepEqual(utf8("").blocks, []);
});

test("UTF-8 rejects malformed, overlong, surrogate and out-of-range sequences without replacement", () => {
  const malformed = [
    [0x80], [0xBF], [0xC0, 0x80], [0xC1, 0xBF], [0xF5, 0x80, 0x80, 0x80], [0xFF],
    [0xE0, 0x9F, 0xBF], [0xED, 0xA0, 0x80], [0xED, 0xBF, 0xBF],
    [0xF0, 0x8F, 0xBF, 0xBF], [0xF4, 0x90, 0x80, 0x80],
    [0xE2], [0xE2, 0x82], [0xF0, 0x9F, 0x98],
    [0xC2, 0x41], [0xE2, 0x82, 0x41], [0xF0, 0x9F, 0x41], [0xE2, 0xC3, 0xA4]
  ];
  const reference = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });
  for (const bytes of malformed) {
    const bits = byteBits(bytes);
    const result = utf8(bits);
    assert.ok(result.blocks.some(block => block.decoded.type === "error"), bytes.toString());
    assert.equal(result.blocks.map(block => block.bits).join(""), bits);
    assert.ok(result.blocks.filter(block => block.decoded.type === "error")
      .every(block => block.decoded.message && block.utf8.codePoint === null && !("character" in block.decoded)));
    assert.throws(() => reference.decode(Uint8Array.from(bytes)), TypeError);
  }
  assert.deepEqual(utf8(byteBits([0xE2, 0x82, 0x41, 0xC3, 0xA4])).blocks.map(block =>
    block.decoded.type === "error" ? "error" : block.decoded.character), ["error", "A", "ä"]);
});

test("every one- and two-byte sequence agrees with strict UTF-8 validation", () => {
  const reference = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });
  for (let length = 1; length <= 2; length += 1) {
    for (let value = 0; value < 2 ** (length * 8); value += 1) {
      const bytes = length === 1 ? [value] : [value >> 8, value & 255];
      const result = utf8(byteBits(bytes));
      const input = Uint8Array.from(bytes);
      if (result.blocks.some(block => block.decoded.type === "error")) {
        assert.throws(() => reference.decode(input), TypeError);
      } else {
        assert.equal(result.blocks.map(block => block.decoded.character).join(""), reference.decode(input));
      }
      assert.equal(result.blocks.map(block => block.bits).join(""), result.original);
    }
  }
});

test("UTF-8 pads only the initial byte and never invents continuation bytes", () => {
  for (let length = 0; length <= 64; length += 1) {
    const bits = "101".repeat(22).slice(0, length);
    const result = utf8(bits);
    assert.equal(result.original, bits);
    assert.equal(result.padded, "0".repeat(result.padding) + bits);
    assert.equal(result.padded.length % 8, 0);
    assert.ok(result.padded.length <= 64);
    assert.ok(result.padding < 8);
    assert.equal(result.blocks.map(block => block.bits).join(""), result.padded);
    assert.equal(result.blocks.reduce((sum, block) => sum + block.padding, 0), result.padding);
    assert.ok(result.blocks.slice(1).every(block => !block.padding));
  }
  assert.equal(utf8("1000001").blocks[0].decoded.character, "A");
  assert.equal(utf8("11100010").blocks[0].decoded.type, "error");
  assert.equal(utf8("11100010").blocks[0].bits.length, 8);
});

test("Unicode raster entries expose invisible controls and reject non-scalars", () => {
  assert.equal(D.unicodeEntry(0).label, "NUL");
  assert.equal(D.unicodeEntry(32).label, "SP");
  assert.equal(D.unicodeEntry(0x202E).label, "U+202E");
  assert.equal(D.unicodeEntry(0x200D).label, "ZWJ");
  assert.equal(D.unicodeEntry(0x0301).label, "◌\u0301");
  assert.equal(D.unicodeEntry(0x10FFFF).identifier, "U+10FFFF");
  for (const point of [-1, 0.5, 0xD800, 0xDFFF, 0x110000, NaN, null]) {
    assert.throws(() => D.unicodeEntry(point), RangeError);
  }
});

test("UTF-8 learning accepts codepoints in both bases and excludes errors from progress and navigation", () => {
  const lesson = new Lesson(utf8(byteBits([0xFF, 0x41, 0xC3, 0xA4, 0xFF])));
  assert.equal(lesson.total, 2);
  assert.equal(lesson.nextUnsolved(0), 1);
  assert.equal(lesson.nextUnsolved(2), 1);
  assert.throws(() => lesson.open(0), /ungültiger Block/);
  assert.throws(() => lesson.automate(3), /ungültiger Block/);
  lesson.open(2).answer = "227";
  assert.equal(lesson.check(10), false);
  assert.match(lesson.current.feedback, /Nutzbits/);
  lesson.current.answer = "228";
  lesson.changeBase(10, 16);
  assert.equal(lesson.current.answer, "E4");
  assert.equal(lesson.check(16), true);
  lesson.open(1).answer = "65";
  assert.equal(lesson.check(10), true);
  assert.equal(lesson.solved.size, 2);
  assert.equal(lesson.nextUnsolved(1), null);
  const invalid = new Lesson(utf8("11111111"));
  assert.equal(invalid.total, 0);
  assert.equal(invalid.nextUnsolved(0), null);
});
