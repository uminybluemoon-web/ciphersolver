(() => {
  const MAX_SIZE = 12;
  const MAX_PIECES = 15;
  const PIECE_EDIT = 8;
  const COLORS = [
    "#c44536", "#2f6f4e", "#3b5bdb", "#c9a227", "#6b4c9a",
    "#d46a1e", "#1d7a8c", "#8b3d2f", "#4a7c2a", "#5c4d3c",
    "#b03a6d", "#2c5f7c", "#7a5c12", "#3d6b5a", "#9a3b3b",
  ];

  const boardEl = document.getElementById("board-grid");
  const pieceEl = document.getElementById("piece-grid");
  const listEl = document.getElementById("piece-list");
  const solsEl = document.getElementById("sols");
  const status = document.getElementById("status");
  const boardStat = document.getElementById("board-stat");
  const sizeLab = document.getElementById("board-size-lab");

  let size = 8;
  let board = [];
  let paint = [];
  let pieces = [];
  let painting = null;
  let abort = false;
  let selected = null;

  function emptyBoard(n, on) {
    return Array.from({ length: n }, () =>
      Array.from({ length: n }, () => ({ on: !!on, ch: "" }))
    );
  }
  function emptyPaint(n) {
    return Array.from({ length: n }, () =>
      Array.from({ length: n }, () => ({ on: false, n: 0 }))
    );
  }

  function cellsOfBoard() {
    const out = [];
    for (let r = 0; r < board.length; r++) {
      for (let c = 0; c < board[r].length; c++) {
        if (board[r][c].on) out.push([r, c]);
      }
    }
    return out;
  }

  function cellsOfPaint() {
    const out = [];
    for (let r = 0; r < paint.length; r++) {
      for (let c = 0; c < paint[r].length; c++) {
        if (paint[r][c].on) out.push({ r, c, n: paint[r][c].n || 0 });
      }
    }
    return out;
  }

  function normalize(cells) {
    if (!cells.length) return [];
    const mr = Math.min(...cells.map((p) => p.r));
    const mc = Math.min(...cells.map((p) => p.c));
    return cells
      .map((p) => ({ r: p.r - mr, c: p.c - mc, n: p.n || 0 }))
      .sort((a, b) => a.r - b.r || a.c - b.c);
  }

  function keyOf(cells) {
    return normalize(cells).map((p) => p.r + "," + p.c).join(";");
  }

  function rotate(cells) {
    return cells.map((p) => ({ r: p.c, c: -p.r, n: p.n || 0 }));
  }

  function flipH(cells) {
    return cells.map((p) => ({ r: p.r, c: -p.c, n: p.n || 0 }));
  }

  function orientations(cells, rot, fl) {
    const seen = new Set();
    const out = [];
    let cur = cells.slice();
    const push = (x) => {
      const nrm = normalize(x);
      const k = keyOf(nrm);
      if (!seen.has(k)) {
        seen.add(k);
        out.push(nrm);
      }
    };
    const turns = rot ? 4 : 1;
    for (let t = 0; t < turns; t++) {
      push(cur);
      if (fl) push(flipH(cur));
      cur = rotate(cur);
    }
    return out;
  }

  function connected(cells) {
    if (!cells.length) return false;
    const set = new Set(cells.map((p) => p.r + "," + p.c));
    const q = [cells[0]];
    const seen = new Set([cells[0].r + "," + cells[0].c]);
    while (q.length) {
      const p = q.pop();
      for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const k = p.r + dr + "," + (p.c + dc);
        if (set.has(k) && !seen.has(k)) {
          seen.add(k);
          q.push({ r: p.r + dr, c: p.c + dc });
        }
      }
    }
    return seen.size === cells.length;
  }

  function cellLabel(kind, cell) {
    if (!cell.on) return "";
    if (kind === "board") return cell.ch || "";
    return cell.n ? String(cell.n) : "";
  }

  function renderGrid(el, grid, kind) {
    const n = grid.length;
    el.style.gridTemplateColumns = `repeat(${n}, 28px)`;
    el.innerHTML = "";
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "cell" + (grid[r][c].on ? " on" : "");
        if (selected && selected.el === el && selected.r === r && selected.c === c) b.classList.add("sel");
        b.dataset.r = String(r);
        b.dataset.c = String(c);
        b.textContent = cellLabel(kind, grid[r][c]);
        el.appendChild(b);
      }
    }
  }

  function paintBoard(r, c, on) {
    if (r < 0 || c < 0 || r >= board.length || c >= board.length) return;
    board[r][c].on = on;
    if (!on) board[r][c].ch = "";
    const btn = boardEl.querySelector(`[data-r="${r}"][data-c="${c}"]`);
    if (btn) {
      btn.classList.toggle("on", on);
      btn.textContent = cellLabel("board", board[r][c]);
    }
  }

  function paintPiece(r, c, on) {
    if (r < 0 || c < 0 || r >= paint.length || c >= paint.length) return;
    paint[r][c].on = on;
    if (!on) paint[r][c].n = 0;
    const btn = pieceEl.querySelector(`[data-r="${r}"][data-c="${c}"]`);
    if (btn) {
      btn.classList.toggle("on", on);
      btn.textContent = cellLabel("piece", paint[r][c]);
    }
  }

  function setSel(el, r, c) {
    selected = { el, r, c };
    document.querySelectorAll(".cell.sel").forEach((x) => x.classList.remove("sel"));
    const btn = el.querySelector(`[data-r="${r}"][data-c="${c}"]`);
    if (btn) btn.classList.add("sel");
  }

  function bindPaint(el, isBoard) {
    el.addEventListener("pointerdown", (e) => {
      const t = e.target.closest(".cell");
      if (!t) return;
      e.preventDefault();
      el.setPointerCapture(e.pointerId);
      const r = +t.dataset.r;
      const c = +t.dataset.c;
      setSel(el, r, c);
      if (isBoard) {
        painting = !board[r][c].on;
        paintBoard(r, c, painting);
        updateBoardStat();
      } else {
        painting = !paint[r][c].on;
        paintPiece(r, c, painting);
      }
    });
    el.addEventListener("pointermove", (e) => {
      if (painting === null) return;
      const t = document.elementFromPoint(e.clientX, e.clientY);
      const cell = t && t.closest ? t.closest(".cell") : null;
      if (!cell || !el.contains(cell)) return;
      const r = +cell.dataset.r;
      const c = +cell.dataset.c;
      if (isBoard) {
        paintBoard(r, c, painting);
        updateBoardStat();
      } else paintPiece(r, c, painting);
    });
    const end = () => {
      painting = null;
    };
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);
  }

  function updateBoardStat() {
    const n = cellsOfBoard().length;
    const letters = cellsOfBoard().filter(([r, c]) => board[r][c].ch).length;
    boardStat.textContent = `サイズ ${size}　有効マス ${n}` + (letters ? `　文字 ${letters}` : "") + "　（マスを選んで文字キー）";
    sizeLab.textContent = String(size);
  }

  function miniSvg(cells, color, cellPx) {
    const nrm = normalize(cells);
    const h = nrm.length ? Math.max(...nrm.map((p) => p.r)) + 1 : 1;
    const w = nrm.length ? Math.max(...nrm.map((p) => p.c)) + 1 : 1;
    const s = cellPx || 16;
    let body = "";
    nrm.forEach((p) => {
      body += `<rect x="${p.c * s + 0.5}" y="${p.r * s + 0.5}" width="${s - 1}" height="${s - 1}" rx="2" fill="${color}" />`;
      if (p.n) {
        body += `<text x="${p.c * s + s / 2}" y="${p.r * s + s / 2 + 1}" text-anchor="middle" dominant-baseline="middle" fill="#fffdf8" font-size="${Math.max(9, s - 6)}" font-family="sans-serif">${p.n}</text>`;
      }
    });
    return `<svg width="${w * s}" height="${h * s}" viewBox="0 0 ${w * s} ${h * s}">${body}</svg>`;
  }

  function renderPieces() {
    listEl.innerHTML = "";
    pieces.forEach((p, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "mini";
      b.title = "クリックで削除";
      b.innerHTML = miniSvg(p, COLORS[i % COLORS.length], 16);
      b.addEventListener("click", () => {
        pieces.splice(i, 1);
        renderPieces();
      });
      listEl.appendChild(b);
    });
  }

  function renderAll() {
    renderGrid(boardEl, board, "board");
    renderGrid(pieceEl, paint, "piece");
    updateBoardStat();
  }

  function resizeBoard(n) {
    n = Math.max(2, Math.min(MAX_SIZE, n));
    const next = emptyBoard(n, false);
    for (let r = 0; r < Math.min(n, board.length); r++) {
      for (let c = 0; c < Math.min(n, board.length); c++) next[r][c] = { ...board[r][c] };
    }
    size = n;
    board = next;
    selected = null;
    renderAll();
  }

  function fillRect(h, w) {
    board = emptyBoard(size, false);
    for (let r = 0; r < Math.min(h, size); r++) {
      for (let c = 0; c < Math.min(w, size); c++) board[r][c].on = true;
    }
    selected = null;
    renderAll();
  }

  function shape(rows, nums) {
    const cells = [];
    rows.forEach((line, r) => {
      [...line].forEach((ch, c) => {
        if (ch === "#") {
          const n = nums && nums[r] && nums[r][c] ? +nums[r][c] || 0 : 0;
          cells.push({ r, c, n });
        }
      });
    });
    return normalize(cells);
  }

  const PENTOMINOES = {
    F: shape([".##", "##.", ".#."]),
    I: shape(["#####"]),
    L: shape(["#", "#", "#", "##"]),
    N: shape([".#", ".#", "##", "#."]),
    P: shape(["##", "##", "#."]),
    T: shape(["###", ".#.", ".#."]),
    U: shape(["#.#", "###"]),
    V: shape(["#..", "#..", "###"]),
    W: shape(["#..", "##.", ".##"]),
    X: shape([".#.", "###", ".#."]),
    Y: shape(["..#.", "####"]),
    Z: shape(["##.", ".#.", ".##"]),
  };

  function loadSampleSmall() {
    size = 8;
    fillRect(3, 4);
    pieces = [
      shape(["#", "#", "#"]),
      shape(["#", "#", "#"]),
      shape(["#", "#", "#"]),
      shape(["#", "#", "#"]),
    ];
    renderPieces();
    status.textContent = "4×3 の盤に I トリオミノ 4 個を入れました。計算開始を押してください。";
  }

  function loadPentomino() {
    size = 10;
    board = emptyBoard(size, false);
    for (let r = 0; r < 6; r++) for (let c = 0; c < 10; c++) board[r][c].on = true;
    selected = null;
    renderAll();
    pieces = Object.values(PENTOMINOES);
    renderPieces();
    status.textContent = "6×10 にペントミノ12種を入れました。解は2339通りあります（表示は一部）。";
  }

  function loadPickSample() {
    size = 8;
    fillRect(2, 3);
    const letters = ["あいう", "えおか"];
    letters.forEach((line, r) => {
      [...line].forEach((ch, c) => {
        board[r][c].on = true;
        board[r][c].ch = ch;
      });
    });
    renderAll();
    pieces = [
      shape(["##", "#."], ["12", "3."]),
      shape(["#.", "##"], ["1.", "23"]),
    ];
    renderPieces();
    status.textContent = "2×3 に文字を置き、数字付きピース 2 個です。解の下に拾った文字が出ます。";
  }

  function boardMap() {
    const cells = cellsOfBoard();
    const idx = new Map();
    cells.forEach((p, i) => idx.set(p[0] + "," + p[1], i));
    return { cells, idx };
  }

  function placementsFor(piece, rot, fl, idx) {
    const orients = orientations(piece, rot, fl);
    const out = [];
    orients.forEach((ori) => {
      const h = Math.max(...ori.map((p) => p.r));
      const w = Math.max(...ori.map((p) => p.c));
      for (let r = 0; r < size - h; r++) {
        for (let c = 0; c < size - w; c++) {
          const mapped = [];
          let ok = true;
          for (const p of ori) {
            const br = r + p.r;
            const bc = c + p.c;
            const id = idx.get(br + "," + bc);
            if (id == null) {
              ok = false;
              break;
            }
            mapped.push({ id, n: p.n || 0, r: br, c: bc });
          }
          if (ok) out.push(mapped);
        }
      }
    });
    return out;
  }

  function pickText(mapped) {
    const tagged = mapped.filter((p) => p.n > 0).sort((a, b) => a.n - b.n || a.r - b.r || a.c - b.c);
    if (!tagged.length) return "";
    return tagged.map((p) => (board[p.r][p.c].ch || "・")).join("");
  }

  function dlx(rows, nPrimary, nExtra, limits) {
    const nCols = nPrimary + nExtra;
    const root = { l: null, r: null };
    root.l = root.r = root;
    const col = [];
    for (let i = 0; i < nCols; i++) {
      const c = { u: null, d: null, l: null, r: null, size: 0, id: i };
      c.u = c.d = c;
      c.l = root.l;
      c.r = root;
      root.l.r = c;
      root.l = c;
      col[i] = c;
    }
    rows.forEach((cols, ri) => {
      let first = null;
      cols.forEach((ci) => {
        const c = col[ci];
        const n = { u: c.u, d: c, l: null, r: null, col: c, row: ri };
        c.u.d = n;
        c.u = n;
        c.size++;
        if (!first) {
          first = n;
          n.l = n.r = n;
        } else {
          n.l = first.l;
          n.r = first;
          first.l.r = n;
          first.l = n;
        }
      });
    });

    function cover(c) {
      c.r.l = c.l;
      c.l.r = c.r;
      for (let i = c.d; i !== c; i = i.d) {
        for (let j = i.r; j !== i; j = j.r) {
          j.d.u = j.u;
          j.u.d = j.d;
          j.col.size--;
        }
      }
    }
    function uncover(c) {
      for (let i = c.u; i !== c; i = i.u) {
        for (let j = i.l; j !== i; j = j.l) {
          j.col.size++;
          j.d.u = j;
          j.u.d = j;
        }
      }
      c.r.l = c;
      c.l.r = c;
    }

    const solRows = [];
    const solutions = [];
    let visits = 0;
    const t0 = performance.now();

    function choose() {
      let best = null;
      for (let c = root.r; c !== root; c = c.r) {
        if (c.id >= nPrimary) continue;
        if (!best || c.size < best.size) best = c;
      }
      return best;
    }

    function search() {
      if (abort) return;
      visits++;
      if (visits > limits.maxVisits) return;
      if (performance.now() - t0 > limits.timeMs) return;
      if (solutions.length >= limits.maxCount && limits.stopAtMax) return;
      const c = choose();
      if (!c) {
        if (solutions.length < limits.maxStore) solutions.push(solRows.slice());
        else solutions.push(null);
        return;
      }
      if (c.size === 0) return;
      cover(c);
      for (let r = c.d; r !== c; r = r.d) {
        solRows.push(r.row);
        for (let j = r.r; j !== r; j = j.r) cover(j.col);
        search();
        for (let j = r.l; j !== r; j = j.l) uncover(j.col);
        solRows.pop();
        if (abort) return;
        if (visits > limits.maxVisits) return;
        if (performance.now() - t0 > limits.timeMs) return;
        if (solutions.length >= limits.maxCount && limits.stopAtMax) return;
      }
      uncover(c);
    }

    search();
    return {
      solutions: solutions.filter(Boolean),
      count: solutions.length,
      truncated: visits > limits.maxVisits || performance.now() - t0 > limits.timeMs,
      ms: performance.now() - t0,
    };
  }

  function solve() {
    abort = false;
    solsEl.innerHTML = "";
    const { cells, idx } = boardMap();
    if (!cells.length) {
      status.textContent = "盤面のマスをオンにしてください。";
      return;
    }
    if (!pieces.length) {
      status.textContent = "ピースを追加してください。";
      return;
    }
    const rot = document.getElementById("opt-rot").checked;
    const fl = document.getElementById("opt-flip").checked;
    const subset = document.getElementById("opt-subset").checked;
    const sizes = pieces.map((p) => p.length);
    const sum = sizes.reduce((a, b) => a + b, 0);
    if (!subset && sum !== cells.length) {
      status.textContent = `マス数 ${cells.length} とピース合計 ${sum} が一致しません。「一部のピースを使う」をオンにするか、形を直してください。`;
      return;
    }
    if (subset && Math.min(...sizes) > cells.length) {
      status.textContent = "どのピースも盤に入りません。";
      return;
    }

    const rowMeta = [];
    const rows = [];
    const nCells = cells.length;
    pieces.forEach((piece, pi) => {
      const places = placementsFor(piece, rot, fl, idx);
      places.forEach((mapped) => {
        const cols = mapped.map((p) => p.id);
        cols.push(nCells + pi);
        rows.push(cols);
        rowMeta.push({ pi, mapped });
      });
    });
    if (!rows.length) {
      status.textContent = "置ける場所がありません。回転・反転を許すか、形を確認してください。";
      return;
    }

    status.textContent = "計算中…";
    document.getElementById("stop").hidden = false;
    const limits = { maxCount: 2000, maxStore: 48, maxVisits: 2e6, timeMs: 8000, stopAtMax: true };
    const nPrimary = subset ? nCells : nCells + pieces.length;
    const nExtra = subset ? pieces.length : 0;

    setTimeout(() => {
      const res = dlx(rows, nPrimary, nExtra, limits);
      document.getElementById("stop").hidden = true;
      if (abort) {
        status.textContent = "中止しました。";
        return;
      }
      if (!res.count) {
        status.textContent = res.truncated
          ? "制限時間内に解が見つかりませんでした。"
          : "解なし。";
        return;
      }
      const extra = res.truncated || res.count >= limits.maxCount;
      status.textContent = extra
        ? `解 ${res.count}+ 件（表示 ${res.solutions.length}、${Math.round(res.ms)} ms）`
        : `解 ${res.count} 件（${Math.round(res.ms)} ms）`;
      res.solutions.forEach((rowIds) => {
        const colorAt = Array(nCells).fill("");
        const parts = [];
        const allMapped = [];
        rowIds
          .map((ri) => rowMeta[ri])
          .sort((a, b) => a.pi - b.pi)
          .forEach((m) => {
            m.mapped.forEach((p) => {
              colorAt[p.id] = COLORS[m.pi % COLORS.length];
            });
            const t = pickText(m.mapped);
            if (t) parts.push(t);
            allMapped.push(...m.mapped);
          });
        const byNum = pickText(allMapped);
        const byPiece = parts.join("");
        const maxR = Math.max(...cells.map((p) => p[0]));
        const maxC = Math.max(...cells.map((p) => p[1]));
        const s = 18;
        let body = "";
        cells.forEach(([r, c], i) => {
          body += `<rect x="${c * s + 0.5}" y="${r * s + 0.5}" width="${s - 1}" height="${s - 1}" rx="2" fill="${colorAt[i] || "#efe8d8"}" stroke="#d9d0c0" />`;
          const ch = board[r][c].ch;
          if (ch) {
            body += `<text x="${c * s + s / 2}" y="${r * s + s / 2 + 1}" text-anchor="middle" dominant-baseline="middle" fill="#1c1914" font-size="11" font-family="sans-serif">${ch}</text>`;
          }
        });
        const card = document.createElement("div");
        card.className = "sol-card";
        const pickLine = byPiece || byNum;
        const sub = byPiece && byNum && byPiece !== byNum ? `数字順 ${byNum}` : "";
        card.innerHTML =
          `<svg width="${(maxC + 1) * s}" height="${(maxR + 1) * s}">${body}</svg>` +
          (pickLine
            ? `<div class="sol-pick">${pickLine}${sub ? `<small>${sub}</small>` : ""}</div>`
            : "");
        solsEl.appendChild(card);
      });
    }, 20);
  }

  board = emptyBoard(size, false);
  paint = emptyPaint(PIECE_EDIT);
  bindPaint(boardEl, true);
  bindPaint(pieceEl, false);
  fillRect(3, 4);
  loadSampleSmall();

  document.addEventListener("keydown", (e) => {
    if (!selected) return;
    if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;
    const { el, r, c } = selected;
    if (el === boardEl) {
      if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        board[r][c].ch = "";
        renderGrid(boardEl, board, "board");
        setSel(boardEl, r, c);
        updateBoardStat();
        return;
      }
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        board[r][c].on = true;
        board[r][c].ch = e.key;
        renderGrid(boardEl, board, "board");
        setSel(boardEl, r, c);
        updateBoardStat();
      }
      return;
    }
    if (el === pieceEl) {
      if (e.key >= "1" && e.key <= "9") {
        e.preventDefault();
        paint[r][c].on = true;
        paint[r][c].n = +e.key;
        renderGrid(pieceEl, paint, "piece");
        setSel(pieceEl, r, c);
        return;
      }
      if (e.key === "0" || e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        paint[r][c].n = 0;
        renderGrid(pieceEl, paint, "piece");
        setSel(pieceEl, r, c);
      }
    }
  });

  document.getElementById("board-minus").addEventListener("click", () => resizeBoard(size - 1));
  document.getElementById("board-plus").addEventListener("click", () => resizeBoard(size + 1));
  document.getElementById("board-fill").addEventListener("click", () => fillRect(size, size));
  document.getElementById("board-clear").addEventListener("click", () => {
    board = emptyBoard(size, false);
    selected = null;
    renderAll();
  });
  document.getElementById("piece-clear").addEventListener("click", () => {
    paint = emptyPaint(PIECE_EDIT);
    selected = null;
    renderGrid(pieceEl, paint, "piece");
  });
  document.getElementById("piece-add").addEventListener("click", () => {
    const cells = normalize(cellsOfPaint());
    if (!cells.length) {
      status.textContent = "ピースのマスを描いてください。";
      return;
    }
    if (!connected(cells)) {
      status.textContent = "ピースは辺でつながっている必要があります。";
      return;
    }
    if (pieces.length >= MAX_PIECES) {
      status.textContent = `ピースは ${MAX_PIECES} 個までです。`;
      return;
    }
    pieces.push(cells);
    paint = emptyPaint(PIECE_EDIT);
    selected = null;
    renderGrid(pieceEl, paint, "piece");
    renderPieces();
    status.textContent = `ピース ${pieces.length} 個`;
  });
  document.getElementById("sample").addEventListener("click", loadSampleSmall);
  document.getElementById("sample-pent").addEventListener("click", loadPentomino);
  document.getElementById("sample-pick").addEventListener("click", loadPickSample);
  document.getElementById("solve").addEventListener("click", solve);
  document.getElementById("stop").addEventListener("click", () => {
    abort = true;
  });
})();
