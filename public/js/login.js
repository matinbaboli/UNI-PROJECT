document.getElementById('login-form').addEventListener('submit', function(event) {
  event.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  fetch('/login', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password })
  })
  .then(response => response.json())
  .then(data => {
      if (data.token) {
          localStorage.setItem('token', data.token);
          alert('Login successful!');
          window.location.href = '/';  // Redirect to home page or dashboard
      } else if (data.error) {
        alert('Invalid credentials')
      }
  })
  .catch(err => alert('Invalid credentials'));
});