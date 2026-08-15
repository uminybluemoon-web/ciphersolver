(() => {
  const status = document.getElementById("status");
  const out = document.getElementById("out");
  const coin = document.getElementById("coin");
  const wlenEl = document.getElementById("wlen");
  const nconnEl = document.getElementById("nconn");
  const ncolsEl = document.getElementById("ncols");
  const nrowsEl = document.getElementById("nrows");
  const nconnWrap = document.getElementById("nconn-wrap");
  const modeHint = document.getElementById("mode-hint");
  const kuniEl = document.getElementById("kuni");

  const KUNI_IN = {
    玉: "国", 王: "国",
    十: "田",
    口: "回",
    大: "因",
    木: "困",
    人: "囚",
    寸: "団",
    井: "囲",
    古: "固",
    甫: "圃",
    吾: "圄",
    袁: "園",
    員: "圓",
    專: "團",
    巻: "圏",
    或: "國",
    儿: "四",
    八: "四",
    乂: "図",
    令: "囹",
    豕: "圂",
  };
  const KUNI_REV = {};
  Object.entries(KUNI_IN).forEach(([inner, out]) => {
    if (!KUNI_REV[out]) KUNI_REV[out] = [];
    if (!KUNI_REV[out].includes(inner)) KUNI_REV[out].push(inner);
  });
  const KUNI_OUT = new Set(Object.values(KUNI_IN));

  function kuniOn() {
    return kuniEl.checked;
  }
  function isCenter(id) {
    return id.startsWith("C-");
  }
  function toLogic(id, ch) {
    if (!ch) return ch;
    if (!kuniOn() || !isCenter(id)) return ch;
    return KUNI_IN[ch] || ch;
  }
  function toInner(ch) {
    const ins = KUNI_REV[ch];
    return ins ? ins[0] : ch;
  }
  function labelKuni(ch) {
    const ins = KUNI_REV[ch];
    if (!kuniOn() || !ins) return ch;
    return ins.join("／") + "（" + ch + "）";
  }
  function kuniDomain() {
    const s = new Set();
    for (const out of KUNI_OUT) {
      if (allKanji.has(out)) s.add(out);
    }
    return s.size ? s : new Set(KUNI_OUT);
  }

  const toward = {};
  const inputs = {};
  let edges = [];
  let cellIds = [];

  function val(id) {
    const el = inputs[id];
    return el ? (el.value || "").trim() : "";
  }

  function setVal(id, ch) {
    if (inputs[id]) inputs[id].value = ch;
  }

  function arrowGlyph(kind, toCenter) {
    if (kind === "N") return toCenter ? "↓" : "↑";
    if (kind === "S") return toCenter ? "↑" : "↓";
    if (kind === "W") return toCenter ? "→" : "←";
    return toCenter ? "←" : "→";
  }

  function makeInput(id, row, col, placeholder, isCenter) {
    const inp = document.createElement("input");
    inp.maxLength = 1;
    inp.placeholder = placeholder;
    inp.style.gridRow = String(row);
    inp.style.gridColumn = String(col);
    if (isCenter) inp.className = "center";
    inputs[id] = inp;
    cellIds.push(id);
    coin.appendChild(inp);
    return inp;
  }

  function makeArrow(eid, kind, row, col) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "arrow";
    b.dataset.eid = eid;
    b.style.gridRow = String(row);
    b.style.gridColumn = String(col);
    toward[eid] = true;
    const label = () => {
      b.textContent = arrowGlyph(kind, toward[eid]);
    };
    b.addEventListener("click", () => {
      toward[eid] = !toward[eid];
      label();
    });
    label();
    coin.appendChild(b);
    return b;
  }

  function armActive1x1(kind) {
    const n = Math.max(1, Math.min(4, +nconnEl.value || 4));
    const wlen = +wlenEl.value;
    if (wlen === 3) {
      if (n <= 1) return kind === "W" || kind === "E";
      return true;
    }
    const order = ["W", "E", "N", "S"];
    return order.slice(0, n).includes(kind);
  }

  function buildGrid() {
    const saved = {};
    for (const id of Object.keys(inputs)) saved[id] = val(id);
    const savedToward = { ...toward };

    coin.innerHTML = "";
    for (const k of Object.keys(inputs)) delete inputs[k];
    for (const k of Object.keys(toward)) delete toward[k];
    edges = [];
    cellIds = [];

    let R = Math.max(1, Math.min(3, +nrowsEl.value || 1));
    let C = Math.max(1, Math.min(4, +ncolsEl.value || 1));
    if (+wlenEl.value === 3) {
      R = 1;
      C = 1;
      nrowsEl.value = 1;
      ncolsEl.value = 1;
    }

    const cols = 2 * C + 3;
    const rows = 2 * R + 3;
    coin.style.gridTemplateColumns = `repeat(${cols}, minmax(40px, 64px))`;
    coin.style.gridTemplateRows = `repeat(${rows}, auto)`;

    const ns = (r, c) => `NS-${r}-${c}`;
    const ew = (r, c) => `EW-${r}-${c}`;
    const ctr = (r, c) => `C-${r}-${c}`;

    for (let r = 0; r < R; r++) {
      for (let c = 0; c < C; c++) {
        const cr = 3 + 2 * r;
        const cc = 3 + 2 * c;
        const single = R === 1 && C === 1;
        const useN = !single || armActive1x1("N");
        const useS = !single || armActive1x1("S");
        const useW = !single || armActive1x1("W");
        const useE = !single || armActive1x1("E");

        if (r === 0) {
          makeInput(ns(0, c), 1, cc, C === 1 ? "上" : "上" + (c + 1), false);
          const nEid = `N-${r}-${c}`;
          makeArrow(nEid, "N", 2, cc);
          edges.push({ eid: nEid, kind: "N", outer: ns(0, c), center: ctr(r, c), on: useN });
        }

        if (c === 0) {
          makeInput(ew(r, 0), cr, 1, R === 1 ? "左" : "左" + (r + 1), false);
          const wEid = `W-${r}-${c}`;
          makeArrow(wEid, "W", cr, 2);
          edges.push({ eid: wEid, kind: "W", outer: ew(r, 0), center: ctr(r, c), on: useW });
        }

        makeInput(ctr(r, c), cr, cc, kuniOn() ? "玉" : "中", true);

        if (c === C - 1) {
          const eEid = `E-${r}-${c}`;
          makeArrow(eEid, "E", cr, cc + 1);
          makeInput(ew(r, C), cr, cc + 2, R === 1 ? "右" : "右" + (r + 1), false);
          edges.push({ eid: eEid, kind: "E", outer: ew(r, C), center: ctr(r, c), on: useE });
        } else {
          const eEid = `E-${r}-${c}`;
          makeArrow(eEid, "E", cr, cc + 1);
          edges.push({ eid: eEid, kind: "E", outer: ctr(r, c + 1), center: ctr(r, c), on: true });
        }

        if (r === R - 1) {
          const sEid = `S-${r}-${c}`;
          makeArrow(sEid, "S", cr + 1, cc);
          makeInput(ns(R, c), cr + 2, cc, C === 1 ? "下" : "下" + (c + 1), false);
          edges.push({ eid: sEid, kind: "S", outer: ns(R, c), center: ctr(r, c), on: useS });
        } else {
          const sEid = `S-${r}-${c}`;
          makeArrow(sEid, "S", cr + 1, cc);
          edges.push({ eid: sEid, kind: "S", outer: ctr(r + 1, c), center: ctr(r, c), on: true });
        }
      }
    }

    for (const id of Object.keys(saved)) {
      if (inputs[id] && saved[id]) inputs[id].value = saved[id];
    }
    for (const eid of Object.keys(savedToward)) {
      if (eid in toward) {
        toward[eid] = savedToward[eid];
        const b = coin.querySelector(`[data-eid="${eid}"]`);
        if (b) {
          const kind = eid[0];
          b.textContent = arrowGlyph(kind, toward[eid]);
        }
      }
    }

    edges.forEach((e) => {
      const b = coin.querySelector(`[data-eid="${e.eid}"]`);
      const inpO = inputs[e.outer];
      if (!e.on) {
        if (b) b.classList.add("arm-off");
        if (inpO && !edgeUsed(e.outer)) inpO.classList.add("arm-off");
      } else {
        if (b) b.classList.remove("arm-off");
        if (inpO) inpO.classList.remove("arm-off");
      }
    });
    cellIds.filter((id) => id.startsWith("C-")).forEach((id) => {
      if (inputs[id]) inputs[id].classList.remove("arm-off");
    });
  }

  function edgeUsed(cellId) {
    return edges.some((e) => e.on && (e.outer === cellId || e.center === cellId));
  }

  let dict2 = new Set();
  let dict3 = new Set();
  let after = {};
  let before = {};
  let mid3 = {};
  let allKanji = new Set();

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
        allKanji.add(w[0]);
        allKanji.add(w[1]);
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

  function updateHint() {
    const wlen = +wlenEl.value;
    const multi = +nrowsEl.value > 1 || +ncolsEl.value > 1;
    nconnWrap.style.display = multi ? "none" : "";
    nconnEl.max = wlen === 3 ? 2 : 4;
    nconnEl.min = 1;
    if (wlen === 3 && +nconnEl.value > 2) nconnEl.value = 2;
    ncolsEl.disabled = wlen === 3;
    nrowsEl.disabled = wlen === 3;
    if (wlen === 3) {
      modeHint.textContent =
        "3字モードは1個のみ。縦（上・中・下）と横（左・中・右）。連結1は横だけ、2は縦横。矢印で読み順を反転します。";
    } else if (multi) {
      modeHint.textContent =
        "隣り合う中央は矢印だけでつなぎます（間のマスはありません）。空欄は未知、入っている字は確定です。";
    } else {
      modeHint.textContent =
        "1個のときの連結 = 使う方向の数（2なら左右、3なら左右＋上、4なら四方向）。空欄は無視します。横・縦の個数を増やすと連結できます。中央の枠を国がまえにすると、玉→国、十→田のように中の字を囲みます。";
    }
    coin.classList.toggle("kuni-on", kuniOn());
    buildGrid();
  }
  wlenEl.addEventListener("change", updateHint);
  nconnEl.addEventListener("input", updateHint);
  ncolsEl.addEventListener("input", updateHint);
  nrowsEl.addEventListener("input", updateHint);
  kuniEl.addEventListener("change", updateHint);
  updateHint();

  function intersect(sets) {
    if (!sets.length) return new Set();
    let acc = new Set(sets[0]);
    for (let i = 1; i < sets.length; i++) {
      acc = new Set([...acc].filter((x) => sets[i].has(x)));
    }
    return acc;
  }

  function pairOk(outer, center, toCenter) {
    const w = toCenter ? outer + center : center + outer;
    return dict2.has(w);
  }

  function revise(dom, a, b, aIsOuter, toCenter) {
    const A = dom[a];
    const B = dom[b];
    if (!A || !B) return false;
    const next = new Set();
    for (const x of A) {
      let ok = false;
      if (aIsOuter) {
        const cand = toCenter ? after[x] : before[x];
        if (cand) {
          for (const y of cand) {
            if (B.has(y)) {
              ok = true;
              break;
            }
          }
        }
      } else {
        const cand = toCenter ? before[x] : after[x];
        if (cand) {
          for (const y of cand) {
            if (B.has(y)) {
              ok = true;
              break;
            }
          }
        }
      }
      if (ok) next.add(x);
    }
    if (next.size === A.size) return false;
    dom[a] = next;
    return true;
  }

  function activeEdges() {
    const first = edges.filter((e) => e.on && (val(e.outer) || val(e.center)));
    const involved = new Set();
    first.forEach((e) => {
      involved.add(e.outer);
      involved.add(e.center);
    });
    const act = [...first];
    let changed = true;
    while (changed) {
      changed = false;
      for (const e of edges) {
        if (!e.on || act.includes(e)) continue;
        if (involved.has(e.outer) || involved.has(e.center)) {
          act.push(e);
          involved.add(e.outer);
          involved.add(e.center);
          changed = true;
        }
      }
    }
    return act;
  }

  function solve2linked() {
    const act = activeEdges();
    if (!act.length) return { err: "漢字を1つ以上入れてください", sols: null, domains: null };

    const involved = new Set();
    act.forEach((e) => {
      involved.add(e.outer);
      involved.add(e.center);
    });

    const dom = {};
    for (const id of involved) {
      const v = val(id);
      if (v) {
        dom[id] = new Set([toLogic(id, v)]);
      } else if (kuniOn() && isCenter(id)) {
        dom[id] = new Set(kuniDomain());
      } else {
        dom[id] = new Set(allKanji);
      }
    }

    let guard = 0;
    let changed = true;
    while (changed && guard++ < 80) {
      changed = false;
      for (const e of act) {
        const t = toward[e.eid];
        if (revise(dom, e.outer, e.center, true, t)) changed = true;
        if (revise(dom, e.center, e.outer, false, t)) changed = true;
      }
    }

    for (const id of involved) {
      if (!dom[id] || !dom[id].size) {
        return { err: "該当なし。矢印の向き・辞書に無い熟語の可能性があります。", sols: null, domains: null };
      }
    }

    const unknowns = [...involved].filter((id) => !val(id));
    if (!unknowns.length) {
      return { err: null, sols: [{}], domains: dom, unknowns };
    }

    unknowns.sort((a, b) => dom[a].size - dom[b].size);
    let prod = 1;
    for (const id of unknowns) {
      prod *= dom[id].size;
      if (prod > 20000) break;
    }
    if (prod > 20000) {
      return { err: null, sols: null, domains: dom, unknowns, truncated: true };
    }

    const sols = [];
    const assign = {};
    function consistent(id) {
      for (const e of act) {
        if (e.outer !== id && e.center !== id) continue;
        const o = assign[e.outer] || (dom[e.outer].size === 1 ? [...dom[e.outer]][0] : null);
        const c = assign[e.center] || (dom[e.center].size === 1 ? [...dom[e.center]][0] : null);
        if (!o || !c) continue;
        if (!pairOk(o, c, toward[e.eid])) return false;
      }
      return true;
    }
    function rec(i) {
      if (sols.length >= 200) return;
      if (i === unknowns.length) {
        sols.push({ ...assign });
        return;
      }
      const id = unknowns[i];
      for (const ch of [...dom[id]].sort()) {
        assign[id] = ch;
        if (consistent(id)) rec(i + 1);
      }
      delete assign[id];
    }
    rec(0);
    if (!sols.length) {
      return { err: "該当なし。矢印の向き・辞書に無い熟語の可能性があります。", sols: null, domains: null };
    }
    return { err: null, sols, domains: dom, unknowns };
  }

  function cellLabel(id) {
    const p = id.split("-");
    if (p[0] === "C") {
      const r = +p[1] + 1;
      const c = +p[2] + 1;
      const R = +nrowsEl.value || 1;
      const C = +ncolsEl.value || 1;
      return R === 1 && C === 1 ? "中央" : `中央(${c},${r})`;
    }
    if (p[0] === "NS") {
      const r = +p[1];
      const c = +p[2] + 1;
      const R = +nrowsEl.value || 1;
      if (r === 0) return R === 1 ? "上" : `上${c}`;
      return R === 1 ? "下" : `下${c}`;
    }
    const r = +p[1] + 1;
    const c = +p[2];
    const C = +ncolsEl.value || 1;
    if (c === 0) return C === 1 ? "左" : `左${r}`;
    return C === 1 ? "右" : `右${r}`;
  }

  function wordsForAssign(assign) {
    const parts = [];
    for (const e of edges) {
      if (!e.on) continue;
      const o = assign[e.outer] != null ? assign[e.outer] : toLogic(e.outer, val(e.outer));
      const c = assign[e.center] != null ? assign[e.center] : toLogic(e.center, val(e.center));
      if (!o || !c) continue;
      const w = toward[e.eid] ? o + c : c + o;
      parts.push(w + (dict2.has(w) ? "" : "？"));
    }
    return parts.join("　");
  }

  function applyAssign(assign) {
    for (const [id, ch] of Object.entries(assign)) {
      setVal(id, kuniOn() && isCenter(id) ? toInner(ch) : ch);
    }
  }

  function showLinked(res) {
    if (res.truncated) {
      const bits = res.unknowns.map((id) => {
        const arr = [...res.domains[id]].sort();
        const show = arr
          .slice(0, 30)
          .map((c) => (isCenter(id) ? labelKuni(c) : c))
          .join(" ");
        return `<div><b>${cellLabel(id)}</b>（${arr.length}） ${show}</div>`;
      });
      out.innerHTML =
        "<p>候補が多すぎるため組み合わせは列挙していません。マスごとの候補です。漢字を足すと絞れます。</p>" +
        bits.join("");
      return;
    }
    const unknowns = res.unknowns;
    const sols = res.sols;
    if (sols.length === 1) applyAssign(sols[0]);

    if (unknowns.length === 1 && sols.length) {
      const id = unknowns[0];
      const box = document.createElement("div");
      box.className = "sol";
      sols
        .map((s) => s[id])
        .sort()
        .forEach((c) => {
          const b = document.createElement("button");
          b.type = "button";
          b.textContent = isCenter(id) ? labelKuni(c) : c;
          const as = { [id]: c };
          b.title = wordsForAssign(as);
          b.addEventListener("click", () => {
            applyAssign(as);
            document.getElementById("words").textContent = wordsForAssign(as);
          });
          box.appendChild(b);
        });
      const w = document.createElement("div");
      w.className = "words";
      w.id = "words";
      w.textContent = wordsForAssign(sols[0]);
      out.innerHTML = "";
      out.append(document.createTextNode(`${sols.length} 件（${cellLabel(id)}）`), box, w);
      return;
    }

    const table = document.createElement("table");
    table.className = "sol-table";
    const head = document.createElement("tr");
    unknowns.forEach((id) => {
      const th = document.createElement("th");
      th.textContent = cellLabel(id);
      head.appendChild(th);
    });
    const thw = document.createElement("th");
    thw.textContent = "熟語";
    head.appendChild(thw);
    table.appendChild(head);
    sols.slice(0, 80).forEach((s) => {
      const tr = document.createElement("tr");
      tr.style.cursor = "pointer";
      unknowns.forEach((id) => {
        const td = document.createElement("td");
        td.textContent = isCenter(id) ? labelKuni(s[id]) : s[id];
        tr.appendChild(td);
      });
      const td = document.createElement("td");
      td.className = "words";
      td.textContent = wordsForAssign(s);
      tr.appendChild(td);
      tr.addEventListener("click", () => applyAssign(s));
      table.appendChild(tr);
    });
    out.innerHTML = "";
    const note = document.createElement("p");
    note.textContent =
      `${sols.length} 件` + (sols.length > 80 ? "（先頭80）" : "") + "。行をクリックすると盤面に入れます。";
    out.append(note, table);
  }

  function solve3() {
    const L = val("EW-0-0");
    const R = val("EW-0-1");
    const T = val("NS-0-0");
    const B = val("NS-1-0");
    const n = Math.max(1, Math.min(2, +nconnEl.value || 2));
    const tw = toward["W-0-0"];
    const te = toward["E-0-0"];
    const tn = toward["N-0-0"];
    const ts = toward["S-0-0"];
    const horiz = () => {
      if (!L || !R) return null;
      if (tw && !te) return mid3[L + "|" + R] || [];
      if (!tw && te) return mid3[R + "|" + L] || [];
      return "bad";
    };
    const vert = () => {
      if (!T || !B) return null;
      if (tn && !ts) return mid3[T + "|" + B] || [];
      if (!tn && ts) return mid3[B + "|" + T] || [];
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

  document.getElementById("solve").addEventListener("click", () => {
    if (!dict2.size) {
      status.textContent = "辞書がまだです";
      return;
    }
    if (+wlenEl.value === 3) {
      const r = solve3();
      if (r.err) {
        out.textContent = r.err;
        return;
      }
      if (kuniOn()) {
        const allow = kuniDomain();
        r.sols = r.sols.filter((c) => allow.has(c));
      }
      const id = "C-0-0";
      showLinked({
        err: null,
        sols: r.sols.map((c) => ({ [id]: c })),
        unknowns: [id],
        domains: null,
      });
      return;
    }
    const r = solve2linked();
    if (r.err) {
      out.textContent = r.err;
      return;
    }
    showLinked(r);
  });

  document.getElementById("clear").addEventListener("click", () => {
    Object.keys(inputs).forEach((id) => {
      inputs[id].value = "";
    });
    out.innerHTML = "";
  });

  coin.addEventListener("keydown", (e) => {
    if (e.key === "Enter") document.getElementById("solve").click();
  });
})();
