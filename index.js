import dotenv from "dotenv";
import { Telegraf } from 'telegraf'
import axios from 'axios';

dotenv.config();

const escapeCharacters = (str) => {
    return new String(str)
        .replace(/\_/g, "\\_")
        .replace(/\*/g, "\\*")
        .replace(/\[]/g, "\\[")
        .replace(/\]/g, "\\]")
        .replace(/\(/g, "\\(")
        .replace(/\)/g, "\\)")
        .replace(/\~/g, "\\~")
        .replace(/\`/g, "\\`")
        .replace(/\>/g, "\\>")
        .replace(/\#/g, "\\#")
        .replace(/\+/g, "\\+")
        .replace(/\-/g, "\\-")
        .replace(/\=/g, "\\=")
        .replace(/\|/g, "\\|")
        .replace(/\{/g, "\\{")
        .replace(/\}/g, "\\}")
        .replace(/\./g, "\\.")
        .replace(/\!/g, "\\!");
}

const performSearch = async (query) => {
    return axios.get(`https://communitypowerea.userecho.com/api/v2/forums/7/topics/search.json?query=${query}&access_token=${process.env.USERECHO_TOKEN}`);
}

const bot = new Telegraf(process.env.BOT_TOKEN);

await bot.telegram.setMyCommands([{
    command: "start",
    description: "Welcome to CommunityPower Help Bot"
},
{
    command: "help",
    description: "<your question here> (after space)"
},
{
    command: "guide",
    description: "Official CommunityPower EA documentation"
},
{
    command: "forum",
    description: "Community set-files and ideas (UserEcho forum)"
}]);

bot.command('start', async (ctx) => {
    await ctx.reply("This bot will search help topics on the community forum.\n\nUse '/help <your question>' command to ask any questions you have!");
});

bot.command('guide', async (ctx) => {
    await ctx.reply("https://docs.google.com/document/d/1ww1M97H54IBwtCKZDhxtqsTsrtEMKofXHMEWMGCyZNs");
});

bot.command('forum', async (ctx) => {
    await ctx.reply("https://communitypowerea.userecho.com/");
});

const help = async (ctx) => {
    const { update: { message: { text } } } = ctx;

    if (text === `/help@${process.env.BOT_NAME}` || text === "/help") {
        await ctx.reply("Please, specify your question: /help <your question>");
        return;
    }

    const query = text.replace(`\/help@${process.env.BOT_NAME} `, "").replace("\/help ", "");

    const response = await performSearch(query);

    if (response.data.status === 'success') {
        const results = response.data.data;

        if (results.length === 0) {
            await ctx.reply(`No topics related to '${query}' found. Try to rephrase!`);
            return;
        }

        await ctx.reply(`Help topics related to the '${query}':`);
        for (let i = 0; i < Math.min(results.length, 3); i++) {
            const _result = results[i];
            await ctx.reply(`[${escapeCharacters(_result.header)}]\(${escapeCharacters(_result.url)}\)`, {
                parse_mode: 'MarkdownV2',
                disable_web_page_preview: true
            });
        }

        if (results.length > 3) {
            await ctx.reply(`[show more\\.\\.\\.]\(https://communitypowerea.userecho.com/search?forum_id=7&search=${escapeCharacters(query)}\)`, {
                parse_mode: 'MarkdownV2',
                disable_web_page_preview: true
            });
        }
    }
}

bot.command('help', help);

bot.launch()

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))