"""
Code Generator Module
Handles QR code and barcode generation with input validation.
"""

import qrcode
from barcode import Code128
from barcode.writer import ImageWriter
from PIL import Image
import io


def validate_input(data: str) -> tuple[bool, str]:
    """
    Validates user input for code generation.
    
    Args:
        data: The input string to validate
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not data or len(data.strip()) == 0:
        return False, "Please enter an ID value"
    
    return True, ""


def generate_qr_code(data: str) -> Image.Image:
    """
    Generates a QR code from the provided data.
    
    Args:
        data: The string to encode in the QR code
        
    Returns:
        PIL Image object containing the QR code
    """
    qr = qrcode.QRCode(
        version=None,  # Auto-adapt to data size
        error_correction=qrcode.constants.ERROR_CORRECT_M,  # Medium (15% error tolerance)
        box_size=10,
        border=4,
    )
    
    qr.add_data(data)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    return img


def generate_barcode(data: str) -> Image.Image:
    """
    Generates a Code128 barcode from the provided data.
    
    Args:
        data: The string to encode in the barcode
        
    Returns:
        PIL Image object containing the barcode
    """
    # Create a BytesIO buffer to store the image
    buffer = io.BytesIO()
    
    # Generate barcode with ImageWriter
    code128 = Code128(data, writer=ImageWriter())
    
    # Write to buffer with configuration
    code128.write(buffer, options={
        'module_height': 15.0,  # 15mm height
        'font_size': 12,
        'text_distance': 5,
        'quiet_zone': 6.5,
    })
    
    # Load image from buffer
    buffer.seek(0)
    img = Image.open(buffer)
    
    return img
