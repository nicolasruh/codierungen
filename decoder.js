(function (root) {
  "use strict";

  const INTEGER_SIZES = [1, 2, 3, 4, 5, 6, 7, 8, 16, 32, 64];
  const CHARSETS = {
    ascii: { name: "ASCII", codePage: null },
    de: { name: "Deutsch", codePage: "windows-1252" },
    pl: { name: "Polnisch", codePage: "windows-1250" },
    cyrillic: { name: "Kyrillisch", codePage: "windows-1251" }
  };
  const CONTROLS = [
    "NUL", "SOH", "STX", "ETX", "EOT", "ENQ", "ACK", "BEL",
    "BS", "HT", "LF", "VT", "FF", "CR", "SO", "SI",
    "DLE", "DC1", "DC2", "DC3", "DC4", "NAK", "SYN", "ETB",
    "CAN", "EM", "SUB", "ESC", "FS", "GS", "RS", "US"
  ];
  const UNDEFINED_BYTES = {
    "windows-1252": [0x81, 0x8D, 0x8F, 0x90, 0x9D],
    "windows-1250": [0x81, 0x83, 0x88, 0x90, 0x98],
    "windows-1251": [0x98]
  };
  const tableCache = new Map();

  function validateInput(bits) {
    if (typeof bits !== "string" || /[^01]/.test(bits)) {
      return { valid: false, error: "Bitte nur Nullen und Einsen eingeben, ohne Leerzeichen." };
    }
    if (bits.length > 64) {
      return { valid: false, error: "Die ursprüngliche Eingabe darf höchstens 64 Bit enthalten." };
    }
    return { valid: true, error: "" };
  }

  function partition(bits, size) {
    const validation = validateInput(bits);
    if (!validation.valid) throw new Error(validation.error);
    if (!Number.isInteger(size) || size < 1 || size > 64) {
      throw new RangeError("Eine Blockgröße zwischen 1 und 64 Bit ist erforderlich.");
    }
    const padding = bits.length ? (size - bits.length % size) % size : 0;
    const padded = "0".repeat(padding) + bits;
    const blocks = [];
    for (let offset = 0; offset < padded.length; offset += size) {
      blocks.push({
        bits: padded.slice(offset, offset + size),
        padding: Math.max(0, Math.min(size, padding - offset))
      });
    }
    return { original: bits, padded, padding, size, blocks };
  }

  function unsigned(bits) {
    if (!/^[01]+$/.test(bits)) throw new Error("Ein nicht leerer Bitblock ist erforderlich.");
    return BigInt("0b" + bits);
  }

  function digits(value, base) {
    if (base !== 10 && base !== 16) throw new RangeError("Zahlenbasis muss 10 oder 16 sein.");
    return BigInt(value).toString(base).toUpperCase();
  }

  function parseAnswer(text, base, signed = false) {
    if (base !== 10 && base !== 16) throw new RangeError("Zahlenbasis muss 10 oder 16 sein.");
    const clean = text.trim();
    const negative = signed && clean.startsWith("-");
    const magnitude = negative ? clean.slice(1) : clean;
    const pattern = base === 10 ? /^[0-9]+$/ : /^[0-9a-f]+$/i;
    if (!pattern.test(magnitude)) return null;
    const value = BigInt(base === 16 ? "0x" + magnitude : magnitude);
    return negative ? -value : value;
  }

  function characterTable(charset) {
    if (!CHARSETS[charset]) throw new Error("Unbekannte Zeichentabelle.");
    if (tableCache.has(charset)) return tableCache.get(charset);
    const { codePage } = CHARSETS[charset];
    const decoder = codePage ? new TextDecoder(codePage, { fatal: true }) : null;
    const table = Array.from({ length: 256 }, (_, index) => {
      let character = null;
      if (index < 128) character = String.fromCharCode(index);
      else if (decoder && !UNDEFINED_BYTES[codePage].includes(index)) {
        character = decoder.decode(Uint8Array.of(index));
      }
      let label = character;
      if (character === null) label = "unbelegt";
      else if (index < 32) label = CONTROLS[index];
      else if (index === 32) label = "SP";
      else if (index === 127) label = "DEL";
      else if (index === 160) label = "NBSP";
      else if (index === 173) label = "SHY";
      return { index, character, label, assigned: character !== null };
    });
    tableCache.set(charset, table);
    return table;
  }

  function unicodeEntry(codePoint) {
    if (!Number.isInteger(codePoint) || codePoint < 0 || codePoint > 0x10FFFF ||
        (codePoint >= 0xD800 && codePoint <= 0xDFFF)) {
      throw new RangeError("Ein gültiger Unicode-Skalarwert ist erforderlich.");
    }
    const character = String.fromCodePoint(codePoint);
    const identifier = "U+" + codePoint.toString(16).toUpperCase().padStart(4, "0");
    const names = {
      32: "SP", 127: "DEL", 160: "NBSP", 173: "SHY", 8203: "ZWSP",
      8204: "ZWNJ", 8205: "ZWJ", 8232: "LS", 8233: "PS", 65279: "BOM"
    };
    let label = character;
    if (codePoint < 32) label = CONTROLS[codePoint];
    else if (names[codePoint]) label = names[codePoint];
    else if (/[\p{Cc}\p{Cf}\p{Z}]/u.test(character)) label = identifier;
    else if (/\p{M}/u.test(character)) label = "◌" + character;
    return { codePoint, character, identifier, label };
  }

  function segmentUtf8(bits) {
    const partitioned = partition(bits, 8);
    const bytes = partitioned.blocks.map(block => ({
      bits: block.bits, value: Number(unsigned(block.bits))
    }));
    const blocks = [];
    for (let offset = 0; offset < bytes.length;) {
      const start = offset;
      const first = bytes[start].value;
      const length = first <= 0x7F ? 1 : first >= 0xC2 && first <= 0xDF ? 2 :
        first >= 0xE0 && first <= 0xEF ? 3 : first >= 0xF0 && first <= 0xF4 ? 4 : 0;
      let error = "";
      let codePoint = null;
      offset += 1;
      if (!length) {
        error = first >= 0x80 && first <= 0xBF
          ? "Fortsetzungsbyte ohne Startbyte."
          : "Ungültiges UTF-8-Startbyte.";
      } else {
        while (offset < start + length && offset < bytes.length &&
               bytes[offset].value >= 0x80 && bytes[offset].value <= 0xBF) offset += 1;
        if (offset < start + length) {
          error = offset === bytes.length
            ? `Abgebrochene UTF-8-Folge: ${length} Bytes erwartet, ${offset - start} vorhanden.`
            : "Fortsetzungsbyte erwartet: Es muss mit 10 beginnen.";
        }
      }
      const firstPrefix = first <= 0x7F ? 1 : first < 0xC0 ? 2 : first < 0xE0 ? 3 : first < 0xF0 ? 4 : 5;
      const byteInfo = bytes.slice(start, offset).map((byte, index) => ({
        bits: byte.bits, prefixLength: index === 0 ? firstPrefix : 2
      }));
      const payload = byteInfo.map(byte => byte.bits.slice(byte.prefixLength)).join("");
      if (!error) {
        codePoint = Number(unsigned(payload));
        if (codePoint < [0, 0, 0x80, 0x800, 0x10000][length]) {
          error = "Überlange UTF-8-Folge: Der Codepoint muss kürzer codiert werden.";
        } else if (codePoint >= 0xD800 && codePoint <= 0xDFFF) {
          error = "Surrogat-Codepoints sind in UTF-8 nicht zulässig.";
        } else if (codePoint > 0x10FFFF) {
          error = "Codepoint außerhalb des Unicode-Bereichs bis U+10FFFF.";
        }
      }
      blocks.push({
        bits: byteInfo.map(byte => byte.bits).join(""),
        padding: start === 0 ? partitioned.padding : 0,
        utf8: { bytes: byteInfo, payload, codePoint: error ? null : codePoint, error, byteOffset: start }
      });
    }
    return { ...partitioned, size: null, blocks };
  }

  const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));

  function hsvToRgb(h, s, v) {
    const sector = (h * 6) % 6;
    const x = v * s * (1 - Math.abs(sector % 2 - 1));
    const c = v * s;
    const groups = [[c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x]];
    return groups[Math.floor(sector)].map(value => value + v - c);
  }

  function labToRgb(l, a, b) {
    const fy = (l + 16) / 116;
    const inverse = t => t > 6 / 29 ? t ** 3 : 3 * (6 / 29) ** 2 * (t - 4 / 29);
    const x = 0.95047 * inverse(fy + a / 500);
    const y = inverse(fy);
    const z = 1.08883 * inverse(fy - b / 200);
    const linear = [
      3.2404542 * x - 1.5371385 * y - 0.4985314 * z,
      -0.9692660 * x + 1.8760108 * y + 0.0415560 * z,
      0.0556434 * x - 0.2040259 * y + 1.0572252 * z
    ];
    const clipped = linear.some(value => value < -0.00001 || value > 1.00001);
    const rgb = linear.map(value => {
      const bounded = clamp(value);
      return bounded <= 0.0031308 ? 12.92 * bounded : 1.055 * bounded ** (1 / 2.4) - 0.055;
    });
    return { rgb, clipped };
  }

  function decodeColor(bits, space) {
    const depth = bits.length;
    if (depth < 1 || depth > 24) throw new RangeError("Farbtiefe muss zwischen 1 und 24 Bit liegen.");
    if (!["rgb", "cmy", "hsb", "lab"].includes(space)) throw new Error("Unbekannter Farbraum.");
    const gray = depth % 3 !== 0;
    const channelSize = gray ? depth : depth / 3;
    const max = 2 ** channelSize - 1;
    const names = gray ? ["Grau"] : {
      rgb: ["Rot", "Grün", "Blau"], cmy: ["Cyan", "Magenta", "Gelb"], hsb: ["H", "S", "B"], lab: ["L*", "a*", "b*"]
    }[space];
    const channels = names.map((name, index) => {
      const channelBits = bits.slice(index * channelSize, (index + 1) * channelSize);
      const raw = Number(unsigned(channelBits));
      return { name, bits: channelBits, raw, max, fraction: raw / max };
    });
    const fractions = channels.map(channel => channel.fraction);
    let rgb;
    let clipped = false;
    let physical = [];
    if (gray) rgb = Array(3).fill(fractions[0]);
    else if (space === "rgb") rgb = fractions;
    else if (space === "cmy") rgb = fractions.map(value => 1 - value);
    else if (space === "hsb") {
      rgb = hsvToRgb(...fractions);
      physical = [fractions[0] * 360, fractions[1] * 100, fractions[2] * 100];
    } else {
      physical = [fractions[0] * 100, fractions[1] * 255 - 128, fractions[2] * 255 - 128];
      ({ rgb, clipped } = labToRgb(...physical));
    }
    const rgbBytes = rgb.map(value => Math.round(clamp(value) * 255));
    return {
      type: "color", gray, space, channels, physical, clipped, rgb: rgbBytes,
      css: `rgb(${rgbBytes.join(", ")})`,
      hex: "#" + rgbBytes.map(value => value.toString(16).padStart(2, "0")).join("").toUpperCase()
    };
  }

  function integerSize(settings) {
    if (!INTEGER_SIZES.includes(settings.integerSize)) throw new RangeError("Ungültige Ganzzahl-Blockgröße.");
    return settings.integerSize;
  }

  const encodings = {
    integer: {
      name: "Positive Ganzzahlen",
      size: integerSize,
      decode: bits => ({ type: "integer", value: unsigned(bits) })
    },
    signed: {
      name: "Ganzzahlen mit Vorzeichen",
      size: integerSize,
      decode: bits => ({ type: "integer", signed: true, value: BigInt.asIntN(bits.length, unsigned(bits)) })
    },
    character: {
      name: "Zeichen",
      size: () => 8,
      segment: (bits, settings) => settings.charset === "utf8" ? segmentUtf8(bits) : partition(bits, 8),
      decode(bits, settings, block) {
        if (settings.charset !== "utf8") {
          return { type: "character", ...characterTable(settings.charset)[Number(unsigned(bits))] };
        }
        if (!block || !block.utf8) throw new Error("UTF-8-Blockmetadaten fehlen.");
        if (block.utf8.error) return { type: "error", message: block.utf8.error };
        return { type: "utf8", ...unicodeEntry(block.utf8.codePoint), value: BigInt(block.utf8.codePoint) };
      }
    },
    color: {
      name: "Farben",
      size(settings) {
        if (!Number.isInteger(settings.colorDepth) || settings.colorDepth < 1 || settings.colorDepth > 24) {
          throw new RangeError("Ungültige Farbtiefe.");
        }
        return settings.colorDepth;
      },
      decode: (bits, settings) => decodeColor(bits, settings.colorSpace)
    },
    boolean: {
      name: "Wahrheitswerte",
      size: () => 1,
      decode: (bits, settings) => ({ type: "boolean", value: (bits === "1") !== settings.reverseBoolean })
    }
  };

  function interpret(bits, encoding, settings) {
    const definition = encodings[encoding];
    if (!definition) throw new Error("Unbekannte Codierung.");
    const result = definition.segment ? definition.segment(bits, settings) : partition(bits, definition.size(settings));
    return { ...result, blocks: result.blocks.map(block => ({
      ...block, decoded: definition.decode(block.bits, settings, block)
    })) };
  }

  const api = {
    INTEGER_SIZES, CHARSETS, encodings, validateInput, partition, unsigned,
    digits, parseAnswer, characterTable, unicodeEntry, segmentUtf8, decodeColor, labToRgb, interpret
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.BitDecoder = api;
})(globalThis);
