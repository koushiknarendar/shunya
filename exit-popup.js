(function () {
  var MIN_DWELL_MS = 15000;
  var DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
  var MOBILE_SCROLL_FLOOR = 400;
  var MOBILE_SCROLL_UP_DELTA = 50;
  var MOBILE_SCROLL_UP_WINDOW_MS = 300;
  var MOBILE_MIN_SCROLL_DOWN_FIRST = 150;

  var SUBMITTED_KEY = 'sh_exitpop_submitted';
  var DISMISSED_KEY = 'sh_exitpop_dismissed_at';
  var SESSION_KEY = 'sh_exitpop_shown_session';

  function storageGet(store, key) {
    try { return store.getItem(key); } catch (e) { return null; }
  }
  function storageSet(store, key, val) {
    try { store.setItem(key, val); } catch (e) {}
  }

  function suppressed() {
    if (storageGet(localStorage, SUBMITTED_KEY)) return true;
    if (storageGet(sessionStorage, SESSION_KEY)) return true;
    var dismissedAt = storageGet(localStorage, DISMISSED_KEY);
    if (dismissedAt && (Date.now() - parseInt(dismissedAt, 10)) < DISMISS_COOLDOWN_MS) return true;
    return false;
  }

  var loadTime = Date.now();
  function dwellElapsed() {
    return (Date.now() - loadTime) >= MIN_DWELL_MS;
  }

  var isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;

  var overlay, form, nameInput, phoneInput, errorEl, submitBtn, formEl;
  var isOpen = false;

  function buildMarkup() {
    var wrap = document.createElement('div');
    wrap.innerHTML =
      '<div class="sh-exitpop-overlay" id="sh-exitpop-overlay">' +
        '<div class="sh-exitpop-card" role="dialog" aria-modal="true" aria-labelledby="sh-exitpop-title">' +
          '<button type="button" class="sh-exitpop-close" id="sh-exitpop-close" aria-label="Close">' +
            '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1L11 11M11 1L1 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>' +
          '</button>' +
          '<div class="sh-exitpop-expert">' +
            '<img class="sh-exitpop-avatar" src="image/ca-rinky-vishwakarma.webp" alt="CA Rinky Vishwakarma" width="76" height="76" loading="eager" decoding="async">' +
            '<div class="sh-exitpop-expert-info">' +
              '<p class="sh-exitpop-expert-name">CA Rinky Vishwakarma</p>' +
              '<p class="sh-exitpop-expert-role">Chartered Accountant, Shunya</p>' +
            '</div>' +
          '</div>' +
          '<h2 class="sh-exitpop-title" id="sh-exitpop-title">Talk to <span>Rinky</span> directly</h2>' +
          '<p class="sh-exitpop-sub">Leave your number and I&rsquo;ll personally call you back to answer your questions — no cost, no obligation.</p>' +
          '<form class="sh-exitpop-form" id="sh-exitpop-form">' +
            '<input class="sh-exitpop-input" type="text" id="sh-exitpop-name" placeholder="Your name (optional)" autocomplete="name">' +
            '<input class="sh-exitpop-input" type="tel" id="sh-exitpop-phone" placeholder="10-digit phone number" autocomplete="tel" inputmode="numeric" required>' +
            '<p class="sh-exitpop-error" id="sh-exitpop-error">Please enter a valid 10-digit phone number.</p>' +
            '<button type="submit" class="sh-exitpop-submit" id="sh-exitpop-submit">Request a Callback</button>' +
          '</form>' +
          '<p class="sh-exitpop-trust">No spam. I typically call back within a few hours.</p>' +
        '</div>' +
      '</div>';
    document.body.appendChild(wrap.firstChild);

    overlay = document.getElementById('sh-exitpop-overlay');
    formEl = document.getElementById('sh-exitpop-form');
    nameInput = document.getElementById('sh-exitpop-name');
    phoneInput = document.getElementById('sh-exitpop-phone');
    errorEl = document.getElementById('sh-exitpop-error');
    submitBtn = document.getElementById('sh-exitpop-submit');

    document.getElementById('sh-exitpop-close').addEventListener('click', function () {
      close(true);
    });
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) close(true);
    });
    document.addEventListener('keydown', function (e) {
      if (isOpen && e.key === 'Escape') close(true);
    });
    formEl.addEventListener('submit', handleSubmit);
  }

  function open() {
    if (isOpen || suppressed()) return;
    if (!overlay) buildMarkup();
    isOpen = true;
    overlay.classList.add('sh-exitpop-open');
    storageSet(sessionStorage, SESSION_KEY, '1');
    setTimeout(function () { phoneInput.focus(); }, 50);
  }

  function close(remember) {
    if (!isOpen) return;
    isOpen = false;
    overlay.classList.remove('sh-exitpop-open');
    if (remember) storageSet(localStorage, DISMISSED_KEY, String(Date.now()));
  }

  function handleSubmit(e) {
    e.preventDefault();
    var phone = phoneInput.value.replace(/[^\d]/g, '').slice(-10);
    if (phone.length !== 10) {
      errorEl.classList.add('sh-exitpop-show');
      return;
    }
    errorEl.classList.remove('sh-exitpop-show');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';

    fetch('/api/submit-lead-popup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: nameInput.value.trim(),
        phone: phone,
        page: document.title,
        url: location.href
      })
    })
      .then(function (res) {
        if (!res.ok) throw new Error('request failed');
        storageSet(localStorage, SUBMITTED_KEY, '1');
        location.href = 'thank-you.html';
      })
      .catch(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Request a Callback';
        errorEl.textContent = 'Something went wrong. Please try again.';
        errorEl.classList.add('sh-exitpop-show');
      });
  }

  function maybeTrigger() {
    if (!dwellElapsed() || suppressed()) return;
    open();
  }

  if (!isTouch) {
    document.addEventListener('mouseout', function (e) {
      if (e.clientY <= 0 && !e.relatedTarget) maybeTrigger();
    });
  } else {
    var lastY = window.scrollY;
    var lastT = Date.now();
    var scrolledDown = false;
    window.addEventListener('scroll', function () {
      var y = window.scrollY;
      var t = Date.now();
      if (y > MOBILE_MIN_SCROLL_DOWN_FIRST) scrolledDown = true;
      var dy = lastY - y;
      var dt = t - lastT;
      if (scrolledDown && y < MOBILE_SCROLL_FLOOR && dy > MOBILE_SCROLL_UP_DELTA && dt < MOBILE_SCROLL_UP_WINDOW_MS) {
        maybeTrigger();
      }
      lastY = y;
      lastT = t;
    }, { passive: true });
  }
})();
