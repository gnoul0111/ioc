@echo off
REM ============================================================
REM  Keo code moi nhat tu GitHub ve: https://github.com/gnoul0111/ioc
REM  Cach dung: nhay dup file nay.
REM
REM  Go tay trong terminal VS Code:   git pull
REM  May moi chua co code:            git clone https://github.com/gnoul0111/ioc.git
REM ============================================================
chcp 65001 >nul
cd /d "%~dp0"
set "PATH=C:\Program Files\Git\cmd;%PATH%"

git pull --no-edit

echo.
if errorlevel 1 (echo LOI: keo code khong thanh cong, xem thong bao o tren.) else (echo Xong! Code da la ban moi nhat.)
pause
