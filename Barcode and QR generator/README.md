# QR and Barcode Generator

A simple desktop application to generate QR codes and barcodes from any ID or text input.

![Application Screenshot](https://via.placeholder.com/600x700?text=QR+%26+Barcode+Generator)

## Features

- ✅ Generate QR codes from any text/ID
- ✅ Generate Code128 barcodes from any text/ID
- ✅ Simple and intuitive GUI
- ✅ Save generated codes as PNG images
- ✅ Real-time preview
- ✅ Input validation
- ✅ Error handling

## For End Users (Using the .exe)

### Download and Run

1. Download `QR_Barcode_Generator.exe`
2. Double-click to run
3. No installation or Python required!

### How to Use

1. **Enter an ID**: Type any text or number in the "Enter ID" field
2. **Choose Type**: Select either "QR Code" or "Barcode"
3. **Generate**: Click the "Generate" button
4. **Save**: Click "Save Image" to export as PNG

Generated images are saved in the `generated_codes` folder with filenames like:
- `qr_[your-id].png`
- `barcode_[your-id].png`

## For Developers

### Requirements

- Python 3.8 or higher
- Windows OS (for building .exe)

### Installation

1. Clone or download this repository
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### Running from Source

```bash
python main.py
```

### Building the Executable

#### Quick Build (Recommended)

Simply double-click `build.bat` or run:
```bash
build.bat
```

#### Manual Build

```bash
pip install -r requirements.txt
python build_exe.py
```

The executable will be created at `dist/QR_Barcode_Generator.exe`

See [BUILD_INSTRUCTIONS.md](BUILD_INSTRUCTIONS.md) for detailed build instructions.

## Project Structure

```
qr-barcode-generator/
├── main.py                 # Main GUI application
├── code_generator.py       # QR/Barcode generation logic
├── requirements.txt        # Python dependencies
├── build_exe.py           # PyInstaller build script
├── build.bat              # Windows batch build script
├── generated_codes/       # Output directory for saved images
└── .kiro/specs/          # Project specifications
    ├── requirements.md
    ├── design.md
    └── tasks.md
```

## Technical Details

### Dependencies

- **qrcode**: QR code generation
- **python-barcode**: Barcode generation (Code128)
- **Pillow (PIL)**: Image processing
- **tkinter**: GUI framework (built-in with Python)
- **pyinstaller**: Executable creation

### QR Code Configuration

- Error correction: Medium (15%)
- Box size: 10 pixels
- Border: 4 boxes

### Barcode Configuration

- Format: Code128
- Module height: 15mm
- Font size: 12pt

## Troubleshooting

### Application won't start

- Check if Windows Defender or antivirus is blocking the .exe
- Try running from command prompt to see error messages

### Can't save images

- Make sure you have write permissions in the application directory
- The `generated_codes` folder will be created automatically

### Generation fails

- Ensure your ID input is not empty
- For barcodes, use alphanumeric characters only

## License

This project is open source and available for personal and commercial use.

## Support

For issues or questions, please check the documentation or create an issue in the repository.
