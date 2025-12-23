

// Game page functionality

class GamePage {
    constructor() {
        this.gameState = gameState;
        this.telegramManager = telegramManager;
        
        // BINGO ranges
        this.BINGO_RANGES = {
            'B': { min: 1, max: 15 },
            'I': { min: 16, max: 30 },
            'N': { min: 31, max: 45 },
            'G': { min: 46, max: 60 },
            'O': { min: 61, max: 75 }
        };
        
        // DOM elements
        this.currentNumberDisplay = document.getElementById('currentNumberDisplay');
        this.currentNumber = document.getElementById('currentNumber');
        this.numberLetter = document.getElementById('numberLetter');
        this.calledNumbersGrid = document.getElementById('calledNumbersGrid');
        this.numbersCalled = document.getElementById('numbersCalled');
        this.gameTime = document.getElementById('gameTime');
        this.activePlayers = document.getElementById('activePlayers');
        this.nextCallTimer = document.getElementById('nextCallTimer');
        this.playerCardsContainer = document.getElementById('playerCardsContainer');
        this.playerName = document.getElementById('playerName');
        this.playerAvatar = document.getElementById('playerAvatar');
        this.autoMarkBtn = document.getElementById('autoMarkBtn');
        this.bingoBtn = document.getElementById('bingoBtn');
        this.audioToggle = document.getElementById('audioToggle');
        this.audioSettingsBtn = document.getElementById('audioSettingsBtn');
        this.winningLineIndicator = document.getElementById('winningLineIndicator');
        this.winningLineText = document.getElementById('winningLineText');
        this.claimBingoBtn = document.getElementById('claimBingoBtn');
        
        // Audio elements
        this.numberCallAudio = document.getElementById('numberCallAudio');
        this.bingoAudio = document.getElementById('bingoAudio');
        this.backgroundMusic = document.getElementById('backgroundMusic');
        
        // Game state
        this.bingoNumbers = {};
        this.nextCallTime = 5;
        this.callIntervalId = null;
        this.gameTimerId = null;
        this.nextCallTimerId = null;
        this.callInterval = 5000;
        
        this.init();
    }

    init() {
        this.loadGameState();
        this.setupUserInfo();
        this.generateBingoCards();
        this.initializeDisplays();
        this.startTimers();
        this.setupAudio();
        this.checkForExistingCalls();
        this.setupEventListeners();
    }

    loadGameState() {
        this.gameState.loadFromSession();
    }

    setupUserInfo() {
        this.playerName.textContent = this.gameState.playerName;
        this.playerAvatar.textContent = this.gameState.playerName.charAt(0).toUpperCase();
    }

        generateBingoCards() {
        this.playerCardsContainer.innerHTML = '';
        
        this.gameState.selectedCards.forEach((cardNumber, index) => {
            const cardId = `card${index + 1}`;
            const bingoNumbers = this.generateBingoCardNumbers(cardNumber); // Pass card number
            this.bingoNumbers[cardId] = bingoNumbers;
            
            const cardElement = this.createBingoCard(cardNumber, cardId, bingoNumbers);
            this.playerCardsContainer.appendChild(cardElement);
        });
    }

       generateBingoCardNumbers(cardNumber) {
        // Use card number as seed for consistent cards
        const seed = cardNumber;
        const numbers = [];
        
        // Fixed column ranges
        const columnRanges = [
            {min: 1, max: 15},   // B
            {min: 16, max: 30},  // I
            {min: 31, max: 45},  // N
            {min: 46, max: 60},  // G
            {min: 61, max: 75}   // O
        ];
        
        // Generate consistent numbers based on card number
        columnRanges.forEach((range, colIndex) => {
            const colNumbers = [];
            for (let row = 0; row < 5; row++) {
                // Create deterministic number based on card number, column, and row
                const hash = cardNumber * 100 + colIndex * 10 + row;
                const num = (hash % (range.max - range.min + 1)) + range.min;
                colNumbers.push(num);
            }
            // Sort column numbers
            colNumbers.sort((a, b) => a - b);
            numbers.push(...colNumbers);
        });
        
        return numbers;
    }

