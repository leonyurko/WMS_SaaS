# Implementation Plan

- [x] 1. Set up project structure and initialize both frontend and backend


  - Create root directory structure with backend/ and frontend/ folders
  - Initialize backend Node.js project with TypeScript configuration
  - Initialize frontend React project with Vite and TypeScript
  - Configure Tailwind CSS in frontend project
  - Set up ESLint and Prettier for code quality
  - Create .env.example files for both projects
  - _Requirements: All requirements depend on proper project setup_





- [ ] 2. Set up database schema and connection
  - [ ] 2.1 Create PostgreSQL database schema file
    - Write SQL schema with users, categories, inventory, and transactions tables


    - Add indexes for performance optimization
    - Create database view for low stock items
    - Add triggers for automatic timestamp updates


    - _Requirements: 1.1, 2.1, 4.2, 7.1, 8.2, 10.3_
  - [ ] 2.2 Implement database connection module
    - Create database configuration with connection pooling




    - Implement connection error handling
    - Add database health check function
    - _Requirements: 12.1_


  - [ ] 2.3 Create database seed data script
    - Write seed script for initial categories
    - Create default admin user with hashed password


    - Add sample inventory items for testing
    - _Requirements: 8.2, 8.6, 10.3_

- [x] 3. Implement backend authentication system




  - [ ] 3.1 Create user model and authentication utilities
    - Implement password hashing with bcrypt
    - Create JWT token generation and validation functions
    - Write user model with database queries
    - _Requirements: 1.1, 1.2, 8.6_
  - [ ] 3.2 Build authentication middleware
    - Create JWT token validation middleware
    - Implement role-based authorization middleware


    - Add request validation middleware using Joi
    - _Requirements: 1.3, 1.4, 1.5, 1.6_
  - [ ] 3.3 Implement authentication routes and controllers
    - Create POST /api/auth/login endpoint
    - Create POST /api/auth/register endpoint (Admin only)
    - Create GET /api/auth/me endpoint
    - Add authentication error handling
    - _Requirements: 1.1, 1.2, 8.2, 12.3, 12.4_

- [ ] 4. Implement inventory management backend
  - [ ] 4.1 Create inventory service layer
    - Implement getAllInventory with filtering and pagination
    - Implement getInventoryById method




    - Implement getInventoryByBarcode method
    - Implement createInventory method
    - Implement updateInventory method


    - Implement deleteInventory method
    - Implement updateStock method with transaction creation
    - Implement getLowStockItems method




    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 4.1, 4.2, 5.1, 6.4_
  - [ ] 4.2 Create inventory routes and controllers
    - Create GET /api/inventory endpoint with search and filters
    - Create GET /api/inventory/:id endpoint


    - Create GET /api/inventory/barcode/:code endpoint
    - Create POST /api/inventory endpoint with role check
    - Create PUT /api/inventory/:id endpoint with role check
    - Create DELETE /api/inventory/:id endpoint (Admin only)


    - Create POST /api/inventory/:id/stock endpoint
    - Add proper error handling for all endpoints
    - _Requirements: 2.1, 2.2, 2.3, 2.5, 3.1, 3.2, 3.3, 3.5, 4.1, 4.3, 4.4, 6.3, 6.4, 12.2, 12.3, 12.4_
  - [x]* 4.3 Write unit tests for inventory service




    - Test inventory CRUD operations
    - Test stock update with transaction creation
    - Test filtering and pagination logic
    - _Requirements: 2.1, 3.1, 4.1_



- [ ] 5. Implement barcode generation system
  - [ ] 5.1 Create barcode service
    - Implement QR code generation using qrcode library
    - Create unique barcode generation logic
    - Add barcode validation function
    - _Requirements: 3.3, 6.2, 6.3_
  - [ ] 5.2 Integrate barcode generation with inventory creation
    - Automatically generate barcode when creating new product




    - Store barcode in database
    - Return barcode data in API response
    - _Requirements: 3.3_



