import random
from datetime import datetime

class BingoGame:
    def __init__(self, game_id, entry_price=10):
        self.game_id = game_id
        self.entry_price = entry_price
        self.players = {}
        self.called_numbers = []
        self.status = "waiting"  # waiting, active, finished
        self.board_size = 5
        self.max_number = 75
        
    def generate_board(self, seed=None):
        """Generate a Bingo board"""
        if seed:
            random.seed(seed)
        
        # Generate 5x5 board with BINGO columns
        columns = {
            'B': random.sample(range(1, 16), 5),
            'I': random.sample(range(16, 31), 5),
            'N': random.sample(range(31, 46), 5),
            'G': random.sample(range(46, 61), 5),
            'O': random.sample(range(61, 76), 5)
        }
        
        # Create 5x5 grid
        board = []
        for i in range(5):
            row = [
                columns['B'][i],
                columns['I'][i],
                columns['N'][i],
                columns['G'][i],
                columns['O'][i]
            ]
            board.extend(row)
        
        # Make center free
        board[12] = "FREE"
        
        random.seed()  # Reset seed
        return board
    
    def call_number(self):
        """Call a new Bingo number"""
        if len(self.called_numbers) >= self.max_number:
            return None
        
        available = [n for n in range(1, self.max_number + 1) 
                    if n not in self.called_numbers]
        
        if not available:
            return None
        
        number = random.choice(available)
        self.called_numbers.append(number)
        
        # Format as B-15, I-30, etc.
        if number <= 15:
            letter = "B"
        elif number <= 30:
            letter = "I"
        elif number <= 45:
            letter = "N"
        elif number <= 60:
            letter = "G"
        else:
            letter = "O"
        
        return f"{letter}-{number}"
    
    def check_win(self, player_id):
        """Check if player has won"""
        if player_id not in self.players:
            return False
        
        player = self.players[player_id]
        marked = set(player.get('marked', []))
        board = player.get('board', [])
        
        # Check rows
        for i in range(0, 25, 5):
            if all(board[i + j] in marked or board[i + j] == "FREE" 
                  for j in range(5)):
                return True
        
        # Check columns
        for i in range(5):
            if all(board[i + j*5] in marked or board[i + j*5] == "FREE" 
                  for j in range(5)):
                return True
        
        # Check diagonals
        if all(board[i] in marked or board[i] == "FREE" 
              for i in [0, 6, 12, 18, 24]):
            return True
        if all(board[i] in marked or board[i] == "FREE" 
              for i in [4, 8, 12, 16, 20]):
            return True
        
        return False