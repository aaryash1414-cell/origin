const { sendGmailEmail } = require('./utils/gmailClient');
const fs = require('fs');
const path = require('path');

async function sendExampleOrderEmail() {
  const recipientEmail = 'nishankn.ankita@gmail.com';
  
  const product = {
    name: 'Kashmiri Coat',
    price: 3000,
    quantity: 1
  };
  
  const shippingFee = 100;
  const total = product.price + shippingFee;
  
  const logoPath = path.join(__dirname, 'attached_assets/IMG_0339_1762661100334.jpeg');
  let logoBase64 = '';
  
  try {
    const logoBuffer = fs.readFileSync(logoPath);
    logoBase64 = logoBuffer.toString('base64');
  } catch (error) {
    console.log('Could not read logo file, continuing without it');
  }
  
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
  
  <p>Dear Valued Customer,</p>
  
  <p>Thank you for your order! We're excited to bring you this beautiful Kashmiri Coat from our premium collection.</p>
  
  <div class="order-details">
    <h3 style="margin-top: 0; color: #6b2d2d;">Order Details</h3>
    <p style="margin: 5px 0;"><strong>Order ID:</strong> TEST-ORDER-${Date.now()}</p>
    
    <div class="product-item">
      <div class="product-name">${product.name}</div>
      <div style="display: flex; justify-content: space-between; margin-top: 10px;">
        <span>Quantity: ${product.quantity}</span>
        <span class="price">Rs ${product.price.toLocaleString('en-IN')}</span>
      </div>
    </div>
    
    <div style="margin-top: 15px;">
      <div style="display: flex; justify-content: space-between; padding: 5px 0;">
        <span>Subtotal:</span>
        <span>Rs ${product.price.toLocaleString('en-IN')}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 5px 0;">
        <span>Shipping Fee:</span>
        <span>Rs ${shippingFee.toLocaleString('en-IN')}</span>
      </div>
    </div>
    
    <div class="total">
      Total: Rs ${total.toLocaleString('en-IN')}
    </div>
  </div>
  
  <div style="background-color: #fff; padding: 15px; border-left: 3px solid #6b2d2d; margin: 15px 0;">
    <h4 style="margin-top: 0; color: #6b2d2d;">Shipping Address:</h4>
    <p style="margin: 5px 0;">Test Customer</p>
    <p style="margin: 5px 0;">123 Test Street</p>
    <p style="margin: 5px 0;">New Delhi, Delhi 110001</p>
    <p style="margin: 5px 0;">India</p>
    <p style="margin: 5px 0;">Phone: +91 9876543210</p>
  </div>
  
  <p>Your beautiful Kashmiri Coat will be carefully packaged and shipped to you soon. We'll send you a tracking number once it's on its way.</p>
  
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

Dear Valued Customer,

Thank you for your order! We're excited to bring you this beautiful Kashmiri Coat from our premium collection.

ORDER DETAILS
--------------
Order ID: TEST-ORDER-${Date.now()}

Product: ${product.name}
Quantity: ${product.quantity}
Price: Rs ${product.price.toLocaleString('en-IN')}

Subtotal: Rs ${product.price.toLocaleString('en-IN')}
Shipping Fee: Rs ${shippingFee.toLocaleString('en-IN')}
--------------
TOTAL: Rs ${total.toLocaleString('en-IN')}

SHIPPING ADDRESS:
Test Customer
123 Test Street
New Delhi, Delhi 110001
India
Phone: +91 9876543210

Your beautiful Kashmiri Coat will be carefully packaged and shipped to you soon. We'll send you a tracking number once it's on its way.

If you have any questions about your order, please don't hesitate to contact us at gulmehak201984@gmail.com

GulMehak
Premium Traditional Indian Garments
Thank you for choosing GulMehak!
  `;
  
  try {
    console.log('Sending Kashmiri Coat order confirmation email to:', recipientEmail);
    
    const result = await sendGmailEmail({
      to: recipientEmail,
      subject: 'Order Confirmation - Kashmiri Coat - GulMehak',
      html: htmlContent,
      text: textContent
    });
    
    console.log('Email sent successfully!');
    console.log('Accepted:', result.accepted);
    console.log('Message ID:', result.messageId);
    
  } catch (error) {
    console.error('Failed to send email:', error.message);
    throw error;
  }
}

sendExampleOrderEmail()
  .then(() => {
    console.log('\nEmail sending completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nError:', error);
    process.exit(1);
  });
