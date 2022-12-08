import json
import logging
import os
from typing import Dict, List, Tuple

from telegram import InlineQueryResultArticle, InputTextMessageContent, ReplyKeyboardMarkup, KeyboardButton
from telegram import Update
from telegram.ext import filters, MessageHandler, ApplicationBuilder, CommandHandler, ContextTypes, InlineQueryHandler

BACK = "Назад ⤴️"
LAST_MESSAGE_ID_KEY = "last_message_id"

logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)


def parse_data_tree() -> Dict:
    # Opening JSON file
    with open('data/achi_hierarchy.json', 'r') as openfile:
        return json.load(openfile)


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await context.bot.send_message(chat_id=update.effective_chat.id, text="I'm a bot, please talk to me!")


async def text(update: Update, context: ContextTypes.DEFAULT_TYPE):
    message_text = update.message.text
    level = context.chat_data.get("level", 0)  # todo: what if no level
    if message_text == BACK:
        level -= 1
    else:
        context.chat_data[f'choice{level}'] = message_text
        level += 1

    context.chat_data["level"] = level

    achi_node = context.bot_data["achi_data"]
    breadcrumbs = []
    for i in range(level):
        achi_node = achi_node["children"][context.chat_data[f'choice{i}']]
        breadcrumbs.append(context.chat_data[f"choice{i}"])

    joined_breadcrumbs = " -> ".join(breadcrumbs)

    await clean_up_old_messages(context, update)

    if level == 0:
        sent_message = await context.bot.send_message(chat_id=update.effective_chat.id,
                                                      text=f"{joined_breadcrumbs}\nОберіть категорію:",
                                                      reply_markup=build_reply_keyboard_markup(list(achi_node["children"].keys())))
        context.chat_data[LAST_MESSAGE_ID_KEY] = sent_message.message_id
    elif level == 4:
        await context.bot.send_message(chat_id=update.effective_chat.id, text=f"{joined_breadcrumbs}")
        for record in achi_node["children"]:
            code = record["code"]
            name_ua = record["name_ua"]
            await context.bot.send_message(chat_id=update.effective_chat.id,
                                           text=f"*Код: {code}*\nНазва: {name_ua}",
                                           parse_mode="markdown")
    else:
        sent_message = await context.bot.send_message(chat_id=update.effective_chat.id,
                                                      text=f"{joined_breadcrumbs}\nОберіть під-категорію:",
                                                      reply_markup=build_reply_keyboard_markup([BACK] + list(achi_node["children"].keys())))
        context.chat_data[LAST_MESSAGE_ID_KEY] = sent_message.message_id
        return


async def clean_up_old_messages(context, update):
    await context.bot.delete_message(chat_id=update.effective_chat.id, message_id=update.message.message_id)
    if LAST_MESSAGE_ID_KEY in context.chat_data:
        await context.bot.delete_message(chat_id=update.effective_chat.id,
                                         message_id=context.chat_data[LAST_MESSAGE_ID_KEY])


async def caps(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text_caps = ' '.join(context.args).upper()
    await context.bot.send_message(chat_id=update.effective_chat.id, text=text_caps)


async def inline_caps(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.inline_query.query
    if not query:
        return

    results = [InlineQueryResultArticle(
        id=query.upper(),
        title='Caps',
        input_message_content=InputTextMessageContent(query.upper())
    )]
    await context.bot.answer_inline_query(update.inline_query.id, results)


async def unknown(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await context.bot.send_message(chat_id=update.effective_chat.id, text="Вибачте, я не зрозумів вашу команду.")


def select_factory(options: List[str]):
    reply_markup = build_reply_keyboard_markup(options)

    async def select_inner(update: Update, context: ContextTypes.DEFAULT_TYPE):
        context.chat_data["level"] = 0
        sent_message = await context.bot.send_message(chat_id=update.effective_chat.id,
                                                      text="Оберіть категорію:",
                                                      reply_markup=reply_markup)
        context.chat_data["last_message_id"] = sent_message.message_id

    return select_inner


def build_reply_keyboard_markup(options: List[str]) -> ReplyKeyboardMarkup:
    buttons = [[KeyboardButton(option)] for option in options]
    return ReplyKeyboardMarkup(keyboard=buttons, resize_keyboard=True, one_time_keyboard=False)


def build_keys_for_each_children(achi_data: Dict, achi_node: Dict) -> List[Tuple[str, str]]:
    return [(achi_data[str(key)]["name_ua"], key) for key in achi_node["children"]]


if __name__ == '__main__':
    parsed_data = parse_data_tree()
    application = ApplicationBuilder().token(os.environ['TOKEN']).build()
    application.bot_data["achi_data"] = parsed_data

    start_handler = CommandHandler('start', start)
    application.add_handler(start_handler)

    input_handler = MessageHandler(filters.TEXT & (~filters.COMMAND), text)
    application.add_handler(input_handler)

    caps_handler = CommandHandler('caps', caps)
    application.add_handler(caps_handler)

    select_handler = CommandHandler("select", select_factory(
        parsed_data["children"].keys()))
    application.add_handler(select_handler)

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
* Use sentence case for categories
* handle case when bot is restarted and state is lost
"""
