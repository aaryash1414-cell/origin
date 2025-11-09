const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const app = express();
const PORT = 5000;
const USERS_FILE = path.join(__dirname, 'data', 'users.json');
const ORDERS_FILE = path.join(__dirname, 'data', 'orders.json');
const SESSION_SECRET = process.env.SESSION_SECRET || 'poshaak-session-secret-' + Date.now();

let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
}

const PRODUCTS = {
  'kashmiri-coat': { name: 'Kashmiri Coat', price: 449900 },
  'banarasi-suit': { name: 'Banarasi Suit', price: 529900 },
  'banarasi-sari': { name: 'Banarasi Sari', price: 579900 },
  'pashmina-shawl': { name: 'Pashmina Shawl', price: 639900 },
  'kota-doria-sari': { name: 'Kota Doria Sari', price: 419900 },
  'kashmiri-sari': { name: 'Kashmiri Sari', price: 559900 },
  'kashmiri-suit': { name: 'Kashmiri Suit', price: 489900 },
  'shawl': { name: 'Shawl', price: 599900 }
};

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

  const { productId } = req.body;

  if (!productId || !PRODUCTS[productId]) {
    return res.status(400).json({ error: 'Invalid product' });
  }

  const product = PRODUCTS[productId];

  try {
    const options = {
      amount: product.price,
      currency: 'INR',
      receipt: 'order_' + Date.now(),
      notes: {
        productId: productId,
        productName: product.name
      }
    };

    const order = await razorpay.orders.create(options);
    
    pendingOrders.set(order.id, {
      productId,
      productName: product.name,
      amount: product.price,
      userId: req.session.userId || 'guest',
      userEmail: req.session.userEmail || 'unknown',
      createdAt: new Date().toISOString()
    });

    res.json({ orderId: order.id, amount: order.amount });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

app.post('/api/verify-payment', (req, res) => {
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
      productId: pendingOrder.productId,
      productName: pendingOrder.productName,
      amount: pendingOrder.amount,
      userId: pendingOrder.userId,
      userEmail: pendingOrder.userEmail,
      status: 'paid',
      createdAt: pendingOrder.createdAt,
      paidAt: new Date().toISOString()
    };
    orders.push(newOrder);
    writeOrders(orders);

    pendingOrders.delete(razorpay_order_id);

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
