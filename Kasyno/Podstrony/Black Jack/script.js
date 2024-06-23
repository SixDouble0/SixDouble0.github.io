let betAmount = 0;                                                              // Kwota zakladu
const audioDeal = new Audio('sounds/deal.wav');                                 // Dzwiek rozdania kart
const audioHit = new Audio('sounds/hit.wav');                                   // Dzwiek dobrania karty
let gameOver = false;
let deck = [];                                                                  // Talia kart
const suits = ["hearts", "diamonds", "clubs", "spades"];                        // Kolory kart
const values = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"]; // Wartosci kart
let gameStarted = false;
let dealerHand = [];                                                            // Reka krupiera
let playerHand = [];                                                            // Reka gracza
let balance = 0;                                                                // Saldo
let currentUserEmail = ''                                                       // Email obecnego uzytkownika

function getCurrentUserEmail() {                                                // Funkcja pobierajaca email zalogowanego uzytkownika
    const loggedInUser = localStorage.getItem('loggedInUser');
    if (loggedInUser) {
        const user = JSON.parse(loggedInUser);
        return user.email;
    }
    return null;
}

currentUserEmail = getCurrentUserEmail();                                       // Pobieranie emaila zalogowanego uzytkownika

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

function createDeck() {                                                         // Funkcja tworzenia talii kart
    deck = [];
    for (const suit of suits) {
        for (const value of values) {
            deck.push({ suit, value });
        }
    }
}

function shuffleDeck() {                                                        // Funkcja tasowania talii kart
    for (let i = 0; i < deck.length; i++) {
        const swapIdx = Math.trunc(Math.random() * deck.length);
        const tmp = deck[swapIdx];
        deck[swapIdx] = deck[i];
        deck[i] = tmp;
    }
}

function getNextCard() {                                                        // Funkcja pobierania nastepnej karty
    return deck.shift();
}

function createCardDiv(card) {                                                  // Funkcja tworzenia elementu karty
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card';
    const cardImg = document.createElement('img');
    cardImg.src = `Karty/${card.value}_of_${card.suit}.png`;
    cardDiv.appendChild(cardImg);
    return cardDiv;
}

function getCardValue(card) {                                                   // Funkcja pobierania wartosci karty
    switch (card.value) {
        case 'A':
            return 11;
        case 'K':
        case 'Q':
        case 'J':
            return 10;
        default:
            return parseInt(card.value);
    }
}

function revealDealerCard() {                                                   // Funkcja ujawnienia karty krupiera
    const dealerCards = document.getElementById('dealer-hand').getElementsByClassName('card');
    if (dealerCards.length > 1) {
        dealerCards[1].innerHTML = '';
        dealerCards[1].appendChild(createCardDiv(dealerHand[1]).querySelector('img'));
    }
}

function getHandValue(hand, countHiddenCard = true) {                           // Funkcja pobierania wartosci reki
    let value = 0;
    let aces = 0;
    for (let i = 0; i < hand.length; i++) {
        if (i === 1 && !countHiddenCard) continue;
        value += getCardValue(hand[i]);
        if (hand[i].value === 'A') aces++;
    }
    while (value > 21 && aces > 0) {
        value -= 10;
        aces--;
    }
    return value;
}

function checkForBlackjack(hand) {                                              // Funkcja sprawdzajaca blackjacka
    return getHandValue(hand) === 21 && hand.length === 2;
}

function updateScores() {                                                       // Funkcja aktualizujaca wyniki
    document.getElementById('dealer-value').textContent = getHandValue(dealerHand, false);
    document.getElementById('player-value').textContent = getHandValue(playerHand);
}

function updateDealerScoreAfterReveal() {                                       // Funkcja aktualizujaca wynik krupiera po ujawnieniu kart
    document.getElementById('dealer-value').textContent = getHandValue(dealerHand, true);
}

