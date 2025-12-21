// Game state variables
let gameState = {
    calledNumbers: [],
    remainingNumbers: [],
    isAutoCalling: false,
    isAutoMarking: false,
    gameStarted: false,
    gameEnded: false,
    winners: [],
    playerCards: [],
    autoCallInterval: null,
    playerInfo: null,
    selectedCards: []
};

// Bingo card ranges
const BINGO_RANGES = {
    'B': { min: 1, max: 15 },
    'I': { min: 16, max: 30 },
    'N': { min: 31, max: 45 },
    'G': { min: 46, max: 60 },
    'O': { min: 61, max: 75 }
};

// Initialize game
document.addEventListener('DOMContentLoaded', function() {
    initGame();
    initTelegram();
});

// Initialize Telegram WebApp
function initTelegram() {
    const tg = window.Telegram.WebApp;
    tg.expand();
    
    // Get player info
    try {
        const storedInfo = localStorage.getItem('playerInfo');
        if (storedInfo) {
            gameState.playerInfo = JSON.parse(storedInfo);
        }
    } catch (e) {
        console.error('Error loading player info:', e);
    }
    
    // Get selected cards
    try {
        const storedCards = localStorage.getItem('selectedCards');
        if (storedCards) {
            gameState.selectedCards = JSON.parse(storedCards);
        }
    } catch (e) {
        console.error('Error loading selected cards:', e);
    }
}

// Initialize game state
function initGame() {
    // Initialize numbers 1-75
    gameState.remainingNumbers = Array.from({length: 75}, (_, i) => i + 1);
    shuffleArray(gameState.remainingNumbers);
    
    // Load player cards
    generatePlayerCards();
    
    // Initialize UI
    updateCalledNumbersDisplay();
    updatePlayerCount();
    updateBingoButton();
    
    // Set up audio
    setupAudio();
    
    // Start auto-call after 3 seconds if no cards selected (demo mode)
    if (gameState.selectedCards.length === 0) {
        setTimeout(() => {
            gameState.selectedCards = [Math.floor(Math.random() * 500) + 1, 
                                     Math.floor(Math.random() * 500) + 1];
            generatePlayerCards();
            startAutoCall();
        }, 3000);
    }
}

// Generate bingo cards for player
function generatePlayerCards() {
    const container = document.getElementById('cardsContainer');
    container.innerHTML = '';
    
    gameState.playerCards = [];
    
    gameState.selectedCards.forEach((cardId, index) => {
        const cardData = generateBingoCard(cardId);
        gameState.playerCards.push(cardData);
        
        const cardElement = createCardElement(cardData, index);
        container.appendChild(cardElement);
    });
}

// Generate a bingo card from seed
function generateBingoCard(seed) {
    const card = {
        id: seed,
        numbers: [],
        marked: Array(25).fill(false),
        markedCount: 0,
        lastWinningLine: null
    };
    
    // Set seed for deterministic generation
    const rng = new Math.seedrandom(seed.toString());
    
    // Generate numbers for each column
    const letters = ['B', 'I', 'N', 'G', 'O'];
    
    letters.forEach((letter, colIndex) => {
        const range = BINGO_RANGES[letter];
        const columnNumbers = [];
        
        // Generate 5 unique numbers for this column
        while (columnNumbers.length < 5) {
            const num = Math.floor(rng() * (range.max - range.min + 1)) + range.min;
            if (!columnNumbers.includes(num)) {
                columnNumbers.push(num);
            }
        }
        
        // Sort numbers
        columnNumbers.sort((a, b) => a - b);
        
        // Place in card
        for (let row = 0; row < 5; row++) {
            if (colIndex === 2 && row === 2) {
                // Free space
                card.numbers[row * 5 + colIndex] = 'FREE';
            } else {
                card.numbers[row * 5 + colIndex] = columnNumbers[row];
            }
        }
    });
    
    // Mark free space
    card.marked[12] = true;
    card.markedCount = 1;
    
    return card;
}

