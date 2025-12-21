class TelegramManager {
    constructor() {
        this.tg = window.Telegram?.WebApp;
        this.user = null;
        this.init();
    }
    
    init() {
        if (!this.tg) {
            console.log('Running in browser mode');
            this.setupBrowserMode();
            return;
        }
        
        // Initialize Telegram Web App
        this.tg.expand();
        this.tg.enableClosingConfirmation();
        
        // Set theme
        this.tg.setBackgroundColor('#1a1a2e');
        this.tg.setHeaderColor('#00b894');
        
        // Get user data
        if (this.tg.initDataUnsafe?.user) {
            this.user = this.tg.initDataUnsafe.user;
            this.updateUserInfo();
        }
        
        // Setup back button
        this.setupBackButton();
        
        // Handle theme changes
        this.tg.onEvent('themeChanged', () => {
            this.applyTheme();
        });
        
        console.log('Telegram Web App initialized');
    }
    
    setupBrowserMode() {
        // Mock user for browser testing
        this.user = {
            id: Math.floor(Math.random() * 1000000),
            first_name: 'Test',
            last_name: 'User',
            username: 'test_user'
        };
        
        this.updateUserInfo();
    }
    
    updateUserInfo() {
        if (!this.user) return;
        
        // Update player name
        const playerNameEl = document.getElementById('playerName');
        if (playerNameEl) {
            let name = this.user.first_name || '';
            if (this.user.last_name) {
                name += ' ' + this.user.last_name;
            }
            playerNameEl.textContent = name || 'Telegram User';
        }
        
        // Update avatar
        const avatarEl = document.getElementById('playerAvatar');
        if (avatarEl) {
            const initial = (this.user.first_name?.[0] || 'T').toUpperCase();
            avatarEl.textContent = initial;
        }
    }
    
    setupBackButton() {
        if (!this.tg?.BackButton) return;
        
        // Show back button on all pages except index
        if (!window.location.pathname.includes('index.html')) {
            this.tg.BackButton.show();
            this.tg.BackButton.onClick(() => {
                window.history.back();
            });
        }
    }
    
    applyTheme() {
        const theme = this.tg?.colorScheme || 'dark';
        
        if (theme === 'light') {
            document.documentElement.style.setProperty('--bg-color', '#ffffff');
            document.documentElement.style.setProperty('--text-color', '#000000');
        } else {
            document.documentElement.style.setProperty('--bg-color', '#1a1a2e');
            document.documentElement.style.setProperty('--text-color', '#ffffff');
        }
    }
    
    // Payment integration (placeholder)
    async processPayment(amount, description) {
        if (!this.tg) {
            console.log('Browser mode: Payment simulated');
            return { success: true, transaction_id: 'simulated_' + Date.now() };
        }
    
        // This would integrate with Telegram Payments
        // For now, return simulated success
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: true,
                    transaction_id: 'tg_' + Date.now()
                });
            }, 1000);
        });
    }
    
    // Share functionality
    shareResult(text) {
        if (this.tg?.shareMessage) {
            this.tg.shareMessage(text);
            return true;
        }
        
        // Fallback: Copy to clipboard
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text);
            this.showAlert('Result copied to clipboard!');
            return true;
        }
        
        return false;
    }
    
    showAlert(message) {
        if (this.tg?.showAlert) {
            this.tg.showAlert(message);
        } else {
            alert(message);
        }
    }
    
    closeApp() {
        if (this.tg?.close) {
            this.tg.close();
        }
    }
}

// Initialize Telegram manager
document.addEventListener('DOMContentLoaded', () => {
    window.telegramManager = new TelegramManager();
});