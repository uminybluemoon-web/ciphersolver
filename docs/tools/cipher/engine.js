(() => {
  const DAKUTEN_FROM = "かきくけこさしすせそたちつてとはひふへほ";
  const DAKUTEN_TO = "がぎぐげござじずぜぞだぢづでどばびぶべぼ";
  const HANDAKU_FROM = "はひふへほ";
  const HANDAKU_TO = "ぱぴぷぺぽ";
  const BRAILLE_AZ_STR = "⠁⠃⠉⠙⠑⠋⠛⠓⠊⠚⠅⠇⠍⠝⠕⠏⠟⠗⠎⠞⠥⠧⠺⠭⠽⠵";
  const BRAILLE_DIGITS = "⠚⠁⠃⠉⠙⠑⠋⠛⠓⠊";
  const BRAILLE_NUM = "⠼";

  function tr(s, a, b) {
    return [...s].map((ch) => {
      const i = a.indexOf(ch);
      return i >= 0 ? b[i] : ch;
    }).join("");
  }

  function chrVisible(code) {
    if (code == null || code < 0 || code > 0x10ffff) return "?";
    if (code >= 0xd800 && code <= 0xdfff) return "?";
    if (code < 32 || code === 127) return "\\x" + code.toString(16).toUpperCase().padStart(2, "0");
    try {
      return String.fromCodePoint(code);
    } catch {
      return "?";
    }
  }

  function pickChar(item, charPos) {
    if (charPos == null) return item;
    if (charPos < 1 || charPos > item.length) return "?";
    return item[charPos - 1];
  }

  function pickFromList(items, index, charPos) {
    if (index < 1 || index > items.length) return "?";
    return pickChar(items[index - 1], charPos);
  }

  function joinTokens(parts) {
    if (!parts.length) return "";
    if (parts.every((p) => [...p].length === 1)) return parts.join("");
    return parts.join(" ");
  }

  function initialOf(v) {
    if (!v || v === "?") return "?";
    return [...v][0];
  }

  function parseTokens(raw) {
    const s = raw.trim();
    if (!s) return { tokens: [], err: "入力が空です" };
    const parts = s.split(/[\s,]+/).filter(Boolean);
    const tokens = [];
    for (const part of parts) {
      const one = parseOne(part);
      if (one.err) return { tokens: [], err: one.err };
      tokens.push(one.tok);
    }
    return { tokens, err: null };
  }

  function parseOne(part) {
    const lower = part.toLowerCase();
    if ((part.match(/-/g) || []).length === 1 && !lower.startsWith("0x")) {
      const [left, right] = part.split("-");
      if (/^\d+$/.test(left) && /^\d+$/.test(right) && left && right) {
        return { tok: { raw: part, decimal: +left, charPos: +right, hexVal: null, binVal: null } };
      }
    }
    let decimal = null;
    if (/^-?\d+$/.test(part)) decimal = parseInt(part, 10);
    let hexVal = null;
    const h = lower.startsWith("0x") ? part.slice(2) : part;
    if (/^[0-9a-fA-F]+$/.test(h)) hexVal = parseInt(h, 16);
    let binVal = null;
    const b = lower.startsWith("0b") ? part.slice(2) : part;
    if (/^[01]+$/.test(b)) binVal = parseInt(b, 2);
    if (decimal == null && hexVal == null && binVal == null) {
      return { err: "形式エラー: " + part };
    }
    return { tok: { raw: part, decimal, charPos: null, hexVal, binVal } };
  }

  function listScheme(name, items, alsoInitials) {
    return {
      name,
      alsoInitials: !!alsoInitials,
      lookup: (index, charPos) => pickFromList(items, index, charPos),
      reverseEntries: () => {
        const out = [];
        items.forEach((item, i) => {
          out.push([item, String(i + 1)]);
          if ([...item].length > 1) {
            [...item].forEach((ch, cpos) => out.push([ch, `${i + 1}-${cpos + 1}`]));
          }
        });
        return out;
      },
    };
  }

  function buildSchemes(T) {
    const elementLookup = (index, charPos) => {
      if (index < 1 || index > T.ELEMENTS.length) return "?";
      const [symbol, en] = T.ELEMENTS[index - 1];
      if (charPos == null) return symbol;
      return pickChar(en, charPos);
    };
    return [
      listScheme("五十音（歴史あり）", T.GOJUON_HISTORICAL),
      listScheme("五十音（歴史なし）", T.GOJUON_MODERN),
      listScheme("いろは（歴史あり）", T.IROHA_HISTORICAL),
      listScheme("いろは（歴史なし）", T.IROHA_MODERN),
      listScheme("アルファベット", T.ALPHABET),
      {
        name: "元素（記号／英語名n文字目）",
        alsoInitials: false,
        lookup: elementLookup,
        reverseEntries: () => {
          const out = [];
          T.ELEMENTS.forEach(([symbol, en], i) => {
            out.push([symbol, String(i + 1)], [en, String(i + 1)]);
            [...en].forEach((ch, cpos) => out.push([ch, `${i + 1}-${cpos + 1}`]));
          });
          return out;
        },
      },
      listScheme("十二支", T.ZODIAC, true),
      listScheme("和風月名", T.WAHU_MONTHS, true),
      listScheme("月（英語）", T.EN_MONTHS, true),
      listScheme("星座JP（おひつじ起点）", T.CONSTELLATION_JP_ARIES, true),
      listScheme("星座EN（Aries起点）", T.CONSTELLATION_EN_ARIES, true),
      listScheme("星座JP（やぎ起点）", T.CONSTELLATION_JP_CAPRICORN, true),
      listScheme("星座EN（Capricorn起点）", T.CONSTELLATION_EN_CAPRICORN, true),
      listScheme("星座JP（みずがめ起点）", T.CONSTELLATION_JP_AQUARIUS, true),
      listScheme("星座EN（Aquarius起点）", T.CONSTELLATION_EN_AQUARIUS, true),
      listScheme("星座EN（アルファベット順）", T.CONSTELLATION_EN_ALPHA, true),
      listScheme("星座JP（五十音順）", T.CONSTELLATION_JP_GOJUON, true),
      listScheme("惑星（日本語読み）", T.PLANETS_JP, true),
      listScheme("惑星（英語）", T.PLANETS_EN, true),
      listScheme("春夏秋冬（日本語）", T.SEASONS_JP, true),
      listScheme("春夏秋冬（英語）", T.SEASONS_EN, true),
      listScheme("ドレミファソラシ", T.SOLFEGE, true),
      listScheme("CDEFGAB", T.SOLFEGE_CDEFGAB),
      listScheme("ドレミの歌", T.DOREMI_SONG, true),
      listScheme("虹の色（日本語）", T.RAINBOW_JP, true),
      listScheme("虹の色（英語）", T.RAINBOW_EN, true),
      listScheme("曜日（日曜始まり・漢字）", T.WEEKDAYS_JP),
      listScheme("曜日（日曜始まり・英語）", T.WEEKDAYS_EN, true),
      listScheme("七つの大罪（読み）", T.DEADLY_SINS_JP, true),
      listScheme("七つの大罪（英語）", T.DEADLY_SINS_EN, true),
      listScheme("都道府県（番号順）", T.PREFECTURES_JIS, true),
      listScheme("都道府県（面積順）", T.PREFECTURES_AREA, true),
    ];
  }

  function mikakaFromDigits(T, digits) {
    if (!digits || !/^\d+$/.test(digits)) return "?";
    if ([...digits].some((c) => c !== digits[0])) return "?";
    const group = T.MIKAKA_GROUPS[digits[0]];
    if (!group || digits.length > [...group].length) return "?";
    return [...group][digits.length - 1];
  }

  function mikakaEncodeChar(T, ch) {
    const hMap = Object.fromEntries([...HANDAKU_TO].map((d, i) => [d, HANDAKU_FROM[i]]));
    const dMap = Object.fromEntries([...DAKUTEN_TO].map((d, i) => [d, DAKUTEN_FROM[i]]));
    if (hMap[ch]) {
      const base = mikakaEncodeChar(T, hMap[ch]);
      return base == null ? null : base + "#";
    }
    if (dMap[ch]) {
      const base = mikakaEncodeChar(T, dMap[ch]);
      return base == null ? null : base + "*";
    }
    for (const [digit, group] of Object.entries(T.MIKAKA_GROUPS)) {
      const idx = [...group].indexOf(ch);
      if (idx >= 0) return digit.repeat(idx + 1);
    }
    if (ch === " " || ch === "　") return "/";
    return null;
  }

  function mikakaEncode(T, text) {
    return [...text].map((ch) => mikakaEncodeChar(T, ch) ?? "?").join(" ");
  }

  function mikakaDecodeToken(T, tok) {
    tok = tok.trim();
    if (!tok || tok === "/") return " ";
    let marks = "";
    while (tok.endsWith("*") || tok.endsWith("#")) {
      marks = tok.at(-1) + marks;
      tok = tok.slice(0, -1);
    }
    let ch = mikakaFromDigits(T, tok);
    if (ch === "?") return "?";
    for (const m of marks) {
      if (m === "*") ch = tr(ch, DAKUTEN_FROM, DAKUTEN_TO);
      if (m === "#") ch = tr(ch, HANDAKU_FROM, HANDAKU_TO);
    }
    return ch;
  }

  function mikakaDecode(T, text) {
    const parts = text.trim().split(/[\s,]+/).filter(Boolean);
    return parts.map((p) => mikakaDecodeToken(T, p)).join("");
  }

  function morseEncode(T, text) {
    const revW = T.WABUN_MORSE;
    const az = T.MORSE_AZ;
    return text.trim().split(/\s+/).map((word) =>
      [...word].map((ch) => revW[ch] || az[ch.toUpperCase()] || "?").join(" ")
    ).join(" / ");
  }

  function morseDecode(T, text) {
    const azRev = Object.fromEntries(Object.entries(T.MORSE_AZ).map(([k, v]) => [v, k]));
    const wRev = Object.fromEntries(Object.entries(T.WABUN_MORSE).map(([k, v]) => [v, k]));
    return text.trim().split(/\s*\/\s*|\s*\|\s*/).map((word) =>
      word.split(/\s+/).filter(Boolean).map((pat) => azRev[pat] || wRev[pat] || "?").join("")
    ).join(" ");
  }

  function looksLikeMorse(s) {
    s = s.trim();
    return /^[.\-–—/|\s]+$/.test(s) && /[.\-]/.test(s);
  }

  function brailleEncode(text) {
    const az = {};
    for (let i = 0; i < 26; i++) az[String.fromCharCode(97 + i)] = BRAILLE_AZ_STR[i];
    let out = "";
    let inNum = false;
    for (const ch of text) {
      if (/\d/.test(ch)) {
        if (!inNum) {
          out += BRAILLE_NUM;
          inNum = true;
        }
        out += BRAILLE_DIGITS[+ch];
        continue;
      }
      inNum = false;
      const low = ch.toLowerCase();
      if (az[low]) out += az[low];
      else if (ch === " ") out += " ";
      else out += "?";
    }
    return out;
  }

  function brailleDecode(text) {
    const azRev = {};
    for (let i = 0; i < 26; i++) azRev[BRAILLE_AZ_STR[i]] = String.fromCharCode(97 + i);
    const dRev = {};
    [...BRAILLE_DIGITS].forEach((ch, i) => { dRev[ch] = String(i); });
    let out = "";
    let inNum = false;
    for (const ch of text) {
      if (ch === BRAILLE_NUM) {
        inNum = true;
        continue;
      }
      if (ch === " ") {
        inNum = false;
        out += " ";
        continue;
      }
      if (inNum && dRev[ch] != null) {
        out += dRev[ch];
        continue;
      }
      inNum = false;
      out += azRev[ch] || "?";
    }
    return out;
  }

  function looksLikeBraille(s) {
    s = s.trim();
    if (!s) return false;
    const br = [...s].filter((ch) => ch >= "\u2800" && ch <= "\u28FF").length;
    return br >= Math.max(1, [...s.replace(/ /g, "")].length / 2);
  }

  function rotAz(text, shift) {
    return [...text].map((ch) => {
      if (ch >= "A" && ch <= "Z") return String.fromCharCode(((ch.charCodeAt(0) - 65 + shift) % 26) + 65);
      if (ch >= "a" && ch <= "z") return String.fromCharCode(((ch.charCodeAt(0) - 97 + shift) % 26) + 97);
      return ch;
    }).join("");
  }

  function rot18(text) {
    return [...text].map((ch) => (/\d/.test(ch) ? String((+ch + 5) % 10) : rotAz(ch, 13))).join("");
  }

  function rot47(text) {
    return [...text].map((ch) => {
      const o = ch.charCodeAt(0);
      if (o >= 33 && o <= 126) return String.fromCharCode(33 + ((o - 33 + 47) % 94));
      return ch;
    }).join("");
  }

  function atbash(text) {
    return [...text].map((ch) => {
      if (ch >= "A" && ch <= "Z") return String.fromCharCode(90 - (ch.charCodeAt(0) - 65));
      if (ch >= "a" && ch <= "z") return String.fromCharCode(122 - (ch.charCodeAt(0) - 97));
      return ch;
    }).join("");
  }

  const BACON = {};
  for (let i = 0; i < 26; i++) {
    BACON[String.fromCharCode(65 + i)] = i.toString(2).padStart(5, "0").replace(/0/g, "A").replace(/1/g, "B");
  }
  const BACON_REV = Object.fromEntries(Object.entries(BACON).map(([k, v]) => [v, k]));

  function baconEncode(text) {
    return [...text].map((ch) => {
      if (/[a-zA-Z]/.test(ch)) return BACON[ch.toUpperCase()];
      if (ch === " ") return "/";
      return "?";
    }).join(" ");
  }

  function baconDecode(text) {
    const raw = text.replace(/[^ABab/ ]/g, "").toUpperCase();
    const buf = [...raw].filter((c) => c === "A" || c === "B").join("");
    const chunks = raw.trim().split(/\s*\/\s*|\s+/);
    if (buf.length >= 5 && !chunks.some((c) => c && c !== "/" && c.length === 5)) {
      const parts = [];
      for (let i = 0; i + 5 <= buf.length; i += 5) parts.push(buf.slice(i, i + 5));
      return parts.map((c) => BACON_REV[c] || "?").join("");
    }
    return chunks.map((chunk) => {
      if (!chunk || chunk === "/") return " ";
      const letters = [...chunk].filter((c) => c === "A" || c === "B").join("");
      return letters.length === 5 ? BACON_REV[letters] || "?" : "?";
    }).join("").trim();
  }

  function looksLikeBacon(text) {
    const s = text.replace(/\s/g, "");
    if (s.length < 5) return false;
    const core = text.replace(/[^ABab]/g, "");
    return core.length >= 5 && core.length / Math.max(1, s.length) > 0.8;
  }

  function b64encode(text) {
    return btoa(unescape(encodeURIComponent(text)));
  }
  function tryB64decode(text) {
    const s = text.replace(/\s+/g, "");
    if (s.length < 4 || !/^[A-Za-z0-9+/]+=*$/.test(s)) return null;
    try {
      const out = decodeURIComponent(escape(atob(s)));
      if (b64encode(out).replace(/=+$/, "") !== s.replace(/=+$/, "")) return null;
      return out;
    } catch {
      return null;
    }
  }

  const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  function b32encode(text) {
    const bytes = new TextEncoder().encode(text);
    let bits = "";
    for (const b of bytes) bits += b.toString(2).padStart(8, "0");
    while (bits.length % 5) bits += "0";
    let out = "";
    for (let i = 0; i < bits.length; i += 5) out += B32[parseInt(bits.slice(i, i + 5), 2)];
    while (out.length % 8) out += "=";
    return out;
  }
  function tryB32decode(text) {
    const s = text.replace(/\s+/g, "").toUpperCase();
    if (s.length < 8 || !/^[A-Z2-7]+=*$/.test(s)) return null;
    try {
      const body = s.replace(/=+$/, "");
      let bits = "";
      for (const ch of body) {
        const i = B32.indexOf(ch);
        if (i < 0) return null;
        bits += i.toString(2).padStart(5, "0");
      }
      const bytes = [];
      for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
      return new TextDecoder().decode(new Uint8Array(bytes));
    } catch {
      return null;
    }
  }

  function unicodeEscapeEncode(text) {
    return [...text].map((ch) => {
      const o = ch.codePointAt(0);
      if (o > 127) return "\\u" + o.toString(16).padStart(4, "0");
      if (o < 32) return "\\x" + o.toString(16).padStart(2, "0");
      return ch;
    }).join("");
  }
  function tryUnicodeEscape(text) {
    if (!/\\(u[0-9a-fA-F]{4}|U[0-9a-fA-F]{8}|x[0-9a-fA-F]{2})/.test(text)) return null;
    try {
      const out = text
        .replace(/\\U([0-9a-fA-F]{8})/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
        .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
        .replace(/\\x([0-9a-fA-F]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
      return out === text ? null : out;
    } catch {
      return null;
    }
  }

  function formatDetail(tokens, values) {
    return tokens.map((tok, i) => `${tok.raw}→${values[i]}`).join("  ");
  }

  function decodeAll(T, schemes, tokens) {
    const row = (name, values) => ({ name, text: joinTokens(values), detail: formatDetail(tokens, values) });
    const results = [
      row("ASCII／符号位置（10進）", tokens.map((t) => (t.charPos == null ? chrVisible(t.decimal) : "?"))),
      row("ASCII／符号位置（16進）", tokens.map((t) => (t.charPos == null ? chrVisible(t.hexVal) : "?"))),
      row("ASCII／符号位置（2進）", tokens.map((t) => (t.charPos == null ? chrVisible(t.binVal) : "?"))),
      row("みかか", tokens.map((t) => (t.charPos == null && t.decimal != null ? mikakaFromDigits(T, String(t.decimal)) : "?"))),
    ];
    const plain = tokens.every((t) => t.charPos == null);
    for (const scheme of schemes) {
      const values = tokens.map((t) => (t.decimal == null ? "?" : scheme.lookup(t.decimal, t.charPos)));
      results.push(row(scheme.name, values));
      if (scheme.alsoInitials && plain) {
        results.push(row(scheme.name + "（頭文字）", values.map(initialOf)));
      }
    }
    return results;
  }

  function keysEq(a, b) {
    return a === b || a.toLowerCase() === b.toLowerCase();
  }

  function collectExact(entries, q) {
    const hits = [];
    const seen = new Set();
    for (const [key, hint] of entries) {
      if (keysEq(key, q) && !seen.has(hint)) {
        seen.add(hint);
        hits.push(hint);
      }
    }
    return hits;
  }

  function collectInitials(entries, q) {
    const hits = [];
    const seen = new Set();
    for (const [key, hint] of entries) {
      if (hint.includes("-")) continue;
      const initial = initialOf(key);
      if (keysEq(initial, q) && !seen.has(hint)) {
        seen.add(hint);
        hits.push(hint);
      }
    }
    return hits;
  }

  function formatSeqHits(hits) {
    if (!hits.length) return "?";
    const plain = hits.filter((h) => !h.includes("-"));
    return (plain.length ? plain : hits).join(",");
  }

  function reverseParts(q) {
    const tokens = q.split(/[\s,]+/).filter(Boolean);
    if (tokens.length > 1) return tokens;
    if ([...q].length > 1) return [...q];
    return null;
  }

  function isCleanSeq(seq) {
    return seq.every((h) => h !== "?" && !h.includes("-"));
  }

  function reverseLookup(T, schemes, query) {
    const q = query.trim();
    if (!q) return [];
    const rows = [];
    const chars = [...q];
    rows.push(["ASCII／符号位置（10進）", chars.map((ch) => ch.codePointAt(0)).join(" ")]);
    rows.push([
      "ASCII／符号位置（16進）",
      chars.map((ch) => {
        const o = ch.codePointAt(0);
        return o < 256 ? o.toString(16).toUpperCase().padStart(2, "0") : o.toString(16).toUpperCase();
      }).join(" "),
    ]);
    rows.push(["ASCII／符号位置（2進）", chars.map((ch) => ch.codePointAt(0).toString(2)).join(" ")]);
    const morse = morseEncode(T, q);
    if (morse.split(/[ /]+/).some((p) => p && p !== "?")) rows.push(["モールス", morse]);
    const mk = mikakaEncode(T, q);
    if (mk.split(" ").some((p) => p !== "?")) rows.push(["みかか", mk]);
    const br = brailleEncode(q);
    if (br && !br.includes("?")) rows.push(["点字", br]);

    const exactNames = new Set();
    for (const scheme of schemes) {
      const entries = scheme.reverseEntries();
      const hits = collectExact(entries, q);
      if (hits.length) {
        rows.push([scheme.name, hits.join(", ")]);
        exactNames.add(scheme.name);
      }
      if (scheme.alsoInitials) {
        const initName = scheme.name + "（頭文字）";
        const initHits = collectInitials(entries, q);
        if (initHits.length) {
          rows.push([initName, initHits.join(", ")]);
          exactNames.add(initName);
        }
      }
    }
    const parts = reverseParts(q);
    if (!parts) return rows;
    for (const scheme of schemes) {
      const entries = scheme.reverseEntries();
      if (!exactNames.has(scheme.name)) {
        const seq = parts.map((p) => formatSeqHits(collectExact(entries, p)));
        if (isCleanSeq(seq)) rows.push([scheme.name, seq.join(" ")]);
      }
      if (scheme.alsoInitials) {
        const initName = scheme.name + "（頭文字）";
        if (!exactNames.has(initName)) {
          const seq = parts.map((p) => formatSeqHits(collectInitials(entries, p)));
          if (isCleanSeq(seq)) rows.push([initName, seq.join(" ")]);
        }
      }
    }
    return rows;
  }

  function convertAll(T, text) {
    const rows = [];
    const add = (group, name, value) => {
      if (value == null) return;
      rows.push({ group, name, text: value });
    };
    add("符号化", "Base64", b64encode(text));
    const d64 = tryB64decode(text);
    if (d64 != null) add("符号化", "Base64（復号）", d64);
    add("符号化", "Base32", b32encode(text));
    const d32 = tryB32decode(text);
    if (d32 != null) add("符号化", "Base32（復号）", d32);
    add("符号化", "URLエンコード", encodeURIComponent(text));
    if (text.includes("%") || text.includes("+")) {
      try {
        const u = decodeURIComponent(text.replace(/\+/g, " "));
        if (u !== text) add("符号化", "URLデコード", u);
      } catch {}
    }
    const esc = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    add("符号化", "HTMLエスケープ", esc);
    if (text.includes("&")) {
      const ta = document.createElement("textarea");
      ta.innerHTML = text;
      if (ta.value !== text) add("符号化", "HTMLアンエスケープ", ta.value);
    }
    add("符号化", "Unicodeエスケープ", unicodeEscapeEncode(text));
    const ue = tryUnicodeEscape(text);
    if (ue != null) add("符号化", "Unicodeエスケープ（復号）", ue);
    add("符号化", "文字列リテラル", JSON.stringify(text));
    add("符号", "モールス（欧文／和文）", morseEncode(T, text));
    if (looksLikeMorse(text)) add("符号", "モールス（復号）", morseDecode(T, text.replace(/[–—]/g, "-")));
    add("符号", "点字", brailleEncode(text));
    if (looksLikeBraille(text)) add("符号", "点字（復号）", brailleDecode(text));
    add("符号", "みかか", mikakaEncode(T, text));
    const mkParts = text.trim().split(/[\s,]+/).filter(Boolean);
    if (/\d/.test(text) && mkParts.every((p) => /^[0-9*#/]+$/.test(p))) {
      add("符号", "みかか（復号）", mikakaDecode(T, text));
    }
    add("暗号", "ROT13", rotAz(text, 13));
    add("暗号", "ROT18", rot18(text));
    add("暗号", "ROT47", rot47(text));
    add("暗号", "アトバシュ", atbash(text));
    add("暗号", "ベーコン", baconEncode(text));
    if (looksLikeBacon(text)) add("暗号", "ベーコン（復号）", baconDecode(text));
    for (let n = 1; n <= 25; n++) add("シーザー", "シーザー +" + n, rotAz(text, n));
    return rows;
  }

  window.CipherReady = Promise.resolve(
    window.CIPHER_TABLES || fetch("tables.json").then((r) => r.json())
  ).then((T) => {
      const schemes = buildSchemes(T);
      return {
        parseTokens,
        decodeAll: (tokens) => decodeAll(T, schemes, tokens),
        reverseLookup: (q) => reverseLookup(T, schemes, q),
        convertAll: (text) => convertAll(T, text),
      };
    });
})();
