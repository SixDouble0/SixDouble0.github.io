document.addEventListener('DOMContentLoaded', function () {
    const daySelect = document.getElementById('day');
    const yearSelect = document.getElementById('year');

    // Populate day dropdown
    for (let i = 1; i <= 31; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        daySelect.appendChild(option);
    }

    // Populate year dropdown
    const currentYear = new Date().getFullYear();
    for (let i = currentYear; i >= 1900; i--) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        yearSelect.appendChild(option);
    }
});

document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();

    let email = document.getElementById('email').value;
    let password = document.getElementById('password').value;
    let confirmPassword = document.getElementById('confirm-password').value;
    let day = document.getElementById('day').value;
    let month = document.getElementById('month').value;
    let year = document.getElementById('year').value;
    let message = document.getElementById('message');

    if (password !== confirmPassword) {
        message.textContent = "Hasła się nie zgadzają!";
        message.style.color = "red";
        return;
    }

    if (!day || !month || !year) {
        message.textContent = "Wybierz odpowiednia date urodzenia.";
        message.style.color = "red";
        return;
    }

    let birthday = new Date(year, month - 1, day);
    let today = new Date();
    let age = today.getFullYear() - birthday.getFullYear();
    let monthDifference = today.getMonth() - birthday.getMonth();

    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthday.getDate())) {
        age--;
    }

    if (age < 18) {
        message.textContent = "Musisz być pełnoletni by stworzyć konto";
        message.style.color = "red";
        return;
    }

    message.textContent = "Tworzenie konta...";
    message.style.color = "green";

    let newUser = {
        email: email,
        password: password,
        birthday: birthday.toISOString().split('T')[0],
        balance: 1000
    };

    fetch('http://localhost:3000/users', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(newUser)
    })
    .then(response => response.json())
    .then(data => {
        message.textContent = "Konto zostało stworzone pomyślnie!";
        message.style.color = "green";
        // Redirect to index.html after successful registration
        window.location.href = '../../index.html';
    })
    .catch(error => {
        message.textContent = "Wystąpił błąd podczas tworzenia konta.";
        message.style.color = "red";
        console.error('Error:', error);
    });
});
