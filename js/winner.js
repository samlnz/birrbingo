// Winner page functionality

class WinnerPage {
    constructor() {
        this.telegramManager = telegramManager;
        
        // Winner data
        this.winnerData = {
            playerName: 'Telegram User',
            playerId: '0000',
            cardNumbers: [],
            winningLines: { card1: 0, card2: 0 },
            totalLines: 0,
            gameTime: 0,
            calledNumbers: 0
        };
        
        // DOM elements
        this.winnerAvatar = document.getElementById('winnerAvatar');
        this.winnerName = document.getElementById('winnerName');
        this.winnerTelegram = document.getElementById('winnerTelegram');
        this.totalLines = document.getElementById('totalLines');
        this.gameDuration = document.getElementById('gameDuration');
        this.numbersCalled = document.getElementById('numbersCalled');
        this.playerRank = document.getElementById('playerRank');
        this.prizeAmount = document.getElementById('prizeAmount');
        this.yourWinnings = document.getElementById('yourWinnings');
        this.totalPlayers = document.getElementById('totalPlayers');
        this.cardsInPlay = document.getElementById('cardsInPlay');
        this.winningMoment = document.getElementById('winningMoment');
        this.callSpeed = document.getElementById('callSpeed');
        this.winningCards = document.getElementById('winningCards');
        this.playAgainBtn = document.getElementById('playAgainBtn');
        this.leaderboardBtn = document.getElementById('leaderboardBtn');
        this.shareBtn = document.getElementById('shareBtn');
        this.confettiContainer = document.getElementById('confettiContainer');
        this.winnerAudio = document.getElementById('winnerAudio');
        
        this.init();
    }

        init() {
        this.loadWinnerData();
        this.displayWinnerInfo();
        this.displayWinningCards();
        this.setupGameSummary();
        this.createConfetti();
        this.setupAudio();
        this.setupEventListeners();
        
        // Auto redirect after 5 seconds
        setTimeout(() => {
            this.handlePlayAgain();
        }, 5000);
    }

    loadWinnerData() {
        const savedWinner = sessionStorage.getItem('bingoWinner');
        if (savedWinner) {
            this.winnerData = JSON.parse(savedWinner);
        }
        
        // Also load game state for additional info
        const gameState = JSON.parse(sessionStorage.getItem('bingoGameState') || '{}');
        this.winnerData.playerName = this.winnerData.playerName || gameState.playerName || 'Telegram User';
        this.winnerData.playerId = this.winnerData.playerId || gameState.playerId || '0000';
    }

    displayWinnerInfo() {
        this.winnerName.textContent = this.winnerData.playerName;
        this.winnerAvatar.textContent = this.winnerData.playerName.charAt(0).toUpperCase();
        this.winnerTelegram.textContent = `@${this.winnerData.playerName.replace(/\s+/g, '').toLowerCase()}`;
        
        // Set statistics
        this.totalLines.textContent = this.winnerData.totalLines;
        
        const minutes = Math.floor(this.winnerData.gameTime / 60);
        const seconds = this.winnerData.gameTime % 60;
        this.gameDuration.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        this.winningMoment.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        this.numbersCalled.textContent = this.winnerData.calledNumbers;
        
                // Calculate winnings (10 BIRR per player, 20% profit for admin)
        const stake = 10; // 10 BIRR per player
        const totalPlayers = this.winnerData.totalPlayers || 1;
        const totalPrizePool = stake * totalPlayers;
        const adminFee = totalPrizePool * 0.20; // 20% profit
        const winnerPrize = totalPrizePool - adminFee;
        
        this.prizeAmount.textContent = `${totalPrizePool} BIRR`;
        this.yourWinnings.textContent = `${winnerPrize} BIRR`;
        
        // Random rank between 1-10
        this.playerRank.textContent = `#${Math.floor(Math.random() * 10) + 1}`;
    }

