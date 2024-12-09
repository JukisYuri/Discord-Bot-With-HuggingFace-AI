require('dotenv').config();
const { Client } = require('discord.js');
const { HfInference } = require('@huggingface/inference');
const { splitMessage } = require('./utils');
const { CHANNELS, OWNER_ID , sourceChannelId, destinationChannelId} = require('./permisson');
const { removeRepeatedQuestion } = require(`./removeRepeated`);

if (process.env.HUGGINGFACE_TOKEN !== undefined) {
    console.log("HuggingFace API is ready, Using model: 'Qwen/Qwen2.5-Coder-32B-Instruct', Bot Author: Jukis Yuri");
}

const client = new Client({
    intents: ['Guilds', 'GuildMembers', 'GuildMessages', 'MessageContent'],
});

const hf = new HfInference(process.env.HUGGINGFACE_TOKEN);
const unauthorizedReplies = new Map();

client.on('ready', () => {
    console.log('The bot is ready!');
});

const IGNORE_PREFIX = "!";
const TIMEOUT = 60 * 60 * 1000; // 1 giờ (60 phút x 60 giây x 1000 ms)

// Chức năng để lấy và gửi tin nhắn từ một kênh đến một kênh khác
const transferMessages = async (sourceChannelId, destinationChannelId) => {
    try {
        const sourceChannel = await client.channels.fetch(sourceChannelId);
        const destinationChannel = await client.channels.fetch(destinationChannelId);

        // Lấy các tin nhắn từ kênh nguồn (tối đa 100 tin nhắn)
        const fetchedMessages = await sourceChannel.messages.fetch({ limit: 100 });

        // Kết hợp nội dung tin nhắn vào một chuỗi duy nhất
        let combinedMessage = '';
        fetchedMessages.forEach(msg => {
            combinedMessage += `[${msg.createdAt.toLocaleString()}] ${msg.author.username}: ${msg.content}\n`;
        });

        // Chia tin nhắn thành các phần nhỏ hơn nếu nội dung quá dài
        const messageChunks = splitMessage(combinedMessage);

        // Gửi từng phần vào kênh đích
        for (const chunk of messageChunks) { 
            await destinationChannel.send(chunk);
        }
        
        console.log('Messages transferred successfully!');
    } catch (error) {
        console.error('Có lỗi khi chuyển tin nhắn:', error);
    }
}