// Create card HTML element
function createCardElement(cardData, cardIndex) {
    const card = document.createElement('div');
    card.className = 'bingo-card';
    card.id = `card-${cardData.id}`;
    
    const letters = ['B', 'I', 'N', 'G', 'O'];
    
    card.innerHTML = `
        <div class="card-header">
            <h3><i class="fas fa-ticket-alt"></i> Card #${cardData.id}</h3>
            <div class="card-stats">
                <span class="stat-badge">Marked: <span id="markedCount-${cardIndex}">1</span>/25</span>
                <span class="stat-badge">Lines: <span id="linesCount-${cardIndex}">0</span></span>
            </div>
        </div>
        <div class="bingo-grid">
            <div class="grid-header">
                ${letters.map(letter => `<div class="letter-cell">${letter}</div>`).join('')}
            </div>
            ${Array.from({length: 25}, (_, i) => {
                const row = Math.floor(i / 5);
                const col = i % 5;
                const number = cardData.numbers[i];
                const isMarked = cardData.marked[i];
                const isFree = i === 12;
                
                let cellClass = 'number-cell';
                if (isFree) cellClass += ' free';
                if (isMarked) cellClass += ' marked';
                
                return `
                    <div class="${cellClass}" 
                         data-card="${cardIndex}" 
                         data-index="${i}"
                         onclick="markNumber(${cardIndex}, ${i})">
                        ${isFree ? 'FREE' : number}
                    </div>
                `;
            }).join('')}
        </div>
        <div class="card-progress">
            <div class="progress-bar">
                <div class="progress-fill" id="progress-${cardIndex}" style="width: 4%"></div>
            </div>
        </div>
    `;
    
    return card;
}

// Shuffle array using Fisher-Yates algorithm
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Call next number
function callNextNumber() {
    if (gameState.gameEnded) return;
    if (gameState.remainingNumbers.length === 0) {
        endGame();
        return;
    }
    
    // Get next number
    const number = gameState.remainingNumbers.pop();
    gameState.calledNumbers.push(number);
    
    // Play sound
    playNumberCallSound(number);
    
    // Update displays
    updateCurrentNumberDisplay(number);
    updateRecentNumbersDisplay();
    updateCalledNumbersDisplay();
    
    // Auto-mark numbers if enabled
    if (gameState.isAutoMarking) {
        markCalledNumbersOnCards();
    }
    
    // Check for wins
    checkForWins();
    
    // Update player count (simulate)
    updatePlayerCount();
}

// Update current number display with animation
function updateCurrentNumberDisplay(number) {
    const currentNumberEl = document.getElementById('currentNumber');
    const letter = getNumberLetter(number);
    
    // Add animation class
    currentNumberEl.classList.add('pulse');
    
    setTimeout(() => {
        currentNumberEl.innerHTML = `
            <span class="letter">${letter}</span>
            <span class="number">${number}</span>
        `;
        currentNumberEl.classList.remove('pulse');
    }, 300);
    
    // Update history
    const historyEl = document.getElementById('numberHistory');
    const history = gameState.calledNumbers.slice(-5).reverse();
    historyEl.textContent = history.map(n => `${getNumberLetter(n)}${n}`).join(', ');
}

// Get letter for number
function getNumberLetter(number) {
    if (number <= 15) return 'B';
    if (number <= 30) return 'I';
    if (number <= 45) return 'N';
    if (number <= 60) return 'G';
    return 'O';
}

// Update recent numbers display
function updateRecentNumbersDisplay() {
    const recentBalls = document.getElementById('recentBalls');
    const recentNumbers = gameState.calledNumbers.slice(-10).reverse();
    
    recentBalls.innerHTML = recentNumbers.map(number => `
        <div class="recent-ball">
            <span class="letter">${getNumberLetter(number)}</span>
            <span class="number">${number}</span>
        </div>
    `).join('');
}

// Update called numbers count
function updateCalledNumbersDisplay() {
    document.getElementById('calledCount').textContent = gameState.calledNumbers.length;
}

// Update player count (simulated)
function updatePlayerCount() {
    const playerCount = document.getElementById('playerCount');
    const remainingPlayers = 500 - Math.floor(gameState.calledNumbers.length / 2);
    playerCount.textContent = Math.max(1, remainingPlayers);
}

// Toggle auto-call
function toggleAutoCall() {
    const btn = document.getElementById('autoCallBtn');
    
    if (gameState.isAutoCalling) {
        stopAutoCall();
        btn.innerHTML = '<i class="fas fa-play"></i> Auto Call (5s)';
        btn.style.background = 'linear-gradient(135deg, var(--primary-color), #7C3AED)';
    } else {
        startAutoCall();
        btn.innerHTML = '<i class="fas fa-pause"></i> Stop Auto Call';
        btn.style.background = 'linear-gradient(135deg, var(--danger-color), #dc2626)';
    }
    
    gameState.isAutoCalling = !gameState.isAutoCalling;
}

