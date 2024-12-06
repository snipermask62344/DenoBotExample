import { webhookCallback } from "https://deno.land/x/grammy@v1.32.0/mod.ts"
import { bot } from "./lib/bot.ts"

import express from "express"

let app = express() // Создал приложение express
const handler = webhookCallback(bot, "express") // Создаю обработчик событий. (Мог сделать на постоянной основе, но решил не мудрить и делать один запрос = одна обработка)

// Создаю цикл, в котором будет подключение к ссылке, пока не буду уверен, что оно произошло
while (true) {
    try {
        await bot.api.setWebhook("https://snipermask6-denobotexam-39.deno.dev/")
        break
    } catch (err) {
        console.log(err)
    }
}

// использую на всех страницах приложения тип данных json
app.use(express.json())

// использую метод post, т.к телеграмм отправляет только такие
app.post("/", async (req, res) => {
    сonsole.log("п")
    try {
        await handler(req, res) //та самая обработка
    } catch (err) {
        console.log(err)
    }
})

// прослушиваю 443 порт
app.listen(443, () => {
    console.log("Сервер запущен")
})
