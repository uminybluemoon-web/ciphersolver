"""Text encodings and classic ciphers (parameter-free)."""

from __future__ import annotations

import base64
import html
import re
from dataclasses import dataclass
from urllib.parse import quote, unquote

from decoder.codes import (
    braille_decode,
    braille_encode,
    looks_like_braille,
    looks_like_morse,
    mikaka_decode,
    mikaka_encode,
    morse_decode,
    morse_encode,
)


@dataclass(frozen=True)
class ConvertResult:
    group: str
    name: str
    text: str


def _rot_az(text: str, shift: int) -> str:
    out: list[str] = []
    for ch in text:
        if "A" <= ch <= "Z":
            out.append(chr((ord(ch) - 65 + shift) % 26 + 65))
        elif "a" <= ch <= "z":
            out.append(chr((ord(ch) - 97 + shift) % 26 + 97))
        else:
            out.append(ch)
    return "".join(out)


def rot13(text: str) -> str:
    return _rot_az(text, 13)


def rot18(text: str) -> str:
    out: list[str] = []
    for ch in text:
        if ch.isdigit():
            out.append(str((int(ch) + 5) % 10))
        else:
            out.append(_rot_az(ch, 13))
    return "".join(out)


def rot47(text: str) -> str:
    out: list[str] = []
    for ch in text:
        o = ord(ch)
        if 33 <= o <= 126:
            out.append(chr(33 + (o - 33 + 47) % 94))
        else:
            out.append(ch)
    return "".join(out)


def atbash(text: str) -> str:
    out: list[str] = []
    for ch in text:
        if "A" <= ch <= "Z":
            out.append(chr(90 - (ord(ch) - 65)))
        elif "a" <= ch <= "z":
            out.append(chr(122 - (ord(ch) - 97)))
        else:
            out.append(ch)
    return "".join(out)


_BACON = {
    chr(ord("A") + i): format(i, "05b").replace("0", "A").replace("1", "B")
    for i in range(26)
}
# classic I/J and U/V share in some variants; keep 26-letter unique
_BACON_REV = {v: k for k, v in _BACON.items()}


def bacon_encode(text: str) -> str:
    parts: list[str] = []
    for ch in text:
        if ch.isalpha():
            parts.append(_BACON[ch.upper()])
        elif ch == " ":
            parts.append("/")
        else:
            parts.append("?")
    return " ".join(parts)


def bacon_decode(text: str) -> str:
    raw = re.sub(r"[^ABab/ ]", "", text).upper()
    chunks = re.split(r"\s*/\s*|\s+", raw.strip())
    out: list[str] = []
    buf = "".join(c for c in raw if c in "AB")
    if len(buf) >= 5 and not any(len(c) == 5 for c in chunks if c not in ("", "/")):
        chunks = [buf[i : i + 5] for i in range(0, len(buf) - len(buf) % 5, 5)]
        return "".join(_BACON_REV.get(c, "?") for c in chunks)
    for chunk in chunks:
        if chunk in ("", "/"):
            out.append(" ")
            continue
        letters = "".join(c for c in chunk if c in "AB")
        if len(letters) == 5:
            out.append(_BACON_REV.get(letters, "?"))
        else:
            out.append("?")
    return "".join(out).strip()


def looks_like_bacon(text: str) -> bool:
    s = re.sub(r"\s", "", text)
    if len(s) < 5:
        return False
    core = re.sub(r"[^ABab]", "", text)
    return len(core) >= 5 and len(core) / max(1, len(s)) > 0.8


def _try_b64_decode(text: str) -> str | None:
    s = re.sub(r"\s+", "", text)
    if len(s) < 4 or not re.fullmatch(r"[A-Za-z0-9+/]+=*$", s):
        return None
    try:
        raw = base64.b64decode(s, validate=True)
        if base64.b64encode(raw).decode("ascii").rstrip("=") != s.rstrip("="):
            return None
        return raw.decode("utf-8")
    except Exception:
        return None


