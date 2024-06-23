document.addEventListener('DOMContentLoaded', function() {                      // Funkcja uruchamiana po zaladowaniu dokumentu
    let userEmailElement = document.getElementById('userEmail');               // Element do wyswietlania e-maila uzytkownika
    let logoutButton = document.getElementById('logoutButton');                // Przycisk do wylogowania
    let loginLink = document.getElementById('loginLink');                      // Link do logowania
    let registerLink = document.getElementById('registerLink');                // Link do rejestracji

    function checkLoginStatus() {                                              // Funkcja do sprawdzania statusu logowania
        let loggedInUser = localStorage.getItem('loggedInUser');
        if (loggedInUser) {                                                    // Jesli uzytkownik jest zalogowany
            let user = JSON.parse(loggedInUser);
            userEmailElement.textContent = user.email;
            logoutButton.style.display = 'inline';
            loginLink.style.display = 'none';
            registerLink.style.display = 'none';
        } else {                                                               // Jesli uzytkownik nie jest zalogowany
            userEmailElement.textContent = '';
            logoutButton.style.display = 'none';
            loginLink.style.display = 'inline';
            registerLink.style.display = 'inline';
        }
    }

    logoutButton.addEventListener('click', function() {                        // Funkcja uruchamiana po kliknieciu przycisku wylogowania
        localStorage.removeItem('loggedInUser');
        checkLoginStatus();
    });

    checkLoginStatus();                                                        // Sprawdzenie statusu logowania po zaladowaniu strony
});
