require('dotenv').config();
const { Client } = require('discord.js');
const { HfInference } = require('@huggingface/inference');
const { splitMessage } = require('./utils');
const { CHANNELS, OWNER_ID } = require('./permisson');
const { removeRepeatedQuestion } = require(`./removeRepeated`);

if(process.env.HUGGINGFACE_TOKEN !== undefined) {
    console.log("HuggingFace API is ready, Using model: 'Qwen/Qwen2.5-Coder-32B-Instruct', Bot Author: Jukis Yuri");
}

const client = new Client({
    intents: ['Guilds', 'GuildMembers', 'GuildMessages', 'MessageContent'],
});

const hf = new HfInference(process.env.HUGGINGFACE_TOKEN);

client.on('ready', () => {
    console.log('The bot is ready!');
});

const IGNORE_PREFIX = "!";

// Xử lý tin nhắn
client.on('messageCreate', async (message) => {
    if (message.author.bot) return; // Bỏ qua tin nhắn từ bot
    if (!message.content || message.content.startsWith(IGNORE_PREFIX)) return; // Bỏ qua lệnh hoặc tin nhắn không hợp lệ

    // Kiểm tra xem tin nhắn có phải là một reply đến bot
    if (message.reference) {
        const referencedMessage = await message.channel.messages.fetch(message.reference.messageId);
        if (referencedMessage.author.id === client.user.id && message.author.id !== OWNER_ID) {
            await message.reply("Bạn không được duyệt quyền để nói chuyện với tôi, hãy liên hệ chủ nhân Jukis Yuri");
            return;
        }
    }

    // Chỉ phản hồi tin nhắn từ chủ nhân
    if (message.author.id !== OWNER_ID) return;
    if (!CHANNELS.includes(message.channelId) && !message.mentions.users.has(client.user.id)) return;

    let botActive = false;
    try {
        // Kiểm tra nếu nhận lệnh bật bot (giả)
        if (message.content.includes("Hầu gái đâu")) {
            botActive = true; // Bật bot
            await message.channel.sendTyping(); // Hiệu ứng typing
            setTimeout(async () => {
                await message.reply("Chủ nhân cho gọi em!");
            }, 2000); // Thời gian typing giả lập
            return;
        }

        // Kiểm tra nội dung tin nhắn yêu cầu bot tắt
        if (message.content.includes("Bây giờ cô có thể rút lui")) {
            await message.channel.sendTyping();
            await message.reply("Hẹn gặp lại, chủ nhân!");
            console.log('Bot is shutting down...');
            await client.destroy(); // Tắt bot
            return;
        }

        if (message.content.includes("Hãy nói đầy đủ chi tiết thông tin về chủ nhân Jukis Yuri")) {
            await message.channel.sendTyping();
            setTimeout(async () => {
                await message.reply(
                    "**Đây là toàn bộ thông tin về ngài ạ:**\n" +
                    "- **Carrd**: [jukisyuri.carrd.co](https://jukisyuri.carrd.co/)\n" +
                    "- **Github**: [JukisYuri](https://github.com/JukisYuri)\n" +
                    "- **Facebook**: [yourlifehehe](https://www.facebook.com/yourlifehehe/)\n" +
                    "> Là một sinh viên công nghệ thông tin, chuyên ngành Software Engineer, năm 2 tại trường Đại Học Nông Lâm TP.HCM và được sư phụ **Regiko** dẫn dắt.");
            }, 2000);
            return;
        }

        // Gửi typing trước khi trả lời
        await message.channel.sendTyping();
        try {
            // Sử dụng Hugging Face API để tạo phản hồi
            const response = await hf.textGeneration({
                model: 'Qwen/Qwen2.5-Coder-32B-Instruct',
                inputs: message.content,
                parameters: {max_new_tokens: 600}
            });

            let generatedText = response.generated_text.trim();

            // Xóa câu hỏi lặp lại
            generatedText = removeRepeatedQuestion(message.content, generatedText);

            // Thay thế từ "bạn" bằng "chủ nhân"
            generatedText = generatedText.replace(/\b(bạn)\b/gi, 'chủ nhân');

            // Chia tin nhắn thành các phần nhỏ hơn 2000 ký tự
            const messageChunks = splitMessage(generatedText);

            // Gửi từng phần
            for (const chunk of messageChunks) {
                await message.reply(chunk);
            }

        } catch (error) {
            console.error(error);
            await message.reply('Xin lỗi chủ nhân, có quá nhiều kiến thức mới để em có thể xử lý tốt chúng, mong ngài thông cảm và bỏ qua');
        }
    } catch (error) {
        console.error(error);
        await message.reply('Xin lỗi, em không tìm thấy tin nhắn tham chiếu. Chủ nhân có thể thử lại không?');
    }
});

client.login(process.env.TOKEN);
