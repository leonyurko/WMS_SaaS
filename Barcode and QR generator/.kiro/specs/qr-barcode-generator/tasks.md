# Implementation Plan

- [x] 1. Set up project structure and dependencies


  - Create project directory structure with main.py, code_generator.py, and generated_codes folder
  - Create requirements.txt with qrcode[pil], python-barcode, and pillow dependencies
  - _Requirements: All requirements depend on proper setup_

- [ ] 2. Implement code generation module
  - [x] 2.1 Create code_generator.py with input validation function


    - Write validate_input() function that checks for non-empty strings
    - Return boolean indicating validity and error message if invalid
    - _Requirements: 1.2, 1.3_
  

  - [ ] 2.2 Implement QR code generation function
    - Write generate_qr_code() function using qrcode library
    - Configure QR code with medium error correction, box size 10, border 4
    - Return PIL Image object
    - _Requirements: 2.3, 3.2_
  
  - [x] 2.3 Implement barcode generation function

    - Write generate_barcode() function using python-barcode library with Code128 format
    - Configure barcode with ImageWriter, font size 12pt, module height 15mm
    - Return PIL Image object
    - _Requirements: 2.4, 3.2_

- [x] 3. Build the GUI application

  - [x] 3.1 Create main application window structure


    - Write QRBarcodeGeneratorApp class with Tkinter root window
    - Initialize window with title "QR & Barcode Generator" and appropriate size
    - Set up AppState to track current code and selected type
    - _Requirements: 1.1, 2.1_
  

  - [ ] 3.2 Implement input section UI components
    - Create label "Enter ID:" and Entry widget for user input
    - Add radio buttons for QR Code and Barcode selection with default selection
    - Create Generate button that calls generate_code() method
    - _Requirements: 1.1, 2.1, 2.2, 3.1_

  
  - [ ] 3.3 Implement display section for generated images
    - Create Canvas or Label widget sized 400x400 pixels with light gray background
    - Write update_display() method to show PIL images in the display area
    - Scale images to fit display while maintaining aspect ratio

    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [ ] 3.4 Implement action section with save functionality
    - Create Save button that calls save_image() method

    - Add status label for displaying success/error messages

    - Disable save button when no image is generated
    - _Requirements: 5.1, 5.2, 5.4_

- [ ] 4. Implement core application logic
  - [ ] 4.1 Write generate_code() method
    - Get ID input from Entry widget and selected code type from radio buttons
    - Call validate_input() and display error if validation fails
    - Call appropriate generation function (generate_qr_code or generate_barcode)
    - Create GeneratedCode object with timestamp and filename

    - Call update_display() to show generated image
    - Update status label with success message
    - Enable save button
    - _Requirements: 1.2, 1.3, 2.3, 2.4, 3.2, 3.3, 4.1, 4.4_
  
  - [ ] 4.2 Write save_image() method
    - Check if current_code exists in AppState

    - Create generated_codes directory if it doesn't exist
    - Generate filename using pattern "qr_[ID].png" or "barcode_[ID].png"
    - Save image using PIL Image.save() method
    - Update status label with success message including file path
    - _Requirements: 5.1, 5.2, 5.3_


  

  - [ ] 4.3 Implement error handling throughout application
    - Add try-except blocks around generation functions to catch library errors
    - Add try-except blocks around file I/O operations to catch permission and disk errors
    - Display all errors in status label with red text
    - Ensure application remains usable after errors
    - _Requirements: 1.3, 3.3_


- [ ] 5. Create main entry point and finalize application
  - [ ] 5.1 Write main.py entry point
    - Create if __name__ == "__main__" block
    - Initialize Tkinter root window
    - Instantiate QRBarcodeGeneratorApp
    - Start Tkinter main loop
    - _Requirements: All requirements_
  
  - [ ] 5.2 Add data model classes
    - Create GeneratedCode dataclass with id_value, code_type, image, timestamp, filename fields
    - Create AppState dataclass with current_code, selected_type, last_error fields
    - _Requirements: All requirements_
  
  - [ ]* 5.3 Create basic integration tests
    - Write test script that simulates generating QR code with sample ID
    - Write test script that simulates generating barcode with sample ID
    - Write test that verifies saved files exist and are valid PNG images
    - _Requirements: All requirements_
