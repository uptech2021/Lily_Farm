(function () {
  'use strict';
  var form = document.querySelector('.login-form');
  var message = document.getElementById('loginMessage');
  var submit = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    message.hidden = true;
    submit.disabled = true;
    submit.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Signing in...';
    try {
      var response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email: form.email.value.trim(), password: form.password.value, remember: form.remember.checked })
      });
      var result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to sign in.');
      window.location.replace('dashboard.html');
    } catch (error) {
      message.textContent = error.message;
      message.hidden = false;
      submit.disabled = false;
      submit.textContent = 'Sign In';
      form.password.focus();
    }
  });
})();
