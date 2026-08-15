@echo off
cd /d "%~dp0"
python -m pip install -r requirements.txt
python -m PyInstaller --noconfirm --clean --windowed --onefile ^
  --name CipherDecodeAllInOne ^
  --paths . ^
  --hidden-import tkinter ^
  --hidden-import tkinter.ttk ^
  --hidden-import decoder ^
  --hidden-import decoder.engine ^
  --hidden-import decoder.tables ^
  --hidden-import decoder.codes ^
  --hidden-import decoder.convert ^
  main.py
echo.
echo Built: dist\CipherDecodeAllInOne.exe
pause
