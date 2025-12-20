// Real Game Logic with Validation
class BingoGame {
    constructor() {
        this.calledNumbers = new Set();
        this.callInterval = 5000; // 5 seconds
        this.timer = null;
        this.gameActive = false;
        this.winner = null;
        this.winnerDeclared = false;
    }
    
    startGame() {
        if (this.gameActive) return;
        
        this.gameActive = true;
        this.winner = null;
        this.winnerDeclared = false;
        this.calledNumbers.clear();
        
        // Load existing called numbers from saved state
        const gameState = JSON.parse(localStorage.getItem('bingoGameState') || '{}');
        if (gameState.calledNumbers) {
            gameState.calledNumbers.forEach(num => this.calledNumbers.add(num));
        }
        
        // Start calling numbers
        this.startCalling();
        
        // Start game timer
        this.startGameTimer();
        
        console.log('Bingo game started');
    }
    
    startCalling() {
        // Call first number immediately
        setTimeout(() => this.callNextNumber(), 1000);
        
        // Set up interval for subsequent calls
        this.timer = setInterval(() => {
            this.callNextNumber();
        }, this.callInterval);
    }
    
    callNextNumber() {
        if (this.calledNumbers.size >= 75 || this.winnerDeclared) {
            this.stopGame();
            return;
        }
        
        const number = this.generateUniqueNumber();
        this.calledNumbers.add(number);
        
        // Save to game state
        this.saveGameState();
        
        // Auto-mark numbers on all player cards
        this.autoMarkNumbers(number);
        
        // Check for automatic BINGO detection
        this.checkAllPlayersForBingo();
        
        // Dispatch event for UI update
        this.dispatchNumberCalled(number);
        
        return number;
    }
    
    generateUniqueNumber() {
        let number;
        do {
            number = Math.floor(Math.random() * 75) + 1;
        } while (this.calledNumbers.has(number));
        return number;
    }
    
    autoMarkNumbers(number) {
        // Mark this number on all player cards
        playerManager.players.forEach(player => {
            if (player.currentGame.disqualified) return;
            
            player.currentGame.markedNumbers.push(number);
            
            // Check each card for this number
            player.selectedCards.forEach(cardId => {
                const card = bingoCards.getCard(cardId);
                if (card && card.flatNumbers.includes(number)) {
                    // Number is on this card - mark it
                    this.markNumberOnCard(player.id, cardId, number);
                }
            });
        });
    }
    
    markNumberOnCard(playerId, cardId, number) {
        // In production, this would update the UI
        // For now, just log
        console.log(`Player ${playerId} marked ${number} on card ${cardId}`);
        
        // Dispatch event for UI
        const event = new CustomEvent('numberMarked', {
            detail: { playerId, cardId, number }
        });
        window.dispatchEvent(event);
    }
    
    checkAllPlayersForBingo() {
        playerManager.players.forEach(player => {
            if (player.currentGame.disqualified || player.currentGame.hasBingo) return;
            
            player.selectedCards.forEach(cardId => {
                const winningLines = bingoCards.checkWinningLines(cardId, Array.from(this.calledNumbers));
                if (winningLines.length > 0) {
                    // Automatic BINGO detection
                    this.declareBingo(player.id, cardId, winningLines, true);
                }
            });
        });
    }
    
    declareBingo(playerId, cardId, winningLines, isAuto = false) {
        if (this.winnerDeclared) return;
        
        const player = playerManager.getPlayer(playerId);
        if (!player || player.currentGame.disqualified) return;
        
        // Validate the BINGO claim
        const validation = playerManager.validatePlayerBingo(playerId, cardId, []);
        
        if (validation.valid) {
            this.winner = player;
            this.winnerDeclared = true;
            this.stopGame();
            
            // Calculate prize
            const prizePool = playerManager.getTotalPrizePool();
            player.stats.totalWinnings += prizePool;
            playerManager.savePlayers();
            
            // Dispatch winner event
            this.dispatchWinner(player, cardId, winningLines, prizePool, isAuto);
            
            // Start winner display timer
            this.startWinnerTimer();
        } else if (validation.disqualified) {
            // Player is disqualified
            this.dispatchDisqualified(player, validation.reason);
        }
    }
    
    startWinnerTimer() {
        // Show winner for 5 seconds, then reset for next game
        setTimeout(() => {
            this.resetForNextGame();
        }, 5000);
    }
    
    resetForNextGame() {
        this.stopGame();
        playerManager.resetGame();
        
        // Reset game state
        localStorage.setItem('bingoGameState', JSON.stringify({
            totalPlayers: playerManager.players.size,
            cardsTaken: 0,
            totalPrizePool: playerManager.getTotalPrizePool(),
            gameTimer: 60,
            stake: 10,
            calledNumbers: [],
            lastUpdated: Date.now()
        }));
        
        // Redirect to card selection
        if (window.location.pathname.includes('game.html')) {
            window.location.href = 'choose-cards.html';
        }
    }
    
    stopGame() {
        this.gameActive = false;
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
    
    startGameTimer() {
        // Game duration timer (optional)
        // Could be used for auto-ending if no winner
    }
    
    saveGameState() {
        const gameState = JSON.parse(localStorage.getItem('bingoGameState') || '{}');
        gameState.calledNumbers = Array.from(this.calledNumbers);
        gameState.lastUpdated = Date.now();
        localStorage.setItem('bingoGameState', JSON.stringify(gameState));
    }
    
    dispatchNumberCalled(number) {
        const event = new CustomEvent('bingoNumberCalled', {
            detail: { number, letter: this.getLetterForNumber(number) }
        });
        window.dispatchEvent(event);
    }
    
    dispatchWinner(player, cardId, winningLines, prize, isAuto) {
        const event = new CustomEvent('bingoWinner', {
            detail: {
                playerId: player.id,
                playerName: player.name,
                cardId: cardId,
                winningLines: winningLines,
                prizeAmount: prize,
                isAutoDetected: isAuto,
                calledNumbers: Array.from(this.calledNumbers),
                timestamp: Date.now()
            }
        });
        window.dispatchEvent(event);
    }
    
    dispatchDisqualified(player, reason) {
        const event = new CustomEvent('playerDisqualified', {
            detail: { playerId: player.id, playerName: player.name, reason: reason }
        });
        window.dispatchEvent(event);
    }
    
    getLetterForNumber(number) {
        if (number >= 1 && number <= 15) return 'B';
        if (number >= 16 && number <= 30) return 'I';
        if (number >= 31 && number <= 45) return 'N';
        if (number >= 46 && number <= 60) return 'G';
        if (number >= 61 && number <= 75) return 'O';
        return '';
    }
    
    getCalledNumbersByLetter() {
        const result = {
            'B': [], 'I': [], 'N': [], 'G': [], 'O': []
        };
        
        this.calledNumbers.forEach(num => {
            const letter = this.getLetterForNumber(num);
            if (letter) {
                result[letter].push(num);
                result[letter].sort((a, b) => a - b);
            }
        });
        
        return result;
    }
    
    isNumberCalled(number) {
        return this.calledNumbers.has(number);
    }
    
    getGameStatus() {
        return {
            active: this.gameActive,
            calledNumbers: Array.from(this.calledNumbers),
            totalCalled: this.calledNumbers.size,
            winnerDeclared: this.winnerDeclared,
            winner: this.winner
        };
    }
}

// Global instance
const bingoGame = new BingoGame();