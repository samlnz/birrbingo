class GameLogic {
    constructor() {
        this.BINGO_LETTERS = ['B', 'I', 'N', 'G', 'O'];
        this.NUMBER_RANGES = {
            'B': [1, 15],
            'I': [16, 30],
            'N': [31, 45],
            'G': [46, 60],
            'O': [61, 75]
        };
        
        this.winningPatterns = [
            'horizontal',
            'vertical', 
            'diagonal',
            'four-corners',
            'blackout' // All numbers
        ];
    }
    
    validateBingoClaim(playerId, cardNumber, calledNumbers) {
        // Get player's card
        const card = window.bingoApp?.fixedCards.get(cardNumber);
        if (!card) return { valid: false, reason: 'Card not found' };
        
        // Check if player has marked numbers
        if (!card.markedNumbers) return { valid: false, reason: 'No marked numbers' };
        
        // Verify all marked numbers were actually called
        const marked = Array.from(card.markedNumbers);
        const invalidMarks = marked.filter(num => !calledNumbers.has(num));
        
        if (invalidMarks.length > 0) {
            return { 
                valid: false, 
                reason: 'Invalid marks: ' + invalidMarks.join(', '),
                disqualify: true // Player tried to cheat
            };
        }
        
        // Check for valid winning pattern
        const hasWin = this.checkWinningPattern(card, new Set(marked));
        
        if (!hasWin) {
            return { 
                valid: false, 
                reason: 'No winning pattern',
                disqualify: true // False claim
            };
        }
        
        return { valid: true, pattern: hasWin };
    }
    
    checkWinningPattern(card, markedNumbers) {
        // Always include FREE space
        markedNumbers.add('FREE');
        
        // Check each pattern
        for (const pattern of this.winningPatterns) {
            if (this.checkPattern(pattern, card, markedNumbers)) {
                return pattern;
            }
        }
        
        return null;
    }
    
    checkPattern(pattern, card, marked) {
        switch(pattern) {
            case 'horizontal':
                return this.checkHorizontal(card, marked);
            case 'vertical':
                return this.checkVertical(card, marked);
            case 'diagonal':
                return this.checkDiagonal(card, marked);
            case 'four-corners':
                return this.checkFourCorners(card, marked);
            case 'blackout':
                return this.checkBlackout(card, marked);
            default:
                return false;
        }
    }
    
    checkHorizontal(card, marked) {
        for (let row = 0; row < 5; row++) {
            let complete = true;
            for (let col = 0; col < 5; col++) {
                const index = row * 5 + col;
                if (!marked.has(card.numbers[index])) {
                    complete = false;
                    break;
                }
            }
            if (complete) return true;
        }
        return false;
    }
    
    checkVertical(card, marked) {
        for (let col = 0; col < 5; col++) {
            let complete = true;
            for (let row = 0; row < 5; row++) {
                const index = row * 5 + col;
                if (!marked.has(card.numbers[index])) {
                    complete = false;
                    break;
                }
            }
            if (complete) return true;
        }
        return false;
    }
    
    checkDiagonal(card, marked) {
        // Top-left to bottom-right
        let diag1 = true;
        for (let i = 0; i < 5; i++) {
            const index = i * 5 + i;
            if (!marked.has(card.numbers[index])) {
                diag1 = false;
                break;
            }
        }
        
        // Top-right to bottom-left
        let diag2 = true;
        for (let i = 0; i < 5; i++) {
            const index = i * 5 + (4 - i);
            if (!marked.has(card.numbers[index])) {
                diag2 = false;
                break;
            }
        }
        
        return diag1 || diag2;
    }
    
    checkFourCorners(card, marked) {
        const corners = [
            0,           // Top-left
            4,           // Top-right
            20,          // Bottom-left
            24           // Bottom-right
        ];
        
        return corners.every(index => marked.has(card.numbers[index]));
    }
    
    checkBlackout(card, marked) {
        // All 24 numbers (excluding FREE)
        for (let i = 0; i < 25; i++) {
            if (i === 12) continue; // Skip FREE space
            if (!marked.has(card.numbers[i])) {
                return false;
            }
        }
        return true;
    }
    
    getLetterForNumber(number) {
        for (const [letter, range] of Object.entries(this.NUMBER_RANGES)) {
            if (number >= range[0] && number <= range[1]) {
                return letter;
            }
        }
        return '';
    }
    
    calculatePrizePool(players, stake) {
        const total = players * stake;
        const prize = total * 0.8; // 80% to winner
        const commission = total * 0.2; // 20% house
        
        return {
            total: Math.floor(total),
            prize: Math.floor(prize),
            commission: Math.floor(commission)
        };
    }
    
    // Anti-cheat: Track player claims
    trackPlayerClaim(playerId, claimTime, numbersCalled) {
        const claims = JSON.parse(localStorage.getItem('playerClaims') || '{}');
        
        if (!claims[playerId]) {
            claims[playerId] = [];
        }
        
        claims[playerId].push({
            time: claimTime,
            numbersCalled: Array.from(numbersCalled),
            isValidated: false
        });
        
        localStorage.setItem('playerClaims', JSON.stringify(claims));
    }
    
    // Detect suspicious patterns
    detectSuspiciousBehavior(playerId) {
        const claims = JSON.parse(localStorage.getItem('playerClaims') || '{}');
        const playerClaims = claims[playerId] || [];
        
        if (playerClaims.length >= 3) {
            // Multiple claims in short time
            const recentClaims = playerClaims.slice(-3);
            const timeSpan = recentClaims[2].time - recentClaims[0].time;
            
            if (timeSpan < 30000) { // 3 claims in 30 seconds
                return {
                    suspicious: true,
                    reason: 'Multiple rapid claims',
                    action: 'investigate'
                };
            }
        }
        
        return { suspicious: false };
    }
}

// Export for use
window.GameLogic = GameLogic;