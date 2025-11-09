let currentUser = null;
let razorpayKeyId = null;

async function getRazorpayKey() {
  try {
    const response = await fetch('/api/razorpay-key');
    const data = await response.json();
    razorpayKeyId = data.key;
  } catch (error) {
    console.error('Failed to get Razorpay key:', error);
  }
}

async function buyProduct(productId) {
  if (!razorpayKeyId) {
    alert('Payment system is loading. Please try again in a moment.');
    return;
  }

  try {
    const orderResponse = await fetch('/api/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId })
    });

    if (!orderResponse.ok) {
      throw new Error('Failed to create order');
    }

    const orderData = await orderResponse.json();

    const options = {
      key: razorpayKeyId,
      amount: orderData.amount,
      currency: 'INR',
      name: 'GulMehak',
      description: 'Product Purchase',
      image: '/hero-image.jpg',
      order_id: orderData.orderId,
      handler: async function (response) {
        try {
          const verifyResponse = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            })
          });

          const verifyData = await verifyResponse.json();

          if (verifyResponse.ok && verifyData.success) {
            alert('Payment successful! Thank you for your purchase.\n\nOrder ID: ' + response.razorpay_order_id + '\nPayment ID: ' + response.razorpay_payment_id);
          } else {
            alert('Payment verification failed. Please contact support with your payment ID: ' + response.razorpay_payment_id);
          }
        } catch (error) {
          alert('Payment verification error. Please contact support.');
          console.error('Verification error:', error);
        }
      },
      prefill: {
        name: currentUser ? currentUser.name : '',
        email: currentUser ? currentUser.email : ''
      },
      theme: {
        color: '#6b2d2d'
      }
    };

    const rzp = new Razorpay(options);
    rzp.open();
  } catch (error) {
    alert('Failed to initiate payment. Please try again.');
    console.error('Payment initiation error:', error);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  getRazorpayKey();
  checkAuthStatus();
  
  const modal = document.getElementById('authModal');
  const accountLink = document.getElementById('accountLink');
  const closeBtn = document.querySelector('.close');
  
  accountLink.addEventListener('click', (e) => {
    e.preventDefault();
    modal.style.display = 'block';
  });
  
  closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
  });
  
  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });
});

async function checkAuthStatus() {
  try {
    const response = await fetch('/api/check-auth');
    const data = await response.json();
    
    if (data.authenticated) {
      currentUser = data.user;
      updateUIForAuthenticatedUser(data.user);
    } else {
      currentUser = null;
      updateUIForGuest();
    }
  } catch (error) {
    console.error('Auth check failed:', error);
    updateUIForGuest();
  }
}

function updateUIForAuthenticatedUser(user) {
  document.getElementById('userName').textContent = user.name;
  document.getElementById('userEmail').textContent = user.email;
  document.getElementById('loginForm').style.display = 'none';
  document.getElementById('signupForm').style.display = 'none';
  document.getElementById('accountView').style.display = 'block';
  document.getElementById('authTabs').style.display = 'none';
}

function updateUIForGuest() {
  document.getElementById('loginForm').style.display = 'block';
  document.getElementById('signupForm').style.display = 'none';
  document.getElementById('accountView').style.display = 'none';
  document.getElementById('authTabs').style.display = 'flex';
}

function showTab(tab) {
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const tabButtons = document.querySelectorAll('.tab-button');
  
  tabButtons.forEach(btn => btn.classList.remove('active'));
  
  if (tab === 'login') {
    loginForm.style.display = 'block';
    signupForm.style.display = 'none';
    tabButtons[0].classList.add('active');
    clearErrors();
  } else {
    loginForm.style.display = 'none';
    signupForm.style.display = 'block';
    tabButtons[1].classList.add('active');
    clearErrors();
  }
}

function clearErrors() {
  document.getElementById('loginError').textContent = '';
  document.getElementById('signupError').textContent = '';
}

async function handleLogin(event) {
  event.preventDefault();
  
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const errorElement = document.getElementById('loginError');
  
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await response.json();
    
    if (response.ok) {
      currentUser = data.user;
      updateUIForAuthenticatedUser(data.user);
      errorElement.textContent = '';
      event.target.reset();
    } else {
      errorElement.textContent = data.error || 'Login failed';
    }
  } catch (error) {
    errorElement.textContent = 'An error occurred. Please try again.';
    console.error('Login error:', error);
  }
}

async function handleSignup(event) {
  event.preventDefault();
  
  const name = document.getElementById('signupName').value;
  const email = document.getElementById('signupEmail').value;
  const password = document.getElementById('signupPassword').value;
  const errorElement = document.getElementById('signupError');
  
  try {
    const response = await fetch('/api/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password }),
    });
    
    const data = await response.json();
    
    if (response.ok) {
      currentUser = data.user;
      updateUIForAuthenticatedUser(data.user);
      errorElement.textContent = '';
      event.target.reset();
    } else {
      errorElement.textContent = data.error || 'Signup failed';
    }
  } catch (error) {
    errorElement.textContent = 'An error occurred. Please try again.';
    console.error('Signup error:', error);
  }
}

async function handleLogout() {
  try {
    const response = await fetch('/api/logout', {
      method: 'POST',
    });
    
    if (response.ok) {
      currentUser = null;
      updateUIForGuest();
      showTab('login');
      document.getElementById('authModal').style.display = 'none';
    }
  } catch (error) {
    console.error('Logout error:', error);
  }
}
