import dotenv from "dotenv";
import { Telegraf } from 'telegraf'
import axios from 'axios';
import excerptHtml from 'excerpt-html';

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

bot.telegram.setMyCommands([{
    command: "/start",
    description: "Welcome to the CommunityPower EA Bot!"
},
{
    command: "/help",
    description: "Usage '/help <your question here>'."
},
{
    command: "/guide",
    description: "Quick link to the official CommunityPower EA Document."
}]);

bot.command('start', async (ctx) => {
    await ctx.reply("Please use '/help <your question here>'. Searches the help topics in forum.");
});

bot.command('guide', async (ctx) => {
    await ctx.reply("https://docs.google.com/document/d/1ww1M97H54IBwtCKZDhxtqsTsrtEMKofXHMEWMGCyZNs");
});

bot.command('help', async (ctx) => {
    const { update: { message: { text } } } = ctx;

    if (text === "/help@CommunityPowerEABot" || text === "/help") {
        ctx.reply("Please use '/help <your question here>'. Searches the help topics in forum.");
        return;
    }

    const query = text.replace("\/help@CommunityPowerEABot ", "").replace("\/help ", "");

    await ctx.reply(`Searching forum for '${query}'...`);

    const response = await performSearch(query);

    if (response.data.status === 'success') {
        const results = response.data.data;

        await ctx.reply(`Found ${results.length} results...`);
        for (const _result of results) {
            await ctx.reply(`[${escapeCharacters(_result.header)}]\(${escapeCharacters(_result.url)}\)`, {
                parse_mode: 'MarkdownV2',
                disable_web_page_preview: true
            });
        }
    }
});

bot.on('inline_query', async (ctx) => {

    const result = [];

    const { update: { inline_query: { query } } } = ctx;

    const response = await performSearch(query);

    if (response.data.status === 'success') {
        const results = response.data.data;

        for (const _result of results) {
            const excerpt = excerptHtml(_result.description, {
                stripTags: true, // Set to false to get html code
                pruneLength: 140, // Amount of characters that the excerpt should contain
                pruneString: '…', // Character that will be added to the pruned string
                pruneSeparator: ' ', // Separator to be used to separate words
            })

            result.push({
                type: "article",
                id: _result.id,
                title: _result.header,
                input_message_content: {
                    message_text: `[${escapeCharacters(_result.header)}]\(${escapeCharacters(_result.url)}\)`,
                    parse_mode: 'MarkdownV2',
                    disable_web_page_preview: true
                },
                url: _result.url,
                hide_url: true,
                description: excerpt
            });
        }
    }

    await ctx.answerInlineQuery(result)
})

bot.launch()

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))