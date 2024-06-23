const rouletteNumbers = document.getElementById('roulette-numbers');            // Element do wyswietlania numerow ruletki
const spinButton = document.getElementById('spin-button');                      // Przycisk do zakrecenia ruletki
const numberGrid = document.getElementById('number-grid');                      // Siatka do wyswietlania numerow

const numbers = [                                                               // Tablica numerow ruletki
    { value: 0, color: 'green' },
    ...Array.from({ length: 36 }, (_, i) => ({
        value: i + 1,
        color: i % 2 === 0 ? 'red' : 'black'
    }))
];

const repeatedNumbers = [...numbers, ...numbers, ...numbers];                   // Powtorzone numery dla ruletki

repeatedNumbers.forEach(num => {                                                // Tworzenie i dodawanie elementow numerow ruletki
    const numberDiv = document.createElement('div');
    numberDiv.classList.add('number', num.color);
    numberDiv.innerText = num.value;
    rouletteNumbers.appendChild(numberDiv);
});

let selectedColor = '';                                                         // Zmienna do przechowywania wybranego koloru
let selectedNumbers = new Set();                                                // Zbior wybranych numerow
let numberBets = {};                                                            // Obiekt do przechowywania zakladow na numery
let balance = 0;                                                                // Zmienna do przechowywania salda
let currentUserEmail ='';                                                       // Zmienna do przechowywania e-maila uzytkownika

function getCurrentUserEmail() {                                                // Funkcja pobierajaca e-mail zalogowanego uzytkownika
    const loggedInUser = localStorage.getItem('loggedInUser');
    if (loggedInUser) {
        const user = JSON.parse(loggedInUser);
        return user.email;
    }
    return null;
}

currentUserEmail = getCurrentUserEmail();
async function getUserData(email) {                                             // Funkcja pobierajaca dane uzytkownika z serwera
    const response = await fetch(`http://localhost:3000/users?email=${encodeURIComponent(email)}`);
    const users = await response.json();
    return users.length > 0 ? users[0] : null;
}

async function getBalance(email) {                                              // Funkcja pobierajaca saldo uzytkownika
    const user = await getUserData(email);
    return user ? user.balance : null;
}

