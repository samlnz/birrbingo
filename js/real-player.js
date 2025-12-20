// Real Player Management System
class PlayerManager {
    constructor() {
        this.players = new Map();
        this.gameState = null;
    }
    
    initialize(gameState) {
        this.gameState = gameState;
        this.loadPlayers();
    }
    
    loadPlayers() {
        // Load from localStorage (in production, this would be from backend)
        const savedPlayers = localStorage.getItem('bingoPlayers');
        if (savedPlayers) {
            const playersData = JSON.parse(savedPlayers);
            playersData.forEach(player => {
                this.players.set(player.id, player);
            });
        }
    }
    
    savePlayers() {
        const playersArray = Array.from(this.players.values());
        localStorage.setItem('bingoPlayers', JSON.stringify(playersArray));
    }
    
    registerPlayer(userId, userName) {
        const player = {
            id: userId,
            name: userName,
            joinedAt: Date.now(),
            stakePaid: true,
            selectedCards: [],
            currentGame: {
                cards: [],
                markedNumbers: [],
                hasBingo: false,
                disqualified: false
            },
            stats: {
                gamesPlayed: 0,
                wins: 0,
                totalWinnings: 0
            }
        };
        
        this.players.set(userId, player);
        this.savePlayers();
        
        // Update game state
        if (this.gameState) {
            this.gameState.totalPlayers = this.players.size;
        }
        
        return player;
    }
    
    getPlayer(userId) {
        return this.players.get(userId);
    }
    
    updatePlayerCards(userId, cards) {
        const player = this.getPlayer(userId);
        if (player) {
            player.selectedCards = cards;
            player.currentGame.cards = cards;
            this.savePlayers();
            
            // Update game state
            if (this.gameState) {
                this.gameState.cardsTaken = this.countAllCards();
            }
        }
    }
    
    countAllCards() {
        let total = 0;
        this.players.forEach(player => {
            total += player.selectedCards.length;
        });
        return total;
    }
    
    validatePlayerBingo(userId, cardId, claimedNumbers) {
        const player = this.getPlayer(userId);
        if (!player) return { valid: false, reason: 'Player not found' };
        
        // Check if player has this card
        if (!player.selectedCards.includes(cardId)) {
            return { valid: false, reason: 'Card not owned by player' };
        }
        
        // Check if player is disqualified
        if (player.currentGame.disqualified) {
            return { valid: false, reason: 'Player disqualified' };
        }
        
        // Get the card numbers
        const card = bingoCards.getCard(cardId);
        if (!card) return { valid: false, reason: 'Invalid card' };
        
        // Verify claimed numbers exist on card
        for (const num of claimedNumbers) {
            if (num === 'FREE') continue;
            if (!card.flatNumbers.includes(num)) {
                return { valid: false, reason: 'Number not on card' };
            }
        }
        
        // Check if numbers have been called
        const gameState = JSON.parse(localStorage.getItem('bingoGameState') || '{}');
        const calledNumbers = gameState.calledNumbers || [];
        const calledSet = new Set(calledNumbers);
        
        for (const num of claimedNumbers) {
            if (num === 'FREE') continue;
            if (!calledSet.has(num)) {
                // Player claimed BINGO before number was called - DISQUALIFY
                player.currentGame.disqualified = true;
                this.savePlayers();
                return { 
                    valid: false, 
                    reason: 'Number not called yet - DISQUALIFIED',
                    disqualified: true 
                };
            }
        }
        
        // Check if it's a valid winning line
        const winningLines = bingoCards.checkWinningLines(cardId, calledNumbers);
        if (winningLines.length === 0) {
            return { valid: false, reason: 'No winning line found' };
        }
        
        // Valid BINGO!
        player.currentGame.hasBingo = true;
        player.currentGame.winningTime = Date.now();
        player.stats.wins++;
        this.savePlayers();
        
        return { 
            valid: true, 
            winningLines: winningLines,
            playerName: player.name,
            cardId: cardId
        };
    }
    
    getTotalPrizePool() {
        const totalPlayers = this.players.size;
        const stake = 10; // 10 BIRR
        const totalStakes = totalPlayers * stake;
        const prizePool = Math.floor(totalStakes * 0.8); // 80% to winners
        return prizePool;
    }
    
    getWinner() {
        let winner = null;
        let earliestWin = Infinity;
        
        this.players.forEach(player => {
            if (player.currentGame.hasBingo && player.currentGame.winningTime < earliestWin) {
                earliestWin = player.currentGame.winningTime;
                winner = player;
            }
        });
        
        return winner;
    }
    
    resetGame() {
        // Reset all players for new game
        this.players.forEach(player => {
            player.selectedCards = [];
            player.currentGame = {
                cards: [],
                markedNumbers: [],
                hasBingo: false,
                disqualified: false
            };
        });
        
        this.savePlayers();
    }
    
    getLeaderboard() {
        return Array.from(this.players.values())
            .sort((a, b) => b.stats.wins - a.stats.wins)
            .slice(0, 10);
    }
}

// Global instance
const playerManager = new PlayerManager();