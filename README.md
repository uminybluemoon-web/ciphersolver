# 暗号解読オールインワン

番号・文字列の一斉変換 GUI（tkinter）です。

## 起動

```bat
python main.py
```

## タブ

### 解読（番号）

`10 16 4` / `68 82 69 65 77` / `4D` / `77 2 2` / `1-2`

- 五十音・いろは・アルファベット・元素・十二支以降（頭文字つき）
- ASCII／符号位置（10進・16進・2進）
- みかか（同じ数字の連続）

### 逆引き

`dream` → アルファベット `4 18 5 1 13`、ASCII `100 114 …`、モールス、点字 など

### 変換（文字）

文字列を入れて一斉変換。

- Base64 / Base32 / URL / HTML / Unicode エスケープ / 文字列リテラル
- モールス・点字・みかか（復号できそうなら復号行も）
- ROT13 / ROT18 / ROT47 / アトバシュ / ベーコン
- シーザー +1〜+25（チェックで表示切替）

鍵が必要な暗号（ヴィジュネル、エニグマなど）とハッシュは入れていません。

## Web（GitHub Pages）

ブラウザ版は `docs/` です。上のタブは **ツールごと**、暗号解読の中のタブは **機能ごと** です。

新しいツールを足す手順:

1. `docs/tools/_template.html` をコピーして HTML を書く  
2. `docs/js/catalog.js` に1行足す  

```js
{ id: "memo", title: "メモ", file: "tools/memo.html" },
```

GitHub でリポジトリを作り、Settings → Pages → Branch `main` / Folder `/docs` を選ぶと公開されます。あとは `git push` するたびに更新されます。

この PC に Git が入っていない場合は、先に [Git for Windows](https://git-scm.com/download/win) を入れてください。

## exe 化

```bat
build_exe.bat
```

出力: `dist\CipherDecodeAllInOne.exe`
