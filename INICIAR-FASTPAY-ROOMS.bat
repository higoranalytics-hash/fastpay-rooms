@echo off
setlocal
cd /d "%~dp0server"
if not exist node_modules (
  echo Instalando dependencias pela primeira vez...
  call npm install
  if errorlevel 1 goto :error
)
start "FastPay Rooms" cmd /k "npm start"
timeout /t 3 >nul
start "" http://localhost:3000
exit /b 0
:error
echo.
echo Nao foi possivel instalar as dependencias.
pause
