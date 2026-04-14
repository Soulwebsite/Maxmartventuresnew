/* ============================================================
   MAXMARTVENTURES – COMPLETE ECOMMERCE JAVASCRIPT
   ============================================================ */

'use strict';

/* ============================================================
   STATE
   ============================================================ */
const state = {
  cart: [],          // { id, name, price, basePrice, size, img, qty }
  membership: null,  // { tier, discount, price }
  vouchers: [],      // { name, paid, value }
  nextItemId: 1,
};

/* ============================================================
   UTILITY HELPERS
   ============================================================ */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function fmt(n) {
  return '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

function showToast(msg, duration = 3000) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), duration);
}

/* ============================================================
   NAVBAR
   ============================================================ */
window.addEventListener('scroll', () => {
  const nav = $('#navbar');
  nav.classList.toggle('scrolled', window.scrollY > 10);

  // Highlight active nav link
  const sections = ['home','products','membership','vouchers','contact'];
  const scrollPos = window.scrollY + 100;
  sections.forEach(id => {
    const sec = document.getElementById(id);
    const link = $(`.nav-link[href="#${id}"]`);
    if (!sec || !link) return;
    const top = sec.offsetTop;
    const bottom = top + sec.offsetHeight;
    link.classList.toggle('active', scrollPos >= top && scrollPos < bottom);
  });
});

// Hamburger
$('#hamburger').addEventListener('click', () => {
  const ham = $('#hamburger');
  const links = $('#navLinks');
  ham.classList.toggle('active');
  links.classList.toggle('open');
});

// Close nav on link click (mobile)
$$('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    $('#hamburger').classList.remove('active');
    $('#navLinks').classList.remove('open');
  });
});

/* ============================================================
   SEARCH
   ============================================================ */
const searchInput = $('#searchInput');
const searchClear = $('#searchClear');

searchInput.addEventListener('input', () => {
  const q = searchInput.value.trim().toLowerCase();
  searchClear.classList.toggle('visible', q.length > 0);
  filterProducts(q);
});

searchClear.addEventListener('click', () => {
  searchInput.value = '';
  searchClear.classList.remove('visible');
  filterProducts('');
});

function filterProducts(query) {
  const cards = $$('.product-card');
  let visibleCount = 0;
  cards.forEach(card => {
    const name = card.dataset.name.toLowerCase();
    const match = !query || name.includes(query);
    card.style.display = match ? '' : 'none';
    if (match) visibleCount++;
  });
  const noResults = $('#noResults');
  noResults.style.display = visibleCount === 0 ? 'block' : 'none';
}

/* ============================================================
   QUANTITY SELECTOR (on product cards)
   ============================================================ */
function changeQty(btn, delta) {
  const wrap = btn.closest('.qty-wrap');
  const input = wrap.querySelector('.qty-input');
  let val = parseInt(input.value) + delta;
  if (val < 1) val = 1;
  if (val > 99) val = 99;
  input.value = val;
}

/* ============================================================
   CART HELPERS
   ============================================================ */
function getDiscountedPrice(basePrice) {
  if (!state.membership) return basePrice;
  return basePrice * (1 - state.membership.discount / 100);
}

function cartItemTotal(item) {
  return getDiscountedPrice(item.basePrice) * item.qty;
}

function cartSubtotal() {
  return state.cart.reduce((s, item) => s + item.basePrice * item.qty, 0);
}

function cartDiscountAmount() {
  if (!state.membership) return 0;
  return state.cart.reduce((s, item) => {
    return s + (item.basePrice - getDiscountedPrice(item.basePrice)) * item.qty;
  }, 0);
}

function cartGrandTotal() {
  return cartSubtotal() - cartDiscountAmount();
}

/* ============================================================
   ADD TO CART
   ============================================================ */