async function updateBalance(email, newBalance) {                               // Funkcja aktualizujaca saldo uzytkownika
    const user = await getUserData(email);
    if (user) {
        user.balance = newBalance;
        await fetch(`http://localhost:3000/users/${user.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(user)
        });
    } else {
        displayErrorMessage("Uzytkownik nie znaleziony.");
    }
}

async function initializeBalance() {                                            // Funkcja inicjalizujaca saldo
    currentUserEmail = getCurrentUserEmail();
    if (currentUserEmail) {
        const user = await getUserData(currentUserEmail);
        if (user) {
            balance = user.balance;
            updateBalanceDisplay();
        } else {
            displayErrorMessage("Uzytkownik nie znaleziony.");
        }
    }
}

function updateBalanceDisplay() {                                               // Funkcja aktualizujaca wyswietlanie salda
    const balanceEl = document.getElementById('balance');
    if (balanceEl) {
        balanceEl.textContent = `Saldo: €${balance.toFixed(2)}`;
    }
}

function displayErrorMessage(message) {                                         // Funkcja wyswietlajaca komunikat o bledzie
    const errorMessageEl = document.getElementById('error-message');
    errorMessageEl.textContent = message;
    errorMessageEl.style.display = 'block';
}

function clearErrorMessage() {                                                  // Funkcja czyszczaca komunikat o bledzie
    const errorMessageEl = document.getElementById('error-message');
    errorMessageEl.textContent = '';
    errorMessageEl.style.display = 'none';
}

function addToBet(amount) {                                                     // Funkcja dodajaca kwote do zakladu
    const betAmountInput = document.getElementById('bet-amount');
    let currentBet = parseFloat(betAmountInput.value) || 0;
    if (currentBet + amount > balance) {
        displayErrorMessage("Za malo srodkow na koncie.");
        return;
    }
    betAmountInput.value = (currentBet + amount).toFixed(2);
    clearErrorMessage();
}

function setBetColor(color) {                                                   // Funkcja ustawiajaca kolor zakladu
    const betAmount = parseFloat(document.getElementById('bet-amount').value);
    if (isNaN(betAmount) || betAmount <= 0) {
        displayErrorMessage("Wybierz odpowiednia stawke przed zagraniem.");
        return;
    }

    selectedColor = color;
    document.querySelectorAll('.bet-color-btn').forEach(btn => btn.classList.remove('selected'));
    document.getElementById(`bet-${color}`).classList.add('selected');
    clearErrorMessage();
}

function toggleNumberSelection(value) {                                         // Funkcja przelaczajaca zaznaczenie numeru
    const betAmountInput = document.getElementById('bet-amount');
    const betAmount = parseFloat(betAmountInput.value);

    if (isNaN(betAmount) || betAmount <= 0) {
        displayErrorMessage("Wybierz odpowiednia stawke przed zagraniem.");
        return;
    }

    const numberButton = document.querySelector(`.number-button[data-value='${value}']`);

    if (selectedNumbers.has(value)) {                                           // Usuwanie zaznaczenia numeru
        selectedNumbers.delete(value);
        numberButton.classList.remove('selected');
        balance += numberBets[value];
        delete numberBets[value];
    } else {                                                                    // Dodawanie zaznaczenia numeru
        if (betAmount > balance) {
            displayErrorMessage("Brak funduszy na koncie.");
            return;
        }

        selectedNumbers.add(value);
        numberButton.classList.add('selected');
        balance -= betAmount;
        numberBets[value] = betAmount;
    }

    updateBalanceDisplay();
    clearErrorMessage();
}

function createNumberGrid() {                                                   // Funkcja tworzaca siatke numerow
    numbers.slice(1).forEach(num => {
        const numberButton = document.createElement('button');
        numberButton.classList.add('number-button', num.color);
        numberButton.innerText = num.value;
        numberButton.dataset.value = num.value;
        numberButton.onclick = () => toggleNumberSelection(num.value);
        numberGrid.appendChild(numberButton);
    });
}

function spinRoulette() {                                                       // Funkcja obracajaca ruletke
    const betAmount = parseFloat(document.getElementById('bet-amount').value);

    if (selectedNumbers.size === 0 && selectedColor === '') {
        displayErrorMessage("Musisz na cos postawic.");
        return;
    }

    if (betAmount > balance) {
        displayErrorMessage("Brak funduszy na koncie.");
        return;
    }

    balance -= betAmount;
    updateBalanceDisplay();

    const randomIndex = Math.floor(Math.random() * numbers.length);
    const offset = (randomIndex + numbers.length) * 150 - 600;

    document.querySelectorAll('.number').forEach(num => num.classList.remove('highlight'));

    rouletteNumbers.style.transition = 'none';
    rouletteNumbers.style.transform = 'translateX(0)';
    setTimeout(() => {
        rouletteNumbers.style.transition = 'transform 4s cubic-bezier(0.33, 1, 0.68, 1)';
        rouletteNumbers.style.transform = `translateX(-${offset}px)`;
    }, 20);

    setTimeout(() => {                                                          // Funkcja wyswietlajaca wyniki po zakreceniu ruletki
        const highlightedNumber = document.querySelectorAll('.number')[randomIndex + numbers.length];
        highlightedNumber.classList.add('highlight');

        const resultDiv = document.getElementById('result');
        const winningNumber = numbers[randomIndex];
        const winnings = calculateWinnings(winningNumber);
        balance += winnings;
        updateBalanceDisplay();

        const colorTranslations = {
            black: 'Czarny',
            red: 'Czerwony',
            green: 'Zielony'
        };

        const winningDisplay = document.getElementById('winning-display');
        winningDisplay.innerText = `Wygrane numery: ${winningNumber.value}, Kolor: ${colorTranslations[winningNumber.color]}`;

        if (winnings > 0) {
            resultDiv.innerText = `WYGRANA! Wygrywasz €${winnings.toFixed(2)}`;
            resultDiv.style.color = "green";
        } else {
            resultDiv.innerText = "Przegrana!";
            resultDiv.style.color = "red";
        }

        document.getElementById('bet-amount').value = '';
        selectedNumbers.clear();
        numberBets = {};
        selectedColor = '';
        document.querySelectorAll('.number-button').forEach(btn => btn.classList.remove('selected'));
        document.querySelectorAll('.bet-color-btn').forEach(btn => btn.classList.remove('selected'));

        updateBalance(currentUserEmail, balance);
    }, 4020);
}

function calculateWinnings(winningNumber) {                                     // Funkcja obliczajaca wygrane
    let winnings = 0;
    selectedNumbers.forEach(number => {
        if (number === winningNumber.value) {
            winnings += numberBets[number] * 36;
        }
    });
    if (selectedColor === winningNumber.color) {
        if (selectedColor === 'green') {
            winnings += parseFloat(document.getElementById('bet-amount').value) * 12;
        } else {
            winnings += parseFloat(document.getElementById('bet-amount').value) * 2;
        }
    }
    if (winnings === 0) {
        winnings -= parseFloat(document.getElementById('bet-amount').value);
    }
    return winnings;
}

spinButton.addEventListener('click', spinRoulette);                             // Dodanie nasluchiwacza zdarzenia do przycisku zakrecenia ruletki
createNumberGrid();                                                             // Utworzenie siatki numerow
initializeBalance();                                                            // Inicjalizacja salda
updateBalanceDisplay();                                                         // Aktualizacja wyswietlania salda

document.getElementById('bet-amount').addEventListener('input', clearErrorMessage);
document.querySelectorAll('.number-button').forEach(button => button.addEventListener('click', clearErrorMessage));
document.querySelectorAll('.bet-color-btn').forEach(button => button.addEventListener('click', clearErrorMessage));
document.getElementById('bet-plus-1').addEventListener('click', () => addToBet(1));
document.getElementById('bet-plus-2').addEventListener('click', () => addToBet(2));
document.getElementById('bet-plus-5').addEventListener('click', () => addToBet(5));
document.getElementById('bet-plus-10').addEventListener('click', () => addToBet(10));
