
import { Bot, InlineKeyboard, GrammyError } from "https://deno.land/x/grammy@v1.32.0/mod.ts";
import { ensureFile, readFileStr, writeFileStr } from "https://deno.land/std/fs/mod.ts";

export const bot = new Bot(Deno.env.get("BOT_TOKEN") || "");

// Хранилище пользователей
const usersFilePath = "./users.json";
const users = new Map<number, { username: string; interests: string; city: string; cityTime: number }>();

// Загрузка данных пользователей из JSON файла
async function loadUsers() {
    await ensureFile(usersFilePath);
    try {
        const data = await readFileStr(usersFilePath);
        const json = JSON.parse(data);
        for (const userId in json) {
            users.set(Number(userId), json[userId]);
        }
    } catch (error) {
        console.error("Ошибка при загрузке пользователей:", error);
    }
}

// Сохранение данных пользователей в JSON файл
async function saveUsers() {
    const data = Object.fromEntries(users);
    await writeFileStr(usersFilePath, JSON.stringify(data, null, 2));
}

// Клавиатура для команды /about
const keyboard = new InlineKeyboard()
    .text("Обо мне", "/about");

// Кнопки для оценки встречи
const evaluationKeyboard = new InlineKeyboard()
    .text("Хорошо", "evaluate_yes")
    .text("Плохо", "evaluate_no");

// Обработайте команду /start.
bot.command("start", async (ctx) => {
    try {
        await ctx.reply("Добро пожаловать. Запущен и работает!", { reply_markup: keyboard });
        await ctx.reply("Пожалуйста, напишите свои интересы и город.");
    } catch (error) {
        handleError(error);
    }
});

// Обработайте команды для оценки встречи
bot.command("check_meeting", async (ctx) => {
    await ctx.reply("Как вы оцениваете встречу?", { reply_markup: evaluationKeyboard });
});

// Обработайте сообщения с интересами и городом.
bot.on("message", async (ctx) => {
    const userId = ctx.from.id;
    const username = ctx.from.username ? "@" + ctx.from.username : "неизвестный пользователь"; // Имя пользователя

    // Сохраняем интересы и город пользователя
    let userData = users.get(userId);
    if (!userData) {
        userData = { username, interests: '', city: '', cityTime: 0 };
        users.set(userId, userData);
    }

    try {
        // Если интересы еще не были введены
        if (!userData.interests) {
            userData.interests = ctx.message.text;
            await ctx.reply("Вы написали интере
сы: " + userData.interests + " Теперь напишите свой город.");
        } else if (!userData.city) {
            userData.city = ctx.message.text;
            userData.cityTime = Date.now(); // Запоминаем время
            await ctx.reply("Вы из города: " + userData.city);

            // Сравниваем с другими пользователями
            await compareWithOtherUsers(ctx, userId, userData);
            await saveUsers(); // сохраняем данные после обновления
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
                id, "С вами совпадает пользователь: " + userData.username + " Хотите встретиться? Выберите место и время встречи в личных сообщениях."
            );
        }
    } else {
        await ctx.reply("Совпадений не найдено. Ваш ник: " + userData.username);
    }
}

// Обработайте команду /about
bot.callbackQuery("/about", async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply("Я бот? Я бот... Я Бот!");
});

// Обработчик оценки встречи
bot.callbackQuery(/evaluate_/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const userFeedback = ctx.callbackQuery.data === "evaluate_yes" ? "Хорошо" : "Плохо";
    
    await ctx.reply("Вы оценили встречу как: " + userFeedback + ". Спасибо за ваш отзыв!");
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

// Загрузка данных пользователей при старте бота
await loadUsers();
















