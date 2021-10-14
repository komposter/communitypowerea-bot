import dotenv from "dotenv";
import { Telegraf, Markup } from 'telegraf'
import axios from 'axios';
import NodeCache from "node-cache";
import schedule from 'node-schedule';

const message = `🌈 How to support the project:
- use the EA. Test it, use it live!
- suggest and discuss improvements, vote for those you like,
- share your settings and ideas,
- leave your feedback on mql5 market — https://www.mql5.com/en/market/product/48493#!tab=reviews
- became a patron on https://www.patreon.com/CommunityPower
- open trading account using my IB-link (find it in the google doc)`;

(async () => {

    const cache = new NodeCache({ stdTTL: 300, checkperiod: 320 });

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

    const job = schedule.scheduleJob('* * */8 * *', function () {
        bot.telegram.sendMessage("@CommunityPowerEA", message);
    });

    await bot.telegram.setMyCommands([
        // {
        //     command: "start",
        //     description: "Welcome to CommunityPower Help Bot"
        // },
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
        },
        {
            command: "version",
            description: "Bot version."
        }
    ]);

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
        const { update: { message: { text, from: { id, username } } } } = ctx;
        if (text === `/help@${process.env.BOT_USERNAME}` || text === "/help") {
            if (cache.set(id, "PENDING_QUESTION") && username) {
                await ctx.reply(`Hello ${username}! Please, specify your question.`, Markup.forceReply(true).selective(true));
            } else {
                await ctx.reply("Please, specify your question: /help <your question>");
            }

            return;
        }

        const query = text.replace(`\/help@${process.env.BOT_USERNAME} `, "").replace("\/help ", "").escapeCharacters();

        const response = await performSearch(query);

        if (response.data.status === 'success') {
            const results = response.data.data;

            if (results.length === 0) {
                await ctx.reply(`No topics related to '${query}' found. Try to rephrase!`);
                return;
            }

            let message = `Help topics related to '${query}':\n`
            for (let i = 0; i < Math.min(results.length, 3); i++) {
                const _result = results[i];
                message += `\\- [${escapeCharacters(_result.header)}]\(${escapeCharacters(_result.url)}\)\n`;
            }

            if (results.length > 3) {
                message += `\\- [Show more results]\(https://communitypowerea.userecho.com/search?forum_id=7&search=${escapeCharacters(query)}\)`;
            }

            await ctx.reply(message, {
                parse_mode: 'MarkdownV2',
                disable_web_page_preview: true
            });
        }
    }

    bot.command('help', help);

    bot.command('version', async (ctx) => {
        await ctx.reply("1.0 by JuniarZ");
    });

    bot.on('text', async (ctx) => {
        const { update: { message: { text, from: { id } } } } = ctx;

        const state = cache.take(id);
        if (state && state === "PENDING_QUESTION") {

            const query = text.replace(`\/help@${process.env.BOT_USERNAME} `, "").replace("\/help ", "");

            const response = await performSearch(query);

            if (response.data.status === 'success') {
                const results = response.data.data;

                if (results.length === 0) {
                    await ctx.reply(`No topics related to '${query}' found. Try to rephrase!`);
                    return;
                }

                let message = `Help topics related to '${query}':\n`
                for (let i = 0; i < Math.min(results.length, 3); i++) {
                    const _result = results[i];
                    message += `\\- [${escapeCharacters(_result.header)}]\(${escapeCharacters(_result.url)}\)\n`;
                }

                if (results.length > 3) {
                    message += `\\- [Show more results]\(https://communitypowerea.userecho.com/search?forum_id=7&search=${escapeCharacters(query)}\)`;
                }

                await ctx.reply(message, {
                    parse_mode: 'MarkdownV2',
                    disable_web_page_preview: true
                });
            }
        }
    });

    await bot.launch()

    console.log("Bot running.");

    process.once('SIGINT', () => bot.stop('SIGINT'))
    process.once('SIGTERM', () => bot.stop('SIGTERM'))

})();