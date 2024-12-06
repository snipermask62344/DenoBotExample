import { Bot, InlineKeyboard, GrammyError } from "https://deno.land/x/grammy@v1.32.0/mod.ts";

export const bot = new Bot(Deno.env.get("BOT_TOKEN") || "");

// Хранилище пользователей и их интересов
const users = new Map<number, { username: string; interests: string; city: string; interestsTime: number; cityTime: number }>();

// Клавиатура для команды /about
const keyboard = new InlineKeyboard()
    .text("Обо мне", "/about");

// Обработайте команду /start.
bot.command("start", async (ctx) => {
    try {
        await ctx.reply("Добро пожаловать. Запущен и работает!", { reply_markup: keyboard });
        await ctx.reply("Пожалуйста, напишите свои интересы и город.");
    } catch (error) {
        handleError(error);
    }
});

// Обработайте сообщения с интересами и городом.
bot.on("message", async (ctx) => {
    const userId = ctx.from.id;
    const username = ctx.from.username ? "@" + ctx.from.username : "неизвестный пользователь"; // Имя пользователя

    // Сохраняем интересы и город пользователя
    let userData = users.get(userId);
    if (!userData) {
        userData = { username, interests: '', city: '', interestsTime: 0, cityTime: 0 };
        users.set(userId, userData);
    }

    try {
        // Если интересы еще не были введены
        if (!userData.interests) {
            userData.interests = ctx.message.text;
            userData.interestsTime = Date.now(); // Запоминаем время
            await ctx.reply("Вы написали интересы: " + userData.interests + ". Теперь напишите свой город.");
        } else if (!userData.city) {
            userData.city = ctx.message.text;
            userData.cityTime = Date.now(); // Запоминаем время
            await ctx.reply("Вы из города: " + userData.city);

            // Сравниваем с другими пользователями
            compareWithOtherUsers(ctx, userId, userData);
        } else {
            // Пользователь уже ввел как интересы, так и город
            await ctx.reply("Вы уже ввели свои интересы и город. Хотите обновить их? (да/нет)");
        }
    } catch (error) {
        handleError(error);
    }
});

// Функция для сравнения с другими пользователями
async function compareWithOtherUsers(ctx, userId, userData) {
    const matches = Array.from(users.entries())
        .filter(([id, data]) => id !== userId && data.city === userData.city && data.interests === userData.interests);

    if (matches.length > 0) {
        const matchedUsernames = matches.map(([id, data]) => data.username).filter(Boolean).join(', ');
        await ctx.reply("У вас есть совпадения с: " + matchedUsernames + ". Хотите встретиться?");

        // Уведомляем совпавших пользователей
        for (const [id] of matches) {
            const matchedUsername = users.get(id)?.username || "неизвестный пользователь";
            await bot.api.sendMessage(
                id,
                `С вами совпадает пользователь: ${userData.username}. Хотите встретиться? Выберите место и время встречи в личных сообщениях.`
            );
        }
    } else {
        await ctx.reply("Совпадений не найдено.");
    }
}

// Обработайте команду /about
bot.callbackQuery("/about", async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply("Я бот? Я бот... Я Бот!");
});

// Функция для обработки ошибок
function handleError(error: any) {
    if (error instanceof GrammyError) {
        if (error.error_code === 403) {
            console.log("Ошибка: Бот был заблокирован пользователем.");
        } else {
            console.error("Ошибка Grammy:", error);
        }
    } else {
        console.error("Ошибка:", error);
    }
}










