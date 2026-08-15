(() => {
  const FILES = {
    hira: "../regex/words-ja-hira.json",
    kanji: "../regex/words-ja-kanji.json",
    en: "../regex/words-en.json",
  };
  const DAKU = {
    が: "か", ぎ: "き", ぐ: "く", げ: "け", ご: "こ",
    ざ: "さ", じ: "し", ず: "す", ぜ: "せ", ぞ: "そ",
    だ: "た", ぢ: "ち", づ: "つ", で: "て", ど: "と",
    ば: "は", び: "ひ", ぶ: "ふ", べ: "へ", ぼ: "ほ",
    ぱ: "は", ぴ: "ひ", ぷ: "ふ", ぺ: "へ", ぽ: "ほ",
    ガ: "カ", ギ: "キ", グ: "ク", ゲ: "ケ", ゴ: "コ",
    ザ: "サ", ジ: "シ", ズ: "ス", ゼ: "セ", ゾ: "ソ",
    ダ: "タ", ヂ: "チ", ヅ: "ツ", デ: "テ", ド: "ト",
    バ: "ハ", ビ: "ヒ", ブ: "フ", ベ: "ヘ", ボ: "ホ",
    パ: "ハ", ピ: "ヒ", プ: "フ", ペ: "ヘ", ポ: "ホ",
    ゔ: "う", ヴ: "ウ",
  };

  const cache = {};
  const status = document.getElementById("status");
  const err = document.getElementById("err");
  const hits = document.getElementById("hits");
  const normEl = document.getElementById("norm");
  const lettersEl = document.getElementById("letters");
  let abort = false;

  function kataToHira(ch) {
    const c = ch.codePointAt(0);
    if (c >= 0x30a1 && c <= 0x30f6) return String.fromCodePoint(c - 0x60);
    if (ch === "ヵ") return "か";
    if (ch === "ヶ") return "け";
    return ch;
  }

  function keepChar(ch, src) {
    if (src === "en") return /[a-zA-Z]/.test(ch);
    if (ch === "ー" || ch === "ｰ" || ch === "っ" || ch === "ッ") return true;
    if (/\s|[・、。,.!?'"「」『』（）()\[\]{}]/.test(ch)) return false;
    return true;
  }

  function foldChar(ch, src, icase, daku) {
    let x = src === "hira" ? kataToHira(ch) : ch;
    if (icase) x = x.toLowerCase();
    if (daku && DAKU[x]) x = DAKU[x];
    return x;
  }

  function normalize(raw, src, icase, daku) {
    const out = [];
    for (const ch of raw || "") {
      if (!keepChar(ch, src)) continue;
      const x = foldChar(ch, src, icase, daku);
      if (x) out.push(x);
    }
    return out.join("");
  }

  function countsOf(s) {
    const m = new Map();
    for (const ch of s) m.set(ch, (m.get(ch) || 0) + 1);
    return m;
  }

  function sigOf(s) {
    return [...s].sort().join("");
  }

  function fits(need, pool) {
    for (const [ch, n] of need) {
      if ((pool.get(ch) || 0) < n) return false;
    }
    return true;
  }

  function take(pool, need) {
    const next = new Map(pool);
    let left = 0;
    for (const [ch, n] of need) {
      const v = (next.get(ch) || 0) - n;
      if (v) next.set(ch, v);
      else next.delete(ch);
    }
    for (const n of next.values()) left += n;
    return { pool: next, left };
  }

  function dictKey(src, icase, daku) {
    return src + "|" + (icase ? "i" : "") + (daku ? "d" : "");
  }

  async function loadRaw(src) {
    if (cache[src]) return cache[src];
    status.textContent = "辞書を読み込み中…";
    const r = await fetch(FILES[src]);
    const data = await r.json();
    cache[src] = data;
    return data;
  }

  const prepared = {};

  async function prepare(src, icase, daku) {
    const key = dictKey(src, icase, daku);
    if (prepared[key]) return prepared[key];
    const raw = await loadRaw(src);
    const bySig = new Map();
    const entries = [];
    const seen = new Set();
    for (const w0 of raw) {
      const w = normalize(w0, src, icase, daku);
      if (!w || seen.has(w)) continue;
      seen.add(w);
      const sig = sigOf(w);
      const list = bySig.get(sig);
      if (list) list.push(w);
      else bySig.set(sig, [w]);
      entries.push({ w, n: w.length, need: countsOf(w) });
    }
    entries.sort((a, b) => b.n - a.n || (a.w < b.w ? -1 : 1));
    prepared[key] = { bySig, entries, size: seen.size };
    return prepared[key];
  }

  function showHits(list, phrase) {
    hits.innerHTML = "";
    const frag = document.createDocumentFragment();
    list.forEach((w) => {
      const s = document.createElement("span");
      s.textContent = w;
      if (phrase) s.className = "phrase";
      s.addEventListener("click", () => navigator.clipboard.writeText(w));
      frag.appendChild(s);
    });
    hits.appendChild(frag);
  }

  function options() {
    const src = document.getElementById("src").value;
    const icase = document.getElementById("icase").checked;
    const daku = document.getElementById("daku").checked;
    const minlen = Math.max(1, +document.getElementById("minlen").value || 2);
    const limit = Math.max(10, Math.min(5000, +document.getElementById("limit").value || 1000));
    return { src, icase, daku, minlen, limit };
  }

  async function readyPool() {
    err.textContent = "";
    hits.innerHTML = "";
    abort = false;
    const opt = options();
    const poolStr = normalize(lettersEl.value, opt.src, opt.icase, opt.daku);
    if (!poolStr) {
      err.textContent = "文字を入力してください";
      return null;
    }
    normEl.textContent = `対象文字 ${poolStr.length}：${poolStr}`;
    let dict;
    try {
      dict = await prepare(opt.src, opt.icase, opt.daku);
    } catch (e) {
      err.textContent = "辞書の読み込みに失敗しました";
      status.textContent = "";
      return null;
    }
    return { opt, poolStr, dict, pool: countsOf(poolStr) };
  }

  async function findOne() {
    const ctx = await readyPool();
    if (!ctx) return;
    const { opt, poolStr, dict } = ctx;
    const list = (dict.bySig.get(sigOf(poolStr)) || []).filter((w) => w.length >= opt.minlen);
    status.textContent = list.length
      ? `完全一致 ${list.length} 件 ／ 辞書 ${dict.size} 語`
      : `完全一致なし ／ 辞書 ${dict.size} 語`;
    showHits(list, false);
  }

  async function findSub() {
    const ctx = await readyPool();
    if (!ctx) return;
    const { opt, dict, pool } = ctx;
    const found = [];
    for (const e of dict.entries) {
      if (e.n < opt.minlen) continue;
      if (!fits(e.need, pool)) continue;
      found.push(e.w);
      if (found.length >= opt.limit) break;
    }
    found.sort((a, b) => b.length - a.length || (a < b ? -1 : 1));
    const extra = found.length >= opt.limit;
    status.textContent = extra
      ? `部分一致 ${opt.limit}+ 件（表示 ${found.length}）／ 辞書 ${dict.size} 語`
      : `部分一致 ${found.length} 件 ／ 辞書 ${dict.size} 語`;
    showHits(found, false);
  }

  function findMulti() {
    readyPool().then((ctx) => {
      if (!ctx) return;
      const { opt, poolStr, dict, pool } = ctx;
      if (poolStr.length > 28) {
        err.textContent = "複数語は 28 文字までです。含まれる単語を使ってください。";
        status.textContent = "";
        return;
      }
      const cands = dict.entries.filter((e) => e.n >= opt.minlen && e.n <= poolStr.length && fits(e.need, pool));
      if (!cands.length) {
        status.textContent = `使える語がありません ／ 辞書 ${dict.size} 語`;
        return;
      }
      status.textContent = "計算中…";
      document.getElementById("stop").hidden = false;
      abort = false;
      const t0 = performance.now();
      const out = [];
      const path = [];
      let visits = 0;
      const maxVisits = 4e5;
      const timeMs = 8000;

      function search(remain, left, start) {
        if (abort) return;
        visits++;
        if (visits > maxVisits || performance.now() - t0 > timeMs) return;
        if (out.length >= opt.limit) return;
        if (!left) {
          out.push(path.join(" "));
          return;
        }
        if (left < opt.minlen) return;
        for (let i = start; i < cands.length; i++) {
          const e = cands[i];
          if (e.n > left) continue;
          if (!fits(e.need, remain)) continue;
          const next = take(remain, e.need);
          path.push(e.w);
          search(next.pool, next.left, i);
          path.pop();
          if (abort || out.length >= opt.limit || visits > maxVisits || performance.now() - t0 > timeMs) return;
        }
      }

      setTimeout(() => {
        search(pool, poolStr.length, 0);
        document.getElementById("stop").hidden = true;
        if (abort) {
          status.textContent = `中止（${out.length} 件）`;
          showHits(out, true);
          return;
        }
        const trunc = visits > maxVisits || performance.now() - t0 > timeMs || out.length >= opt.limit;
        status.textContent = trunc
          ? `複数語 ${out.length}${out.length >= opt.limit ? "+" : ""} 件（打ち切り ${Math.round(performance.now() - t0)} ms、候補 ${cands.length}）`
          : `複数語 ${out.length} 件（${Math.round(performance.now() - t0)} ms、候補 ${cands.length}）`;
        showHits(out, true);
      }, 20);
    });
  }

  document.getElementById("one").addEventListener("click", findOne);
  document.getElementById("multi").addEventListener("click", findMulti);
  document.getElementById("sub").addEventListener("click", findSub);
  document.getElementById("stop").addEventListener("click", () => {
    abort = true;
  });
  lettersEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") findOne();
  });
})();
