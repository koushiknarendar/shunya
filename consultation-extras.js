(function () {
  var bar, form, nameInput;

  function buildStickyBar() {
    var wrap = document.createElement('div');
    wrap.innerHTML =
      '<div class="sh-consult-sticky" id="sh-consult-sticky">' +
        '<div class="sh-consult-sticky-info">' +
          '<span class="sh-consult-sticky-label">30–45 min CA consultation</span>' +
          '<span class="sh-consult-sticky-price">₹399<span>₹499</span></span>' +
        '</div>' +
        '<button type="button" class="sh-consult-sticky-btn" id="sh-consult-sticky-btn">Book Now →</button>' +
      '</div>';
    document.body.appendChild(wrap.firstChild);

    bar = document.getElementById('sh-consult-sticky');
    document.getElementById('sh-consult-sticky-btn').addEventListener('click', function () {
      if (form) form.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (nameInput) setTimeout(function () { nameInput.focus(); }, 400);
    });
  }

  function init() {
    var submitBtn = document.querySelector('.consultation-form_submit_button_wrap__n8s73');
    form = document.querySelector('.consultation-form_consultation_form__97uWz');
    nameInput = form ? form.querySelector('input[name="name"]') : null;
    if (!submitBtn || !window.IntersectionObserver) return;

    buildStickyBar();

    var observer = new IntersectionObserver(function (entries) {
      var entry = entries[0];
      if (entry.isIntersecting) {
        bar.classList.remove('sh-consult-sticky-show');
      } else if (entry.boundingClientRect.top < 0) {
        bar.classList.add('sh-consult-sticky-show');
      } else {
        bar.classList.remove('sh-consult-sticky-show');
      }
    }, { threshold: 0 });

    observer.observe(submitBtn);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
