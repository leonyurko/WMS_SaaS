# Building the Executable

This guide will help you create a standalone .exe file that anyone can run without installing Python.

## Prerequisites

Make sure you have Python installed on your system.

## Step 1: Install Dependencies

Open a terminal/command prompt in this directory and run:

```bash
pip install -r requirements.txt
```

This will install all required packages including PyInstaller.

## Step 2: Build the Executable

Run the build script:

```bash
python build_exe.py
```

The build process will take a few minutes. You'll see PyInstaller analyzing your code and bundling everything together.

## Step 3: Find Your Executable

After the build completes, you'll find the executable at:

```
dist/QR_Barcode_Generator.exe
```

## Step 4: Distribute

You can now:
- Copy `QR_Barcode_Generator.exe` to any Windows computer
- Share it with others
- Run it without Python installed

The executable is completely standalone and includes:
- Python runtime
- All required libraries (qrcode, barcode, PIL, tkinter)
- Your application code

## File Size

The .exe file will be approximately 15-25 MB because it includes the entire Python runtime and all dependencies.

## Troubleshooting

### If the build fails:

1. Make sure all dependencies are installed:
   ```bash
   pip install -r requirements.txt
   ```

2. Try building manually with PyInstaller:
   ```bash
   pyinstaller --onefile --windowed --name=QR_Barcode_Generator main.py
   ```

### If the .exe doesn't run:

1. Check Windows Defender or antivirus - they sometimes flag PyInstaller executables
2. Try running from command prompt to see error messages:
   ```bash
   dist\QR_Barcode_Generator.exe
   ```

## Alternative: One Directory Build

If you prefer a folder with the .exe and supporting files (faster startup):

```bash
pyinstaller --onedir --windowed --name=QR_Barcode_Generator main.py
```

This creates a `dist/QR_Barcode_Generator/` folder with the .exe inside. You'll need to distribute the entire folder.