    createBingoCard(cardNumber, cardId, bingoNumbers) {
        const cardElement = document.createElement('div');
        cardElement.className = 'bingo-card';
        cardElement.id = cardId;
        
        const cardHTML = `
            <div class="card-header">
                <h3 class="card-title">
                    <i class="fas fa-dice-${cardId === 'card1' ? 'one' : 'two'}"></i>
                    CARD #${cardNumber}
                </h3>
                <div class="card-number">#${cardNumber}</div>
            </div>
            
            <div class="bingo-grid">
                <!-- Column headers -->
                ${['B', 'I', 'N', 'G', 'O'].map(letter => 
                    `<div class="grid-header">${letter}</div>`
                ).join('')}
                
                <!-- Card numbers (5 rows x 5 columns) -->
                ${Array.from({ length: 25 }, (_, i) => {
                    const row = Math.floor(i / 5);
                    const col = i % 5;
                    const numberIndex = col * 5 + row;
                    const number = bingoNumbers[numberIndex];
                    const isFreeSpace = row === 2 && col === 2;
                    
                    return `
                        <div class="grid-cell ${isFreeSpace ? 'free marked' : ''}" 
                             data-card="${cardId}" 
                             data-number="${isFreeSpace ? 'FREE' : number}"
                             data-row="${row}" 
                             data-col="${col}">
                            ${isFreeSpace ? 'FREE' : number}
                        </div>
                    `;
                }).join('')}
            </div>
            
            <div class="card-stats">
                <div class="stat">
                    <div class="stat-value" id="${cardId}-marked">0</div>
                    <div class="stat-label">Marked</div>
                </div>
                <div class="stat">
                    <div class="stat-value" id="${cardId}-needed">5</div>
                    <div class="stat-label">To Win</div>
                </div>
                <div class="stat">
                    <div class="stat-value" id="${cardId}-lines">0</div>
                    <div class="stat-label">Lines</div>
                </div>
            </div>
        `;
        
        cardElement.innerHTML = cardHTML;
        
        // Add click event listeners to cells
        const cells = cardElement.querySelectorAll('.grid-cell:not(.free)');
        cells.forEach(cell => {
            cell.addEventListener('click', () => {
                const cardId = cell.dataset.card;
                const number = parseInt(cell.dataset.number);
                this.toggleNumberMark(cardId, number, cell);
            });
        });
        
        return cardElement;
    }

    toggleNumberMark(cardId, number, cell) {
        const markedNumbers = this.gameState.markedNumbers[cardId];
        
        if (markedNumbers.has(number)) {
            markedNumbers.delete(number);
            cell.classList.remove('marked');
        } else {
            markedNumbers.add(number);
            cell.classList.add('marked');
            
            // Check for winning line
            this.checkForWinningLine(cardId);
        }
        
        // Update card stats
        this.updateCardStats(cardId);
    }

    updateCardStats(cardId) {
        const markedCount = this.gameState.markedNumbers[cardId].size + 1; // +1 for free space
        const linesCount = this.gameState.winningLines[cardId].length;
        
        document.getElementById(`${cardId}-marked`).textContent = markedCount;
        document.getElementById(`${cardId}-lines`).textContent = linesCount;
        
        // Update BINGO button
        this.updateBingoButton();
    }

