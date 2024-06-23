document.addEventListener('DOMContentLoaded', function() {
    const userEmailElement = document.getElementById('userEmail');
    const logoutButton = document.getElementById('logoutButton');
    const loginForm = document.getElementById('loginForm');
    const messageElement = document.getElementById('message');
    const loginFormContainer = document.getElementById('loginFormContainer');

    const apiUrl = 'http://localhost:3000/users';

    function checkLoginStatus() {
        const loggedInUser = localStorage.getItem('loggedInUser');
        if (loggedInUser) {
            const user = JSON.parse(loggedInUser);
            userEmailElement.textContent = `Zalogowany jako: ${user.email}`;
            logoutButton.style.display = 'inline';
            loginFormContainer.style.display = 'none';
        } else {
            userEmailElement.textContent = '';
            logoutButton.style.display = 'none';
            loginFormContainer.style.display = 'block';
        }
    }

    async function loginUser(email, password) {
        try {
            const response = await fetch(`${apiUrl}?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`);
            if (!response.ok) throw new Error('Błąd sieci');
            const users = await response.json();
            if (users.length > 0) {
                localStorage.setItem('loggedInUser', JSON.stringify(users[0]));
                messageElement.textContent = 'Logowanie udane!';
                messageElement.style.color = 'green';
                checkLoginStatus();
                console.log('Redirecting to index.html');
                window.location.href = 'index.html';
            } else {
                messageElement.textContent = 'Nieprawidłowy email lub hasło.';
                messageElement.style.color = 'red';
            }
        } catch (error) {
            console.error('Błąd podczas logowania:', error);
            messageElement.textContent = 'Błąd podczas logowania. Spróbuj ponownie.';
            messageElement.style.color = 'red';
        }
    }

    loginForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        loginUser(email, password);
    });

    logoutButton.addEventListener('click', function() {
        localStorage.removeItem('loggedInUser');
        checkLoginStatus();
    });

    checkLoginStatus();
});