- [ ] 6. Implement image upload system
  - [ ] 6.1 Set up AWS S3 configuration
    - Create S3 client configuration
    - Implement S3 upload function




    - Implement S3 delete function
    - Add S3 error handling
    - _Requirements: 9.2, 9.3_
  - [ ] 6.2 Create image service and upload middleware
    - Configure Multer for multipart form handling
    - Implement image file validation (format and size)


    - Create image upload service using S3
    - Add image URL generation
    - _Requirements: 9.1, 9.2, 9.3, 9.6_
  - [x] 6.3 Integrate image upload with inventory endpoints




    - Add image upload to POST /api/inventory
    - Add image upload to PUT /api/inventory/:id
    - Handle image replacement (delete old, upload new)
    - Return image URL in responses


    - _Requirements: 3.4, 9.4, 9.5_

- [x] 7. Implement transaction tracking system




  - [ ] 7.1 Create transaction service layer
    - Implement createTransaction method
    - Implement getTransactions with filtering and pagination
    - Implement getTransactionById method


    - Implement getRecentTransactions method
    - _Requirements: 4.2, 7.1, 7.2, 11.3_
  - [x] 7.2 Create transaction routes and controllers




    - Create GET /api/transactions endpoint with filters (Manager/Admin only)
    - Create GET /api/transactions/:id endpoint (Manager/Admin only)
    - Add date range filtering
    - Add product and user filtering
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ]* 7.3 Write unit tests for transaction service
    - Test transaction creation
    - Test filtering by date, product, and user
    - Test pagination




    - _Requirements: 4.2, 7.1_

- [ ] 8. Implement email notification system
  - [ ] 8.1 Create email service
    - Configure AWS SES or SendGrid client

    - Implement sendEmail function
    - Create HTML email template for low stock alerts
    - Add email error handling and logging
    - _Requirements: 5.2, 5.3, 5.5_




  - [ ] 8.2 Implement scheduled low stock check
    - Configure node-cron for daily execution
    - Create cron job to query low stock items
    - Generate and send email when items are below threshold
    - Log email sending results
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_



- [ ] 9. Implement user management system
  - [ ] 9.1 Create user service layer
    - Implement getAllUsers method
    - Implement getUserById method


    - Implement createUser method with password hashing
    - Implement updateUser method (role and status)
    - Implement deleteUser method
    - Add user count validation (max 10 users)
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_


  - [ ] 9.2 Create user routes and controllers
    - Create GET /api/users endpoint (Admin only)
    - Create PUT /api/users/:id endpoint (Admin only)




    - Create DELETE /api/users/:id endpoint (Admin only)
    - Add proper authorization checks
    - _Requirements: 8.1, 8.2, 8.3, 8.4_



- [ ] 10. Implement dashboard metrics system
  - [ ] 10.1 Create dashboard service
    - Implement getTotalProducts method
    - Implement getLowStockCount method


    - Implement getRecentTransactionsCount method
    - Implement getOutOfStockCount method
    - _Requirements: 11.1, 11.2, 11.3, 11.4_




  - [ ] 10.2 Create dashboard routes and controllers
    - Create GET /api/dashboard/metrics endpoint


    - Optimize query performance for dashboard data
    - Add caching for dashboard metrics
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_



- [ ] 11. Implement category management system
  - [ ] 11.1 Create category service layer
    - Implement getAllCategories method
    - Implement getCategoryById method

    - Implement createCategory method
    - Support hierarchical parent-child relationships
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  - [ ] 11.2 Create category routes and controllers
    - Create GET /api/categories endpoint
    - Create POST /api/categories endpoint (Manager/Admin only)
    - Return categories with subcategories
    - _Requirements: 10.1, 10.2, 10.4_


