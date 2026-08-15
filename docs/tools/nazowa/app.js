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
})();
