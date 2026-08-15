(() => {
  const status = document.getElementById("status");
  const out = document.getElementById("out");
  const coin = document.getElementById("coin");
  const wlenEl = document.getElementById("wlen");
  const nconnEl = document.getElementById("nconn");
  const modeHint = document.getElementById("mode-hint");

  // 上 左 右 下
  const ids = ["n", "w", "e", "s"];
  const toward = { n: true, w: true, e: false, s: false };
  // true = 外周→中央（上なら「上＋中央」）

  const inputs = {};
  function cell(id, row, col) {
    const inp = document.createElement("input");
    inp.id = "c-" + id;
    inp.maxLength = 1;
    inp.placeholder = { n: "上", w: "左", e: "右", s: "下" }[id];
    inp.style.gridRow = String(row);
    inp.style.gridColumn = String(col);
    inputs[id] = inp;
    coin.appendChild(inp);
  }
  function arrowBtn(id, row, col, vert) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "arrow";
    b.dataset.id = id;
    b.style.gridRow = String(row);
    b.style.gridColumn = String(col);
    function label() {
      if (vert) b.textContent = toward[id] ? "↓" : "↑";
      else b.textContent = toward[id] ? (id === "w" ? "→" : "←") : id === "w" ? "←" : "→";
      // e: toward true would be toward center from right = ←
      if (id === "e") b.textContent = toward[id] ? "←" : "→";
      if (id === "w") b.textContent = toward[id] ? "→" : "←";
      if (id === "n") b.textContent = toward[id] ? "↓" : "↑";
      if (id === "s") b.textContent = toward[id] ? "↑" : "↓";
    }
    b.addEventListener("click", () => {
      toward[id] = !toward[id];
      label();
    });
    label();
    coin.appendChild(b);
    return b;
  }
  cell("n", 1, 3);
  arrowBtn("n", 2, 3, true);
  cell("w", 3, 1);
  arrowBtn("w", 3, 2, false);
  const center = document.createElement("div");
  center.className = "center";
  center.textContent = "？";
  center.style.gridRow = "3";
  center.style.gridColumn = "3";
  coin.appendChild(center);
  arrowBtn("e", 3, 4, false);
  cell("e", 3, 5);
  arrowBtn("s", 4, 3, true);
  cell("s", 5, 3);

  let dict2 = new Set();
  let dict3 = new Set();
  let after = {}; // first -> set of seconds
  let before = {}; // second -> set of firsts
  let mid3 = {}; // "first|last" -> [mids]

  function addMap(map, k, v) {
    if (!map[k]) map[k] = new Set();
    map[k].add(v);
  }

  fetch("jukugo.json")
    .then((r) => r.json())
    .then((d) => {
      dict2 = new Set(d.n2);
      dict3 = new Set(d.n3);
      for (const w of d.n2) {
        addMap(after, w[0], w[1]);
        addMap(before, w[1], w[0]);
      }
      for (const w of d.n3) {
        const k = w[0] + "|" + w[2];
        if (!mid3[k]) mid3[k] = [];
        mid3[k].push(w[1]);
      }
      status.textContent = `辞書 二字 ${d.n2.length} ／ 三字 ${d.n3.length}`;
    })
    .catch((e) => {
      status.textContent = "辞書の読み込みに失敗しました: " + e;
    });

  function activeIds() {
    const n = Math.max(1, Math.min(4, +nconnEl.value || 4));
    const wlen = +wlenEl.value;
    if (wlen === 3) {
      return n <= 1 ? ["w", "e"] : ["n", "s", "w", "e"];
    }
    return ["w", "e", "n", "s"].slice(0, n);
  }

  function updateHint() {
    const wlen = +wlenEl.value;
    nconnEl.max = wlen === 3 ? 2 : 4;
    nconnEl.min = 1;
    if (wlen === 3 && +nconnEl.value > 2) nconnEl.value = 2;
    const act = new Set(activeIds());
    ids.forEach((id) => {
      inputs[id].classList.toggle("arm-off", !act.has(id));
    });
    document.querySelectorAll(".arrow").forEach((b) => {
      b.classList.toggle("arm-off", !act.has(b.dataset.id));
    });
    modeHint.textContent =
      wlen === 2
        ? "連結の数 = 使う方向の数（2なら左右、3なら左右＋上、4なら四方向）。空欄は無視します。"
        : "3字モードは縦（上・中・下）と横（左・中・右）。連結1は横だけ、2は縦横両方。矢印で読み順を反転します。";
  }
  wlenEl.addEventListener("change", updateHint);
  nconnEl.addEventListener("input", updateHint);
  updateHint();

  function intersect(sets) {
    if (!sets.length) return new Set();
    let acc = new Set(sets[0]);
    for (let i = 1; i < sets.length; i++) {
      acc = new Set([...acc].filter((x) => sets[i].has(x)));
    }
    return acc;
  }

  function ch(id) {
    return (inputs[id].value || "").trim();
  }

  function solve2() {
    const act = activeIds();
    const sets = [];
    const used = [];
    for (const id of act) {
      const x = ch(id);
      if (!x) continue;
      used.push(id);
      const cand = toward[id] ? after[x] : before[x];
      sets.push(cand || new Set());
    }
    if (!sets.length) return { err: "漢字を1つ以上入れてください", sols: [] };
    return { sols: [...intersect(sets)], used, err: null };
  }

  function solve3() {
    const n = Math.max(1, Math.min(2, +nconnEl.value || 2));
    const sets = [];
    const horiz = () => {
      const L = ch("w");
      const R = ch("e");
      if (!L || !R) return null;
      const k = toward.w === toward.e
        ? null
        : toward.w
          ? L + "|" + R
          : R + "|" + L;
      // toward.w true: 左→中 so first=L; toward.e true: 右→中 so last should be... 
      // 3-char left to right: L + C + R when arrows 左→ 右→ wait
      // If 横を左から右に読む: 左 + 中 + 右. That's toward.w true (左→中) and toward.e false (中→右).
      // If reversed 右から左: 右 + 中 + 左. toward.w false, toward.e true.
      if (toward.w && !toward.e) return mid3[L + "|" + R] || [];
      if (!toward.w && toward.e) return mid3[R + "|" + L] || [];
      // both toward or both away: still a 3-char? 左→中←右 means L+C and R+C, not 3-char through.
      // For 3-char mode require opposite arrows on a line.
      return "bad";
    };
    const vert = () => {
      const T = ch("n");
      const B = ch("s");
      if (!T || !B) return null;
      if (toward.n && !toward.s) return mid3[T + "|" + B] || [];
      if (!toward.n && toward.s) return mid3[B + "|" + T] || [];
      return "bad";
    };
    const h = horiz();
    const v = vert();
    if (n === 1) {
      if (h === "bad") return { err: "横の矢印は逆向きにしてください（例: → ？ →）", sols: [] };
      if (!h) return { err: "左右の漢字を入れてください", sols: [] };
      return { sols: h, err: null };
    }
    if (h === "bad" || v === "bad") {
      return { err: "縦・横とも、一方が中央向き・反対が外向きになるように矢印を合わせてください", sols: [] };
    }
    if (!h || !v) return { err: "上下左右すべての漢字を入れてください", sols: [] };
    const setH = new Set(h);
    return { sols: v.filter((c) => setH.has(c)), err: null };
  }

  function wordsFor(c) {
    const wlen = +wlenEl.value;
    const parts = [];
    if (wlen === 2) {
      for (const id of activeIds()) {
        const x = ch(id);
        if (!x) continue;
        const w = toward[id] ? x + c : c + x;
        parts.push(w + (dict2.has(w) ? "" : "？"));
      }
    } else {
      const L = ch("w");
      const R = ch("e");
      const T = ch("n");
      const B = ch("s");
      if (L && R) {
        const w = toward.w && !toward.e ? L + c + R : R + c + L;
        parts.push(w);
      }
      if (T && B && +nconnEl.value >= 2) {
        const w = toward.n && !toward.s ? T + c + B : B + c + T;
        parts.push(w);
      }
    }
    return parts.join("　");
  }

  function showSols(sols) {
    center.textContent = sols.length === 1 ? sols[0] : "？";
    if (!sols.length) {
      out.innerHTML = "<p>該当なし。矢印の向き・辞書に無い熟語の可能性があります。</p>";
      return;
    }
    const box = document.createElement("div");
    box.className = "sol";
    sols.sort().forEach((c) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = c;
      b.title = wordsFor(c);
      b.addEventListener("click", () => {
        center.textContent = c;
        document.getElementById("words").textContent = wordsFor(c);
      });
      box.appendChild(b);
    });
    const w = document.createElement("div");
    w.className = "words";
    w.id = "words";
    w.textContent = sols.length ? wordsFor(sols[0]) : "";
    out.innerHTML = "";
    out.append(document.createTextNode(`${sols.length} 件`), box, w);
    if (sols.length === 1) w.textContent = wordsFor(sols[0]);
  }

  document.getElementById("solve").addEventListener("click", () => {
    if (!dict2.size) {
      status.textContent = "辞書がまだです";
      return;
    }
    const r = +wlenEl.value === 3 ? solve3() : solve2();
    if (r.err) {
      out.textContent = r.err;
      center.textContent = "？";
      return;
    }
    showSols(r.sols);
  });
  document.getElementById("clear").addEventListener("click", () => {
    ids.forEach((id) => {
      inputs[id].value = "";
    });
    center.textContent = "？";
    out.innerHTML = "";
  });
  coin.addEventListener("keydown", (e) => {
    if (e.key === "Enter") document.getElementById("solve").click();
  });
})();
