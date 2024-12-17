document.getElementById('signup-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const repeatPassword = document.getElementById('repeat-password').value;

    // Check if passwords match
    if (password !== repeatPassword) {
        alert('Passwords do not match!');
        return;
    }

    fetch('/signup', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.token) {
            // Save token to localStorage
            localStorage.setItem('token', data.token);
            alert('Sign up successful!');
            window.location.href = '/'; // Redirect to the homepage
        } else if (data.error) {
            alert('Error during sign up: ' + data.error);
        }
    })
    .catch(err => alert('Error during sign up: ' + err));
});
