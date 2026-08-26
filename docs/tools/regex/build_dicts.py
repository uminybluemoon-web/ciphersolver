#!/usr/bin/env python3
"""Build broader word lists for regex / anagram / tanuki from online dictionaries.

Sources (EDRDG / jmdict-simplified):
  - JMdict (full English edition)
  - JMnedict (names)
  - dwyl/english-words (alpha)

Run from repo root or this directory:
  python build_dicts.py
"""
from __future__ import annotations

import io
import json
import re
import tarfile
import urllib.request
import zipfile
from pathlib import Path

OUT = Path(__file__).resolve().parent
TAG = "3.6.2+20260824122934"
TAG_ENC = "3.6.2%2B20260824122934"
BASE = f"https://github.com/scriptin/jmdict-simplified/releases/download/{TAG_ENC}"
JMDICT = f"{BASE}/jmdict-eng-{TAG}.json.zip"
JMNEDICT = f"{BASE}/jmnedict-all-{TAG}.json.zip"
EN_WORDS = "https://cdn.jsdelivr.net/gh/dwyl/english-words@master/words_alpha.txt"

HIRA_RE = re.compile(r"^[\u3041-\u3096ーゝゞ]+$")
KATA_RE = re.compile(r"^[\u30A1-\u30F6ー]+$")
KANJI_RE = re.compile(r"[\u4E00-\u9FFF々〆ヵヶ]")
# Allow kanji forms that may also include kana (複合語)
KANJI_WORD_RE = re.compile(r"^[\u4E00-\u9FFF々〆ヵヶぁ-ゖァ-ヺー・]+$")


def kata_to_hira(s: str) -> str:
    out = []
    for ch in s:
        o = ord(ch)
        if 0x30A1 <= o <= 0x30F6:
            out.append(chr(o - 0x60))
        else:
            out.append(ch)
    return "".join(out)


def download(url: str) -> bytes:
    print("download", url)
    req = urllib.request.Request(url, headers={"User-Agent": "ciphersolver-dict-builder"})
    with urllib.request.urlopen(req, timeout=180) as r:
        return r.read()


def load_jmdict_json(blob: bytes) -> dict:
    with zipfile.ZipFile(io.BytesIO(blob)) as zf:
        name = next(n for n in zf.namelist() if n.endswith(".json"))
        with zf.open(name) as f:
            return json.load(f)


def collect_jmdict(data: dict, hira: set[str], kanji: set[str]) -> None:
    for e in data.get("words", []):
        for r in e.get("kana", []):
            t = (r.get("text") or "").strip()
            if not t:
                continue
            if KATA_RE.match(t):
                t = kata_to_hira(t)
            if HIRA_RE.match(t) and 1 <= len(t) <= 20:
                hira.add(t)
        for k in e.get("kanji", []):
            t = (k.get("text") or "").strip()
            if t and KANJI_WORD_RE.match(t) and KANJI_RE.search(t) and 1 <= len(t) <= 16:
                kanji.add(t)


def collect_jmnedict(data: dict, hira: set[str], kanji: set[str]) -> None:
    for e in data.get("words", []):
        for r in e.get("kana", []) or []:
            if isinstance(r, dict):
                t = (r.get("text") or "").strip()
            else:
                t = str(r).strip()
            if not t:
                continue
            if KATA_RE.match(t):
                t = kata_to_hira(t)
            if HIRA_RE.match(t) and 1 <= len(t) <= 20:
                hira.add(t)
        for k in e.get("kanji", []) or []:
            if isinstance(k, dict):
                t = (k.get("text") or "").strip()
            else:
                t = str(k).strip()
            if t and KANJI_WORD_RE.match(t) and KANJI_RE.search(t) and 1 <= len(t) <= 16:
                kanji.add(t)


def collect_english(text: str) -> list[str]:
    words = []
    for line in text.splitlines():
        w = line.strip().lower()
        if not w or not w.isalpha():
            continue
        if 2 <= len(w) <= 20:
            words.append(w)
    return sorted(set(words))


def write_json(path: Path, words: list[str]) -> None:
    path.write_text(json.dumps(words, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"wrote {path.name}: {len(words)} words, {path.stat().st_size // 1024} KB")


def main() -> None:
    hira: set[str] = set()
    kanji: set[str] = set()

    jm = load_jmdict_json(download(JMDICT))
    print("jmdict words", len(jm.get("words", [])))
    collect_jmdict(jm, hira, kanji)

    jn = load_jmdict_json(download(JMNEDICT))
    print("jmnedict words", len(jn.get("words", [])))
    collect_jmnedict(jn, hira, kanji)

    # Keep existing local words too (in case of custom extras)
    for name, bucket in (("words-ja-hira.json", hira), ("words-ja-kanji.json", kanji)):
        p = OUT / name
        if p.exists():
            try:
                old = json.loads(p.read_text(encoding="utf-8"))
                bucket.update(old)
            except Exception:
                pass

    write_json(OUT / "words-ja-hira.json", sorted(hira))
    write_json(OUT / "words-ja-kanji.json", sorted(kanji))

    en_blob = download(EN_WORDS).decode("utf-8", errors="ignore")
    write_json(OUT / "words-en.json", collect_english(en_blob))


if __name__ == "__main__":
    main()
