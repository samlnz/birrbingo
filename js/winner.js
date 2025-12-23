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
        this.winnerContainer = document.querySelector('.winner-container');
        this.winningCards = document.getElementById('winningCards');
        this.playAgainBtn = document.getElementById('playAgainBtn');
        this.confettiContainer = document.getElementById('confettiContainer');
        this.winnerAudio = document.getElementById('winnerAudio');
        
        this.init();
    }

    init() {
        this.loadWinnerData();
        this.createConfetti();
        this.setupAudio();
        this.setupEventListeners();
        
        // Show winning card after a short delay for effect
        setTimeout(() => {
            this.displayWinningCard();
        }, 500);
    }

    loadWinnerData() {
        const savedWinner = sessionStorage.getItem('bingoWinner');
        if (savedWinner) {
            this.winnerData = JSON.parse(savedWinner);
            console.log('Winner data loaded:', this.winnerData);
        } else {
            console.warn('No winner data found in sessionStorage');
            // Show default card for testing
            this.showDefaultCard();
        }
    }

    displayWinningCard() {
        // Clear the entire winner container
        this.winnerContainer.innerHTML = '';
        
        // Create minimal container
        const cardContainer = document.createElement('div');
        cardContainer.className = 'minimal-card-container';
        
        // Add back button at the top
        const backButton = document.createElement('button');
        backButton.className = 'back-to-game-btn';
        backButton.innerHTML = '<i class="fas fa-arrow-left"></i> BACK TO GAME';
        backButton.addEventListener('click', () => {
            this.handlePlayAgain();
        });
        
        cardContainer.appendChild(backButton);
        
        // Display only cards that have winning lines
        const hasCard1Win = this.winnerData.winningLines.card1 > 0;
        const hasCard2Win = this.winnerData.winningLines.card2 > 0;
        
        if ((hasCard1Win || hasCard2Win) && this.winnerData.cardData) {
            if (hasCard1Win && this.winnerData.cardData.card1) {
                this.createScaledWinningCard(1, this.winnerData.cardData.card1, cardContainer);
            }
            
            if (hasCard2Win && this.winnerData.cardData.card2) {
                this.createScaledWinningCard(2, this.winnerData.cardData.card2, cardContainer);
            }
        } else {
            this.showDefaultCard();
        }
        
        // Add play again button at bottom
        const playAgainBtn = document.createElement('button');
        playAgainBtn.className = 'play-again-minimal-btn';
        playAgainBtn.innerHTML = '<i class="fas fa-redo"></i> PLAY AGAIN';
        playAgainBtn.addEventListener('click', () => {
            this.handlePlayAgain();
        });
        
        cardContainer.appendChild(playAgainBtn);
        this.winnerContainer.appendChild(cardContainer);
    }

    createScaledWinningCard(cardIndex, cardData, container) {
        const cardNumber = this.winnerData.cardNumbers[cardIndex - 1];
        const winningLines = cardData.winningLines || [];
        const winningCells = cardData.winningCells || [];
        
        const cardElement = document.createElement('div');
        cardElement.className = 'scaled-winning-card';
        
        // Card header
        const headerDiv = document.createElement('div');
        headerDiv.className = 'scaled-card-header';
        headerDiv.innerHTML = `
            <h2><i class="fas fa-trophy"></i> WINNING CARD #${cardNumber}</h2>
            <div class="player-info-mini">
                <div class="mini-avatar">${this.winnerData.playerName.charAt(0).toUpperCase()}</div>
                <div class="mini-player-name">${this.winnerData.playerName}</div>
            </div>
        `;
        cardElement.appendChild(headerDiv);
        
        // Create the scaled bingo grid
        const gridContainer = document.createElement('div');
        gridContainer.className = 'scaled-bingo-grid';
        
        // Create column headers
        ['B', 'I', 'N', 'G', 'O'].forEach(letter => {
            const headerCell = document.createElement('div');
            headerCell.className = 'scaled-grid-header';
            headerCell.textContent = letter;
            gridContainer.appendChild(headerCell);
        });
        
        // Create the 5x5 grid (25 cells total)
        for (let i = 0; i < 25; i++) {
            const row = Math.floor(i / 5);
            const col = i % 5;
            
            const cell = document.createElement('div');
            cell.className = 'scaled-grid-cell';
            
            // Determine if this is the free space
            const isFreeSpace = row === 2 && col === 2;
            
            if (isFreeSpace) {
                cell.textContent = 'FREE';
                cell.className += ' scaled-free scaled-marked';
            } else {
                // Get the number from cardData.numbers
                // Note: cardData.numbers is in column-major order
                const numberIndex = col * 5 + row;
                const number = cardData.numbers ? cardData.numbers[numberIndex] : '??';
                cell.textContent = number;
                cell.setAttribute('data-number', number);
                
                // Check if this number is marked
                if (cardData.markedNumbers && cardData.markedNumbers.includes(number)) {
                    cell.className += ' scaled-marked';
                }
                
                // Check if this cell is part of winning pattern
                if (cardData.winningCells && cardData.winningCells.includes(i)) {
                    cell.className += ' scaled-winning';
                }
            }
            
            // Add column-specific styling
            cell.setAttribute('data-col', col);
            cell.setAttribute('data-index', i);
            
            gridContainer.appendChild(cell);
        }
        
        cardElement.appendChild(gridContainer);
        
        // Winning pattern info
        if (winningLines.length > 0) {
            const patternInfo = document.createElement('div');
            patternInfo.className = 'scaled-pattern-info';
            patternInfo.innerHTML = `
                <h3><i class="fas fa-star"></i> WINNING PATTERN</h3>
                <p>${winningLines.join(', ')}</p>
            `;
            cardElement.appendChild(patternInfo);
        }
        
        // Card stats
        const statsDiv = document.createElement('div');
        statsDiv.className = 'scaled-card-stats';
        statsDiv.innerHTML = `
            <div class="scaled-stat">
                <div class="scaled-stat-value">${winningLines.length}</div>
                <div class="scaled-stat-label">Winning Lines</div>
            </div>
            <div class="scaled-stat">
                <div class="scaled-stat-value">${cardData.markedNumbers ? cardData.markedNumbers.length + 1 : 'N/A'}</div>
                <div class="scaled-stat-label">Marked Numbers</div>
            </div>
            <div class="scaled-stat">
                <div class="scaled-stat-value">${this.winnerData.gameTime}s</div>
                <div class="scaled-stat-label">Game Time</div>
            </div>
        `;
        cardElement.appendChild(statsDiv);
        
        container.appendChild(cardElement);
    }

    showDefaultCard() {
        // Show a default card for testing
        this.winnerContainer.innerHTML = `
            <div class="minimal-card-container">
                <button class="back-to-game-btn" id="backBtn">
                    <i class="fas fa-arrow-left"></i> BACK TO GAME
                </button>
                
                <div class="scaled-winning-card">
                    <div class="scaled-card-header">
                        <h2><i class="fas fa-trophy"></i> BINGO WINNER!</h2>
                        <div class="player-info-mini">
                            <div class="mini-avatar">T</div>
                            <div class="mini-player-name">Telegram User</div>
                        </div>
                    </div>
                    
                    <div class="scaled-bingo-grid">
                        <!-- This is a sample winning card -->
                    </div>
                    
                    <div class="scaled-pattern-info">
                        <h3><i class="fas fa-star"></i> WINNING PATTERN</h3>
                        <p>Row 1, Column B</p>
                    </div>
                    
                    <div class="scaled-card-stats">
                        <div class="scaled-stat">
                            <div class="scaled-stat-value">2</div>
                            <div class="scaled-stat-label">Winning Lines</div>
                        </div>
                        <div class="scaled-stat">
                            <div class="scaled-stat-value">15</div>
                            <div class="scaled-stat-label">Marked Numbers</div>
                        </div>
                        <div class="scaled-stat">
                            <div class="scaled-stat-value">45s</div>
                            <div class="scaled-stat-label">Game Time</div>
                        </div>
                    </div>
                </div>
                
                <button class="play-again-minimal-btn" id="playAgainBtn">
                    <i class="fas fa-redo"></i> PLAY AGAIN
                </button>
            </div>
        `;
        
        // Add event listeners to buttons
        document.getElementById('backBtn').addEventListener('click', () => this.handlePlayAgain());
        document.getElementById('playAgainBtn').addEventListener('click', () => this.handlePlayAgain());
        
        // Generate a sample grid
        this.generateSampleGrid();
    }

    generateSampleGrid() {
        const gridContainer = document.querySelector('.scaled-bingo-grid');
        if (!gridContainer) return;
        
        // Create column headers
        ['B', 'I', 'N', 'G', 'O'].forEach(letter => {
            const headerCell = document.createElement('div');
            headerCell.className = 'scaled-grid-header';
            headerCell.textContent = letter;
            gridContainer.appendChild(headerCell);
        });
        
        // Create sample numbers
        const sampleNumbers = [
            1, 16, 31, 46, 61,
            2, 17, 32, 47, 62,
            3, 18, 'FREE', 48, 63,
            4, 19, 34, 49, 64,
            5, 20, 35, 50, 65
        ];
        
        for (let i = 0; i < 25; i++) {
            const cell = document.createElement('div');
            cell.className = 'scaled-grid-cell';
            
            if (i === 12) {
                cell.textContent = 'FREE';
                cell.className += ' scaled-free scaled-marked';
            } else {
                cell.textContent = sampleNumbers[i];
                
                // Mark some sample cells
                if ([0, 1, 2, 3, 4, 6, 7, 8, 9, 10, 14, 19].includes(i)) {
                    cell.className += ' scaled-marked';
                }
                
                // Highlight winning pattern (first row)
                if ([0, 1, 2, 3, 4].includes(i)) {
                    cell.className += ' scaled-winning';
                }
            }
            
            cell.setAttribute('data-col', i % 5);
            gridContainer.appendChild(cell);
        }
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
        // Event listeners are added dynamically in displayWinningCard
    }

    handlePlayAgain() {
        // Clear session storage
        sessionStorage.clear();
        
        // Navigate back to index (main menu) - NOT card selection
        window.location.href = 'index.html';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new WinnerPage();
});