// Start auto-calling numbers every 5 seconds
function startAutoCall() {
    if (gameState.autoCallInterval) clearInterval(gameState.autoCallInterval);
    
    gameState.autoCallInterval = setInterval(() => {
        if (!gameState.gameEnded) {
            callNextNumber();
        } else {
            stopAutoCall();
        }
    }, 5000);
    
    // Call first number immediately
    if (gameState.calledNumbers.length === 0) {
        setTimeout(callNextNumber, 1000);
    }
}

// Stop auto-call
function stopAutoCall() {
    if (gameState.autoCallInterval) {
        clearInterval(gameState.autoCallInterval);
        gameState.autoCallInterval = null;
    }
}

// Toggle auto-mark
function toggleAutoMark() {
    gameState.isAutoMarking = !gameState.isAutoMarking;
    
    const icon = document.getElementById('autoMarkIcon');
    const text = document.getElementById('autoMarkText');
    
    if (gameState.isAutoMarking) {
        icon.className = 'fas fa-robot';
        text.textContent = 'Auto-Mark: ON';
        markCalledNumbersOnCards();
    } else {
        icon.className = 'fas fa-robot';
        text.textContent = 'Auto-Mark: OFF';
    }
}

// Mark called numbers on all cards
function markCalledNumbersOnCards() {
    gameState.playerCards.forEach((card, cardIndex) => {
        card.numbers.forEach((number, cellIndex) => {
            if (number !== 'FREE' && gameState.calledNumbers.includes(number) && !card.marked[cellIndex]) {
                markNumber(cardIndex, cellIndex, true);
            }
        });
    });
}

// Mark a number on a card
function markNumber(cardIndex, cellIndex, silent = false) {
    const card = gameState.playerCards[cardIndex];
    
    if (card.marked[cellIndex] || gameState.gameEnded) return;
    
    card.marked[cellIndex] = true;
    card.markedCount++;
    
    // Update UI
    const cell = document.querySelector(`[data-card="${cardIndex}"][data-index="${cellIndex}"]`);
    if (cell) {
        cell.classList.add('marked');
    }
    
    // Update stats
    updateCardStats(cardIndex);
    
    // Check for win
    checkCardForWin(cardIndex);
    
    // Play sound if not silent
    if (!silent) {
        playSound('mark');
    }
}

// Update card statistics
function updateCardStats(cardIndex) {
    const card = gameState.playerCards[cardIndex];
    
    // Update marked count
    const markedEl = document.getElementById(`markedCount-${cardIndex}`);
    if (markedEl) markedEl.textContent = card.markedCount;
    
    // Update progress bar
    const progressEl = document.getElementById(`progress-${cardIndex}`);
    if (progressEl) {
        const percentage = (card.markedCount / 25) * 100;
        progressEl.style.width = `${percentage}%`;
    }
}

// Check a specific card for winning lines
function checkCardForWin(cardIndex) {
    const card = gameState.playerCards[cardIndex];
    const winningLines = [];
    
    // Check rows
    for (let row = 0; row < 5; row++) {
        let complete = true;
        for (let col = 0; col < 5; col++) {
            if (!card.marked[row * 5 + col]) {
                complete = false;
                break;
            }
        }
        if (complete) winningLines.push({type: 'row', index: row});
    }
    
    // Check columns
    for (let col = 0; col < 5; col++) {
        let complete = true;
        for (let row = 0; row < 5; row++) {
            if (!card.marked[row * 5 + col]) {
                complete = false;
                break;
            }
        }
        if (complete) winningLines.push({type: 'column', index: col});
    }
    
    // Check diagonals
    let diag1Complete = true;
    let diag2Complete = true;
    for (let i = 0; i < 5; i++) {
        if (!card.marked[i * 5 + i]) diag1Complete = false;
        if (!card.marked[i * 5 + (4 - i)]) diag2Complete = false;
    }
    if (diag1Complete) winningLines.push({type: 'diagonal', index: 0});
    if (diag2Complete) winningLines.push({type: 'diagonal', index: 1});
    
    return winningLines;
}

// Check all cards for wins
function checkForWins() {
    gameState.playerCards.forEach((card, cardIndex) => {
        const winningLines = checkCardForWin(cardIndex);
        
        if (winningLines.length > 0 && !card.lastWinningLine) {
            // New win detected
            card.lastWinningLine = winningLines[0];
            
            // Highlight winning cells
            highlightWinningCells(cardIndex, winningLines[0]);
            
            // Enable bingo button
            updateBingoButton();
            
            // If auto-mark is on, auto-declare bingo after 2 seconds
            if (gameState.isAutoMarking) {
                setTimeout(() => declareBingo(cardIndex), 2000);
            }
        }
    });
}

