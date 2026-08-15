"""Parse input and run forward / reverse decode."""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Callable, List, Optional, Tuple

from decoder import tables as T
from decoder.codes import (
    braille_encode,
    chr_visible,
    mikaka_encode,
    mikaka_from_int,
    morse_encode,
)

TokenTuple = Tuple[int, Optional[int]]  # legacy alias


@dataclass(frozen=True)
class Token:
    raw: str
    decimal: Optional[int]
    char_pos: Optional[int]
    hex_val: Optional[int]
    bin_val: Optional[int]


@dataclass(frozen=True)
class SchemeResult:
    name: str
    text: str
    detail: str


@dataclass(frozen=True)
class Scheme:
    name: str
    lookup: Callable[[int, Optional[int]], str]
    reverse_entries: Callable[[], List[Tuple[str, str]]]
    also_initials: bool = False


def parse_tokens(raw: str) -> Tuple[List[Token], Optional[str]]:
    """Parse '10 16 4' / '4D' / '0x44' / '1000100' / '1-2'."""
    s = raw.strip()
    if not s:
        return [], "入力が空です"
    parts = [p for p in re.split(r"[\s,]+", s) if p]
    tokens: list[Token] = []
    for part in parts:
        tok, err = _parse_one(part)
        if err:
            return [], err
        assert tok is not None
        tokens.append(tok)
    return tokens, None


def _parse_one(part: str) -> Tuple[Optional[Token], Optional[str]]:
    if part.count("-") == 1 and not part.lower().startswith("0x"):
        left, right = part.split("-", 1)
        if left.isdigit() and right.isdigit() and left and right:
            return Token(part, int(left), int(right), None, None), None
        if part.count("-") > 1:
            return None, f"形式エラー: {part}"

    if part.count("-") > 1 and not re.fullmatch(r"[0-9a-fA-FxXbB]+", part):
        return None, f"形式エラー: {part}"

    dec: Optional[int] = None
    if re.fullmatch(r"-?\d+", part):
        dec = int(part, 10)

    hex_val: Optional[int] = None
    h = part[2:] if part.lower().startswith("0x") else part
    if re.fullmatch(r"[0-9a-fA-F]+", h):
        try:
            hex_val = int(h, 16)
        except ValueError:
            hex_val = None

    bin_val: Optional[int] = None
    b = part[2:] if part.lower().startswith("0b") else part
    if re.fullmatch(r"[01]+", b):
        try:
            bin_val = int(b, 2)
        except ValueError:
            bin_val = None

    if dec is None and hex_val is None and bin_val is None:
        return None, f"形式エラー: {part}"
    return Token(part, dec, None, hex_val, bin_val), None


def pick_char(item: str, char_pos: int | None) -> str:
    if char_pos is None:
        return item
    if char_pos < 1 or char_pos > len(item):
        return "?"
    return item[char_pos - 1]


def pick_from_list(items: list[str], index: int, char_pos: int | None) -> str:
    if index < 1 or index > len(items):
        return "?"
    return pick_char(items[index - 1], char_pos)


def join_tokens(parts: list[str]) -> str:
    if not parts:
        return ""
    if all(len(p) == 1 for p in parts):
        return "".join(parts)
    return " ".join(parts)


def format_detail(tokens: list[Token], values: list[str]) -> str:
    bits = []
    for tok, val in zip(tokens, values):
        bits.append(f"{tok.raw}→{val}")
    return "  ".join(bits)


def element_lookup(index: int, char_pos: int | None) -> str:
    if index < 1 or index > len(T.ELEMENTS):
        return "?"
    symbol, en_name = T.ELEMENTS[index - 1]
    if char_pos is None:
        return symbol
    return pick_char(en_name, char_pos)


def _list_scheme(
    name: str, items: list[str], *, also_initials: bool = False
) -> Scheme:
    def lookup(index: int, char_pos: int | None) -> str:
        return pick_from_list(items, index, char_pos)

    def reverse_entries() -> list[tuple[str, str]]:
        out: list[tuple[str, str]] = []
        for i, item in enumerate(items, start=1):
            out.append((item, str(i)))
            if len(item) > 1:
                for cpos, ch in enumerate(item, start=1):
                    out.append((ch, f"{i}-{cpos}"))
        return out

    return Scheme(name, lookup, reverse_entries, also_initials=also_initials)


