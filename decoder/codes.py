"""ASCII / Unicode / みかか / Morse / Braille helpers."""

from __future__ import annotations

import re
from typing import Optional

# 携帯キー（みかか）清音。同じ数字の連続回数 = 何番目
MIKAKA_GROUPS: dict[str, str] = {
    "1": "あいうえお",
    "2": "かきくけこ",
    "3": "さしすせそ",
    "4": "たちつてと",
    "5": "なにぬねの",
    "6": "はひふへほ",
    "7": "まみむめも",
    "8": "やゆよ",
    "9": "らりるれろ",
    "0": "わをん",
}

_DAKUTEN = str.maketrans("かきくけこさしすせそたちつてとはひふへほ", "がぎぐげござじずぜぞだぢづでどばびぶべぼ")
_HANDAKU = str.maketrans("はひふへほ", "ぱぴぷぺぽ")
_DAKUTEN_REV = {
    d: s
    for s, d in zip(
        "かきくけこさしすせそたちつてとはひふへほ",
        "がぎぐげござじずぜぞだぢづでどばびぶべぼ",
    )
}
_HANDAKU_REV = {d: s for s, d in zip("はひふへほ", "ぱぴぷぺぽ")}

# ITU Morse (Latin + digits). Space between letters, / between words.
MORSE_AZ: dict[str, str] = {
    "A": ".-", "B": "-...", "C": "-.-.", "D": "-..", "E": ".", "F": "..-.",
    "G": "--.", "H": "....", "I": "..", "J": ".---", "K": "-.-", "L": ".-..",
    "M": "--", "N": "-.", "O": "---", "P": ".--.", "Q": "--.-", "R": ".-.",
    "S": "...", "T": "-", "U": "..-", "V": "...-", "W": ".--", "X": "-..-",
    "Y": "-.--", "Z": "--..",
    "0": "-----", "1": ".----", "2": "..---", "3": "...--", "4": "....-",
    "5": ".....", "6": "-....", "7": "--...", "8": "---..", "9": "----.",
    ".": ".-.-.-", ",": "--..--", "?": "..--..", "'": ".----.", "!": "-.-.--",
    "/": "-..-.", "(": "-.--.", ")": "-.--.-", "&": ".-...", ":": "---...",
    ";": "-.-.-.", "=": "-...-", "+": ".-.-.", "-": "-....-", "_": "..--.-",
    '"': ".-..-.", "$": "...-..-", "@": ".--.-.",
}
MORSE_REV = {v: k for k, v in MORSE_AZ.items()}

# 和文モールス（主要）
WABUN_MORSE: dict[str, str] = {
    "あ": "--.--", "い": ".-", "う": "..-", "え": "-.---", "お": ".-...",
    "か": ".-..", "き": "-.-..", "く": "...-", "け": "-.--", "こ": "----",
    "さ": "-.-.-", "し": "--.-.", "す": "---.-", "せ": ".---.", "そ": "---.",
    "た": "-.", "ち": "..-.", "つ": ".--.", "て": ".-.--", "と": "..-..",
    "な": ".-.", "に": "-.-.", "ぬ": "....", "ね": "--.-", "の": "..--",
    "は": "-...", "ひ": "--..-", "ふ": "--..", "へ": ".", "ほ": "-..",
    "ま": "-..-", "み": "..-.-", "む": "-", "め": "-...-", "も": "-..-.",
    "や": ".--", "ゆ": "-..--", "よ": "--",
    "ら": "...", "り": "--.", "る": "-.--.", "れ": "---", "ろ": ".-.-",
    "わ": "-.-", "ゐ": ".-..-", "ゑ": ".--..", "を": ".---", "ん": ".-.-.",
    "ー": ".--.-", "゛": "..", "゜": "..--.",
}
WABUN_REV = {v: k for k, v in WABUN_MORSE.items()}

# Braille (U+2800) for a-z and 0-9 (English grade-1 letters)
_BRAILLE_AZ = "⠁⠃⠉⠙⠑⠋⠛⠓⠊⠚⠅⠇⠍⠝⠕⠏⠟⠗⠎⠞⠥⠧⠺⠭⠽⠵"
BRAILLE_AZ = {chr(ord("a") + i): _BRAILLE_AZ[i] for i in range(26)}
_BRAILLE_DIGITS = "⠚⠁⠃⠉⠙⠑⠋⠛⠓⠊"  # 0-9; number sign ⠼ precedes
BRAILLE_NUM_SIGN = "⠼"


def chr_visible(code: Optional[int]) -> str:
    if code is None or code < 0 or code > 0x10FFFF:
        return "?"
    if 0xD800 <= code <= 0xDFFF:
        return "?"
    try:
        ch = chr(code)
    except ValueError:
        return "?"
    if code < 32 or code == 127:
        return f"\\x{code:02X}"
    return ch


