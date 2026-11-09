(function (root) {
  "use strict";
  const MAX_LENGTH = 512;
  const MAX_BITS = 8192;
  const MAX_POWER = 4096n;

  class CalculationError extends Error {}

  function assertBase(base) {
    if (base !== 10 && base !== 16) throw new RangeError("Zahlenbasis muss 10 oder 16 sein.");
  }

  function gcd(a, b) {
    a = a < 0n ? -a : a;
    while (b) [a, b] = [b, a % b];
    return a;
  }

  function fraction(numerator, denominator = 1n) {
    if (!denominator) throw new CalculationError("Division durch null ist nicht möglich.");
    if (denominator < 0n) {
      numerator = -numerator;
      denominator = -denominator;
    }
    const divisor = gcd(numerator, denominator);
    numerator /= divisor;
    denominator /= divisor;
    if (numerator.toString(2).replace("-", "").length > MAX_BITS || denominator.toString(2).length > MAX_BITS) {
      throw new CalculationError("Die Rechnung wird zu groß (höchstens 8192 Bit pro Wert).");
    }
    return { numerator, denominator };
  }

  function normalize(expression) {
    return expression.replace(/\s/g, "").replace(/[xX×·]/g, "*").replace(/[÷:]/g, "/")
      .replace(/−/g, "-").replace(/,/g, ".").replace(/\*\*/g, "^").toUpperCase();
  }

  function tokens(expression, base) {
    if (expression.length > MAX_LENGTH) throw new CalculationError("Höchstens 512 Zeichen pro Rechnung.");
    const result = [];
    for (let offset = 0; offset < expression.length;) {
      const character = expression[offset];
      if (/[0-9A-F.]/.test(character)) {
        const start = offset;
        while (offset < expression.length && /[0-9A-F.]/.test(expression[offset])) offset += 1;
        const text = expression.slice(start, offset);
        const pattern = base === 10 ? /^(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)$/ : /^(?:[0-9A-F]+(?:\.[0-9A-F]*)?|\.[0-9A-F]+)$/;
        if (!pattern.test(text)) throw new CalculationError(`Ungültige Zahl für Basis ${base}: ${text}`);
        const [whole, places = ""] = text.split(".");
        const digits = (whole || "0") + places;
        const numerator = BigInt(base === 16 ? "0x" + digits : digits);
        result.push({ text, value: fraction(numerator, BigInt(base) ** BigInt(places.length)) });
      } else {
        if (!"+-*/^()".includes(character)) throw new CalculationError(`Unbekanntes Zeichen: ${character}`);
        result.push({ text: character });
        offset += 1;
      }
    }
    return result;
  }

  function power(left, right) {
    if (right.denominator !== 1n) throw new CalculationError("Der Exponent muss ganzzahlig sein.");
    const exponent = right.numerator < 0n ? -right.numerator : right.numerator;
    if (exponent > MAX_POWER) throw new CalculationError("Der Betrag des Exponenten darf höchstens 4096 sein.");
    if (!left.numerator && !exponent) throw new CalculationError("0 hoch 0 ist nicht definiert.");
    for (const value of [left.numerator, left.denominator]) {
      const bits = value.toString(2).replace("-", "").length;
      if ((bits - 1) * Number(exponent) + 1 > MAX_BITS) {
        throw new CalculationError("Die Potenz wird zu groß (höchstens 8192 Bit pro Wert).");
      }
    }
    const numerator = left.numerator ** exponent;
    const denominator = left.denominator ** exponent;
    return right.numerator < 0n ? fraction(denominator, numerator) : fraction(numerator, denominator);
  }

  function calculate(input) {
    let position = 0;
    let depth = 0;
    const take = text => {
      if (input[position] && input[position].text === text) {
        position += 1;
        return true;
      }
      return false;
    };
    function primary() {
      if (take("(")) {
        const value = sum();
        if (!take(")")) throw new CalculationError("Schließende Klammer fehlt.");
        return value;
      }
      const token = input[position];
      if (!token) throw new CalculationError("Rechnung unvollständig.");
      if (!token.value) throw new CalculationError(`Zahl oder Klammer erwartet, nicht ${token.text}.`);
      position += 1;
      return token.value;
    }
    function unary() {
      depth += 1;
      if (depth > 64) throw new CalculationError("Zu viele verschachtelte Rechenschritte (höchstens 64).");
      let value;
      if (take("+")) value = unary();
      else if (take("-")) {
        const operand = unary();
        value = fraction(-operand.numerator, operand.denominator);
      } else {
        value = primary();
        if (take("^")) value = power(value, unary());
      }
      depth -= 1;
      return value;
    }
    function product() {
      let value = unary();
      while (input[position] && ["*", "/"].includes(input[position].text)) {
        const operator = input[position++].text;
        const right = unary();
        value = operator === "*"
          ? fraction(value.numerator * right.numerator, value.denominator * right.denominator)
          : fraction(value.numerator * right.denominator, value.denominator * right.numerator);
      }
      return value;
    }
    function sum() {
      let value = product();
      while (input[position] && ["+", "-"].includes(input[position].text)) {
        const sign = input[position++].text === "+" ? 1n : -1n;
        const right = product();
        value = fraction(value.numerator * right.denominator + sign * right.numerator * value.denominator,
          value.denominator * right.denominator);
      }
      return value;
    }
    const value = sum();
    if (position !== input.length) throw new CalculationError(`Operator erwartet, nicht ${input[position].text}.`);
    return value;
  }

  function format(value, base) {
    assertBase(base);
    const digits = number => number.toString(base).toUpperCase();
    if (value.denominator === 1n) return digits(value.numerator);
    const radix = BigInt(base);
    let denominator = value.denominator;
    for (let divisor = gcd(denominator, radix); divisor > 1n; divisor = gcd(denominator, radix)) denominator /= divisor;
    if (denominator !== 1n) return `${digits(value.numerator)} / ${digits(value.denominator)}`;
    const absolute = value.numerator < 0n ? -value.numerator : value.numerator;
    const whole = absolute / value.denominator;
    let remainder = absolute % value.denominator;
    let places = "";
    while (remainder && places.length < 128) {
      remainder *= radix;
      places += digits(remainder / value.denominator);
      remainder %= value.denominator;
    }
    if (remainder) return `${digits(value.numerator)} / ${digits(value.denominator)}`;
    return `${value.numerator < 0n ? "-" : ""}${digits(whole)}.${places}`;
  }

  function evaluate(expression, base = 10) {
    assertBase(base);
    const normalized = normalize(expression);
    try {
      if (expression.length > MAX_LENGTH) throw new CalculationError("Höchstens 512 Zeichen pro Rechnung.");
      if (!normalized) throw new CalculationError("Rechnung eingeben.");
      const value = calculate(tokens(normalized, base));
      return { valid: true, expression: normalized, value, text: format(value, base), message: "" };
    } catch (error) {
      if (!(error instanceof CalculationError)) throw error;
      return { valid: false, expression: normalized, value: null, text: "?", message: error.message };
    }
  }

  function convertExpression(expression, from, to) {
    assertBase(from);
    assertBase(to);
    const normalized = normalize(expression);
    try {
      if (expression.length > MAX_LENGTH) throw new CalculationError("Höchstens 512 Zeichen pro Rechnung.");
      const converted = tokens(normalized, from).map(token => {
        if (!token.value) return token.text;
        const text = format(token.value, to);
        return text.includes("/") ? "(" + text.replace(/\s/g, "") + ")" : text;
      }).join("");
      if (converted.length > MAX_LENGTH) throw new CalculationError("Die umgerechnete Formel überschreitet 512 Zeichen.");
      return { valid: true, expression: converted, message: "" };
    } catch (error) {
      if (!(error instanceof CalculationError)) throw error;
      return { valid: false, expression, message: "Formel nicht umgerechnet: " + error.message };
    }
  }

  let sequence = 0;
  function createCalculator({ base = 10, onBaseChange, onAccept, onClose }) {
    assertBase(base);
    if (typeof onBaseChange !== "function" || typeof onAccept !== "function") {
      throw new TypeError("Callbacks für Basiswechsel und Ergebnisübernahme sind erforderlich.");
    }
    if (onClose !== undefined && typeof onClose !== "function") throw new TypeError("onClose muss eine Funktion sein.");
    const document = root.document;
    const panel = document.createElement("section");
    const id = "calculator-" + ++sequence;
    panel.className = "calculator";
    panel.hidden = true;
    panel.setAttribute("aria-labelledby", id + "-title");
    panel.innerHTML = `<header class="calculator-header">
      <h3 id="${id}-title">Rechner</h3><button type="button" data-close aria-label="Rechner schließen">✕</button>
      </header>
      <fieldset class="calculator-base"><legend>Zahlenbasis</legend><div class="calculator-toggle">
        <label><input type="radio" name="${id}-base" value="10"><span>Dez</span></label>
        <label><input type="radio" name="${id}-base" value="16"><span>Hex</span></label>
      </div></fieldset>
      <label for="${id}-expression">Rechnung <sub data-base></sub></label>
      <input id="${id}-expression" class="calculator-expression" type="text" autocomplete="off" spellcheck="false"
        aria-describedby="${id}-message" aria-controls="${id}-result">
      <div class="calculator-operators" aria-label="Operatoren">
        ${[["+", "Plus"], ["-", "Minus"], ["*", "Mal"], ["/", "Geteilt"], ["^", "Hoch"], ["(", "Klammer auf"], [")", "Klammer zu"]]
          .map(([operator, label]) => `<button type="button" data-operator="${operator}" aria-label="${label}">${operator}</button>`).join("")}
      </div>
      <label for="${id}-result">Ergebnis <sub data-base></sub></label>
      <output id="${id}-result" class="calculator-result" aria-live="polite">?</output>
      <p id="${id}-message" class="calculator-message" role="status"></p>
      <div class="calculator-actions"><button type="button" data-accept>Ergebnis übernehmen</button></div>`;
    const input = panel.querySelector(".calculator-expression");
    const output = panel.querySelector("output");
    const message = panel.querySelector(".calculator-message");
    const accept = panel.querySelector("[data-accept]");
    let opener = null;
    let maximum = null;
    let negativesAllowed = false;
    let result;
    let conversionError = "";
    function update() {
      result = evaluate(input.value, base);
      input.setAttribute("aria-invalid", String(!!input.value && !result.valid));
      input.dataset.status = !input.value ? "empty" : result.valid ? "valid" : "invalid";
      output.textContent = result.text;
      accept.disabled = !result.valid || result.value.denominator !== 1n || (!negativesAllowed && result.value.numerator < 0n);
      const exceedsRange = result.valid && maximum !== null && result.value.numerator > maximum * result.value.denominator;
      if (exceedsRange) accept.disabled = true;
      message.textContent = conversionError || (!result.valid ? result.message : accept.disabled
        ? exceedsRange ? `Ergebnis höchstens ${maximum.toString(base).toUpperCase()} (Basis ${base}).`
          : negativesAllowed ? "Für diese Aufgabe eine ganze Zahl übernehmen." : "Für diese Aufgabe eine nichtnegative ganze Zahl übernehmen." : "");
    }
    function setBase(next) {
      assertBase(next);
      if (next !== base) {
        const converted = convertExpression(input.value, base, next);
        input.value = converted.expression;
        conversionError = converted.message;
        base = next;
      }
      panel.querySelectorAll("[data-base]").forEach(element => { element.textContent = base; });
      panel.querySelectorAll('input[type="radio"]').forEach(radio => { radio.checked = Number(radio.value) === base; });
      update();
    }
    function restoreFocus() {
      if (!opener) return;
      const target = opener.isConnected ? opener : opener.id ? document.getElementById(opener.id) : null;
      opener = null;
      if (target) target.focus();
    }
    function close() {
      if (panel.hidden) return;
      panel.hidden = true;
      restoreFocus();
      if (onClose) onClose();
    }
    input.addEventListener("input", () => {
      const start = normalize(input.value.slice(0, input.selectionStart)).length;
      const end = normalize(input.value.slice(0, input.selectionEnd)).length;
      input.value = normalize(input.value);
      input.setSelectionRange(start, end);
      conversionError = "";
      update();
    });
    panel.addEventListener("click", event => {
      const button = event.target.closest("button");
      if (!button || button.disabled) return;
      if (button.hasAttribute("data-close")) close();
      else if (button.hasAttribute("data-operator")) {
        input.setRangeText(button.dataset.operator, input.selectionStart, input.selectionEnd, "end");
        conversionError = "";
        update();
        input.focus();
      } else if (button.hasAttribute("data-accept")) {
        const value = result.value.numerator.toString(base).toUpperCase();
        onAccept(value);
        close();
      }
    });
    panel.addEventListener("change", event => {
      if (event.target.name !== id + "-base") return;
      setBase(Number(event.target.value));
      onBaseChange(base);
    });
    panel.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        close();
      } else if (event.key === "Enter" && event.target === input) {
        event.preventDefault();
        accept.click();
      }
    });
    setBase(base);
    return {
      mount(container) { container.append(panel); },
      open(container, expression = "", limit = null, allowNegative = false) {
        if (limit !== null && (typeof limit !== "bigint" || limit < 0n)) throw new RangeError("Die Obergrenze muss eine nichtnegative BigInt-Zahl sein.");
        opener = document.activeElement;
        maximum = limit;
        negativesAllowed = allowNegative;
        input.value = normalize(expression);
        conversionError = "";
        container.append(panel);
        panel.hidden = false;
        update();
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      },
      close,
      setBase,
      destroy() { close(); panel.remove(); }
    };
  }

  const api = { evaluate, convertExpression, createCalculator };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.BitCalculator = api;
})(globalThis);