// Highlight winning cells
function highlightWinningCells(cardIndex, winningLine) {
    const cells = [];
    
    switch (winningLine.type) {
        case 'row':
            for (let col = 0; col < 5; col++) {
                cells.push(winningLine.index * 5 + col);
            }
            break;
        case 'column':
            for (let row = 0; row < 5; row++) {
                cells.push(row * 5 + winningLine.index);
            }
            break;
        case 'diagonal':
            if (winningLine.index === 0) {
                // Main diagonal
                for (let i = 0; i < 5; i++) {
                    cells.push(i * 5 + i);
                }
            } else {
                // Anti-diagonal
                for (let i = 0; i < 5; i++) {
                    cells.push(i * 5 + (4 - i));
                }
            }
            break;
    }
    
    cells.forEach(cellIndex => {
        const cell = document.querySelector(`[data-card="${cardIndex}"][data-index="${cellIndex}"]`);
        if (cell) {
            cell.classList.add('winning-cell');
        }
    });
}

// Update bingo button state
function updateBingoButton() {
    const btn = document.getElementById('bingoBtn');
    const hasWin = gameState.playerCards.some(card => card.lastWinningLine);
    
    btn.disabled = !hasWin || gameState.gameEnded;
}

// Declare bingo
function declareBingo(cardIndex = null) {
    if (gameState.gameEnded) return;
    
    // Find winning card
    let winningCardIndex = cardIndex;
    if (winningCardIndex === null) {
        winningCardIndex = gameState.playerCards.findIndex(card => card.lastWinningLine);
    }
    
    if (winningCardIndex === -1) {
        showToast('No winning line found!', 'error');
        return;
    }
    
    const winningCard = gameState.playerCards[winningCardIndex];
    
    // Stop auto-call
    stopAutoCall();
    
    // Add to winners list
    const winner = {
        playerId: gameState.playerInfo?.id || 'DemoPlayer',
        username: gameState.playerInfo?.username || 'Demo Player',
        cardId: winningCard.id,
        cardIndex: winningCardIndex,
        winType: winningCard.lastWinningLine.type,
        winTime: new Date().toLocaleTimeString(),
        prize: calculatePrize()
    };
    
    gameState.winners.push(winner);
    gameState.gameEnded = true;
    
    // Update winners board
    updateWinnersBoard();
    
    // Show winner modal
    showWinnerModal(winner);
    
    // Play win sound
    playWinSound();
    
    // Disable bingo button
    document.getElementById('bingoBtn').disabled = true;
}

// Calculate prize based on game progress
function calculatePrize() {
    const basePrize = 1000;
    const multiplier = Math.max(1, 75 - gameState.calledNumbers.length);
    return basePrize * multiplier;
}

// Update winners board
function updateWinnersBoard() {
    const winnersList = document.getElementById('winnersList');
    
    if (gameState.winners.length === 0) {
        winnersList.innerHTML = `
            <div class="no-winners">
                <i class="fas fa-trophy"></i>
                <p>No winners yet. Be the first!</p>
            </div>
        `;
        return;
    }
    
    winnersList.innerHTML = gameState.winners.map((winner, index) => `
        <div class="winner-entry">
            <div class="winner-avatar">
                ${index === 0 ? '<i class="fas fa-crown"></i>' : `<i class="fas fa-user"></i>`}
            </div>
            <div class="winner-details">
                <h4>${winner.username}</h4>
                <p>Card #${winner.cardId} • ${winner.winType} • ${winner.winTime}</p>
            </div>
            <div class="winner-prize-badge">
                ${winner.prize} Chips
            </div>
        </div>
    `).join('');
}

// Show winner modal
function showWinnerModal(winner) {
    document.getElementById('winnerName').textContent = winner.username;
    document.getElementById('winnerCard').textContent = `Card #${winner.cardId} • ${winner.winType.toUpperCase()} line`;
    
    // Create confetti
    createConfetti();
    
    // Show modal
    document.getElementById('winnerModal').style.display = 'flex';
    
    // Play win sound
    playWinSound();
}