        checkForWinningLine(cardId) {
        const winningLines = [];
        const allMarked = new Set(this.gameState.markedNumbers[cardId]);
        allMarked.add('FREE'); // Free space is always marked
        
        // Check rows (0-4)
        for (let row = 0; row < 5; row++) {
            let isComplete = true;
            let allNumbersCalled = true;
            
            for (let col = 0; col < 5; col++) {
                const cell = document.querySelector(`[data-card="${cardId}"][data-row="${row}"][data-col="${col}"]`);
                const number = cell.dataset.number;
                
                // Check if marked by player
                if (!allMarked.has(number === 'FREE' ? 'FREE' : parseInt(number))) {
                    isComplete = false;
                }
                
                // Check if number was actually called (for non-free spaces)
                if (number !== 'FREE' && !this.gameState.calledNumbers.has(parseInt(number))) {
                    allNumbersCalled = false;
                }
            }
            
            // Only consider winning if ALL numbers in line were CALLED
            if (isComplete && allNumbersCalled && !this.gameState.winningLines[cardId].includes(`row${row}`)) {
                winningLines.push(`row${row}`);
                this.highlightWinningLine(cardId, 'row', row);
            }
        }
        
        // Check columns (0-4)
        for (let col = 0; col < 5; col++) {
            let isComplete = true;
            let allNumbersCalled = true;
            
            for (let row = 0; row < 5; row++) {
                const cell = document.querySelector(`[data-card="${cardId}"][data-row="${row}"][data-col="${col}"]`);
                const number = cell.dataset.number;
                
                if (!allMarked.has(number === 'FREE' ? 'FREE' : parseInt(number))) {
                    isComplete = false;
                }
                
                if (number !== 'FREE' && !this.gameState.calledNumbers.has(parseInt(number))) {
                    allNumbersCalled = false;
                }
            }
            
            if (isComplete && allNumbersCalled && !this.gameState.winningLines[cardId].includes(`col${col}`)) {
                winningLines.push(`col${col}`);
                this.highlightWinningLine(cardId, 'col', col);
            }
        }
        
        // Check diagonal (top-left to bottom-right)
        let diagonal1Complete = true;
        let diagonal1AllCalled = true;
        for (let i = 0; i < 5; i++) {
            const cell = document.querySelector(`[data-card="${cardId}"][data-row="${i}"][data-col="${i}"]`);
            const number = cell.dataset.number;
            
            if (!allMarked.has(number === 'FREE' ? 'FREE' : parseInt(number))) {
                diagonal1Complete = false;
            }
            
            if (number !== 'FREE' && !this.gameState.calledNumbers.has(parseInt(number))) {
                diagonal1AllCalled = false;
            }
        }
        if (diagonal1Complete && diagonal1AllCalled && !this.gameState.winningLines[cardId].includes('diag1')) {
            winningLines.push('diag1');
            this.highlightWinningLine(cardId, 'diag', 1);
        }
        
        // Check diagonal (top-right to bottom-left)
        let diagonal2Complete = true;
        let diagonal2AllCalled = true;
        for (let i = 0; i < 5; i++) {
            const cell = document.querySelector(`[data-card="${cardId}"][data-row="${i}"][data-col="${4 - i}"]`);
            const number = cell.dataset.number;
            
            if (!allMarked.has(number === 'FREE' ? 'FREE' : parseInt(number))) {
                diagonal2Complete = false;
            }
            
            if (number !== 'FREE' && !this.gameState.calledNumbers.has(parseInt(number))) {
                diagonal2AllCalled = false;
            }
        }
        if (diagonal2Complete && diagonal2AllCalled && !this.gameState.winningLines[cardId].includes('diag2')) {
            winningLines.push('diag2');
            this.highlightWinningLine(cardId, 'diag', 2);
        }
                // Check four corners
        let cornersComplete = true;
        let cornersAllCalled = true;
        const corners = [
            [0, 0], // Top-left
            [0, 4], // Top-right
            [4, 0], // Bottom-left
            [4, 4]  // Bottom-right
        ];
        
        corners.forEach(([row, col]) => {
            const cell = document.querySelector(`[data-card="${cardId}"][data-row="${row}"][data-col="${col}"]`);
            const number = cell.dataset.number;
            
            if (!allMarked.has(number === 'FREE' ? 'FREE' : parseInt(number))) {
                cornersComplete = false;
            }
            
            if (number !== 'FREE' && !this.gameState.calledNumbers.has(parseInt(number))) {
                cornersAllCalled = false;
            }
        });
        
        if (cornersComplete && cornersAllCalled && !this.gameState.winningLines[cardId].includes('corners')) {
            winningLines.push('corners');
            // Highlight the corners
            corners.forEach(([row, col]) => {
                const cell = document.querySelector(`[data-card="${cardId}"][data-row="${row}"][data-col="${col}"]`);
                if (cell) {
                    cell.classList.add('winning-corner');
                }
            });
        }
        // Add new winning lines
        winningLines.forEach(line => {
            if (!this.gameState.winningLines[cardId].includes(line)) {
                this.gameState.winningLines[cardId].push(line);
            }
        });
        
        // If we have a new winning line, show indicator
        if (winningLines.length > 0) {
            this.showWinningLineIndicator(cardId, winningLines);
        }
        
        this.updateCardStats(cardId);
    }

