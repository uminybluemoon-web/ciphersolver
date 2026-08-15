(() => {
  const AZ = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const HIRA = "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん";
  const ETAOIN = "ETAOINSHRDLCUMWFGYPBVKJXQZ";

  const cipherEl = document.getElementById("cipher");
  const board = document.getElementById("board");
  const freqBox = document.getElementById("freq");
  const mapBox = document.getElementById("map");
  const unusedBox = document.getElementById("unused");
  const stats = document.getElementById("stats");

  const map = Object.create(null);
  let selected = null;

  function normKey(ch) {
    if (ch >= "a" && ch <= "z") return ch.toUpperCase();
    return ch;
  }

  function isCipherChar(ch) {
    const k = normKey(ch);
    return (k >= "A" && k <= "Z") || HIRA.includes(k);
  }

  function lettersOf(text) {
    return [...text].filter(isCipherChar).map(normKey);
  }

  function counts(arr) {
    const c = {};
    for (const ch of arr) c[ch] = (c[ch] || 0) + 1;
    return c;
  }

  function ic(arr) {
    const n = arr.length;
    if (n < 2) return null;
    const c = counts(arr);
    let s = 0;
    for (const k of Object.values(c)) s += k * (k - 1);
    return s / (n * (n - 1));
  }

  function bigrams(arr) {
    const c = {};
    for (let i = 0; i < arr.length - 1; i++) {
      const g = arr[i] + arr[i + 1];
      c[g] = (c[g] || 0) + 1;
    }
    return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }

  function assign(from, to) {
    if (!from) return;
    if (!to) {
      delete map[from];
      return;
    }
    for (const [k, v] of Object.entries(map)) {
      if (v === to && k !== from) {
        map[k] = map[from] || "";
        if (!map[k]) delete map[k];
      }
    }
    map[from] = to;
  }

  function plainOf(ch) {
    const k = normKey(ch);
    const p = map[k];
    if (!p) return null;
    if (ch >= "a" && ch <= "z") return p.toLowerCase();
    return p;
  }

  function render() {
    const text = cipherEl.value;
    const lets = lettersOf(text);
    const c = counts(lets);
    const keys = Object.keys(c).sort((a, b) => c[b] - c[a] || (a < b ? -1 : 1));

    board.innerHTML = "";
    for (const ch of text) {
      if (ch === "\n") {
        board.appendChild(document.createElement("br"));
        continue;
      }
      const span = document.createElement("span");
      if (!isCipherChar(ch)) {
        span.textContent = ch;
        board.appendChild(span);
        continue;
      }
      const k = normKey(ch);
      const p = plainOf(ch);
      span.className = "tok " + (p ? "mapped" : "open") + (selected === k ? " sel" : "");
      span.textContent = p || ch;
      span.title = k + (p ? " → " + p : "");
      span.addEventListener("click", (e) => {
        e.preventDefault();
        selected = k;
        render();
      });
      board.appendChild(span);
    }

    const icv = ic(lets);
    stats.textContent = lets.length
      ? `${lets.length} 文字 ／ 種類 ${keys.length} ／ IC ${icv != null ? icv.toFixed(3) : "—"}（英語本文≈0.067） ／ 英語頻度順 ${ETAOIN}`
      : "暗号文を入れると頻度が出ます";

    const tbl = document.createElement("table");
    tbl.innerHTML = "<thead><tr><th>暗号</th><th>回数</th><th>%</th><th>平文</th></tr></thead>";
    const tb = document.createElement("tbody");
    keys.forEach((k) => {
      const tr = document.createElement("tr");
      if (selected === k) tr.className = "sel";
      const pct = ((100 * c[k]) / lets.length).toFixed(1);
      tr.innerHTML = `<td>${k}</td><td>${c[k]}</td><td>${pct}</td><td>${map[k] || "·"}</td>`;
      tr.addEventListener("click", () => {
        selected = k;
        render();
      });
      tb.appendChild(tr);
    });
    tbl.appendChild(tb);
    freqBox.innerHTML = "";
    freqBox.appendChild(tbl);
    const bi = bigrams(lets);
    if (bi.length) {
      const p = document.createElement("p");
      p.className = "hint";
      p.textContent = "2文字: " + bi.map(([g, n]) => `${g}(${n})`).join("  ");
      freqBox.appendChild(p);
    }

    mapBox.innerHTML = "";
    keys.forEach((k) => {
      const d = document.createElement("button");
      d.type = "button";
      d.className = "pair" + (selected === k ? " sel" : "");
      d.innerHTML = `<span class="from">${k}</span><span class="to">${map[k] || "·"}</span>`;
      d.addEventListener("click", () => {
        selected = k;
        render();
      });
      mapBox.appendChild(d);
    });

    const used = new Set(Object.values(map));
    const pool = lets.some((ch) => ch >= "A" && ch <= "Z") ? AZ : "";
    const hiraUsed = lets.some((ch) => HIRA.includes(ch));
    let unused = "";
    if (pool) unused += [...AZ].filter((ch) => !used.has(ch)).join(" ");
    if (hiraUsed) {
      if (unused) unused += " ／ ";
      unused += [...HIRA].filter((ch) => !used.has(ch)).join("");
    }
    unusedBox.textContent = unused || "—";
  }

  cipherEl.addEventListener("input", () => {
    const live = new Set(lettersOf(cipherEl.value));
    for (const k of Object.keys(map)) {
      if (!live.has(k)) delete map[k];
    }
    render();
  });

  document.addEventListener("keydown", (e) => {
    if (e.target === cipherEl) return;
    if (!selected) return;
    if (e.key === "Escape") {
      selected = null;
      render();
      return;
    }
    if (e.key === "Backspace" || e.key === "Delete") {
      e.preventDefault();
      assign(selected, "");
      render();
      return;
    }
    if (e.key.length === 1) {
      const ch = e.key;
      const k = normKey(ch);
      if ((k >= "A" && k <= "Z") || HIRA.includes(ch)) {
        e.preventDefault();
        assign(selected, HIRA.includes(ch) ? ch : k);
        render();
      }
    }
  });

  document.getElementById("freq-en").addEventListener("click", () => {
    const lets = lettersOf(cipherEl.value);
    const c = counts(lets);
    const keys = Object.keys(c)
      .filter((k) => k >= "A" && k <= "Z")
      .sort((a, b) => c[b] - c[a] || (a < b ? -1 : 1));
    for (const k of Object.keys(map)) {
      if (k >= "A" && k <= "Z") delete map[k];
    }
    keys.forEach((k, i) => {
      if (i < ETAOIN.length) map[k] = ETAOIN[i];
    });
    selected = null;
    render();
  });
  document.getElementById("reset").addEventListener("click", () => {
    for (const k of Object.keys(map)) delete map[k];
    selected = null;
    render();
  });
  document.getElementById("copy").addEventListener("click", () => {
    const text = [...cipherEl.value].map((ch) => plainOf(ch) || ch).join("");
    navigator.clipboard.writeText(text);
  });

  render();
})();
