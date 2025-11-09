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
    shippingFee,
    totalAmount,
    orderId,
    shippingAddress
  } = orderData;
  
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
        <span>Quantity: 1</span>
        <span class="price">₹${(productPrice / 100).toLocaleString('en-IN')}</span>
      </div>
    </div>
    
    <div style="margin-top: 15px;">
      <div style="display: flex; justify-content: space-between; padding: 5px 0;">
        <span>Subtotal:</span>
        <span>₹${(productPrice / 100).toLocaleString('en-IN')}</span>
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
    <p style="margin: 5px 0;">${shippingAddress.address}</p>
    <p style="margin: 5px 0;">${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zip}</p>
    <p style="margin: 5px 0;">${shippingAddress.country}</p>
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
Quantity: 1
Price: ₹${(productPrice / 100).toLocaleString('en-IN')}

Subtotal: ₹${(productPrice / 100).toLocaleString('en-IN')}
Shipping Fee: ₹${(shippingFee / 100).toLocaleString('en-IN')}
--------------
TOTAL: ₹${(totalAmount / 100).toLocaleString('en-IN')}

SHIPPING ADDRESS:
${shippingAddress.name}
${shippingAddress.address}
${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zip}
${shippingAddress.country}
Phone: ${shippingAddress.phone}

Your order will be carefully packaged and shipped to you soon. We'll send you a tracking number once it's on its way.

If you have any questions about your order, please don't hesitate to contact us at gulmehak201984@gmail.com

GulMehak
Premium Traditional Indian Garments
Thank you for choosing GulMehak!
  `;
  
  return { htmlContent, textContent };
}

module.exports = { createOrderConfirmationEmail };