def _initial_of(value: str) -> str:
    if not value or value == "?":
        return "?"
    return value[0]


def _element_scheme() -> Scheme:
    def reverse_entries() -> list[tuple[str, str]]:
        out: list[tuple[str, str]] = []
        for i, (symbol, en_name) in enumerate(T.ELEMENTS, start=1):
            out.append((symbol, str(i)))
            out.append((en_name, str(i)))
            for cpos, ch in enumerate(en_name, start=1):
                out.append((ch, f"{i}-{cpos}"))
        return out

    return Scheme("元素（記号／英語名n文字目）", element_lookup, reverse_entries)


def build_schemes() -> list[Scheme]:
    return [
        _list_scheme("五十音（歴史あり）", T.GOJUON_HISTORICAL),
        _list_scheme("五十音（歴史なし）", T.GOJUON_MODERN),
        _list_scheme("いろは（歴史あり）", T.IROHA_HISTORICAL),
        _list_scheme("いろは（歴史なし）", T.IROHA_MODERN),
        _list_scheme("アルファベット", T.ALPHABET),
        _element_scheme(),
        _list_scheme("十二支", T.ZODIAC, also_initials=True),
        _list_scheme("和風月名", T.WAHU_MONTHS, also_initials=True),
        _list_scheme("月（英語）", T.EN_MONTHS, also_initials=True),
        _list_scheme("星座JP（おひつじ起点）", T.CONSTELLATION_JP_ARIES, also_initials=True),
        _list_scheme("星座EN（Aries起点）", T.CONSTELLATION_EN_ARIES, also_initials=True),
        _list_scheme("星座JP（やぎ起点）", T.CONSTELLATION_JP_CAPRICORN, also_initials=True),
        _list_scheme("星座EN（Capricorn起点）", T.CONSTELLATION_EN_CAPRICORN, also_initials=True),
        _list_scheme("星座JP（みずがめ起点）", T.CONSTELLATION_JP_AQUARIUS, also_initials=True),
        _list_scheme("星座EN（Aquarius起点）", T.CONSTELLATION_EN_AQUARIUS, also_initials=True),
        _list_scheme("星座EN（アルファベット順）", T.CONSTELLATION_EN_ALPHA, also_initials=True),
        _list_scheme("星座JP（五十音順）", T.CONSTELLATION_JP_GOJUON, also_initials=True),
        _list_scheme("惑星（日本語読み）", T.PLANETS_JP, also_initials=True),
        _list_scheme("惑星（英語）", T.PLANETS_EN, also_initials=True),
    ]


SCHEMES: list[Scheme] = build_schemes()


def _lookup_token(scheme: Scheme, tok: Token) -> str:
    if tok.decimal is None:
        return "?"
    return scheme.lookup(tok.decimal, tok.char_pos)


def _code_results(tokens: list[Token]) -> list[SchemeResult]:
    def row(name: str, values: list[str]) -> SchemeResult:
        return SchemeResult(name, join_tokens(values), format_detail(tokens, values))

    dec_vals = [chr_visible(tok.decimal) if tok.char_pos is None else "?" for tok in tokens]
    hex_vals = [chr_visible(tok.hex_val) if tok.char_pos is None else "?" for tok in tokens]
    bin_vals = [chr_visible(tok.bin_val) if tok.char_pos is None else "?" for tok in tokens]
    mk_vals = [
        mikaka_from_int(tok.decimal) if tok.char_pos is None and tok.decimal is not None else "?"
        for tok in tokens
    ]
    return [
        row("ASCII／符号位置（10進）", dec_vals),
        row("ASCII／符号位置（16進）", hex_vals),
        row("ASCII／符号位置（2進）", bin_vals),
        row("みかか", mk_vals),
    ]


