// Winner page functionality

class WinnerPage {
    constructor() {
        // Winner data
        this.winnerData = null;
        
        // DOM elements
        this.winnerContainer = document.querySelector('.winner-container');
        this.confettiContainer = document.getElementById('confettiContainer');
        this.winnerAudio = document.getElementById('winnerAudio');
        
        this.init();
    }

    init() {
        console.log('Winner page initializing...');
        this.loadWinnerData();
        this.createConfetti();
        this.setupAudio();
        
        // Show winning card immediately
        setTimeout(() => {
            this.displayWinningCard();
        }, 100);
    }

    loadWinnerData() {
        console.log('Loading winner data from sessionStorage...');
        const savedWinner = sessionStorage.getItem('bingoWinner');
        
        if (savedWinner) {
            try {
                this.winnerData = JSON.parse(savedWinner);
                console.log('Winner data loaded successfully:', this.winnerData);
                
                // Validate data
                if (!this.winnerData.cardNumbers || !this.winnerData.cardData) {
                    console.warn('Winner data is incomplete, showing default card');
                    this.showDefaultCard();
                }
            } catch (error) {
                console.error('Error parsing winner data:', error);
                this.showDefaultCard();
            }
        } else {
            console.warn('No winner data found in sessionStorage');
            this.showDefaultCard();
        }
    }

