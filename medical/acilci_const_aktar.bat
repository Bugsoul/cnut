@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

rem Bulunduğu dizini al
set "currentDir=%~dp0"
set "folderPath=%currentDir%acilci"

rem Klasör kontrolü
if not exist "%folderPath%" (
    echo "acilci" klasoru bulunamadi: %folderPath%
    pause
    exit /b
)

rem Kullanıcıdan seçenek al
echo Dosya isimlerini nasil aktarmak istiyorsunuz?
echo 1 - Normal
echo 2 - "Tirnak icinde, virgul ile"
echo 3 - const drugImages Dizisi
set /p choice=Seciminiz (1, 2 veya 3): 

rem Çıktı dosyasının adını sabit olarak ayarla
set "outputFile=%currentDir%acilci_dosyalar.txt"

cd /d "%folderPath%"

rem Eğer seçenek 3 ise başlık satırını yaz
if "%choice%"=="3" (
    echo const drugImages = [ > "%temp%\tempfile.txt"
)

rem Dosya adlarını alfabetik sıraya göre sırala
for /f "tokens=* delims=" %%F in ('dir /b /on') do (
    if "%choice%"=="2" (
        echo "%%~nxF", >> "%temp%\tempfile.txt"
    ) else if "%choice%"=="3" (
        echo "%%~nxF", >> "%temp%\tempfile.txt"
    ) else (
        echo %%~nxF >> "%temp%\tempfile.txt"
    )
)

rem Eğer seçenek 3 ise dizi kapanışını ekle
if "%choice%"=="3" (
    rem sondaki son virgülü kaldırmak için işleme gerek yok, JS tolere eder
    echo ]; >> "%temp%\tempfile.txt"
)

rem Geçici dosyayı hedef klasöre taşı
move /y "%temp%\tempfile.txt" "%outputFile%" > nul

echo Dosya isimleri alfabetik siraya gore "%outputFile%" dosyasina aktarıldı.
pause
