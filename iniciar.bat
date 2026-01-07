@echo off
chcp 65001 > nul
echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║           MENU DE DOWNLOAD DE VÍDEOS                     ║
echo ║           Outsider.io e Panda Video                      ║
echo ╚══════════════════════════════════════════════════════════╝
echo.
echo Escolha uma opção:
echo.
echo ⭐ RECOMENDADO PARA LEIGOS:
echo [1] Guia Simples - Gravar Tela (OBS Studio - 100%% Funcional!)
echo.
echo 🤖 DOWNLOAD AUTOMÁTICO:
echo [2] Download Outsider.io (com cookies - técnico)
echo [3] Download Panda Video Básico
echo [4] Download Panda Video Avançado (yt-dlp)
echo.
echo 🛠️ FERRAMENTAS:
echo [5] Instalar Dependências
echo [6] Abrir README / Instruções Completas
echo [7] Sair
echo.

set /p opcao="Digite o número da opção: "

if "%opcao%"=="1" (
    echo.
    echo 📖 Abrindo guia simplificado de gravação de tela...
    start GUIA_SIMPLES_GRAVAR_TELA.md
    echo.
    echo ✅ Este é o método MAIS FÁCIL e 100%% garantido!
    echo ✅ Não precisa conhecimento técnico!
    goto end
)

if "%opcao%"=="2" (
    echo.
    echo 🚀 Iniciando download Outsider.io...
    echo ⚠️  ATENÇÃO: Este método requer cookies do navegador
    python download_outsider.py
    goto end
)

if "%opcao%"=="3" (
    echo.
    echo 🚀 Iniciando downloader Panda Video básico...
    python panda_video_downloader.py
    goto end
)

if "%opcao%"=="4" (
    echo.
    echo 🚀 Iniciando downloader Panda Video avançado (yt-dlp)...
    python panda_downloader_ytdlp.py
    goto end
)

if "%opcao%"=="5" (
    echo.
    echo 📦 Instalando dependências...
    call instalar.bat
    goto end
)

if "%opcao%"=="6" (
    echo.
    echo 📖 Abrindo README...
    start README_PANDA_DOWNLOADER.md
    goto end
)

if "%opcao%"=="7" (
    echo.
    echo 👋 Até logo!
    goto end
)

echo.
echo ❌ Opção inválida!
pause

:end
echo.
pause