- [ ] 12. Implement global error handling
  - [ ] 12.1 Create error classes and error handler middleware
    - Create AppError base class

    - Create specific error classes (ValidationError, AuthenticationError, etc.)
    - Implement global error handler middleware
    - Add error logging
    - Format error responses consistently
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_
  - [x] 12.2 Integrate error handling across all routes

    - Wrap async route handlers with error catching
    - Use appropriate error classes in services
    - Test error scenarios
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ] 13. Create backend server entry point
  - [x] 13.1 Set up Express application

    - Configure Express with middleware (cors, body-parser, helmet)
    - Register all route modules
    - Add global error handler
    - Create server startup script
    - Add graceful shutdown handling
    - _Requirements: All backend requirements_
  - [x] 13.2 Create health check endpoint

    - Implement GET /health endpoint
    - Check database connectivity
    - Return system status
    - _Requirements: 12.1_

- [ ] 14. Build frontend authentication system
  - [x] 14.1 Create authentication service and API client

    - Set up Axios instance with base URL
    - Implement login API call
    - Implement logout function
    - Implement token storage in localStorage
    - Add request interceptor to attach JWT token
    - Add response interceptor for 401 handling
    - _Requirements: 1.1, 1.2, 12.3_
  - [ ] 14.2 Create authentication state management
    - Set up Zustand store for auth state
    - Implement login action
    - Implement logout action
    - Implement getCurrentUser action
    - Store user info and role
    - _Requirements: 1.1, 1.2_
  - [ ] 14.3 Build login page component
    - Create login form with username and password fields
    - Add form validation
    - Handle login submission
    - Display error messages
    - Redirect to dashboard on success
    - _Requirements: 1.1, 1.2_
  - [ ] 14.4 Create protected route component
    - Implement route guard to check authentication
    - Redirect to login if not authenticated
    - Check user role for authorization
    - _Requirements: 1.3, 1.4, 1.5, 1.6_

- [ ] 15. Build frontend layout components
  - [ ] 15.1 Create Sidebar component
    - Implement navigation menu with icons
    - Add active route highlighting
    - Show/hide menu items based on user role
    - Make responsive for mobile
    - _Requirements: 1.4, 1.5, 1.6_
  - [ ] 15.2 Create Header component
    - Display page title
    - Show user avatar and name
    - Add notification bell icon
    - Implement logout button
    - _Requirements: 1.1_
  - [ ] 15.3 Create main Layout component
    - Combine Sidebar and Header
    - Add content area with routing
    - Make responsive layout
    - _Requirements: All UI requirements_