def mikaka_from_digits(digits: str) -> str:
    if not digits or not digits.isdigit():
        return "?"
    if any(c != digits[0] for c in digits):
        return "?"
    group = MIKAKA_GROUPS.get(digits[0])
    if not group or len(digits) > len(group):
        return "?"
    return group[len(digits) - 1]


def mikaka_from_int(n: int) -> str:
    if n < 0:
        return "?"
    return mikaka_from_digits(str(n))


def mikaka_encode_char(ch: str) -> Optional[str]:
    if ch in _HANDAKU_REV:
        base = mikaka_encode_char(_HANDAKU_REV[ch])
        return None if base is None else base + "#"
    if ch in _DAKUTEN_REV:
        base = mikaka_encode_char(_DAKUTEN_REV[ch])
        return None if base is None else base + "*"
    for digit, group in MIKAKA_GROUPS.items():
        idx = group.find(ch)
        if idx >= 0:
            return digit * (idx + 1)
    if ch in " 　":
        return "/"
    return None


def mikaka_encode(text: str) -> str:
    parts: list[str] = []
    for ch in text:
        enc = mikaka_encode_char(ch)
        parts.append(enc if enc is not None else "?")
    return " ".join(parts)


def mikaka_decode_token(tok: str) -> str:
    tok = tok.strip()
    if not tok or tok == "/":
        return " "
    marks = ""
    while tok.endswith("*") or tok.endswith("#"):
        marks = tok[-1] + marks
        tok = tok[:-1]
    ch = mikaka_from_digits(tok)
    if ch == "?":
        return "?"
    for m in marks:
        if m == "*":
            ch = ch.translate(_DAKUTEN)
        elif m == "#":
            ch = ch.translate(_HANDAKU)
    return ch


def mikaka_decode(text: str) -> str:
    parts = [p for p in re.split(r"[\s,]+", text.strip()) if p]
    if not parts:
        return ""
    return "".join(mikaka_decode_token(p) for p in parts)


def morse_encode(text: str) -> str:
    words: list[str] = []
    for word in re.split(r"\s+", text.strip()):
        letters: list[str] = []
        for ch in word:
            if ch in WABUN_MORSE:
                letters.append(WABUN_MORSE[ch])
            elif ch.upper() in MORSE_AZ:
                letters.append(MORSE_AZ[ch.upper()])
            else:
                letters.append("?")
        words.append(" ".join(letters))
    return " / ".join(words)


def morse_decode(text: str) -> str:
    raw = text.strip()
    if not raw:
        return ""
    words = re.split(r"\s*/\s*|\s*\|\s*", raw)
    out_words: list[str] = []
    for word in words:
        letters = [p for p in word.split() if p]
        chars: list[str] = []
        for pat in letters:
            if pat in MORSE_REV:
                chars.append(MORSE_REV[pat])
            elif pat in WABUN_REV:
                chars.append(WABUN_REV[pat])
            else:
                chars.append("?")
        out_words.append("".join(chars))
    return " ".join(out_words)


def looks_like_morse(text: str) -> bool:
    s = text.strip()
    if not s:
        return False
    return bool(re.fullmatch(r"[.\-–—/|\s]+", s)) and ("." in s or "-" in s or "–" in s)


def braille_encode(text: str) -> str:
    out: list[str] = []
    in_num = False
    for ch in text:
        if ch.isdigit():
            if not in_num:
                out.append(BRAILLE_NUM_SIGN)
                in_num = True
            out.append(_BRAILLE_DIGITS[int(ch)])
            continue
        in_num = False
        low = ch.lower()
        if low in BRAILLE_AZ:
            out.append(BRAILLE_AZ[low])
        elif ch == " ":
            out.append(" ")
        else:
            out.append("?")
    return "".join(out)


def braille_decode(text: str) -> str:
    out: list[str] = []
    in_num = False
    rev_az = {v: k for k, v in BRAILLE_AZ.items()}
    rev_d = {v: str(i) for i, v in enumerate(_BRAILLE_DIGITS)}
    for ch in text:
        if ch == BRAILLE_NUM_SIGN:
            in_num = True
            continue
        if ch == " ":
            in_num = False
            out.append(" ")
            continue
        if in_num and ch in rev_d:
            out.append(rev_d[ch])
            continue
        in_num = False
        out.append(rev_az.get(ch, "?"))
    return "".join(out)


def looks_like_braille(text: str) -> bool:
    s = text.strip()
    if not s:
        return False
    br = sum(1 for ch in s if "\u2800" <= ch <= "\u28FF")
    return br >= max(1, len(s.replace(" ", "")) // 2)
