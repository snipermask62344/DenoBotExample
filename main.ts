import { webhookCallback } from "https://deno.land/x/grammy@v1.32.0/mod.ts";
import express, { Request, Response } from 'npm:express';
import { bot } from "./lib/bot.ts";

const app = express();

const handleUpdate = webhookCallback(bot, 'express');

app.use(express.json());
await bot.api.setWebhook("https://snipermask6-denobotexam-39-sb6twkvwmpc5.deno.dev/")


app.post("/", async (req: Request, res: Response) => {
    console.log('g')
    if (req.method === "POST") {
        try {
            await handleUpdate(req, res); // Передаем запрос и ответ в обработчик обновлений
        } catch (err) {
            console.error(err);
            res.sendStatus(500); // Ответ с ошибкой
        }
    } else {
        res.sendStatus(404); // Если путь не соответствует токену бота или метод не POST
    }
});

// Слушаем на порту 5000
const PORT = 443;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
