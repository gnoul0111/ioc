@echo off
REM ============================================================
REM  Day code len GitHub: https://github.com/gnoul0111/ioc
REM  Cach dung: nhay dup file nay, go mo ta thay doi roi Enter.
REM
REM  Neu muon go tay trong terminal VS Code thi 3 lenh la:
REM    git add -A
REM    git commit -m "mo ta thay doi"
REM    git push
REM ============================================================
chcp 65001 >nul
cd /d "%~dp0"
set "PATH=C:\Program Files\Git\cmd;%PATH%"

echo Cac file da thay doi:
git status --short
echo.

set "MSG="
set /p "MSG=Mo ta thay doi (Enter de dung mac dinh): "
if "%MSG%"=="" set "MSG=Cap nhat %date% %time:~0,5%"

git add -A
git commit -m "%MSG%"
REM keo thay doi moi tren GitHub ve truoc, tranh bi tu choi khi push
git pull --no-edit
if errorlevel 1 goto :ketthuc
git push

:ketthuc

echo.
if errorlevel 1 (echo LOI: day code khong thanh cong, xem thong bao o tren.) else (echo Xong! Da day len https://github.com/gnoul0111/ioc)
pause