- [ ] 16. Build dashboard page
  - [ ] 16.1 Create dashboard API service
    - Implement fetchDashboardMetrics API call
    - Handle loading and error states
    - _Requirements: 11.1, 11.2, 11.3, 11.4_
  - [ ] 16.2 Create KPI Card component
    - Display metric title, value, and icon
    - Add color-coded styling
    - Make responsive
    - _Requirements: 11.1, 11.2, 11.3, 11.4_
  - [ ] 16.3 Build Dashboard page component
    - Fetch dashboard metrics on mount
    - Display four KPI cards (total products, low stock, recent transactions, out of stock)
    - Add loading state
    - Add error handling
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 17. Build inventory management pages
  - [ ] 17.1 Create inventory API service
    - Implement fetchInventory with filters and pagination
    - Implement fetchInventoryById
    - Implement createInventory with image upload
    - Implement updateInventory with image upload
    - Implement deleteInventory
    - Implement updateStock
    - Implement fetchInventoryByBarcode
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 4.1, 6.4, 9.4_
  - [ ] 17.2 Create inventory state management
    - Set up Zustand store for inventory list
    - Implement actions for CRUD operations
    - Handle loading and error states
    - _Requirements: 2.1, 3.1, 4.1_
  - [ ] 17.3 Create InventoryTable component
    - Display inventory items in table format
    - Show SKU, name, quantity, status badge
    - Add color-coded status indicators
    - Implement click to view details
    - Add sorting functionality
    - _Requirements: 2.1, 2.3, 2.4_
  - [ ] 17.4 Create InventoryList page component
    - Fetch and display inventory on mount
    - Add search input with filtering
    - Add category filter dropdown
    - Add status filter dropdown
    - Implement pagination controls
    - Add "Add Product" button (Manager/Admin only)
    - _Requirements: 2.1, 2.2, 2.5, 3.1, 3.2_
  - [ ] 17.5 Create ProductForm component
    - Build form with all product fields
    - Add image upload with preview
    - Implement form validation
    - Handle create and edit modes
    - Show loading state during submission
    - Display success/error messages
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 9.1, 9.4, 9.5_
  - [ ] 17.6 Create ProductDetail page component
    - Fetch and display product details
    - Show product image
    - Display all product information
    - Add "Edit" button (Manager/Admin only)
    - Add "Delete" button (Admin only)
    - Add "Update Stock" button
    - _Requirements: 2.3, 3.1, 3.2, 3.3, 9.4_
  - [ ] 17.7 Create StockUpdateModal component
    - Create modal with quantity input
    - Add reason text field

    - Add transaction type selector (addition/deduction)
    - Show current stock and calculate new stock
    - Handle submission
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 18. Build barcode scanner page

  - [ ] 18.1 Create scanner component
    - Integrate html5-qrcode library
    - Request camera permissions
    - Display camera feed
    - Detect and decode barcodes
    - Handle scan success and errors
    - Add manual barcode entry input
    - _Requirements: 6.1, 6.2, 6.3, 6.5, 6.6_
  - [ ] 18.2 Build Scanner page component
    - Initialize scanner on mount
    - Search product by scanned barcode
    - Display product details when found
    - Show error message if not found
    - Allow stock update from scanner page
    - Add cleanup on unmount
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [ ] 19. Build transaction history page
  - [x] 19.1 Create transaction API service

    - Implement fetchTransactions with filters
    - Add date range filtering
    - Add product filtering
    - Add user filtering

    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  - [ ] 19.2 Create TransactionList component
    - Display transactions in table format
    - Show timestamp, product, user, quantity, reason

    - Add color coding for transaction types
    - Implement sorting
    - _Requirements: 7.1, 7.2_
  - [ ] 19.3 Build Transactions page component
    - Fetch transactions on mount (Manager/Admin only)
    - Add date range picker filter
    - Add product filter dropdown
    - Add user filter dropdown

    - Implement pagination
    - Add export functionality
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_



- [ ] 20. Build user management page
  - [ ] 20.1 Create user API service
    - Implement fetchUsers
    - Implement createUser
    - Implement updateUser
    - Implement deleteUser
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
  - [ ] 20.2 Create UserList component
    - Display users in table format
    - Show username, email, role, status
    - Add "Edit" button for each user
    - Add "Deactivate" button for each user
    - _Requirements: 8.1, 8.3, 8.4_
  - [ ] 20.3 Create UserForm component
    - Build form for user creation
    - Add username, email, password, role fields
    - Implement validation
    - Handle submission
    - _Requirements: 8.2, 8.5_
  - [ ] 20.4 Build Users page component (Admin only)
    - Fetch and display users on mount
    - Add "Add User" button
    - Show user count (max 10)
    - Handle user creation
    - Handle user updates
    - Handle user deactivation
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 21. Build category management
  - [ ] 21.1 Create category API service
    - Implement fetchCategories
    - Implement createCategory
    - _Requirements: 10.1, 10.2_
  - [ ] 21.2 Create category selector component
    - Display categories in dropdown
    - Support parent-child relationships
    - Show subcategories when parent selected
    - _Requirements: 10.1, 10.2, 10.4, 10.5_
  - [ ] 21.3 Integrate category selector in ProductForm
    - Add category dropdown to form
    - Add subcategory dropdown to form
    - Update on category selection
    - _Requirements: 10.1, 10.2_

- [ ] 22. Implement frontend error handling and notifications
  - [ ] 22.1 Create toast notification system
    - Build Toast component for messages
    - Create toast context and provider
    - Add success, error, warning, info variants
    - Implement auto-dismiss
    - _Requirements: 12.2, 12.3, 12.4_
  - [ ] 22.2 Integrate error handling in API client
    - Add response interceptor for error handling
    - Show toast notifications for errors
    - Handle 401 redirects
    - Handle 403 permission errors
    - Handle 500 server errors
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_
  - [ ] 22.3 Add loading states across application
    - Create Loading component
    - Add loading states to all data fetching
    - Show skeleton loaders where appropriate
    - _Requirements: 11.5_

