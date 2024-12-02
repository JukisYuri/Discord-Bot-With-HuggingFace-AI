require('dotenv').config();
const { Client } = require('discord.js');
const { HfInference } = require('@huggingface/inference');
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

// Kênh ID được cấp quyền cho bot hoạt động
const CHANNELS = [`1177200241905242152`, `1084866665034031106`, `1177195977136939028`];

// ID người sẽ dùng đến bot
const OWNER_ID = '607183227911667746';

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

    try {
        // Kiểm tra nếu nhận lệnh bật bot (giả)
        if (message.content.includes("Hầu gái của tôi đâu")) {
            await message.channel.sendTyping(); // Hiệu ứng typing
            setTimeout(async () => {
                await message.reply("Hân hạnh được phục vụ chủ nhân!");
            }, 2000); // Thời gian typing giả lập
            return;
        }

        // Kiểm tra nội dung tin nhắn yêu cầu bot tắt
        if (message.content.includes("Bây giờ em có thể rút lui")) {
            await message.channel.sendTyping();
            await message.reply("Hẹn gặp lại, chủ nhân!");
            console.log('Bot is shutting down...');
            await client.destroy(); // Tắt bot
            return;
        }

        // Gửi typing trước khi trả lời
        await message.channel.sendTyping();

        // Sử dụng Hugging Face API để tạo phản hồi
        const response = await hf.textGeneration({
            model: 'Qwen/Qwen2.5-Coder-32B-Instruct',
            inputs: message.content,
            parameters: { max_new_tokens: 1000 }
        });

        let generatedText = response.generated_text.trim();
        await message.reply(generatedText);

    } catch (error) {
        console.error(error);
        await message.reply('Xin lỗi, có lỗi xảy ra trong quá trình xử lý.');
    }
});

client.login(process.env.TOKEN);
