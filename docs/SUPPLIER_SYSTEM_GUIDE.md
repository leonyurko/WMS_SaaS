# Supplier Management System - User Guide

## Overview
The Supplier Management System allows your warehouse to manage supplier information, create modular email templates, and place orders directly through the system with email notifications.

## Features Implemented

### 1. **Suppliers Page** (`/suppliers`)
**Access Level:** Admin & Manager

#### What You Can Do:
- **View All Suppliers**: See complete list with contact details
- **Search Suppliers**: Filter by name, email, or contact person
- **Add New Supplier**: Create supplier records with:
  - Supplier name
  - Email address
  - Phone number
  - Contact person name
  - Physical address
  - Notes/additional information
  
- **Edit Suppliers**: Update existing supplier information
- **Delete Suppliers**: Remove suppliers (with confirmation)

#### Place an Order:
1. Click **"Place an Order"** button next to any supplier
2. Select an item from your inventory
3. Enter the quantity needed
4. Choose an email format template (created by admin)
5. Add optional notes
6. **Preview the email** - see how variables are replaced with actual values
7. Click **"Confirm & Send"** to send the order email

**Variables Replaced Automatically:**
- `{userName}` - Your name
- `{companyName}` - Your company name
- `{supplierName}` - Supplier's name
- `{contactPerson}` - Supplier's contact person
- `{itemName}` - Selected inventory item
- `{quantity}` - Order quantity
- `{notes}` - Your custom notes

### 2. **Email Formats Page** (`/email-formats`)
**Access Level:** Admin Only

#### What You Can Do:
- **Create Email Templates**: Build reusable email formats with variables
- **Edit Templates**: Update existing format structure
- **Delete Templates**: Remove unused formats
- **Preview Templates**: See how each template looks with sample data

#### Available Variables:
Use these in your email subject and body:
- `{userName}` - Name of the user placing the order
- `{companyName}` - Your company's name
- `{supplierName}` - Supplier's business name
- `{contactPerson}` - Supplier's contact person
- `{itemName}` - Product being ordered
- `{quantity}` - Amount being ordered
- `{notes}` - Additional notes from the order

#### Creating a Format:
1. Click **"Add Format"**
2. Enter a descriptive name (e.g., "Standard Order Request")
3. Write the email subject (can include variables)
4. Write the email body using the variable buttons for easy insertion
5. Click **"Create Format"**

**Example Email Body:**
```
Hello,

I'm {userName} from {companyName}. 

We would like to place an order for {quantity} units of {itemName}.

{notes}

Please confirm availability and expected delivery time.

Best regards,
{userName}
{companyName}
```

## Database Structure

### Tables Created:

#### `suppliers`
- `id` (UUID, Primary Key)
- `name` - Supplier business name
- `email` - Contact email
- `phone` - Contact phone
- `contact_person` - Main contact name
- `address` - Physical address
- `notes` - Additional information
- `created_at`, `updated_at` - Timestamps

#### `email_formats`
- `id` (UUID, Primary Key)
- `name` - Template name
- `subject` - Email subject line
- `body` - Email body content
- `format_type` - Type (default: 'order')
- `created_by` - User ID who created it
- `created_at`, `updated_at` - Timestamps

#### `supplier_orders`
- `id` (UUID, Primary Key)
- `supplier_id` - Reference to supplier
- `inventory_id` - Reference to inventory item
- `quantity` - Order amount
- `status` - Order status (default: 'pending')
- `ordered_by` - User ID who placed order
- `notes` - Order notes
- `email_sent_at` - Timestamp of email
- `created_at` - Order creation time

## Workflow Example

### Admin Setup (One-time):
1. Navigate to **Email Formats** (Admin only)
2. Create templates like:
   - "Standard Order Request"
   - "Urgent Restock Order"
   - "Quote Request"
3. Each template can have different tone and structure

### Manager/Admin Daily Use:
1. Navigate to **Suppliers**
2. Add suppliers as needed
3. When stock is low, click **"Place an Order"**
4. The system:
   - Lets you choose the item
   - Lets you set quantity
   - Shows available email formats
   - Previews the complete email with real values
   - Sends the email to supplier
   - Logs the order in database

### Benefits:
✅ **Consistency** - All orders follow professional templates
✅ **Speed** - No manual email writing
✅ **Tracking** - All orders logged with timestamps
✅ **Flexibility** - Multiple templates for different situations
✅ **Automation** - Variables auto-fill with real data

## Navigation

The sidebar now includes:
- **Suppliers** (Admin & Manager) - Manage suppliers and place orders
- **Email Formats** (Admin only) - Create and manage email templates

## Technical Details

### Frontend Components:
- `frontend/src/pages/Suppliers.jsx` - Supplier management UI
- `frontend/src/pages/EmailFormats.jsx` - Template management UI

### Backend Services:
- `backend/src/services/supplierService.js` - Supplier business logic
- `backend/src/services/emailFormatService.js` - Template processing

### Backend Controllers:
- `backend/src/controllers/supplierController.js` - HTTP handlers
- `backend/src/controllers/emailFormatController.js` - Template endpoints

### API Routes:
- `GET /api/suppliers` - List all suppliers
- `POST /api/suppliers` - Create supplier (Admin)
- `PUT /api/suppliers/:id` - Update supplier (Admin)
- `DELETE /api/suppliers/:id` - Delete supplier (Admin)
- `POST /api/suppliers/:id/order` - Place order (Manager+)
- `GET /api/email-formats` - List templates (Admin)
- `POST /api/email-formats` - Create template (Admin)
- `PUT /api/email-formats/:id` - Update template (Admin)
- `DELETE /api/email-formats/:id` - Delete template (Admin)

## Security

- **Authentication Required**: All endpoints require login
- **Role-Based Access**:
  - Suppliers CRUD: Admin only
  - Place Orders: Manager & Admin
  - Email Formats: Admin only
- **Email Validation**: Supplier emails validated
- **SQL Injection Protection**: Parameterized queries
- **Order Logging**: All orders tracked with user ID and timestamp

## Next Steps

### To Start Using:
1. ✅ Database migration applied
2. ✅ Backend routes registered
3. ✅ Frontend pages created
4. ✅ Navigation updated
5. **Test the flow:**
   - Login as Admin
   - Go to Email Formats
   - Create your first template
   - Go to Suppliers
   - Add a supplier
   - Place a test order
   - Check email delivery

### Recommended First Template:
```
Name: Standard Order Request
Subject: Order Request from {companyName}
Body:
Dear {contactPerson},

I hope this message finds you well. I'm {userName} from {companyName}, and I would like to place an order for the following item:

Product: {itemName}
Quantity: {quantity} units

{notes}

Could you please confirm the availability and provide an estimated delivery date?

Thank you for your continued partnership.

Best regards,
{userName}
{companyName}
```

## Troubleshooting

### Email Not Sending?
1. Check backend environment variables for email configuration
2. Verify supplier email is valid
3. Check backend logs: `docker logs wms-backend`

### Can't See Suppliers Page?
- Ensure you're logged in as Admin or Manager
- Check sidebar - it should appear between "Inventory History" and "Email Formats"

### Variables Not Replacing?
- Ensure you're using exact syntax: `{variableName}` (curly braces, no spaces)
- Check the preview before sending - it shows the final result

## Support

For technical issues or questions:
1. Check backend logs: `docker logs wms-backend`
2. Check frontend console: Browser DevTools → Console
3. Verify database tables exist: See "Database Structure" section
