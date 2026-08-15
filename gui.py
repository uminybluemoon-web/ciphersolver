"""Tkinter GUI for the cipher decode tool."""

from __future__ import annotations

import tkinter as tk
from tkinter import messagebox, ttk

from decoder.convert import convert_all
from decoder.engine import decode_all, parse_tokens, reverse_lookup


class DecodeApp(tk.Tk):
    def __init__(self) -> None:
        super().__init__()
        self.title("暗号解読オールインワン")
        self.geometry("1040x720")
        self.minsize(800, 520)

        self.show_detail = tk.BooleanVar(value=True)
        self.show_caesar = tk.BooleanVar(value=True)
        self._last_forward = []
        self._last_convert = []
        self._history = []

        self._build()

    def _build(self) -> None:
        style = ttk.Style(self)
        if "vista" in style.theme_names():
            style.theme_use("vista")

        notebook = ttk.Notebook(self)
        notebook.pack(fill=tk.BOTH, expand=True, padx=8, pady=8)

        forward = ttk.Frame(notebook, padding=8)
        reverse = ttk.Frame(notebook, padding=8)
        convert = ttk.Frame(notebook, padding=8)
        notebook.add(forward, text="解読（番号）")
        notebook.add(reverse, text="逆引き")
        notebook.add(convert, text="変換（文字）")

        self._build_forward(forward)
        self._build_reverse(reverse)
        self._build_convert(convert)

    def _make_tree(self, parent: ttk.Frame, columns: tuple, headings: dict, widths: dict) -> ttk.Treeview:
        frame = ttk.Frame(parent)
        frame.pack(fill=tk.BOTH, expand=True, pady=(8, 0))
        tree = ttk.Treeview(frame, columns=columns, show="headings", selectmode="browse")
        for col in columns:
            tree.heading(col, text=headings[col])
            stretch = col != columns[0]
            tree.column(col, width=widths[col], stretch=stretch)
        yscroll = ttk.Scrollbar(frame, orient=tk.VERTICAL, command=tree.yview)
        xscroll = ttk.Scrollbar(frame, orient=tk.HORIZONTAL, command=tree.xview)
        tree.configure(yscrollcommand=yscroll.set, xscrollcommand=xscroll.set)
        tree.grid(row=0, column=0, sticky="nsew")
        yscroll.grid(row=0, column=1, sticky="ns")
        xscroll.grid(row=1, column=0, sticky="ew")
        frame.rowconfigure(0, weight=1)
        frame.columnconfigure(0, weight=1)
        return tree

    def _copy_bar(self, parent: ttk.Frame, all_cmd, sel_cmd) -> ttk.Frame:
        btns = ttk.Frame(parent)
        btns.pack(fill=tk.X, pady=(8, 0))
        ttk.Button(btns, text="結果をすべてコピー", command=all_cmd).pack(side=tk.LEFT)
        ttk.Button(btns, text="選択行をコピー", command=sel_cmd).pack(side=tk.LEFT, padx=(8, 0))
        return btns

    def _build_forward(self, parent: ttk.Frame) -> None:
        top = ttk.Frame(parent)
        top.pack(fill=tk.X)

        ttk.Label(
            top,
            text="番号を入力（例: 10 16 4  /  68 82 69 65 77  /  4D  /  77 2 2  /  1-2）",
        ).pack(anchor=tk.W)

        row = ttk.Frame(top)
        row.pack(fill=tk.X, pady=(4, 0))

        self.input_var = tk.StringVar()
        entry = ttk.Entry(row, textvariable=self.input_var, font=("Yu Gothic UI", 12))
        entry.pack(side=tk.LEFT, fill=tk.X, expand=True)
        entry.bind("<Return>", lambda _e: self.run_forward())
        entry.focus_set()

        ttk.Button(row, text="解読", command=self.run_forward, width=10).pack(
            side=tk.LEFT, padx=(8, 0)
        )

        opts = ttk.Frame(top)
        opts.pack(fill=tk.X, pady=(8, 0))
        ttk.Checkbutton(
            opts,
            text="内訳を表示",
            variable=self.show_detail,
            command=self._refresh_forward_view,
        ).pack(side=tk.LEFT)
        ttk.Button(opts, text="結果をすべてコピー", command=self.copy_all_forward).pack(
            side=tk.LEFT, padx=(12, 0)
        )
        ttk.Button(opts, text="選択行をコピー", command=self.copy_selected_forward).pack(
            side=tk.LEFT, padx=(8, 0)
        )

        self.parsed_label = ttk.Label(top, text="トークン: （未解析）", foreground="#444")
        self.parsed_label.pack(anchor=tk.W, pady=(6, 0))

        self.fwd_tree = self._make_tree(
            parent,
            ("scheme", "result", "detail"),
            {"scheme": "変換", "result": "結果", "detail": "内訳"},
            {"scheme": 240, "result": 280, "detail": 380},
        )
        self.fwd_tree.tag_configure("code", background="#f4f8ff")
        self.fwd_tree.bind("<Double-1>", lambda _e: self.copy_selected_forward())

        hist = ttk.LabelFrame(parent, text="履歴", padding=4)
        hist.pack(fill=tk.X, pady=(8, 0))
        self.history_list = tk.Listbox(hist, height=3, font=("Consolas", 10))
        self.history_list.pack(fill=tk.X)
        self.history_list.bind("<Double-1>", self._load_history)

    def _build_reverse(self, parent: ttk.Frame) -> None:
        ttk.Label(
            parent,
            text="文字を入力（例: dream  /  ねたと  /  みかか  /  ねずみ たつ）",
        ).pack(anchor=tk.W)

        row = ttk.Frame(parent)
        row.pack(fill=tk.X, pady=(4, 0))
        self.rev_var = tk.StringVar()
        entry = ttk.Entry(row, textvariable=self.rev_var, font=("Yu Gothic UI", 12))
        entry.pack(side=tk.LEFT, fill=tk.X, expand=True)
        entry.bind("<Return>", lambda _e: self.run_reverse())
        ttk.Button(row, text="逆引き", command=self.run_reverse, width=10).pack(
            side=tk.LEFT, padx=(8, 0)
        )

        self._copy_bar(parent, self.copy_all_reverse, self.copy_selected_reverse)

        self.rev_tree = self._make_tree(
            parent,
            ("scheme", "hits"),
            {"scheme": "変換", "hits": "該当"},
            {"scheme": 260, "hits": 620},
        )
        self.rev_tree.tag_configure("code", background="#f4f8ff")
        self.rev_tree.bind("<Double-1>", lambda _e: self.copy_selected_reverse())

        ttk.Label(
            parent,
            text="上段は ASCII・モールス・みかか・点字。続けて入力すると番号列になります。",
            foreground="#555",
        ).pack(anchor=tk.W, pady=(8, 0))

    def _build_convert(self, parent: ttk.Frame) -> None:
        ttk.Label(
            parent,
            text="文字列を入力（Base64 / URL / モールス / ROT / シーザー全シフト などを一斉変換）",
        ).pack(anchor=tk.W)

        self.conv_text = tk.Text(parent, height=5, font=("Yu Gothic UI", 12), wrap=tk.WORD)
        self.conv_text.pack(fill=tk.X, pady=(4, 0))
        self.conv_text.bind("<Control-Return>", lambda _e: self.run_convert())

        opts = ttk.Frame(parent)
        opts.pack(fill=tk.X, pady=(8, 0))
        ttk.Button(opts, text="変換", command=self.run_convert, width=10).pack(side=tk.LEFT)
        ttk.Checkbutton(
            opts,
            text="シーザー +1〜+25 を表示",
            variable=self.show_caesar,
            command=self._refresh_convert_view,
        ).pack(side=tk.LEFT, padx=(12, 0))
        ttk.Button(opts, text="結果をすべてコピー", command=self.copy_all_convert).pack(
            side=tk.LEFT, padx=(12, 0)
        )
        ttk.Button(opts, text="選択行をコピー", command=self.copy_selected_convert).pack(
            side=tk.LEFT, padx=(8, 0)
        )

        self.conv_tree = self._make_tree(
            parent,
            ("group", "scheme", "result"),
            {"group": "分類", "scheme": "変換", "result": "結果"},
            {"group": 90, "scheme": 220, "result": 620},
        )
        self.conv_tree.tag_configure("符号化", background="#f4f8ff")
        self.conv_tree.tag_configure("符号", background="#f3faf3")
        self.conv_tree.tag_configure("暗号", background="#fff8f0")
        self.conv_tree.tag_configure("シーザー", background="#faf5ff")
        self.conv_tree.bind("<Double-1>", lambda _e: self.copy_selected_convert())

        ttk.Label(
            parent,
            text="Ctrl+Enter で変換 ｜ 復号できそうな入力は「（復号）」行も出ます ｜ 鍵が必要な暗号は入れていません",
            foreground="#555",
        ).pack(anchor=tk.W, pady=(8, 0))

    def run_forward(self) -> None:
        raw = self.input_var.get()
        tokens, err = parse_tokens(raw)
        if err:
            messagebox.showwarning("入力エラー", err)
            return

        shown = [tok.raw if tok.char_pos is None else f"{tok.decimal}-{tok.char_pos}" for tok in tokens]
        self.parsed_label.config(text="トークン: " + " ".join(f"[{t}]" for t in shown))

        results = decode_all(tokens)
        self._last_forward = [(r.name, r.text, r.detail) for r in results]
        self._push_history(raw.strip())
        self._refresh_forward_view()

    def _refresh_forward_view(self) -> None:
        tree = self.fwd_tree
        tree.delete(*tree.get_children())
        show = self.show_detail.get()
        code_names = {
            "ASCII／符号位置（10進）",
            "ASCII／符号位置（16進）",
            "ASCII／符号位置（2進）",
            "みかか",
        }
        for name, text, detail in self._last_forward:
            tag = "code" if name in code_names else ""
            tree.insert("", tk.END, values=(name, text, detail if show else ""), tags=(tag,) if tag else ())

    def run_reverse(self) -> None:
        q = self.rev_var.get().strip()
        if not q:
            messagebox.showwarning("入力エラー", "検索文字を入力してください")
            return
        rows = reverse_lookup(q)
        tree = self.rev_tree
        tree.delete(*tree.get_children())
        if not rows:
            tree.insert("", tk.END, values=("（該当なし）", ""))
            return
        code_prefix = (
            "ASCII／",
            "モールス",
            "みかか",
            "点字",
        )
        for name, hits in rows:
            tag = "code" if name.startswith(code_prefix) else ""
            tree.insert("", tk.END, values=(name, hits), tags=(tag,) if tag else ())

    def run_convert(self) -> None:
        raw = self.conv_text.get("1.0", tk.END)
        if raw.endswith("\n"):
            raw = raw[:-1]
        if not raw.strip():
            messagebox.showwarning("入力エラー", "文字列を入力してください")
            return
        self._last_convert = convert_all(raw)
        self._refresh_convert_view()

    def _refresh_convert_view(self) -> None:
        tree = self.conv_tree
        tree.delete(*tree.get_children())
        show_caesar = self.show_caesar.get()
        for row in self._last_convert:
            if row.group == "シーザー" and not show_caesar:
                continue
            tree.insert(
                "",
                tk.END,
                values=(row.group, row.name, row.text),
                tags=(row.group,),
            )

    def _push_history(self, raw: str) -> None:
        if not raw:
            return
        if raw in self._history:
            self._history.remove(raw)
        self._history.insert(0, raw)
        self._history = self._history[:20]
        self.history_list.delete(0, tk.END)
        for item in self._history:
            self.history_list.insert(tk.END, item)

    def _load_history(self, _event=None) -> None:
        sel = self.history_list.curselection()
        if not sel:
            return
        self.input_var.set(self.history_list.get(sel[0]))
        self.run_forward()

    def _clipboard(self, text: str) -> None:
        self.clipboard_clear()
        self.clipboard_append(text)
        self.update()

    def _copy_tree_selected(self, tree: ttk.Treeview) -> None:
        sel = tree.selection()
        if not sel:
            return
        vals = tree.item(sel[0], "values")
        self._clipboard("\t".join(str(v) for v in vals if str(v)))

    def _copy_tree_all(self, tree: ttk.Treeview) -> None:
        lines = []
        for item in tree.get_children():
            vals = tree.item(item, "values")
            lines.append("\t".join(str(v) for v in vals))
        if lines:
            self._clipboard("\n".join(lines))

    def copy_selected_forward(self) -> None:
        self._copy_tree_selected(self.fwd_tree)

    def copy_all_forward(self) -> None:
        if not self._last_forward:
            return
        show = self.show_detail.get()
        lines = []
        for name, text, detail in self._last_forward:
            if show and detail:
                lines.append(f"{name}\t{text}\t{detail}")
            else:
                lines.append(f"{name}\t{text}")
        self._clipboard("\n".join(lines))

    def copy_selected_reverse(self) -> None:
        self._copy_tree_selected(self.rev_tree)

    def copy_all_reverse(self) -> None:
        self._copy_tree_all(self.rev_tree)

    def copy_selected_convert(self) -> None:
        self._copy_tree_selected(self.conv_tree)

    def copy_all_convert(self) -> None:
        self._copy_tree_all(self.conv_tree)


def main() -> None:
    app = DecodeApp()
    app.mainloop()


if __name__ == "__main__":
    main()