    displayWinningCard() {
        console.log('Displaying winning card...');
        
        // Clear the entire winner container
        this.winnerContainer.innerHTML = '';
        
        // Create minimal container
        const cardContainer = document.createElement('div');
        cardContainer.className = 'minimal-card-container';
        
        // Title
        const title = document.createElement('h1');
        title.className = 'winner-title';
        title.innerHTML = '<i class="fas fa-trophy"></i> BINGO WINNER!';
        cardContainer.appendChild(title);
        
        // Display winning card if we have data
        if (this.winnerData && this.winnerData.cardData) {
            const hasCard1Win = this.winnerData.winningLines.card1 > 0;
            const hasCard2Win = this.winnerData.winningLines.card2 > 0;
            
            if (hasCard1Win && this.winnerData.cardData.card1) {
                this.createScaledWinningCard(1, this.winnerData.cardData.card1, cardContainer);
            }
            
            if (hasCard2Win && this.winnerData.cardData.card2) {
                this.createScaledWinningCard(2, this.winnerData.cardData.card2, cardContainer);
            }
            
            if (!hasCard1Win && !hasCard2Win) {
                this.createSampleCard(cardContainer);
            }
        } else {
            this.createSampleCard(cardContainer);
        }
        
        // Add auto-redirect message
        const redirectMessage = document.createElement('div');
        redirectMessage.className = 'redirect-message';
        redirectMessage.innerHTML = `
            <p><i class="fas fa-hourglass-half"></i> Redirecting to card selection in <span id="countdown">5</span> seconds...</p>
        `;
        cardContainer.appendChild(redirectMessage);
        
        // Add play again button
        const playAgainBtn = document.createElement('button');
        playAgainBtn.className = 'play-again-minimal-btn';
        playAgainBtn.innerHTML = '<i class="fas fa-redo"></i> PLAY AGAIN NOW';
        playAgainBtn.addEventListener('click', () => {
            this.handlePlayAgain();
        });
        cardContainer.appendChild(playAgainBtn);
        
        this.winnerContainer.appendChild(cardContainer);
        
        // Start countdown for auto-redirect
        this.startCountdown();
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
            <div class="winner-player-info">
                <div class="winner-avatar-large">${this.winnerData.playerName.charAt(0).toUpperCase()}</div>
                <div class="winner-details">
                    <h2>${this.winnerData.playerName}</h2>
                    <p>Card #${cardNumber}</p>
                </div>
            </div>
            <div class="winning-stats">
                <span class="winning-badge"><i class="fas fa-star"></i> ${winningLines.length} Winning Lines</span>
                <span class="time-badge"><i class="fas fa-clock"></i> ${this.winnerData.gameTime}s</span>
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
                // Get the number from cardData.numbers (column-major order)
                const numberIndex = col * 5 + row;
                const number = cardData.numbers ? cardData.numbers[numberIndex] : '??';
                cell.textContent = number;
                cell.setAttribute('data-number', number);
                
                // Check if this number is marked
                const isMarked = cardData.markedNumbers && 
                                cardData.markedNumbers.includes(number);
                
                if (isMarked) {
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
                <h3><i class="fas fa-medal"></i> Winning Pattern Detected</h3>
                <p>${winningLines.join(', ')}</p>
            `;
            cardElement.appendChild(patternInfo);
        }
        
        container.appendChild(cardElement);
    }

    createSampleCard(container) {
        console.log('Creating sample card for display');
        
        const cardElement = document.createElement('div');
        cardElement.className = 'scaled-winning-card';
        
        // Card header
        const headerDiv = document.createElement('div');
        headerDiv.className = 'scaled-card-header';
        headerDiv.innerHTML = `
            <div class="winner-player-info">
                <div class="winner-avatar-large">T</div>
                <div class="winner-details">
                    <h2>Telegram User</h2>
                    <p>Card #123</p>
                </div>
            </div>
            <div class="winning-stats">
                <span class="winning-badge"><i class="fas fa-star"></i> 2 Winning Lines</span>
                <span class="time-badge"><i class="fas fa-clock"></i> 45s</span>
            </div>
        `;
        cardElement.appendChild(headerDiv);
        
        // Create sample grid
        const gridContainer = document.createElement('div');
        gridContainer.className = 'scaled-bingo-grid';
        
        // Create column headers
        ['B', 'I', 'N', 'G', 'O'].forEach(letter => {
            const headerCell = document.createElement('div');
            headerCell.className = 'scaled-grid-header';
            headerCell.textContent = letter;
            gridContainer.appendChild(headerCell);
        });
        
        // Sample bingo numbers
        const sampleNumbers = [
            1, 16, 31, 46, 61,
            2, 17, 32, 47, 62,
            3, 18, 'FREE', 48, 63,
            4, 19, 34, 49, 64,
            5, 20, 35, 50, 65
        ];
        
        // Create the grid cells
        for (let i = 0; i < 25; i++) {
            const row = Math.floor(i / 5);
            const col = i % 5;
            
            const cell = document.createElement('div');
            cell.className = 'scaled-grid-cell';
            
            if (i === 12) {
                cell.textContent = 'FREE';
                cell.className += ' scaled-free scaled-marked';
            } else {
                cell.textContent = sampleNumbers[i];
                
                // Mark sample winning pattern (first row + diagonal)
                if ([0, 1, 2, 3, 4, 6, 12, 18, 24].includes(i)) {
                    cell.className += ' scaled-marked';
                }
                
                // Highlight winning cells (first row)
                if ([0, 1, 2, 3, 4].includes(i)) {
                    cell.className += ' scaled-winning';
                }
            }
            
            cell.setAttribute('data-col', col);
            gridContainer.appendChild(cell);
        }
        
        cardElement.appendChild(gridContainer);
        
        // Winning pattern info
        const patternInfo = document.createElement('div');
        patternInfo.className = 'scaled-pattern-info';
        patternInfo.innerHTML = `
            <h3><i class="fas fa-medal"></i> Winning Pattern Detected</h3>
            <p>Row 1, Diagonal (Top-Left to Bottom-Right)</p>
        `;
        cardElement.appendChild(patternInfo);
        
        container.appendChild(cardElement);
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

    startCountdown() {
        let countdown = 5;
        const countdownElement = document.getElementById('countdown');
        
        const countdownInterval = setInterval(() => {
            countdown--;
            if (countdownElement) {
                countdownElement.textContent = countdown;
            }
            
            if (countdown <= 0) {
                clearInterval(countdownInterval);
                this.handlePlayAgain();
            }
        }, 1000);
    }

    handlePlayAgain() {
        console.log('Redirecting to card selection page...');
        
        // Clear session storage
        sessionStorage.clear();
        
        // Redirect to choose-cards.html (card selection page)
        window.location.href = 'choose-cards.html';
    }

    showDefaultCard() {
        console.log('Showing default card');
        // We'll create the default card in displayWinningCard
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, creating WinnerPage instance');
    new WinnerPage();
});