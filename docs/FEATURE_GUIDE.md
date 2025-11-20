# Quick Start Guide - New Features

## 🎉 What's New?

### 1. **Auto-Generated Barcodes & QR Codes**
Every new inventory item automatically gets:
- A barcode image (Code128 format)
- A QR code image
- Both displayed in the inventory table

### 2. **Multiple Product Images** 
Upload up to 5 images per item:
- Shows image count badge
- Click thumbnail to open gallery
- Gallery shows all images + codes + details

### 3. **Print Item Details**
Print any inventory item:
- Includes barcode & QR code
- All item details
- Optimized for mobile printing

---

## 📱 How to Use

### Adding a New Item:
1. Click **"Add Item"** button
2. Fill in item details
3. Upload up to 5 images (optional)
4. Click **"Add Item"**
5. ✅ Barcode & QR code are auto-generated!

### Viewing Item Gallery:
1. In the inventory table, click on any item's **image thumbnail**
2. Gallery modal opens showing:
   - All product images
   - Barcode & QR code
   - Item details
   - Description
3. Click any image to view full-size in new tab

### Printing an Item:
1. Click the **print icon** (🖨️) next to any item
2. New window opens with print-ready layout
3. Click "Print" or use Ctrl+P / Cmd+P
4. On mobile: Print dialog opens automatically

### Viewing Codes:
- **Barcode Column**: Click to view full-size
- **QR Code Column**: Click to view full-size
- Both are also shown in the gallery modal

---

## 🔧 Technical Details

### File Locations:
- **Barcode/QR Images**: `backend/uploads/codes/`
- **Product Images**: `backend/uploads/` (S3 or local)

### Database Changes:
The inventory table now has:
- `barcode_image_url` - Generated barcode image path
- `qr_image_url` - Generated QR code image path
- `image_urls` - JSON array of up to 5 image URLs

### API Changes:
- `POST /api/inventory` - Now accepts `images[]` (multiple files)
- `PUT /api/inventory/:id` - Now accepts `images[]` (multiple files)
- Response includes `barcode_image_url` and `qr_image_url`

---

## 📱 Mobile Support

All features work seamlessly on mobile devices:

✅ **Gallery Modal**
- Touch-friendly
- Swipe to scroll
- Full-screen on mobile
- Tap to close

✅ **Print Function**
- Auto-triggers print dialog
- Mobile-optimized layout
- Works on iOS and Android

✅ **Image Upload**
- Mobile camera support
- Multi-select from gallery
- File preview

✅ **Code Display**
- Tap barcode/QR to view full-size
- Optimized size for mobile screens

---

## 🐛 Troubleshooting

**Codes not generating?**
- Check `backend/uploads/codes/` directory exists
- Verify `qrcode` and `bwip-js` packages are installed
- Check backend logs for errors

**Multiple images not uploading?**
- Max 5 images per item
- Accepted formats: JPEG, PNG, WebP
- Max file size: 5MB per image

**Print not working on mobile?**
- Ensure browser has print permissions
- Try different browser (Chrome, Safari)
- Check if popup blocker is enabled

**Gallery not opening?**
- Check browser console for errors
- Ensure images are accessible (correct URLs)
- Try refreshing the page

---

## 🎨 Customization

### Change Max Images:
In `backend/src/middleware/upload.js`:
```javascript
const uploadMultipleImages = upload.array('images', 5); // Change 5 to desired max
```

In `frontend/src/pages/Inventory.jsx`:
```javascript
const files = Array.from(e.target.files).slice(0, 5); // Change 5 to desired max
```

### Customize Barcode/QR Settings:
Edit `backend/src/services/codeGeneratorService.js` to adjust:
- QR code size, error correction, colors
- Barcode height, font size, margins

### Customize Print Layout:
Edit the `printItem` function in `frontend/src/pages/Inventory.jsx`

---

## 🚀 Next Steps

1. **Test the features** on your mobile device
2. **Add some inventory items** to see codes generate
3. **Upload multiple images** to test the gallery
4. **Try printing** an item from both desktop and mobile

Enjoy your enhanced inventory management system! 🎉
