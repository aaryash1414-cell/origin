# GulMehak Online Store

## Overview
GulMehak is an e-commerce website specializing in traditional Indian luxury garments including Kashmiri coats, Banarasi suits and sarees, Pashmina shawls, and Kota Doria sarees.

## Current Features
- User authentication (signup, login, logout)
- Product catalog with featured items
- Razorpay payment integration for secure transactions
- Order processing and verification
- Responsive design using Pico.css
- Session management for user accounts

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
- November 09, 2025: 
  - Logo added for email automation
  - Integrated Gmail (gulmehak201984@gmail.com) for sending order confirmation emails
  - Email utility created with order confirmation templates
  - Customers now receive automatic emails after successful payment from GulMehak Gmail
  - Shipping fee confirmed as ₹100 for India
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
- `server.js`: Main Express server with all API endpoints
- `public/`: Static files (HTML, CSS, JavaScript)
- `users.json`: User data storage
- `orders.json`: Order data storage
- Razorpay integration configured via environment variables
