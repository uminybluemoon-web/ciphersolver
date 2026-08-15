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

  const AZ = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  function brailleEncode(text) {
    let out = "";
    let inNum = false;
    for (const ch of text) {
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

  function brailleDecode(text) {
    const azRev = {};
    for (let i = 0; i < 26; i++) azRev[BRAILLE_AZ[i]] = AZ[i];
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
        continue;
      }
      if (ch === DAKU_MARK || ch === HAN_MARK) {
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
        if (mark === DAKU_MARK && dakuRev[k]) k = dakuRev[k];
        if (mark === HAN_MARK && hanRev[k]) k = hanRev[k];
        mark = "";
        out += k;
        continue;
      }
      mark = "";
      out += azRev[ch] || "?";
    }
    return out;
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

  let kind = "braille";
  const textEl = document.getElementById("text");
  const keysEl = document.getElementById("keys");
  const preview = document.getElementById("preview");
  const extra = document.getElementById("extra");
  const note = document.getElementById("note");

  const NOTES = {
    braille: "欧文点字＋日本語点字（あ行〜ん）。6点をクリックして1文字ずつ足せます。",
    pigpen: "フリーメイソン式（格子＋点＋X）。A–Z のみ。",
    dancing: "踊る人形は原作では18文字だけ。不足分は姿勢で補完した完成版です。語末は旗。",
  };

  function renderKeys() {
    keysEl.innerHTML = "";
    extra.innerHTML = "";
    note.textContent = NOTES[kind];
    if (kind === "braille") extra.appendChild(braillePad());
    const letters = kind === "braille"
      ? [...AZ, ..."あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん"]
      : [...AZ];
    letters.forEach((L) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "key";
      if (kind === "braille") {
        const g = brailleEncode(L);
        b.innerHTML = `<span style="font-size:26px;line-height:1">${g}</span><small>${L}</small>`;
        b.addEventListener("click", () => appendText(L));
      } else if (kind === "pigpen") {
        b.innerHTML = pigpenSvg(L, 40) + `<small>${L}</small>`;
        b.addEventListener("click", () => appendText(L));
      } else {
        b.innerHTML = dancingSvg(L, false, 40) + `<small>${L}</small>`;
        b.addEventListener("click", () => appendText(L));
      }
      keysEl.appendChild(b);
    });
    refreshPreview();
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
    if (kind === "braille") {
      const enc = brailleEncode(t);
      preview.style.fontSize = "28px";
      preview.textContent = enc;
    } else if (kind === "pigpen") {
      preview.style.fontSize = "";
      preview.innerHTML = pigpenEncode(t) || "（A–Z）";
    } else {
      preview.style.fontSize = "";
      preview.innerHTML = dancingEncode(t) || "（A–Z。空白で語末に旗）";
    }
  }

  document.getElementById("kind-tabs").addEventListener("click", (e) => {
    const b = e.target.closest("[data-kind]");
    if (!b) return;
    kind = b.dataset.kind;
    document.querySelectorAll("#kind-tabs .inner-tab").forEach((x) => x.classList.toggle("is-active", x === b));
    renderKeys();
  });
  textEl.addEventListener("input", refreshPreview);
  document.getElementById("clear").addEventListener("click", () => {
    textEl.value = "";
    refreshPreview();
  });
  document.getElementById("copy-text").addEventListener("click", () => {
    navigator.clipboard.writeText(textEl.value);
  });

  renderKeys();
})();
