let currentUser = null;
let razorpayKeyId = null;
let cart = [];
let currentDetailProductId = null;

const PRODUCTS_DATA = {
  'kashmiri-coat': { name: 'Kashmiri Coat', price: 3000, description: 'Exquisite handwoven Kashmiri coat featuring traditional embroidery and premium fabric. Perfect for special occasions.', image: 'kashmiri-coat.jpeg' },
  'banarasi-suit': { name: 'Banarasi Suit', price: 2500, description: 'Beautiful Banarasi suit with intricate silk work. A timeless piece showcasing Indian craftsmanship.', image: 'banarasi-suit.jpeg' },
  'banarasi-sari': { name: 'Banarasi Sari', price: 3000, description: 'Exquisite Banarasi silk sari with traditional brocade work. A masterpiece of Indian craftsmanship and heritage.', image: 'banarasi-sari.jpeg' },
  'pashmina-shawl': { name: 'Pashmina Shawl', price: 5000, description: 'Luxurious handwoven Pashmina shawl, featuring intricate embroidery and timeless elegance. Perfect for any occasion.', image: 'pashmina-shawl.jpeg' },
  'kota-doria-sari': { name: 'Kota Doria Sari', price: 2100, description: 'Light and airy Kota Doria sari with delicate patterns. Comfortable yet elegant for everyday wear.', image: 'kota-doria-sari.jpeg' },
  'kashmiri-sari': { name: 'Kashmiri Sari', price: 11000, description: 'Premium Kashmiri sari with exquisite hand embroidery. A luxurious statement piece for special occasions.', image: 'kashmiri-sari.jpeg' },
  'kashmiri-suit': { name: 'Kashmiri Suit', price: 3500, description: 'Elegant Kashmiri suit with delicate embroidery and premium fabric. Comfort meets sophistication in this piece.', image: 'kashmiri-suit.jpeg' },
  'shawl': { name: 'Shawl', price: 4500, description: 'Premium quality shawl with traditional patterns. Perfect accessory for any outfit.', image: 'shawl.jpeg' }
};

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

  const checkoutIds = currentCartCheckoutIds;
  const quantity = parseInt(document.getElementById('orderQuantity').value);
  const productId = currentProductId;
  
  closeAddressModal();
  
  if (checkoutIds) {
    await processCartCheckout(checkoutIds, shippingAddress);
  } else {
    await processPurchase(productId, shippingAddress, quantity);
  }
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
  loadCart();
  
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
      await loadCart();
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
      cart = [];
      updateCartBadge();
      updateUIForGuest();
      showTab('login');
      document.getElementById('authModal').style.display = 'none';
    }
  } catch (error) {
    console.error('Logout error:', error);
  }
}

async function loadCart() {
  try {
    const response = await fetch('/api/cart');
    const data = await response.json();
    cart = data.cart || [];
    updateCartBadge();
  } catch (error) {
    console.error('Failed to load cart:', error);
    cart = [];
  }
}

function updateCartBadge() {
  const badge = document.getElementById('cartBadge');
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  if (totalItems > 0) {
    badge.textContent = totalItems;
    badge.style.display = 'inline-block';
  } else {
    badge.style.display = 'none';
  }
}

function showProductDetail(productId) {
  const product = PRODUCTS_DATA[productId];
  if (!product) return;
  
  currentDetailProductId = productId;
  document.getElementById('productDetailImg').src = product.image;
  document.getElementById('productDetailImg').alt = product.name;
  document.getElementById('productDetailName').textContent = product.name;
  document.getElementById('productDetailDescription').textContent = product.description;
  document.getElementById('productDetailPrice').textContent = `₹${product.price.toLocaleString()}`;
  document.getElementById('productDetailModal').style.display = 'block';
}

function closeProductDetailModal() {
  document.getElementById('productDetailModal').style.display = 'none';
  currentDetailProductId = null;
}

async function addToCart(productId, event) {
  if (event) {
    event.stopPropagation();
  }
  
  if (!razorpayKeyId) {
    alert('Payment system is loading. Please try again in a moment.');
    return;
  }
  
  try {
    const response = await fetch('/api/cart/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, quantity: 1 })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      cart = data.cart;
      updateCartBadge();
      alert(`${PRODUCTS_DATA[productId].name} added to cart!`);
    } else {
      alert(data.error || 'Failed to add to cart');
    }
  } catch (error) {
    console.error('Error adding to cart:', error);
    alert('Failed to add to cart');
  }
}

async function addToCartFromDetail() {
  if (currentDetailProductId) {
    await addToCart(currentDetailProductId);
    closeProductDetailModal();
  }
}

async function buyNowFromDetail() {
  if (currentDetailProductId) {
    closeProductDetailModal();
    buyProduct(currentDetailProductId);
  }
}

function openCartModal() {
  renderCart();
  document.getElementById('cartModal').style.display = 'block';
}

function closeCartModal() {
  document.getElementById('cartModal').style.display = 'none';
}

