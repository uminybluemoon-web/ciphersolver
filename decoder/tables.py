"""Lookup tables for cipher decode schemes."""

from __future__ import annotations

# 1. 五十音（歴史的仮名あり）51
# 37=い(U+1B120), 39=え(U+1B001), 47=ゐ, 48=う(U+1B11F), 49=ゑ
GOJUON_HISTORICAL: list[str] = [
    "あ", "い", "う", "え", "お",
    "か", "き", "く", "け", "こ",
    "さ", "し", "す", "せ", "そ",
    "た", "ち", "つ", "て", "と",
    "な", "に", "ぬ", "ね", "の",
    "は", "ひ", "ふ", "へ", "ほ",
    "ま", "み", "む", "め", "も",
    "や", "\U0001B120", "ゆ", "\U0001B001", "よ",
    "ら", "り", "る", "れ", "ろ",
    "わ", "ゐ", "\U0001B11F", "ゑ", "を",
    "ん",
]

# 2. 五十音（歴史的仮名なし）— 37,39,47,48,49 を除外して詰め番
_SKIP_HIST = {37, 39, 47, 48, 49}
GOJUON_MODERN: list[str] = [
    ch for i, ch in enumerate(GOJUON_HISTORICAL, start=1) if i not in _SKIP_HIST
]

# 3. いろは（ゐ・ゑ・んあり）
IROHA_HISTORICAL: list[str] = list(
    "いろはにほへとちりぬるを"
    "わかよたれそつねならむ"
    "うゐのおくやまけふこえて"
    "あさきゆめみしゑひもせす"
    "ん"
)

# 4. いろは（歴史的仮名なし）— ゐ・ゑを除いて詰め番
IROHA_MODERN: list[str] = [ch for ch in IROHA_HISTORICAL if ch not in ("ゐ", "ゑ")]

# 5. アルファベット
ALPHABET: list[str] = [chr(ord("A") + i) for i in range(26)]

# 6. 元素（原子番号順）記号と英語名
ELEMENTS: list[tuple[str, str]] = [
    ("H", "Hydrogen"), ("He", "Helium"), ("Li", "Lithium"), ("Be", "Beryllium"),
    ("B", "Boron"), ("C", "Carbon"), ("N", "Nitrogen"), ("O", "Oxygen"),
    ("F", "Fluorine"), ("Ne", "Neon"), ("Na", "Sodium"), ("Mg", "Magnesium"),
    ("Al", "Aluminium"), ("Si", "Silicon"), ("P", "Phosphorus"), ("S", "Sulfur"),
    ("Cl", "Chlorine"), ("Ar", "Argon"), ("K", "Potassium"), ("Ca", "Calcium"),
    ("Sc", "Scandium"), ("Ti", "Titanium"), ("V", "Vanadium"), ("Cr", "Chromium"),
    ("Mn", "Manganese"), ("Fe", "Iron"), ("Co", "Cobalt"), ("Ni", "Nickel"),
    ("Cu", "Copper"), ("Zn", "Zinc"), ("Ga", "Gallium"), ("Ge", "Germanium"),
    ("As", "Arsenic"), ("Se", "Selenium"), ("Br", "Bromine"), ("Kr", "Krypton"),
    ("Rb", "Rubidium"), ("Sr", "Strontium"), ("Y", "Yttrium"), ("Zr", "Zirconium"),
    ("Nb", "Niobium"), ("Mo", "Molybdenum"), ("Tc", "Technetium"), ("Ru", "Ruthenium"),
    ("Rh", "Rhodium"), ("Pd", "Palladium"), ("Ag", "Silver"), ("Cd", "Cadmium"),
    ("In", "Indium"), ("Sn", "Tin"), ("Sb", "Antimony"), ("Te", "Tellurium"),
    ("I", "Iodine"), ("Xe", "Xenon"), ("Cs", "Caesium"), ("Ba", "Barium"),
    ("La", "Lanthanum"), ("Ce", "Cerium"), ("Pr", "Praseodymium"), ("Nd", "Neodymium"),
    ("Pm", "Promethium"), ("Sm", "Samarium"), ("Eu", "Europium"), ("Gd", "Gadolinium"),
    ("Tb", "Terbium"), ("Dy", "Dysprosium"), ("Ho", "Holmium"), ("Er", "Erbium"),
    ("Tm", "Thulium"), ("Yb", "Ytterbium"), ("Lu", "Lutetium"), ("Hf", "Hafnium"),
    ("Ta", "Tantalum"), ("W", "Tungsten"), ("Re", "Rhenium"), ("Os", "Osmium"),
    ("Ir", "Iridium"), ("Pt", "Platinum"), ("Au", "Gold"), ("Hg", "Mercury"),
    ("Tl", "Thallium"), ("Pb", "Lead"), ("Bi", "Bismuth"), ("Po", "Polonium"),
    ("At", "Astatine"), ("Rn", "Radon"), ("Fr", "Francium"), ("Ra", "Radium"),
    ("Ac", "Actinium"), ("Th", "Thorium"), ("Pa", "Protactinium"), ("U", "Uranium"),
    ("Np", "Neptunium"), ("Pu", "Plutonium"), ("Am", "Americium"), ("Cm", "Curium"),
    ("Bk", "Berkelium"), ("Cf", "Californium"), ("Es", "Einsteinium"), ("Fm", "Fermium"),
    ("Md", "Mendelevium"), ("No", "Nobelium"), ("Lr", "Lawrencium"), ("Rf", "Rutherfordium"),
    ("Db", "Dubnium"), ("Sg", "Seaborgium"), ("Bh", "Bohrium"), ("Hs", "Hassium"),
    ("Mt", "Meitnerium"), ("Ds", "Darmstadtium"), ("Rg", "Roentgenium"), ("Cn", "Copernicium"),
    ("Nh", "Nihonium"), ("Fl", "Flerovium"), ("Mc", "Moscovium"), ("Lv", "Livermorium"),
    ("Ts", "Tennessine"), ("Og", "Oganesson"),
]

