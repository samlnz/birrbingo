// Choose cards page functionality

class ChooseCardsPage {
    constructor() {
        this.gameState = gameState;
        this.telegramManager = telegramManager;
        
        // DOM elements
        this.cardsGrid = document.getElementById('cardsGrid');
        this.card1Number = document.getElementById('card1Number');
        this.card2Number = document.getElementById('card2Number');
        this.card1Preview = document.getElementById('card1Preview');
        this.card2Preview = document.getElementById('card2Preview');
        this.cardsSelected = document.getElementById('cardsSelected');
        this.totalCardsTaken = document.getElementById('totalCardsTaken');
        this.activePlayers = document.getElementById('activePlayers');
        this.selectionProgress = document.getElementById('selectionProgress');
        this.selectionTimer = document.getElementById('selectionTimer');
        this.randomSelectBtn = document.getElementById('randomSelectBtn');
        this.clearSelectionBtn = document.getElementById('clearSelectionBtn');
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.loadingText = document.getElementById('loadingText');
        this.playerName = document.getElementById('playerName');
        this.playerId = document.getElementById('playerId');
        this.playerAvatar = document.getElementById('playerAvatar');
        
        // Game state
        this.takenCards = new Set();
        this.totalCards = 500;
        this.maxCards = 2;
        this.selectionTime = 60;
        this.timerInterval = null;
        this.autoConfirmTimer = null;
        
        this.init();
    }

    init() {
        this.setupUserInfo();
        this.generateTakenCards();
        this.createCardGrid();
        
        // Set initial player count to 0 (no fake players)
        this.gameState.activePlayers = 0;
        
        this.updateDisplays();
        this.startSelectionTimer();
        this.setupEventListeners();
    }

    setupUserInfo() {
        this.playerName.textContent = this.gameState.playerName;
        this.playerId.textContent = this.gameState.playerId;
        this.playerAvatar.textContent = this.gameState.playerName.charAt(0).toUpperCase();
        
        // Generate random avatar color
        const colors = ['#00b4d8', '#0077b6', '#0096c7', '#005f8a', '#03045e'];
        this.playerAvatar.style.background = colors[Math.floor(Math.random() * colors.length)];
    }

    generateTakenCards() {
        // Only track real players who selected through the link
        // Start with empty taken cards
        this.takenCards = new Set();
    }

    createCardGrid() {
        this.cardsGrid.innerHTML = '';
        
        for (let i = 1; i <= this.totalCards; i++) {
            const cardElement = document.createElement('div');
            cardElement.className = 'card-number';
            cardElement.textContent = i;
            cardElement.dataset.cardNumber = i;
            
            if (this.takenCards.has(i)) {
                cardElement.classList.add('taken');
                cardElement.title = 'Already taken by another player';
            } else {
                cardElement.addEventListener('click', () => this.selectCard(i));
            }
            
            this.cardsGrid.appendChild(cardElement);
        }
    }

    selectCard(cardNumber) {
        // Check if card is already selected
        if (this.gameState.selectedCards.includes(cardNumber)) {
            // Deselect card
            const index = this.gameState.selectedCards.indexOf(cardNumber);
            this.gameState.selectedCards.splice(index, 1);
            this.updateCardElements();
            this.cancelAutoConfirm();
            return;
        }
        
        // Check if max cards reached
        if (this.gameState.selectedCards.length >= this.maxCards) {
            BingoUtils.showNotification(`You can only select ${this.maxCards} cards maximum`, 'warning');
            return;
        }
        
        // Add card to selection
        this.gameState.selectedCards.push(cardNumber);
        
        // Update displays
        this.updateCardElements();
        this.updateSelectedCardsDisplay();
        this.updateDisplays();
        
        // Check if we have selected maximum cards
        if (this.gameState.selectedCards.length >= this.maxCards) {
            // Auto-confirm after 1 second
            this.startAutoConfirm();
        }
    }

    cancelAutoConfirm() {
        if (this.autoConfirmTimer) {
            clearTimeout(this.autoConfirmTimer);
            this.autoConfirmTimer = null;
        }
    }

    startAutoConfirm() {
        // Cancel any existing timer
        this.cancelAutoConfirm();
        
        // Show notification
        BingoUtils.showNotification(`Selected ${this.maxCards} cards! Starting game in 2 seconds...`, 'success');
        
        // Start auto-confirm timer
        this.autoConfirmTimer = setTimeout(() => {
            this.confirmSelection();
        }, 2000);
    }

    updateCardElements() {
        document.querySelectorAll('.card-number').forEach(card => {
            const cardNum = parseInt(card.dataset.cardNumber);
            
            // Remove selected class from all
            card.classList.remove('selected');
            
            // Add selected class to chosen cards
            if (this.gameState.selectedCards.includes(cardNum)) {
                card.classList.add('selected');
            }
        });
    }

    updateSelectedCardsDisplay() {
        // Update card numbers
        this.card1Number.textContent = this.gameState.selectedCards[0] || '--';
        this.card2Number.textContent = this.gameState.selectedCards[1] || '--';
        
        // Update previews
        this.updateCardPreview(1, this.gameState.selectedCards[0]);
        this.updateCardPreview(2, this.gameState.selectedCards[1]);
        
        // Update progress
        const progress = (this.gameState.selectedCards.length / this.maxCards) * 100;
        this.selectionProgress.style.width = `${progress}%`;
    }

