# Design Document: QR and Barcode Generator

## Overview

The QR and Barcode Generator is a Python application that provides a simple graphical interface for generating QR codes and barcodes from user-provided identifiers. The system uses established Python libraries for code generation and Tkinter for the GUI, ensuring cross-platform compatibility and ease of deployment.

## Architecture

The application follows a layered architecture pattern:

```
┌─────────────────────────────┐
│   Presentation Layer (GUI)  │  ← Tkinter-based UI
├─────────────────────────────┤
│   Business Logic Layer      │  ← Generation & Validation
├─────────────────────────────┤
│   Library Layer             │  ← qrcode, python-barcode
└─────────────────────────────┘
```

### Technology Stack

- **GUI Framework**: Tkinter (built-in with Python)
- **QR Code Generation**: `qrcode` library with PIL/Pillow
- **Barcode Generation**: `python-barcode` library
- **Image Handling**: PIL/Pillow for image manipulation and display

## Components and Interfaces

### 1. Main Application Window (`QRBarcodeGeneratorApp`)

The main application class that manages the GUI and coordinates between components.

**Responsibilities:**
- Initialize and layout GUI components
- Handle user interactions
- Coordinate between generator and display components

**Key Methods:**
- `__init__(root)`: Initialize the application window and components
- `generate_code()`: Trigger code generation based on user input
- `save_image()`: Save the generated image to disk
- `update_display(image)`: Update the display area with new image

### 2. Code Generator Module (`code_generator.py`)

Handles the actual generation of QR codes and barcodes.

**Functions:**
- `generate_qr_code(data: str) -> PIL.Image`: Creates a QR code image
- `generate_barcode(data: str, barcode_type: str = 'code128') -> PIL.Image`: Creates a barcode image
- `validate_input(data: str) -> bool`: Validates user input

**QR Code Configuration:**
- Version: Auto (adapts to data size)
- Error correction: Medium (15% error tolerance)
- Box size: 10 pixels per box
- Border: 4 boxes (minimum per spec)

**Barcode Configuration:**
- Format: Code128 (supports alphanumeric)
- Writer: ImageWriter for PNG output
- Font size: 12pt
- Module height: 15mm

### 3. GUI Components

**Input Section:**
- Label: "Enter ID:"
- Entry widget: Single-line text input
- Radio buttons: QR Code / Barcode selection
- Generate button: Triggers code generation

**Display Section:**
- Canvas or Label widget: Shows generated image
- Dimensions: 400x400 pixels (scalable)
- Background: Light gray when empty

**Action Section:**
- Save button: Exports image to file
- Status label: Shows success/error messages

## Data Models

### GeneratedCode

```python
@dataclass
class GeneratedCode:
    id_value: str
    code_type: str  # 'qr' or 'barcode'
    image: PIL.Image.Image
    timestamp: datetime
    filename: str
```

### AppState

```python
@dataclass
class AppState:
    current_code: Optional[GeneratedCode]
    selected_type: str  # 'qr' or 'barcode'
    last_error: Optional[str]
```

## Error Handling

### Input Validation Errors
- **Empty Input**: Display message "Please enter an ID value"
- **Invalid Characters** (for barcode): Display message "Barcode only supports alphanumeric characters"

### Generation Errors
- **Library Errors**: Catch exceptions from qrcode/barcode libraries
- **Memory Errors**: Handle large data inputs gracefully
- **Display**: Show error messages in status label with red text

### File I/O Errors
- **Permission Denied**: Inform user of write permission issues
- **Disk Full**: Handle storage errors gracefully
- **Invalid Path**: Validate save location before writing

### Error Recovery
- All errors should leave the application in a usable state
- Previous generated code remains visible after error
- Clear error messages guide user to resolution

## Testing Strategy

### Unit Tests
- Test `validate_input()` with various input types
- Test `generate_qr_code()` with valid data
- Test `generate_barcode()` with valid data
- Test error handling for invalid inputs

### Integration Tests
- Test complete flow: input → generate → display
- Test format switching between QR and barcode
- Test save functionality with different ID values
- Test UI responsiveness during generation

### Manual Testing Checklist
- Verify QR codes scan correctly with mobile device
- Verify barcodes scan correctly with barcode scanner
- Test with various ID lengths (short, medium, long)
- Test special characters handling
- Verify saved files open correctly in image viewers

## Implementation Notes

### Dependencies Installation
```bash
pip install qrcode[pil] python-barcode pillow
```

### File Structure
```
qr-barcode-generator/
├── main.py                 # Entry point and GUI
├── code_generator.py       # Generation logic
├── requirements.txt        # Python dependencies
└── generated_codes/        # Default output directory
```

### Performance Considerations
- QR code generation: < 100ms for typical IDs
- Barcode generation: < 50ms for typical IDs
- Image display: Use thumbnail for large images
- Memory: Keep only current image in memory

### Future Enhancements (Out of Scope)
- Batch generation from CSV file
- Custom color schemes
- Multiple barcode format support
- Database storage of generated codes
- Web-based interface