    highlightWinningLine(cardId, type, index) {
        const cells = [];
        
        if (type === 'row') {
            for (let col = 0; col < 5; col++) {
                cells.push(document.querySelector(`[data-card="${cardId}"][data-row="${index}"][data-col="${col}"]`));
            }
        } else if (type === 'col') {
            for (let row = 0; row < 5; row++) {
                cells.push(document.querySelector(`[data-card="${cardId}"][data-row="${row}"][data-col="${index}"]`));
            }
        } else if (type === 'diag') {
            if (index === 1) {
                for (let i = 0; i < 5; i++) {
                    cells.push(document.querySelector(`[data-card="${cardId}"][data-row="${i}"][data-col="${i}"]`));
                }
            } else {
                for (let i = 0; i < 5; i++) {
                    cells.push(document.querySelector(`[data-card="${cardId}"][data-row="${i}"][data-col="${4 - i}"]`));
                }
            }
        }
        
        cells.forEach(cell => {
            cell.classList.add('winning');
            setTimeout(() => cell.classList.remove('winning'), 2000);
        });
    }

    showWinningLineIndicator(cardId, lines) {
        const cardIndex = cardId === 'card1' ? 0 : 1;
        this.winningLineText.textContent = `Card #${this.gameState.selectedCards[cardIndex]} has completed ${lines.length} line${lines.length > 1 ? 's' : ''}!`;
        this.winningLineIndicator.classList.add('active');
        
        // Play winning sound
        BingoUtils.playAudio(this.bingoAudio, 0.8);
    }

    updateBingoButton() {
        const hasWinningLine = this.gameState.winningLines.card1.length > 0 || this.gameState.winningLines.card2.length > 0;
        this.bingoBtn.disabled = !hasWinningLine;
        
        if (hasWinningLine) {
            const totalLines = this.gameState.winningLines.card1.length + this.gameState.winningLines.card2.length;
            this.bingoBtn.innerHTML = `<i class="fas fa-trophy"></i> BINGO! (${totalLines} Line${totalLines > 1 ? 's' : ''})`;
        } else {
            this.bingoBtn.innerHTML = `<i class="fas fa-trophy"></i> BINGO! I HAVE A LINE!`;
        }
    }

