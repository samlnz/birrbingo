import os
import logging
from flask import Flask, render_template
from app.bot.bot import run_bot
import threading

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

app = Flask(__name__)
app.secret_key = os.environ.get('FLASK_SECRET_KEY', 'dev-secret')

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/game/<game_id>')
def game_page(game_id):
    return render_template('game.html', game_id=game_id)

@app.route('/admin')
def admin_panel():
    return render_template('admin/login.html')

# Health check for Railway
@app.route('/health')
def health():
    return {'status': 'healthy'}, 200

def start_bot():
    """Start Telegram bot in background"""
    try:
        run_bot()
    except Exception as e:
        print(f"Bot error: {e}")

if __name__ == '__main__':
    # Start bot in separate thread
    bot_thread = threading.Thread(target=start_bot, daemon=True)
    bot_thread.start()
    
    # Start Flask app
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)