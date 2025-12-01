const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { sendGmailEmail } = require('./utils/gmailClient');
const { createOrderConfirmationEmail, createAdminOrderNotificationEmail } = require('./utils/emailTemplates');

const app = express();
const PORT = process.env.PORT || 5000;
const USERS_FILE = path.join(__dirname, 'data', 'users.json');
const ORDERS_FILE = path.join(__dirname, 'data', 'orders.json');
const CARTS_FILE = path.join(__dirname, 'data', 'carts.json');
const SESSION_SECRET = process.env.SESSION_SECRET || 'poshaak-session-secret-' + Date.now();

let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
}

const PRODUCTS = {
  'kashmiri-coat': { name: 'Kashmiri Coat', price: 300000 },
  'banarasi-suit': { name: 'Banarasi Suit', price: 250000 },
  'banarasi-sari': { name: 'Banarasi Sari', price: 300000 },
  'pashmina-shawl': { name: 'Pashmina Shawl', price: 500000 },
  'kota-doria-sari': { name: 'Kota Doria Sari', price: 210000 },
  'kashmiri-sari': { name: 'Kashmiri Sari', price: 1100000 },
  'kashmiri-suit': { name: 'Kashmiri Suit', price: 350000 },
  'shawl': { name: 'Shawl', price: 450000 },
  'banarsi-cotton-chanderi-suit': { name: 'Banarsi Cotton Chanderi Suit', price: 160000 }
};

const SHIPPING_FEE_INDIA = 10000;
const SHIPPING_FEE_WORLDWIDE = 50000;
const ADMIN_EMAILS = ['dhar.e2@gmail.com', 'gulmehak201984@gmail.com'];

const pendingOrders = new Map();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

app.use(express.static('public'));

function readUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading users file:', error);
  }
  return [];
}

function writeUsers(users) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Error writing users file:', error);
  }
}

