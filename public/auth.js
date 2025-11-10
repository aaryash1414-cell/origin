let currentUser = null;
let razorpayKeyId = null;

function showMainView() {
  document.getElementById('mainView').style.display = 'block';
  document.getElementById('productsView').style.display = 'none';
  window.scrollTo(0, 0);
}

function showProductsView() {
  document.getElementById('mainView').style.display = 'none';
  document.getElementById('productsView').style.display = 'block';
  window.scrollTo(0, 0);
}

function scrollToSection(sectionId) {
  setTimeout(() => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 100);
}

async function getRazorpayKey() {
  try {
    const response = await fetch('/api/razorpay-key');
    const data = await response.json();
    razorpayKeyId = data.key;
  } catch (error) {
    console.error('Failed to get Razorpay key:', error);
  }
}

let currentProductId = null;
let currentAddressMode = 'structured';

function switchAddressMode(mode) {
  currentAddressMode = mode;
  const structuredFields = document.getElementById('structuredAddressFields');
  const manualFields = document.getElementById('manualAddressFields');
  const structuredBtn = document.getElementById('structuredModeBtn');
  const manualBtn = document.getElementById('manualModeBtn');
  
  if (mode === 'structured') {
    structuredFields.style.display = 'block';
    manualFields.style.display = 'none';
    structuredBtn.classList.add('active');
    manualBtn.classList.remove('active');
  } else {
    structuredFields.style.display = 'none';
    manualFields.style.display = 'block';
    structuredBtn.classList.remove('active');
    manualBtn.classList.add('active');
  }
}

function handleCountryChange() {
  const countrySelect = document.getElementById('shippingCountry');
  const manualInput = document.getElementById('manualCountryInput');
  
  if (countrySelect.value === 'Other') {
    manualInput.style.display = 'block';
    document.getElementById('manualCountry').required = true;
  } else {
    manualInput.style.display = 'none';
    document.getElementById('manualCountry').required = false;
    document.getElementById('manualCountry').value = '';
  }
}

function showAddressModal(productId) {
  currentProductId = productId;
  const modal = document.getElementById('addressModal');
  modal.style.display = 'block';
  
  if (currentUser) {
    document.getElementById('shippingName').value = currentUser.name;
    document.getElementById('shippingEmail').value = currentUser.email;
    document.getElementById('manualName').value = currentUser.name;
    document.getElementById('manualEmail').value = currentUser.email;
  }
}

function closeAddressModal() {
  document.getElementById('addressModal').style.display = 'none';
  document.getElementById('addressForm').reset();
  currentProductId = null;
  currentAddressMode = 'structured';
  switchAddressMode('structured');
}

async function submitAddress(event) {
  event.preventDefault();
  
  const quantity = parseInt(document.getElementById('orderQuantity').value);
  const productId = currentProductId;
  let shippingAddress;
  
  if (currentAddressMode === 'structured') {
    const countrySelect = document.getElementById('shippingCountry');
    const country = countrySelect.value === 'Other' 
      ? document.getElementById('manualCountry').value 
      : countrySelect.value;
    
    if (!document.getElementById('shippingName').value || 
        !document.getElementById('shippingEmail').value ||
        !document.getElementById('shippingPhone').value ||
        !document.getElementById('shippingAddress').value ||
        !document.getElementById('shippingCity').value ||
        !document.getElementById('shippingState').value ||
        !document.getElementById('shippingZip').value ||
        !country) {
      alert('Please fill in all required fields');
      return;
    }
    
    shippingAddress = {
      mode: 'structured',
      name: document.getElementById('shippingName').value,
      email: document.getElementById('shippingEmail').value,
      phone: document.getElementById('shippingPhone').value,
      address: document.getElementById('shippingAddress').value,
      city: document.getElementById('shippingCity').value,
      state: document.getElementById('shippingState').value,
      zip: document.getElementById('shippingZip').value,
      country: country
    };
  } else {
    if (!document.getElementById('manualName').value || 
        !document.getElementById('manualEmail').value ||
        !document.getElementById('manualPhone').value ||
        !document.getElementById('manualFullAddress').value) {
      alert('Please fill in all required fields');
      return;
    }
    
    shippingAddress = {
      mode: 'manual',
      name: document.getElementById('manualName').value,
      email: document.getElementById('manualEmail').value,
      phone: document.getElementById('manualPhone').value,
      fullAddress: document.getElementById('manualFullAddress').value
    };
  }

  closeAddressModal();
  await processPurchase(productId, shippingAddress, quantity);
}

async function buyProduct(productId) {
  if (!razorpayKeyId) {
    alert('Payment system is loading. Please try again in a moment.');
    return;
  }

  showAddressModal(productId);
}

async function processPurchase(productId, shippingAddress, quantity) {
  try {
    const orderResponse = await fetch('/api/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, shippingAddress, quantity })
    });

    if (!orderResponse.ok) {
      const errorData = await orderResponse.json();
      throw new Error(errorData.error || 'Failed to create order');
    }

    const orderData = await orderResponse.json();
    
    const shippingFeeDisplay = orderData.shippingFee > 0 
      ? `\nShipping Fee: ₹${(orderData.shippingFee / 100).toFixed(0)}`
      : '\nShipping: Free for International Orders';
    
    const description = `Quantity: ${orderData.quantity}\nProduct: ₹${(orderData.productPrice / 100).toFixed(0)} x ${orderData.quantity}${shippingFeeDisplay}\nTotal: ₹${(orderData.amount / 100).toFixed(0)}`;

    const options = {
      key: razorpayKeyId,
      amount: orderData.amount,
      currency: 'INR',
      name: 'GulMehak',
      description: description,
      image: '/epsit.jpeg',
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
            alert('Payment successful! Thank you for your purchase.\n\nYour order will be shipped to:\n' + 
                  shippingAddress.address + ', ' + shippingAddress.city + ', ' + shippingAddress.state + 
                  '\n\nOrder ID: ' + response.razorpay_order_id + 
                  '\nPayment ID: ' + response.razorpay_payment_id);
          } else {
            alert('Payment verification failed. Please contact support with your payment ID: ' + response.razorpay_payment_id);
          }
        } catch (error) {
          alert('Payment verification error. Please contact support.');
          console.error('Verification error:', error);
        }
      },
      prefill: {
        name: shippingAddress.name,
        email: currentUser ? currentUser.email : '',
        contact: shippingAddress.phone
      },
      theme: {
        color: '#6b2d2d'
      },
      modal: {
        ondismiss: function() {
          console.log('Payment cancelled by user');
        }
      }
    };

    if (typeof Razorpay === 'undefined') {
      throw new Error('Payment system not loaded. Please refresh the page and try again.');
    }

    const rzp = new Razorpay(options);
    rzp.open();
  } catch (error) {
    alert('Failed to initiate payment: ' + error.message);
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
