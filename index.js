import dotenv from "dotenv";
import { Telegraf, Markup } from 'telegraf'
import axios from 'axios';
import NodeCache from "node-cache";

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

const removeCharacters = (str) => {
    return new String(str)
        .replace(/\_/g, "")
        .replace(/\*/g, "")
        .replace(/\[]/g, "")
        .replace(/\]/g, "")
        .replace(/\(/g, "")
        .replace(/\)/g, "")
        .replace(/\~/g, "")
        .replace(/\`/g, "")
        .replace(/\>/g, "")
        .replace(/\#/g, "")
        .replace(/\+/g, "")
        .replace(/\-/g, "")
        .replace(/\=/g, "")
        .replace(/\|/g, "")
        .replace(/\{/g, "")
        .replace(/\}/g, "")
        .replace(/\./g, "")
        .replace(/\!/g, "");
}

const performSearch = async (query) => {
    return axios.get(`https://communitypowerea.userecho.com/api/v2/forums/7/topics/search.json?query=${query}&access_token=${process.env.USERECHO_TOKEN}`);
}

const bot = new Telegraf(process.env.BOT_TOKEN);

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
    if (text === `/help@${process.env.BOT_USERNAME}` || text === "/help")
    {
        let message = `Here are some points to get you started:\n`
        message += `\\- [${escapeCharacters('Users guide')}]\(${escapeCharacters("https://docs.google.com/document/d/1ww1M97H54IBwtCKZDhxtqsTsrtEMKofXHMEWMGCyZNs")}\)\n`;
        message += `\\- [${escapeCharacters('Community forum')}]\(${escapeCharacters("https://communitypowerea.userecho.com/")}\)\n`;

        message += `\\nIf you have specific question, use '/help' command with your keywords\\. For example: \`\/help broker\``;

        await ctx.reply(message, {
            parse_mode: 'MarkdownV2',
            disable_web_page_preview: true
        });
        return;
    }

    const query = text.replace(`\/help@${process.env.BOT_USERNAME} `, "").replace("\/help ", "");

    const response = await performSearch(removeCharacters(query));

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
    else {
      await ctx.reply(`Failed to perform search '${query}'!`);
    }
}

bot.command('help', help);

bot.command('version', async (ctx) => {
    await ctx.reply("1.03.beta4 (2023.03.02)");
});

// bot.on('text', async (ctx) => {
//     const { update: { message: { text, from: { id } } } } = ctx;
//
//     const state = cache.take(id);
//     if (state && state === "PENDING_QUESTION")
//     {
//         const query = text.replace(`\/help@${process.env.BOT_USERNAME} `, "").replace("\/help ", "");
//
//         const response = await performSearch(query);
//
//         if (response.data.status === 'success') {
//             const results = response.data.data;
//
//             if (results.length === 0) {
//                 await ctx.reply(`No topics related to '${query}' found. Try to rephrase!`);
//                 return;
//             }
//
//             let message = `Help topics related to '${query}':\n`
//             for (let i = 0; i < Math.min(results.length, 3); i++) {
//                 const _result = results[i];
//                 message += `\\- [${escapeCharacters(_result.header)}]\(${escapeCharacters(_result.url)}\)\n`;
//             }
//
//             if (results.length > 3) {
//                 message += `\\- [Show more results]\(https://communitypowerea.userecho.com/search?forum_id=7&search=${escapeCharacters(query)}\)`;
//             }
//
//             await ctx.reply(message, {
//                 parse_mode: 'MarkdownV2',
//                 disable_web_page_preview: true
//             });
//         }
//     }
// });

bot.launch()

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
