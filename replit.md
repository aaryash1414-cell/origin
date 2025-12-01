# GulMehak Online Store

## Overview
GulMehak is an e-commerce website specializing in traditional Indian luxury garments including Kashmiri coats, Banarasi suits and sarees, Pashmina shawls, and Kota Doria sarees.

## Current Features
- User authentication (signup, login, logout)
- Product catalog with featured items
- Shopping cart functionality with persistence
- Product detail modals with images and descriptions
- Add to cart and buy now options
- Cart management (view, update quantities, remove items, select items for checkout)
- Razorpay payment integration for secure transactions (supports UPI, cards, netbanking, wallets)
- Order processing and verification
- Responsive design using Pico.css
- Session management for user accounts
- Cart persistence for logged-in users

## Product Catalog
- Kashmiri Coat - ₹3,000
- Banarasi Suit - ₹2,500
- Banarasi Sari - ₹3,000
- Pashmina Shawl - ₹5,000
- Kota Doria Sari - ₹2,100
- Kashmiri Sari - ₹11,000
- Kashmiri Suit - ₹3,500
- Shawl - ₹4,500

## Technology Stack
- Backend: Node.js with Express
- Payment: Razorpay
- Authentication: bcryptjs with express-session
- Frontend: HTML, CSS (Pico.css), JavaScript
- Data Storage: JSON files for users and orders

## Branding Assets
- Logo: `attached_assets/IMG_0339_1762661100334.jpeg` (purple saree silhouette design)
- Logo to be used in automated emails when implemented

## Recent Changes
- December 01, 2025:
  - Updated shipping fees:
    * India: ₹100
    * Worldwide/International: ₹500
  - Added admin notification emails for every order
    * Automated emails sent to dhar.e2@gmail.com and gulmehak201984@gmail.com
    * Includes customer name, email, phone, address, products, quantities, prices, shipping, total, payment ID
  - Admin notification email template with professional formatting
  - Removed "Free for International Orders" messaging (all orders now have shipping fees)
  
- November 11, 2025:
  - Complete shopping cart system implemented
  - Added product detail modals showing full product information (description, price, image)
  - Product images now clickable to view details
  - Added "Add to Cart" button alongside "Buy Now" in shop section
  - Shopping cart icon in navigation with item count badge
  - Cart modal with item selection, quantity controls, and remove options
  - Checkout options: "Buy Selected" or "Buy All" from cart
  - Cart persistence for logged-in users (stored in carts.json)
  - Guest cart syncs with user cart on login
  - Cart automatically clears purchased items after successful payment
  - Changed "View Details" to "Buy Now" in featured collection
  - UPI payment option enabled by default through Razorpay
  - Cart backend API endpoints: /api/cart, /api/cart/add, /api/cart/update, /api/cart/remove, /api/cart/clear, /api/cart/checkout
  
- November 09, 2025: 
  - Logo added for email automation
  - Integrated Gmail (gulmehak201984@gmail.com) for sending order confirmation emails
  - Email utility created with order confirmation templates
  - Customers now receive automatic emails after successful payment from GulMehak Gmail
  - Initial shipping fee structure implemented
  - Added business Instagram (@gulmehak14) and contact email to footer
  - Updated footer with social links and contact information
  - Added quantity selector (1-10) in checkout
  - Implemented dual-mode address entry system:
    * Structured form with dropdown for common countries (India, USA, UK, etc.) + manual country entry
    * Manual freeform text area option for complete address entry
    * Customers can switch between modes with toggle buttons
  - Backend and email templates updated to handle both address formats
  - Shipping fee automatically determined based on country (India vs International)

## User Preferences
- None specified yet

## Project Architecture
- `server.js`: Main Express server with all API endpoints (auth, cart, payment)
- `public/`: Static files (HTML, CSS, JavaScript)
- `public/auth.js`: Client-side authentication, cart management, and payment logic
- `public/index.html`: Main HTML with product displays, modals, and cart UI
- `public/style.css`: Complete styling including cart and product detail modals
- `data/users.json`: User data storage
- `data/orders.json`: Order data storage (supports both single and cart orders)
- `data/carts.json`: Shopping cart persistence for logged-in users
- Razorpay integration configured via environment variables
- Session-based cart for guests, file-based persistence for authenticated users
