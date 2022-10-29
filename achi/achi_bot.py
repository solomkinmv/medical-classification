import json
import logging
import os
from typing import Dict, List, Tuple

from telegram import InlineQueryResultArticle, InputTextMessageContent, ReplyKeyboardMarkup, KeyboardButton
from telegram import Update, InlineKeyboardMarkup, InlineKeyboardButton
from telegram.ext import filters, MessageHandler, ApplicationBuilder, CommandHandler, ContextTypes, InlineQueryHandler, \
    CallbackQueryHandler

logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)


def parse_data_tree() -> Dict:
    # Opening JSON file
    with open('achi_custom.json', 'r') as openfile:
        return json.load(openfile)


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await context.bot.send_message(chat_id=update.effective_chat.id, text="I'm a bot, please talk to me!")


async def echo(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await context.bot.send_message(chat_id=update.effective_chat.id, text=update.message.text)


async def caps(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text_caps = ' '.join(context.args).upper()
    await context.bot.send_message(chat_id=update.effective_chat.id, text=text_caps)


async def inline_caps(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.inline_query.query
    if not query:
        return
    results = []
    results.append(
        InlineQueryResultArticle(
            id=query.upper(),
            title='Caps',
            input_message_content=InputTextMessageContent(query.upper())
        )
    )
    await context.bot.answer_inline_query(update.inline_query.id, results)


async def unknown(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await context.bot.send_message(chat_id=update.effective_chat.id, text="Sorry, I didn't understand that command.")


async def select(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("Please choose:",
                                    reply_markup=InlineKeyboardMarkup(inline_keyboard=[
                                        [
                                            InlineKeyboardButton("Option 1", callback_data="1"),
                                            InlineKeyboardButton("Option 2", callback_data="2"),
                                        ],
                                        [InlineKeyboardButton("Option 3", callback_data="3")],
                                    ]))


async def button(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Parses the CallbackQuery and updates the message text."""
    query = update.callback_query

    # CallbackQueries need to be answered, even if no notification to the user is needed
    # Some clients may have trouble otherwise. See https://core.telegram.org/bots/api#callbackquery
    await query.answer()

    await query.edit_message_text(text=f"Selected option: {query.data}")


def select_factory(options: List[Tuple[str, str]]):
    inline_buttons = [[InlineKeyboardButton(option[0], callback_data=option[1])] for option in options]

    async def select_inner(update: Update, context: ContextTypes.DEFAULT_TYPE):
        await update.message.reply_text("Please choose:",
                                        reply_markup=InlineKeyboardMarkup(inline_keyboard=inline_buttons))

    return select_inner


if __name__ == '__main__':
    achi_data = parse_data_tree()
    level_one_keys = [(key, "arg") for key in achi_data['children'].keys()]
    application = ApplicationBuilder().token(os.environ['TOKEN']).build()

    start_handler = CommandHandler('start', start)
    application.add_handler(start_handler)

    echo_handler = MessageHandler(filters.TEXT & (~filters.COMMAND), echo)
    application.add_handler(echo_handler)

    caps_handler = CommandHandler('caps', caps)
    application.add_handler(caps_handler)

    select_handler = CommandHandler("select", select_factory(level_one_keys))
    application.add_handler(select_handler)

    application.add_handler(CallbackQueryHandler(button))

    inline_caps_handler = InlineQueryHandler(inline_caps)
    application.add_handler(inline_caps_handler)

    # Other handlers
    unknown_handler = MessageHandler(filters.COMMAND, unknown)
    application.add_handler(unknown_handler)

    application.run_polling()
