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
            calledNumbers: 0,
            winningPatternData: null,
            cardData: null
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
    }

    loadWinnerData() {
        const savedWinner = sessionStorage.getItem('bingoWinner');
        if (savedWinner) {
            this.winnerData = JSON.parse(savedWinner);
        }
        
        const gameState = JSON.parse(sessionStorage.getItem('bingoGameState') || '{}');
        this.winnerData.playerName = this.winnerData.playerName || gameState.playerName || 'Telegram User';
        this.winnerData.playerId = this.winnerData.playerId || gameState.playerId || '0000';
    }

    displayWinnerInfo() {
        this.winnerName.textContent = this.winnerData.playerName;
        this.winnerAvatar.textContent = this.winnerData.playerName.charAt(0).toUpperCase();
        this.winnerTelegram.textContent = `@${this.winnerData.playerName.replace(/\s+/g, '').toLowerCase()}`;
        
        this.totalLines.textContent = this.winnerData.totalLines;
        
        const minutes = Math.floor(this.winnerData.gameTime / 60);
        const seconds = this.winnerData.gameTime % 60;
        this.gameDuration.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        this.winningMoment.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        this.numbersCalled.textContent = this.winnerData.calledNumbers;
        
        const stake = 10;
        const totalPlayers = this.winnerData.totalPlayers || 1;
        const totalPrizePool = stake * totalPlayers;
        const adminFee = totalPrizePool * 0.20;
        const winnerPrize = totalPrizePool - adminFee;
        
        this.prizeAmount.textContent = `${totalPrizePool} BIRR`;
        this.yourWinnings.textContent = `${winnerPrize} BIRR`;
        
        this.playerRank.textContent = `#${Math.floor(Math.random() * 10) + 1}`;
    }

    displayWinningCards() {
        this.winningCards.innerHTML = '';
        
        // Clear any existing content
        this.winningCards.innerHTML = '';
        
        if (!this.winnerData.cardData) {
            console.warn('No card data found in winner data');
            return;
        }
        
        // Display only cards that have winning lines
        const hasCard1Win = this.winnerData.winningLines.card1 > 0;
        const hasCard2Win = this.winnerData.winningLines.card2 > 0;
        
        if (hasCard1Win && this.winnerData.cardData.card1) {
            this.createWinningCardDisplay(1, this.winnerData.cardData.card1);
        }
        
        if (hasCard2Win && this.winnerData.cardData.card2) {
            this.createWinningCardDisplay(2, this.winnerData.cardData.card2);
        }
        
        if (!hasCard1Win && !hasCard2Win) {
            this.winningCards.innerHTML = `
                <div class="no-winning-card">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>No winning card data available</h3>
                    <p>Congratulations on your win!</p>
                </div>
            `;
        }
    }

    createWinningCardDisplay(cardIndex, cardData) {
        const cardNumber = this.winnerData.cardNumbers[cardIndex - 1];
        const winningLines = cardData.winningLines || [];
        const winningCells = cardData.winningCells || [];
        
        const cardElement = document.createElement('div');
        cardElement.className = 'winning-card-display';
        cardElement.innerHTML = `
            <div class="winning-card-header">
                <h3><i class="fas fa-dice-${cardIndex === 1 ? 'one' : 'two'}"></i> WINNING CARD #${cardNumber}</h3>
                <div class="card-number-badge">Card #${cardNumber}</div>
            </div>
            <div class="winning-card-grid" id="winningCard${cardIndex}Grid">
                <!-- Bingo grid will be generated here -->
            </div>
            <div class="winning-card-stats">
                <div class="winning-stat">
                    <div class="winning-stat-value">${winningLines.length}</div>
                    <div class="winning-stat-label">Winning Lines</div>
                </div>
                <div class="winning-stat">
                    <div class="winning-stat-value">${cardData.markedNumbers ? cardData.markedNumbers.length + 1 : 'N/A'}</div>
                    <div class="winning-stat-label">Marked Numbers</div>
                </div>
                <div class="winning-stat">
                    <div class="winning-stat-value">${this.winnerData.totalLines}</div>
                    <div class="winning-stat-label">Total Lines Won</div>
                </div>
            </div>
            ${winningLines.length > 0 ? `
                <div class="winning-pattern-info">
                    <h4><i class="fas fa-star"></i> Winning Pattern:</h4>
                    <p>${winningLines.join(', ')}</p>
                </div>
            ` : ''}
        `;
        
        this.winningCards.appendChild(cardElement);
        
        // Generate the bingo grid
        this.generateWinningCardGrid(cardIndex, cardData);
    }

    generateWinningCardGrid(cardIndex, cardData) {
        const gridContainer = document.getElementById(`winningCard${cardIndex}Grid`);
        if (!gridContainer) return;
        
        gridContainer.innerHTML = '';
        
        // Create column headers
        ['B', 'I', 'N', 'G', 'O'].forEach(letter => {
            const headerCell = document.createElement('div');
            headerCell.className = 'grid-header';
            headerCell.textContent = letter;
            gridContainer.appendChild(headerCell);
        });
        
        // Create the 5x5 grid (25 cells total)
        for (let i = 0; i < 25; i++) {
            const row = Math.floor(i / 5);
            const col = i % 5;
            
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            
            // Determine if this is the free space
            const isFreeSpace = row === 2 && col === 2;
            
            if (isFreeSpace) {
                cell.textContent = 'FREE';
                cell.className += ' free marked';
            } else {
                // Get the number from cardData.numbers
                // Note: cardData.numbers is in column-major order
                const numberIndex = col * 5 + row;
                const number = cardData.numbers ? cardData.numbers[numberIndex] : '??';
                cell.textContent = number;
                
                // Check if this number is marked
                if (cardData.markedNumbers && cardData.markedNumbers.includes(number)) {
                    cell.className += ' marked';
                }
                
                // Check if this cell is part of winning pattern
                if (cardData.winningCells && cardData.winningCells.includes(i)) {
                    cell.className += ' winning';
                }
            }
            
            // Add column-specific styling
            cell.setAttribute('data-col', col);
            
            gridContainer.appendChild(cell);
        }
    }

    setupGameSummary() {
        this.totalPlayers.textContent = Math.floor(Math.random() * 300) + 200;
        this.cardsInPlay.textContent = Math.floor(this.totalPlayers.textContent * 1.5);
        this.callSpeed.textContent = '5s';
        
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
        
        sessionStorage.clear();
        
        setTimeout(() => {
            BingoUtils.navigateTo('index.html');
        }, 1500);
    }

    handleLeaderboard() {
        const leaderboardData = this.getLeaderboardData();
        this.showLeaderboard(leaderboardData);
    }

    getLeaderboardData() {
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
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = leaderboardHTML;
        
        document.body.appendChild(modal);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    handleShare() {
        const shareMessage = `🎉 I just won BINGO in Telegram Casino!\n\n` +
                           `🏆 Victory: ${this.winnerData.totalLines} winning lines\n` +
                           `⏱️ Time: ${this.gameDuration.textContent}\n` +
                           `🎯 Cards: ${this.winnerData.cardNumbers.join(', ')}\n` +
                           `💰 Winnings: ${this.yourWinnings.textContent}\n\n` +
                           `Play now and try your luck!`;
        
        if (this.telegramManager.shareMessage(shareMessage)) {
            return;
        }
        
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
        
        document.getElementById('copyMessageBtn').addEventListener('click', () => {
            const textarea = shareDialog.querySelector('textarea');
            textarea.select();
            document.execCommand('copy');
            BingoUtils.showNotification('Message copied!', 'success');
            document.body.removeChild(shareDialog);
        });
        
        shareDialog.addEventListener('click', (e) => {
            if (e.target === shareDialog) {
                document.body.removeChild(shareDialog);
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new WinnerPage();
});