// Create confetti animation
function createConfetti() {
    const container = document.querySelector('.confetti-container');
    container.innerHTML = '';
    
    const colors = ['#fbbf24', '#10b981', '#8b5cf6', '#ef4444', '#3b82f6'];
    
    for (let i = 0; i < 150; i++) {
        const confetti = document.createElement('div');
        confetti.style.cssText = `
            position: absolute;
            width: 10px;
            height: 10px;
            background: ${colors[Math.floor(Math.random() * colors.length)]};
            top: -20px;
            left: ${Math.random() * 100}%;
            border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
            animation: confettiFall ${Math.random() * 3 + 2}s linear forwards;
            transform: rotate(${Math.random() * 360}deg);
        `;
        
        container.appendChild(confetti);
    }
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes confettiFall {
            to {
                transform: translateY(100vh) rotate(${Math.random() * 720}deg);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

// Reset game
function resetGame() {
    stopAutoCall();
    
    // Reset game state
    gameState = {
        calledNumbers: [],
        remainingNumbers: Array.from({length: 75}, (_, i) => i + 1),
        isAutoCalling: false,
        isAutoMarking: false,
        gameStarted: false,
        gameEnded: false,
        winners: [],
        playerCards: [],
        autoCallInterval: null,
        playerInfo: gameState.playerInfo,
        selectedCards: gameState.selectedCards
    };
    
    shuffleArray(gameState.remainingNumbers);
    
    // Reset UI
    document.getElementById('autoCallBtn').innerHTML = '<i class="fas fa-play"></i> Auto Call (5s)';
    document.getElementById('autoCallBtn').style.background = 'linear-gradient(135deg, var(--primary-color), #7C3AED)';
    
    // Regenerate cards
    generatePlayerCards();
    updateCalledNumbersDisplay();
    updateWinnersBoard();
    updateBingoButton();
    
    // Reset current number display
    document.getElementById('currentNumber').innerHTML = `
        <span class="letter">B</span>
        <span class="number">--</span>
    `;
    
    document.getElementById('numberHistory').textContent = 'No numbers called yet';
    document.getElementById('recentBalls').innerHTML = '';
    
    showToast('Game reset! Ready to play again.', 'info');
}

// Restart game (after win)
function restartGame() {
    resetGame();
    setTimeout(startAutoCall, 1000);
}

// End game (when all numbers called)
function endGame() {
    gameState.gameEnded = true;
    stopAutoCall();
    
    showToast('All numbers have been called! Game over.', 'info');
    
    // If no winners, pick random winner
    if (gameState.winners.length === 0) {
        setTimeout(() => {
            const randomCard = Math.floor(Math.random() * gameState.playerCards.length);
            declareBingo(randomCard);
        }, 2000);
    }
}

// Audio functions
function setupAudio() {
    // Preload sounds
    const sounds = ['numberCallSound', 'bingoSound', 'winSound'];
    sounds.forEach(soundId => {
        const audio = document.getElementById(soundId);
        if (audio) {
            audio.load();
        }
    });
}

function playNumberCallSound(number) {
    const audio = document.getElementById('numberCallSound');
    if (audio) {
        audio.currentTime = 0;
        audio.play().catch(e => console.log('Audio play failed:', e));
    }
}

function playBingoSound() {
    const audio = document.getElementById('bingoSound');
    if (audio) {
        audio.currentTime = 0;
        audio.play().catch(e => console.log('Audio play failed:', e));
    }
}

function playWinSound() {
    const audio = document.getElementById('winSound');
    if (audio) {
        audio.currentTime = 0;
        audio.play().catch(e => console.log('Audio play failed:', e));
    }
}

function toggleAudio() {
    const audioIcon = document.getElementById('audioIcon');
    const isMuted = audioIcon.classList.contains('fa-volume-mute');
    
    if (isMuted) {
        audioIcon.className = 'fas fa-volume-up';
        // Unmute all audio
        document.querySelectorAll('audio').forEach(audio => {
            audio.muted = false;
        });
    } else {
        audioIcon.className = 'fas fa-volume-mute';
        // Mute all audio
        document.querySelectorAll('audio').forEach(audio => {
            audio.muted = true;
        });
    }
}

// Utility functions
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'error' ? 'var(--danger-color)' : 
                     type === 'success' ? 'var(--secondary-color)' : 
                     type === 'warning' ? 'var(--accent-color)' : 'var(--primary-color)'};
        color: white;
        border-radius: 10px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        font-weight: 600;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function playSound(type) {
    // Add sound implementation here
    console.log(`Playing ${type} sound`);
}