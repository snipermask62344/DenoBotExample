
import { Bot, InlineKeyboard } from "https://deno.land/x/grammy@v1.32.0/mod.ts";
import { ensureFile } from "https://deno.land/std/fs/mod.ts";

export const bot = new Bot(Deno.env.get("BOT_TOKEN") || "");

// Хранилище пользователей
const usersFilePath = "./users.json";
const users = new Map<number, { username: string; interests: string; city: string; cityTime: number }>();

// Загрузка данных пользователей из JSON файла
async function loadUsers() {
    await ensureFile(usersFilePath);
    try {
        const data = await Deno.readTextFile(usersFilePath);
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
    await Deno.writeTextFile(usersFilePath, JSON.stringify(data, null, 2));
}

// Клавиатура для команды /about
const keyboard = new InlineKeyboard().text("Обо мне", "/about");

// Кнопки для оценки встречи
const evaluationKeyboard = new InlineKeyboard()
    .text("Хорошо", "evaluate_yes")
    .text("Плохо", "evaluate_no");

// Обработайте команду /start
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

// Обработайте сообщения с интересами и городом
bot.on("message", async (ctx) => {
    const userId = ctx.from.id;
    const username = ctx.from.username ? "@" + ctx.from.username : "неизвестный пользователь"; // Имя пользователя

    let userData = users.get(userId);
    if (!userData) {
        userData = { username, interests: '', city: '', cityTime: 0 };
        users.set(userId, userData);
    }

    try {
        if (!userData.interests) {
            userData.interests = ctx.message.text;
            await ctx.reply("Вы написали интересы: " + userData.interests + ". Теперь напишите свой город.");
        } else if (!userData.city) {
            userData.city = ctx.message.text;
            userData.cityTime = Date.now(); // Запоминаем время
            await ctx.reply("Вы из города: " + userData.city);

            // Сравниваем с другими пользователями
            await compareWithOtherUsers(ctx, userId, userData);
            await saveUsers(); // сохраняем данные после обновления
        } 
    } catch (error) {
