def _try_b32_decode(text: str) -> str | None:
    s = re.sub(r"\s+", "", text).upper()
    if len(s) < 8 or not re.fullmatch(r"[A-Z2-7]+=*$", s):
        return None
    try:
        raw = base64.b32decode(s, casefold=True)
        return raw.decode("utf-8")
    except Exception:
        return None


def _try_url_decode(text: str) -> str | None:
    if "%" not in text and "+" not in text:
        return None
    try:
        out = unquote(text, errors="strict")
    except Exception:
        return None
    if out == text:
        return None
    return out


def _try_html_decode(text: str) -> str | None:
    if "&" not in text:
        return None
    out = html.unescape(text)
    if out == text:
        return None
    return out


def _try_unicode_escape(text: str) -> str | None:
    if not re.search(r"\\(u[0-9a-fA-F]{4}|U[0-9a-fA-F]{8}|x[0-9a-fA-F]{2})", text):
        return None
    try:
        import codecs

        out = codecs.decode(text, "unicode_escape")
    except Exception:
        return None
    if out == text:
        return None
    return out


def unicode_escape_encode(text: str) -> str:
    return "".join(f"\\u{ord(ch):04x}" if ord(ch) > 127 else (f"\\x{ord(ch):02x}" if ord(ch) < 32 else ch) for ch in text)


def string_literal(text: str) -> str:
    return ascii(text)


def convert_all(text: str) -> list[ConvertResult]:
    raw = text
    rows: list[ConvertResult] = []

    def add(group: str, name: str, value: str) -> None:
        if value is None:
            return
        rows.append(ConvertResult(group, name, value))

    b64 = base64.b64encode(raw.encode("utf-8")).decode("ascii")
    add("符号化", "Base64", b64)
    dec = _try_b64_decode(raw)
    if dec is not None:
        add("符号化", "Base64（復号）", dec)

    b32 = base64.b32encode(raw.encode("utf-8")).decode("ascii")
    add("符号化", "Base32", b32)
    d32 = _try_b32_decode(raw)
    if d32 is not None:
        add("符号化", "Base32（復号）", d32)

    add("符号化", "URLエンコード", quote(raw, safe=""))
    u = _try_url_decode(raw)
    if u is not None:
        add("符号化", "URLデコード", u)

    add("符号化", "HTMLエスケープ", html.escape(raw, quote=True))
    h = _try_html_decode(raw)
    if h is not None:
        add("符号化", "HTMLアンエスケープ", h)

    add("符号化", "Unicodeエスケープ", unicode_escape_encode(raw))
    ue = _try_unicode_escape(raw)
    if ue is not None:
        add("符号化", "Unicodeエスケープ（復号）", ue)

    add("符号化", "文字列リテラル", string_literal(raw))

    add("符号", "モールス（欧文／和文）", morse_encode(raw))
    if looks_like_morse(raw):
        add("符号", "モールス（復号）", morse_decode(raw.replace("–", "-").replace("—", "-")))

    add("符号", "点字", braille_encode(raw))
    if looks_like_braille(raw):
        add("符号", "点字（復号）", braille_decode(raw))

    add("符号", "みかか", mikaka_encode(raw))
    if re.search(r"\d", raw) and all(
        re.fullmatch(r"[0-9*#/]+", p) for p in re.split(r"[\s,]+", raw.strip()) if p
    ):
        add("符号", "みかか（復号）", mikaka_decode(raw))

    add("暗号", "ROT13", rot13(raw))
    add("暗号", "ROT18", rot18(raw))
    add("暗号", "ROT47", rot47(raw))
    add("暗号", "アトバシュ", atbash(raw))
    add("暗号", "ベーコン", bacon_encode(raw))
    if looks_like_bacon(raw):
        add("暗号", "ベーコン（復号）", bacon_decode(raw))

    for n in range(1, 26):
        add("シーザー", f"シーザー +{n}", _rot_az(raw, n))

    return rows