    displayWinningCards() {
        this.winningCards.innerHTML = '';
        
        this.winnerData.cardNumbers.forEach((cardNumber, index) => {
            const cardId = `card${index + 1}`;
            const lines = this.winnerData.winningLines[cardId] || 0;
            
            if (lines > 0) {
                const cardElement = document.createElement('div');
                cardElement.className = 'winning-card';
                
                const lineTypes = ['Horizontal', 'Vertical', 'Diagonal'];
                const lineBadges = [];
                
                for (let i = 0; i < lines; i++) {
                    const lineType = lineTypes[Math.min(i, 2)];
                    lineBadges.push(`
                        <div class="line-badge">
                            <i class="fas fa-star"></i>
                            ${lineType} Line
                        </div>
                    `);
                }
                
                cardElement.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h3><i class="fas fa-dice-${index === 0 ? 'one' : 'two'}"></i> WINNING CARD</h3>
                        <div class="card-number-badge">#${cardNumber}</div>
                    </div>
                    <div style="color: #90e0ef; margin-bottom: 15px;">
                        Completed <strong style="color: #4CAF50;">${lines} line${lines > 1 ? 's' : ''}</strong>
                    </div>
                    <div class="winning-lines">
                        ${lineBadges.join('')}
                    </div>
                `;
                
                this.winningCards.appendChild(cardElement);
            }
        });
    }

    setupGameSummary() {
        // Set game summary
        this.totalPlayers.textContent = Math.floor(Math.random() * 300) + 200;
        this.cardsInPlay.textContent = Math.floor(this.totalPlayers.textContent * 1.5);
        this.callSpeed.textContent = '5s';
        
        // Set random prize pool
        const prizePool = Math.floor(Math.random() * 10000) + 5000;
        this.prizeAmount.textContent = `$${prizePool}`;
    }

    createConfetti() {
        const colors = ['#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800'];
        const confettiCount = 150;
        
        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti-piece';
            confetti.style.setProperty('--color', colors[Math.floor(Math.random() * colors.length)]);
            confetti.style.left = `${Math.random() * 100}%`;
            confetti.style.width = `${Math.random() * 10 + 5}px`;
            confetti.style.height = `${Math.random() * 15 + 10}px`;
            confetti.style.opacity = Math.random() * 0.5 + 0.5;
            
            const animationDuration = Math.random() * 3 + 2;
            const animationDelay = Math.random() * 5;
            
            confetti.style.animation = `
                confettiFall ${animationDuration}s ease-in ${animationDelay}s infinite
            `;
            
            this.confettiContainer.appendChild(confetti);
        }
    }

    setupAudio() {
        // Set volume
        if (this.winnerAudio) {
            this.winnerAudio.volume = 0.7;
            this.winnerAudio.play().catch(e => console.log('Audio play failed:', e));
        }
    }

    setupEventListeners() {
        this.playAgainBtn.addEventListener('click', () => {
            this.handlePlayAgain();
        });
        
        this.leaderboardBtn.addEventListener('click', () => {
            this.handleLeaderboard();
        });
        
        this.shareBtn.addEventListener('click', () => {
            this.handleShare();
        });
    }

    handlePlayAgain() {
        this.playAgainBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> LOADING...';
        this.playAgainBtn.disabled = true;
        
        // Clear session storage
        sessionStorage.clear();
        
       // Navigate back to card selection
setTimeout(() => {
    BingoUtils.navigateTo('choose-cards.html');
}, 1500);
    }

    handleLeaderboard() {
        // In a real app, this would fetch and display leaderboard data
        const leaderboardData = this.getLeaderboardData();
        this.showLeaderboard(leaderboardData);
    }

    getLeaderboardData() {
        // Simulate leaderboard data
        return [
            { rank: 1, name: this.winnerData.playerName, score: this.winnerData.totalLines * 1000, time: this.winnerData.gameTime },
            { rank: 2, name: 'Player2', score: 4500, time: 85 },
            { rank: 3, name: 'Player3', score: 4000, time: 92 },
            { rank: 4, name: 'Player4', score: 3500, time: 78 },
            { rank: 5, name: 'Player5', score: 3000, time: 105 }
        ];
    }

    showLeaderboard(data) {
        const leaderboardHTML = `
            <div class="leaderboard-modal">
                <h3><i class="fas fa-crown"></i> TOP PLAYERS</h3>
                <div class="leaderboard-list">
                    ${data.map(player => `
                        <div class="leaderboard-item ${player.name === this.winnerData.playerName ? 'current-player' : ''}">
                            <div class="player-rank">#${player.rank}</div>
                            <div class="player-name">${player.name}</div>
                            <div class="player-score">${player.score} pts</div>
                            <div class="player-time">${BingoUtils.formatTime(player.time)}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = leaderboardHTML;
        
        document.body.appendChild(modal);
        
        // Add close functionality
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    handleShare() {
        // Prepare share message
        const shareMessage = `🎉 I just won BINGO in Telegram Casino!\n\n` +
                           `🏆 Victory: ${this.winnerData.totalLines} winning lines\n` +
                           `⏱️ Time: ${this.gameDuration.textContent}\n` +
                           `🎯 Cards: ${this.winnerData.cardNumbers.join(', ')}\n` +
                           `💰 Winnings: ${this.yourWinnings.textContent}\n\n` +
                           `Play now and try your luck!`;
        
        // Try to share via Telegram first
        if (this.telegramManager.shareMessage(shareMessage)) {
            return;
        }
        
        // Fallback to clipboard
        if (navigator.clipboard) {
            navigator.clipboard.writeText(shareMessage).then(() => {
                BingoUtils.showNotification('Victory message copied to clipboard! Share it with your friends.', 'success');
            }).catch(() => {
                this.showShareDialog(shareMessage);
            });
        } else {
            this.showShareDialog(shareMessage);
        }
    }

    showShareDialog(message) {
        const shareDialog = document.createElement('div');
        shareDialog.className = 'share-dialog';
        shareDialog.innerHTML = `
            <div class="share-content">
                <h3><i class="fas fa-share-alt"></i> Share Your Victory</h3>
                <textarea readonly>${message}</textarea>
                <button class="btn btn-primary" id="copyMessageBtn">
                    <i class="fas fa-copy"></i> Copy Message
                </button>
            </div>
        `;
        
        document.body.appendChild(shareDialog);
        
        // Add copy functionality
        document.getElementById('copyMessageBtn').addEventListener('click', () => {
            const textarea = shareDialog.querySelector('textarea');
            textarea.select();
            document.execCommand('copy');
            BingoUtils.showNotification('Message copied!', 'success');
            document.body.removeChild(shareDialog);
        });
        
        // Close on click outside
        shareDialog.addEventListener('click', (e) => {
            if (e.target === shareDialog) {
                document.body.removeChild(shareDialog);
            }
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new WinnerPage();
});