    initializeDisplays() {
        this.createCalledNumbersGrid();
        this.updateDisplays();
    }

createCalledNumbersGrid() {
    this.calledNumbersGrid.innerHTML = '';
    
    // Column configuration - KEEP COLORS FOR LETTERS ONLY
    const columns = [
        { letter: 'B', min: 1, max: 15, color: '#FF0000' },
        { letter: 'I', min: 16, max: 30, color: '#00FF00' },
        { letter: 'N', min: 31, max: 45, color: '#0000FF' },
        { letter: 'G', min: 46, max: 60, color: '#FFFF00' },
        { letter: 'O', min: 61, max: 75, color: '#FF00FF' }
    ];
    
    // Create each column
    columns.forEach(col => {
        const columnDiv = document.createElement('div');
        columnDiv.className = 'bingo-column';
        columnDiv.id = `column-${col.letter}`;
        
        // Column header (B, I, N, G, O) - KEEP COLORED
        const headerDiv = document.createElement('div');
        headerDiv.className = 'column-header';
        headerDiv.textContent = col.letter;
        headerDiv.style.color = col.color;
        headerDiv.style.borderColor = col.color;
        columnDiv.appendChild(headerDiv);
        
        // Numbers container
        const numbersContainer = document.createElement('div');
        numbersContainer.className = 'column-numbers';
        numbersContainer.id = `numbers-${col.letter}`;
        
        // Add numbers for this column (1-15, 16-30, etc.) - NO COLOR
        for (let i = col.min; i <= col.max; i++) {
            const numberElement = document.createElement('div');
            numberElement.className = 'called-number';
            numberElement.textContent = i;
            numberElement.dataset.number = i;
            numberElement.dataset.column = col.letter;
            // REMOVED: numberElement.style.color = col.color;
            // REMOVED: numberElement.style.borderLeft = `4px solid ${col.color}`;
            numbersContainer.appendChild(numberElement);
        }
        
        columnDiv.appendChild(numbersContainer);
        this.calledNumbersGrid.appendChild(columnDiv);
    });
}
updateCalledNumbersDisplay() {
    // REMOVED: const columnColors = {...}
    
    // Update all called numbers
    this.gameState.calledNumbers.forEach(number => {
        // Find the element
        const element = document.querySelector(`.called-number[data-number="${number}"]`);
        if (element) {
            element.classList.add('called');
            // Use a neutral color for called numbers instead of column colors
            element.style.backgroundColor = '#4CAF50'; // Green for called numbers
            element.style.color = '#FFFFFF';
            element.style.fontWeight = 'bold';
            element.style.boxShadow = '0 0 10px rgba(255,255,255,0.5)';
        }
    });
    
    this.numbersCalled.textContent = this.gameState.calledNumbers.size;
}
    updateDisplays() {
        this.activePlayers.textContent = this.gameState.activePlayers;
    }

    generateNextNumber() {
        if (this.gameState.calledNumbers.size >= 75) {
            return null;
        }
        
        let number;
        do {
            number = Math.floor(Math.random() * 75) + 1;
        } while (this.gameState.calledNumbers.has(number));
        
        return number;
    }