function addToCart(btn, id, name, basePrice, size, img) {
  const card = btn.closest('.product-card');
  const qtyInput = card.querySelector('.qty-input');
  const qty = parseInt(qtyInput.value) || 1;

  const existing = state.cart.find(i => i.id === id);
  if (existing) {
    existing.qty += qty;
  } else {
    state.cart.push({
      uid: state.nextItemId++,
      id, name, basePrice,
      price: getDiscountedPrice(basePrice),
      size, img, qty,
    });
  }

  // Visual feedback
  btn.classList.add('added');
  btn.textContent = '✓ Added!';
  setTimeout(() => {
    btn.classList.remove('added');
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg> Add to Cart`;
  }, 1500);

  qtyInput.value = 1;
  updateCartUI();
  showToast(`✓ ${name} added to cart`);
}

function quickAdd(id) {
  const card = $(`.product-card[data-id="${id}"]`);
  if (!card) return;
  const btn = card.querySelector('.add-cart-btn');
  btn.click();
}

/* ============================================================
   CART UI
   ============================================================ */
function updateCartUI() {
  const total = state.cart.reduce((s, i) => s + i.qty, 0);
  $('#cartCount').textContent = total;
  renderCartBody();
}

function renderCartBody() {
  const body = $('#cartBody');
  const empty = $('#cartEmpty');
  const footer = $('#cartFooter');

  if (state.cart.length === 0) {
    body.innerHTML = '';
    body.appendChild(empty);
    empty.style.display = 'block';
    footer.style.display = 'none';
    return;
  }

  empty.style.display = 'none';
  footer.style.display = 'block';

  // Build items HTML
  let html = '';
  state.cart.forEach(item => {
    const discounted = getDiscountedPrice(item.basePrice);
    const lineTotal = discounted * item.qty;
    html += `
      <div class="cart-item" data-uid="${item.uid}">
        <img class="cart-item-img" src="${item.img}" alt="${item.name}" />
        <div class="cart-item-info">
          <p class="cart-item-name">${item.name}</p>
          <p class="cart-item-size">${item.size}</p>
          <p class="cart-item-price">${fmt(lineTotal)}</p>
        </div>
        <div class="cart-item-controls">
          <div class="cart-qty-wrap">
            <button class="cart-qty-btn" onclick="cartChangeQty(${item.uid},-1)">−</button>
            <span class="cart-qty-num">${item.qty}</span>
            <button class="cart-qty-btn" onclick="cartChangeQty(${item.uid},1)">+</button>
          </div>
          <button class="cart-remove" onclick="removeFromCart(${item.uid})">Remove</button>
        </div>
      </div>
    `;
  });

  // Add vouchers
  state.vouchers.forEach((v, idx) => {
    html += `
      <div class="cart-item" data-voucher-idx="${idx}">
        <div class="cart-item-img" style="background:linear-gradient(135deg,#1a6b3c,#2d9d5e);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0;width:60px;height:60px;">🎁</div>
        <div class="cart-item-info">
          <p class="cart-item-name">${v.name}</p>
          <p class="cart-item-size">Worth ${fmt(v.value)}</p>
          <p class="cart-item-price">${fmt(v.paid)}</p>
        </div>
        <div class="cart-item-controls">
          <button class="cart-remove" onclick="removeVoucher(${idx})">Remove</button>
        </div>
      </div>
    `;
  });

  body.innerHTML = html;

  // Summary
  const sub = cartSubtotal();
  const disc = cartDiscountAmount();
  const total = cartGrandTotal() + state.vouchers.reduce((s, v) => s + v.paid, 0);

  $('#cartSubtotal').textContent = fmt(sub);

  const discRow = $('#discountRow');
  if (disc > 0) {
    discRow.style.display = 'flex';
    $('#discountLabel').textContent = `${state.membership.tier.charAt(0).toUpperCase() + state.membership.tier.slice(1)} Discount (${state.membership.discount}%)`;
    $('#cartDiscount').textContent = '-' + fmt(disc);
  } else {
    discRow.style.display = 'none';
  }

  const voucherTotal = state.vouchers.reduce((s, v) => s + v.paid, 0);
  $('#cartTotal').textContent = fmt(cartGrandTotal() + voucherTotal);
}

function cartChangeQty(uid, delta) {
  const item = state.cart.find(i => i.uid === uid);
  if (!item) return;
  item.qty = Math.max(1, item.qty + delta);
  updateCartUI();
}

function removeFromCart(uid) {
  state.cart = state.cart.filter(i => i.uid !== uid);
  updateCartUI();
}

function removeVoucher(idx) {
  state.vouchers.splice(idx, 1);
  updateCartUI();
  showToast('Voucher removed');
}

/* ============================================================
   OPEN / CLOSE CART
   ============================================================ */
$('#cartBtn').addEventListener('click', openCart);

function openCart() {
  $('#cartPanel').classList.add('open');
  $('#cartOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';
  renderCartBody();
}

function closeCart() {
  $('#cartPanel').classList.remove('open');
  $('#cartOverlay').classList.remove('active');
  document.body.style.overflow = '';
}

/* ============================================================
   MEMBERSHIP
   ============================================================ */
function selectMembership(tier, discount, price) {
  // Remove previous active
  $$('.membership-card').forEach(c => c.classList.remove('active-membership'));

  state.membership = { tier, discount, price };

  // Highlight card
  const activeCard = $(`.membership-card[data-tier="${tier}"]`);
  if (activeCard) activeCard.classList.add('active-membership');

  // Update banner
  const banner = $('#membershipBanner');
  banner.style.display = 'flex';
  $('#membershipBannerText').textContent = `✓ ${tier.charAt(0).toUpperCase() + tier.slice(1)} Membership active – ${discount}% discount applied to all products`;

  // Update cart badge
  const badge = $('#membershipBadgeCart');
  badge.style.display = 'inline-block';
  badge.textContent = `${tier.charAt(0).toUpperCase() + tier.slice(1)} ${discount}% off`;

  // Update product prices visually
  updateDisplayPrices();

  // Add membership as cart item
  const existingMembership = state.cart.find(i => i.isMembership);
  if (!existingMembership) {
    state.cart.push({
      uid: state.nextItemId++,
      id: 'membership',
      name: `${tier.charAt(0).toUpperCase() + tier.slice(1)} Membership`,
      basePrice: price,
      price: price,
      size: `${discount}% discount for 1 year`,
      img: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAiIGhlaWdodD0iODAiIHJ4PSIxNiIgZmlsbD0iIzFhNmIzYyIvPjx0ZXh0IHg9IjQwIiB5PSI1MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSIzMiIgZmlsbD0id2hpdGUiPuKYhTwvdGV4dD48L3N2Zz4=',
      qty: 1,
      isMembership: true,
    });
  } else {
    existingMembership.name = `${tier.charAt(0).toUpperCase() + tier.slice(1)} Membership`;
    existingMembership.basePrice = price;
    existingMembership.price = price;
    existingMembership.size = `${discount}% discount for 1 year`;
  }

  updateCartUI();
  showToast(`🎉 ${tier.charAt(0).toUpperCase() + tier.slice(1)} Membership selected! ${discount}% discount applied.`);
}

function removeMembership() {
  state.membership = null;
  $$('.membership-card').forEach(c => c.classList.remove('active-membership'));
  $('#membershipBanner').style.display = 'none';
  $('#membershipBadgeCart').style.display = 'none';

  // Remove membership from cart
  state.cart = state.cart.filter(i => !i.isMembership);

  updateDisplayPrices();
  updateCartUI();
  showToast('Membership removed');
}

function updateDisplayPrices() {
  $$('.price-amount').forEach(el => {
    const base = parseFloat(el.dataset.base);
    if (!base) return;
    const final = getDiscountedPrice(base);
    el.textContent = Math.round(final);
  });
}

/* ============================================================
   VOUCHERS
   ============================================================ */
function addVoucherToCart(name, paid, value) {
  state.vouchers.push({ name, paid, value });
  updateCartUI();
  openCart();
  showToast(`🎁 ${name} added to cart!`);
}

/* ============================================================
   CHECKOUT
   ============================================================ */
function proceedToCheckout() {
  if (state.cart.length === 0 && state.vouchers.length === 0) {
    showToast('Your cart is empty!');
    return;
  }

  closeCart();

  const body = $('#checkoutBody');
  const sub = cartSubtotal();
  const disc = cartDiscountAmount();
  const voucherTotal = state.vouchers.reduce((s, v) => s + v.paid, 0);
  const grand = cartGrandTotal() + voucherTotal;

  let itemsHtml = '';
  state.cart.forEach(item => {
    const linePrice = getDiscountedPrice(item.basePrice) * item.qty;
    itemsHtml += `
      <div class="checkout-item">
        <div>
          <p class="ci-name">${item.name}</p>
          <p class="ci-detail">${item.size} × ${item.qty}</p>
        </div>
        <p class="ci-price">${fmt(linePrice)}</p>
      </div>
    `;
  });
  state.vouchers.forEach(v => {
    itemsHtml += `
      <div class="checkout-item">
        <div>
          <p class="ci-name">${v.name}</p>
          <p class="ci-detail">Worth ${fmt(v.value)}</p>
        </div>
        <p class="ci-price">${fmt(v.paid)}</p>
      </div>
    `;
  });

  let discHtml = '';
  if (disc > 0) {
    discHtml = `<div class="checkout-total-row" style="color:#1da851;font-weight:600;">
      <span>Membership Discount (${state.membership.discount}%)</span>
      <span>-${fmt(disc)}</span>
    </div>`;
  }

  body.innerHTML = `
    ${itemsHtml}
    <div class="checkout-total-block">
      <div class="checkout-total-row"><span>Subtotal</span><span>${fmt(sub + voucherTotal)}</span></div>
      ${discHtml}
      <div class="checkout-total-row checkout-grand-total"><span>Total Payable</span><span>${fmt(grand)}</span></div>
    </div>
  `;

  $('#checkoutOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeCheckout() {
  $('#checkoutOverlay').classList.remove('active');
  document.body.style.overflow = '';
}

/* ============================================================
   PLACE ORDER + INVOICE
   ============================================================ */
function placeOrder() {
  closeCheckout();

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const orderNo = 'MMV' + Date.now().toString().slice(-6);

  const sub = cartSubtotal();
  const disc = cartDiscountAmount();
  const voucherTotal = state.vouchers.reduce((s, v) => s + v.paid, 0);
  const grand = cartGrandTotal() + voucherTotal;

  let rowsHtml = '';
  let sno = 1;
  state.cart.forEach(item => {
    const unitPrice = getDiscountedPrice(item.basePrice);
    const lineTotal = unitPrice * item.qty;
    rowsHtml += `
      <tr>
        <td>${sno++}</td>
        <td>${item.name}<br><small style="color:#888">${item.size}</small></td>
        <td style="text-align:center">${item.qty}</td>
        <td style="text-align:right">${fmt(item.basePrice)}</td>
        <td style="text-align:right">${fmt(lineTotal)}</td>
      </tr>
    `;
  });
  state.vouchers.forEach(v => {
    rowsHtml += `
      <tr>
        <td>${sno++}</td>
        <td>${v.name}<br><small style="color:#888">Worth ${fmt(v.value)}</small></td>
        <td style="text-align:center">1</td>
        <td style="text-align:right">${fmt(v.paid)}</td>
        <td style="text-align:right">${fmt(v.paid)}</td>
      </tr>
    `;
  });

  let discRow = '';
  if (disc > 0) {
    discRow = `<div class="inv-total-row" style="color:#1da851;font-weight:600;"><span>${state.membership.tier.charAt(0).toUpperCase()+state.membership.tier.slice(1)} Membership Discount (${state.membership.discount}%)</span><span>-${fmt(disc)}</span></div>`;
  }

  $('#invoiceBody').innerHTML = `
    <div class="invoice-header">
      <div class="invoice-logo">
        <div class="logo-mark" style="width:42px;height:42px;font-size:22px;background:linear-gradient(135deg,#1a6b3c,#2d9d5e);color:white;border-radius:10px;display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',serif;font-weight:900;">M</div>
        <div>
          <div class="logo-text" style="font-family:'Playfair Display',serif;font-size:16px;font-weight:700;color:#0d2818;">Maxmart<em style="font-style:normal;color:#1a6b3c;">ventures</em></div>
          <div style="font-size:11px;color:#5a7a65;">Pure Natural Products Marketplace</div>
        </div>
      </div>
      <div class="invoice-meta">
        <strong>TAX INVOICE</strong>
        <p>Order #: ${orderNo}</p>
        <p>Date: ${dateStr}</p>
        <p>Time: ${timeStr}</p>
        <p>GST: 33EEPPM8083C1Z8</p>
      </div>
    </div>

    <div style="margin-bottom:20px;font-size:13px;color:#5a7a65;background:#f4faf6;padding:12px 16px;border-radius:10px;">
      <strong style="color:#1a6b3c;">Seller:</strong> Maxmartventures · Proprietor: Manikandan<br/>
      49/1 ASC Complex, 1st Floor, Nachiyappa Road, Opp. ESAF Bank, Erode – 638001<br/>
      📞 8754502061
    </div>

    <table class="invoice-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Product</th>
          <th style="text-align:center">Qty</th>
          <th style="text-align:right">Unit Price</th>
          <th style="text-align:right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    <div class="invoice-totals">
      <div class="inv-total-row"><span>Subtotal</span><span>${fmt(sub + voucherTotal)}</span></div>
      ${discRow}
      <div class="inv-total-row inv-grand"><span>Grand Total</span><span>${fmt(grand)}</span></div>
    </div>

    <div class="invoice-footer-note">
      Thank you for shopping with Maxmartventures!<br/>
      For queries, WhatsApp us at <strong>8754502061</strong><br/>
      <small>This is a computer-generated invoice.</small>
    </div>
  `;

  $('#invoiceOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';

  // Clear cart after placing order
  state.cart = [];
  updateCartUI();
}

function closeInvoice() {
  $('#invoiceOverlay').classList.remove('active');
  document.body.style.overflow = '';
}

// Close modals on overlay click
$('#checkoutOverlay').addEventListener('click', (e) => {
  if (e.target === $('#checkoutOverlay')) closeCheckout();
});
$('#invoiceOverlay').addEventListener('click', (e) => {
  if (e.target === $('#invoiceOverlay')) closeInvoice();
});

/* ============================================================
   KEYBOARD ACCESSIBILITY
   ============================================================ */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeCart();
    closeCheckout();
    closeInvoice();
  }
});

/* ============================================================
   SCROLL REVEAL ANIMATION
   ============================================================ */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

function initReveal() {
  const els = [
    ...$$('.product-card'),
    ...$$('.membership-card'),
    ...$$('.voucher-card'),
    ...$$('.contact-card'),
  ];
  els.forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = `opacity 0.5s ease ${i * 0.06}s, transform 0.5s ease ${i * 0.06}s, box-shadow 0.3s ease, border-color 0.3s ease`;
    revealObserver.observe(el);
  });
}

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  initReveal();
  updateCartUI();

  // Smooth anchor scroll with offset
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      const offset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 72;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
});