function dealNew() {                                                            // Funkcja rozdania nowych kart
    const betAmountInput = document.getElementById('bet-amount');
    betAmount = parseFloat(betAmountInput.value);
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

    document.getElementById('dealer-hand').innerHTML = '';
    document.getElementById('player-hand').innerHTML = '';
    document.getElementById('result').textContent = '';

    dealerHand = [getNextCard(), getNextCard()];
    playerHand = [getNextCard(), getNextCard()];

    dealerHand.forEach((card, i) => {
        const cardDiv = createCardDiv(card);
        if (i === 1) {
            const cardBackImg = document.createElement('img');
            cardBackImg.src = 'Karty/back_of_card.png';
            cardDiv.innerHTML = '';
            cardDiv.appendChild(cardBackImg);
        }
        document.getElementById('dealer-hand').appendChild(cardDiv);
    });
    playerHand.forEach(card => document.getElementById('player-hand').appendChild(createCardDiv(card)));
    audioDeal.play();
    gameStarted = true;

    updateScores();

    if (checkForBlackjack(playerHand)) {                                        // Sprawdzenie blackjacka dla gracza
        document.getElementById('result').textContent = 'Blackjack! Wygrałeś!';
        balance += betAmount * 2;
        updateBalance(currentUserEmail, balance);
        updateBalanceDisplay();
        audioWin.play();
        gameOver = true;
    } else if (checkForBlackjack(dealerHand)) {                                 // Sprawdzenie blackjacka dla krupiera
        revealDealerCard();
        updateDealerScoreAfterReveal();
        document.getElementById('result').textContent = 'Blackjack! Krupier wygrał!';
        audioLose.play();
        gameOver = true;
    }
}

document.getElementById('hit-button').addEventListener('click', function () {   // Dodanie zdarzenia dla przycisku "Hit"
    if (gameStarted && !gameOver) {
        playerHand.push(getNextCard());
        document.getElementById('player-hand').appendChild(createCardDiv(playerHand[playerHand.length - 1]));
        updateScores();
        if (getHandValue(playerHand) > 21) {
            document.getElementById('result').textContent = 'Przegrałeś!';
            document.getElementById('result').style.color = 'red';
            gameOver = true;
            audioLose.play();
        } else {
            audioHit.play();
        }
        updateBalance(currentUserEmail, balance);
    }
});

document.getElementById('stand-button').addEventListener('click', function () { // Dodanie zdarzenia dla przycisku "Stand"
    if (gameStarted && !gameOver) {
        revealDealerCard();
        updateDealerScoreAfterReveal();
        while (getHandValue(dealerHand, true) < 17) {
            dealerHand.push(getNextCard());
            document.getElementById('dealer-hand').appendChild(createCardDiv(dealerHand[dealerHand.length - 1]));
            updateDealerScoreAfterReveal();
        }
        if (getHandValue(dealerHand, true) > 21 || getHandValue(dealerHand, true) < getHandValue(playerHand)) {
            document.getElementById('result').textContent = 'WYGRAŁEŚ!';
            document.getElementById('result').style.color = 'gold';
            balance += betAmount * 2;
            updateBalance(currentUserEmail, balance);
            audioWin.play();
        } else if (getHandValue(dealerHand, true) > getHandValue(playerHand)) {
            document.getElementById('result').textContent = 'Przegrałeś!';
            document.getElementById('result').style.color = 'red';
            balance -= betAmount;
            updateBalance(currentUserEmail, balance);
            audioLose.play();
        } else {
            document.getElementById('result').textContent = 'Remis!';
            document.getElementById('result').style.color = 'yellow';
            balance += betAmount;
            updateBalance(currentUserEmail, balance);
        }
        gameOver = true;
        updateBalanceDisplay();
    }
});

document.getElementById('deal-button').addEventListener('click', function () {  // Dodanie zdarzenia dla przycisku "Deal"
    gameOver = false;
    gameStarted = false;
    dealNew();
});

function addToBet(amount) {                                                     // Funkcja dodawania kwoty do zakladu
    const betAmountInput = document.getElementById('bet-amount');
    let currentBet = parseFloat(betAmountInput.value) || 0;
    betAmountInput.value = (currentBet + amount).toFixed(2);
}

createDeck();                                                                   // Utworzenie talii kart
shuffleDeck();                                                                  // Tasowanie talii kart
initializeBalance();                                                            // Inicjalizacja salda
