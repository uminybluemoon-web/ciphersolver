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

  function renderPairs(list, drop, rightOf) {
    const frag = document.createDocumentFragment();
    list.forEach((w) => {
      const el = document.createElement("span");
      el.className = "pair";
      el.appendChild(markDropped(w, drop));
      if (rightOf) {
        const ar = document.createElement("span");
        ar.className = "arrow";
        ar.textContent = "→";
        el.appendChild(ar);
        el.append(rightOf(w));
        addCopy(el, w + " → " + rightOf(w));
      } else addCopy(el, w);
      frag.appendChild(el);
    });
    hits.appendChild(frag);
  }

  function hasAnagramRun(w, needle) {
    const need = [...needle];
    const nlen = need.length;
    if (!nlen) return false;
    const chars = [...w];
    if (chars.length < nlen) return false;
    const key = need.slice().sort().join("");
    for (let i = 0; i <= chars.length - nlen; i++) {
      if (chars.slice(i, i + nlen).sort().join("") === key) return true;
    }
    return false;
  }

  async function contain() {
    err.textContent = "";
    hits.innerHTML = "";
    const { src, minlen, limit } = opts();
    const drop = dropSet(src);
    const needle = normalize(textEl.value, src);
    if (!needle) {
      showErr("含む文字列を入力してください");
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
    const scrambled = document.getElementById("anagram").checked;
    const found = [];
    for (const w of dict.list) {
      if (w.length < minlen) continue;
      if (scrambled) {
        if (!hasAnagramRun(w, needle)) continue;
      } else if (!w.includes(needle)) continue;
      found.push(w);
    }
    found.sort((a, b) => {
      const da = [...a].some((ch) => drop.has(ch)) ? 0 : 1;
      const db = [...b].some((ch) => drop.has(ch)) ? 0 : 1;
      return da - db || a.length - b.length || (a < b ? -1 : 1);
    });
    const extra = found.length > limit;
    const show = extra ? found.slice(0, limit) : found;
    status.textContent = extra
      ? `含む ${limit}+ 件（表示 ${show.length}）／ 辞書 ${dict.set.size} 語`
      : `含む ${show.length} 件 ／ 辞書 ${dict.set.size} 語`;
    normEl.textContent =
      (scrambled ? `「${needle}」を順不同で含む` : `「${needle}」を含む`) +
      (drop.size ? "　（消す文字ありを先に表示）" : "");
    renderPairs(show, drop, null);
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
      if (strip(w, drop) === target) found.push(w);
    }
    found.sort((a, b) => a.length - b.length || (a < b ? -1 : 1));
    const extra = found.length > limit;
    const show = extra ? found.slice(0, limit) : found;
    status.textContent = extra
      ? `${limit}+ 件（表示 ${show.length}）／ 辞書 ${dict.set.size} 語`
      : `${show.length} 件 ／ 辞書 ${dict.set.size} 語`;
    normEl.textContent = `目標「${target}」`;
    renderPairs(show, drop, () => target);
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
      if (dict.set.has(left)) found.push(w);
    }
    found.sort((a, b) => a.length - b.length || (a < b ? -1 : 1));
    const extra = found.length > limit;
    const show = extra ? found.slice(0, limit) : found;
    status.textContent = extra
      ? `ペア ${limit}+ 件（表示 ${show.length}）／ 辞書 ${dict.set.size} 語`
      : `ペア ${show.length} 件 ／ 辞書 ${dict.set.size} 語`;
    normEl.textContent = `消す文字：${[...drop].join(" ")}`;
    renderPairs(show, drop, (w) => strip(w, drop));
  }

  document.getElementById("decode").addEventListener("click", decode);
  document.getElementById("contain").addEventListener("click", contain);
  document.getElementById("encode").addEventListener("click", encode);
  document.getElementById("pairs").addEventListener("click", pairs);
  textEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") contain();
  });
})();
