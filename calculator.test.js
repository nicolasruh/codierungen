"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const C = require("./calculator.js");

function value(expression, base = 10) {
  const result = C.evaluate(expression, base);
  assert.equal(result.valid, true, result.message);
  return result.value;
}

test("calculator respects operator precedence, parentheses and right-associative powers", () => {
  for (const [expression, expected] of [
    ["2+3*4", "14"], ["(2+3)*4", "20"], ["2^3^2", "512"],
    ["-2^2", "-4"], ["(-2)^2", "4"], ["2^-3", "0.125"],
    ["8/4*2", "4"], ["10-3-2", "5"], ["1--2", "3"], ["+2++3", "5"]
  ]) assert.equal(C.evaluate(expression).text, expected, expression);
});

test("calculator normalizes spaces, multiplication/division variants and decimal commas", () => {
  for (const expression of [" 2 x 3 ", "2 X 3", "2×3", "2·3"]) {
    assert.equal(C.evaluate(expression).text, "6");
    assert.equal(C.evaluate(expression).expression, "2*3");
  }
  for (const expression of ["6÷2", "6:2", "6 / 2"]) assert.equal(C.evaluate(expression).text, "3");
  assert.equal(C.evaluate("2 ** 7").text, "128");
  assert.equal(C.evaluate("1,5 + ,5").text, "2");
  assert.equal(C.evaluate("4 − 1").text, "3");
  assert.equal(C.evaluate("1.").text, "1");
});

test("calculator retains exact 64-bit integers and interprets every literal in the chosen base", () => {
  assert.equal(value("2^64-1").numerator, 18446744073709551615n);
  assert.equal(C.evaluate("FFFFFFFFFFFFFFFF", 16).text, "FFFFFFFFFFFFFFFF");
  assert.equal(C.evaluate("2^40-1", 16).text, "FFFFFFFFFFFFFFFF");
  assert.equal(C.evaluate("a+f", 16).text, "19");
  assert.equal(C.evaluate("10+10", 16).text, "20");
  assert.equal(C.evaluate("10+10", 10).text, "20");
  assert.equal(value("10", 16).numerator, 16n);
  assert.equal(value("10", 10).numerator, 10n);
  assert.equal(C.evaluate("2^8").text, "256");
  assert.equal(C.evaluate("2^7").text, "128");
});

test("fractions are exact and finite base-specific fractions render without rounding", () => {
  assert.deepEqual(value("0.1+0.2"), { numerator: 3n, denominator: 10n });
  assert.equal(C.evaluate("0.1+0.2").text, "0.3");
  assert.equal(C.evaluate("1/3").text, "1 / 3");
  assert.equal(C.evaluate("(1/3)*3").text, "1");
  assert.equal(C.evaluate("-1/2").text, "-0.5");
  assert.equal(C.evaluate("A.F+.1", 16).text, "B");
  assert.equal(C.evaluate("1/8", 16).text, "0.2");
  assert.equal(C.evaluate("1/A", 16).text, "1 / A");
  assert.deepEqual(value("0/3"), { numerator: 0n, denominator: 1n });
  assert.equal(C.evaluate("1/(2^200)").text, "1 / " + (2n ** 200n).toString());
});

test("signed integer calculations and base conversion preserve exact negative 64-bit results", () => {
  assert.equal(C.evaluate("-2^63").text, "-9223372036854775808");
  assert.equal(C.evaluate("-2^3F", 16).text, "-8000000000000000");
  assert.equal(C.evaluate("-128+64+1").text, "-63");
  const converted = C.convertExpression("-128+64+1", 10, 16);
  assert.equal(converted.expression, "-80+40+1");
  assert.equal(C.evaluate(converted.expression, 16).text, "-3F");
  assert.deepEqual(value(converted.expression, 16), value("-128+64+1"));
});

test("incomplete or invalid expressions have question-mark output and explicit errors", () => {
  for (const expression of ["", "1+", "(", "1)", "2(3)", "()", ".", "1..2", "1.2.3",
    "G", "A", "1/0", "1/(2-2)", "0^0", "0^-1", "2^0.5", "2*/3", "alert(1)", "1=2"]) {
    const result = C.evaluate(expression);
    assert.equal(result.valid, false, expression);
    assert.equal(result.text, "?");
    assert.equal(result.value, null);
    assert.ok(result.message);
  }
  assert.equal(C.evaluate("F", 16).valid, true);
});

test("calculator guards excessive input, nesting, exponents and result size", () => {
  assert.equal(C.evaluate("1".repeat(513)).valid, false);
  assert.equal(C.evaluate(" ".repeat(513)).valid, false);
  assert.equal(C.evaluate("(".repeat(63) + "1" + ")".repeat(63)).valid, true);
  assert.equal(C.evaluate("(".repeat(64) + "1" + ")".repeat(64)).valid, false);
  assert.equal(C.evaluate("-".repeat(65) + "1").valid, false);
  assert.equal(C.evaluate("2^4096").valid, true);
  assert.equal(C.evaluate("2^4097").valid, false);
  assert.equal(C.evaluate("2^(2^64)").valid, false);
  assert.equal(C.evaluate("(2^4096)^2").valid, false);
  assert.equal(C.evaluate("(2^-4096)^2").valid, false);
  assert.throws(() => C.evaluate("1", 2), RangeError);
  assert.throws(() => C.convertExpression("1", 10, 2), RangeError);
});

test("base changes convert literals and preserve partial expressions", () => {
  assert.equal(C.convertExpression("128 + 8^10", 10, 16).expression, "80+8^A");
  assert.equal(C.convertExpression("80+8^A", 16, 10).expression, "128+8^10");
  assert.equal(C.convertExpression("128+", 10, 16).expression, "80+");
  assert.equal(C.convertExpression("(128+", 10, 16).expression, "(80+");
  assert.equal(C.convertExpression("", 10, 16).expression, "");
  const invalid = C.convertExpression("G+", 10, 16);
  assert.equal(invalid.valid, false);
  assert.equal(invalid.expression, "G+");
  assert.match(invalid.message, /nicht umgerechnet/);
});

test("base changes preserve exact non-terminating fractions as parenthesized quotients", () => {
  assert.equal(C.convertExpression("1.5", 10, 16).expression, "1.8");
  assert.equal(C.convertExpression("1.8", 16, 10).expression, "1.5");
  assert.equal(C.convertExpression("0.1^2", 10, 16).expression, "(1/A)^2");
  for (const expression of ["0.1^2", "-0.3*4", "1.25+2^-3", "2^10-1", "(1/3)*3"]) {
    const converted = C.convertExpression(expression, 10, 16);
    assert.equal(converted.valid, true);
    assert.deepEqual(value(converted.expression, 16), value(expression));
    const roundtrip = C.convertExpression(converted.expression, 16, 10);
    assert.equal(roundtrip.valid, true);
    assert.deepEqual(value(roundtrip.expression), value(expression));
  }
});

test("sampled mixed arithmetic retains the exact value through decimal/hex roundtrips", () => {
  for (let n = 1; n <= 128; n += 1) {
    const expression = `${n}+${n + 1}/(${n}+2)-2^(${n % 8})`;
    const converted = C.convertExpression(expression, 10, 16);
    assert.equal(converted.valid, true);
    assert.deepEqual(value(converted.expression, 16), value(expression));
    const roundtrip = C.convertExpression(converted.expression, 16, 10);
    assert.deepEqual(value(roundtrip.expression), value(expression));
  }
});
