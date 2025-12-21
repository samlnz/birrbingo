// Telegram WebApp initialization
let tg = window.Telegram.WebApp;
let selectedCards = [];
let timerInterval;
let timeLeft = 60; // 1 minute in seconds
let currentPage = 1;
const cardsPerPage = 100;
const totalCards = 500;

// Initialize the app
tg.expand();
tg.BackButton.hide();

// Set player info from Telegram
document.addEventListener('DOMContentLoaded', function() {
    initPlayerInfo();
    generateCardGrid();
    updateTimerDisplay();
    startTimer();
    
    // Add search functionality
    document.getElementById('cardSearch').addEventListener('input', function(e) {
        const cardNum = parseInt(e.target.value);
        if (cardNum >= 1 && cardNum <= 500) {
            jumpToCard(cardNum);
        }
    });
});

// Initialize player information
function initPlayerInfo() {
    const user = tg.initDataUnsafe?.user;
    const playerInfo = document.getElementById('playerInfo');
    
    if (user) {
        const username = user.username ? `@${user.username}` : `${user.first_name}${user.last_name ? ' ' + user.last_name : ''}`;
        playerInfo.innerHTML = `
            <i class="fas fa-user"></i>
            <span>Player: ${username} | ID: ${user.id}</span>
        `;
        
        // Store player info for game page
        localStorage.setItem('playerInfo', JSON.stringify({
            id: user.id,
            username: username,
            firstName: user.first_name
        }));
    } else {
        playerInfo.innerHTML = `
            <i class="fas fa-user"></i>
            <span>Demo Player</span>
        `;
    }
}

// Generate card grid with pagination
function generateCardGrid() {
    const grid = document.getElementById('cardsGrid');
    grid.innerHTML = '';
    
    const startCard = (currentPage - 1) * cardsPerPage + 1;
    const endCard = Math.min(currentPage * cardsPerPage, totalCards);
    
    for (let i = startCard; i <= endCard; i++) {
        const card = document.createElement('div');
        card.className = 'card-number';
        if (selectedCards.includes(i)) {
            card.classList.add('selected');
        }
        card.textContent = i;
        card.dataset.cardNumber = i;
        
        card.addEventListener('click', () => toggleCardSelection(i));
        
        grid.appendChild(card);
    }
    
    document.getElementById('pageInfo').textContent = `Page ${currentPage} of ${Math.ceil(totalCards / cardsPerPage)}`;
}

// Change page
function changePage(direction) {
    const totalPages = Math.ceil(totalCards / cardsPerPage);
    const newPage = currentPage + direction;
    
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        generateCardGrid();
    }
}

// Jump to specific card
function jumpToCard(cardNumber) {
    if (cardNumber < 1 || cardNumber > totalCards) return;
    
    const page = Math.ceil(cardNumber / cardsPerPage);
    currentPage = page;
    generateCardGrid();
    
    // Highlight the card
    const cardElement = document.querySelector(`.card-number[data-card-number="${cardNumber}"]`);
    if (cardElement) {
        cardElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Add temporary highlight
        cardElement.style.transform = 'scale(1.2)';
        cardElement.style.boxShadow = '0 0 20px var(--accent-color)';
        setTimeout(() => {
            cardElement.style.transform = '';
            cardElement.style.boxShadow = '';
        }, 1000);
    }
}

// Select random cards
function selectRandom() {
    if (selectedCards.length >= 2) return;
    
    const availableCards = Array.from({length: totalCards}, (_, i) => i + 1)
        .filter(card => !selectedCards.includes(card));
    
    if (availableCards.length === 0) return;
    
    const randomIndex = Math.floor(Math.random() * availableCards.length);
    const randomCard = availableCards[randomIndex];
    
    toggleCardSelection(randomCard);
}

// Toggle card selection
function toggleCardSelection(cardNumber) {
    // Check if time is up
    if (timeLeft <= 0) {
        showToast('Time is up! Starting game...', 'warning');
        setTimeout(startGame, 2000);
        return;
    }
    
    const index = selectedCards.indexOf(cardNumber);
    const cardElement = document.querySelector(`.card-number[data-card-number="${cardNumber}"]`);
    
    if (index === -1) {
        // Check if max cards reached
        if (selectedCards.length >= 2) {
            showToast('You can only select up to 2 cards!', 'error');
            return;
        }
        
        // Add to selection
        selectedCards.push(cardNumber);
        cardElement.classList.add('selected');
        
        // Play selection sound
        playSound('select');
        
        // Show success message
        showToast(`Card ${cardNumber} selected!`, 'success');
    } else {
        // Remove from selection
        selectedCards.splice(index, 1);
        cardElement.classList.remove('selected');
        
        // Play remove sound
        playSound('remove');
    }
    
    updateSelectionCount();
    updatePreview();
    updateStartButton();
}

