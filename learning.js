(function (root) {
  "use strict";
  const Decoder = typeof module !== "undefined" && module.exports ? require("./decoder.js") : root.BitDecoder;

  class Lesson {
    constructor(result) {
      this.result = result;
      this.index = -1;
      this.solved = new Set();
      this.drafts = result.blocks.map(block => ({
        answer: "",
        choice: null,
        suggestion: null,
        channels: block.decoded.type === "color" ? block.decoded.channels.map(() => 0) : [],
        feedback: "",
        feedbackKind: ""
      }));
    }

    assertIndex(index) {
      if (!Number.isInteger(index) || index < 0 || index >= this.result.blocks.length) {
        throw new RangeError("Ungültiger Blockindex.");
      }
    }

    open(index) {
      this.assertIndex(index);
      if (this.result.blocks[index].decoded.type === "error") throw new Error("Ein ungültiger Block kann nicht decodiert werden.");
      this.index = index;
      return this.current;
    }

    get total() {
      return this.result.blocks.filter(block => block.decoded.type !== "error").length;
    }

    get current() {
      this.assertIndex(this.index);
      return this.drafts[this.index];
    }

    automate(index) {
      this.assertIndex(index);
      if (this.result.blocks[index].decoded.type === "error") throw new Error("Ein ungültiger Block kann nicht automatisch decodiert werden.");
      this.solved.add(index);
    }

    nextUnsolved(index) {
      this.assertIndex(index);
      for (let offset = 1; offset <= this.result.blocks.length; offset += 1) {
        const next = (index + offset) % this.result.blocks.length;
        if (this.result.blocks[next].decoded.type !== "error" && !this.solved.has(next)) return next;
      }
      return null;
    }

    check(base) {
      const draft = this.current;
      if (this.solved.has(this.index)) return true;
      const decoded = this.result.blocks[this.index].decoded;
      let correct;
      if (decoded.type === "integer" || decoded.type === "utf8") {
        const parsed = Decoder.parseAnswer(draft.answer, base, decoded.signed === true);
        if (parsed === null) {
          draft.feedback = decoded.signed
            ? base === 16 ? "Hexwert eingeben: 0–9, A–F, optional führendes Minus, ohne 0x." : "Ganzzahl eingeben: 0–9, optional führendes Minus."
            : base === 16 ? "Hexwert eingeben: 0–9, A–F, ohne 0x." : "Dezimalwert eingeben: nur 0–9.";
          draft.feedbackKind = "error";
          return false;
        }
        correct = parsed === decoded.value;
      } else if (decoded.type === "character") correct = draft.choice === decoded.index;
      else if (decoded.type === "boolean") correct = draft.choice === decoded.value;
      else correct = decoded.channels.every((channel, index) => draft.channels[index] === channel.raw);
      if (correct) {
        this.solved.add(this.index);
        draft.feedback = "Richtig.";
        draft.feedbackKind = "success";
      } else {
        draft.feedback = {
          integer: decoded.signed ? "Noch nicht richtig. Beachte den negativen Stellenwert des höchsten Bits." : "Noch nicht richtig. Addiere die Stellenwerte der Einsen.",
          utf8: "Noch nicht richtig. Verbinde nur die Nutzbits, ohne die Bytepräfixe.",
          character: "Noch nicht richtig. Die Bits geben den Tabellenindex an.",
          boolean: "Noch nicht richtig. Beachte die Zuordnung von 0 und 1.",
          color: "Noch nicht richtig. Lies die Bits je Kanal als Rohwert."
        }[decoded.type];
        draft.feedbackKind = "error";
      }
      return correct;
    }

    changeBase(from, to) {
      for (const [index, draft] of this.drafts.entries()) {
        if (!draft.answer.trim()) continue;
        const value = Decoder.parseAnswer(draft.answer, from, this.result.blocks[index].decoded.signed === true);
        if (value === null) {
          draft.answer = "";
          draft.feedback = "Ungültiger Entwurf beim Basiswechsel entfernt. Bitte neu eingeben.";
          draft.feedbackKind = "error";
        } else draft.answer = Decoder.digits(value, to);
      }
    }
  }

  if (typeof module !== "undefined" && module.exports) module.exports = Lesson;
  else root.BitLesson = Lesson;
})(globalThis);
