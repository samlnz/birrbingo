// Index page functionality

class IndexPage {
    constructor() {
        this.gameState = gameState;
        this.telegramManager = telegramManager;
        
        // DOM elements
        this.currentPlayersEl = document.getElementById('currentPlayers');
        this.cardsTakenEl = document.getElementById('cardsTaken');
        this.timeLeftEl = document.getElementById('timeLeft');
        this.mainTimerEl = document.getElementById('mainTimer');
        this.startGameBtn = document.getElementById('startGameBtn');
        
        // Game state
        this.selectionTime = 60;
        this.timerInterval = null;
        this.isSelectionActive = false;
        
        this.init();
    }

    init() {
        this.initializeGame();
        this.setupEventListeners();
        
        // Simulate live updates
        this.startLiveUpdates();
    }

    initializeGame() {
        // Simulate random player count between 50-200
        this.gameState.activePlayers = Math.floor(Math.random() * 150) + 50;
        this.currentPlayersEl.textContent = this.gameState.activePlayers;
        
        // Simulate some cards already taken
        const cardsTaken = Math.floor(Math.random() * 100);
        this.cardsTakenEl.textContent = cardsTaken;
        
        // Update timer display
        this.updateTimerDisplay();
        
        // Update user info if Telegram is available
        this.updateUserInfo();
    }

    updateUserInfo() {
        // This would normally come from Telegram
        // For now, we'll use the game state
        console.log('User:', this.gameState.playerName, this.gameState.playerId);
    }

    updateTimerDisplay() {
        const minutes = Math.floor(this.selectionTime / 60);
        const seconds = this.selectionTime % 60;
        this.mainTimerEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        this.timeLeftEl.textContent = this.selectionTime;
    }

    startSelectionTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        this.isSelectionActive = true;
        this.selectionTime = 60;
        this.updateTimerDisplay();
        
        this.timerInterval = setInterval(() => {
            this.selectionTime--;
            this.updateTimerDisplay();
            
            if (this.selectionTime <= 0) {
                clearInterval(this.timerInterval);
                this.startGame();
            }
            
            // Add urgency effect when time is low
            if (this.selectionTime <= 10) {
                this.mainTimerEl.classList.add('animate-shake');
            } else {
                this.mainTimerEl.classList.remove('animate-shake');
            }
        }, 1000);
    }

    startGame() {
        // Show loading animation
        this.startGameBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> LOADING...';
        this.startGameBtn.disabled = true;
        
        // Save initial game state
        this.gameState.saveToSession();
        
        // Navigate to card selection page
        setTimeout(() => {
            BingoUtils.navigateTo('choose-cards.html');
        }, 1500);
    }

    setupEventListeners() {
        this.startGameBtn.addEventListener('click', () => {
            this.handleStartGame();
        });

        // Handle page visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                console.log('Page is hidden - pausing timers');
            } else {
                console.log('Page is visible - resuming timers');
            }
        });
    }

    handleStartGame() {
        // Start selection timer
        this.startSelectionTimer();
        
        // Update button
        this.startGameBtn.innerHTML = '<i class="fas fa-hourglass-start"></i> SELECTION STARTED';
        this.startGameBtn.style.background = 'linear-gradient(135deg, #ff9e00, #ff7700)';
        this.startGameBtn.disabled = true;
        
        // Simulate player joining
        this.gameState.activePlayers++;
        this.currentPlayersEl.textContent = this.gameState.activePlayers;
        
        // Send data to backend (simulated)
        this.sendGameStartData();
    }

    sendGameStartData() {
        // In a real app, this would send data to your backend
        const gameData = {
            action: 'game_start',
            playerId: this.gameState.playerId,
            playerName: this.gameState.playerName,
            timestamp: Date.now(),
            platform: 'telegram'
        };
        
        console.log('Sending game start data:', gameData);
        
        // If Telegram is available, send via Telegram
        if (this.telegramManager.isInitialized) {
            this.telegramManager.sendData(gameData);
        }
    }

    startLiveUpdates() {
        // Simulate live updates of player count
        setInterval(() => {
            const change = Math.random() > 0.5 ? 1 : -1;
            this.gameState.activePlayers = Math.max(50, this.gameState.activePlayers + change);
            this.currentPlayersEl.textContent = this.gameState.activePlayers;
            
            // Update cards taken
            const cardsChange = Math.floor(Math.random() * 3);
            const currentCards = parseInt(this.cardsTakenEl.textContent);
            this.cardsTakenEl.textContent = Math.min(500, currentCards + cardsChange);
        }, 5000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new IndexPage();
});