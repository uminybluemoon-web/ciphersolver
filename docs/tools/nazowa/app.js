(() => {
  const PREC = 120n;
  const SCALE = 10n ** PREC;

  const status = document.getElementById("pic-status");
  const err = document.getElementById("pic-err");
  const cfEl = document.getElementById("pic-cf");
  const valEl = document.getElementById("pic-val");
  const chunksEl = document.getElementById("pic-chunks");
  const inputEl = document.getElementById("pic-in");

  document.getElementById("inner-tabs").addEventListener("click", (e) => {
    const b = e.target.closest(".inner-tab");
    if (!b) return;
    const id = b.dataset.panel;
    document.querySelectorAll(".panel").forEach((p) => p.classList.toggle("is-on", p.id === "panel-" + id));
    document.querySelectorAll(".inner-tab").forEach((x) => x.classList.toggle("is-active", x === b));
  });

  function isqrt(n) {
    if (n <= 0n) return 0n;
    if (n < 2n) return n;
    let x0 = n;
    let x1 = (n + 1n) / 2n;
    while (x1 < x0) {
      x0 = x1;
      x1 = (x1 + n / x1) / 2n;
    }
    return x0;
  }

  function phiScaled() {
    const s5 = isqrt(5n * SCALE * SCALE);
    return (SCALE + s5) / 2n;
  }

  function parseDecimal(raw) {
    let s = (raw || "").trim().replace(/[−ー]/g, "-").replace(/,/g, "").replace(/\s/g, "");
    if (!s) throw new Error("小数を入力してください");
    let neg = false;
    if (s.startsWith("+")) s = s.slice(1);
    if (s.startsWith("-")) {
      neg = true;
      s = s.slice(1);
    }
    if (!/^\d+(\.\d*)?$|^\.\d+$/.test(s)) throw new Error("小数の形式が不正です");
    const [ipRaw, fpRaw = ""] = s.split(".");
    const ip = (ipRaw || "0").replace(/^0+(?=\d)/, "") || "0";
    const fp = fpRaw.replace(/\D/g, "");
    const combined = BigInt(ip + fp || "0");
    const exp = BigInt(fp.length);
    let scaled;
    if (exp <= PREC) scaled = combined * 10n ** (PREC - exp);
    else scaled = combined / 10n ** (exp - PREC);
    return neg ? -scaled : scaled;
  }

  function continuedFraction(scaled, maxIter) {
    const cf = [];
    let x = scaled;
    const neg = x < 0n;
    if (neg) x = -x;
    for (let i = 0; i < maxIter; i++) {
      const a = x / SCALE;
      cf.push(neg && i === 0 ? -a : a);
      const frac = x % SCALE;
      if (frac === 0n) break;
      x = (SCALE * SCALE) / frac;
    }
    return cf;
  }

  function reconstruct(cf) {
    let result = phiScaled();
    for (let i = cf.length - 1; i >= 1; i--) {
      result = cf[i] * SCALE + (SCALE * SCALE) / result;
    }
    result = cf[0] * SCALE + (SCALE * SCALE) / result;
    return result;
  }

  function formatScaled(scaled) {
    const neg = scaled < 0n;
    let x = neg ? -scaled : scaled;
    const ip = x / SCALE;
    const fp = (x % SCALE).toString().padStart(Number(PREC), "0");
    return (neg ? "-" : "") + ip.toString() + "." + fp;
  }

  function run() {
    err.textContent = "";
    cfEl.textContent = "";
    valEl.textContent = "";
    chunksEl.innerHTML = "";
    let scaled;
    try {
      scaled = parseDecimal(inputEl.value);
    } catch (e) {
      err.textContent = e.message;
      status.textContent = "";
      return;
    }
    const maxIter = Math.max(3, Math.min(40, +document.getElementById("pic-terms").value || 20));
    const groups = Math.max(1, Math.min(25, +document.getElementById("pic-groups").value || 10));
    const cf = continuedFraction(scaled, maxIter);
    const restored = reconstruct(cf);
    const full = formatScaled(restored);
    const decimalPart = full.split(".")[1] || "";
    status.textContent = `連分数 ${cf.length} 項　復元（小数 ${decimalPart.length} 桁）`;
    cfEl.textContent = "連分数\n[" + cf.map((a) => a.toString()).join("; ") + "]";
    valEl.textContent = "復元値\n" + full.slice(0, full.indexOf(".") + 101);
    const take = Math.min(groups * 4, decimalPart.length);
    for (let i = 0; i < take; i += 4) {
      const chunk = decimalPart.slice(i, i + 4);
      const li = document.createElement("li");
      li.textContent = chunk;
      li.addEventListener("click", () => navigator.clipboard.writeText(chunk));
      chunksEl.appendChild(li);
    }
  }

  document.getElementById("pic-go").addEventListener("click", run);
  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") run();
  });

  const COLORS = ["赤", "黄", "青", "緑"];
  const COLOR_CLASS = {
    赤: "color-red",
    黄: "color-yellow",
    青: "color-blue",
    緑: "color-green",
  };

  const state = {
    step1: [],
    step2: [],
    colorToNumber: {},
    numberToColor: {},
    initialNumber: null,
    remaining: null,
    history: [],
    phase: "step1",
    pendingPlayerColor: null,
  };

  const els = {
    phaseHint: document.getElementById("phaseHint"),
    mappingText: document.getElementById("mappingText"),
    initialText: document.getElementById("initialText"),
    remainingText: document.getElementById("remainingText"),
    sequenceTitle: document.getElementById("sequenceTitle"),
    sequenceText: document.getElementById("sequenceText"),
    recommendPanel: document.getElementById("recommendPanel"),
    recommendBody: document.getElementById("recommendBody"),
    confirmBtn: document.getElementById("confirmBtn"),
    wallPanel: document.getElementById("wallPanel"),
    colorButtonsTitle: document.getElementById("colorButtonsTitle"),
    colorButtons: document.getElementById("colorButtons"),
    historyList: document.getElementById("historyList"),
    undoBtn: document.getElementById("undoBtn"),
    resetBtn: document.getElementById("resetBtn"),
  };

  function getRecommendedMove(remaining) {
    if (remaining <= 1) return null;
    const move = (remaining - 1) % 5;
    if (move === 0) return null;
    return move;
  }

  function colorLabel(color) {
    const emoji = { 赤: "🔴", 黄: "🟡", 青: "🔵", 緑: "🟢" };
    return `${emoji[color]} ${color}`;
  }

  function resetAll() {
    state.step1 = [];
    state.step2 = [];
    state.colorToNumber = {};
    state.numberToColor = {};
    state.initialNumber = null;
    state.remaining = null;
    state.history = [];
    state.phase = "step1";
    state.pendingPlayerColor = null;
    renderBtns();
  }

  function recalcRemaining() {
    if (state.initialNumber == null) {
      state.remaining = null;
      return;
    }
    const used = state.history.reduce((sum, move) => sum + move.value, 0);
    state.remaining = state.initialNumber - used;
  }

  function finishStep1() {
    state.colorToNumber = {};
    state.numberToColor = {};
    state.step1.forEach((color, index) => {
      const n = index + 1;
      state.colorToNumber[color] = n;
      state.numberToColor[n] = color;
    });
    state.phase = "step2";
  }

  function finishStep2() {
    const tens = state.colorToNumber[state.step2[0]];
    const ones = state.colorToNumber[state.step2[1]];
    state.initialNumber = tens * 10 + ones;
    state.remaining = state.initialNumber;
    state.phase = "player";
    state.pendingPlayerColor = recommendedColor();
  }

  function recommendedColor() {
    const move = getRecommendedMove(state.remaining);
    if (move == null) return null;
    return state.numberToColor[move];
  }

  function onColorClick(color) {
    if (state.phase === "step1") {
      if (state.step1.includes(color)) return;
      state.step1.push(color);
      if (state.step1.length === 4) finishStep1();
      renderBtns();
      return;
    }
    if (state.phase === "step2") {
      state.step2.push(color);
      if (state.step2.length === 2) finishStep2();
      renderBtns();
      return;
    }
    if (state.phase === "player") {
      if (state.remaining <= 0) return;
      state.pendingPlayerColor = color;
      renderBtns();
      return;
    }
    if (state.phase === "wall") {
      applyMove("wall", color);
      if (state.remaining <= 0) state.phase = "over";
      else {
        state.phase = "player";
        state.pendingPlayerColor = recommendedColor();
      }
      renderBtns();
    }
  }

  function applyMove(actor, color) {
    const value = state.colorToNumber[color];
    state.history.push({ actor, color, value });
    recalcRemaining();
  }

  function confirmPlayerMove() {
    if (state.phase !== "player" || !state.pendingPlayerColor) return;
    if (state.remaining <= 0) return;
    applyMove("player", state.pendingPlayerColor);
    state.pendingPlayerColor = null;
    if (state.remaining <= 0) state.phase = "over";
    else state.phase = "wall";
    renderBtns();
  }

  function undo() {
    if (state.phase === "step1") {
      state.step1.pop();
      renderBtns();
      return;
    }
    if (state.phase === "step2") {
      if (state.step2.length > 0) state.step2.pop();
      else {
        state.phase = "step1";
        state.colorToNumber = {};
        state.numberToColor = {};
        state.step1.pop();
      }
      renderBtns();
      return;
    }
    if (state.history.length === 0) {
      state.phase = "step2";
      state.step2.pop();
      state.initialNumber = null;
      state.remaining = null;
      state.pendingPlayerColor = null;
      renderBtns();
      return;
    }
    state.history.pop();
    recalcRemaining();
    const last = state.history[state.history.length - 1];
    if (!last || last.actor === "wall") {
      state.phase = "player";
      state.pendingPlayerColor = recommendedColor();
    } else {
      state.phase = "wall";
      state.pendingPlayerColor = null;
    }
    renderBtns();
  }

  function renderColorButtons() {
    els.colorButtons.innerHTML = "";
    const disabledInStep1 = (color) => state.phase === "step1" && state.step1.includes(color);
    const gameInactive = state.phase === "over" || (state.phase === "player" && state.remaining <= 0);
    COLORS.forEach((color) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "color-btn";
      btn.dataset.color = color;
      btn.textContent = colorLabel(color);
      if (state.phase === "player" && state.pendingPlayerColor === color) btn.classList.add("selected");
      btn.disabled = disabledInStep1(color) || gameInactive || (state.phase === "player" && state.remaining <= 0);
      btn.addEventListener("click", () => onColorClick(color));
      els.colorButtons.appendChild(btn);
    });
  }

  function renderRecommend() {
    if (state.phase !== "player" && state.phase !== "wall" && state.phase !== "over") {
      els.recommendPanel.hidden = true;
      els.confirmBtn.hidden = true;
      return;
    }
    els.recommendPanel.hidden = false;
    const remaining = state.remaining;
    const move = getRecommendedMove(remaining);
    if (state.phase === "over") {
      const last = state.history[state.history.length - 1];
      const loser = last?.actor === "player" ? "自分" : "壁";
      els.recommendBody.innerHTML = `<p class="warn">ゲーム終了</p><p>残数 ${remaining}。${loser}の敗北です。</p>`;
      els.confirmBtn.hidden = true;
      return;
    }
    if (state.phase === "wall") {
      els.recommendBody.innerHTML = `<p class="hint">壁の返答を入力してください</p>`;
      els.confirmBtn.hidden = true;
      return;
    }
    if (remaining === 1) {
      els.recommendBody.innerHTML = `<p class="warn">残り1：必敗状態です</p><p>1〜4のどれを押しても敗北します。押した色を選んで確定してください。</p>`;
      els.confirmBtn.hidden = !state.pendingPlayerColor;
      els.confirmBtn.textContent = state.pendingPlayerColor ? `${state.pendingPlayerColor}を押した` : "この色を押した";
      return;
    }
    if (move == null) {
      els.recommendBody.innerHTML = `<p class="warn">必勝状態ではありません。</p><p>現在残数：${remaining}</p><p>どの手を選んでも、相手が最適に行動すると負けます。</p><p class="hint">押した色を選んで確定してください。</p>`;
      els.confirmBtn.hidden = !state.pendingPlayerColor;
      els.confirmBtn.textContent = state.pendingPlayerColor ? `${state.pendingPlayerColor}を押した` : "この色を押した";
      return;
    }
    const color = state.numberToColor[move];
    const selected = state.pendingPlayerColor || color;
    const selectedValue = state.colorToNumber[selected];
    els.recommendBody.innerHTML = `<p class="recommend-color ${COLOR_CLASS[selected]}">${selected}</p><p class="recommend-number">${selectedValue}を押してください</p>${
      selected !== color ? `<p class="hint">推奨は ${color}（${move}）です。別の色を選択中です。</p>` : ""
    }`;
    els.confirmBtn.hidden = false;
    els.confirmBtn.textContent = `${selected}を押した`;
  }

  function renderBtns() {
    if (state.phase === "step1") {
      els.phaseHint.textContent = "Step 1を入力してください（壁の4色を順番に）";
      els.sequenceTitle.textContent = "Step 1";
      els.sequenceText.textContent = state.step1.length ? state.step1.join(" → ") : "（未入力）";
      els.colorButtonsTitle.textContent = "壁に出た色を順番にタップ";
    } else if (state.phase === "step2") {
      els.phaseHint.textContent = "Step 2を入力してください（壁の2色を順番に）";
      els.sequenceTitle.textContent = "Step 2";
      els.sequenceText.textContent = [`Step 1：${state.step1.join(" → ")}`, state.step2.length ? `Step 2：${state.step2.join(" → ")}` : "Step 2：（未入力）"].join("\n");
      els.colorButtonsTitle.textContent = "壁に出た2色を順番にタップ";
    } else if (state.phase === "wall") {
      els.phaseHint.textContent = "壁から返ってきた色を入力してください";
      els.sequenceTitle.textContent = "進行中";
      els.sequenceText.textContent = `Step 1：${state.step1.join(" → ")}\nStep 2：${state.step2.join(" → ")}`;
      els.colorButtonsTitle.textContent = "壁の返答色";
    } else if (state.phase === "player") {
      els.phaseHint.textContent = "推奨色を謎で押したあと、下の確定ボタンを押してください";
      els.sequenceTitle.textContent = "進行中";
      els.sequenceText.textContent = `Step 1：${state.step1.join(" → ")}\nStep 2：${state.step2.join(" → ")}`;
      els.colorButtonsTitle.textContent = "実際に押した色（推奨と違う場合に変更）";
    } else {
      els.phaseHint.textContent = "終了しました。1手戻すか最初からやり直してください";
      els.sequenceTitle.textContent = "終了";
      els.sequenceText.textContent = `Step 1：${state.step1.join(" → ")}\nStep 2：${state.step2.join(" → ")}`;
      els.colorButtonsTitle.textContent = "色ボタン";
    }
    if (state.step1.length === 4) {
      els.mappingText.textContent = state.step1.map((c) => `${c}=${state.colorToNumber[c]}`).join(" / ");
    } else {
      els.mappingText.textContent = "未設定";
    }
    els.initialText.textContent = state.initialNumber == null ? "—" : String(state.initialNumber);
    els.remainingText.textContent = state.remaining == null ? "—" : String(state.remaining);
    els.wallPanel.hidden = state.phase !== "wall";
    els.historyList.innerHTML = "";
    if (state.history.length === 0) {
      const li = document.createElement("li");
      li.textContent = "なし";
      els.historyList.appendChild(li);
    } else {
      state.history.forEach((move) => {
        const li = document.createElement("li");
        const who = move.actor === "player" ? "自分" : "壁　";
        li.textContent = `${who}：${move.color}(${move.value})`;
        els.historyList.appendChild(li);
      });
    }
    els.undoBtn.disabled = !(state.step1.length > 0 || state.step2.length > 0 || state.history.length > 0);
    renderColorButtons();
    renderRecommend();
  }

  els.confirmBtn.addEventListener("click", confirmPlayerMove);
  els.undoBtn.addEventListener("click", undo);
  els.resetBtn.addEventListener("click", resetAll);
  renderBtns();
})();