// Update selection count display
function updateSelectionCount() {
    document.getElementById('selectedCount').textContent = selectedCards.length;
}

// Update preview section
function updatePreview() {
    const previewContainer = document.getElementById('previewCards');
    
    if (selectedCards.length === 0) {
        previewContainer.innerHTML = `
            <div class="empty-preview">
                <i class="fas fa-ticket-alt"></i>
                <p>No cards selected yet</p>
            </div>
        `;
        return;
    }
    
    previewContainer.innerHTML = selectedCards.map(cardNumber => `
        <div class="preview-card">
            <h4><i class="fas fa-ticket-alt"></i> Card #${cardNumber}</h4>
            <div class="preview-grid">
                <!-- Mini bingo card preview will be generated in game page -->
                <p>Ready to play!</p>
            </div>
        </div>
    `).join('');
}

// Update start button state
function updateStartButton() {
    const startBtn = document.getElementById('startGameBtn');
    startBtn.disabled = selectedCards.length === 0 || timeLeft <= 0;
}

// Start the game
function startGame() {
    if (selectedCards.length === 0) {
        showToast('Please select at least one card!', 'error');
        return;
    }
    
    // Stop timer
    clearInterval(timerInterval);
    
    // Save selected cards to localStorage
    localStorage.setItem('selectedCards', JSON.stringify(selectedCards));
    localStorage.setItem('selectionTime', timeLeft);
    
    // Play transition sound
    playSound('transition');
    
    // Show loading animation
    showLoadingAnimation();
    
    // Navigate to game page after animation
    setTimeout(() => {
        window.location.href = 'game.html';
    }, 1500);
}

// Show loading animation
function showLoadingAnimation() {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        backdrop-filter: blur(10px);
    `;
    
    const spinner = document.createElement('div');
    spinner.style.cssText = `
        width: 80px;
        height: 80px;
        border: 5px solid var(--primary-color);
        border-top-color: var(--secondary-color);
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 20px;
    `;
    
    const text = document.createElement('div');
    text.textContent = 'Loading Bingo Game...';
    text.style.cssText = `
        color: white;
        font-size: 1.5rem;
        font-weight: bold;
        text-align: center;
    `;
    
    overlay.appendChild(spinner);
    overlay.appendChild(text);
    document.body.appendChild(overlay);
    
    // Add spin animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
}

// Clear all selections
function clearSelection() {
    if (selectedCards.length === 0) return;
    
    // Remove selection from all cards
    document.querySelectorAll('.card-number.selected').forEach(card => {
        card.classList.remove('selected');
    });
    
    selectedCards = [];
    updateSelectionCount();
    updatePreview();
    updateStartButton();
    playSound('clear');
    showToast('All selections cleared', 'info');
}

// Timer functions
function startTimer() {
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        
        // Warning at 10 seconds
        if (timeLeft === 10) {
            showToast('10 seconds remaining!', 'warning');
            playSound('warning');
        }
        
        // Time's up
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            timeUp();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    document.getElementById('timer').textContent = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // Change color when time is low
    if (timeLeft <= 10) {
        document.getElementById('timer').style.color = 'var(--danger-color)';
    }
}

function timeUp() {
    if (selectedCards.length > 0) {
        showToast('Time\'s up! Starting game with your selections...', 'warning');
        setTimeout(startGame, 2000);
    } else {
        showToast('Time\'s up! No cards selected.', 'error');
        // Automatically select random cards and start
        while (selectedCards.length < 2) {
            selectRandom();
        }
        setTimeout(startGame, 2000);
    }
}

// Modal functions
function showModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
    playSound('modal');
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Toast notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'error' ? 'var(--danger-color)' : 
                     type === 'success' ? 'var(--secondary-color)' : 
                     type === 'warning' ? 'var(--accent-color)' : 'var(--primary-color)'};
        color: white;
        border-radius: 10px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        font-weight: 600;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
    `;
    
    document.body.appendChild(toast);
    
    // Add slideIn animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);
    
    // Remove toast after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Sound effects
function playSound(type) {
    // This will be implemented with actual audio files
    // For now, we'll just log
    console.log(`Playing ${type} sound`);
    
    // You can add actual audio playback here:
    // const audio = new Audio(`assets/sounds/${type}.mp3`);
    // audio.volume = 0.5;
    // audio.play().catch(e => console.log('Audio play failed:', e));
}

// Handle page visibility change
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Page is hidden, pause timer?
        // You might want to pause the timer when user switches tabs
    }
});