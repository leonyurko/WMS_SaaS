"""
QR and Barcode Generator Application
Main GUI application using Tkinter
"""

import tkinter as tk
from tkinter import ttk
from PIL import Image, ImageTk
from dataclasses import dataclass
from datetime import datetime
from typing import Optional
import os

import code_generator


@dataclass
class GeneratedCode:
    """Data model for a generated code"""
    id_value: str
    code_type: str  # 'qr' or 'barcode'
    image: Image.Image
    timestamp: datetime
    filename: str


@dataclass
class AppState:
    """Application state management"""
    current_code: Optional[GeneratedCode] = None
    selected_type: str = 'qr'
    last_error: Optional[str] = None


class QRBarcodeGeneratorApp:
    """Main application class for QR and Barcode Generator"""
    
    def __init__(self, root):
        self.root = root
        self.root.title("QR & Barcode Generator")
        self.root.geometry("600x700")
        self.root.resizable(False, False)
        
        # Initialize application state
        self.state = AppState()
        
        # Store PhotoImage reference to prevent garbage collection
        self.current_photo = None
        
        # Build the UI
        self.setup_ui()
        
    def setup_ui(self):
        """Set up all UI components"""
        # Main container
        main_frame = ttk.Frame(self.root, padding="20")
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        # Title
        title_label = ttk.Label(main_frame, text="QR & Barcode Generator", 
                                font=("Arial", 18, "bold"))
        title_label.pack(pady=(0, 20))
        
        # Input section
        self.setup_input_section(main_frame)
        
        # Display section
        self.setup_display_section(main_frame)
        
        # Action section
        self.setup_action_section(main_frame)
        
    def setup_input_section(self, parent):
        """Set up the input section with ID entry and code type selection"""
        input_frame = ttk.LabelFrame(parent, text="Input", padding="10")
        input_frame.pack(fill=tk.X, pady=(0, 10))
        
        # ID input
        id_label = ttk.Label(input_frame, text="Enter ID:")
        id_label.grid(row=0, column=0, sticky=tk.W, pady=5)
        
        self.id_entry = ttk.Entry(input_frame, width=40, font=("Arial", 11))
        self.id_entry.grid(row=0, column=1, columnspan=2, sticky=tk.W, padx=(10, 0), pady=5)
        
        # Code type selection
        type_label = ttk.Label(input_frame, text="Code Type:")
        type_label.grid(row=1, column=0, sticky=tk.W, pady=5)
        
        self.code_type_var = tk.StringVar(value="qr")
        
        qr_radio = ttk.Radiobutton(input_frame, text="QR Code", 
                                   variable=self.code_type_var, value="qr",
                                   command=self.on_type_change)
        qr_radio.grid(row=1, column=1, sticky=tk.W, padx=(10, 0), pady=5)
        
        barcode_radio = ttk.Radiobutton(input_frame, text="Barcode", 
                                        variable=self.code_type_var, value="barcode",
                                        command=self.on_type_change)
        barcode_radio.grid(row=1, column=2, sticky=tk.W, padx=(10, 0), pady=5)
        
        # Generate button
        self.generate_btn = ttk.Button(input_frame, text="Generate", 
                                       command=self.generate_code)
        self.generate_btn.grid(row=2, column=0, columnspan=3, pady=(10, 0))
        
    def setup_display_section(self, parent):
        """Set up the display section for showing generated codes"""
        display_frame = ttk.LabelFrame(parent, text="Generated Code", padding="10")
        display_frame.pack(fill=tk.BOTH, expand=True, pady=(0, 10))
        
        # Canvas for displaying image
        self.display_canvas = tk.Canvas(display_frame, width=400, height=400, 
                                        bg="#d3d3d3", highlightthickness=1,
                                        highlightbackground="#999")
        self.display_canvas.pack()
        
        # Placeholder text
        self.placeholder_text = self.display_canvas.create_text(
            200, 200, text="No code generated yet", 
            font=("Arial", 12), fill="#666"
        )
        
    def setup_action_section(self, parent):
        """Set up the action section with save button and status label"""
        action_frame = ttk.Frame(parent)
        action_frame.pack(fill=tk.X)
        
        # Save button
        self.save_btn = ttk.Button(action_frame, text="Save Image", 
                                   command=self.save_image, state=tk.DISABLED)
        self.save_btn.pack(pady=(0, 10))
        
        # Status label
        self.status_label = ttk.Label(action_frame, text="", 
                                      font=("Arial", 10), foreground="#666")
        self.status_label.pack()
        
    def on_type_change(self):
        """Handle code type selection change"""
        self.state.selected_type = self.code_type_var.get()
        
    def generate_code(self):
        """Generate QR code or barcode based on user input"""
        # Get input
        id_value = self.id_entry.get()
        code_type = self.code_type_var.get()
        
        # Validate input
        is_valid, error_msg = code_generator.validate_input(id_value)
        if not is_valid:
            self.show_error(error_msg)
            return
        
        try:
            # Generate code based on type
            if code_type == "qr":
                img = code_generator.generate_qr_code(id_value)
                filename = f"qr_{id_value}.png"
            else:
                img = code_generator.generate_barcode(id_value)
                filename = f"barcode_{id_value}.png"
            
            # Create GeneratedCode object
            generated_code = GeneratedCode(
                id_value=id_value,
                code_type=code_type,
                image=img,
                timestamp=datetime.now(),
                filename=filename
            )
            
            # Update state
            self.state.current_code = generated_code
            
            # Display the image
            self.update_display(img)
            
            # Enable save button
            self.save_btn.config(state=tk.NORMAL)
            
            # Show success message
            self.show_success(f"{code_type.upper()} code generated successfully!")
            
        except Exception as e:
            self.show_error(f"Error generating code: {str(e)}")
            
    def update_display(self, image: Image.Image):
        """Update the display canvas with the generated image"""
        # Clear canvas
        self.display_canvas.delete("all")
        
        # Resize image to fit canvas while maintaining aspect ratio
        canvas_width = 400
        canvas_height = 400
        
        img_width, img_height = image.size
        
        # Calculate scaling factor
        scale = min(canvas_width / img_width, canvas_height / img_height)
        new_width = int(img_width * scale * 0.9)  # 90% of available space
        new_height = int(img_height * scale * 0.9)
        
        # Resize image
        resized_img = image.resize((new_width, new_height), Image.Resampling.LANCZOS)
        
        # Convert to PhotoImage
        self.current_photo = ImageTk.PhotoImage(resized_img)
        
        # Display on canvas (centered)
        x = canvas_width // 2
        y = canvas_height // 2
        self.display_canvas.create_image(x, y, image=self.current_photo)
        
    def save_image(self):
        """Save the generated image to disk"""
        if self.state.current_code is None:
            self.show_error("No code to save")
            return
        
        try:
            # Create output directory if it doesn't exist
            output_dir = "generated_codes"
            os.makedirs(output_dir, exist_ok=True)
            
            # Generate file path
            filepath = os.path.join(output_dir, self.state.current_code.filename)
            
            # Save image
            self.state.current_code.image.save(filepath, "PNG")
            
            # Show success message
            self.show_success(f"Image saved to: {filepath}")
            
        except PermissionError:
            self.show_error("Permission denied: Cannot write to directory")
        except OSError as e:
            self.show_error(f"Error saving file: {str(e)}")
        except Exception as e:
            self.show_error(f"Unexpected error: {str(e)}")
            
    def show_error(self, message: str):
        """Display error message in status label"""
        self.status_label.config(text=message, foreground="red")
        self.state.last_error = message
        
    def show_success(self, message: str):
        """Display success message in status label"""
        self.status_label.config(text=message, foreground="green")
        self.state.last_error = None


def main():
    """Main entry point for the application"""
    root = tk.Tk()
    app = QRBarcodeGeneratorApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()
