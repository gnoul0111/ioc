@echo off
REM ============================================================
REM  Day code len GitHub: https://github.com/gnoul0111/ioc
REM  Cach dung: nhay dup file nay, go mo ta thay doi roi Enter.
REM
REM  Quy uoc nhanh:
REM    dev  = noi ca nhom lam viec hang ngay (file nay day len day)
REM    main = ban chinh thuc, CHI gop tu dev qua Pull Request tren GitHub
REM
REM  Neu muon go tay trong terminal VS Code thi 3 lenh la:
REM    git add -A
REM    git commit -m "mo ta thay doi"
REM    git push
REM ============================================================
chcp 65001 >nul
cd /d "%~dp0"
set "PATH=C:\Program Files\Git\cmd;%PATH%"

for /f "delims=" %%b in ('git branch --show-current') do set "BR=%%b"
echo Nhanh hien tai: %BR%
if /i "%BR%"=="main" (
  echo.
  echo KHONG day thang len main - day la ban chinh thuc.
  echo Chuyen sang nhanh dev bang lenh:  git switch dev
  echo roi chay lai file nay. Muon dua len main thi tao Pull Request dev -^> main tren GitHub.
  echo.
  pause
  exit /b 1
)
echo.

echo Cac file da thay doi:
git status --short
echo.

set "MSG="
set /p "MSG=Mo ta thay doi (Enter de dung mac dinh): "
if "%MSG%"=="" set "MSG=Cap nhat %date% %time:~0,5%"

git add -A
git commit -m "%MSG%"
REM keo thay doi moi cua nguoi khac ve truoc, tranh bi tu choi khi push
git ls-remote --exit-code --heads origin %BR% >nul
if not errorlevel 1 (
  git pull --no-edit origin %BR%
  if errorlevel 1 goto :ketthuc
)
git push -u origin HEAD

:ketthuc
echo.
if errorlevel 1 (echo LOI: day code khong thanh cong, xem thong bao o tren.) else (echo Xong! Da day len nhanh %BR% tai https://github.com/gnoul0111/ioc)
pause
