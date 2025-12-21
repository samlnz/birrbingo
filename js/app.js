class BingoApp {
    constructor() {
        this.gameState = {
            stake: 10,
            gameTimer: 60,
            realPlayers: new Set(),
            selectedCards: new Set(),
            prizePool: 0,
            gameActive: false,
            calledNumbers: new Set(),
            currentNumber: null,
            winner: null,
            gameStartTime: null
        };
        
        this.fixedCards = new Map(); // Store all 500 fixed cards
        this.playerCards = new Map(); // Player ID -> [cardNumbers]
        
        this.init();
    }
    
    init() {
        this.generateFixedCards();
        this.loadGameState();
        this.updateDisplay();
        this.startGameTimer();
        this.setupEventListeners();
    }
    
    generateFixedCards() {
        // Generate 500 fixed bingo cards with same numbers
        for (let cardNum = 1; cardNum <= 500; cardNum++) {
            const card = this.createBingoCard(cardNum);
            this.fixedCards.set(cardNum, card);
        }
    }
    
    createBingoCard(cardNumber) {
        // Use card number as seed for consistent generation
        const seed = cardNumber;
        const card = {
            id: cardNumber,
            numbers: [],
            pattern: this.generateCardPattern(seed)
        };
        
        // Generate numbers based on BINGO columns
        const ranges = {
            'B': [1, 15],
            'I': [16, 30],
            'N': [31, 45],
            'G': [46, 60],
            'O': [61, 75]
        };
        
        // Create 5x5 grid with FREE in center
        for (let col = 0; col < 5; col++) {
            const [min, max] = Object.values(ranges)[col];
            const columnNumbers = this.generateColumnNumbers(min, max, seed + col);
            
            for (let row = 0; row < 5; row++) {
                if (col === 2 && row === 2) {
                    card.numbers.push('FREE');
                } else {
                    card.numbers.push(columnNumbers[row]);
                }
            }
        }
        
        return card;
    }
    
    generateCardPattern(seed) {
        // Generate winning pattern for validation
        const patterns = [
            'horizontal', 'vertical', 'diagonal', 'four-corners'
        ];
        return patterns[seed % patterns.length];
    }
    
    generateColumnNumbers(min, max, seed) {
        // Generate unique numbers for a column
        const numbers = new Set();
        let attempts = 0;
        
        while (numbers.size < 5 && attempts < 100) {
            const num = this.seededRandom(min, max, seed + attempts);
            numbers.add(num);
            attempts++;
        }
        
        return Array.from(numbers).sort((a, b) => a - b);
    }
    
    seededRandom(min, max, seed) {
        // Deterministic random based on seed
        const x = Math.sin(seed) * 10000;
        const random = x - Math.floor(x);
        return Math.floor(random * (max - min + 1)) + min;
    }
    
    startGameTimer() {
        setInterval(() => {
            if (this.gameState.gameTimer > 0) {
                this.gameState.gameTimer--;
                this.updateTimerDisplay();
                
                if (this.gameState.gameTimer === 0 && !this.gameState.gameActive) {
                    this.startGame();
                }
            }
        }, 1000);
    }
    
    updateTimerDisplay() {
        const timerEl = document.getElementById('gameTimer');
        if (timerEl) {
            const minutes = Math.floor(this.gameState.gameTimer / 60);
            const seconds = this.gameState.gameTimer % 60;
            timerEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            // Change color when time is running low
            if (this.gameState.gameTimer <= 10) {
                timerEl.style.color = '#ff7675';
                timerEl.style.textShadow = '0 0 20px rgba(255, 118, 117, 0.5)';
            }
        }
    }
    
    startGame() {
        this.gameState.gameActive = true;
        this.gameState.gameStartTime = Date.now();
        this.gameState.calledNumbers.clear();
        
        // Start number calling for players in game
        this.startNumberCalling();
        
        // Update UI
        document.getElementById('playerStatus').textContent = 'Game Active';
        document.getElementById('playButton').disabled = true;
    }
    
    startNumberCalling() {
        // Call numbers every 5 seconds
        this.callInterval = setInterval(() => {
            this.callNextNumber();
        }, 5000);
        
        // Call first number immediately
        setTimeout(() => this.callNextNumber(), 1000);
    }
    
    callNextNumber() {
        if (this.gameState.calledNumbers.size >= 75) {
            this.endGame();
            return;
        }
        
        let number;
        do {
            number = Math.floor(Math.random() * 75) + 1;
        } while (this.gameState.calledNumbers.has(number));
        
        this.gameState.calledNumbers.add(number);
        this.gameState.currentNumber = number;
        
        // Update all players' cards
        this.updateAllPlayersCards(number);
        
        // Check for winners
        this.checkForWinners();
    }
    
    updateAllPlayersCards(number) {
        // Update marked numbers for all active players
        for (const playerId of this.gameState.realPlayers) {
            const playerCards = this.playerCards.get(playerId) || [];
            
            playerCards.forEach(cardNum => {
                this.markNumberOnCard(playerId, cardNum, number);
            });
        }
    }
    
    markNumberOnCard(playerId, cardNum, number) {
        const card = this.fixedCards.get(cardNum);
        if (!card) return;
        
        // Check if number exists on card
        if (card.numbers.includes(number)) {
            // Mark as called
            if (!card.markedNumbers) card.markedNumbers = new Set();
            card.markedNumbers.add(number);
            
            // Update UI if player is viewing this card
            this.updateCardDisplay(cardNum, number, true);
        }
    }
    
    checkForWinners() {
        // Validate winners based on actual called numbers
        for (const playerId of this.gameState.realPlayers) {
            const playerCards = this.playerCards.get(playerId) || [];
            
            for (const cardNum of playerCards) {
                const card = this.fixedCards.get(cardNum);
                if (this.hasWinningLine(card)) {
                    this.declareWinner(playerId, cardNum);
                    return;
                }
            }
        }
    }
    
    hasWinningLine(card) {
        if (!card.markedNumbers) return false;
        
        const marked = new Set(card.markedNumbers);
        marked.add('FREE'); // Center is always marked
        
        // Check all possible winning lines
        const winningPatterns = this.getWinningPatterns();
        
        for (const pattern of winningPatterns) {
            if (this.checkPattern(pattern, card, marked)) {
                return true;
            }
        }
        
        return false;
    }
    
    checkPattern(pattern, card, marked) {
        switch (pattern) {
            case 'horizontal':
                return this.checkHorizontalLines(card, marked);
            case 'vertical':
                return this.checkVerticalLines(card, marked);
            case 'diagonal':
                return this.checkDiagonals(card, marked);
            case 'four-corners':
                return this.checkFourCorners(card, marked);
            default:
                return false;
        }
    }
    
    checkHorizontalLines(card, marked) {
        for (let row = 0; row < 5; row++) {
            let complete = true;
            for (let col = 0; col < 5; col++) {
                const index = row * 5 + col;
                if (!marked.has(card.numbers[index])) {
                    complete = false;
                    break;
                }
            }
            if (complete) return true;
        }
        return false;
    }
    
    declareWinner(playerId, cardNum) {
        // Calculate prize
        const totalStakes = this.gameState.realPlayers.size * this.gameState.stake;
        const prize = totalStakes * 0.8; // 80% to winner
        
        this.gameState.winner = {
            playerId,
            cardNum,
            prize: Math.floor(prize),
            winningNumbers: Array.from(this.gameState.calledNumbers),
            gameTime: (Date.now() - this.gameState.gameStartTime) / 1000
        };
        
        // End game
        clearInterval(this.callInterval);
        this.endGame();
        
        // Show winner page
        this.showWinner();
    }
    
    showWinner() {
        // Store winner data
        localStorage.setItem('lastWinner', JSON.stringify(this.gameState.winner));
        
        // Redirect to winner page
        window.location.href = 'winner.html';
    }
    
    resetGame() {
        this.gameState = {
            stake: 10,
            gameTimer: 60,
            realPlayers: new Set(this.gameState.realPlayers), // Keep real players
            selectedCards: new Set(),
            prizePool: 0,
            gameActive: false,
            calledNumbers: new Set(),
            currentNumber: null,
            winner: null,
            gameStartTime: null
        };
        
        // Reset card markings
        this.fixedCards.forEach(card => {
            card.markedNumbers = new Set();
        });
        
        this.updateDisplay();
        this.updateTimerDisplay();
        
        // Re-enable play button
        const playButton = document.getElementById('playButton');
        if (playButton) {
            playButton.disabled = false;
            playButton.textContent = 'PLAY NOW - 10 BIRR';
        }
    }
    
    updateDisplay() {
        // Update real players count
        document.getElementById('realPlayers').textContent = this.gameState.realPlayers.size;
        
        // Update cards taken
        document.getElementById('cardsTaken').textContent = 
            `${this.gameState.selectedCards.size}/500`;
        
        // Update prize pool
        const prizePool = this.gameState.realPlayers.size * this.gameState.stake * 0.8;
        document.getElementById('prizePool').textContent = `${Math.floor(prizePool)} BIRR`;
    }
    
    loadGameState() {
        const saved = localStorage.getItem('bingoGameState');
        if (saved) {
            const data = JSON.parse(saved);
            this.gameState.realPlayers = new Set(data.realPlayers || []);
            this.gameState.selectedCards = new Set(data.selectedCards || []);
            
            // Load player cards
            const playerCardsData = localStorage.getItem('playerCards');
            if (playerCardsData) {
                this.playerCards = new Map(Object.entries(JSON.parse(playerCardsData)));
            }
        }
    }
    
    saveGameState() {
        const state = {
            realPlayers: Array.from(this.gameState.realPlayers),
            selectedCards: Array.from(this.gameState.selectedCards),
            prizePool: this.gameState.prizePool,
            gameTimer: this.gameState.gameTimer
        };
        
        localStorage.setItem('bingoGameState', JSON.stringify(state));
        
        // Save player cards
        const playerCardsObj = Object.fromEntries(this.playerCards);
        localStorage.setItem('playerCards', JSON.stringify(playerCardsObj));
    }
    
    setupEventListeners() {
        const playButton = document.getElementById('playButton');
        if (playButton) {
            playButton.addEventListener('click', () => {
                this.handlePlay();
            });
        }
    }
    
    handlePlay() {
        // Check if player already in game
        if (this.gameState.realPlayers.has(this.getPlayerId())) {
            // Go to card selection
            window.location.href = 'choose-cards.html';
        } else {
            // Add player and deduct stake
            this.addPlayer();
        }
    }
    
    addPlayer() {
        const playerId = this.getPlayerId();
        
        // Add to real players
        this.gameState.realPlayers.add(playerId);
        
        // Deduct stake (in real app, this would be via Telegram payment)
        this.deductStake();
        
        // Save state
        this.saveGameState();
        
        // Update display
        this.updateDisplay();
        
        // Go to card selection
        window.location.href = 'choose-cards.html';
    }
    
    deductStake() {
        // This would integrate with Telegram Payments
        console.log('Deducting 10 BIRR from player');
        // In production, implement Telegram Payments API
    }
    
    getPlayerId() {
        // Get Telegram user ID or generate unique ID
        if (window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
            return window.Telegram.WebApp.initDataUnsafe.user.id.toString();
        }
        
        // Fallback to localStorage ID
        let playerId = localStorage.getItem('playerId');
        if (!playerId) {
            playerId = 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('playerId', playerId);
        }
        
        return playerId;
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.bingoApp = new BingoApp();
});