def decode_all(tokens: list[Token]) -> list[SchemeResult]:
    results = _code_results(tokens)
    plain_index_only = all(tok.char_pos is None for tok in tokens)
    for scheme in SCHEMES:
        values = [_lookup_token(scheme, tok) for tok in tokens]
        results.append(
            SchemeResult(
                name=scheme.name,
                text=join_tokens(values),
                detail=format_detail(tokens, values),
            )
        )
        if scheme.also_initials and plain_index_only:
            initials = [_initial_of(v) for v in values]
            results.append(
                SchemeResult(
                    name=f"{scheme.name}（頭文字）",
                    text=join_tokens(initials),
                    detail=format_detail(tokens, initials),
                )
            )
    return results


def _keys_equal(key: str, query: str) -> bool:
    return key == query or key.lower() == query.lower()


def _collect_exact(entries: list[tuple[str, str]], query: str) -> list[str]:
    hits: list[str] = []
    seen: set[str] = set()
    for key, hint in entries:
        if _keys_equal(key, query) and hint not in seen:
            seen.add(hint)
            hits.append(hint)
    return hits


def _collect_initials(entries: list[tuple[str, str]], query: str) -> list[str]:
    hits: list[str] = []
    seen: set[str] = set()
    for key, hint in entries:
        if "-" in hint:
            continue
        initial = _initial_of(key)
        if _keys_equal(initial, query) and hint not in seen:
            seen.add(hint)
            hits.append(hint)
    return hits


def _format_seq_hits(hits: list[str]) -> str:
    if not hits:
        return "?"
    plain = [h for h in hits if "-" not in h]
    use = plain if plain else hits
    return ",".join(use)


def _reverse_parts(query: str) -> Optional[list[str]]:
    tokens = [p for p in re.split(r"[\s,]+", query) if p]
    if len(tokens) > 1:
        return tokens
    if len(query) > 1:
        return list(query)
    return None


def _is_clean_seq(seq: list[str]) -> bool:
    return all(h != "?" and "-" not in h for h in seq)


def _reverse_code_rows(query: str) -> list[tuple[str, str]]:
    rows: list[tuple[str, str]] = []
    chars = list(query)
    rows.append(("ASCII／符号位置（10進）", " ".join(str(ord(ch)) for ch in chars)))
    rows.append(
        (
            "ASCII／符号位置（16進）",
            " ".join(f"{ord(ch):02X}" if ord(ch) < 256 else f"{ord(ch):X}" for ch in chars),
        )
    )
    rows.append(("ASCII／符号位置（2進）", " ".join(format(ord(ch), "b") for ch in chars)))
    morse = morse_encode(query)
    if any(p != "?" for p in morse.replace("/", " ").split()):
        rows.append(("モールス", morse))
    mk = mikaka_encode(query)
    if any(p != "?" for p in mk.split()):
        rows.append(("みかか", mk))
    br = braille_encode(query)
    if br and "?" not in br:
        rows.append(("点字", br))
    return rows


def reverse_lookup(query: str) -> list[tuple[str, str]]:
    """Return list of (scheme_name, matches_text)."""
    q = query.strip()
    if not q:
        return []
    rows: list[tuple[str, str]] = []
    exact_names: set[str] = set()

    rows.extend(_reverse_code_rows(q))

    for scheme in SCHEMES:
        entries = scheme.reverse_entries()
        hits = _collect_exact(entries, q)
        if hits:
            rows.append((scheme.name, ", ".join(hits)))
            exact_names.add(scheme.name)
        if scheme.also_initials:
            init_name = f"{scheme.name}（頭文字）"
            init_hits = _collect_initials(entries, q)
            if init_hits:
                rows.append((init_name, ", ".join(init_hits)))
                exact_names.add(init_name)

    parts = _reverse_parts(q)
    if not parts:
        return rows

    for scheme in SCHEMES:
        entries = scheme.reverse_entries()
        if scheme.name not in exact_names:
            seq = [_format_seq_hits(_collect_exact(entries, part)) for part in parts]
            if _is_clean_seq(seq):
                rows.append((scheme.name, " ".join(seq)))
        if scheme.also_initials:
            init_name = f"{scheme.name}（頭文字）"
            if init_name not in exact_names:
                seq = [_format_seq_hits(_collect_initials(entries, part)) for part in parts]
                if _is_clean_seq(seq):
                    rows.append((init_name, " ".join(seq)))
    return rows
