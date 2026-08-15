function el(html) {
  const d = document.createElement("div");
  d.innerHTML = html;
  return d.firstElementChild;
}

function table(headers, rows, rowClass) {
  const wrap = document.createElement("div");
  wrap.style.overflow = "auto";
  const t = document.createElement("table");
  t.innerHTML = "<thead><tr>" + headers.map((h) => `<th>${h}</th>`).join("") + "</tr></thead>";
  const tb = document.createElement("tbody");
  rows.forEach((cols, i) => {
    const tr = document.createElement("tr");
    const cls = rowClass ? rowClass(cols, i) : "";
    if (cls) tr.className = cls;
    cols.forEach((c, j) => {
      const td = document.createElement("td");
      td.textContent = c;
      if (j === cols.length - 1) td.className = "mono";
      tr.appendChild(td);
    });
    tr.addEventListener("click", () => {
      navigator.clipboard.writeText(cols.join("\t"));
      tr.style.outline = "2px solid #8b3d2f";
      setTimeout(() => { tr.style.outline = ""; }, 400);
    });
    tb.appendChild(tr);
  });
  t.appendChild(tb);
  wrap.appendChild(t);
  return wrap;
}

function showPanel(id) {
  document.querySelectorAll(".panel").forEach((p) => p.classList.toggle("is-on", p.id === "panel-" + id));
  document.querySelectorAll(".inner-tab").forEach((b) => b.classList.toggle("is-active", b.dataset.panel === id));
}

CipherReady.then((C) => {
  document.getElementById("inner-tabs").addEventListener("click", (e) => {
    const b = e.target.closest(".inner-tab");
    if (b) showPanel(b.dataset.panel);
  });

  const fwdIn = document.getElementById("fwd-in");
  const detail = document.getElementById("fwd-detail");
  let lastFwd = [];

  function runFwd() {
    const { tokens, err } = C.parseTokens(fwdIn.value);
    if (err) {
      document.getElementById("fwd-parsed").textContent = err;
      document.getElementById("fwd-out").innerHTML = "";
      return;
    }
    document.getElementById("fwd-parsed").textContent =
      "トークン: " + tokens.map((t) => `[${t.raw}]`).join(" ");
    lastFwd = C.decodeAll(tokens);
    renderFwd();
  }
  function renderFwd() {
    const show = detail.checked;
    const code = new Set(["ASCII／符号位置（10進）", "ASCII／符号位置（16進）", "ASCII／符号位置（2進）", "みかか"]);
    const rows = lastFwd.map((r) => (show ? [r.name, r.text, r.detail] : [r.name, r.text]));
    document.getElementById("fwd-out").replaceChildren(
      table(show ? ["変換", "結果", "内訳"] : ["変換", "結果"], rows, (cols) => (code.has(cols[0]) ? "code" : ""))
    );
  }
  document.getElementById("fwd-go").addEventListener("click", runFwd);
  fwdIn.addEventListener("keydown", (e) => { if (e.key === "Enter") runFwd(); });
  detail.addEventListener("change", () => { if (lastFwd.length) renderFwd(); });

  function runRev() {
    const q = document.getElementById("rev-in").value.trim();
    const box = document.getElementById("rev-out");
    if (!q) {
      box.textContent = "検索文字を入力してください";
      return;
    }
    const rows = C.reverseLookup(q);
    if (!rows.length) {
      box.textContent = "該当なし";
      return;
    }
    box.replaceChildren(
      table(["変換", "該当"], rows, (cols) =>
        /^(ASCII／|モールス|みかか|点字)/.test(cols[0]) ? "code" : ""
      )
    );
  }
  document.getElementById("rev-go").addEventListener("click", runRev);
  document.getElementById("rev-in").addEventListener("keydown", (e) => {
    if (e.key === "Enter") runRev();
  });

  let lastConv = [];
  function runConv() {
    const raw = document.getElementById("conv-in").value;
    if (!raw.trim()) {
      document.getElementById("conv-out").textContent = "文字列を入力してください";
      return;
    }
    lastConv = C.convertAll(raw, document.getElementById("vig-key").value);
    renderConv();
  }
  function renderConv() {
    const showC = document.getElementById("conv-caesar").checked;
    const rows = lastConv.filter((r) => showC || r.group !== "シーザー").map((r) => [r.group, r.name, r.text]);
    const tag = { 符号化: "enc", 符号: "sign", 暗号: "cip", 解析: "ana", シーザー: "cae" };
    document.getElementById("conv-out").replaceChildren(
      table(["分類", "変換", "結果"], rows, (cols) => tag[cols[0]] || "")
    );
  }
  document.getElementById("conv-go").addEventListener("click", runConv);
  document.getElementById("conv-caesar").addEventListener("change", () => { if (lastConv.length) renderConv(); });
  document.getElementById("vig-key").addEventListener("keydown", (e) => {
    if (e.key === "Enter") runConv();
  });
  document.getElementById("conv-in").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) runConv();
  });
}).catch((err) => {
  document.body.insertAdjacentHTML("afterbegin", "<p class='wrap'>読み込みに失敗しました。GitHub Pages 上か、ローカルサーバーで開いてください。<br>" + err + "</p>");
});
