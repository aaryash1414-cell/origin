const fs = require('fs');
const path = require('path');

function getLogoBase64() {
  try {
    const logoPath = path.join(__dirname, '..', 'attached_assets/IMG_0339_1762661100334.jpeg');
    const logoBuffer = fs.readFileSync(logoPath);
    return logoBuffer.toString('base64');
  } catch (error) {
    console.log('Could not read logo file');
    return '';
  }
}

function createOrderConfirmationEmail(orderData) {
  const {
    customerName,
    productName,
    productPrice,
    quantity,
    shippingFee,
    totalAmount,
    orderId,
    shippingAddress
  } = orderData;
  
  const qty = quantity || 1;
  
  const logoBase64 = getLogoBase64();
  
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: 'Arial', sans-serif;
      line-height: 1.6;
      color: #2b2b2b;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      padding: 20px 0;
      border-bottom: 2px solid #6b2d2d;
    }
    .logo {
      max-width: 200px;
      height: auto;
    }
    .title {
      color: #6b2d2d;
      font-size: 24px;
      margin: 20px 0;
    }
    .order-details {
      background-color: #f5ebe0;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .product-item {
      border-bottom: 1px solid #ddd;
      padding: 15px 0;
    }
    .product-name {
      font-size: 18px;
      font-weight: bold;
      color: #6b2d2d;
    }
    .price {
      color: #6b2d2d;
      font-weight: bold;
    }
    .total {
      font-size: 20px;
      font-weight: bold;
      color: #6b2d2d;
      text-align: right;
      padding-top: 15px;
      border-top: 2px solid #6b2d2d;
      margin-top: 15px;
    }
    .shipping-address {
      background-color: #fff;
      padding: 15px;
      border-left: 3px solid #6b2d2d;
      margin: 15px 0;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      color: #666;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="header">
    ${logoBase64 ? `<img src="data:image/jpeg;base64,${logoBase64}" alt="GulMehak Logo" class="logo">` : '<h1 style="font-family: Georgia, serif; color: #6b2d2d; letter-spacing: 2px;">GULMEHAK</h1>'}
  </div>
  
  <h2 class="title">Order Confirmation</h2>
  
  <p>Dear ${customerName},</p>
  
  <p>Thank you for your order! We're excited to bring you this beautiful piece from our collection.</p>
  
  <div class="order-details">
    <h3 style="margin-top: 0; color: #6b2d2d;">Order Details</h3>
    <p style="margin: 5px 0;"><strong>Order ID:</strong> ${orderId}</p>
    
    <div class="product-item">
      <div class="product-name">${productName}</div>
      <div style="display: flex; justify-content: space-between; margin-top: 10px;">
        <span>Unit Price: ₹${(productPrice / 100).toLocaleString('en-IN')}</span>
        <span>Quantity: ${qty}</span>
      </div>
    </div>
    
    <div style="margin-top: 15px;">
      <div style="display: flex; justify-content: space-between; padding: 5px 0;">
        <span>Subtotal (₹${(productPrice / 100).toLocaleString('en-IN')} x ${qty}):</span>
        <span>₹${((productPrice * qty) / 100).toLocaleString('en-IN')}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 5px 0;">
        <span>Shipping Fee:</span>
        <span>₹${(shippingFee / 100).toLocaleString('en-IN')}</span>
      </div>
    </div>
    
    <div class="total">
      Total: ₹${(totalAmount / 100).toLocaleString('en-IN')}
    </div>
  </div>
  
  <div class="shipping-address">
    <h4 style="margin-top: 0; color: #6b2d2d;">Shipping Address:</h4>
    <p style="margin: 5px 0;">${shippingAddress.name}</p>
    ${shippingAddress.mode === 'manual' 
      ? `<p style="margin: 5px 0; white-space: pre-line;">${shippingAddress.fullAddress}</p>`
      : `<p style="margin: 5px 0;">${shippingAddress.address}</p>
         <p style="margin: 5px 0;">${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zip}</p>
         <p style="margin: 5px 0;">${shippingAddress.country}</p>`
    }
    <p style="margin: 5px 0;">Phone: ${shippingAddress.phone}</p>
  </div>
  
  <p>Your order will be carefully packaged and shipped to you soon. We'll send you a tracking number once it's on its way.</p>
  
  <p>If you have any questions about your order, please don't hesitate to contact us at <a href="mailto:gulmehak201984@gmail.com" style="color: #6b2d2d;">gulmehak201984@gmail.com</a></p>
  
  <div class="footer">
    <p><strong>GulMehak</strong><br>
    Premium Traditional Indian Garments<br>
    Thank you for choosing GulMehak!</p>
  </div>
</body>
</html>
  `;
  
  const textContent = `
Order Confirmation

Dear ${customerName},

Thank you for your order! We're excited to bring you this beautiful piece from our collection.

ORDER DETAILS
--------------
Order ID: ${orderId}

Product: ${productName}
Unit Price: ₹${(productPrice / 100).toLocaleString('en-IN')}
Quantity: ${qty}

Subtotal: ₹${((productPrice * qty) / 100).toLocaleString('en-IN')}
Shipping Fee: ₹${(shippingFee / 100).toLocaleString('en-IN')}
--------------
TOTAL: ₹${(totalAmount / 100).toLocaleString('en-IN')}

SHIPPING ADDRESS:
${shippingAddress.name}
${shippingAddress.mode === 'manual' 
  ? shippingAddress.fullAddress
  : `${shippingAddress.address}\n${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zip}\n${shippingAddress.country}`
}
Phone: ${shippingAddress.phone}

Your order will be carefully packaged and shipped to you soon. We'll send you a tracking number once it's on its way.

If you have any questions about your order, please don't hesitate to contact us at gulmehak201984@gmail.com

GulMehak
Premium Traditional Indian Garments
Thank you for choosing GulMehak!
  `;
  
  return { htmlContent, textContent };
}

function createAdminOrderNotificationEmail(orderData) {
  const {
    customerName,
    customerEmail,
    customerPhone,
    productName,
    subtotal,
    quantity,
    shippingFee,
    totalAmount,
    orderId,
    paymentId,
    shippingAddress
  } = orderData;
  
  const qty = quantity || 1;
  
  const addressText = shippingAddress.mode === 'manual' 
    ? shippingAddress.fullAddress
    : `${shippingAddress.address}, ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zip}, ${shippingAddress.country}`;
  
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: 'Arial', sans-serif;
      line-height: 1.6;
      color: #2b2b2b;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: #6b2d2d;
      color: white;
      padding: 20px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .content {
      background-color: #f5f5f5;
      padding: 20px;
      border-radius: 0 0 8px 8px;
    }
    .section {
      background-color: white;
      padding: 15px;
      margin: 10px 0;
      border-radius: 5px;
      border-left: 4px solid #6b2d2d;
    }
    .section-title {
      font-weight: bold;
      color: #6b2d2d;
      margin-bottom: 10px;
      font-size: 16px;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 5px 0;
      border-bottom: 1px solid #eee;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .label {
      font-weight: bold;
      color: #555;
    }
    .value {
      color: #333;
    }
    .total-row {
      background-color: #6b2d2d;
      color: white;
      padding: 10px 15px;
      border-radius: 5px;
      margin-top: 15px;
      display: flex;
      justify-content: space-between;
      font-size: 18px;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="header">
    <h2>New Order Received!</h2>
    <p>Order ID: ${orderId}</p>
  </div>
  
  <div class="content">
    <div class="section">
      <div class="section-title">Customer Details</div>
      <div class="detail-row">
        <span class="label">Name:</span>
        <span class="value">${customerName}</span>
      </div>
      <div class="detail-row">
        <span class="label">Email:</span>
        <span class="value">${customerEmail}</span>
      </div>
      <div class="detail-row">
        <span class="label">Phone:</span>
        <span class="value">${customerPhone}</span>
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">Shipping Address</div>
      <p style="margin: 0; white-space: pre-line;">${addressText}</p>
    </div>
    
    <div class="section">
      <div class="section-title">Order Details</div>
      <div class="detail-row">
        <span class="label">Products:</span>
        <span class="value">${productName}</span>
      </div>
      <div class="detail-row">
        <span class="label">Quantity:</span>
        <span class="value">${qty}</span>
      </div>
      <div class="detail-row">
        <span class="label">Subtotal:</span>
        <span class="value">Rs ${(subtotal / 100).toLocaleString('en-IN')}</span>
      </div>
      <div class="detail-row">
        <span class="label">Shipping Fee:</span>
        <span class="value">Rs ${(shippingFee / 100).toLocaleString('en-IN')}</span>
      </div>
    </div>
    
    <div class="total-row">
      <span>Total Amount:</span>
      <span>Rs ${(totalAmount / 100).toLocaleString('en-IN')}</span>
    </div>
    
    <div class="section" style="margin-top: 15px;">
      <div class="section-title">Payment Details</div>
      <div class="detail-row">
        <span class="label">Payment ID:</span>
        <span class="value">${paymentId}</span>
      </div>
      <div class="detail-row">
        <span class="label">Status:</span>
        <span class="value" style="color: green; font-weight: bold;">PAID</span>
      </div>
    </div>
  </div>
</body>
</html>
  `;
  
  const textContent = `
NEW ORDER RECEIVED!
====================

Order ID: ${orderId}
Payment ID: ${paymentId}
Status: PAID

CUSTOMER DETAILS
-----------------
Name: ${customerName}
Email: ${customerEmail}
Phone: ${customerPhone}

SHIPPING ADDRESS
-----------------
${addressText}

ORDER DETAILS
--------------
Products: ${productName}
Quantity: ${qty}
Subtotal: Rs ${(subtotal / 100).toLocaleString('en-IN')}
Shipping Fee: Rs ${(shippingFee / 100).toLocaleString('en-IN')}
--------------
TOTAL: Rs ${(totalAmount / 100).toLocaleString('en-IN')}
  `;
  
  return { htmlContent, textContent };
}

module.exports = { createOrderConfirmationEmail, createAdminOrderNotificationEmail };
