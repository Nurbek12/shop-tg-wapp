import { prisma } from './config/prisma'
import { BOT_TOKEN, WEB_APP_URL } from './config/keys'
import { setStatistics } from './controllers/statistic.controller'
import { Bot, GrammyError, HttpError, InlineKeyboard, Keyboard } from 'grammy'

const bot = new Bot(BOT_TOKEN!)
const register_users = new Map<number, { phone?: string, address?: string, latitude?: number, longitude?: number  }>()

bot.command(['start','magazine'], async c => {
    await c.reply('Добро пожаловать в бот', {
        reply_markup: new InlineKeyboard().text('Использовать приложению', 'use_bot')
    })
})

bot.command('delivery', async c => {
    await c.reply('Приложения для курьера', {
        reply_markup: new InlineKeyboard().webApp('Использовать приложению', WEB_APP_URL+'/delivery')
    })
})

bot.command('admin', async c => {
    await c.reply('Приложения для админа', {
        reply_markup: new InlineKeyboard().webApp('Использовать приложению', WEB_APP_URL+'/admin')
    })
})

bot.callbackQuery('use_bot', async c => {
    await c.answerCallbackQuery()

    const user = await prisma.user.findFirst({ where: { user_tg_id: '' + c.chat?.id } })
    if(user === null) {
        await c.editMessageText('У вас нет аккоунта', {
            reply_markup: new InlineKeyboard().text('Создать аккоунт', 'create_user')
        })
        return
    }
    await c.editMessageText('Вы можете использовать приложению', {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: "Открыть магазин",
                        web_app: {
                            url: WEB_APP_URL!
                        }
                    }
                ]
            ],
        }
    })
})

bot.callbackQuery('create_user', async c => {
    try {
        await c.answerCallbackQuery()

        await handleCreateUser(c)
    } catch (error) {
        console.log(error)
    }
})

bot.on(':location', async (c) => {
    try {
        const user = register_users.get(c.chat.id)
        if(!user) return
        user.latitude = c.msg.location.latitude
        user.longitude = c.msg.location.longitude
        
        await handleCreateUser(c)
    } catch (error) {
        console.log(error)
    }
})

bot.on(':contact', async (c) => {
    try {
        const user = register_users.get(c.chat.id)
        if(!user) return
        user.phone = c.msg.contact.phone_number
        
        await handleCreateUser(c)
    } catch (error) {
        console.log(error)
    }
})

bot.on(':web_app_data', async (c) => {
    console.log(c.msg);
})

bot.catch((err) => {
    console.log(err)
    if(err.error instanceof GrammyError) console.log('Error in request')
    else if(err.error instanceof HttpError) console.log('Could not contact Telegram')
    else console.log('Unknown error')
})

const handleCreateUser = async (c: any) => {
    try {
        let fuser;
        fuser = await prisma.user.findFirst({ where: { user_tg_id: '' + c.chat?.id } })

        if(fuser) return await c.reply('У вас уже есть аккоунт. Вы можете использовать приложению', {
            reply_markup: new InlineKeyboard().webApp('Открыть магазин', WEB_APP_URL!)
        })

        let user = register_users.get(c.chat?.id!)

        if(!user) {
            register_users.set(c.chat?.id!, {})
            user = register_users.get(c.chat?.id!)
        }

        // if(!user?.longitude || !user?.latitude) {
        //     await c.reply('Нам нужно ваше местоположения и телефон', {
        //         reply_markup: new Keyboard().requestLocation('Поделиться c местоположением').resized(),
        //     })
        //     return
        // }
        
        if(!user?.phone) {
            await c.reply('Нам нужно ваше телефон', {
                reply_markup: new Keyboard().requestContact('Поделиться c телефоном').resized(),
            })
            return
        }
        
        await prisma.user.create({data: {
            first_name: c.chat?.first_name!,
            last_name: c.chat?.last_name! || '',
            user_tg_id: ''+c.chat?.id!,
            count_of_orders: 0,
            phone: user.phone,
            address: "",
        }})
        
        setStatistics('users', 1)
        register_users.delete(c.chat.id)

        await c.reply('Ваш аккоунт создано успешно!', {
            reply_markup: new InlineKeyboard().webApp('Открыть магазин', WEB_APP_URL!)
        })
    } catch (error) {
        console.log(error)
    }
}

export default bot