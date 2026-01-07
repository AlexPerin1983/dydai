@echo off
chcp 65001 > nul
echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║     INSTALADOR - PANDA VIDEO DOWNLOADER                 ║
echo ╚══════════════════════════════════════════════════════════╝
echo.

REM Verifica se Python está instalado
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python não encontrado!
    echo.
    echo 📥 Por favor, instale o Python primeiro:
    echo    https://www.python.org/downloads/
    echo.
    echo ⚡ IMPORTANTE: Durante a instalação, marque a opção:
    echo    "Add Python to PATH"
    echo.
    pause
    exit /b 1
)

echo ✅ Python encontrado!
python --version
echo.

echo 📦 Instalando dependências necessárias...
echo.

pip install --upgrade pip
pip install requests
pip install yt-dlp

echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║     ✅ INSTALAÇÃO CONCLUÍDA!                             ║
echo ╚══════════════════════════════════════════════════════════╝
echo.
echo 🎯 Próximos passos:
echo.
echo 1. Execute um dos scripts:
echo    • panda_video_downloader.py (método básico)
echo    • panda_downloader_ytdlp.py (método avançado)
echo.
echo 2. Para executar, digite no PowerShell:
echo    python panda_video_downloader.py
echo.
echo 📖 Leia o arquivo README_PANDA_DOWNLOADER.md para instruções completas
echo.
pause
