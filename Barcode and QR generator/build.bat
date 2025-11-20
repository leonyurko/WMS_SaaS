@echo off
echo ============================================
echo QR and Barcode Generator - Build Script
echo ============================================
echo.

echo Installing dependencies...
pip install -r requirements.txt
echo.

echo Building executable...
python build_exe.py
echo.

echo ============================================
echo Build Complete!
echo ============================================
echo.
echo Your executable is ready at: dist\QR_Barcode_Generator.exe
echo.
pause