- [ ] 23. Set up routing and navigation
  - [ ] 23.1 Configure React Router
    - Set up BrowserRouter
    - Define all application routes
    - Implement protected routes
    - Add role-based route guards
    - Handle 404 not found page
    - _Requirements: 1.3, 1.4, 1.5, 1.6_
  - [ ] 23.2 Implement navigation logic
    - Add navigation to Sidebar links
    - Implement programmatic navigation after actions
    - Add breadcrumbs for nested pages
    - _Requirements: All UI requirements_

- [ ] 24. Implement responsive design
  - [ ] 24.1 Make layout responsive
    - Add mobile hamburger menu for Sidebar
    - Make tables responsive with horizontal scroll
    - Adjust KPI cards for mobile layout
    - Test on different screen sizes
    - _Requirements: All UI requirements_
  - [ ] 24.2 Optimize for mobile barcode scanning
    - Ensure camera works on mobile devices
    - Make scanner UI mobile-friendly
    - Test on iOS and Android devices
    - _Requirements: 6.1, 6.2, 6.3_

- [ ] 25. Create Docker configuration
  - [ ] 25.1 Create backend Dockerfile
    - Write multi-stage Dockerfile for Node.js
    - Optimize for production build
    - Set up proper environment variables
    - _Requirements: All backend requirements_
  - [ ] 25.2 Create frontend Dockerfile
    - Write multi-stage Dockerfile for React build
    - Use nginx for serving static files
    - Configure nginx for SPA routing
    - _Requirements: All frontend requirements_
  - [ ] 25.3 Create docker-compose.yml
    - Configure PostgreSQL service
    - Configure backend service
    - Configure frontend service
    - Set up service dependencies
    - Add volume mounts for development
    - _Requirements: All requirements_

- [ ] 26. Create environment configuration files
  - [ ] 26.1 Create backend .env.example
    - Document all required environment variables
    - Add comments explaining each variable
    - Include database, AWS, email, JWT settings
    - _Requirements: All backend requirements_
  - [ ] 26.2 Create frontend .env.example
    - Document VITE_API_URL variable
    - Add any other frontend config
    - _Requirements: All frontend requirements_

- [ ] 27. Write project documentation
  - [ ] 27.1 Create API documentation
    - Document all API endpoints
    - Include request/response examples
    - Document authentication requirements
    - Add error response examples
    - _Requirements: All API requirements_
  - [ ]* 27.2 Create deployment guide
    - Document local setup steps
    - Document Docker setup
    - Document AWS deployment steps
    - Add troubleshooting section
    - _Requirements: All requirements_
  - [ ]* 27.3 Create user guide
    - Document how to use each feature
    - Add screenshots of UI
    - Include barcode scanning instructions
    - _Requirements: All user-facing requirements_

- [ ] 28. Final integration and testing
  - [ ] 28.1 Test complete user workflows
    - Test login and authentication flow
    - Test product creation with image upload
    - Test stock updates via scanner
    - Test transaction history viewing
    - Test user management (Admin)
    - Test low stock email alerts
    - _Requirements: All requirements_
  - [ ] 28.2 Verify role-based access control
    - Test Admin permissions
    - Test Manager permissions
    - Test Staff permissions
    - Verify unauthorized access is blocked
    - _Requirements: 1.3, 1.4, 1.5, 1.6_
  - [ ] 28.3 Performance optimization
    - Optimize database queries with indexes
    - Add API response caching where appropriate
    - Optimize image loading
    - Test with 10 concurrent users
    - _Requirements: 11.5_
  - [ ]* 28.4 Security audit
    - Test for SQL injection vulnerabilities
    - Test for XSS vulnerabilities
    - Verify JWT token security
    - Test file upload validation
    - Verify password hashing
    - _Requirements: 8.6, 9.1, 9.6, 12.6_
