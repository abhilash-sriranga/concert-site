function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatDayOfWeek(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long' });
}

function updateCartCount(count, animate = false) {
  const el = document.getElementById('cart-count');
  if (!el) return;
  if (count > 0) {
    el.textContent = count;
    el.classList.remove('hidden');
  } else {
    el.classList.add('hidden');
  }

  if (animate) {
    const btn = document.getElementById('cart-btn');
    if (!btn) return;
    btn.classList.remove('cart-animate');
    void btn.offsetWidth; // force reflow so re-adding the class restarts the animation
    btn.classList.add('cart-animate');
    btn.addEventListener('animationend', () => btn.classList.remove('cart-animate'), { once: true });
  }
}

async function loadCartCount() {
  try {
    const res = await fetch('/api/cart/count');
    const data = await res.json();
    updateCartCount(data.count);
  } catch (_) {}
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toasts');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity .3s';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