    callNextNumber() {
        const number = this.generateNextNumber();
        if (!number) {
            this.endGame();
            return;
        }
        
        // Add to called numbers
        this.gameState.calledNumbers.add(number);
        
        // Update displays
        this.updateNumberDisplay(number);
        this.updateCalledNumbersDisplay();
        
        // Auto-mark numbers on cards
        if (this.gameState.isAutoMark) {
            this.autoMarkNumbers(number);
        }
        
        // Play audio
        BingoUtils.playAudio(this.numberCallAudio, 0.7);
        
        // Reset next call timer
        this.nextCallTime = 5;
        this.updateNextCallTimer();
        
        // Save game state
        this.gameState.saveToSession();
    }

updateNumberDisplay(number) {
    // Determine BINGO letter
    let letter = '';
    for (const [l, range] of Object.entries(this.BINGO_RANGES)) {
        if (number >= range.min && number <= range.max) {
            letter = l;
            break;
        }
    }
    
    // Get color based on letter
    const letterColors = {
        'B': '#FF0000',    // Red for B
        'I': '#00FF00',    // Green for I  
        'N': '#0000FF',    // Blue for N
        'G': '#FFFF00',    // Yellow for G
        'O': '#FF00FF'     // Magenta for O
    };
    
    // Animate the number display
    this.currentNumber.style.transform = 'scale(0.5)';
    this.currentNumber.style.opacity = '0';
    
    setTimeout(() => {
        this.currentNumber.textContent = number.toString().padStart(2, '0');
        this.numberLetter.textContent = letter;
        this.currentNumberDisplay.textContent = `${letter}-${number}`;
        
        // Set color based on column
        if (letterColors[letter]) {
            this.currentNumber.style.color = letterColors[letter];
            this.numberLetter.style.color = letterColors[letter];
        }
        
        this.currentNumber.style.transform = 'scale(1)';
        this.currentNumber.style.opacity = '1';
        this.currentNumber.classList.add('animate-number-pop');
        
        setTimeout(() => {
            this.currentNumber.classList.remove('animate-number-pop');
        }, 500);
    }, 300);
}
        autoMarkNumbers(number) {
        // Only mark if number was actually called
        if (!this.gameState.calledNumbers.has(number)) return;
        
        this.gameState.selectedCards.forEach((_, index) => {
            const cardId = `card${index + 1}`;
            const bingoNumbers = this.bingoNumbers[cardId];
            
            if (bingoNumbers.includes(number)) {
                // Find and mark the cell
                const cells = document.querySelectorAll(`[data-card="${cardId}"]`);
                cells.forEach(cell => {
                    if (parseInt(cell.dataset.number) === number) {
                        this.gameState.markedNumbers[cardId].add(number);
                        cell.classList.add('marked');
                        
                        // Check for winning line with validation
                        this.checkForWinningLine(cardId);
                    }
                });
            }
        });
    }

    checkForExistingCalls() {
        // Simulate some numbers already called
        const initialCalls = 5;
        for (let i = 0; i < initialCalls; i++) {
            const number = this.generateNextNumber();
            if (number) {
                this.gameState.calledNumbers.add(number);
                
                // Auto-mark if enabled
                if (this.gameState.isAutoMark) {
                    this.autoMarkNumbers(number);
                }
            }
        }
        
        this.updateCalledNumbersDisplay();
        this.numbersCalled.textContent = this.gameState.calledNumbers.size;
    }

    startTimers() {
        this.startGameTimer();
        this.startCaller();
    }

