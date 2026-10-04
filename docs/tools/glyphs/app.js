(() => {
  const BRAILLE_AZ = "⠁⠃⠉⠙⠑⠋⠛⠓⠊⠚⠅⠇⠍⠝⠕⠏⠟⠗⠎⠞⠥⠧⠺⠭⠽⠵";
  const NUM_SIGN = "⠼";
  const BRAILLE_D = "⠚⠁⠃⠉⠙⠑⠋⠛⠓⠊";
  const KANA = {
    あ: "⠁", い: "⠃", う: "⠉", え: "⠋", お: "⠊",
    か: "⠡", き: "⠣", く: "⠩", け: "⠫", こ: "⠪",
    さ: "⠱", し: "⠳", す: "⠹", せ: "⠻", そ: "⠺",
    た: "⠕", ち: "⠗", つ: "⠝", て: "⠟", と: "⠞",
    な: "⠅", に: "⠇", ぬ: "⠍", ね: "⠏", の: "⠎",
    は: "⠥", ひ: "⠧", ふ: "⠭", へ: "⠯", ほ: "⠮",
    ま: "⠵", み: "⠷", む: "⠽", め: "⠾", も: "⠿",
    や: "⠌", ゆ: "⠬", よ: "⠜",
    ら: "⠑", り: "⠓", る: "⠙", れ: "⠛", ろ: "⠚",
    わ: "⠄", ゐ: "⠆", ゑ: "⠖", を: "⠔", ん: "⠴",
    ー: "⠒",
  };
  const DAKU = {
    が: "か", ぎ: "き", ぐ: "く", げ: "け", ご: "こ",
    ざ: "さ", じ: "し", ず: "す", ぜ: "せ", ぞ: "そ",
    だ: "た", ぢ: "ち", づ: "つ", で: "て", ど: "と",
    ば: "は", び: "ひ", ぶ: "ふ", べ: "へ", ぼ: "ほ",
  };
  const HAN = { ぱ: "は", ぴ: "ひ", ぷ: "ふ", ぺ: "へ", ぽ: "ほ" };
  const DAKU_MARK = "⠐";
  const HAN_MARK = "⠠";
  const YOON_MARK = "⠈";
  const YOON_DAKU_MARK = "⠘";
  const YOON_HAN_MARK = "⠨";
  const YOON_SMALL = { ゃ: "あ", ゅ: "う", ょ: "お", ャ: "あ", ュ: "う", ョ: "お" };
  const YOON_CONS = {
    き: "plain", し: "plain", ち: "plain", に: "plain", ひ: "plain", み: "plain", り: "plain",
    ぎ: "daku", じ: "daku", ぢ: "daku", び: "daku",
    ぴ: "han",
  };
  const YOON_CELL = {
    き: { あ: "か", う: "く", お: "こ" },
    し: { あ: "さ", う: "す", お: "そ" },
    ち: { あ: "た", う: "つ", お: "と" },
    に: { あ: "な", う: "ぬ", お: "の" },
    ひ: { あ: "は", う: "ふ", お: "ほ" },
    み: { あ: "ま", う: "む", お: "も" },
    り: { あ: "ら", う: "る", お: "ろ" },
    ぎ: { あ: "か", う: "く", お: "こ" },
    じ: { あ: "さ", う: "す", お: "そ" },
    ぢ: { あ: "た", う: "つ", お: "と" },
    び: { あ: "は", う: "ふ", お: "ほ" },
    ぴ: { あ: "は", う: "ふ", お: "ほ" },
  };
  const YOON_FROM = {
    か: "きゃ", く: "きゅ", こ: "きょ",
    さ: "しゃ", す: "しゅ", そ: "しょ",
    た: "ちゃ", つ: "ちゅ", と: "ちょ",
    な: "にゃ", ぬ: "にゅ", の: "にょ",
    は: "ひゃ", ふ: "ひゅ", ほ: "ひょ",
    ま: "みゃ", む: "みゅ", も: "みょ",
    ら: "りゃ", る: "りゅ", ろ: "りょ",
  };
  const YOON_DAKU_FROM = {
    か: "ぎゃ", く: "ぎゅ", こ: "ぎょ",
    さ: "じゃ", す: "じゅ", そ: "じょ",
    た: "ぢゃ", つ: "ぢゅ", と: "ぢょ",
    は: "びゃ", ふ: "びゅ", ほ: "びょ",
  };
  const YOON_HAN_FROM = { は: "ぴゃ", ふ: "ぴゅ", ほ: "ぴょ" };

  const AZ = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  function toHiraCh(ch) {
    const c = ch.codePointAt(0);
    if (c >= 0x30a1 && c <= 0x30f6) return String.fromCodePoint(c - 0x60);
    if (ch === "ヵ" || ch === "ヶ") return ch === "ヵ" ? "か" : "け";
    return ch;
  }

  function brailleEncode(text) {
    let out = "";
    let inNum = false;
    const chars = [...text];
    for (let i = 0; i < chars.length; i++) {
      let ch = toHiraCh(chars[i]);
      if (/\d/.test(ch)) {
        if (!inNum) {
          out += NUM_SIGN;
          inNum = true;
        }
        out += BRAILLE_D[+ch];
        continue;
      }
      inNum = false;
      if (ch === " " || ch === "　") {
        out += " ";
        continue;
      }
      const low = ch.toLowerCase();
      if (low >= "a" && low <= "z") {
        out += BRAILLE_AZ[low.charCodeAt(0) - 97];
        continue;
      }
      const next = i + 1 < chars.length ? toHiraCh(chars[i + 1]) : "";
      const vow = YOON_SMALL[next];
      if (vow && YOON_CONS[ch] && YOON_CELL[ch] && YOON_CELL[ch][vow]) {
        const kind = YOON_CONS[ch];
        const mark = kind === "daku" ? YOON_DAKU_MARK : kind === "han" ? YOON_HAN_MARK : YOON_MARK;
        out += mark + KANA[YOON_CELL[ch][vow]];
        i++;
        continue;
      }
      if (HAN[ch]) {
        out += HAN_MARK + KANA[HAN[ch]];
        continue;
      }
      if (DAKU[ch]) {
        out += DAKU_MARK + KANA[DAKU[ch]];
        continue;
      }
      if (KANA[ch]) {
        out += KANA[ch];
        continue;
      }
      out += "?";
    }
    return out;
  }

  function brailleDecodeJa(text) {
    const dRev = {};
    [...BRAILLE_D].forEach((c, i) => {
      dRev[c] = String(i);
    });
    const kanaRev = {};
    Object.entries(KANA).forEach(([k, v]) => {
      kanaRev[v] = k;
    });
    const dakuRev = Object.fromEntries(Object.entries(DAKU).map(([d, s]) => [s, d]));
    const hanRev = Object.fromEntries(Object.entries(HAN).map(([d, s]) => [s, d]));
    let out = "";
    let inNum = false;
    let mark = "";
    for (const ch of text) {
      if (ch === NUM_SIGN) {
        inNum = true;
        mark = "";
        continue;
      }
      if (ch === DAKU_MARK || ch === HAN_MARK || ch === YOON_MARK || ch === YOON_DAKU_MARK || ch === YOON_HAN_MARK) {
        mark = ch;
        inNum = false;
        continue;
      }
      if (ch === " ") {
        inNum = false;
        mark = "";
        out += " ";
        continue;
      }
      if (inNum && dRev[ch] != null) {
        out += dRev[ch];
        continue;
      }
      inNum = false;
      if (kanaRev[ch]) {
        let k = kanaRev[ch];
        if (mark === YOON_MARK && YOON_FROM[k]) k = YOON_FROM[k];
        else if (mark === YOON_DAKU_MARK && YOON_DAKU_FROM[k]) k = YOON_DAKU_FROM[k];
        else if (mark === YOON_HAN_MARK && YOON_HAN_FROM[k]) k = YOON_HAN_FROM[k];
        else if (mark === DAKU_MARK && dakuRev[k]) k = dakuRev[k];
        else if (mark === HAN_MARK && hanRev[k]) k = hanRev[k];
        mark = "";
        out += k;
        continue;
      }
      mark = "";
      out += "?";
    }
    return out;
  }

  function brailleDecodeEn(text) {
    const azRev = {};
    for (let i = 0; i < 26; i++) azRev[BRAILLE_AZ[i]] = AZ[i];
    const dRev = {};
    [...BRAILLE_D].forEach((c, i) => {
      dRev[c] = String(i);
    });
    let out = "";
    let inNum = false;
    let caps = false;
    for (const ch of text) {
      if (ch === NUM_SIGN) {
        inNum = true;
        continue;
      }
      if (ch === HAN_MARK) {
        caps = true;
        inNum = false;
        continue;
      }
      if (ch === DAKU_MARK || ch === YOON_MARK || ch === YOON_DAKU_MARK || ch === YOON_HAN_MARK) {
        inNum = false;
        continue;
      }
      if (ch === " ") {
        inNum = false;
        caps = false;
        out += " ";
        continue;
      }
      if (inNum && dRev[ch] != null) {
        out += dRev[ch];
        continue;
      }
      inNum = false;
      if (azRev[ch]) {
        out += caps ? azRev[ch] : azRev[ch].toLowerCase();
        caps = false;
        continue;
      }
      caps = false;
      out += "?";
    }
    return out;
  }

  function brailleDecode(text) {
    return brailleDecodeJa(text);
  }

  function looksLikeBraille(s) {
    s = (s || "").trim();
    if (!s) return false;
    const br = [...s].filter((ch) => ch >= "\u2800" && ch <= "\u28FF").length;
    return br >= Math.max(1, [...s.replace(/ /g, "")].length / 2);
  }

  const PIG_WALLS = {
    A: "ES", B: "WES", C: "WS", D: "NES", E: "NEWS", F: "NWS", G: "NE", H: "NWE", I: "NW",
    J: "ES", K: "WES", L: "WS", M: "NES", N: "NEWS", O: "NWS", P: "NE", Q: "NWE", R: "NW",
  };
  const PIG_DOT = new Set("JKLMNOPQRWXYZ");
  const PIG_X = { S: "N", T: "E", U: "S", V: "W", W: "N", X: "E", Y: "S", Z: "W" };

  function pigpenSvg(letter, size) {
    const L = letter.toUpperCase();
    const s = size || 44;
    const lines = [];
    const box = { N: [[10, 10], [30, 10]], E: [[30, 10], [30, 30]], S: [[10, 30], [30, 30]], W: [[10, 10], [10, 30]] };
    if (PIG_X[L]) {
      const c = [20, 20];
      const tri = {
        N: [[10, 10], [30, 10]],
        E: [[30, 10], [30, 30]],
        S: [[10, 30], [30, 30]],
        W: [[10, 10], [10, 30]],
      };
      const [a, b] = tri[PIG_X[L]];
      lines.push([a, c], [b, c]);
    } else if (PIG_WALLS[L]) {
      for (const w of PIG_WALLS[L]) lines.push(box[w]);
    } else {
      return "";
    }
    let d = "";
    for (const [[x1, y1], [x2, y2]] of lines) {
      d += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" />`;
    }
    if (PIG_DOT.has(L)) d += `<circle cx="20" cy="20" r="2.2" fill="#1c1914" />`;
    return `<svg viewBox="0 0 40 40" width="${s}" height="${s}" aria-label="${L}"><g fill="none" stroke="#1c1914" stroke-width="2.4" stroke-linecap="square">${d}</g></svg>`;
  }

  function pigpenEncode(text) {
    return [...text].map((ch) => {
      if (ch === " ") return " ";
      const L = ch.toUpperCase();
      if (AZ.includes(L)) return pigpenSvg(L, 36);
      return `<span>?</span>`;
    }).join("");
  }

  // 踊る人形: 腕・脚の角度で26通り。旗は語末。
  const MEN = [
    { la: -90, ra: 90, ll: -18, rl: 18 },
    { la: -50, ra: 90, ll: -30, rl: 10 },
    { la: -90, ra: 50, ll: -10, rl: 30 },
    { la: -20, ra: 20, ll: -35, rl: 35 },
    { la: -120, ra: 120, ll: -12, rl: 12 },
    { la: 20, ra: -20, ll: -20, rl: 20 },
    { la: -90, ra: 0, ll: -25, rl: 5 },
    { la: 0, ra: 90, ll: -5, rl: 25 },
    { la: -70, ra: 70, ll: 15, rl: 15 },
    { la: -140, ra: 40, ll: -22, rl: 22 },
    { la: -40, ra: 140, ll: -22, rl: 22 },
    { la: -90, ra: 90, ll: -40, rl: 0 },
    { la: -90, ra: 90, ll: 0, rl: 40 },
    { la: -60, ra: 60, ll: -40, rl: 40 },
    { la: 0, ra: 0, ll: -15, rl: 15 },
    { la: -110, ra: 70, ll: -8, rl: 28 },
    { la: -70, ra: 110, ll: -28, rl: 8 },
    { la: -150, ra: 150, ll: -20, rl: 20 },
    { la: -30, ra: 30, ll: 8, rl: -8 },
    { la: -100, ra: 10, ll: -32, rl: 18 },
    { la: -10, ra: 100, ll: -18, rl: 32 },
    { la: -80, ra: 80, ll: 30, rl: -10 },
    { la: -45, ra: 135, ll: -15, rl: 35 },
    { la: -135, ra: 45, ll: -35, rl: 15 },
    { la: -95, ra: 95, ll: -28, rl: 28 },
    { la: 40, ra: 40, ll: -22, rl: 22 },
  ];

  function polar(x, y, deg, len) {
    const r = (deg * Math.PI) / 180;
    return [x + Math.sin(r) * len, y + Math.cos(r) * len];
  }

  function dancingSvg(letter, flag, size) {
    const i = AZ.indexOf(letter.toUpperCase());
    if (i < 0) return "";
    const p = MEN[i];
    const [lax, lay] = polar(20, 18, p.la, 12);
    const [rax, ray] = polar(20, 18, p.ra, 12);
    const [llx, lly] = polar(20, 34, p.ll, 12);
    const [rlx, rly] = polar(20, 34, p.rl, 12);
    let flagG = "";
    if (flag) {
      flagG = `<line x1="${rax}" y1="${ray}" x2="${rax + 8}" y2="${ray - 2}" /><rect x="${rax + 8}" y="${ray - 8}" width="7" height="6" fill="#8b3d2f" stroke="none" />`;
    }
    const s = size || 48;
    return `<svg viewBox="0 0 40 56" width="${s}" height="${Math.round(s * 1.4)}" aria-label="${letter}${flag ? " 語末" : ""}">
      <g fill="none" stroke="#1c1914" stroke-width="2.2" stroke-linecap="round">
        <circle cx="20" cy="10" r="4.2" />
        <line x1="20" y1="14.2" x2="20" y2="34" />
        <line x1="20" y1="18" x2="${lax}" y2="${lay}" />
        <line x1="20" y1="18" x2="${rax}" y2="${ray}" />
        <line x1="20" y1="34" x2="${llx}" y2="${lly}" />
        <line x1="20" y1="34" x2="${rlx}" y2="${rly}" />
        ${flagG}
      </g>
    </svg>`;
  }

  function dancingEncode(text) {
    const words = text.trim().split(/\s+/);
    const html = [];
    words.forEach((word, wi) => {
      const letters = [...word].map((c) => c.toUpperCase()).filter((c) => AZ.includes(c));
      letters.forEach((L, i) => {
        html.push(dancingSvg(L, i === letters.length - 1, 40));
      });
      if (wi < words.length - 1) html.push(`<span style="width:8px"></span>`);
    });
    return html.join("");
  }

  const MORSE_AZ = {
    A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.",
    G: "--.", H: "....", I: "..", J: ".---", K: "-.-", L: ".-..",
    M: "--", N: "-.", O: "---", P: ".--.", Q: "--.-", R: ".-.",
    S: "...", T: "-", U: "..-", V: "...-", W: ".--", X: "-..-",
    Y: "-.--", Z: "--..",
    0: "-----", 1: ".----", 2: "..---", 3: "...--", 4: "....-",
    5: ".....", 6: "-....", 7: "--...", 8: "---..", 9: "----.",
  };
  const WABUN_MORSE = {
    あ: "--.--", い: ".-", う: "..-", え: "-.---", お: ".-...",
    か: ".-..", き: "-.-..", く: "...-", け: "-.--", こ: "----",
    さ: "-.-.-", し: "--.-.", す: "---.-", せ: ".---.", そ: "---.",
    た: "-.", ち: "..-.", つ: ".--.", て: ".-.--", と: "..-..",
    な: ".-.", に: "-.-.", ぬ: "....", ね: "--.-", の: "..--",
    は: "-...", ひ: "--..-", ふ: "--..", へ: ".", ほ: "-..",
    ま: "-..-", み: "..-.-", む: "-", め: "-...-", も: "-..-.",
    や: ".--", ゆ: "-..--", よ: "--",
    ら: "...", り: "--.", る: "-.--.", れ: "---", ろ: ".-.-",
    わ: "-.-", ゐ: ".-..-", ゑ: ".--..", を: ".---", ん: ".-.-.",
    ー: ".--.-", ゛: "..", ゜: "..--.",
  };
  const MORSE_AZ_REV = Object.fromEntries(Object.entries(MORSE_AZ).map(([k, v]) => [v, k]));
  const WABUN_REV = Object.fromEntries(Object.entries(WABUN_MORSE).map(([k, v]) => [v, k]));

  const IROHA_AZ = {
    A: "い", B: "は", C: "に", D: "ほ", E: "へ", F: "ち", G: "り", H: "ぬ",
    I: "゛", J: "を", K: "わ", L: "か", M: "よ", N: "た", O: "れ", P: "つ",
    Q: "ね", R: "な", S: "ら", T: "む", U: "う", V: "く", W: "や", X: "ま",
    Y: "け", Z: "ふ",
  };
  const IROHA_REV = Object.fromEntries(Object.entries(IROHA_AZ).map(([k, v]) => [v, k]));

  function toHira(ch) {
    const c = ch.charCodeAt(0);
    if (c >= 0x30a1 && c <= 0x30f6) return String.fromCharCode(c - 0x60);
    return ch;
  }

  function kanaParts(ch) {
    const h = toHira(ch);
    if (HAN[h]) return [HAN[h], "゜"];
    if (DAKU[h]) return [DAKU[h], "゛"];
    return [h];
  }

  function looksLikeMorse(s) {
    const t = s.trim().replace(/[–—]/g, "-");
    return t.length > 0 && /^[.\-\s|/]+$/.test(t) && /[.\-]/.test(t);
  }

  function parseMorseTokens(s) {
    const t = s.trim().replace(/[–—]/g, "-");
    return t.split(/\s*\/\s*|\s*\|\s*/).map((w) => w.trim().split(/\s+/).filter(Boolean));
  }

  function textToMorseTokens(text) {
    const words = [];
    for (const word of text.trim().split(/\s+/)) {
      if (!word) continue;
      const letters = [];
      for (const ch of word) {
        const up = ch.toUpperCase();
        if (MORSE_AZ[up]) {
          letters.push(MORSE_AZ[up]);
          continue;
        }
        let ok = false;
        for (const p of kanaParts(ch)) {
          if (WABUN_MORSE[p]) {
            letters.push(WABUN_MORSE[p]);
            ok = true;
          }
        }
        if (!ok) letters.push("?");
      }
      words.push(letters);
    }
    return words;
  }

  function decodeMorseWords(words, rev) {
    return words.map((lets) => lets.map((p) => (p === "?" ? "?" : rev[p] || "?")).join("")).join(" ");
  }

  function morsePatternHtml(words) {
    return words.map((lets) => lets.join(" ")).join(" / ");
  }

  function dualBox(rows) {
    return `<div class="dual-out">${rows
      .map((r) => `<div class="dual-row"><div class="lbl">${r.lbl}</div><div class="val">${r.val}</div></div>`)
      .join("")}</div>`;
  }

  const RH = { down: 180, low: 225, out: 270, high: 315, up: 0, acrossHigh: 45, acrossLow: 135 };
  const LH = { down: 180, low: 135, out: 90, high: 45, up: 0, acrossHigh: 315, acrossLow: 225 };
  const SEM_ARMS = {
    A: ["down", "low"], B: ["down", "out"], C: ["down", "high"], D: ["down", "up"],
    E: ["high", "down"], F: ["out", "down"], G: ["low", "down"], H: ["acrossLow", "out"],
    I: ["acrossLow", "up"], J: ["out", "up"], K: ["up", "low"], L: ["high", "low"],
    M: ["out", "low"], N: ["low", "low"], O: ["acrossHigh", "out"], P: ["up", "out"],
    Q: ["high", "out"], R: ["out", "out"], S: ["low", "out"], T: ["up", "high"],
    U: ["high", "high"], V: ["low", "up"], W: ["out", "acrossHigh"], X: ["low", "acrossHigh"],
    Y: ["out", "high"], Z: ["out", "acrossLow"],
  };

  function armEnd(cx, cy, deg, len) {
    const r = (deg * Math.PI) / 180;
    return [cx + Math.sin(r) * len, cy - Math.cos(r) * len];
  }

  function flagPersonSvg(lDeg, rDeg, size, label, extra) {
    const s = size || 52;
    const [lx, ly] = armEnd(22, 20, lDeg, 14);
    const [rx, ry] = armEnd(18, 20, rDeg, 14);
    const red = `<rect x="${rx - 3}" y="${ry - 5}" width="7" height="9" fill="#c44536" stroke="#1c1914" stroke-width="0.8" transform="rotate(${rDeg} ${rx} ${ry})" />`;
    const white = `<rect x="${lx - 3}" y="${ly - 5}" width="7" height="9" fill="#f7f3ea" stroke="#1c1914" stroke-width="0.8" transform="rotate(${lDeg} ${lx} ${ly})" />`;
    return `<svg viewBox="0 0 40 56" width="${s}" height="${Math.round(s * 1.35)}" aria-label="${label || ""}">
      <g fill="none" stroke="#1c1914" stroke-width="2" stroke-linecap="round">
        <circle cx="20" cy="11" r="4" />
        <line x1="20" y1="15" x2="20" y2="34" />
        <line x1="18" y1="20" x2="${rx}" y2="${ry}" />
        <line x1="22" y1="20" x2="${lx}" y2="${ly}" />
        <line x1="20" y1="34" x2="14" y2="48" />
        <line x1="20" y1="34" x2="26" y2="48" />
      </g>
      ${red}${white}${extra || ""}
    </svg>`;
  }

  function semaSvg(letter, size) {
    const L = letter.toUpperCase();
    const p = SEM_ARMS[L];
    if (!p) return "";
    return flagPersonSvg(LH[p[0]], RH[p[1]], size, L);
  }

  const GENGA_POSE = {
    rest: [180, 180],
    0: [180, 180],
    1: [90, 270],
    2: [180, 0],
    R2: [0, 180],
    3: [45, 225],
    4: [135, 315],
    5: [315, 45],
    6: [270, 270],
    7: [90, 0],
    8: [180, 270],
    9: [240, 270],
    10: [45, 315],
    11: [45, 225],
    12: [0, 0],
    13: [45, 180],
    14: [180, 315],
  };

  function gengaSvg(id, size) {
    const p = GENGA_POSE[id];
    if (!p) return "";
    let extra = "";
    if (id === 0) {
      extra = `<path d="M10 42 A12 12 0 1 1 30 42" fill="none" stroke="#c44536" stroke-width="1.6" stroke-dasharray="2 2" />`;
    }
    if (id === 11) {
      extra = `<path d="M8 16 L32 40" fill="none" stroke="#8b3d2f" stroke-width="1.4" stroke-dasharray="3 2" />`;
    }
    const lab = id === "rest" ? "原" : id === "R2" ? "逆2" : String(id);
    return flagPersonSvg(p[0], p[1], size, lab, extra);
  }

  const GENGA_SEQ = {
    "9,3": "あ", "3,2": "い", "6,9": "う", "1,R2,1": "え", "1,2,3": "お",
    "8,3": "か", "6,2": "き", 11: "く", "7,3": "け", "8,1": "こ",
    "1,12": "さ", "5,7": "し", "1,2,5": "す", "9,7": "せ", "5,3": "そ",
    "11,5": "た", "7,R2": "ち", "12,3": "つ", "6,3": "て", "2,5": "と",
    "1,3": "な", 6: "に", "9,4": "ぬ", "9,2,1": "ね", 3: "の",
    10: "は", "1,7": "ひ", 9: "ふ", 4: "へ", "1,2,10": "ほ",
    "9,5": "ま", "6,1": "み", "7,5": "む", "3,5": "め", "6,7": "も",
    "8,4": "や", "9,1": "ゆ", "8,6": "よ",
    "5,9": "ら", 12: "り", "3,7": "る", 7: "れ", "7,8": "ろ",
    "2,9": "わ", "6,12": "ゐ", "9,3,1": "ゑ", "1,9": "を", "5,1": "ん",
    13: "゛", 14: "゜", 2: "ー",
  };

  function seqKey(arr) {
    return arr.join(",");
  }

  function kanaToGenga(ch) {
    const h = toHira(ch);
    const parts = kanaParts(h);
    const out = [];
    for (const p of parts) {
      const hit = Object.entries(GENGA_SEQ).find(([, k]) => k === p);
      if (hit) out.push(String(hit[0]).split(","));
      else out.push(null);
    }
    return out;
  }

  let gengaBuf = [];

  // Elder Futhark (24). Digraphs TH / NG / EI first when encoding.
  const ELDER_RUNES = [
    ["\u16A0", "F"], ["\u16A2", "U"], ["\u16A6", "TH"], ["\u16A8", "A"], ["\u16B1", "R"], ["\u16B2", "K"],
    ["\u16B7", "G"], ["\u16B9", "W"], ["\u16BA", "H"], ["\u16BE", "N"], ["\u16C1", "I"], ["\u16C3", "J"],
    ["\u16C7", "EI"], ["\u16C8", "P"], ["\u16C9", "Z"], ["\u16CA", "S"], ["\u16CF", "T"], ["\u16D2", "B"],
    ["\u16D6", "E"], ["\u16D7", "M"], ["\u16DA", "L"], ["\u16DC", "NG"], ["\u16DE", "D"], ["\u16DF", "O"],
  ];
  const ELDER_TO_LAT = Object.fromEntries(ELDER_RUNES.map(([r, l]) => [r, l]));
  // Younger Futhark (long-branch) + shared Elder forms for alternate reading.
  const YOUNGER_TO_LAT = {
    "\u16A0": "F", "\u16A2": "U", "\u16A6": "TH", "\u16AC": "O", "\u16B1": "R", "\u16B4": "K",
    "\u16BC": "H", "\u16BE": "N", "\u16C1": "I", "\u16C5": "A", "\u16CB": "S", "\u16CF": "T",
    "\u16D2": "B", "\u16D8": "M", "\u16DA": "L", "\u16E6": "R",
    "\u16A8": "A", "\u16B2": "K", "\u16BA": "H", "\u16CA": "S", "\u16D7": "M", "\u16D6": "E",
    "\u16DE": "D", "\u16DF": "O", "\u16B7": "G", "\u16B9": "W", "\u16C3": "J", "\u16C8": "P",
    "\u16C9": "Z", "\u16DC": "NG", "\u16C7": "EI",
  };

  function looksLikeRunes(s) {
    s = (s || "").trim();
    if (!s) return false;
    const runes = [...s].filter((ch) => ch >= "\u16A0" && ch <= "\u16FF").length;
    return runes >= Math.max(1, [...s.replace(/\s/g, "")].length / 2);
  }

  function runeEncodeElder(text) {
    let out = "";
    const s = (text || "").toUpperCase().replace(/\u00DE/g, "TH");
    const map = {
      A: "\u16A8", B: "\u16D2", C: "\u16B2", D: "\u16DE", E: "\u16D6", F: "\u16A0", G: "\u16B7", H: "\u16BA",
      I: "\u16C1", J: "\u16C3", K: "\u16B2", L: "\u16DA", M: "\u16D7", N: "\u16BE", O: "\u16DF", P: "\u16C8",
      Q: "\u16B2", R: "\u16B1", S: "\u16CA", T: "\u16CF", U: "\u16A2", V: "\u16A2", W: "\u16B9", X: "\u16B2\u16CA",
      Y: "\u16C3", Z: "\u16C9",
    };
    for (let i = 0; i < s.length; ) {
      const ch = s[i];
      if (ch === " " || ch === "\u3000" || ch === "\n" || ch === "\t") {
        out += " ";
        i++;
        continue;
      }
      if (ch === ":" || ch === "\u00B7" || ch === "\u16EB") {
        out += "\u16EB";
        i++;
        continue;
      }
      if (s.startsWith("TH", i)) {
        out += "\u16A6";
        i += 2;
        continue;
      }
      if (s.startsWith("NG", i)) {
        out += "\u16DC";
        i += 2;
        continue;
      }
      if (s.startsWith("EI", i)) {
        out += "\u16C7";
        i += 2;
        continue;
      }
      if (map[ch]) {
        out += map[ch];
        i++;
        continue;
      }
      out += "?";
      i++;
    }
    return out;
  }

  function runeDecode(text, table) {
    let out = "";
    for (const ch of text) {
      if (ch === " " || ch === "\u3000" || ch === "\n" || ch === "\t") {
        out += " ";
        continue;
      }
      if (ch === "\u16EB" || ch === ":" || ch === "\u00B7") {
        out += " ";
        continue;
      }
      if (ch >= "\u16A0" && ch <= "\u16FF") {
        out += table[ch] || "?";
        continue;
      }
      if (/[A-Za-z]/.test(ch)) {
        out += ch.toUpperCase();
        continue;
      }
      out += ch;
    }
    return out;
  }

  function runePad() {
    const wrap = document.createElement("div");
    wrap.style.marginBottom = "8px";
    const row = document.createElement("div");
    row.className = "keys";
    ELDER_RUNES.forEach(([rune, lat]) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "key";
      b.innerHTML = `<span style="font-size:26px;line-height:1">${rune}</span><small>${lat}</small>`;
      b.addEventListener("click", () => appendText(rune));
      row.appendChild(b);
    });
    const sep = document.createElement("button");
    sep.type = "button";
    sep.className = "key";
    sep.innerHTML = `<span style="font-size:22px">\u16EB</span><small>区切り</small>`;
    sep.addEventListener("click", () => appendText("\u16EB"));
    row.appendChild(sep);
    wrap.appendChild(row);
    return wrap;
  }

  let kind = "braille";
  const textEl = document.getElementById("text");
  const keysEl = document.getElementById("keys");
  const preview = document.getElementById("preview");
  const extra = document.getElementById("extra");
  const note = document.getElementById("note");

  const NOTES = {
    braille: "欧文点字と日本語点字（濁点・半濁点・拗音きゃ行など）を同時に出します。6点パッドでも1文字ずつ足せます。",
    pigpen: "フリーメイソン式（格子＋点＋X）。A–Z のみ。",
    dancing: "踊る人形は原作では18文字だけ。不足分は姿勢で補完した完成版です。語末は旗。",
    rune: "Elder Futhark（24文字）が主です。TH/\u16A6、NG/\u16DC、EI/\u16C7。C·K→\u16B2、V·U→\u16A2、Y·J→\u16C3。ルーンを貼るとラテン読みも出します。",
    morse: "符号・欧文・和文を同時に出します。点・線をクリックするか、文字／モールスを直接入力。",
    sema: "欧文は国際セマフォア、和文は日本の原画（右手赤・左手白、受信者から見た形）。両方同時に出ます。",
  };

  function renderKeys() {
    keysEl.innerHTML = "";
    extra.innerHTML = "";
    note.textContent = NOTES[kind];
    if (kind === "braille") extra.appendChild(braillePad());
    if (kind === "rune") extra.appendChild(runePad());
    if (kind === "morse") extra.appendChild(morsePad());
    if (kind === "sema") extra.appendChild(gengaPad());
    const kana = "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん";
    const youon = [
      "きゃ", "きゅ", "きょ", "しゃ", "しゅ", "しょ", "ちゃ", "ちゅ", "ちょ",
      "にゃ", "にゅ", "にょ", "ひゃ", "ひゅ", "ひょ", "みゃ", "みゅ", "みょ",
      "りゃ", "りゅ", "りょ", "ぎゃ", "ぎゅ", "ぎょ", "じゃ", "じゅ", "じょ",
      "びゃ", "びゅ", "びょ", "ぴゃ", "ぴゅ", "ぴょ",
    ];
    let letters;
    if (kind === "braille") letters = [...AZ, ...kana, ...youon];
    else if (kind === "morse" || kind === "sema") letters = [...AZ, ...kana];
    else letters = [...AZ];
    letters.forEach((L) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "key";
      if (kind === "braille") {
        const g = brailleEncode(L);
        b.innerHTML = `<span style="font-size:26px;line-height:1">${g}</span><small>${L}</small>`;
      } else if (kind === "pigpen") {
        b.innerHTML = pigpenSvg(L, 40) + `<small>${L}</small>`;
      } else if (kind === "dancing") {
        b.innerHTML = dancingSvg(L, false, 40) + `<small>${L}</small>`;
      } else if (kind === "rune") {
        const g = runeEncodeElder(L);
        b.innerHTML = `<span style="font-size:26px;line-height:1">${g}</span><small>${L}</small>`;
      } else if (kind === "morse") {
        const pat = MORSE_AZ[L] || WABUN_MORSE[L] || "";
        b.innerHTML = `<span style="font-size:13px">${pat}</span><small>${L}</small>`;
      } else if (kind === "sema") {
        if (AZ.includes(L)) b.innerHTML = semaSvg(L, 40) + `<small>${L}</small>`;
        else {
          const seq = kanaToGenga(L)[0];
          const gid = seq ? seq[0] : null;
          b.innerHTML = (gid != null ? gengaSvg(gid, 36) : "") + `<small>${L}</small>`;
        }
      }
      b.addEventListener("click", () => appendText(L));
      keysEl.appendChild(b);
    });
    refreshPreview();
  }

  function morsePad() {
    const wrap = document.createElement("div");
    wrap.style.display = "flex";
    wrap.style.flexWrap = "wrap";
    wrap.style.gap = "6px";
    wrap.style.marginBottom = "8px";
    [
      [".", "点"],
      ["-", "線"],
      [" ", "文字区切り"],
      [" / ", "語区切り"],
    ].forEach(([s, lab]) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "key wide";
      b.innerHTML = `<b>${s.trim() || "␣"}</b><small>${lab}</small>`;
      b.addEventListener("click", () => appendText(s));
      wrap.appendChild(b);
    });
    return wrap;
  }

  function gengaPad() {
    const wrap = document.createElement("div");
    wrap.style.marginBottom = "8px";
    const row = document.createElement("div");
    row.className = "keys";
    const ids = ["rest", 0, 1, 2, "R2", 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
    ids.forEach((id) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "key";
      const lab = id === "rest" ? "原姿" : id === "R2" ? "逆2" : "第" + id;
      b.innerHTML = gengaSvg(id, 44) + `<small>${lab}</small>`;
      b.addEventListener("click", () => {
        if (id === "rest") {
          commitGenga();
          return;
        }
        gengaBuf.push(id);
        refreshPreview();
      });
      row.appendChild(b);
    });
    const buf = document.createElement("span");
    buf.className = "genga-buf";
    buf.id = "genga-buf";
    wrap.append(row, buf);
    return wrap;
  }

  function commitGenga() {
    if (!gengaBuf.length) {
      appendText(" ");
      return;
    }
    const k = seqKey(gengaBuf);
    const ch = GENGA_SEQ[k];
    gengaBuf = [];
    appendText(ch || "？");
  }

  function braillePad() {
    const wrap = document.createElement("div");
    wrap.style.display = "flex";
    wrap.style.alignItems = "center";
    wrap.style.gap = "8px";
    wrap.style.marginBottom = "8px";
    const grid = document.createElement("div");
    grid.className = "dots";
    const state = [0, 0, 0, 0, 0, 0];
    const order = [0, 3, 1, 4, 2, 5];
    const previewCell = document.createElement("div");
    previewCell.className = "cell-preview";
    function bitsToChar() {
      let bits = 0;
      state.forEach((on, i) => {
        if (on) bits |= 1 << i;
      });
      return String.fromCharCode(0x2800 + bits);
    }
    function sync() {
      previewCell.textContent = bitsToChar();
    }
    order.forEach((dotIndex) => {
      const d = document.createElement("button");
      d.type = "button";
      d.className = "dot";
      d.addEventListener("click", () => {
        state[dotIndex] = state[dotIndex] ? 0 : 1;
        d.classList.toggle("on", !!state[dotIndex]);
        sync();
      });
      grid.appendChild(d);
    });
    const add = document.createElement("button");
    add.type = "button";
    add.className = "act";
    add.textContent = "この点字を追加";
    add.addEventListener("click", () => {
      const ch = bitsToChar();
      const decoded = brailleDecode(ch);
      appendText(decoded === "?" ? ch : decoded);
    });
    wrap.append(grid, previewCell, add);
    sync();
    return wrap;
  }

  function appendText(s) {
    textEl.value += s;
    refreshPreview();
  }

  function refreshPreview() {
    const t = textEl.value;
    preview.style.fontSize = "";
    const bufEl = document.getElementById("genga-buf");
    if (bufEl) {
      bufEl.textContent = gengaBuf.length
        ? "入力中: " + gengaBuf.map((x) => (x === "R2" ? "逆2" : x)).join(" → ") + "（原姿で確定）"
        : "原画をクリックし、原姿で1文字確定";
    }
    if (kind === "braille") {
      const empty = !t.trim();
      const cells = looksLikeBraille(t) ? t : brailleEncode(t);
      preview.style.fontSize = "";
      preview.innerHTML = empty
        ? dualBox([
            { lbl: "点字", val: "（文字または点字を入力）" },
            { lbl: "和文", val: "—" },
            { lbl: "欧文", val: "—" },
          ])
        : dualBox([
            { lbl: "点字", val: `<span style="font-size:28px;line-height:1.2">${cells}</span>` },
            { lbl: "和文", val: brailleDecodeJa(cells) },
            { lbl: "欧文", val: brailleDecodeEn(cells) },
          ]);
    } else if (kind === "pigpen") {
      preview.innerHTML = pigpenEncode(t) || "（A–Z）";
    } else if (kind === "dancing") {
      preview.innerHTML = dancingEncode(t) || "（A–Z。空白で語末に旗）";
    } else if (kind === "rune") {
      const empty = !t.trim();
      const cells = looksLikeRunes(t) ? t : runeEncodeElder(t);
      preview.innerHTML = empty
        ? dualBox([
            { lbl: "ルーン", val: "（ラテン文字またはルーンを入力）" },
            { lbl: "Elder", val: "—" },
            { lbl: "Younger", val: "—" },
          ])
        : dualBox([
            { lbl: "ルーン", val: `<span style="font-size:28px;line-height:1.2">${cells}</span>` },
            { lbl: "Elder", val: runeDecode(cells, ELDER_TO_LAT) },
            { lbl: "Younger", val: runeDecode(cells, YOUNGER_TO_LAT) },
          ]);
    } else if (kind === "morse") {
      const words = looksLikeMorse(t) ? parseMorseTokens(t) : textToMorseTokens(t);
      const empty = !t.trim();
      preview.innerHTML = empty
        ? dualBox([
            { lbl: "符号", val: "（点・線、または文字）" },
            { lbl: "欧文", val: "—" },
            { lbl: "和文", val: "—" },
          ])
        : dualBox([
            { lbl: "符号", val: morsePatternHtml(words) },
            { lbl: "欧文", val: decodeMorseWords(words, MORSE_AZ_REV) },
            { lbl: "和文", val: applyDaku(decodeMorseWords(words, WABUN_REV)) },
          ]);
    } else if (kind === "sema") {
      preview.innerHTML = semaPreview(t);
    }
  }

  function applyDaku(text) {
    let out = "";
    for (const ch of text) {
      if (ch === "゛" && out) {
        const last = out[out.length - 1];
        const d = Object.entries(DAKU).find(([, s]) => s === last);
        out = out.slice(0, -1) + (d ? d[0] : last + ch);
      } else if (ch === "゜" && out) {
        const last = out[out.length - 1];
        const d = Object.entries(HAN).find(([, s]) => s === last);
        out = out.slice(0, -1) + (d ? d[0] : last + ch);
      } else out += ch;
    }
    return out;
  }

  function gengaId(g) {
    if (g === "R2") return "R2";
    if (g === 0 || g === "0") return 0;
    const n = +g;
    return Number.isNaN(n) ? g : n;
  }

  function semaPreview(t) {
    const enFigs = [];
    const jpFigs = [];
    let enRead = "";
    let jpRead = "";
    for (const raw of t) {
      if (raw === " " || raw === "　") {
        enFigs.push(`<span class="genga-gap"></span>`);
        jpFigs.push(`<span class="genga-gap"></span>`);
        enRead += " ";
        jpRead += " ";
        continue;
      }
      const up = raw.toUpperCase();
      if (AZ.includes(up)) {
        enFigs.push(semaSvg(up, 44));
        enRead += up;
        const kana = IROHA_AZ[up];
        jpRead += kana || "？";
        const seqs = kana ? kanaToGenga(kana) : [null];
        (seqs[0] || []).forEach((g) => jpFigs.push(gengaSvg(gengaId(g), 40)));
        jpFigs.push(`<span class="genga-gap"></span>`);
        continue;
      }
      const h = toHira(raw);
      const parts = kanaParts(h);
      let mapped = false;
      parts.forEach((p) => {
        const seqs = kanaToGenga(p);
        if (seqs[0]) {
          seqs[0].forEach((g) => jpFigs.push(gengaSvg(gengaId(g), 40)));
          mapped = true;
        }
        jpRead += p;
        const lat = IROHA_REV[p];
        if (lat) {
          enFigs.push(semaSvg(lat, 44));
          enRead += lat;
        }
      });
      if (mapped) jpFigs.push(`<span class="genga-gap"></span>`);
    }
    jpRead = applyDaku(jpRead);
    if (!t.trim()) {
      return dualBox([
        { lbl: "欧文（国際セマフォア）", val: "（A–Z をクリック）" },
        { lbl: "和文（原画）", val: "（原画をクリックし、原姿で確定）" },
      ]);
    }
    return dualBox([
      { lbl: "欧文　" + (enRead || "—"), val: `<div class="glyph-seq">${enFigs.join("") || "—"}</div>` },
      { lbl: "和文　" + (jpRead || "—"), val: `<div class="glyph-seq">${jpFigs.join("") || "—"}</div>` },
    ]);
  }

  document.getElementById("kind-tabs").addEventListener("click", (e) => {
    const b = e.target.closest("[data-kind]");
    if (!b) return;
    kind = b.dataset.kind;
    gengaBuf = [];
    document.querySelectorAll("#kind-tabs .inner-tab").forEach((x) => x.classList.toggle("is-active", x === b));
    renderKeys();
  });
  textEl.addEventListener("input", refreshPreview);
  document.getElementById("clear").addEventListener("click", () => {
    textEl.value = "";
    gengaBuf = [];
    refreshPreview();
  });
  document.getElementById("copy-text").addEventListener("click", () => {
    navigator.clipboard.writeText(textEl.value);
  });

  renderKeys();
})();
