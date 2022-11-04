import json
import logging
import os
from typing import Dict, List, Tuple

from telegram import InlineQueryResultArticle, InputTextMessageContent
from telegram import Update, InlineKeyboardMarkup, InlineKeyboardButton
from telegram.ext import filters, MessageHandler, ApplicationBuilder, CommandHandler, ContextTypes, InlineQueryHandler, \
    CallbackQueryHandler

logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)


def parse_data_tree() -> Dict:
    # Opening JSON file
    with open('achi.json', 'r') as openfile:
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
    await context.bot.send_message(chat_id=update.effective_chat.id, text="Вибачте, я не зрозумів вашу команду.")


async def button(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Parses the CallbackQuery and updates the message text."""
    query = update.callback_query

    # CallbackQueries need to be answered, even if no notification to the user is needed
    # Some clients may have trouble otherwise. See https://core.telegram.org/bots/api#callbackquery
    await query.answer()

    level = context.chat_data.get("level", 0)  # todo: what if no level
    context.chat_data["choice"] = query.data
    context.chat_data["level"] = level + 1

    achi_node = context.bot_data["achi_data"][query.data]
    if level == 3:
        await query.delete_message()
        for record in achi_node["children"]:
            code = record["code"]
            name_ua = record["name_ua"]
            await context.bot.send_message(chat_id=update.effective_chat.id, text=f"*Код: {code}*\nНазва: {name_ua}",
                                           parse_mode="markdown")
    else:
        await query.edit_message_text(text="Оберіть категорію:",
                                      reply_markup=build_reply_keyboard_markup(
                                          build_keys_for_each_children(context.bot_data["achi_data"], achi_node)))


def select_factory(options: List[Tuple[str, str]]):
    reply_markup = build_reply_keyboard_markup(options)

    async def select_inner(update: Update, context: ContextTypes.DEFAULT_TYPE):
        context.chat_data["level"] = 0
        await context.bot.send_message(chat_id=update.effective_chat.id,
                                       text="Оберіть категорію:",
                                       reply_markup=reply_markup)

    return select_inner


def build_reply_keyboard_markup(options: List[Tuple[str, str]]) -> InlineKeyboardMarkup:
    inline_buttons = [[InlineKeyboardButton(option[0], callback_data=option[1])] for option in options]
    return InlineKeyboardMarkup(inline_keyboard=inline_buttons)


def build_keys_for_each_children(achi_data: Dict, achi_node: Dict) -> List[Tuple[str, str]]:
    return [(achi_data[str(key)]["name_ua"], key) for key in achi_node["children"]]


if __name__ == '__main__':
    parsed_data = parse_data_tree()
    application = ApplicationBuilder().token(os.environ['TOKEN']).build()
    application.bot_data["achi_data"] = parsed_data

    start_handler = CommandHandler('start', start)
    application.add_handler(start_handler)

    echo_handler = MessageHandler(filters.TEXT & (~filters.COMMAND), echo)
    application.add_handler(echo_handler)

    caps_handler = CommandHandler('caps', caps)
    application.add_handler(caps_handler)

    select_handler = CommandHandler("select", select_factory(
        build_keys_for_each_children(parsed_data, parsed_data["0"])))
    application.add_handler(select_handler)

    application.add_handler(CallbackQueryHandler(button))

    inline_caps_handler = InlineQueryHandler(inline_caps)
    application.add_handler(inline_caps_handler)

    # Other handlers
    unknown_handler = MessageHandler(filters.COMMAND, unknown)
    application.add_handler(unknown_handler)

    application.run_polling()

"""
TODO:
* skip selection if only one option available
* button to start selection
* go to previous category
* Use sentence case for categories
* Shorted word "ПРОЦЕДУРИ"
* show full text on hover or hold
* try to use message + button instead of inline buttons
"""