    startGameTimer() {
        this.gameTimerId = setInterval(() => {
            this.gameState.gameTime++;
            
            const minutes = Math.floor(this.gameState.gameTime / 60);
            const seconds = this.gameState.gameTime % 60;
            this.gameTime.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    startCaller() {
        // Call first number immediately
        setTimeout(() => this.callNextNumber(), 1000);
        
        // Set up interval for subsequent calls
        this.callIntervalId = setInterval(() => {
            this.callNextNumber();
        }, this.callInterval);
        
        // Start next call countdown
        this.startNextCallTimer();
    }

    startNextCallTimer() {
        this.nextCallTimerId = setInterval(() => {
            this.nextCallTime--;
            this.updateNextCallTimer();
            
            if (this.nextCallTime <= 0) {
                this.nextCallTime = 5;
            }
        }, 1000);
    }

    updateNextCallTimer() {
        this.nextCallTimer.textContent = this.nextCallTime.toString().padStart(2, '0');
    }

    setupAudio() {
        // Set initial volume
        if (this.numberCallAudio) this.numberCallAudio.volume = 0.7;
        if (this.bingoAudio) this.bingoAudio.volume = 0.8;
        if (this.backgroundMusic) this.backgroundMusic.volume = 0.3;
        
        // Try to play background music
        if (this.gameState.isAudioEnabled && this.backgroundMusic) {
            this.backgroundMusic.play().catch(e => console.log('Background music play failed:', e));
        }
    }

    endGame() {
        clearInterval(this.callIntervalId);
        clearInterval(this.gameTimerId);
        clearInterval(this.nextCallTimerId);
        
        BingoUtils.showNotification('All numbers have been called! Game over.', 'info');
    }

    setupEventListeners() {
        this.autoMarkBtn.addEventListener('click', () => {
            this.gameState.isAutoMark = !this.gameState.isAutoMark;
            this.autoMarkBtn.innerHTML = this.gameState.isAutoMark ? 
                `<i class="fas fa-robot"></i> AUTO-MARK: ON` :
                `<i class="fas fa-robot"></i> AUTO-MARK: OFF`;
            this.autoMarkBtn.style.background = this.gameState.isAutoMark ?
                'linear-gradient(135deg, #4CAF50, #2E7D32)' :
                'linear-gradient(135deg, #f44336, #c62828)';
            
            this.gameState.saveToSession();
        });
        
        this.bingoBtn.addEventListener('click', () => {
            if (this.bingoBtn.disabled) return;
            
            // Show confirmation
            this.winningLineText.textContent = `Claiming BINGO for ${this.gameState.playerName}!`;
            this.winningLineIndicator.classList.add('active');
            
            // Play bingo sound
            BingoUtils.playAudio(this.bingoAudio, 0.8);
        });
        
        this.audioToggle.addEventListener('click', () => {
            this.gameState.isAudioEnabled = !this.gameState.isAudioEnabled;
            
            if (this.gameState.isAudioEnabled) {
                this.audioToggle.innerHTML = '<i class="fas fa-volume-up"></i>';
                this.audioToggle.style.color = '#00b4d8';
                this.audioToggle.style.borderColor = '#00b4d8';
                
                // Resume audio
                if (this.backgroundMusic) {
                    this.backgroundMusic.play().catch(e => console.log('Audio play failed:', e));
                }
            } else {
                this.audioToggle.innerHTML = '<i class="fas fa-volume-mute"></i>';
                this.audioToggle.style.color = '#ff4b4b';
                this.audioToggle.style.borderColor = '#ff4b4b';
                
                // Pause audio
                if (this.backgroundMusic) {
                    this.backgroundMusic.pause();
                }
            }
            
            this.gameState.saveToSession();
        });
        
        this.audioSettingsBtn.addEventListener('click', () => {
            BingoUtils.showNotification('Audio settings would open here.', 'info');
        });
        
        this.claimBingoBtn.addEventListener('click', () => {
            this.claimBingo();
        });
        
        // Handle page visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                console.log('Game paused');
                // Pause audio
                if (this.backgroundMusic) {
                    this.backgroundMusic.pause();
                }
            } else {
                console.log('Game resumed');
                // Resume audio
                if (this.gameState.isAudioEnabled && this.backgroundMusic) {
                    this.backgroundMusic.play().catch(e => console.log('Audio play failed:', e));
                }
            }
        });
    }

    claimBingo() {
        // Prepare winner data
        const winnerData = {
            playerName: this.gameState.playerName,
            playerId: this.gameState.playerId,
            cardNumbers: this.gameState.selectedCards,
            winningLines: {
                card1: this.gameState.winningLines.card1.length,
                card2: this.gameState.winningLines.card2.length
            },
            totalLines: this.gameState.winningLines.card1.length + this.gameState.winningLines.card2.length,
            gameTime: this.gameState.gameTime,
            calledNumbers: this.gameState.calledNumbers.size
        };
        
        // Store in sessionStorage for winner page
        sessionStorage.setItem('bingoWinner', JSON.stringify(winnerData));
        
        // Send win data to backend
        this.sendWinData(winnerData);
        
        // Navigate to winner page
        setTimeout(() => {
            BingoUtils.navigateTo('winner.html');
        }, 1000);
    }

    sendWinData(winnerData) {
        const winData = {
            action: 'player_win',
            ...winnerData,
            timestamp: Date.now(),
            platform: 'telegram'
        };
        
        console.log('Sending win data:', winData);
        
        if (this.telegramManager.isInitialized) {
            this.telegramManager.sendData(winData);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new GamePage();
});