function readOrders() {
  try {
    if (fs.existsSync(ORDERS_FILE)) {
      const data = fs.readFileSync(ORDERS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading orders file:', error);
  }
  return [];
}

function writeOrders(orders) {
  try {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
  } catch (error) {
    console.error('Error writing orders file:', error);
  }
}

function readCarts() {
  try {
    if (fs.existsSync(CARTS_FILE)) {
      const data = fs.readFileSync(CARTS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading carts file:', error);
  }
  return {};
}

function writeCarts(carts) {
  try {
    fs.writeFileSync(CARTS_FILE, JSON.stringify(carts, null, 2));
  } catch (error) {
    console.error('Error writing carts file:', error);
  }
}

app.post('/api/signup', async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const users = readUsers();
  
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ error: 'Email already registered' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = {
    id: Date.now().toString(),
    email,
    name,
    password: hashedPassword,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  writeUsers(users);

  req.session.userId = newUser.id;
  req.session.userEmail = newUser.email;
  req.session.userName = newUser.name;

  res.json({ 
    success: true, 
    user: { id: newUser.id, email: newUser.email, name: newUser.name }
  });
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const users = readUsers();
  const user = users.find(u => u.email === email);

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  
  if (!isValidPassword) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  req.session.userId = user.id;
  req.session.userEmail = user.email;
  req.session.userName = user.name;

  const carts = readCarts();
  const sessionCart = req.session.cart || [];
  const userCart = carts[user.id] || [];
  
  if (sessionCart.length > 0) {
    sessionCart.forEach(sessionItem => {
      const existingItem = userCart.find(item => item.productId === sessionItem.productId);
      if (existingItem) {
        existingItem.quantity = Math.min(existingItem.quantity + sessionItem.quantity, 10);
      } else {
        userCart.push(sessionItem);
      }
    });
  }
  
  req.session.cart = userCart;
  carts[user.id] = userCart;
  writeCarts(carts);

  res.json({ 
    success: true, 
    user: { id: user.id, email: user.email, name: user.name }
  });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to logout' });
    }
    res.json({ success: true });
  });
});

app.get('/api/check-auth', (req, res) => {
  if (req.session.userId) {
    res.json({ 
      authenticated: true, 
      user: { 
        id: req.session.userId, 
        email: req.session.userEmail, 
        name: req.session.userName 
      }
    });
  } else {
    res.json({ authenticated: false });
  }
});

app.get('/api/cart', (req, res) => {
  if (!req.session.cart) {
    req.session.cart = [];
  }
  
  if (req.session.userId) {
    const carts = readCarts();
    const userCart = carts[req.session.userId] || [];
    req.session.cart = userCart;
  }
  
  res.json({ cart: req.session.cart });
});

app.post('/api/cart/add', (req, res) => {
  const { productId, quantity } = req.body;
  
  if (!productId || !PRODUCTS[productId]) {
    return res.status(400).json({ error: 'Invalid product' });
  }
  
  const qty = quantity || 1;
  if (qty < 1 || qty > 10) {
    return res.status(400).json({ error: 'Quantity must be between 1 and 10' });
  }
  
  if (!req.session.cart) {
    req.session.cart = [];
  }
  
  const existingItem = req.session.cart.find(item => item.productId === productId);
  if (existingItem) {
    existingItem.quantity = Math.min(existingItem.quantity + qty, 10);
  } else {
    req.session.cart.push({
      productId,
      quantity: qty,
      addedAt: new Date().toISOString()
    });
  }
  
  if (req.session.userId) {
    const carts = readCarts();
    carts[req.session.userId] = req.session.cart;
    writeCarts(carts);
  }
  
  res.json({ success: true, cart: req.session.cart });
});

app.put('/api/cart/update', (req, res) => {
  const { productId, quantity } = req.body;
  
  if (!productId || !PRODUCTS[productId]) {
    return res.status(400).json({ error: 'Invalid product' });
  }
  
  if (quantity < 1 || quantity > 10) {
    return res.status(400).json({ error: 'Quantity must be between 1 and 10' });
  }
  
  if (!req.session.cart) {
    req.session.cart = [];
  }
  
  const item = req.session.cart.find(item => item.productId === productId);
  if (item) {
    item.quantity = quantity;
  }
  
  if (req.session.userId) {
    const carts = readCarts();
    carts[req.session.userId] = req.session.cart;
    writeCarts(carts);
  }
  
  res.json({ success: true, cart: req.session.cart });
});

app.delete('/api/cart/remove', (req, res) => {
  const { productId } = req.body;
  
  if (!req.session.cart) {
    req.session.cart = [];
  }
  
  req.session.cart = req.session.cart.filter(item => item.productId !== productId);
  
  if (req.session.userId) {
    const carts = readCarts();
    carts[req.session.userId] = req.session.cart;
    writeCarts(carts);
  }
  
  res.json({ success: true, cart: req.session.cart });
});

app.post('/api/cart/clear', (req, res) => {
  req.session.cart = [];
  
  if (req.session.userId) {
    const carts = readCarts();
    carts[req.session.userId] = [];
    writeCarts(carts);
  }
  
  res.json({ success: true });
});

app.post('/api/cart/checkout', async (req, res) => {
  if (!razorpay) {
    return res.status(503).json({ error: 'Payment system not configured' });
  }

  const { selectedProductIds, shippingAddress } = req.body;

  if (!shippingAddress || !shippingAddress.name || !shippingAddress.email || !shippingAddress.phone) {
    return res.status(400).json({ error: 'Name, email and phone are required' });
  }

  if (shippingAddress.mode === 'manual') {
    if (!shippingAddress.fullAddress) {
      return res.status(400).json({ error: 'Complete address is required' });
    }
  } else {
    if (!shippingAddress.address || !shippingAddress.city || !shippingAddress.state || 
        !shippingAddress.zip || !shippingAddress.country) {
      return res.status(400).json({ error: 'Complete shipping address required' });
    }
  }

  if (!req.session.cart || req.session.cart.length === 0) {
    return res.status(400).json({ error: 'Cart is empty' });
  }

  let itemsToCheckout = req.session.cart;
  if (selectedProductIds && selectedProductIds.length > 0) {
    itemsToCheckout = req.session.cart.filter(item => selectedProductIds.includes(item.productId));
  }

  if (itemsToCheckout.length === 0) {
    return res.status(400).json({ error: 'No items selected for checkout' });
  }

  let subtotal = 0;
  const orderItems = [];

  for (const item of itemsToCheckout) {
    const product = PRODUCTS[item.productId];
    if (!product) {
      return res.status(400).json({ error: `Invalid product: ${item.productId}` });
    }
    subtotal += product.price * item.quantity;
    orderItems.push({
      productId: item.productId,
      productName: product.name,
      productPrice: product.price,
      quantity: item.quantity
    });
  }

  let shippingFee = 0;
  if (shippingAddress.mode === 'manual') {
    const addressLower = shippingAddress.fullAddress.toLowerCase();
    shippingFee = addressLower.includes('india') ? SHIPPING_FEE_INDIA : SHIPPING_FEE_WORLDWIDE;
  } else {
    shippingFee = shippingAddress.country.toLowerCase() === 'india' ? SHIPPING_FEE_INDIA : SHIPPING_FEE_WORLDWIDE;
  }

  const totalAmount = subtotal + shippingFee;

  try {
    const options = {
      amount: totalAmount,
      currency: 'INR',
      receipt: 'cart_order_' + Date.now(),
      notes: {
        orderType: 'cart',
        itemCount: orderItems.length,
        shippingCountry: shippingAddress.country || 'Manual Entry'
      }
    };

    const order = await razorpay.orders.create(options);

    pendingOrders.set(order.id, {
      orderType: 'cart',
      items: orderItems,
      subtotal,
      shippingFee,
      amount: totalAmount,
      shippingAddress,
      userId: req.session.userId || 'guest',
      userEmail: req.session.userEmail || 'unknown',
      createdAt: new Date().toISOString()
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      items: orderItems,
      subtotal,
      shippingFee
    });
  } catch (error) {
    console.error('Error creating cart order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

app.get('/api/razorpay-key', (req, res) => {
  if (!razorpay) {
    return res.status(503).json({ error: 'Payment system not configured' });
  }
  res.json({ key: process.env.RAZORPAY_KEY_ID });
});

app.post('/api/create-order', async (req, res) => {
  if (!razorpay) {
    return res.status(503).json({ error: 'Payment system not configured' });
  }

  const { productId, shippingAddress, quantity } = req.body;

  if (!productId || !PRODUCTS[productId]) {
    return res.status(400).json({ error: 'Invalid product' });
  }

  if (!shippingAddress || !shippingAddress.name || !shippingAddress.email || !shippingAddress.phone) {
    return res.status(400).json({ error: 'Name, email and phone are required' });
  }

  // Validate based on address mode
  if (shippingAddress.mode === 'manual') {
    if (!shippingAddress.fullAddress) {
      return res.status(400).json({ error: 'Complete address is required' });
    }
  } else {
    if (!shippingAddress.address || !shippingAddress.city || !shippingAddress.state || 
        !shippingAddress.zip || !shippingAddress.country) {
      return res.status(400).json({ error: 'Complete shipping address required' });
    }
  }

  const orderQuantity = quantity || 1;
  if (orderQuantity < 1 || orderQuantity > 10) {
    return res.status(400).json({ error: 'Quantity must be between 1 and 10' });
  }

  const product = PRODUCTS[productId];
  
  // Determine shipping fee based on country
  let shippingFee = 0;
  if (shippingAddress.mode === 'manual') {
    // For manual addresses, check if "India" appears in the address
    const addressLower = shippingAddress.fullAddress.toLowerCase();
    shippingFee = addressLower.includes('india') ? SHIPPING_FEE_INDIA : SHIPPING_FEE_WORLDWIDE;
  } else {
    shippingFee = shippingAddress.country.toLowerCase() === 'india' ? SHIPPING_FEE_INDIA : SHIPPING_FEE_WORLDWIDE;
  }
  
  const totalAmount = (product.price * orderQuantity) + shippingFee;

  try {
    const options = {
      amount: totalAmount,
      currency: 'INR',
      receipt: 'order_' + Date.now(),
      notes: {
        productId: productId,
        productName: product.name,
        shippingCountry: shippingAddress.country
      }
    };

    const order = await razorpay.orders.create(options);
    
    pendingOrders.set(order.id, {
      productId,
      productName: product.name,
      productPrice: product.price,
      quantity: orderQuantity,
      shippingFee,
      amount: totalAmount,
      shippingAddress,
      userId: req.session.userId || 'guest',
      userEmail: req.session.userEmail || 'unknown',
      createdAt: new Date().toISOString()
    });

    res.json({ 
      orderId: order.id, 
      amount: order.amount,
      productPrice: product.price,
      quantity: orderQuantity,
      shippingFee: shippingFee
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

app.post('/api/verify-payment', async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: 'Missing payment verification details' });
  }

  const pendingOrder = pendingOrders.get(razorpay_order_id);
  if (!pendingOrder) {
    return res.status(400).json({ error: 'Order not found or already processed' });
  }

  const body = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest('hex');

  if (expectedSignature === razorpay_signature) {
    const orders = readOrders();
    
    const newOrder = {
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      orderType: pendingOrder.orderType || 'single',
      productId: pendingOrder.productId,
      productName: pendingOrder.productName,
      productPrice: pendingOrder.productPrice,
      quantity: pendingOrder.quantity,
      items: pendingOrder.items,
      subtotal: pendingOrder.subtotal,
      shippingFee: pendingOrder.shippingFee,
      amount: pendingOrder.amount,
      shippingAddress: pendingOrder.shippingAddress,
      userId: pendingOrder.userId,
      userEmail: pendingOrder.userEmail,
      status: 'paid',
      createdAt: pendingOrder.createdAt,
      paidAt: new Date().toISOString()
    };
    orders.push(newOrder);
    writeOrders(orders);

    pendingOrders.delete(razorpay_order_id);

    if (pendingOrder.orderType === 'cart' && req.session.cart) {
      const selectedIds = pendingOrder.items.map(item => item.productId);
      req.session.cart = req.session.cart.filter(item => !selectedIds.includes(item.productId));
      
      if (req.session.userId) {
        const carts = readCarts();
        carts[req.session.userId] = req.session.cart;
        writeCarts(carts);
      }
    }

    // Send order confirmation email
    try {
      let emailData;
      if (pendingOrder.orderType === 'cart') {
        const itemsList = pendingOrder.items.map(item => 
          `${item.productName} x ${item.quantity}`
        ).join(', ');
        emailData = {
          customerName: pendingOrder.shippingAddress.name,
          productName: itemsList,
          productPrice: pendingOrder.subtotal,
          quantity: pendingOrder.items.reduce((sum, item) => sum + item.quantity, 0),
          shippingFee: pendingOrder.shippingFee,
          totalAmount: pendingOrder.amount,
          orderId: razorpay_order_id,
          shippingAddress: pendingOrder.shippingAddress
        };
      } else {
        emailData = {
          customerName: pendingOrder.shippingAddress.name,
          productName: pendingOrder.productName,
          productPrice: pendingOrder.productPrice,
          quantity: pendingOrder.quantity,
          shippingFee: pendingOrder.shippingFee,
          totalAmount: pendingOrder.amount,
          orderId: razorpay_order_id,
          shippingAddress: pendingOrder.shippingAddress
        };
      }
      
      const { htmlContent, textContent } = createOrderConfirmationEmail(emailData);

      await sendGmailEmail({
        to: pendingOrder.shippingAddress.email,
        subject: 'Order Confirmation - GulMehak',
        html: htmlContent,
        text: textContent
      });

      console.log('Order confirmation email sent to:', pendingOrder.shippingAddress.email);
    } catch (emailError) {
      console.error('Failed to send order confirmation email:', emailError);
      // Don't fail the payment verification if email fails
    }

    // Send admin notification emails
    try {
      const adminEmailData = {
        customerName: pendingOrder.shippingAddress.name,
        customerEmail: pendingOrder.shippingAddress.email,
        customerPhone: pendingOrder.shippingAddress.phone,
        productName: pendingOrder.orderType === 'cart' 
          ? pendingOrder.items.map(item => `${item.productName} x ${item.quantity}`).join(', ')
          : pendingOrder.productName,
        subtotal: pendingOrder.orderType === 'cart' 
          ? pendingOrder.subtotal 
          : (pendingOrder.productPrice * pendingOrder.quantity),
        quantity: pendingOrder.orderType === 'cart' 
          ? pendingOrder.items.reduce((sum, item) => sum + item.quantity, 0)
          : pendingOrder.quantity,
        shippingFee: pendingOrder.shippingFee,
        totalAmount: pendingOrder.amount,
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        shippingAddress: pendingOrder.shippingAddress
      };
      
      const { htmlContent: adminHtml, textContent: adminText } = createAdminOrderNotificationEmail(adminEmailData);
      
      // Send to all admin emails
      for (const adminEmail of ADMIN_EMAILS) {
        await sendGmailEmail({
          to: adminEmail,
          subject: `New Order Received - ${pendingOrder.shippingAddress.name} - GulMehak`,
          html: adminHtml,
          text: adminText
        });
        console.log('Admin notification email sent to:', adminEmail);
      }
    } catch (adminEmailError) {
      console.error('Failed to send admin notification emails:', adminEmailError);
      // Don't fail the payment verification if admin email fails
    }

    res.json({ success: true, message: 'Payment verified successfully' });
  } else {
    res.status(400).json({ error: 'Invalid payment signature' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  
  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  if (!fs.existsSync(USERS_FILE)) {
    writeUsers([]);
  }
  
  if (!fs.existsSync(ORDERS_FILE)) {
    writeOrders([]);
  }
});
