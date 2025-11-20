"""
Build script to create executable using PyInstaller
"""

import PyInstaller.__main__
import os

# Get the absolute path to the project directory
project_dir = os.path.dirname(os.path.abspath(__file__))

PyInstaller.__main__.run([
    'main.py',
    '--name=QR_Barcode_Generator',
    '--onefile',
    '--windowed',
    '--icon=NONE',
    '--add-data=generated_codes;generated_codes',
    '--hidden-import=PIL._tkinter_finder',
    '--collect-all=qrcode',
    '--collect-all=barcode',
    '--noconfirm',
])

print("\n" + "="*60)
print("Build complete!")
print("="*60)
print(f"\nExecutable location: {os.path.join(project_dir, 'dist', 'QR_Barcode_Generator.exe')}")
print("\nYou can now distribute the .exe file to anyone.")
print("They don't need Python installed to run it!")
