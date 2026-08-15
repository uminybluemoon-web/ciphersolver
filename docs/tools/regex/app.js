(() => {
  const FILES = {
    hira: "words-ja-hira.json",
    kanji: "words-ja-kanji.json",
    en: "words-en.json",
  };
  const cache = {};
  const status = document.getElementById("status");
  const err = document.getElementById("err");
  const hits = document.getElementById("hits");
  const pat = document.getElementById("pat");

  async function load(key) {
    if (cache[key]) return cache[key];
    status.textContent = "辞書を読み込み中…";
    const r = await fetch(FILES[key]);
    const data = await r.json();
    cache[key] = data;
    return data;
  }

  async function search() {
    err.textContent = "";
    hits.innerHTML = "";
    let raw = pat.value;
    if (!raw) {
      err.textContent = "正規表現を入力してください";
      return;
    }
    if (document.getElementById("full").checked) {
      if (!raw.startsWith("^")) raw = "^" + raw;
      if (!raw.endsWith("$")) raw += "$";
    }
    let re;
    try {
      re = new RegExp(raw, (document.getElementById("icase").checked ? "i" : "") + "u");
    } catch (e) {
      err.textContent = "正規表現が不正です: " + e.message;
      return;
    }
    const key = document.getElementById("src").value;
    let words;
    try {
      words = await load(key);
    } catch (e) {
      err.textContent = "辞書の読み込みに失敗しました";
      status.textContent = "";
      return;
    }
    const found = [];
    const cap = 400;
    for (const w of words) {
      if (re.test(w)) {
        found.push(w);
        if (found.length > cap) break;
      }
      re.lastIndex = 0;
    }
    const extra = found.length > cap;
    const show = extra ? found.slice(0, cap) : found;
    status.textContent = extra
      ? `${cap} 件以上（先頭 ${cap} 件を表示） ／ 辞書 ${words.length} 語`
      : `${show.length} 件 ／ 辞書 ${words.length} 語`;
    const frag = document.createDocumentFragment();
    show.forEach((w) => {
      const s = document.createElement("span");
      s.textContent = w;
      s.addEventListener("click", () => navigator.clipboard.writeText(w));
      frag.appendChild(s);
    });
    hits.appendChild(frag);
  }

  const made = document.getElementById("made");

  function zenToHanDigits(s) {
    return [...s].map((ch) => {
      const i = "０１２３４５６７８９".indexOf(ch);
      return i >= 0 ? String(i) : ch;
    }).join("");
  }

  function escapeRe(ch) {
    return /[\\^$.*+?()[\]{}|]/.test(ch) ? "\\" + ch : ch;
  }

  function classOf(chars) {
    return (
      "[" +
      chars
        .map((ch) => (/[\\\]^-]/.test(ch) ? "\\" + ch : ch))
        .join("") +
      "]"
    );
  }

  function holeToRegex(raw) {
    const s = [...(raw || "")].filter((ch) => !/\s/.test(ch));
    if (!s.length) throw new Error("穴埋めを入力してください");
    let i = 0;
    let body = "";
    while (i < s.length) {
      const ch = s[i];
      if (ch === "?" || ch === "？" || ch === "_" || ch === "＿") {
        body += ".";
        i++;
        continue;
      }
      if (ch === "[") {
        let j = i + 1;
        while (j < s.length && s[j] !== "]") j++;
        if (j >= s.length) throw new Error("[] が閉じていません");
        body += s.slice(i, j + 1).join("");
        i = j + 1;
        continue;
      }
      body += escapeRe(ch);
      i++;
    }
    return "^" + body + "$";
  }

  function parsePositions(raw) {
    const t = zenToHanDigits(raw || "");
    const nums = t.match(/\d+/g) || [];
    const pos = nums.map(Number).filter((n) => n >= 1);
    if (!pos.length) throw new Error("位置を入力してください（例: 2文字目、1文字目）");
    return pos;
  }

  function parseCands(raw) {
    return (raw || "")
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  function pickToRegex(list, positions) {
    if (!list.length) throw new Error("候補リストを入力してください");
    const classes = [];
    const notes = [];
    positions.forEach((n) => {
      const chars = [];
      let skipped = 0;
      list.forEach((w) => {
        const cs = [...w];
        if (n > cs.length) skipped++;
        else chars.push(cs[n - 1]);
      });
      if (!chars.length) throw new Error(`${n}文字目を取れる語がありません`);
      classes.push(classOf(chars));
      notes.push(`${n}文字目 ${chars.join("")}` + (skipped ? `（短い語 ${skipped}）` : ""));
    });
    return { re: "^" + classes.join("") + "$", notes };
  }

  function applyMade(re, note) {
    pat.value = re;
    made.replaceChildren("出力 ");
    const sp = document.createElement("span");
    sp.className = "out";
    sp.textContent = re;
    made.appendChild(sp);
    if (note) made.append("　" + note);
    err.textContent = "";
  }

  document.getElementById("hole-go").addEventListener("click", () => {
    try {
      applyMade(holeToRegex(document.getElementById("hole").value));
    } catch (e) {
      err.textContent = e.message;
    }
  });
  document.getElementById("pick-go").addEventListener("click", () => {
    try {
      const list = parseCands(document.getElementById("cands").value);
      const pos = parsePositions(document.getElementById("pos").value);
      const { re, notes } = pickToRegex(list, pos);
      applyMade(re, notes.join(" ／ "));
    } catch (e) {
      err.textContent = e.message;
    }
  });
  document.getElementById("hole").addEventListener("keydown", (e) => {
    if (e.key === "Enter") document.getElementById("hole-go").click();
  });
  document.getElementById("pos").addEventListener("keydown", (e) => {
    if (e.key === "Enter") document.getElementById("pick-go").click();
  });

  document.getElementById("go").addEventListener("click", search);
  pat.addEventListener("keydown", (e) => {
    if (e.key === "Enter") search();
  });
})();