    updateCardPreview(cardIndex, cardNumber) {
        const previewElement = cardIndex === 1 ? this.card1Preview : this.card2Preview;
        
        if (!cardNumber) {
            previewElement.innerHTML = '';
            for (let i = 0; i < 25; i++) {
                const cell = document.createElement('div');
                cell.className = 'preview-cell';
                cell.textContent = '';
                previewElement.appendChild(cell);
            }
            return;
        }
        
        // Generate random bingo card preview
        previewElement.innerHTML = '';
        const cardNumbers = this.generateBingoCardNumbers();
        
        for (let i = 0; i < 25; i++) {
            const cell = document.createElement('div');
            cell.className = 'preview-cell';
            
            if (i === 12) { // Center is FREE
                cell.textContent = 'FREE';
                cell.classList.add('free');
            } else {
                cell.textContent = cardNumbers[i] || '';
            }
            
            previewElement.appendChild(cell);
        }
    }

    generateBingoCardNumbers() {
        const numbers = new Set();
        const ranges = [
            {min: 1, max: 15},
            {min: 16, max: 30},
            {min: 31, max: 45},
            {min: 46, max: 60},
            {min: 61, max: 75}
        ];
        
        // Generate 5 numbers for each column
        const cardNumbers = [];
        for (let col = 0; col < 5; col++) {
            const colNumbers = new Set();
            while (colNumbers.size < 5) {
                const num = Math.floor(Math.random() * (ranges[col].max - ranges[col].min + 1)) + ranges[col].min;
                colNumbers.add(num);
            }
            cardNumbers.push(...Array.from(colNumbers));
        }
        
        return cardNumbers;
    }

    updateDisplays() {
        this.cardsSelected.textContent = this.gameState.selectedCards.length;
        this.totalCardsTaken.textContent = this.takenCards.size;
        this.activePlayers.textContent = this.gameState.activePlayers;
    }

    startSelectionTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        this.selectionTime = 60;
        this.updateTimerDisplay();
        
        this.timerInterval = setInterval(() => {
            this.selectionTime--;
            this.updateTimerDisplay();
            
            if (this.selectionTime <= 0) {
                clearInterval(this.timerInterval);
                if (this.gameState.selectedCards.length > 0) {
                    this.confirmSelection();
                } else {
                    this.autoSelectCards();
                }
            }
            
            // Add urgency effect when time is low
            if (this.selectionTime <= 10) {
                this.selectionTimer.classList.add('animate-shake');
            }
        }, 1000);
    }

    updateTimerDisplay() {
        const minutes = Math.floor(this.selectionTime / 60);
        const seconds = this.selectionTime % 60;
        this.selectionTimer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    randomSelectCards() {
        if (this.gameState.selectedCards.length >= this.maxCards) {
            this.clearSelection();
        }
        
        const availableCards = [];
        for (let i = 1; i <= this.totalCards; i++) {
            if (!this.takenCards.has(i) && !this.gameState.selectedCards.includes(i)) {
                availableCards.push(i);
            }
        }
        
        if (availableCards.length === 0) {
            BingoUtils.showNotification('No available cards left!', 'error');
            return;
        }
        
        // Shuffle available cards
        for (let i = availableCards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [availableCards[i], availableCards[j]] = [availableCards[j], availableCards[i]];
        }
        
        // Select required number of cards
        const cardsToSelect = Math.min(this.maxCards - this.gameState.selectedCards.length, availableCards.length);
        for (let i = 0; i < cardsToSelect; i++) {
            this.gameState.selectedCards.push(availableCards[i]);
        }
        
        this.updateCardElements();
        this.updateSelectedCardsDisplay();
        this.updateDisplays();
        
        // If we reached max cards, start auto-confirm
        if (this.gameState.selectedCards.length >= this.maxCards) {
            this.startAutoConfirm();
        }
    }

    clearSelection() {
        this.gameState.selectedCards = [];
        this.updateCardElements();
        this.updateSelectedCardsDisplay();
        this.updateDisplays();
        this.cancelAutoConfirm();
    }

    autoSelectCards() {
        if (this.gameState.selectedCards.length === 0) {
            this.randomSelectCards();
            setTimeout(() => this.confirmSelection(), 1000);
        }
    }

    confirmSelection() {
        // Cancel auto-confirm timer if it exists
        this.cancelAutoConfirm();
        
        if (this.gameState.selectedCards.length === 0) {
            // If no cards selected, select random cards
            this.randomSelectCards();
            setTimeout(() => this.confirmSelection(), 1000);
            return;
        }
        
        // Show loading overlay
        this.loadingOverlay.classList.add('active');
        this.loadingText.textContent = 'Preparing Game...';
        
        // Simulate API call to save selection
        setTimeout(() => {
            this.saveSelectionToBackend();
            this.proceedToGame();
        }, 1500);
    }

    saveSelectionToBackend() {
        // Add selected cards to taken cards
        this.gameState.selectedCards.forEach(card => {
            this.takenCards.add(card);
        });
        
        // Save game state
        this.gameState.saveToSession();
        
        // Send data to backend (simulated)
        const selectionData = {
            action: 'card_selection',
            playerId: this.gameState.playerId,
            playerName: this.gameState.playerName,
            selectedCards: this.gameState.selectedCards,
            timestamp: Date.now()
        };
        
        console.log('Sending selection data:', selectionData);
        
        if (this.telegramManager.isInitialized) {
            this.telegramManager.sendData(selectionData);
        }
    }

    proceedToGame() {
        this.loadingText.textContent = 'Starting Game...';
        
        setTimeout(() => {
            window.location.href = 'game.html';
        }, 1500);
    }

    setupEventListeners() {
        this.randomSelectBtn.addEventListener('click', () => this.randomSelectCards());
        this.clearSelectionBtn.addEventListener('click', () => this.clearSelection());
        
        // Handle page visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                console.log('Card selection paused');
            }
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ChooseCardsPage();
});