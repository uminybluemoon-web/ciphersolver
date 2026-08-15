(() => {
  const FILES = {
    hira: "../regex/words-ja-hira.json",
    kanji: "../regex/words-ja-kanji.json",
    en: "../regex/words-en.json",
  };
  const cache = {};
  const status = document.getElementById("status");
  const err = document.getElementById("err");
  const hits = document.getElementById("hits");
  const normEl = document.getElementById("norm");
  const textEl = document.getElementById("text");
  const dropEl = document.getElementById("drop");

  function kataToHira(ch) {
    const c = ch.codePointAt(0);
    if (c >= 0x30a1 && c <= 0x30f6) return String.fromCodePoint(c - 0x60);
    if (ch === "ヵ") return "か";
    if (ch === "ヶ") return "け";
    return ch;
  }

  function normalize(raw, src) {
    const out = [];
    for (const ch of raw || "") {
      if (/\s/.test(ch)) continue;
      let x = src === "hira" ? kataToHira(ch) : ch;
      if (src === "en") {
        if (!/[a-zA-Z]/.test(x)) continue;
        x = x.toLowerCase();
      }
      out.push(x);
    }
    return out.join("");
  }

  function dropSet(src) {
    const s = normalize(dropEl.value, src);
    return new Set([...s]);
  }

  function strip(w, drop) {
    return [...w].filter((ch) => !drop.has(ch)).join("");
  }

  function markDropped(w, drop) {
    const wrap = document.createElement("span");
    wrap.className = "from";
    for (const ch of w) {
      if (drop.has(ch)) {
        const d = document.createElement("span");
        d.className = "drop";
        d.textContent = ch;
        wrap.appendChild(d);
      } else wrap.append(ch);
    }
    return wrap;
  }

  async function load(src) {
    if (cache[src]) return cache[src];
    status.textContent = "辞書を読み込み中…";
    const r = await fetch(FILES[src]);
    const data = await r.json();
    const set = new Set();
    for (const w0 of data) {
      const w = normalize(w0, src);
      if (w) set.add(w);
    }
    cache[src] = { list: [...set], set };
    return cache[src];
  }

  function opts() {
    const src = document.getElementById("src").value;
    const minlen = Math.max(1, +document.getElementById("minlen").value || 2);
    const limit = Math.max(10, Math.min(5000, +document.getElementById("limit").value || 400));
    return { src, minlen, limit };
  }

  function showErr(msg) {
    err.textContent = msg;
    hits.innerHTML = "";
    normEl.textContent = "";
  }

  function addCopy(el, text) {
    el.addEventListener("click", () => navigator.clipboard.writeText(text));
  }

  async function decode() {
    err.textContent = "";
    hits.innerHTML = "";
    const { src, minlen } = opts();
    const drop = dropSet(src);
    if (!drop.size) {
      showErr("消す文字を入力してください");
      return;
    }
    const raw = normalize(textEl.value, src);
    if (!raw) {
      showErr("解読する文を入力してください");
      return;
    }
    const left = strip(raw, drop);
    const big = document.createElement("p");
    big.className = "big";
    big.appendChild(markDropped(raw, drop));
    const arrow = document.createElement("span");
    arrow.className = "arrow";
    arrow.textContent = " → ";
    big.appendChild(arrow);
    big.append(left || "（空）");
    hits.appendChild(big);
    normEl.textContent = `残り ${left.length} 文字`;
    let dict;
    try {
      dict = await load(src);
    } catch (e) {
      err.textContent = "辞書の読み込みに失敗しました";
      status.textContent = "";
      return;
    }
    if (!left) {
      status.textContent = "全部消えました。";
      return;
    }
    const ok = left.length >= minlen && dict.set.has(left);
    status.textContent = ok
      ? `残り「${left}」は辞書にあります ／ 辞書 ${dict.set.size} 語`
      : `残り「${left}」は辞書にありません ／ 辞書 ${dict.set.size} 語`;
  }

  async function encode() {
    err.textContent = "";
    hits.innerHTML = "";
    const { src, minlen, limit } = opts();
    const drop = dropSet(src);
    if (!drop.size) {
      showErr("消す文字を入力してください");
      return;
    }
    const target = normalize(textEl.value, src);
    if (!target) {
      showErr("残りたい語を入力してください");
      return;
    }
    if (target.length < minlen) {
      showErr("残りたい語が短すぎます");
      return;
    }
    let dict;
    try {
      dict = await load(src);
    } catch (e) {
      err.textContent = "辞書の読み込みに失敗しました";
      status.textContent = "";
      return;
    }
    const found = [];
    for (const w of dict.list) {
      if (w === target) continue;
      if (![...w].some((ch) => drop.has(ch))) continue;
      if (strip(w, drop) === target) {
        found.push(w);
        if (found.length >= limit) break;
      }
    }
    found.sort((a, b) => a.length - b.length || (a < b ? -1 : 1));
    const extra = found.length >= limit;
    status.textContent = extra
      ? `${limit}+ 件（表示 ${found.length}）／ 辞書 ${dict.set.size} 語`
      : `${found.length} 件 ／ 辞書 ${dict.set.size} 語`;
    normEl.textContent = `目標「${target}」`;
    const frag = document.createDocumentFragment();
    found.forEach((w) => {
      const el = document.createElement("span");
      el.className = "pair";
      el.appendChild(markDropped(w, drop));
      const ar = document.createElement("span");
      ar.className = "arrow";
      ar.textContent = "→";
      el.appendChild(ar);
      el.append(target);
      addCopy(el, w + " → " + target);
      frag.appendChild(el);
    });
    hits.appendChild(frag);
  }

  async function pairs() {
    err.textContent = "";
    hits.innerHTML = "";
    const { src, minlen, limit } = opts();
    const drop = dropSet(src);
    if (!drop.size) {
      showErr("消す文字を入力してください");
      return;
    }
    let dict;
    try {
      dict = await load(src);
    } catch (e) {
      err.textContent = "辞書の読み込みに失敗しました";
      status.textContent = "";
      return;
    }
    const found = [];
    for (const w of dict.list) {
      if (![...w].some((ch) => drop.has(ch))) continue;
      const left = strip(w, drop);
      if (left.length < minlen || left === w) continue;
      if (dict.set.has(left)) {
        found.push([w, left]);
        if (found.length >= limit) break;
      }
    }
    found.sort((a, b) => a[0].length - b[0].length || (a[0] < b[0] ? -1 : 1));
    const extra = found.length >= limit;
    status.textContent = extra
      ? `ペア ${limit}+ 件（表示 ${found.length}）／ 辞書 ${dict.set.size} 語`
      : `ペア ${found.length} 件 ／ 辞書 ${dict.set.size} 語`;
    normEl.textContent = `消す文字：${[...drop].join(" ")}`;
    const frag = document.createDocumentFragment();
    found.forEach(([w, left]) => {
      const el = document.createElement("span");
      el.className = "pair";
      el.appendChild(markDropped(w, drop));
      const ar = document.createElement("span");
      ar.className = "arrow";
      ar.textContent = "→";
      el.appendChild(ar);
      el.append(left);
      addCopy(el, w + " → " + left);
      frag.appendChild(el);
    });
    hits.appendChild(frag);
  }

  document.getElementById("decode").addEventListener("click", decode);
  document.getElementById("encode").addEventListener("click", encode);
  document.getElementById("pairs").addEventListener("click", pairs);
  textEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") decode();
  });
})();