let trackedUser = null;
// Xử lý tin nhắn
client.on('messageCreate', async (message) => {
    if (message.author.bot) return; // Bỏ qua tin nhắn từ bot
    if (!message.content || message.content.startsWith(IGNORE_PREFIX)) return; // Bỏ qua lệnh hoặc tin nhắn không hợp lệ

    // Lệnh theo dõi người dùng
    if (message.content.startsWith("Hầu gái nhận lệnh, hãy theo dõi")) {
        const mention = message.mentions.users.first();
        await message.channel.sendTyping();
        if (mention) {
            trackedUser = mention.id;
            await message.reply(`Em sẽ bắt đầu theo dõi <@${trackedUser}>.`);
        } else {
            await message.reply('Chủ nhân cần tag đúng người để theo dõi.');
        }
        return;
    }
        
    // Lệnh dừng theo dõi người dùng
    if (message.content.startsWith("Hầu gái nhận lệnh, hãy dừng theo dõi")) {
        const mention = message.mentions.users.first();
        await message.channel.sendTyping();
        if (mention) {
            if (trackedUser === mention.id) {
                trackedUser = null;  // Xóa người dùng khỏi danh sách theo dõi
                await message.reply(`Em đã bỏ theo dõi <@${mention.id}>.`);
            } else {
                await message.reply('Người này không có trong danh sách theo dõi.');
            }
        } else {
            await message.reply('Chủ nhân cần tag đúng người để dừng theo dõi.');
        }
        return;
    }

    // Lệnh lấy dữ liệu người dùng
    if (message.content.includes("Hãy lấy dữ liệu của người đó và gửi sang cho tôi")) {
        await message.channel.sendTyping();
        if (!trackedUser) {
            await message.reply('Hiện tại em không theo dõi ai cả. Chủ nhân hãy dùng lệnh "hãy theo dõi @người_dùng" trước.');
        } else {
            await message.reply(`Vâng, đã thực hiện lệnh theo chủ nhân yêu cầu`)
        }

        const sourceChannel = message.channel; // Kênh hiện tại
        const destinationChannel = await client.channels.fetch(destinationChannelId); // Kênh đích

        // Lấy các tin nhắn của người dùng được theo dõi
        const fetchedMessages = await sourceChannel.messages.fetch({ limit: 100 });
        const userMessages = fetchedMessages.filter(msg => msg.author.id === trackedUser);

        if (userMessages.size === 0) {
            await message.channel.sendTyping();
            await message.reply('Không tìm thấy tin nhắn nào từ người dùng được theo dõi.');
            return;
        }

        // Kết hợp nội dung tin nhắn
        let combinedMessage = '';
        userMessages.forEach(msg => {
            combinedMessage += `[${msg.createdAt.toLocaleString()}] ${msg.author.username}: ${msg.content}\n`;
        });

        // Chia nhỏ tin nhắn và gửi sang kênh đích
        const messageChunks = splitMessage(combinedMessage);
        for (const chunk of messageChunks) {
            await destinationChannel.send(chunk);
        }

        await message.reply(`Em đã gửi dữ liệu của <@${trackedUser}> sang kênh đích.`);
        return;
    }

    // Kiểm tra xem tin nhắn có phải là một reply đến bot
    if (message.reference) {
        const referencedMessage = await message.channel.messages.fetch(message.reference.messageId);
        if (referencedMessage.author.id === client.user.id && message.author.id !== OWNER_ID) {
            const userId = message.author.id;
            const replyCount = unauthorizedReplies.get(userId) || 0;

            const replies = [
                `Bạn không được duyệt quyền để nói chuyện với tôi, hãy liên hệ chủ nhân Jukis Yuri`,
                `Bạn vẫn còn cố tình à?`,
                `Đừng làm phiền tôi nữa! Trông bạn giống như một kẻ biến thái cố tình quấy rối tôi`,
                `<@${OWNER_ID}>! Chủ nhân ơi, người này đang cố gắng làm phiền em: <@${userId}>`,
                `Trông bạn thật kiên trì làm sao khi cố gắng làm phiền tôi? rác rưởi...`,
                `Hm... có vẻ tôi đã đánh giá thấp cái sự cứng đầu của bạn, đồ rác rưởi <@${userId}>`,
                `Wow, để tôi đếm xem sự rác rưởi của bạn ping tôi bao nhiêu lần nào? tận 7 lần cơ á? chắc là bạn nghĩ đó là con số may mắn đó nhỉ?`,
                `Thôi tôi mệt mỏi lắm rồi, cút lẹ lẹ cái, tôi đéo có hứng reply lại bạn, Tạm biệt! <@${userId}>`,
                `Ngài <@${OWNER_ID}> kick <@${userId}> ra ngoài được không ạ!, hắn làm phiền chúng ta nãy giờ kìa!!!`,
                `Phắn đây, coi như nãy giờ chưa có chuyện gì xảy ra, cái đứa này quá cứng đầu, hết cứu nổi`
            ];

            const replyMessage = replies[replyCount] || null;
            if (replyMessage) {
                await message.channel.sendTyping();
                await message.reply(replyMessage);
                unauthorizedReplies.set(userId, replyCount + 1);

                // Xóa phần tử trong map sau 1 giờ
                setTimeout(() => {
                    unauthorizedReplies.delete(userId);
                }, TIMEOUT);
            }
            if (replyCount > 9) {
                return;
            }
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

        // Lệnh chuyển tin nhắn từ một kênh sang kênh khác
        if (message.content.includes("Chuyển hết tin nhắn từ kênh này sang kênh của tôi")) {
            await message.channel.sendTyping();
            await message.reply("Vâng, đã nghe lệnh!!")
            await transferMessages(sourceChannelId, destinationChannelId);
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
                parameters: { max_new_tokens: 1024 }
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
