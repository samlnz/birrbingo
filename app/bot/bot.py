import os
import logging
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, MessageHandler, filters, ContextTypes
from app.models import User, Game, Transaction, db
from flask import current_app

logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Get your Railway URL after deployment
RAILWAY_URL = os.environ.get('RAILWAY_PUBLIC_DOMAIN', 'https://your-app-name.railway.app')

class BingoBot:
    def __init__(self, token):
        self.token = token
        self.application = Application.builder().token(token).build()
        self.setup_handlers()
    
    def setup_handlers(self):
        """Setup all bot handlers"""
        self.application.add_handler(CommandHandler("start", self.start))
        self.application.add_handler(CommandHandler("play", self.play))
        self.application.add_handler(CommandHandler("balance", self.balance))
        self.application.add_handler(CommandHandler("deposit", self.deposit))
        self.application.add_handler(CommandHandler("withdraw", self.withdraw))
        self.application.add_handler(CommandHandler("help", self.help))
        
        # Handle web app data
        self.application.add_handler(MessageHandler(filters.StatusUpdate.WEB_APP_DATA, self.web_app_data))
    
    async def start(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /start command"""
        user = update.effective_user
        
        # Save user to database
        with current_app.app_context():
            existing_user = User.query.filter_by(telegram_id=user.id).first()
            if not existing_user:
                new_user = User(
                    telegram_id=user.id,
                    username=user.username,
                    balance=0.0
                )
                db.session.add(new_user)
                db.session.commit()
        
        # Create inline keyboard with Play button
        keyboard = [
            [InlineKeyboardButton("🎮 Play Bingo", callback_data="play")],
            [InlineKeyboardButton("💰 Balance", callback_data="balance")],
            [InlineKeyboardButton("💳 Deposit", callback_data="deposit")],
            [InlineKeyboardButton("📊 Stats", callback_data="stats")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await update.message.reply_text(
            f"🎯 Welcome to Addis Bingo, {user.first_name}!\n\n"
            "💰 Start with 10 Birr bonus!\n"
            "🎮 Play Bingo and win real money!\n\n"
            "Use /help for commands",
            reply_markup=reply_markup
        )
    
    async def play(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle play command - open web app"""
        user = update.effective_user
        
        # Create web app button
        keyboard = [[
            InlineKeyboardButton(
                "🎮 Open Bingo Game",
                web_app=WebAppInfo(url=f"{RAILWAY_URL}/game/lobby")
            )
        ]]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await update.message.reply_text(
            "Click below to open the Bingo game:",
            reply_markup=reply_markup
        )
    
    async def balance(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Show user balance"""
        user = update.effective_user
        
        with current_app.app_context():
            db_user = User.query.filter_by(telegram_id=user.id).first()
            if db_user:
                await update.message.reply_text(
                    f"💰 Your Balance: {db_user.balance:.2f} Birr\n"
                    f"🎮 Games Played: {db_user.games_played}\n"
                    f"🏆 Games Won: {db_user.games_won}"
                )
            else:
                await update.message.reply_text("Please use /start first!")
    
    async def deposit(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle deposit"""
        keyboard = [
            [InlineKeyboardButton("10 Birr", callback_data="deposit_10")],
            [InlineKeyboardButton("50 Birr", callback_data="deposit_50")],
            [InlineKeyboardButton("100 Birr", callback_data="deposit_100")],
            [InlineKeyboardButton("Other Amount", callback_data="deposit_other")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await update.message.reply_text(
            "💵 Select deposit amount:\n\n"
            "Send money to:\n"
            "📱 Telebirr: 0911-234-567\n"
            "🏦 CBE: 1000-1234-567\n\n"
            "After sending, forward the SMS to me",
            reply_markup=reply_markup
        )
    
    async def withdraw(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle withdrawal request"""
        user = update.effective_user
        
        with current_app.app_context():
            db_user = User.query.filter_by(telegram_id=user.id).first()
            if db_user and db_user.balance >= 50:
                await update.message.reply_text(
                    f"💳 Withdrawal Request\n\n"
                    f"Available: {db_user.balance:.2f} Birr\n"
                    f"Min withdrawal: 50 Birr\n\n"
                    "Reply with amount to withdraw:"
                )
                context.user_data['awaiting_withdrawal'] = True
            else:
                await update.message.reply_text(
                    "❌ Minimum withdrawal is 50 Birr\n"
                    "Play more games to earn!"
                )
    
    async def help(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Show help"""
        help_text = """
        🤖 **Addis Bingo Commands:**
        
        /start - Start the bot
        /play - Open Bingo game
        /balance - Check your balance
        /deposit - Add money to account
        /withdraw - Withdraw your winnings
        /help - Show this help
        
        🎮 **How to Play:**
        1. Use /play to open the game
        2. Choose a game room
        3. Mark numbers as they're called
        4. Shout BINGO when you win!
        
        💰 **Prizes:**
        • Small game: 100-500 Birr
        • Big game: 1000-5000 Birr
        • Jackpot: 10,000+ Birr
        
        Need help? Contact @AdminUsername
        """
        await update.message.reply_text(help_text)
    
    async def web_app_data(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle data from web app"""
        data = update.message.web_app_data.data
        await update.message.reply_text(f"Received from web app: {data}")

def run_bot():
    """Run the Telegram bot"""
    token = os.environ.get('TELEGRAM_BOT_TOKEN')
    if not token:
        logger.error("TELEGRAM_BOT_TOKEN not set!")
        return
    
    bot = BingoBot(token)
    
    # Start the bot
    logger.info("Starting Telegram bot...")
    bot.application.run_polling(allowed_updates=Update.ALL_TYPES)