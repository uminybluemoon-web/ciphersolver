(() => {
  const FILES = {
    hira: "words-ja-hira.json",
    kanji: "words-ja-kanji.json",
    en: "words-en.json",
  };
  const cache = {};
  const status = document.getElementById("status");
  const err = document.getElementById("err");
  const hits = document.getElementById("hits");
  const pat = document.getElementById("pat");

  async function load(key) {
    if (cache[key]) return cache[key];
    status.textContent = "辞書を読み込み中…";
    const r = await fetch(FILES[key]);
    const data = await r.json();
    cache[key] = data;
    return data;
  }

  async function search() {
    err.textContent = "";
    hits.innerHTML = "";
    let raw = pat.value;
    if (!raw) {
      err.textContent = "正規表現を入力してください";
      return;
    }
    if (document.getElementById("full").checked) {
      if (!raw.startsWith("^")) raw = "^" + raw;
      if (!raw.endsWith("$")) raw += "$";
    }
    let re;
    try {
      re = new RegExp(raw, (document.getElementById("icase").checked ? "i" : "") + "u");
    } catch (e) {
      err.textContent = "正規表現が不正です: " + e.message;
      return;
    }
    const key = document.getElementById("src").value;
    let words;
    try {
      words = await load(key);
    } catch (e) {
      err.textContent = "辞書の読み込みに失敗しました";
      status.textContent = "";
      return;
    }
    const found = [];
    const cap = 400;
    for (const w of words) {
      if (re.test(w)) {
        found.push(w);
        if (found.length > cap) break;
      }
      re.lastIndex = 0;
    }
    const extra = found.length > cap;
    const show = extra ? found.slice(0, cap) : found;
    status.textContent = extra
      ? `${cap} 件以上（先頭 ${cap} 件を表示） ／ 辞書 ${words.length} 語`
      : `${show.length} 件 ／ 辞書 ${words.length} 語`;
    const frag = document.createDocumentFragment();
    show.forEach((w) => {
      const s = document.createElement("span");
      s.textContent = w;
      s.addEventListener("click", () => navigator.clipboard.writeText(w));
      frag.appendChild(s);
    });
    hits.appendChild(frag);
  }

  document.getElementById("go").addEventListener("click", search);
  pat.addEventListener("keydown", (e) => {
    if (e.key === "Enter") search();
  });
})();
