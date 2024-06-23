function getCurrentUserEmail() {                                               // Funkcja do pobierania obecnego e-maila uzytkownika z localStorage
    const loggedInUser = localStorage.getItem('loggedInUser');
    if (loggedInUser) {                                                         // funkcja pobierajaca mail z bazy
        const user = JSON.parse(loggedInUser);
        return user.email;
    }
    return null;
}
const balanceEl = document.getElementById('balance');
const betAmountInput = document.getElementById('bet-amount');
const spinButton = document.getElementById('spin-button');
const resultDiv = document.getElementById('result');
const debugEl = document.getElementById('debug');
const iconMap = ["lemon", "star", "bell", "cherries", "watermelon", "banana", "seven", "orange", "apple"];
const icon_width = 199.98;
const icon_height = 199.98;
const num_icons = 9;
const time_per_icon = 100;
const indexes = [0, 0, 0];
const weightedIcons = [0, 0, 0, 0, 1, 1, 2, 3, 3, 4, 5, 6, 7, 8, 8, 8, 8];

let balance = 0;

function getCurrentUserEmail() {                                               // Funkcja do pobierania obecnego e-maila uzytkownika z localStorage
    const loggedInUser = localStorage.getItem('loggedInUser');
    if (loggedInUser) {                                                         // funkcja pobierajaca mail z bazy
        const user = JSON.parse(loggedInUser);
        return user.email;
    }
    return null;
}
currentUserEmail = getCurrentUserEmail();

async function getUserData(email) {                                             // Funkcja do pobierania danych uzytkownika na podstawie e-maila
    const response = await fetch(`http://localhost:3000/users?email=${encodeURIComponent(email)}`);
    const users = await response.json();
    return users.length > 0 ? users[0] : null;
}

async function getBalance(email) {                                              // Funkcja do pobierania salda uzytkownika
    const user = await getUserData(email);
    return user ? user.balance : null;
}

async function updateBalance(email, newBalance) {                               // Funkcja do aktualizacji salda uzytkownika
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
        displayErrorMessage("Uzytkownik nie znaleziony.");                     // Wyswietlenie bledu, gdy uzytkownik nie zostal znaleziony
    }
}

async function initializeBalance() {                                            // Funkcja do inicjalizacji salda
    currentUserEmail = getCurrentUserEmail();
    if (currentUserEmail) {
        const user = await getUserData(currentUserEmail);
        if (user) {
            balance = user.balance;
            updateBalanceDisplay();
        } else {
            displayErrorMessage("Uzytkownik nie znaleziony.");                 // Wyswietlenie bledu, gdy uzytkownik nie zostal znaleziony
        }
    }
}

function updateBalanceDisplay() {                                               // Funkcja do aktualizacji wyswietlania salda
    const balanceEl = document.getElementById('balance');
    if (balanceEl) {
        balanceEl.textContent = `Saldo: $${balance.toFixed(2)}`;
    }
}

function getRandomFruit() {                                                     // Funkcja do losowania owocu
    return weightedIcons[Math.floor(Math.random() * weightedIcons.length)];
}

const roll = (reel, offset = 0) => {                                             // Funkcja do animacji przewijania bębna
    const delta = (offset + 2) * num_icons + Math.round(Math.random() * num_icons);

    return new Promise((resolve, reject) => {
        const style = getComputedStyle(reel);
        const backgroundPositionY = parseFloat(style["background-position-y"]);
        const targetBackgroundPositionY = backgroundPositionY + delta * icon_height;
        const normTargetBackgroundPositionY = targetBackgroundPositionY % (num_icons * icon_height);

        setTimeout(() => {
            reel.style.transition = `background-position-y ${(8 + 1 * delta) * time_per_icon}ms cubic-bezier(.41,-0.01,.63,1.09)`;
            reel.style.backgroundPositionY = `${backgroundPositionY + delta * icon_height}px`;
        }, offset * 150);

        setTimeout(() => {
            reel.style.transition = `none`;
            reel.style.backgroundPositionY = `${normTargetBackgroundPositionY}px`;
            resolve(delta % num_icons);
        }, (8 + 1 * delta) * time_per_icon + offset * 150);
    });
};

async function spin() {                                                          // Funkcja do uruchamiania obrotu bębnów
    const betAmount = parseFloat(betAmountInput.value);
    if (isNaN(betAmount) || betAmount <= 0) {
        alert("Please enter a valid bet amount.");
        return;
    }
    if (betAmount > balance) {
        alert("Insufficient balance.");
        return;
    }

    balance -= betAmount;
    updateBalanceDisplay();

    const reelsList = document.querySelectorAll('.reel');

    Promise.all([...reelsList].map((reel, i) => roll(reel, i)))
        .then(deltas => {
            deltas.forEach((delta, i) => indexes[i] = (indexes[i] + delta) % num_icons);
            debugEl.textContent = indexes.map(i => iconMap[i]).join(' - ');

            checkWin(indexes, betAmount);
        }).then(() => {
        // Aktualizacja salda w bazie danych JSON
        updateBalance(currentUserEmail, balance);
    });
}

function checkWin(indexes, betAmount) {                                          // Funkcja do sprawdzania wygranej
    const payouts = {
        "cherries": 1.3,
        "apple": 1.3,
        "orange": 1.3,
        "lemon": 1.5,
        "banana": 1.5,
        "watermelon": 1.5,
        "bell": 2,
        "star": 3,
        "seven": 10
    };

    const iconCounts = indexes.map(index => iconMap[index]).reduce((acc, icon) => {
        acc[icon] = (acc[icon] || 0) + 1;
        return acc;
    }, {});

    let winnings = 0;

    if (indexes[0] === indexes[1] && indexes[1] === indexes[2]) {
        const icon = iconMap[indexes[0]];
        winnings = betAmount * (payouts[icon] || 1) * 10;
        resultDiv.innerText = `MEGA WIN!$${winnings.toFixed(2)}`;
        resultDiv.style.color = "gold";
        updateBalanceDisplay()
    } else if (iconCounts[iconMap[indexes[0]]] >= 2 || iconCounts[iconMap[indexes[1]]] >= 2 || iconCounts[iconMap[indexes[2]]] >= 2) {
        const icon = indexes[0] === indexes[1] ? iconMap[indexes[0]] : indexes[1] === indexes[2] ? iconMap[indexes[1]] : iconMap[indexes[2]];
        winnings = betAmount * (payouts[icon] || 2);
        resultDiv.innerText = `WIN! wygrałeś!$${winnings.toFixed(2)}`;
        resultDiv.style.color = "green";
        updateBalanceDisplay()
    } else {
        resultDiv.innerText = "Przegrałeś!";
        resultDiv.style.color = "red";
        updateBalanceDisplay()
    }

    balance += winnings;
    updateBalanceDisplay();
}

function addToBet(amount) {                                                     // Funkcja do dodawania kwoty do zakładu
    let currentBet = parseFloat(betAmountInput.value) || 0;
    betAmountInput.value = (currentBet + amount).toFixed(2);
}

document.addEventListener('DOMContentLoaded', initializeBalance);               // Inicjalizacja salda po załadowaniu strony
spinButton.addEventListener('click', spin);                                     // Dodanie zdarzenia kliknięcia do przycisku spin
document.getElementById('bet-plus-1').addEventListener('click', () => addToBet(1));
document.getElementById('bet-plus-2').addEventListener('click', () => addToBet(2));
document.getElementById('bet-plus-5').addEventListener('click', () => addToBet(5)); // Dodanie zdarzenia kliknięcia do przycisku zakładu
document.getElementById('bet-plus-10').addEventListener('click', () => addToBet(10));
