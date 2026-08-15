(() => {
  const MAX = 15;
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
  };

  const gridEl = document.getElementById("grid");
  const charInp = document.getElementById("cell-char");
  const numInp = document.getElementById("cell-num");
  const wordsEl = document.getElementById("words");
  const status = document.getElementById("status");
  const solsEl = document.getElementById("sols");
  const boardStat = document.getElementById("board-stat");
  const slotStat = document.getElementById("slot-stat");
  const sizeLab = document.getElementById("size-lab");

  let size = 7;
  let grid = [];
  let selected = null;
  let painting = null;
  let abort = false;
  let composing = false;

  function emptyGrid(n, on) {
    return Array.from({ length: n }, () =>
        Array.from({ length: n }, () => ({ on: !!on, ch: "", n: 0 }))
    );
  }

  function foldChar(ch, icase, daku) {
    let x = ch;
    if (icase) x = x.toLowerCase();
    if (daku && DAKU[x]) x = DAKU[x];
    if (daku && DAKU[ch]) x = icase ? DAKU[ch].toLowerCase() : DAKU[ch];
    return x;
  }

  function foldWord(w, icase, daku) {
    return [...w].map((ch) => foldChar(ch, icase, daku)).join("");
  }

  function extractSlots() {
    const slots = [];
    const addRun = (cells, dir) => {
      if (cells.length >= 2) slots.push({ dir, cells });
    };
    for (let r = 0; r < size; r++) {
      let run = [];
      for (let c = 0; c <= size; c++) {
        if (c < size && grid[r][c].on) run.push({ r, c });
        else {
          addRun(run, "横");
          run = [];
        }
      }
    }
    for (let c = 0; c < size; c++) {
      let run = [];
      for (let r = 0; r <= size; r++) {
        if (r < size && grid[r][c].on) run.push({ r, c });
        else {
          addRun(run, "縦");
          run = [];
        }
      }
    }
    return slots;
  }

  function parseWords() {
    return wordsEl.value
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  function renderGrid() {
    gridEl.style.gridTemplateColumns = `repeat(${size}, 28px)`;
    gridEl.innerHTML = "";
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "cell" + (grid[r][c].on ? " on" : "");
        if (selected && selected.r === r && selected.c === c) b.classList.add("sel");
        b.dataset.r = String(r);
        b.dataset.c = String(c);
        fillCell(b, grid[r][c]);
        gridEl.appendChild(b);
      }
    }
    updateStats();
    syncCharInput(false);
  }

  function updateStats() {
    let white = 0;
    for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (grid[r][c].on) white++;
    const slots = extractSlots();
    const lens = {};
    slots.forEach((s) => {
      lens[s.cells.length] = (lens[s.cells.length] || 0) + 1;
    });
    const slotTxt = Object.keys(lens)
      .sort((a, b) => a - b)
      .map((k) => `${k}文字×${lens[k]}`)
      .join("　");
    sizeLab.textContent = String(size);
    boardStat.textContent = `サイズ ${size}　白マス ${white}　スロット ${slots.length}` + (slotTxt ? `（${slotTxt}）` : "") + "　（クリックで白黒）";
    const words = parseWords();
    const wlen = {};
    words.forEach((w) => {
      wlen[w.length] = (wlen[w.length] || 0) + 1;
    });
    const wtxt = Object.keys(wlen)
      .sort((a, b) => a - b)
      .map((k) => `${k}文字×${wlen[k]}`)
      .join("　");
    slotStat.textContent = words.length ? `単語 ${words.length}　${wtxt}` : "単語を1行ずつ入れてください";
  }

  function fillCell(btn, cell) {
    btn.replaceChildren();
    if (!cell.on) return;
    if (cell.ch) btn.append(cell.ch);
    else if (cell.n) btn.append(String(cell.n));
    if (cell.n && cell.ch) {
      const sm = document.createElement("small");
      sm.className = "pick-n";
      sm.textContent = String(cell.n);
      btn.appendChild(sm);
    }
  }

  function lastChar(raw) {
    return [...(raw || "")].filter((x) => x.trim()).pop() || "";
  }

  function syncCharInput(focus) {
    if (!selected || !grid[selected.r][selected.c].on) {
      charInp.value = "";
      if (numInp) numInp.value = "";
      charInp.disabled = true;
      if (numInp) numInp.disabled = true;
      return;
    }
    charInp.disabled = false;
    if (numInp) numInp.disabled = false;
    const cell = grid[selected.r][selected.c];
    if (!composing) charInp.value = cell.ch || "";
    if (numInp) numInp.value = cell.n ? String(cell.n) : "";
    if (focus) setTimeout(() => charInp.focus(), 0);
  }

  function refreshSelectedCell() {
    if (!selected) return;
    const { r, c } = selected;
    const btn = gridEl.querySelector(`[data-r="${r}"][data-c="${c}"]`);
    if (btn) fillCell(btn, grid[r][c]);
  }

  function applyChar(raw) {
    if (!selected) return;
    const { r, c } = selected;
    if (!grid[r][c].on) return;
    const t = (raw || "").trim();
    if (!t) {
      grid[r][c].ch = "";
    } else if (/^\d+$/.test(t)) {
      grid[r][c].n = Math.max(0, Math.min(99, +t));
      if (numInp) numInp.value = grid[r][c].n ? String(grid[r][c].n) : "";
    } else {
      grid[r][c].ch = lastChar(t);
    }
    refreshSelectedCell();
    if (!composing) charInp.value = grid[r][c].ch || "";
  }

  function applyNum(raw) {
    if (!selected) return;
    const { r, c } = selected;
    if (!grid[r][c].on) return;
    const t = (raw || "").trim();
    grid[r][c].n = /^\d+$/.test(t) ? Math.max(0, Math.min(99, +t)) : 0;
    if (numInp) numInp.value = grid[r][c].n ? String(grid[r][c].n) : "";
    refreshSelectedCell();
  }

  function setSel(r, c) {
    selected = { r, c };
    document.querySelectorAll(".cell.sel").forEach((x) => x.classList.remove("sel"));
    const btn = gridEl.querySelector(`[data-r="${r}"][data-c="${c}"]`);
    if (btn) btn.classList.add("sel");
    syncCharInput(true);
  }

  function paintCell(r, c, on) {
    if (r < 0 || c < 0 || r >= size || c >= size) return;
    grid[r][c].on = on;
    if (!on) {
      grid[r][c].ch = "";
      grid[r][c].n = 0;
    }
    const btn = gridEl.querySelector(`[data-r="${r}"][data-c="${c}"]`);
    if (btn) {
      btn.classList.toggle("on", on);
      fillCell(btn, grid[r][c]);
    }
  }

  gridEl.addEventListener("pointerdown", (e) => {
    const t = e.target.closest(".cell");
    if (!t) return;
    e.preventDefault();
    const r = +t.dataset.r;
    const c = +t.dataset.c;
    if (e.shiftKey) {
      painting = null;
      if (grid[r][c].on) setSel(r, c);
      return;
    }
    gridEl.setPointerCapture(e.pointerId);
    const next = !grid[r][c].on;
    painting = next;
    paintCell(r, c, next);
    if (next) setSel(r, c);
    else if (selected && selected.r === r && selected.c === c) {
      selected = null;
      document.querySelectorAll(".cell.sel").forEach((x) => x.classList.remove("sel"));
      syncCharInput(false);
    }
    updateStats();
  });
  gridEl.addEventListener("pointermove", (e) => {
    if (painting === null) return;
    const t = document.elementFromPoint(e.clientX, e.clientY);
    const cell = t && t.closest ? t.closest(".cell") : null;
    if (!cell || !gridEl.contains(cell)) return;
    const r = +cell.dataset.r;
    const c = +cell.dataset.c;
    paintCell(r, c, painting);
    if (!painting && selected && selected.r === r && selected.c === c) {
      selected = null;
      document.querySelectorAll(".cell.sel").forEach((x) => x.classList.remove("sel"));
      syncCharInput(false);
    }
    updateStats();
  });
  gridEl.addEventListener("pointerup", () => {
    painting = null;
  });
  gridEl.addEventListener("pointercancel", () => {
    painting = null;
  });

  grid = emptyGrid(size, false);
  loadSample();

  charInp.addEventListener("compositionstart", () => {
    composing = true;
  });
  charInp.addEventListener("compositionend", () => {
    composing = false;
    applyChar(charInp.value);
  });
  charInp.addEventListener("input", (e) => {
    if (composing || e.isComposing) return;
    applyChar(charInp.value);
  });
  charInp.addEventListener("keydown", (e) => {
    if (composing || e.isComposing) return;
    if (e.key === "Backspace" || e.key === "Delete") {
      e.preventDefault();
      applyChar("");
    }
  });
  numInp?.addEventListener("input", () => applyNum(numInp.value));
  numInp?.addEventListener("keydown", (e) => {
    if (e.key === "Backspace" || e.key === "Delete") {
      if (!numInp.value) {
        e.preventDefault();
        applyNum("");
      }
    }
  });
  document.addEventListener("keydown", (e) => {
    if (!selected) return;
    if (composing || e.isComposing || e.key === "Process") return;
    if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;
    if (e.key >= "1" && e.key <= "9") {
      e.preventDefault();
      applyNum(e.key);
    }
    if (e.key === "0" || e.key === "Backspace" || e.key === "Delete") {
      e.preventDefault();
      applyNum("");
    }
  });
  wordsEl.addEventListener("input", updateStats);

  function resize(n) {
    n = Math.max(3, Math.min(MAX, n));
    const next = emptyGrid(n, false);
    for (let r = 0; r < Math.min(n, grid.length); r++) {
      for (let c = 0; c < Math.min(n, grid.length); c++) next[r][c] = { ...grid[r][c] };
    }
    size = n;
    grid = next;
    selected = null;
    renderGrid();
  }

  function loadSample() {
    size = 5;
    grid = emptyGrid(5, false);
    const on = [
      [1, 1, 1, 0, 0],
      [1, 0, 1, 0, 0],
      [1, 1, 1, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
    ];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) grid[r][c].on = !!on[r][c];
    grid[0][0].n = 1;
    grid[0][1].n = 2;
    grid[0][2].n = 3;
    wordsEl.value = ["あさひ", "あおい", "ひかり", "いかり"].join("\n");
    selected = null;
    renderGrid();
    status.textContent = "3×3 のサンプルです。計算開始を押してください。";
  }

  function wordFits(slot, word, letters, icase, daku) {
    if (slot.cells.length !== word.length) return false;
    const fw = foldWord(word, icase, daku);
    for (let i = 0; i < word.length; i++) {
      const { r, c } = slot.cells[i];
      const key = r + "," + c;
      const have = letters[key];
      if (have && foldChar(have, icase, daku) !== fw[i]) return false;
      const preset = grid[r][c].ch;
      if (preset && foldChar(preset, icase, daku) !== fw[i]) return false;
    }
    return true;
  }

  function applyWord(slot, word, letters) {
    const undo = [];
    slot.cells.forEach((p, i) => {
      const key = p.r + "," + p.c;
      undo.push([key, letters[key]]);
      letters[key] = word[i];
    });
    return undo;
  }

  function revert(undo, letters) {
    undo.forEach(([k, v]) => {
      if (v == null) delete letters[k];
      else letters[k] = v;
    });
  }

  function solveSkel(slots, words, icase, daku, limits) {
    const used = words.map(() => false);
    const letters = {};
    const assign = Array(slots.length).fill(null);
    const sols = [];
    let visits = 0;
    const t0 = performance.now();

    function candidates(si) {
      const slot = slots[si];
      const out = [];
      words.forEach((w, wi) => {
        if (used[wi]) return;
        if (wordFits(slot, w, letters, icase, daku)) out.push(wi);
      });
      return out;
    }

    function search() {
      if (abort) return;
      visits++;
      if (visits > limits.maxVisits || performance.now() - t0 > limits.timeMs) return;
      if (sols.length >= limits.maxCount) return;
      if (assign.every((x) => x != null)) {
        sols.push({ letters: { ...letters }, assign: assign.slice() });
        return;
      }
      let best = -1;
      let bestCands = null;
      for (let si = 0; si < slots.length; si++) {
        if (assign[si] != null) continue;
        const cands = candidates(si);
        if (!cands.length) return;
        if (!bestCands || cands.length < bestCands.length) {
          best = si;
          bestCands = cands;
        }
      }
      for (const wi of bestCands) {
        used[wi] = true;
        assign[best] = wi;
        const undo = applyWord(slots[best], words[wi], letters);
        search();
        revert(undo, letters);
        assign[best] = null;
        used[wi] = false;
        if (abort || sols.length >= limits.maxCount) return;
        if (visits > limits.maxVisits || performance.now() - t0 > limits.timeMs) return;
      }
    }

    search();
    return {
      sols,
      count: sols.length,
      truncated: visits > limits.maxVisits || performance.now() - t0 > limits.timeMs,
      ms: performance.now() - t0,
    };
  }

  function pickText(letters) {
    const tagged = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (!grid[r][c].on || !grid[r][c].n) continue;
        tagged.push({
          n: grid[r][c].n,
          r,
          c,
          ch: letters[r + "," + c] || grid[r][c].ch || "・",
        });
      }
    }
    tagged.sort((a, b) => a.n - b.n || a.r - b.r || a.c - b.c);
    return tagged.map((p) => p.ch).join("");
  }

  function drawSol(letters) {
    const s = 22;
    let body = "";
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const on = grid[r][c].on;
        const fill = on ? "#fffdf8" : "#2a2722";
        body += `<rect x="${c * s + 0.5}" y="${r * s + 0.5}" width="${s - 1}" height="${s - 1}" rx="2" fill="${fill}" stroke="#d9d0c0" />`;
        const ch = letters[r + "," + c];
        if (on && ch) {
          body += `<text x="${c * s + s / 2}" y="${r * s + s / 2 + 1}" text-anchor="middle" dominant-baseline="middle" fill="#1c1914" font-size="13" font-family="sans-serif">${ch}</text>`;
        }
      }
    }
    return `<svg width="${size * s}" height="${size * s}">${body}</svg>`;
  }

  function solve() {
    abort = false;
    solsEl.innerHTML = "";
    const slots = extractSlots();
    const words = parseWords();
    if (!slots.length) {
      status.textContent = "2マス以上つながった白マスがありません。";
      return;
    }
    if (words.length !== slots.length) {
      status.textContent = `スロット ${slots.length} に対して単語が ${words.length} 語です。数を合わせてください。`;
      return;
    }
    const icase = document.getElementById("icase").checked;
    const daku = document.getElementById("daku").checked;
    const slens = slots.map((s) => s.cells.length).sort((a, b) => a - b).join(",");
    const wlens = words.map((w) => w.length).sort((a, b) => a - b).join(",");
    if (slens !== wlens) {
      status.textContent = "単語の長さの内訳がスロットと一致しません。";
      return;
    }
    status.textContent = "計算中…";
    document.getElementById("stop").hidden = false;
    setTimeout(() => {
      const res = solveSkel(slots, words, icase, daku, {
        maxCount: 40,
        maxVisits: 3e6,
        timeMs: 8000,
      });
      document.getElementById("stop").hidden = true;
      if (abort) {
        status.textContent = "中止しました。";
        return;
      }
      if (!res.sols.length) {
        status.textContent = res.truncated ? "制限時間内に解が見つかりませんでした。" : "解なし。";
        return;
      }
      status.textContent = res.truncated
        ? `解 ${res.count}+ 件（表示 ${res.sols.length}、${Math.round(res.ms)} ms）`
        : `解 ${res.count} 件（${Math.round(res.ms)} ms）`;
      res.sols.forEach((sol) => {
        const card = document.createElement("div");
        card.className = "sol-card";
        const lines = sol.assign.map((wi, si) => {
          if (wi == null) return "";
          const sl = slots[si];
          const p0 = sl.cells[0];
          return `${sl.dir}(${p0.r + 1},${p0.c + 1}) ${words[wi]}`;
        });
        const pick = pickText(sol.letters);
        const pickHtml = pick ? `<div class="sol-pick">${pick}<small>数字順</small></div>` : "";
        card.innerHTML = drawSol(sol.letters) + pickHtml + `<div class="sol-words">${lines.join("　")}</div>`;
        solsEl.appendChild(card);
      });
    }, 20);
  }

  document.getElementById("minus").addEventListener("click", () => resize(size - 1));
  document.getElementById("plus").addEventListener("click", () => resize(size + 1));
  document.getElementById("fill").addEventListener("click", () => {
    grid = emptyGrid(size, true);
    selected = null;
    renderGrid();
  });
  document.getElementById("clear-board").addEventListener("click", () => {
    grid = emptyGrid(size, false);
    selected = null;
    renderGrid();
  });
  document.getElementById("sample").addEventListener("click", loadSample);
  document.getElementById("solve").addEventListener("click", solve);
  document.getElementById("stop").addEventListener("click", () => {
    abort = true;
  });
})();