function renderCart() {
  const container = document.getElementById('cartItemsContainer');
  
  if (cart.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">Your cart is empty</p>';
    document.getElementById('cartTotal').textContent = '₹0';
    return;
  }
  
  let total = 0;
  let html = '';
  
  cart.forEach(item => {
    const product = PRODUCTS_DATA[item.productId];
    if (!product) return;
    
    const itemTotal = product.price * item.quantity;
    total += itemTotal;
    
    html += `
      <div class="cart-item" style="display: flex; align-items: center; gap: 1rem; padding: 1rem; border-bottom: 1px solid #ddd; margin-bottom: 0.5rem;">
        <input type="checkbox" class="cart-item-checkbox" data-product-id="${item.productId}" checked style="width: 20px; height: 20px; cursor: pointer;">
        <img src="${product.image}" alt="${product.name}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 4px;">
        <div style="flex: 1;">
          <h4 style="margin: 0 0 0.5rem 0; color: #6b2d2d;">${product.name}</h4>
          <p style="margin: 0; color: #666;">₹${product.price.toLocaleString()} × ${item.quantity}</p>
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <button onclick="updateCartQuantity('${item.productId}', ${item.quantity - 1})" style="padding: 0.3rem 0.6rem; cursor: pointer; background: #ddd; border: none; border-radius: 3px;">-</button>
          <span style="min-width: 30px; text-align: center;">${item.quantity}</span>
          <button onclick="updateCartQuantity('${item.productId}', ${item.quantity + 1})" style="padding: 0.3rem 0.6rem; cursor: pointer; background: #ddd; border: none; border-radius: 3px;">+</button>
        </div>
        <p style="margin: 0; font-weight: 600; color: #6b2d2d; min-width: 80px; text-align: right;">₹${itemTotal.toLocaleString()}</p>
        <button onclick="removeFromCart('${item.productId}')" style="padding: 0.5rem; cursor: pointer; background: #d9534f; color: white; border: none; border-radius: 3px;">Remove</button>
      </div>
    `;
  });
  
  container.innerHTML = html;
  document.getElementById('cartTotal').textContent = `₹${total.toLocaleString()}`;
}

async function updateCartQuantity(productId, newQuantity) {
  if (newQuantity < 1) {
    await removeFromCart(productId);
    return;
  }
  
  if (newQuantity > 10) {
    alert('Maximum quantity is 10');
    return;
  }
  
  try {
    const response = await fetch('/api/cart/update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, quantity: newQuantity })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      cart = data.cart;
      updateCartBadge();
      renderCart();
    } else {
      alert(data.error || 'Failed to update cart');
    }
  } catch (error) {
    console.error('Error updating cart:', error);
    alert('Failed to update cart');
  }
}

async function removeFromCart(productId) {
  try {
    const response = await fetch('/api/cart/remove', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      cart = data.cart;
      updateCartBadge();
      renderCart();
    } else {
      alert(data.error || 'Failed to remove from cart');
    }
  } catch (error) {
    console.error('Error removing from cart:', error);
    alert('Failed to remove from cart');
  }
}

async function clearCart() {
  if (!confirm('Are you sure you want to clear your cart?')) {
    return;
  }
  
  try {
    const response = await fetch('/api/cart/clear', {
      method: 'POST'
    });
    
    if (response.ok) {
      cart = [];
      updateCartBadge();
      renderCart();
    } else {
      alert('Failed to clear cart');
    }
  } catch (error) {
    console.error('Error clearing cart:', error);
    alert('Failed to clear cart');
  }
}

async function checkoutSelected() {
  const checkboxes = document.querySelectorAll('.cart-item-checkbox:checked');
  const selectedIds = Array.from(checkboxes).map(cb => cb.dataset.productId);
  
  if (selectedIds.length === 0) {
    alert('Please select items to checkout');
    return;
  }
  
  closeCartModal();
  showCartAddressModal(selectedIds);
}

async function checkoutAll() {
  if (cart.length === 0) {
    alert('Your cart is empty');
    return;
  }
  
  const selectedIds = cart.map(item => item.productId);
  closeCartModal();
  showCartAddressModal(selectedIds);
}

function showCartAddressModal(selectedIds) {
  currentProductId = null;
  currentCartCheckoutIds = selectedIds;
  const modal = document.getElementById('addressModal');
  modal.style.display = 'block';
  
  if (currentUser) {
    document.getElementById('shippingName').value = currentUser.name;
    document.getElementById('shippingEmail').value = currentUser.email;
    document.getElementById('manualName').value = currentUser.name;
    document.getElementById('manualEmail').value = currentUser.email;
  }
}

let currentCartCheckoutIds = null;

async function processCartCheckout(selectedProductIds, shippingAddress) {
  try {
    const orderResponse = await fetch('/api/cart/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ selectedProductIds, shippingAddress })
    });

    if (!orderResponse.ok) {
      const errorData = await orderResponse.json();
      throw new Error(errorData.error || 'Failed to create order');
    }

    const orderData = await orderResponse.json();
    
    const shippingFeeDisplay = orderData.shippingFee > 0 
      ? `\nShipping Fee: ₹${(orderData.shippingFee / 100).toFixed(0)}`
      : '\nShipping: Free for International Orders';
    
    const itemsText = orderData.items.map(item => `${item.productName} x ${item.quantity}`).join('\n');
    const description = `Cart Order:\n${itemsText}${shippingFeeDisplay}\nTotal: ₹${(orderData.amount / 100).toFixed(0)}`;

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
            await loadCart();
            const addressText = shippingAddress.mode === 'manual' 
              ? shippingAddress.fullAddress 
              : `${shippingAddress.address}, ${shippingAddress.city}, ${shippingAddress.state}`;
            alert('Payment successful! Thank you for your purchase.\n\nYour order will be shipped to:\n' + 
                  addressText + 
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
    
    currentCartCheckoutIds = null;
  } catch (error) {
    alert('Failed to initiate payment: ' + error.message);
    console.error('Payment initiation error:', error);
    currentCartCheckoutIds = null;
  }
}