# 7. 十二支（読み）
ZODIAC: list[str] = [
    "ねずみ", "うし", "とら", "うさぎ", "たつ", "へび",
    "うま", "ひつじ", "さる", "とり", "いぬ", "いのしし",
]

# 8. 和風月名（読み）
WAHU_MONTHS: list[str] = [
    "むつき", "きさらぎ", "やよい", "うづき", "さつき", "みなづき",
    "ふみづき", "はづき", "ながつき", "かんなづき", "しもつき", "しわす",
]

# 9. 月の英語名
EN_MONTHS: list[str] = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
]

# 黄道12星座（春分起点＝おひつじ／Aries）
CONSTELLATION_JP_ARIES: list[str] = [
    "おひつじ", "おうし", "ふたご", "かに", "しし", "おとめ",
    "てんびん", "さそり", "いて", "やぎ", "みずがめ", "うお",
]
CONSTELLATION_EN_ARIES: list[str] = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
]


def _rotate(seq: list[str], start_value: str) -> list[str]:
    i = seq.index(start_value)
    return seq[i:] + seq[:i]


CONSTELLATION_JP_CAPRICORN = _rotate(CONSTELLATION_JP_ARIES, "やぎ")
CONSTELLATION_EN_CAPRICORN = _rotate(CONSTELLATION_EN_ARIES, "Capricorn")
CONSTELLATION_JP_AQUARIUS = _rotate(CONSTELLATION_JP_ARIES, "みずがめ")
CONSTELLATION_EN_AQUARIUS = _rotate(CONSTELLATION_EN_ARIES, "Aquarius")
CONSTELLATION_EN_ALPHA = sorted(CONSTELLATION_EN_ARIES)
CONSTELLATION_JP_GOJUON = sorted(CONSTELLATION_JP_ARIES)

# 惑星（水金地火木土天海＋冥）
PLANETS_JP: list[str] = [
    "すいせい", "きんせい", "ちきゅう", "かせい", "もくせい",
    "どせい", "てんおうせい", "かいおうせい", "めいおうせい",
]
PLANETS_EN: list[str] = [
    "Mercury", "Venus", "Earth", "Mars", "Jupiter",
    "Saturn", "Uranus", "Neptune", "Pluto",
]

# 春夏秋冬
SEASONS_JP: list[str] = ["春", "夏", "秋", "冬"]
SEASONS_EN: list[str] = ["Spring", "Summer", "Autumn", "Winter"]

# 音名
SOLFEGE: list[str] = ["ド", "レ", "ミ", "ファ", "ソ", "ラ", "シ"]
SOLFEGE_CDEFGAB: list[str] = ["C", "D", "E", "F", "G", "A", "B"]
# ドレミの歌（日本語詞の語呂）
DOREMI_SONG: list[str] = [
    "ドーナツ", "レモン", "みんな", "ファイト", "あおいそら", "ラッパ", "しあわせ",
]

# 虹（7色）
RAINBOW_JP: list[str] = ["あか", "だいだい", "きいろ", "みどり", "あお", "あい", "むらさき"]
RAINBOW_EN: list[str] = ["Red", "Orange", "Yellow", "Green", "Blue", "Indigo", "Violet"]

# 曜日（日曜始まり）
WEEKDAYS_JP: list[str] = ["日", "月", "火", "水", "木", "金", "土"]
WEEKDAYS_EN: list[str] = [
    "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
]

# 七つの大罪（傲慢・嫉妬・憤怒・怠惰・強欲・暴食・色欲）
DEADLY_SINS_JP: list[str] = [
    "ごうまん", "しっと", "ふんぬ", "たいだ", "ごうよく", "ぼうしょく", "しきよく",
]
DEADLY_SINS_EN: list[str] = [
    "Pride", "Envy", "Wrath", "Sloth", "Greed", "Gluttony", "Lust",
]

# 都道府県（JIS番号順＝北海道=1 … 沖縄=47）※都府県は付けない
PREFECTURES_JIS: list[str] = [
    "北海道", "青森", "岩手", "宮城", "秋田", "山形", "福島",
    "茨城", "栃木", "群馬", "埼玉", "千葉", "東京", "神奈川",
    "新潟", "富山", "石川", "福井", "山梨", "長野",
    "岐阜", "静岡", "愛知", "三重",
    "滋賀", "京都", "大阪", "兵庫", "奈良", "和歌山",
    "鳥取", "島根", "岡山", "広島", "山口",
    "徳島", "香川", "愛媛", "高知",
    "福岡", "佐賀", "長崎", "熊本", "大分", "宮崎", "鹿児島", "沖縄",
]

# 都道府県（面積大きい順・国土地理院 令和7年7月1日）
PREFECTURES_AREA: list[str] = [
    "北海道", "岩手", "福島", "長野", "新潟", "秋田", "岐阜",
    "青森", "山形", "鹿児島", "広島", "兵庫", "静岡", "宮崎", "熊本",
    "宮城", "岡山", "高知", "島根", "栃木", "群馬", "大分", "山口", "茨城",
    "三重", "愛媛", "愛知", "千葉", "福岡", "和歌山", "京都", "山梨",
    "富山", "石川", "福井", "徳島", "長崎", "滋賀", "埼玉", "奈良",
    "鳥取", "佐賀", "神奈川", "沖縄", "東京", "大阪", "香川",
]
