(function () {
  "use strict";
  const D = globalThis.BitDecoder;
  const $ = id => document.getElementById(id);
  const state = { result: null, lesson: null, active: -1, base: 10, dialog: null, calculatorTarget: null };
  const calculator = globalThis.BitCalculator.createCalculator({
    base: state.base,
    onBaseChange: changeBase,
    onAccept(value) {
      const target = state.calculatorTarget;
      if (!target) throw new Error("Kein Ziel für das Rechnerergebnis.");
      const draft = state.lesson.current;
      if (target.kind === "number") draft.answer = value;
      else if (target.kind === "channel") draft.channels[target.channel] = Number(D.parseAnswer(value, state.base));
      else {
        draft.suggestion = Number(D.parseAnswer(value, state.base));
        draft.choice = null;
        draft.feedback = "";
        draft.feedbackKind = "";
      }
    },
    onClose: finishCalculator
  });
  let backdropPointerId = null;
  const escape = value => String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
  const number = value => `${D.digits(value, state.base)}<sub>${state.base}</sub>`;
  const decimalHint = value => `${value.toFixed(1)}<sub>10</sub>`;
  const isInteractive = () => document.querySelector('[name="mode"]:checked').value === "interactive";
  const settings = () => ({
    integerSize: Number($("integer-size").value),
    charset: $("charset").value,
    colorDepth: Number($("color-depth").value),
    colorSpace: $("color-space").value,
    reverseBoolean: $("boolean-map").value === "reverse"
  });
  const solved = index => state.result.blocks[index].decoded.type === "error" || !isInteractive() || state.lesson.solved.has(index);
  const examples = [
    "0", "1", "1010", "01001011", "0000111100001111",
    "0100111101001011", "010000010100001001000011",
    "111111110000000000000000", "100000000011111111000000",
    "01000001110000111010010011110000100111111001100010000000",
    "000000001111111100000000000000000000000011111111",
    "0100001001101001011101000010000001100110011111000111001000100001"
  ];
  for (const bits of examples) {
    const option = document.createElement("option");
    option.value = bits;
    option.textContent = bits;
    $("example").append(option);
  }

  function syncSettings() {
    const encoding = $("encoding").value;
    document.documentElement.dataset.mode = isInteractive() ? "interactive" : "auto";
    $("integer-setting").hidden = !["integer", "signed"].includes(encoding);
    $("character-setting").hidden = encoding !== "character";
    $("depth-setting").hidden = encoding !== "color";
    $("space-setting").hidden = encoding !== "color";
    $("boolean-setting").hidden = encoding !== "boolean";
    $("depth-label").textContent = $("color-depth").value;
    $("color-space").disabled = Number($("color-depth").value) % 3 !== 0;
  }

  function rebuild(changed = false) {
    const hadProgress = state.lesson && (state.lesson.solved.size > 0 || state.lesson.drafts.some(draft =>
      draft.answer !== "" || draft.choice !== null || draft.suggestion !== null || draft.channels.some(raw => raw !== 0)
    ));
    calculator.close();
    if ($("details").open) $("details").close();
    state.dialog = null;
    syncSettings();
    const bits = $("data").value;
    const validation = D.validateInput(bits);
    $("bit-count").textContent = `${bits.length} / 64 Bit`;
    $("data").setAttribute("aria-invalid", String(!validation.valid));
    $("data-error").hidden = validation.valid;
    $("data-error").textContent = validation.error;
    state.result = validation.valid ? D.interpret(bits, $("encoding").value, settings()) : null;
    state.active = state.result ? state.result.blocks.length - 1 : -1;
    state.lesson = isInteractive() && state.active >= 0 ? new globalThis.BitLesson(state.result) : null;
    $("restart-note").hidden = !(hadProgress && changed && isInteractive());
    $("restart-note").textContent = "Daten oder Einstellungen geändert · Decodierung zurückgesetzt.";
    $("empty-state").hidden = !validation.valid || state.active >= 0;
    renderBlocks();
  }

  function bitsHTML(block) {
    const bitSpan = (bit, index) =>
      `<span class="bit${index < block.padding ? " padding" : ""}"${index < block.padding ? ' title="Padding: links ergänzte Null"' : ""}>${bit}</span>`;
    const color = block.decoded.type === "color" && !block.decoded.gray;
    const contents = block.utf8
      ? block.utf8.bytes.map((byte, byteIndex) =>
        `<span class="byte-group" role="group" aria-label="Byte ${byteIndex + 1}, Präfix ${byte.bits.slice(0, byte.prefixLength)}">${
          Array.from(byte.bits, (bit, offset) => {
            const span = bitSpan(bit, byteIndex * 8 + offset);
            return offset < byte.prefixLength ? `<span class="prefix-bit">${span}</span>` : span;
          }).join("")
        }</span>`
      ).join("")
      : color
      ? block.decoded.channels.map((channel, index) =>
        `<span class="bit-channel" role="group" aria-label="${escape(channel.name)}">${
          Array.from(channel.bits, (bit, offset) => bitSpan(bit, index * channel.bits.length + offset)).join("")
        }</span>`
      ).join("")
      : Array.from(block.bits, bitSpan).join("");
    return `<div class="bits${color || block.utf8 ? " grouped-bits" : ""}" aria-label="Bits ${block.bits}${block.padding ? `, ${block.padding} Padding-Nullen` : ""}">${contents}</div>`;
  }

  function resultHTML(decoded) {
    if (decoded.type === "integer") return number(decoded.value);
    if (decoded.type === "character" || decoded.type === "utf8") return `<bdi>${escape(decoded.label)}</bdi>`;
    if (decoded.type === "error") return '<span class="error-result">Ungültiges UTF-8</span>';
    if (decoded.type === "boolean") return decoded.value ? "Wahr" : "Falsch";
    return `<div class="swatch" style="background:${decoded.css}" role="img" aria-label="Farbe ${decoded.hex}${decoded.clipped ? ", für sRGB begrenzt" : ""}"></div>`;
  }

  function renderBlocks() {
    const hasBlocks = state.result && state.result.blocks.length > 0;
    const errors = state.result ? state.result.blocks.filter(block => block.decoded.type === "error").length : 0;
    $("decoding-error").hidden = !errors;
    $("decoding-error").textContent = `UTF-8: ${errors} ungültige Folge${errors === 1 ? "" : "n"}. Details über ?.`;
    $("visualization").hidden = !hasBlocks;
    $("progress").hidden = !state.lesson || state.result.blocks.length === 1;
    if (state.lesson) $("progress").textContent = state.lesson.total
      ? `${state.lesson.solved.size} / ${state.lesson.total} Blöcke decodiert${errors ? ` · ${errors} Fehler` : ""}`
      : `${errors} Fehler`;
    if (!hasBlocks) {
      $("blocks").replaceChildren();
      return;
    }
    $("padding-note").hidden = !state.result.padding;
    $("padding-note").textContent = `Padding: ${state.result.padding} Null${state.result.padding === 1 ? "" : "en"} links ergänzt. (Unvollständige Blöcke werden mit Nullen aufgefüllt.)`;
    $("blocks").innerHTML = state.result.blocks.map((block, index) => {
      const visible = solved(index);
      const failed = block.decoded.type === "error";
      const next = state.lesson && state.lesson.solved.has(index) ? state.lesson.nextUnsolved(index) : null;
      return `<article class="block ${failed ? "block-error" : visible ? "decoded" : "pending"}${index === state.active ? " active" : ""}" data-block="${index}" aria-label="Block ${index + 1}">
        ${bitsHTML(block)}
        <div class="result">${visible ? resultHTML(block.decoded) : '<span class="unknown">Noch zu decodieren</span>'}</div>
        <div class="block-actions">${visible
          ? `<button type="button" class="detail-button" data-action="details" aria-label="Block ${index + 1} erklären">?</button>
             ${next !== null ? `<button type="button" data-action="next" aria-label="Nächsten offenen Block ${next + 1} manuell decodieren">Weiter →</button>` : ""}`
          : `<button type="button" data-action="manual" aria-label="Block ${index + 1} manuell decodieren">Manuell</button>
             <button type="button" data-action="automate" aria-label="Block ${index + 1} automatisch decodieren">⚙ Automatisch</button>`}
        </div>
      </article>`;
    }).join("");
  }

  function characterTables(selectedIndex, selectable, suggestedIndex = null) {
    const table = D.characterTable(settings().charset);
    return `<div class="table-scroll">${[0, 128].map(start => `<table class="charset-table">
      <caption>${start === 0 ? "ASCII" : "Erweiterung"} · ${number(start)}–${number(start + 127)}</caption>
      <tbody>${Array.from({ length: 8 }, (_, row) => `<tr>${Array.from({ length: 16 }, (_, column) => {
        const entry = table[start + row * 16 + column];
        const classes = `table-entry${selectedIndex === entry.index ? " selected" : ""}${suggestedIndex === entry.index ? " calculated" : ""}${entry.assigned ? "" : " unassigned"}`;
        const contents = `<span class="index">${number(entry.index)}</span>${entry.assigned ? escape(entry.label) : "—"}`;
        return `<td>${selectable
          ? `<button type="button" class="${classes}" data-character="${entry.index}" aria-pressed="${selectedIndex === entry.index}" ${suggestedIndex === entry.index ? 'aria-describedby="character-calculation-hint"' : ""} aria-label="Index ${D.digits(entry.index, state.base)}, Basis ${state.base}: ${escape(entry.label)}">${contents}</button>`
          : `<div class="${classes}" title="${escape(entry.label)}">${contents}</div>`}</td>`;
      }).join("")}</tr>`).join("")}</tbody></table>`).join("")}</div>`;
  }

  function integerDetails(block, reveal) {
    const weights = Array.from(block.bits, (_, index) =>
      (block.decoded.signed && index === 0 ? -1n : 1n) * (1n << BigInt(block.bits.length - index - 1))
    );
    const terms = weights.filter((_, index) => block.bits[index] === "1");
    return `<p class="muted">${block.decoded.signed ? "Zweierkomplement: Höchster Stellenwert negativ, übrige Stellenwerte positiv." : "Stellenwerte der Einsen addieren."}</p>
      <div class="weights-scroll"><table class="weights"><tbody>
        <tr><th scope="row">Stellenwert</th>${weights.map((weight, index) => `<td${weight < 0n ? ' class="negative-weight"' : ""}><span class="weight-formula">${weight < 0n ? "-" : ""}2<sup>${D.digits(block.bits.length - index - 1, state.base)}</sup></span><span class="weight-value">${number(weight)}</span></td>`).join("")}</tr>
        <tr><th scope="row">Bit</th>${Array.from(block.bits, bit => `<td class="${bit === "1" ? "on" : ""}">${bit}</td>`).join("")}</tr>
      </tbody></table></div>
      ${reveal ? `<p class="calculation">${terms.length ? terms.map(number).join(" + ") : number(0)} = <strong>${number(block.decoded.value)}</strong></p>` : ""}`;
  }

  function numberAnswer(label) {
    const signed = state.result.blocks[state.dialog.index].decoded.signed === true;
    return `<div class="number-answer"><label for="number-answer">${label} <sub>${state.base}</sub></label>
      <div class="answer-controls" ${state.calculatorTarget && state.calculatorTarget.kind === "number" ? "hidden" : ""}><input id="number-answer" type="text" value="${escape(state.lesson.current.answer)}" inputmode="${state.base === 10 && !signed ? "numeric" : "text"}"
        aria-label="${label}, Basis ${state.base}" autocomplete="off" spellcheck="false">
        ${calculatorButton("number")}
      </div>${calculatorSlot("number")}</div>`;
  }

  function calculatorButton(kind, channel = null) {
    const expanded = state.calculatorTarget && state.calculatorTarget.kind === kind && state.calculatorTarget.channel === channel;
    const id = kind === "number" ? "open-calculator" : kind === "character" ? "character-calculator" : `channel-calculator-${channel}`;
    const label = kind === "channel" ? `Rechner für Farbkanal ${channel + 1} öffnen` : "Rechner öffnen";
    return `<button id="${id}" class="calculator-launch" type="button" data-calculator="${kind}"
      ${channel === null ? "" : `data-calculator-channel="${channel}"`} aria-expanded="${!!expanded}" aria-label="${label}" title="${label}">
      <svg viewBox="0 0 20 24" aria-hidden="true"><rect x="1" y="1" width="18" height="22" rx="2"/>
        <path d="M4 5h12v4H4z M4 13h2 M9 13h2 M14 13h2 M4 17h2 M9 17h2 M14 17h2 M4 20h2 M9 20h2 M14 20h2"/>
      </svg><span${kind === "channel" ? ' class="sr-only"' : ""}>Rechner</span></button>`;
  }

  function calculatorSlot(kind, channel = null) {
    const target = state.calculatorTarget;
    return target && target.kind === kind && target.channel === channel ? '<div id="calculator-slot"></div>' : "";
  }

  function openCalculator(kind, channel = null) {
    const previous = state.calculatorTarget;
    calculator.close();
    if (previous && previous.kind === kind && previous.channel === channel) return;
    rememberUnicodeBrowser();
    state.calculatorTarget = { kind, channel };
    const draft = state.lesson.current;
    const decoded = state.result.blocks[state.dialog.index].decoded;
    const expression = kind === "number" ? draft.answer : kind === "channel"
      ? D.digits(draft.channels[channel], state.base)
      : draft.suggestion === null ? "" : D.digits(draft.suggestion, state.base);
    const maximum = kind === "channel" ? BigInt(decoded.channels[channel].max) : kind === "character" ? 255n : null;
    renderDialog();
    calculator.open($("calculator-slot"), expression, maximum, kind === "number" && decoded.signed === true);
  }

  function finishCalculator() {
    const target = state.calculatorTarget;
    state.calculatorTarget = null;
    if (!target || !state.dialog || !$("details").open) return;
    rememberUnicodeBrowser();
    renderDialog();
    const control = target.kind === "number" ? $("number-answer") : target.kind === "channel"
      ? $("channel-" + target.channel) : state.lesson.current.suggestion === null
        ? $("character-calculator") : $("details-content").querySelector(`[data-character="${state.lesson.current.suggestion}"]`);
    control.focus();
  }

  function unicodeBrowser(decoded, manual) {
    const start = state.dialog.unicodeStart;
    const identifier = codePoint => "U+" + D.digits(codePoint, 16).padStart(4, "0");
    const selected = manual ? D.parseAnswer(state.lesson.current.answer, state.base) : BigInt(decoded.codePoint);
    return `<details id="unicode-browser" ${state.dialog.unicodeOpen ? "open" : ""}>
      <summary>Unicode-Bereich ansehen</summary>
      <p class="muted small">Bereich: Zeigt ab dem Start-Codepoint die folgenden 128 Zeichen der Unicode-Liste.</p>
      <div class="unicode-controls">
        <label>Start-Codepoint <sub>${state.base}</sub>
          <input id="unicode-start" type="text" value="${D.digits(start, state.base)}" aria-label="Start-Codepoint, Basis ${state.base}" spellcheck="false">
        </label>
        <button type="button" data-unicode-page="-1" aria-label="Vorheriger Unicode-Bereich" ${start === 0 ? "disabled" : ""}>←</button>
        <button type="button" data-unicode-page="1" aria-label="Nächster Unicode-Bereich" ${start === 0x10FF80 ? "disabled" : ""}>→</button>
      </div>
      <p id="unicode-error" class="feedback error" role="alert" hidden></p>
      <p class="muted small">${identifier(start)}–${identifier(start + 127)} · U+… ist hexadezimal</p>
      <div class="unicode-grid" role="list" aria-label="Unicode-Bereich ${identifier(start)}–${identifier(start + 127)}">
        ${Array.from({ length: 128 }, (_, offset) => {
          const codePoint = start + offset;
          const surrogate = codePoint >= 0xD800 && codePoint <= 0xDFFF;
          const label = surrogate ? "Surrogat" : D.unicodeEntry(codePoint).label;
          const active = selected === BigInt(codePoint);
          const classes = `table-entry${active ? " selected" : ""}${surrogate ? " unassigned" : ""}`;
          const content = `<span class="index">${number(codePoint)}</span><bdi>${escape(label)}</bdi>`;
          return `<div role="listitem">${manual && !surrogate
            ? `<button type="button" class="${classes}" data-codepoint="${codePoint}" aria-pressed="${active}" aria-label="Codepoint ${D.digits(codePoint, state.base)}, Basis ${state.base}: ${escape(label)} (${identifier(codePoint)})">${content}</button>`
            : `<div class="${classes}" title="${identifier(codePoint)}">${content}</div>`}</div>`;
        }).join("")}
      </div>
    </details>`;
  }

  function utf8Details(block, manual) {
    const decoded = block.decoded;
    return `<p class="muted"><span class="prefix-key">Präfix</span> → Bytelänge · restliche Bits → Codepoint.</p>
      <div class="utf8-schema" aria-label="UTF-8-Codierungsschema">
        ${["0xxxxxxx", "110xxxxx 10xxxxxx", "1110xxxx 10xxxxxx 10xxxxxx", "11110xxx 10xxxxxx 10xxxxxx 10xxxxxx"]
          .map((pattern, index) => `<span>${index + 1} Byte${index ? "s" : ""}</span><code>${pattern}</code>`).join("")}
      </div>
      <p class="payload">Nutzbits: <code>${block.utf8.payload}</code></p>
      ${manual ? "" : `<p class="codepoint-result">${number(decoded.codePoint)} → <code>${decoded.identifier}</code> → <strong><bdi>${escape(decoded.label)}</bdi></strong></p>`}
      ${unicodeBrowser(decoded, manual)}
      ${manual ? numberAnswer("Unicode-Codepoint") : ""}
      <p class="muted small">Ein Block = ein Codepoint. Kombinierte Zeichen können mehrere Blöcke belegen. Darstellung mit lokalen Schriften.</p>`;
  }

  function showUnicodePage(start) {
    state.dialog.unicodeStart = start;
    state.dialog.unicodeOpen = true;
    renderDialog();
    $("unicode-start").focus();
  }

  function rememberUnicodeBrowser() {
    const browser = $("unicode-browser");
    if (browser) state.dialog.unicodeOpen = browser.open;
  }

  function readUnicodePage() {
    const value = D.parseAnswer($("unicode-start").value, state.base);
    if (value === null || value > 0x10FFFFn) {
      $("unicode-error").hidden = false;
      $("unicode-error").innerHTML = `Codepoint zwischen ${number(0)} und ${number(0x10FFFF)} eingeben.`;
      return;
    }
    showUnicodePage(Math.floor(Number(value) / 128) * 128);
  }

  function scrollToUnicodeAnswer() {
    $("details").scrollTop = $("details").scrollHeight;
  }

  function colorHints(decoded) {
    let hint = "";
    if (!decoded.gray && decoded.space === "cmy") {
      hint = '<p class="muted small">Alle Kanäle 0: Weiß · alle maximal: Schwarz.</p>';
    } else if (!decoded.gray && decoded.space === "hsb") {
      hint = `<p class="muted small">Anzeige: H ≈ ${decimalHint(decoded.physical[0])}°, S ≈ ${decimalHint(decoded.physical[1])} %, B ≈ ${decimalHint(decoded.physical[2])} %.</p>`;
    } else if (!decoded.gray && decoded.space === "lab") {
      hint = `<p class="muted small">Anzeige (D65): L* ≈ ${decimalHint(decoded.physical[0])}, a* ≈ ${decimalHint(decoded.physical[1])}, b* ≈ ${decimalHint(decoded.physical[2])}.</p>`;
    }
    return hint + (decoded.clipped ? '<p class="warning">Außerhalb von sRGB · Anzeigefarbe begrenzt, Rohwerte unverändert.</p>' : "");
  }

  function studentColor(block) {
    const bits = block.decoded.channels.map((channel, index) =>
      state.lesson.current.channels[index].toString(2).padStart(channel.bits.length, "0")
    ).join("");
    return D.decodeColor(bits, block.decoded.space);
  }

  function channelAppearance(decoded) {
    const gradient = colors => `linear-gradient(to right, ${colors.join(", ")})`;
    if (decoded.gray) return [{ color: decoded.css, gradient: gradient(["#000", "#fff"]) }];
    if (decoded.space === "cmy") {
      return decoded.channels.map((_, index) => {
        const bits = decoded.channels.map((part, position) => position === index ? part.bits : "0".repeat(part.bits.length)).join("");
        return { color: D.decodeColor(bits, "cmy").css, gradient: gradient(["#fff", ["cyan", "magenta", "yellow"][index]]) };
      });
    }
    if (decoded.space === "hsb") {
      const hueBits = decoded.channels[0].bits;
      const full = "1".repeat(hueBits.length);
      const hue = D.decodeColor(hueBits + full + full, "hsb").css;
      const saturated = D.decodeColor(hueBits + decoded.channels[1].bits + full, "hsb").css;
      return [
        { color: hue, gradient: gradient(["red", "yellow", "lime", "cyan", "blue", "magenta", "red"]) },
        { color: saturated, gradient: gradient(["#fff", hue]) },
        { color: decoded.css, gradient: gradient(["#000", saturated]) }
      ];
    }
    if (decoded.space === "lab") {
      const axis = (fraction, negative, positive) => {
        const neutral = [136, 136, 136];
        const from = fraction <= 0.5 ? negative : neutral;
        const to = fraction <= 0.5 ? neutral : positive;
        const amount = fraction <= 0.5 ? fraction * 2 : fraction * 2 - 1;
        return `rgb(${from.map((value, index) => Math.round(value + (to[index] - value) * amount)).join(", ")})`;
      };
      const light = Math.round(decoded.channels[0].fraction * 255);
      return [
        { color: `rgb(${light}, ${light}, ${light})`, gradient: gradient(["#000", "#fff"]) },
        { color: axis(decoded.channels[1].fraction, [0, 160, 80], [224, 64, 112]), gradient: gradient(["#00a050", "#888", "#e04070"]) },
        { color: axis(decoded.channels[2].fraction, [48, 96, 224], [224, 192, 32]), gradient: gradient(["#3060e0", "#888", "#e0c020"]) }
      ];
    }
    return ["#bb3649", "#138052", "#3775bb"].map(color => ({ color, gradient: gradient(["#e6eceb", color]) }));
  }

  function colorDetails(block, manual) {
    const decoded = block.decoded;
    const displayed = manual ? studentColor(block) : decoded;
    const appearances = channelAppearance(displayed);
    return `<p class="muted">${manual ? "Kanalbalken auf die Rohwerte einstellen." : "Balken: Anteil am maximalen Rohwert."}</p>
      ${decoded.channels.map((channel, index) => {
        const raw = displayed.channels[index].raw;
        return `<div class="channel-detail"><div class="channel-heading">
          ${manual ? `<label for="channel-${index}">` : "<strong>"}${escape(channel.name)} <code>${channel.bits}</code>${manual ? "</label>" : "</strong>"}
        </div><div class="channel-controls"><div class="channel-scale">${manual
          ? `<input class="channel-slider" id="channel-${index}" type="range" data-channel="${index}" min="0" max="${channel.max}" step="1" value="${raw}"
               aria-valuetext="${D.digits(raw, state.base)}, Basis ${state.base}" style="--channel-color:${appearances[index].color};--channel-gradient:${appearances[index].gradient}">`
          : `<div class="bar-track" role="meter" aria-label="${escape(channel.name)}" aria-valuemin="0" aria-valuemax="${channel.max}" aria-valuenow="${raw}" style="background:${appearances[index].gradient}">
               <div class="bar" style="width:${raw / channel.max * 100}%;background:${appearances[index].color}"></div></div>`}
          <div class="range-limits"><span>${number(0)}</span><span>${number(channel.max)}</span></div>
          </div><output class="channel-current" id="channel-value-${index}" ${manual ? `for="channel-${index}"` : ""}>${number(raw)}</output>
          ${manual ? calculatorButton("channel", index) : ""}
        </div>${manual ? calculatorSlot("channel", index) : ""}
        </div>`;
      }).join("")}
      <div id="color-preview" class="color-preview" style="background:${displayed.css}" role="img" aria-label="${manual ? "Deine" : "Resultierende"} Farbe ${displayed.hex}"></div>
      <div id="color-hints">${colorHints(displayed)}</div>`;
  }

  function renderFeedback() {
    const draft = state.lesson.current;
    $("answer-feedback").hidden = !draft.feedback;
    $("answer-feedback").className = `feedback ${draft.feedbackKind}`;
    $("answer-feedback").textContent = draft.feedback;
  }

  function renderDialog() {
    const calculatorFocus = document.activeElement.closest(".calculator") ? document.activeElement : null;
    const { index, kind } = state.dialog;
    const block = state.result.blocks[index];
    const manual = kind === "manual";
    const decoded = block.decoded;
    $("details-title").textContent = `Block ${index + 1} · ${manual ? "Manuell decodieren" : block.utf8 ? "UTF-8" : D.encodings[$("encoding").value].name}`;
    $("manual-actions").hidden = !manual || !!state.calculatorTarget || ["character", "boolean"].includes(decoded.type);
    const next = !manual && state.lesson ? state.lesson.nextUnsolved(index) : null;
    $("next-actions").hidden = manual || !state.lesson || next === null;
    $("finish-actions").hidden = manual || !state.lesson || next !== null;
    if (!$("finish-actions").hidden) {
      const errors = state.result.blocks.filter(entry => entry.decoded.type === "error").length;
      $("completion-note").textContent = errors
        ? `Keine weiteren decodierbaren Blöcke · ${errors} fehlerhafte UTF-8-Folge${errors === 1 ? "" : "n"}.`
        : "Alle Blöcke decodiert.";
    }
    $("answer-feedback").hidden = true;
    let content = manual && decoded.type === "character"
      ? `<div class="bits-toolbar">${bitsHTML(block)}${calculatorButton("character")}</div>${calculatorSlot("character")}`
      : bitsHTML(block);
    if (decoded.type === "integer") {
      content += integerDetails(block, !manual);
      if (manual) content += numberAnswer("Zahlenwert");
    } else if (decoded.type === "utf8") content += utf8Details(block, manual);
    else if (decoded.type === "error") {
      content += `<p class="feedback error">Byte ${block.utf8.byteOffset + 1}: ${escape(decoded.message)}</p>
        <p class="muted">Fehlende Bytes werden nicht ergänzt. Bitte die Daten korrigieren.</p>`;
    } else if (decoded.type === "character") {
      const config = D.CHARSETS[settings().charset];
      content += `<p class="muted">${manual ? "Passenden Tabelleneintrag wählen. " : ""}${config.codePage ? escape(config.codePage) + "-Lernerweiterung" : "ASCII · zweite Hälfte unbelegt"}.
        SP = Leerzeichen · — = unbelegt.</p>
        ${manual ? "" : `<p>Index ${number(decoded.index)} → <strong>${escape(decoded.label)}</strong></p>`}
        ${manual && state.lesson.current.suggestion !== null ? `<p id="character-calculation-hint" class="feedback" role="status">Code ${number(state.lesson.current.suggestion)} markiert · zum Prüfen anklicken.</p>` : ""}
        ${characterTables(manual ? state.lesson.current.choice : decoded.index, manual, manual ? state.lesson.current.suggestion : null)}`;
    } else if (decoded.type === "color") content += colorDetails(block, manual);
    else {
      content += `<p class="muted"><code>0</code> → ${settings().reverseBoolean ? "Wahr" : "Falsch"} · <code>1</code> → ${settings().reverseBoolean ? "Falsch" : "Wahr"}</p>`;
      if (manual) content += `<button id="boolean-toggle" class="boolean-toggle${state.lesson.current.choice === true ? " is-true" : ""}" type="button"
        role="switch" aria-checked="${state.lesson.current.choice === true}" aria-label="Wahrheitswert">
        <span class="toggle-knob" aria-hidden="true"></span><span id="boolean-label">${state.lesson.current.choice === true ? "Wahr" : "Falsch"}</span></button>`;
      else content += `<p class="boolean-result">${decoded.value ? "Wahr" : "Falsch"}</p>`;
    }
    $("details-content").innerHTML = content;
    if (state.calculatorTarget) {
      calculator.mount($("calculator-slot"));
      if (calculatorFocus) calculatorFocus.focus();
    }
    if (manual) renderFeedback();
  }

  function blockControl(index, action) {
    return $("blocks").querySelector(`[data-block="${index}"] [data-action="${action}"]`);
  }

  function openDialog(index, kind) {
    calculator.close();
    const opening = !$("details").open;
    backdropPointerId = null;
    state.active = index;
    if (kind === "manual") state.lesson.open(index);
    const decoded = state.result.blocks[index].decoded;
    state.dialog = {
      index, kind, unicodeOpen: false,
      unicodeStart: kind === "details" && decoded.type === "utf8" ? Math.floor(decoded.codePoint / 128) * 128 : 0
    };
    renderBlocks();
    if (opening) blockControl(index, kind === "manual" ? "manual" : "details").focus();
    renderDialog();
    if (opening) $("details").showModal();
    if (kind === "manual") {
      $("details-content").querySelector("#number-answer, #boolean-toggle, .channel-slider, [data-character]").focus();
    }
  }

  function openNext(index) {
    const next = state.lesson.nextUnsolved(index);
    if (next !== null) openDialog(next, "manual");
  }

  $("data").addEventListener("input", () => {
    $("example").value = "";
    rebuild(true);
  });
  $("mode").addEventListener("change", () => rebuild());
  for (const id of ["encoding", "integer-size", "charset", "color-space", "boolean-map"]) {
    $(id).addEventListener("change", () => rebuild(true));
  }
  $("color-depth").addEventListener("input", () => rebuild(true));
  $("example").addEventListener("change", () => {
    if (!$("example").value) return;
    $("data").value = $("example").value;
    rebuild(true);
  });
  $("blocks").addEventListener("click", event => {
    const button = event.target.closest("button");
    if (!button) return;
    const index = Number(button.closest("[data-block]").dataset.block);
    const action = button.dataset.action;
    if (action === "automate") {
      state.lesson.automate(index);
      state.active = index;
      renderBlocks();
      blockControl(index, "details").focus();
    } else if (action === "next") openNext(index);
    else openDialog(index, action === "manual" ? "manual" : "details");
  });
  for (const region of [$("information"), $("details")]) {
    for (const event of ["click", "keydown", "input"]) {
      region.addEventListener(event, () => { $("restart-note").hidden = true; }, true);
    }
  }
  function changeBase(base) {
    rememberUnicodeBrowser();
    const scroller = $("details-content").querySelector(".table-scroll, .weights-scroll");
    const scroll = scroller && { top: scroller.scrollTop, left: scroller.scrollLeft };
    if (state.lesson) state.lesson.changeBase(state.base, base);
    state.base = base;
    document.querySelectorAll('[name="base"]').forEach(radio => { radio.checked = Number(radio.value) === base; });
    calculator.setBase(base);
    renderBlocks();
    renderDialog();
    if (scroll) {
      const updated = $("details-content").querySelector(".table-scroll, .weights-scroll");
      updated.scrollTop = scroll.top;
      updated.scrollLeft = scroll.left;
    }
  }
  $("details").addEventListener("change", event => {
    if (event.target.name !== "base") return;
    changeBase(Number(event.target.value));
  });
  $("details-content").addEventListener("input", event => {
    if (event.target.id === "number-answer") {
      state.lesson.current.answer = event.target.value;
      const selected = D.parseAnswer(event.target.value, state.base);
      $("details-content").querySelectorAll("[data-codepoint]").forEach(choice => {
        const active = selected === BigInt(choice.dataset.codepoint);
        choice.setAttribute("aria-pressed", String(active));
        choice.classList.toggle("selected", active);
      });
    }
    else if (event.target.dataset.channel !== undefined) {
      const index = Number(event.target.dataset.channel);
      const raw = Number(event.target.value);
      state.lesson.current.channels[index] = raw;
      $("channel-value-" + index).innerHTML = number(raw);
      event.target.setAttribute("aria-valuetext", `${D.digits(raw, state.base)}, Basis ${state.base}`);
      const color = studentColor(state.result.blocks[state.dialog.index]);
      const appearances = channelAppearance(color);
      $("details-content").querySelectorAll(".channel-slider").forEach((slider, channelIndex) => {
        slider.style.setProperty("--channel-color", appearances[channelIndex].color);
        slider.style.setProperty("--channel-gradient", appearances[channelIndex].gradient);
      });
      $("color-preview").style.background = color.css;
      $("color-preview").setAttribute("aria-label", `Deine Farbe ${color.hex}`);
      $("color-hints").innerHTML = colorHints(color);
    }
  });
  $("details-content").addEventListener("toggle", event => {
    if (event.target !== $("unicode-browser") || !state.dialog) return;
    const opening = event.target.open && !state.dialog.unicodeOpen;
    state.dialog.unicodeOpen = event.target.open;
    if (opening && state.dialog.kind === "manual") scrollToUnicodeAnswer();
  }, true);
  $("details-content").addEventListener("click", event => {
    const button = event.target.closest("button");
    if (!button || button.disabled) return;
    if (button.dataset.calculator) {
      openCalculator(button.dataset.calculator, button.dataset.calculatorChannel === undefined ? null : Number(button.dataset.calculatorChannel));
      return;
    }
    if (button.dataset.unicodePage !== undefined) {
      showUnicodePage(state.dialog.unicodeStart + Number(button.dataset.unicodePage) * 128);
      return;
    }
    if (state.dialog.kind !== "manual") return;
    if (button.dataset.codepoint !== undefined) {
      const value = Number(button.dataset.codepoint);
      rememberUnicodeBrowser();
      calculator.close();
      state.lesson.current.answer = D.digits(value, state.base);
      state.lesson.current.feedback = "";
      state.lesson.current.feedbackKind = "";
      renderDialog();
      $("number-answer").focus({ preventScroll: true });
      scrollToUnicodeAnswer();
      return;
    }
    if (button.dataset.character !== undefined) {
      const index = Number(button.dataset.character);
      calculator.close();
      state.lesson.current.choice = index;
      state.lesson.current.suggestion = null;
      $("details-content").querySelectorAll("[data-character]").forEach(choice => {
        const selected = Number(choice.dataset.character) === index;
        choice.setAttribute("aria-pressed", String(selected));
        choice.classList.toggle("selected", selected);
        choice.classList.remove("calculated");
        choice.removeAttribute("aria-describedby");
      });
      if ($("character-calculation-hint")) $("character-calculation-hint").hidden = true;
      checkAnswer();
    } else if (button.id === "boolean-toggle") {
      const choice = state.lesson.current.choice !== true;
      state.lesson.current.choice = choice;
      button.setAttribute("aria-checked", String(choice));
      button.classList.toggle("is-true", choice);
      $("boolean-label").textContent = choice ? "Wahr" : "Falsch";
      checkAnswer();
    }
  });
  function checkAnswer() {
    if (state.lesson.check(state.base)) {
      rememberUnicodeBrowser();
      state.dialog.kind = "details";
      const decoded = state.result.blocks[state.dialog.index].decoded;
      if (decoded.type === "utf8") state.dialog.unicodeStart = Math.floor(decoded.codePoint / 128) * 128;
      renderBlocks();
      renderDialog();
      $("answer-feedback").hidden = false;
      $("answer-feedback").className = "feedback success";
      $("answer-feedback").textContent = "Richtig.";
      (!$("next-actions").hidden ? $("next-open") : !$("finish-actions").hidden ? $("finish-close") : $("close-details")).focus();
    } else renderFeedback();
  }
  $("check-answer").addEventListener("click", checkAnswer);
  $("next-open").addEventListener("click", () => openNext(state.dialog.index));
  function restoreDialogFocus() {
    if (!state.dialog) return;
    const { index } = state.dialog;
    const control = blockControl(index, solved(index) ? "details" : "manual");
    state.dialog = null;
    if (control) control.focus();
  }

  function closeDialog() {
    backdropPointerId = null;
    calculator.close();
    $("details").close();
    restoreDialogFocus();
  }

  $("close-details").addEventListener("click", closeDialog);
  $("finish-close").addEventListener("click", closeDialog);
  $("details").addEventListener("close", () => {
    if (!$("details").open) restoreDialogFocus();
  });
  $("details").addEventListener("keydown", event => {
    if (event.key === "Escape") {
      event.preventDefault();
      if (state.calculatorTarget) calculator.close();
      else closeDialog();
    } else if (event.key === "Enter" && event.target.id === "number-answer") {
      event.preventDefault();
      $("check-answer").click();
    } else if (event.key === "Enter" && event.target.id === "unicode-start") {
      event.preventDefault();
      readUnicodePage();
    }
  });
  function isBackdrop(event) {
    if (event.target !== $("details")) return false;
    const rect = $("details").getBoundingClientRect();
    return event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
  }
  $("details").addEventListener("pointerdown", event => {
    backdropPointerId = isBackdrop(event) ? event.pointerId : null;
  });
  $("details").addEventListener("pointerup", event => {
    if (event.pointerId !== backdropPointerId || !isBackdrop(event)) backdropPointerId = null;
  });
  $("details").addEventListener("pointercancel", () => {
    backdropPointerId = null;
  });
  $("details").addEventListener("click", event => {
    if (backdropPointerId !== null && isBackdrop(event)) closeDialog();
    backdropPointerId = null;
  });
  rebuild();
})();
