(() => {
  const BASE3 = [
    [2, 7, 6],
    [9, 5, 1],
    [4, 3, 8],
  ];
  const MAX_STORE = 48;

  const numGrid = document.getElementById("num-grid");
  const chGrid = document.getElementById("ch-grid");
  const status = document.getElementById("status");
  const err = document.getElementById("err");
  const solsEl = document.getElementById("sols");
  const sizeEl = document.getElementById("size");
  const numInputs = [];
  const chInputs = [];
  let size = 3;

  function rot(g) {
    const n = g.length;
    const out = Array.from({ length: n }, () => Array(n));
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) out[c][n - 1 - r] = g[r][c];
    return out;
  }
  function flipH(g) {
    return g.map((row) => row.slice().reverse());
  }
  function squares3() {
    const out = [];
    const seen = new Set();
    let g = BASE3.map((r) => r.slice());
    for (let i = 0; i < 4; i++) {
      [g, flipH(g)].forEach((x) => {
        const k = x.flat().join(",");
        if (!seen.has(k)) {
          seen.add(k);
          out.push(x.map((r) => r.slice()));
        }
      });
      g = rot(g);
    }
    return out;
  }
  const SQUARES3 = squares3();

  function zenDigit(ch) {
    const i = "０１２３４５６７８９".indexOf(ch);
    return i >= 0 ? String(i) : ch;
  }

  function parseNum(raw, n) {
    const t = [...(raw || "")].map(zenDigit).filter((ch) => /\d/.test(ch)).join("");
    if (!t) return null;
    const v = +t;
    if (v < 1 || v > n * n) return null;
    return v;
  }

  function parseCh(raw) {
    return [...(raw || "")].filter((x) => x.trim()).pop() || "";
  }

  function magicSum(n) {
    return (n * (n * n + 1)) / 2;
  }

  function givenNums() {
    const g = [];
    for (let r = 0; r < size; r++) {
      g[r] = [];
      for (let c = 0; c < size; c++) g[r][c] = parseNum(numInputs[r * size + c].value, size);
    }
    return g;
  }

  function givenChars() {
    const g = [];
    for (let r = 0; r < size; r++) {
      g[r] = [];
      for (let c = 0; c < size; c++) g[r][c] = parseCh(chInputs[r * size + c].value);
    }
    return g;
  }

  function matches3(given, sq) {
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const n = given[r][c];
        if (n != null && sq[r][c] !== n) return false;
      }
    }
    return true;
  }

  function lineOk(vals, magic, used, extra) {
    let sum = 0;
    let empty = 0;
    for (const x of vals) {
      if (x == null) empty++;
      else sum += x;
    }
    if (empty === 0) return sum === magic;
    if (sum >= magic) return false;
    const remain = [];
    for (let i = 1; i <= extra; i++) {
      if (!used.has(i) && !vals.includes(i)) remain.push(i);
    }
    remain.sort((a, b) => a - b);
    if (remain.length < empty) return false;
    const minAdd = remain.slice(0, empty).reduce((s, x) => s + x, 0);
    const maxAdd = remain.slice(-empty).reduce((s, x) => s + x, 0);
    return sum + minAdd <= magic && sum + maxAdd >= magic;
  }

  function fits(grid, n, r, c, v, used, magic) {
    const N = n * n;
    const row = [];
    const col = [];
    for (let i = 0; i < n; i++) {
      row.push(i === c ? v : grid[r][i]);
      col.push(i === r ? v : grid[i][c]);
    }
    if (!lineOk(row, magic, used, N)) return false;
    if (!lineOk(col, magic, used, N)) return false;
    if (r === c) {
      const d = [];
      for (let i = 0; i < n; i++) d.push(i === r ? v : grid[i][i]);
      if (!lineOk(d, magic, used, N)) return false;
    }
    if (r + c === n - 1) {
      const d = [];
      for (let i = 0; i < n; i++) d.push(i === r ? v : grid[i][n - 1 - i]);
      if (!lineOk(d, magic, used, N)) return false;
    }
    return true;
  }

  function solveN(given, n, limits) {
    const N = n * n;
    const magic = magicSum(n);
    const grid = given.map((r) => r.slice());
    const used = new Set();
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (grid[r][c] != null) used.add(grid[r][c]);
      }
    }
    const cells = [];
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (grid[r][c] == null) cells.push([r, c]);
    const sols = [];
    let count = 0;
    let visits = 0;
    const t0 = performance.now();

    function search(i) {
      if (count >= limits.maxCount) return;
      if (visits > limits.maxVisits || performance.now() - t0 > limits.timeMs) return;
      visits++;
      if (i === cells.length) {
        count++;
        if (sols.length < limits.maxStore) sols.push(grid.map((r) => r.slice()));
        return;
      }
      const [r, c] = cells[i];
      for (let v = 1; v <= N; v++) {
        if (used.has(v)) continue;
        if (!fits(grid, n, r, c, v, used, magic)) continue;
        grid[r][c] = v;
        used.add(v);
        search(i + 1);
        used.delete(v);
        grid[r][c] = null;
        if (count >= limits.maxCount) return;
        if (visits > limits.maxVisits || performance.now() - t0 > limits.timeMs) return;
      }
    }

    search(0);
    return {
      sols,
      count,
      truncated: visits > limits.maxVisits || performance.now() - t0 > limits.timeMs || count >= limits.maxCount,
      ms: performance.now() - t0,
    };
  }

  function pickText(sq, letters) {
    const pos = [];
    const n = sq.length;
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) pos[sq[r][c]] = [r, c];
    let s = "";
    for (let k = 1; k <= n * n; k++) {
      const p = pos[k];
      s += p ? letters[p[0]][p[1]] || "・" : "・";
    }
    return s;
  }

  function buildGrid(el, inputs, kind) {
    el.style.gridTemplateColumns = `repeat(${size}, 44px)`;
    el.innerHTML = "";
    inputs.length = 0;
    for (let i = 0; i < size * size; i++) {
      const inp = document.createElement("input");
      inp.type = "text";
      inp.autocomplete = "off";
      inp.spellcheck = false;
      if (kind === "num") inp.inputMode = "numeric";
      else inp.lang = "ja";
      inp.addEventListener("input", (e) => {
        if (kind === "num") {
          const v = parseNum(inp.value, size);
          inp.value = v ? String(v) : [...inp.value].map(zenDigit).filter((ch) => /\d/.test(ch)).join("").slice(0, 2);
        } else if (!e.isComposing) {
          const ch = parseCh(inp.value);
          if (ch) inp.value = ch;
        }
      });
      if (kind === "ch") {
        inp.addEventListener("compositionend", () => {
          inp.value = parseCh(inp.value);
        });
      }
      inp.addEventListener("keydown", (e) => {
        if (e.key === "Enter") analyze();
      });
      el.appendChild(inp);
      inputs.push(inp);
    }
  }

  function showHits(hits, filled, extra) {
    solsEl.innerHTML = "";
    const letters = givenChars();
    const show = hits.slice(0, MAX_STORE);
    show.forEach((sq) => {
      const card = document.createElement("div");
      card.className = "sol-card";
      const grid = document.createElement("div");
      grid.className = "sol-grid";
      grid.style.gridTemplateColumns = `repeat(${size}, 26px)`;
      sq.flat().forEach((n) => {
        const s = document.createElement("span");
        s.textContent = String(n);
        grid.appendChild(s);
      });
      const pick = pickText(sq, letters);
      const p = document.createElement("div");
      p.className = "sol-pick";
      p.append(pick);
      const sm = document.createElement("small");
      sm.textContent = `1→${size * size} の文字拾い`;
      p.appendChild(sm);
      p.addEventListener("click", () => navigator.clipboard.writeText(pick));
      card.append(grid, p);
      solsEl.appendChild(card);
    });
    const more = extra || hits.length > MAX_STORE;
    status.textContent =
      (more ? `候補 ${hits.length}+ 件（表示 ${show.length}` : `候補 ${hits.length} 件（表示 ${show.length}`) +
      `、手がかり ${filled.length}）`;
  }

  function analyze() {
    err.textContent = "";
    solsEl.innerHTML = "";
    const given = givenNums();
    const filled = given.flat().filter((n) => n != null);
    const uniq = new Set(filled);
    if (uniq.size !== filled.length) {
      err.textContent = "同じ数字が重複しています";
      status.textContent = "";
      return;
    }
    if (filled.some((n) => n > size * size)) {
      err.textContent = `1〜${size * size} を入れてください`;
      return;
    }
    if (size === 3) {
      const hits = SQUARES3.filter((sq) => matches3(given, sq));
      if (!hits.length) {
        status.textContent = "条件に合う魔方陣はありません。";
        return;
      }
      showHits(hits, filled, false);
      if (!filled.length) status.textContent = "候補 8 件（数字なし＝すべて）";
      return;
    }
    status.textContent = "計算中…";
    setTimeout(() => {
      const res = solveN(given, 4, { maxStore: MAX_STORE, maxCount: 8000, maxVisits: 3e6, timeMs: 8000 });
      if (!res.count) {
        status.textContent = res.truncated ? "制限時間内に解が見つかりませんでした。" : "条件に合う魔方陣はありません。";
        return;
      }
      showHits(res.sols, filled, res.truncated || res.count >= 8000);
      if (res.truncated || res.count >= 8000) {
        status.textContent = `候補 ${res.count}+ 件（表示 ${res.sols.length}、${Math.round(res.ms)} ms）`;
      } else {
        status.textContent = `候補 ${res.count} 件（表示 ${Math.min(res.count, MAX_STORE)}、${Math.round(res.ms)} ms）`;
      }
    }, 20);
  }

  function updateHints() {
    const mag = magicSum(size);
    document.getElementById("num-hint").textContent = `1〜${size * size}。同じ数字は1回だけ。行・列・対角線の和は ${mag}。`;
    document.getElementById("ch-hint").textContent = `拾い用。1 があるマスの文字から ${size * size} まで順に並べます。`;
  }

  function resize(n) {
    size = n;
    buildGrid(numGrid, numInputs, "num");
    buildGrid(chGrid, chInputs, "ch");
    updateHints();
    solsEl.innerHTML = "";
    status.textContent = size === 3 ? "数字が空なら 8 通りすべてを出します。" : "4×4 は最大 7040 通り。手がかりがあると速いです。";
  }

  function sample() {
    numInputs.forEach((x) => {
      x.value = "";
    });
    chInputs.forEach((x) => {
      x.value = "";
    });
    if (size === 3) {
      numInputs[4].value = "5";
      "あいうえおかきくけ".split("").forEach((ch, i) => {
        chInputs[i].value = ch;
      });
    } else {
      numInputs[0].value = "16";
      numInputs[3].value = "13";
      numInputs[12].value = "4";
      numInputs[15].value = "1";
      "あいうえおかきくけこさしすせそた".split("").forEach((ch, i) => {
        if (chInputs[i]) chInputs[i].value = ch;
      });
    }
    analyze();
  }

  sizeEl.addEventListener("change", () => resize(+sizeEl.value));
  document.getElementById("go").addEventListener("click", analyze);
  document.getElementById("clear-num").addEventListener("click", () => {
    numInputs.forEach((x) => {
      x.value = "";
    });
    solsEl.innerHTML = "";
    status.textContent = "数字をクリアしました。";
  });
  document.getElementById("clear-ch").addEventListener("click", () => {
    chInputs.forEach((x) => {
      x.value = "";
    });
  });
  document.getElementById("sample").addEventListener("click", sample);
  resize(3);
})();
