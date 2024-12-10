
import { Bot, InlineKeyboard, GrammyError } from "https://deno.land/x/grammy@v1.32.0/mod.ts";

export const bot = new Bot(Deno.env.get("BOT_TOKEN") || "");


const users = new Map<number, { username: string; interests: string; city: string; cityTime: number }>();


const keyboard = new InlineKeyboard()
    .text("Обо мне", "/about");


const evaluationKeyboard = new InlineKeyboard()
    .text("Хорошо", "evaluate_yes")
    .text("Плохо", "evaluate_no");

bot.command("start", async (ctx) => {
    try {
        await ctx.reply("Добро пожаловать. Запущен и работает!", { reply_markup: keyboard });
        await ctx.reply("Пожалуйста, напишите свои интересы.");
    } catch (error) {
        handleError(error);
    }
});


bot.command("check_meeting", async (ctx) => {
    await ctx.reply("Как вы оцениваете встречу?", { reply_markup: evaluationKeyboard });
});
bot.command("help", async (ctx) => {
    await ctx.reply("Если у вас есть вопросы или нужна поддержка, вы можете обратиться в техподдержку по следующей ссылке: https://t.me/+iJvpq7lFfQ5jZTEy");
});










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

         
            compareWithOtherUsers(ctx, userId, userData);
        } 
    } catch (error) {
        handleError(error);
    }
});


async function compareWithOtherUsers(ctx, userId, userData) {
    const lowerCaseInterests = userData.interests.toLowerCase();
    const lowerCaseCity = userData.city.toLowerCase();

    const matches = Array.from(users.entries())
        .filter(([id, data]) => 
            id !== userId &&
            data.city.toLowerCase() === lowerCaseCity &&
            data.interests.toLowerCase() === lowerCaseInterests
        );
    
    if (matches.length > 0) {
        const matchedUsernames = matches.map(([id, data]) => data.username).filter(Boolean).join(', ');
        await ctx.reply("У вас есть совпадения с: " + matchedUsernames + ". Хотите встретиться?");

       
        for (const [id] of matches) {
            const matchedUsername = users.get(id)?.username || "неизвестный пользователь";
            await bot.api.sendMessage(
                id, "С вами совпадает пользователь: " + userData.username + ". Хотите встретиться? Выберите место и время встречи в личных сообщениях."
            );
        }
    } else {
        await ctx.reply("Совпадений не найдено.");
    }
}


bot.callbackQuery("/about", async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply("Я бот? Я бот... Я Бот!");
});


bot.callbackQuery(/evaluate_/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const userFeedback = ctx.callbackQuery.data === "evaluate_yes" ? "Хорошо" : "Плохо";
    
    await ctx.reply("Вы оценили встречу как: " + userFeedback + ". Спасибо за ваш отзыв!");
});


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

























