//специльно для Buratinopol
var txnId = require('./txnId');
const fs = require("fs")

const mongo = require('mongoose');
mongo.connect('mongodb://127.0.0.1/base');

const ADMINS = [id];

var qiwistr = fs.readFileSync("./Bqiwi.txt", { encoding: "utf8" })
console.log("QIWI loaded: " + qiwistr)


process.env.TZ = 'Moscow/Europe';

var User = mongo.model('User', {
	id: Number,
	buybalance: Number,
	outbalance: Number,
	username: String,
	name: String,
	fc: Number,
	ref: Number,
	regDate: String,
	trees: Array,
	deposit: Number,
	payout: Number,
	menu: String,
	lastCollect: Number,
	ban: Boolean,
	refCount: Number,
	wb_profits: Number,
	totalEarn: Number,
	not: Boolean,
	data: String,
	bank: Number,
	game_payin: Number,
	game_payout: Number,
	game_limit: Number,
	game_bet: Number,
	gameplay: Number,
	win: Number,
	lose: Number,
	last_bonus_day: Number,
	bonuscount: Number,
	spinsToday: Number,
});

const Config = mongo.model("configs", { parameter: String, value: Number, description: String })

const BestUser = mongo.model('BestUsers', { id: Number, username: String, id1: Number })
const FUser = mongo.model('FUsers', { id: Number, username: String, id1: Number })
const BigUser = mongo.model('BigUsers', { id: Number, username: String, id1: Number })

function addBal(user_id, sum) { User.findOneAndUpdate({ id: user_id }, { $inc: { buybalance: sum } }, {}).then((e) => { }) }
function addoutBal(user_id, sum) { User.findOneAndUpdate({ id: user_id }, { $inc: { outbalance: sum } }, {}).then((e) => { }) }

var Gamestat = mongo.model('Gamestat', {
	id: Number,
	statusgame: String
});

const Ticket = mongo.model('Ticket', {
	id: Number,
	amount: Number,
	wallet: String
})

const Deposit = mongo.model('Deposits', { 
	creator_id: Number, 
	amount: Number, 
	time: Number, 
	txnId: String 
})

const Start = [
	["🎲 Игры", "🖥 Профиль"],
	["👨‍💻 Партнеры", "📊 Статистика"]
];

const Cancel = [
	["🚫 Отмена"]
];

const RM_admin = {
	inline_keyboard: [
		[{ text: "✉️ Рассылка", callback_data: "admin_mm" }, { text: "🔎 Управление", callback_data: "admin_u" }],
		[{ text: "📮 Заявки на вывод", callback_data: "admin_w" }, { text: "🛠 Создать промокод", callback_data: "a_voucherpromo" }],
	//	[{ text: "🗒 Чек", callback_data: "a_voucher" }],
		[{ text: "✏️ Бонус к пополнению", callback_data: "admin_b" }, { text: "⚙️ Параметры бота", callback_data: "admin_parametr" }],
		//[{ text: "💰 Финансы", callback_data: "admin_finanses" }, { text: "🎲 Игры", callback_data: "admin_games" }],
		[{ text: "🎲 Игры", callback_data: "admin_games" }],
	]
}

const RM_admin_return = { inline_keyboard: [[{ text: "◀️ Назад", callback_data: "admin_return" }],] }
const Promo = mongo.model("Promo", { id: String, sum: Number, activated: Boolean })
function generateID(res) { var text = ""; var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"; for (var i = 0; i < res; i++)text += possible.charAt(Math.floor(Math.random() * possible.length)); return text }

const RM_promo = {
	inline_keyboard: [
		[{ text: "Для покупок", callback_data: "voucherbuy" }],
		[{ text: "Для вывода", callback_data: "voucherout" }],
	]
}

const RM_mm1 = {
	inline_keyboard: [
		[{ text: "⏹ Стоп", callback_data: "admin_mm_stop" }],
		[{ text: "⏸ Пауза", callback_data: "admin_mm_pause" }],
	]
}

const RM_mm2 = {
	inline_keyboard: [
		[{ text: "⏹ Стоп", callback_data: "admin_mm_stop" }],
		[{ text: "▶️ Продолжить", callback_data: "admin_mm_play" }],
	]
}

const { Qiwi } = require('node-qiwi-api');
const qiwi = new Qiwi(qiwistr.split(" ")[1]);

const Telegram = require('node-telegram-bot-api');
const bot = new Telegram('1111', { polling: true });

bot.getMe().then(r => console.log(r))

bot.on('text', async (message) => {
	message.send = (text, params) => bot.sendMessage(message.chat.id, text, params);
	let $menu = [];
	var uid = message.from.id
	var text = message.text
	let dt = new Date
	console.log("[" + dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds() + "] Пользователь " + uid + " отправил: " + text)

	Start.map((x) => $menu.push(x));
	if (ADMINS.find((x) => x == message.from.id)) $menu.push(["🔝 Админка"]);

	if (message.text) {
		if (message.text.startsWith('/start') || message.text == '🔙 Назад') {
			let $user = await User.findOne({ id: message.from.id });
			if (!$user) {
				let schema = {
					id: message.from.id,
					buybalance: 0,
					outbalance: 0,
					username: message.from.username,
					name: message.from.first_name,
					fc: 0,
					ref: 0,
					regDate: `${new Date().getDate()}/${new Date().getMonth() + 1}/${new Date().getFullYear()}`,
					deposit: 0,
					payout: 0,
					menu: "",
					ban: false,
					refCount: 0,
					not: false,
					data: "",
					bank: 0,
					game_payin: 0,
					game_payout: 0,
					gameplay: 0,
					win: 0,
					lose: 0,
					last_bonus_day: 0,
					bonuscount: 0
				}

				let reffer = Number(message.text.split('/start ')[1]);

				if (reffer) {
					let $reffer = await User.findOne({ id: reffer });
					if ($reffer) {
						schema.ref = $reffer.id;
				//		await $reffer.inc('buybalance', 0.25);
						await $reffer.inc('refCount', 1);
					//	bot.sendMessage($reffer.id, `🔔 Вы пригласили <a href="tg://user?id=${message.from.id}">партнёра</a> и получили 0.25₽`, { parse_mode: "HTML" });
					bot.sendMessage($reffer.id, `👨‍💻 Вы пригласили <a href="tg://user?id=${message.from.id}">реферала</a>!\n💰 На ваш баланс будет зачислено <b>${config.refbonus}₽</b> после получения приветственного бонуса`, { parse_mode: "HTML" });
					}
				}

				let user = new User(schema);
				await user.save();
			}
			return message.send(`
✌️ <b>Привет, ${message.from.first_name}</b>`, {
				parse_mode: "HTML",
				reply_markup: {
					keyboard: $menu,
					resize_keyboard: true
				}
			});
		}
	}

	message.user = await User.findOne({ id: message.from.id });
	if (!message.user) return message.send(`Что-то пошло не так... Напишите /start`);
	if (message.user.ban) return
	if (!message.user.name || message.user.name != message.from.first_name)
		await User.findOneAndUpdate({ id: message.from.id }, { name: message.from.first_name })

	if (state[uid] == 7770 && ADMINS.indexOf(message.from.id) !== -1 && text != "0") {
		state[uid] = undefined
		bot.sendMessage(uid, "Рассылка запущена!").then((e) => {
			if (text.split("#").length == 4) {
				var btn_text = text.split("#")[1].split("#")[0].replace(/(^\s*)|(\s*)$/g, '')
				var btn_link = text.split("#")[2].split("#")[0].replace(/(^\s*)|(\s*)$/g, '')
				text = text.split("#")[0]
				mm_t(text, e.message_id, e.chat.id, true, btn_text, btn_link, 100)
			}
			else mm_t(text, e.message_id, e.chat.id, false, false, false, 100)
		})
	}

	if ((await bot.getChatMember("@playgame_info", uid)).status == "left") {
		return message.send(`❕ <b>Для использования бота, пожалуйста, подпишитесь на наши канал:</b>`, { parse_mode: "html", reply_markup: { inline_keyboard: [[{ text: "💡 Новости проекта", url: "https://t.me/playgame_info" }]] } });
	}  

	if (state[uid] == 7771 && ADMINS.indexOf(message.from.id) !== -1) {
		state[uid] = undefined
		text = Number(text.replace("%", ""))
		await User.findOneAndUpdate({ id: 0 }, { deposit: text })
		return message.send(`Бонус к пополнению в ${text}% установлен!`, { reply_markup: RM_admin_return });
	}
	if (message.text.startsWith('/setqiwi') && ADMINS.indexOf(message.from.id) !== -1) {
		var str = message.text.split(' ');
		var number = str[1]
		var token = str[2]
		if (number.indexOf("+") == -1) return message.send('Введите номер с +');
		if (token.length < 10) return message.send('Введите корректный токен');
		fs.writeFileSync("./Bqiwi.txt", number + " " + token, { encoding: "utf8" })
		message.send('QIWI обновлён! Перезапуск бота...');
		setTimeout(() => { process.exit(0) }, 333);
	}

	if (state[uid] == 7772 && ADMINS.indexOf(message.from.id) !== -1 && text != "0") {
		state[uid] = undefined

		message.text = Number(message.text);
		let user = await User.findOne({ id: message.text });
		let u = user
		if (!user) return message.send('Пользователь не найден');

		let partners = await User.find({ ref: message.text });
		await message.user.set('menu', '');
		var kb = { inline_keyboard: [] }
		if (u.ban) kb.inline_keyboard.push([{ text: "♻️ Разбанить", callback_data: "unban_" + u.id }])
		else kb.inline_keyboard.push([{ text: "🛑 Забанить", callback_data: "ban_" + u.id }])
		kb.inline_keyboard.push([{ text: "➕ Баланс покупок", callback_data: "addBuyBal_" + u.id }, { text: "✏️ Баланс покупок", callback_data: "editBuyBal_" + u.id }])
		kb.inline_keyboard.push([{ text: "➕ Баланс вывода", callback_data: "addOutBal_" + u.id }, { text: "✏️ Баланс вывода", callback_data: "editOutBal_" + u.id }])
		kb.inline_keyboard.push([{ text: "➕ Пополнения", callback_data: "addPayIns_" + u.id }, { text: "✏️ Пополнения", callback_data: "editPayIns_" + u.id }])
		kb.inline_keyboard.push([{ text: "➕ Выведено", callback_data: "addPayOuts_" + u.id }, { text: "✏️ Выведено", callback_data: "editPayOuts_" + u.id }])

		kb.inline_keyboard.push([{ text: "◀️ Назад", callback_data: "admin_return" }])

		return message.send(`📝 Пригласил: <b>${partners.length}</b>
~~~~~~~~~~~~~~~~~~~~~
🗂 Юзер: @${user.username}
🆔 ID: <code>${user.id}</code>
📆 Дата регистрации: ${user.regDate}
~~~~~~~~~~~~~~~~~~~~~
👨‍💻 Партнеров: ${await User.countDocuments({ ref: user.id })} | 0.00₽
👨‍💼 Активных: 0 | 0.00₽ (не пашет)
🙅‍♂ Неактивных: 0 | 0.00₽ (Не пашет)
~~~~~~~~~~~~~~~~~~~~~
🎲 Игровой баланс: ${user.buybalance.toFixed(2)}₽
💳 Баланс для вывода: ${user.outbalance.toFixed(2)}₽
~~~~~~~~~~~~~~~~~~~~~
🎰 Игр сыграл: ${user.gameplay} раз
🎉 Выиграл: ${user.win} раз
👎 Проиграл: ${user.lose} раз
🎁 Получил бонусов: ${user.bonuscount} раз
~~~~~~~~~~~~~~~~~~~~~
<b>Пополнил: ${roundPlus(user.deposit)}₽</b>
<b>Вывел: ${roundPlus(user.payout)}₽</b>`, {
			parse_mode: "HTML",
			reply_markup: kb
		});

	}

	if (state[uid] == 7773 && ADMINS.indexOf(message.from.id) !== -1) {
		state[uid] = undefined
		await User.findOneAndUpdate({ id: data[uid] }, { $inc: { buybalance: Number(text) } })
		bot.sendMessage(data[uid], `💰 Ваш баланс для игр пополнен на <b>${text}₽</b>!`, { parse_mode: html })
		return message.send(`Баланс для покупок пользователя пополнен на ${text}₽!`, { reply_markup: RM_admin_return });
	}
	if (state[uid] == 7774 && ADMINS.indexOf(message.from.id) !== -1) {
		state[uid] = undefined
		await User.findOneAndUpdate({ id: data[uid] }, { $inc: { outbalance: Number(text) } })
		bot.sendMessage(data[uid], `💰 Ваш баланс для вывода пополнен на <b>${text}₽</b>!`, { parse_mode: html })
		return message.send(`Баланс для вывода пользователя пополнен на ${text}₽!`, { reply_markup: RM_admin_return });
	}
	if (state[uid] == 777455 && ADMINS.indexOf(message.from.id) !== -1) {
		state[uid] = undefined
		await User.findOneAndUpdate({ id: data[uid] }, { deposit: Number(text) })
		bot.sendMessage(data[uid], `💰 Ваш сумма Ваших пополнений пополнена на <b>${text}₽</b>!`, { parse_mode: html })
		return message.send(`Сумма пополнений пользователя пополнена на ${text}₽!`, { reply_markup: RM_admin_return });
	}
	if (state[uid] == 77745555 && ADMINS.indexOf(message.from.id) !== -1) {
		state[uid] = undefined
		await User.findOneAndUpdate({ id: data[uid] }, { payout: Number(text) })
		bot.sendMessage(data[uid], `💰 Ваш сумма Ваших выводов пополнена на <b>${text}₽</b>!`, { parse_mode: html })
		return message.send(`Сумма выводов пользователя пополнена на ${text}₽!`, { reply_markup: RM_admin_return });
	}
	if (state[uid] == 7775 && ADMINS.indexOf(message.from.id) !== -1) {
		state[uid] = undefined
		await User.findOneAndUpdate({ id: data[uid] }, { buybalance: Number(text) })
		bot.sendMessage(data[uid], `💰 Ваш баланс для покупок изменён на <b>${text}₽</b>!`, { parse_mode: html })
		return message.send(`Баланс для покупок пользователя изменён на ${text}₽!`, { reply_markup: RM_admin_return });
	}
	if (state[uid] == 7776 && ADMINS.indexOf(message.from.id) !== -1) {
		state[uid] = undefined
		await User.findOneAndUpdate({ id: data[uid] }, { outbalance: Number(text) })
		bot.sendMessage(data[uid], `💰 Ваш баланс для вывода изменён на <b>${text}₽</b>!`, { parse_mode: html })
		return message.send(`Баланс для вывода пользователя изменён на ${text}₽!`, { reply_markup: RM_admin_return });
	}
	if (state[uid] == 777655 && ADMINS.indexOf(message.from.id) !== -1) {
		state[uid] = undefined
		await User.findOneAndUpdate({ id: data[uid] }, { deposit: Number(text) })
		bot.sendMessage(data[uid], `💰 Ваш сумма Ваших пополнений измена на <b>${text}₽</b>!`, { parse_mode: html })
		return message.send(`Сумма пополнений пользователя изменёна на ${text}₽!`, { reply_markup: RM_admin_return });
	}
	if (state[uid] == 77765555 && ADMINS.indexOf(message.from.id) !== -1) {
		state[uid] = undefined
		await User.findOneAndUpdate({ id: data[uid] }, { payout: Number(text) })
		bot.sendMessage(data[uid], `💰 Ваш сумма Ваших выводов измена на <b>${text}₽</b>!`, { parse_mode: html })
		return message.send(`Сумма выводов пользователя изменёна на ${text}₽!`, { reply_markup: RM_admin_return });
	}
	if (state[message.chat.id] == 99999 && ADMINS.indexOf(message.from.id) !== -1) {
		state[message.chat.id] = undefined
		var sum = Number(message.text)
		if (sum != 0) {
			var cid = generateID(8)
			var v = new Promo({ id: cid, sum: sum })
			await v.save()
			bot.sendMessage(message.chat.id, `Промокод создан!\n\n<code>P${cid}</code>`, { replyMarkup: Start, parse_mode: "HTML" });
		} else bot.sendMessage(message.chat.id, 'Создание промокода отменено!', { replyMarkup: Start });
	}
	if (state[message.chat.id] == 10000 && ADMINS.indexOf(message.from.id) !== -1) {
		state[message.chat.id] = undefined
		var sum = Number(message.text)
		if (sum != 0) {
			var cid = generateID(8)
			var v = new Promo({ id: cid, sum: sum })
			await v.save()
			bot.sendMessage(message.chat.id, `Промокод создан!\n\n<code>O${cid}</code>`, { replyMarkup: Start,parse_mode: "HTML" });
		} else bot.sendMessage(message.chat.id, 'Создание промокода отменено!', { replyMarkup: Start });
	}
	if (state[message.chat.id] == 10001 && ADMINS.indexOf(message.from.id) !== -1) {
		var p = text.split("\n")
		p.map(async (o) => {
			var par = o.split("=")[0].replace(/(^\s*)|(\s*)$/g, '')
			var val = o.split("=")[1].replace(/(^\s*)|(\s*)$/g, '')
			await Config.findOneAndUpdate({ parameter: par }, { value: val }, { upsert: true })
		})
		initConfig()
		var params = await Config.find({})
		bot.sendMessage(uid, `<i>Введённые параметры изменены!\n\n</i><b>Текущие параметры бота:</b>\n\n${params.map((o) => { return `<code>${o.parameter}</code> - ${o.value} - <i>${o.description}</i>` }).join("\n")}`, { 
			parse_mode: html, 
			webPreview: false,
			reply_markup: {
				inline_keyboard: [
					[{ text: "Изменить параметры", callback_data: "admin_setparametrs" }],
					[{ text: "◀️ Назад", callback_data: "admin_return" }]
				]
			} 
		})
		state[uid] = undefined
	}

	if (message.text) {
		if (message.text == '🚫 Отмена') {
			state[uid] = undefined
			await message.user.set('menu', '');
			return message.send('🚫 Отменено.', {
				reply_markup: {
					keyboard: $menu,
					resize_keyboard: true
				}
			});
		}
	}

	if (message.user.menu.startsWith('amountQiwi')) {
		message.text = Number(message.text);

		if (!message.text) return message.send('Введите сумму на вывод!');
		if (message.text <= 0) return message.send('Введите сумму на вывод!');

		if (message.text > message.user.outbalance) return message.send('Недостаточно средств.');
		if (message.text < 1) return message.send('Введите сумму более 1 рубля!');

		if (message.text <= message.user.outbalance) {
			await message.user.dec('outbalance', message.text);
			//await message.user.inc('payout', message.text);

			let ticket = new Ticket({
				id: message.from.id,
				amount: message.text,
				wallet: message.user.menu.split('amountQiwi')[1]
			});

			await ticket.save();
			await message.user.set('menu', '');
			await User.findOneAndUpdate({ id: 2 }, { $inc: { deposit: message.text } })
			return message.send('Заявка на выплату создана, ожидайте.', {
				reply_markup: {
					keyboard: $menu,
					resize_keyboard: true
				}
			});
		}
	}

	if (message.user.menu == 'qiwi') {

		if (message.text.length < 5) return message.send('Введите правильный номер!', {
			reply_markup: {
				keyboard: Cancel,
				resize_keyboard: true
			}
		});



		await message.user.set('menu', 'amountQiwi' + message.text);
		return message.send(`Введите сумму на вывод. Вы можете вывести ${message.user.outbalance.toFixed(2)}₽`);
	}

	if (message.text) {
		if (message.text == '🎲 Игры') {
			return message.send(`<b>🎲 Игровой кабинет</b>\n
<b>💰 Игровой баланс:</b> ${roundPlus(message.user.buybalance)}₽\n`, {
				parse_mode: "html",
				reply_markup: {
					inline_keyboard: [
						[{ text: "🔒 Сундук", callback_data: "game_chest" }, { text: "💈 Рулетка", callback_data: "game_roulette" }],
						[{ text: "🎰 Колесо фортуны", callback_data: "game_casino" }, { text: "💣 Минное поле", callback_data: "game_bomb" }],
						[{ text: "🌗 Орёл или решка", callback_data: "game_orelilirehka" }, { text: "🥛 Стакан", callback_data: "game_stakan4ik" }],
						[{ text: "📈 Gold Курс", callback_data: "game_trade" }, { text: "📦 Кейс", callback_data: "game_case" }],
						[{ text: "🎁 Бонус", callback_data: "bonus" }, { text: "☘️ Лотерея", callback_data: "game_lotterys"} ],

					]
				}
			});
		}
		if (message.text == '🖥 Профиль') {
			return message.send(`📝 Имя: <b>${message.from.first_name.replace(/(\<|\>)/g, '')}</b>

<b>🎲 Игровой баланс:</b> ${message.user.buybalance.toFixed(2)}₽
<b>💳 Баланс для вывода:</b> ${message.user.outbalance.toFixed(2)}₽
~~~~~~~~~~~~~~~~~~~~~
🆔 <b>ID:</b> <code>${message.from.id}</code>
🎰 Игр сыграно: ${message.user.gameplay} раз
🎉 Выиграно: ${message.user.win} раз
👎 Проиграно: ${message.user.lose} раз
~~~~~~~~~~~~~~~~~~~~~
💸 <b>Пополнено:</b> ${message.user.deposit.toFixed(2)}₽
🤑 <b>Выведено:</b> ${message.user.payout.toFixed(2)}₽`, {
				parse_mode: "HTML",
				reply_markup: {
					inline_keyboard: [
						[{ text: "🗃 Промокод", callback_data: "promoact" }],
						[{ text: "📥 Пополнить", callback_data: "deposit" }, { text: "📤 Вывести", callback_data: "withdraw" }],
					]
				}
			});
		}
//🎊 Вы уже пригласили: ${await User.countDocuments({ ref: message.from.id })}
		if (message.text == '👨‍💻 Партнеры') {
			return message.send(`<b>🤝 Партнёрская программа:</b>	   
🔗 Ваша ссылка для приглашений: https://t.me/PlayGoldBot?start=${message.from.id}

🤝 За приглашение реферала: ${config.refbonus}₽

📥 С пополнений: ${config.refpercent * 100}%

👨‍💻 Вы пригласили: ${await User.countDocuments({ ref: message.from.id })}
		`, {
				parse_mode: "HTML"
			})
		}
		
		if (state[uid] == 11000) {
			let postfix = message.text
				if (postfix[0] == "P") {
					message.user = await User.findOne({ id: message.from.id });

					var c = await Promo.findOne({ id: postfix.substr(1) })
					var sum = c.sum
					if (c) {
						bot.sendMessage(message.from.id, "✅ Вы активировали промокод на <b>" + sum + "</b> рублей для покупок", { parse_mode: "HTML" })
						await Promo.deleteOne({ _id: c._id })
						await message.user.inc("buybalance", sum)
						state[uid] = undefined
					}
					else
					bot.sendMessage(message.from.id, "😞 Промокод не найден")
					state[uid] = undefined
				}
			else if (postfix[0] == "O") {
					message.user = await User.findOne({ id: message.from.id });

					var c = await Promo.findOne({ id: postfix.substr(1) })
					if (c) {
						var sum = c.sum
						bot.sendMessage(message.from.id, "✅ Вы активировали промокод на <b>" + sum + "</b> рублей для вывода", { parse_mode: "HTML" })
						await Promo.deleteOne({ _id: c._id })
						await message.user.inc("outbalance", sum)
						state[uid] = undefined
					}
					else
					bot.sendMessage(message.from.id, "😞 Промокод не найден")
					state[uid] = undefined
				}
			else
			bot.sendMessage(message.from.id, "😞 Промокод не найден")
			state[uid] = undefined
		}

		if (message.text == '📊 Статистика') {
			var s = await User.findOne({ id: 0 })
			let t = new Date()
            t = t.getTime() - 1593648000 * 1000
			var day = t / 86400000 ^ 0
			let stats = {
				users: await User.countDocuments(),
				users_today: await User.find({ regDate: `${new Date().getDate()}/${new Date().getMonth() + 1}/${new Date().getFullYear()}` }),
				cmds: message.message_id
			}
			console.log(stats.users_today)
			stats.users_today = stats.users_today.length;

			return message.send(`
📊<b> Статистика:</b>\n
👨‍💻 Активных игроков: ${stats.users + config.givestats}
👨‍💼 Новых за сегодня: ${stats.users_today}
📆 Работаем: ${day} дней
🎉 Выиграно: ${Math.round(s.win)}₽
📤 Выплачено всего: ${Math.round(s.fc)}₽
`, {
				parse_mode: "HTML",
				reply_markup: {
					inline_keyboard: [
						[{ text: "💬 Чат", url: "https://t.me/playgold_chat" } , { text: "👨‍💻 Админ", url: "https://t.me/TG_PromotionAdmin" }],
						[{ text: "🗞 Новости", url: "https://t.me/playgame_info" } ,{ text: "💰 Выводы", url: "https://t.me/playgame_money" }],
					    [{ text: "🎉 Топ выигрышей", callback_data: "topwins" }, { text: "💳 Топ выводов", callback_data: "topvivod" }],
						[{ text: "🏆 Топ рефоводов", callback_data: "topRef" }],
					]
				}
			});
		}
		if (state[uid] == 8877) {
			var sum = Number(message.text)
			if (isNaN(sum)) return message.send(`Введите число:`, { parse_mode: "HTML" });
			if (sum <= 1) return message.send(`❗️ Введите ставку более 1₽`, { parse_mode: "HTML" });
			if (sum > message.user.buybalance) return message.send(`На Вашем игровом балансе недостаточно средств:`, { parse_mode: "HTML" });
			state[uid] = undefined
			var field
			var arr = randomizeArr(randomizeArr([0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0]))
			field = [
				[arr[0], arr[1], arr[2], arr[3]],
				[arr[4], arr[5], arr[6], arr[7]],
				[arr[8], arr[9], arr[10], arr[11]],
				[arr[12], arr[13], arr[14], arr[15]],
			]
			await User.findOneAndUpdate({ id: uid }, { data: JSON.stringify(field), $inc: { buybalance: -sum, game_limit: -1, game_bet: sum }, bank: sum })

			return bot.sendMessage(message.chat.id, `<b>💣 Минное поле</b>\n
▫️ Всего на поле 6 мин
▫️ Минимальная сумма входа - 50₽ 
▫️ С каждым открытием пустой клетки начисляется +2% от суммы входа
▫️ Ваш баланс для вывода:  ${message.user.outbalance.toFixed(0)}₽
▫️ Откроете все пустые клетки - получите случайный приз:
Морта ▫️ Мейсона ▫️ 10₽ ▫️ 20₽ ▫️ 35₽ ▫️ 40₽\n
💰 <b>Банк игры:</b> ${roundPlus(sum)}₽\n
👇 <b>Выберете клетку для хода:</b>
		`, {
				parse_mode: "HTML",
				reply_markup: {
					inline_keyboard: [
						[{ text: "❓", callback_data: "gameBomb_0,0" }, { text: "❓", callback_data: "gameBomb_0,1" }, { text: "❓", callback_data: "gameBomb_0,2" }, { text: "❓", callback_data: "gameBomb_0,3" }],
						[{ text: "❓", callback_data: "gameBomb_1,0" }, { text: "❓", callback_data: "gameBomb_1,1" }, { text: "❓", callback_data: "gameBomb_1,2" }, { text: "❓", callback_data: "gameBomb_1,3" }],
						[{ text: "❓", callback_data: "gameBomb_2,0" }, { text: "❓", callback_data: "gameBomb_2,1" }, { text: "❓", callback_data: "gameBomb_2,2" }, { text: "❓", callback_data: "gameBomb_2,3" }],
						[{ text: "❓", callback_data: "gameBomb_3,0" }, { text: "❓", callback_data: "gameBomb_3,1" }, { text: "❓", callback_data: "gameBomb_3,2" }, { text: "❓", callback_data: "gameBomb_3,3" }],
						[{ text: "💰 Забрать банк", callback_data: "gameBombCollect" },],
					]
				}
			});
		}

		if (state[uid] == 10002) {
			var sum = Number(message.text)
			if (isNaN(sum)) return message.send(`Введите число:`, { parse_mode: "HTML" });
			if (sum <= 0) return message.send(`❗️ Введите ставку более 0.01₽`, { parse_mode: "HTML" });
			if (sum > message.user.buybalance) return message.send(`На Вашем игровом балансе недостаточно средств:`, { parse_mode: "HTML" });
			state[uid] = undefined
			return bot.sendMessage(message.chat.id, `
💰 Ваша ставка: ${sum}
❓ На что делаем ставку?`, {
				parse_mode: "HTML",
				reply_markup: {
					inline_keyboard: [
						[{ text: "🌑 Орёл", callback_data: `gameorel_` + sum }],
						[{ text: "🌕 Решка", callback_data: `gamereshka_` + sum }]
					]
				}
			});
		}
		
		if (state[uid] == 10003) {
			var sum = Number(message.text)
			if (isNaN(sum)) return message.send(`Введите число:`, { parse_mode: "HTML" });
			if (sum <= 0) return message.send(`❗️ Введите ставку более 0.01₽`, { parse_mode: "HTML" });
			if (sum > message.user.buybalance) return message.send(`На Вашем игровом балансе недостаточно средств:`, { parse_mode: "HTML" });
			state[uid] = undefined
			return bot.sendMessage(message.chat.id, `
💰 Ваша ставка: ${sum}₽
❓ Какой стакан выберишь?`, {
				parse_mode: "HTML",
				reply_markup: {
					inline_keyboard: [
						[{ text: "🥛", callback_data: `gamestakan_` + sum + '_' + '1'}, { text: "🥛", callback_data: `gamestakan_` + sum + '_' + '2'}, { text: "🥛", callback_data: `gamestakan_` + sum + '_' + '3' }]
					]
				}
			});
		}
		
		if (state[uid] == 10004) {
			var sum = Number(message.text)
			if (isNaN(sum)) return message.send(`Введите число:`, { parse_mode: "HTML" });
			if (sum <= 0) return message.send(`❗️ Введите ставку более 0.01₽`, { parse_mode: "HTML" });
			if (sum > message.user.buybalance) return message.send(`На Вашем игровом балансе недостаточно средств:`, { parse_mode: "HTML" });
			state[uid] = undefined
			let kyrs = randomInteger(1, 1000)
			return bot.sendMessage(message.chat.id, `
💰 Ваша ставка: ${sum}₽
📑 Текущий курс: ${kyrs} 
📊 Какой предполагаемый курс выберишь?`, {
				parse_mode: "HTML",
				reply_markup: {
					inline_keyboard: [
						[{ text: "⬆️ Вверх", callback_data: `gametradeup_` + sum + '_' + kyrs}],
						[{ text: "⬇️ Вниз", callback_data: `gametradedown_` + sum + '_' + kyrs}]
					]
				}
			});
		}
/*		
		if (state[uid] == 10005) {
			var sum = Number(message.text)
			if (isNaN(sum)) return message.send(`Введите число:`, { parse_mode: "HTML" });
			if (sum < 0) return message.send(`Введите число более 0`, { parse_mode: "HTML" });
			if (sum > message.user.buybalance) return message.send(`На Вашем игровом балансе недостаточно средств:`, { parse_mode: "HTML" });
			state[uid] = undefined
			let kef = randomizeArr([0.96, 0.40, 8.33, 4.30, 5.20, 0.20, 0.20, 0.10, 0.5, 0.7]) 
			return bot.sendMessage(message.chat.id, `
Вам начислено ${sum * kef[0]}`, {
				parse_mode: "HTML",
				reply_markup: {
					inline_keyboard: [
						[{ text: "⬜", callback_data: `game`}, { text: "⬇️", callback_data: `game`}, { text: "⬜", callback_data: `game`}],
						[{ text: `${kef[1]}x`, callback_data: `fe`},{ text: `${kef[0]}x`, callback_data: `game`}, { text: `${kef[3]}x`, callback_data: `game`}],
						[{ text: "⬜", callback_data: `game`},{ text: "⬆️", callback_data: `game`}, { text: "⬜", callback_data: `game`}],
						[{ text: "🔄 Ещё раз", callback_data: "game_case" }]
					]
				}
			});
		} */
		
		if (state[uid] == 10005) {
			var sum = Number(message.text)
			if (isNaN(sum)) return message.send(`Введите число:`, { parse_mode: "HTML" });
			if (sum <= 0) return message.send(`❗️ Введите ставку более 0.01₽`, { parse_mode: "HTML" });
			if (sum > message.user.buybalance) return message.send(`На Вашем игровом балансе недостаточно средств:`, { parse_mode: "HTML" });
			state[uid] = undefined
			//let kef = randomizeArr([0.96, 0.40, 8.33, 4.30, 5.20, 0.20, 0.20, 0.10, 0.5, 0.7]) 
	//		let kef = randomizeArr([0.23, 0.48, 0.87, 0.45, 1.32, 0.34, 0.76, 0.43, 0.65, 0.22, 1.26, 0.54, 0.38, 1.65, 0.98, 0.87, 1.87, 2.55, 0.14, 0.44, 1.20, 0.87, 0.37, 0.17, 0.39, 0.10, 2.32, 0.18, 0.19, 0.42, 0.98, 1.11, 0.13, 0.79, 1.15, 0.98, 2.11, 1.41, 0.69, 0.10, 3.12, 0.87, 0.33, 1.47, 0.21, 0.50, 1, 0.93, 1.50, 0.55, 0.66, 0.17, 0.29, 1.78, 0.31, 0.21, 0.47, 0.26, 4.12, 0.55, 0.41, 1.54, 5.41, 0.25, 0.26, 0.27, 0.64, 0.48, 0.95, 0.47, 0.10, 0.93, 0.68, 0.67, 0.63, 0.73]) 
		//	let kef = randomizeArr([1.12, 0.22, 0.45, 1.36, 0.68, 0.74, 2.65, 1.11, 0.47, 3.41, 0.01, 0.86, 2.20, 0.98, 1.47, 4.57, 0.12, 0.36, 3.74, 0.50, 0.40]) 
			let kef1 = randomizeArr([1.24, 2.68, 1.69, 3.20, 6.87, 3.11, 2.41, 1.96, 1.35, 8.84, 3.40, 2.54, 8.58, 4.80, 2.11, 2.15, 4.74, 2.98, 3.01, 4.05, 8.12, 6.41, 2.65, 3.84, 2.43, 4.31, 5.59, 4.14, 1.68, 0.96, 0.65, 0.54, 3.49, 2.93, 8.65, 1.68]) 
			let kef = randomizeArr([0.85, 0.96, 0.45, 0.82, 1.14, 0.65, 0.32, 1.69, 0.95, 0.74, 0.54, 1.19, 1.42, 0.56, 0.54, 0.31, 0.89, 2.12, 1.19, 0.48, 0.36, 0.99, 1.65, 0.35, 1.24, 0.26, 0.74, 0.39, 1.54, 0.42, 0.87, 1.48, 0.63, 3.24, 0.85, 0.10, 0.05]) 
			await User.findOneAndUpdate({ id: uid }, { $inc: { buybalance: -sum } })
			await User.findOneAndUpdate({ id: uid }, { $inc: { outbalance: sum * kef[0] } })
			return bot.sendMessage(message.chat.id, `
Вам начислено ${sum * kef[0]}`, {
				parse_mode: "HTML",
				reply_markup: {
					inline_keyboard: [
						[{ text: "⬜", callback_data: `game`}, { text: "⬇️", callback_data: `game`}, { text: "⬜", callback_data: `game`}],
						[{ text: `${kef1[1]}x`, callback_data: `fe`},{ text: `${kef[0]}x`, callback_data: `game`}, { text: `${kef1[3]}x`, callback_data: `game`}],
						[{ text: "⬜", callback_data: `game`},{ text: "⬆️", callback_data: `game`}, { text: "⬜", callback_data: `game`}],
						[{ text: "🔄 Ещё раз", callback_data: "game_case" }]
					]
				}
			});
		}		
		
	}

	if (ADMINS.indexOf(message.from.id) !== -1) {
		if (message.text == '🔝 Админка') {
			var h = process.uptime() / 3600 ^ 0
			var m = (process.uptime() - h * 3600) / 60 ^ 0
			var s = process.uptime() - h * 3600 - m * 60 ^ 0
			var heap = process.memoryUsage().rss / 1048576 ^ 0
		var zeroId = await User.findOne({ id: 0 })

			return qiwi.getBalance(async (err, balance) => {
		bot.sendMessage(uid, `
		<b>Админ-панель:</b>\n
		<b>Аптайм бота:</b> ${h} часов ${m} минут ${s} секунд
		<b>Пользователей в боте: </b>${await User.countDocuments()}
		<b>Заявок на вывод:</b> ${await Ticket.countDocuments()}
		<b>Бонус к пополнению:</b> ${zeroId.deposit}%
		<b>Баланс QIWI:</b> ${balance.accounts[0].balance.amount}
		`, { parse_mode: "HTML", reply_markup: RM_admin })
				/*require('request')({
					method: 'POST',
					url: 'https://payeer.com/ajax/api/api.php?getBalance',
					headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
					body: `account=${config.payeer.account}&apiId=${config.payeer.apiId}&apiPass=${config.payeer.apiPass}&action=getBalance`
				}, async function (error, response, body2) {
					body2 = JSON.parse(body2)
					console.log(body2)
					bot.sendMessage(uid, '<b>Админ-панель:</b>\n\n<b>Аптайм бота:</b> ' + h + ' часов ' + m + ' минут ' + s + ' секунд\n<b>Пользователей в боте: </b>' + (await User.countDocuments({})) + '\n<b>Памяти использовано:</b> ' + heap + "МБ\n<b>Заявок на вывод:</b> " + await Ticket.countDocuments() + "\n<b>Баланс QIWI:</b> " + balance.accounts[0].balance.amount + `₽\n<b>Баланс Payeer:</b> ${body2.balance.RUB.available}₽\n<b>Бонус к пополнению:</b> ` + b + "%\n<b>Лимит на зверей: </b>" + limit + " едниниц", { parse_mode: "HTML", reply_markup: RM_admin })

				})*/
			})
				
		}

	if (query.data == 'game_roulette') {
		var game = JSON.parse((await Gamestat.findOne({ id: 1 })).statusgame)

		if (!game.statusroulet) return bot.answerCallbackQuery(query.id, '🛑 Игра временно отключена администратором', true);
		bot.deleteMessage(message.chat.id, message.message_id);
		return bot.sendMessage(message.chat.id, `<b>💈 Рулетка</b>\n
<b>🎲 Ваш баланс</b> ${roundPlus(message.user.buybalance)}₽
<b>💳 Для вывода:</b> ${roundPlus(message.user.outbalance)}₽\n			
<b>❗️ Вращений сегодня:</b> ${message.user.spinsToday || 0}/2\n
<b>🗂 В рулетке 7 ячеек:</b>
0₽ | 0₽ | 0₽ | 5₽ | 20₽ | 30₽
	`, {
			parse_mode: "HTML",
			reply_markup: {
				inline_keyboard: [
					[{ text: "💈 Купить вращение за 10₽", callback_data: "game_roulette_spin" }],
				]
			}
		});
	}

	if (query.data == 'game_roulette_spin') {
		var game = JSON.parse((await Gamestat.findOne({ id: 1 })).statusgame)

		if (!game.statusroulet) return bot.answerCallbackQuery(query.id, '🛑 Игра временно отключена администратором', true);
		if (message.user.spinsToday >= 2) return bot.answerCallbackQuery(query.id, '❌ Вы уже купили 2 вращения сегодня!', true);
		if (message.user.buybalance < 10) return bot.answerCallbackQuery(query.id, '❌ На Вашем игровом балансе недостаточно средств!', true);
		await User.findOneAndUpdate({ id: uid }, { $inc: { buybalance: -10, spinsToday: 1 } })
		bot.deleteMessage(message.chat.id, message.message_id);
		var arr = randomizeArr([0, 0, 0, 5,5,20,5,5,30,5,5])
		await User.findOneAndUpdate({ id: uid }, { $inc: { outbalance: arr[3] } })
		return bot.sendMessage(message.chat.id, `💈 <b>Рулетка</b>\n\n
						${arr[0]}₽
						${arr[1]}₽
						${arr[2]}₽
🔹${arr[3]}₽🔹
						${arr[4]}₽
						${arr[5]}₽\n
<b>Вам начислено ${arr[3]}₽ на игровой баланс!</b>
	`, {
			parse_mode: "HTML",
			reply_markup: {
				inline_keyboard: [
					[{ text: "◀️ Назад", callback_data: "game_roulette" }],
				]
			}
		});
	}

	if (query.data == 'game_chest') {
		var game = JSON.parse((await Gamestat.findOne({ id: 1 })).statusgame)

		if (!game.statuschest) return bot.answerCallbackQuery(query.id, '🛑 Игра временно отключена администратором', true);
		bot.deleteMessage(message.chat.id, message.message_id);
		return bot.sendPhoto(message.chat.id, `chest.png`, {
			parse_mode: "HTML",
			reply_markup: {
				inline_keyboard: [
					[{ text: "1₽", callback_data: "casino_1" },
					{ text: "2₽", callback_data: "casino_2" },
					{ text: "5₽", callback_data: "casino_5" },
					{ text: "10₽", callback_data: "casino_10" }],
					[{ text: "25₽", callback_data: "casino_25" },
					{ text: "50₽", callback_data: "casino_50" },
					{ text: "100₽", callback_data: "casino_100" },
					{ text: "250₽", callback_data: "casino_250" }],
				]
			}, caption: `🔒 Выберете стоимость сундука
🍀 Вы можете найти в два раза больше ₽, а может быть, сундук окажется пустым
🎲 Вероятность: 50%`
		});
	}

	if (query.data.startsWith("casino_open")) {
		var game = JSON.parse((await Gamestat.findOne({ id: 1 })).statusgame)

		if (!game.statuschest) return bot.answerCallbackQuery(query.id, '🛑 Игра временно отключена администратором', true);
		bot.deleteMessage(message.chat.id, message.message_id)
		var bet = Number(query.data.split("_")[2])
		if (bet > message.user.buybalance) await bot.answerCallbackQuery(query.id, 'Недостаточно средств для ставки!', true);
		//else if (Math.random() >= 0.58) {
		else if (Math.random() >= 0.75) {
			await message.user.inc("outbalance", bet)
			await bot.answerCallbackQuery(query.id, '💸 Вы выиграли ' + bet * 2 + "₽!", true);
		} else {
			await message.user.inc("buybalance", -bet)
			await bot.answerCallbackQuery(query.id, "😞 Сундук пуст", true);
		}
		return bot.sendPhoto(message.chat.id, `chest.png`, {
			parse_mode: "HTML",
			reply_markup: {
				inline_keyboard: [
					[{ text: "1₽", callback_data: "casino_1" },
					{ text: "2₽", callback_data: "casino_2" },
					{ text: "5₽", callback_data: "casino_5" },
					{ text: "10₽", callback_data: "casino_10" }],
					[{ text: "25₽", callback_data: "casino_25" },
					{ text: "50₽", callback_data: "casino_50" },
					{ text: "100₽", callback_data: "casino_100" },
					{ text: "250₽", callback_data: "casino_250" }],
					[{ text: "🔓 Открыть за " + bet + "₽", callback_data: "casino_open_" + bet }]
				]
			}, caption: `🔒 Выберете стоимость сундука
🍀 Вы можете найти в два раза больше ₽, а может быть, сундук окажется пустым
🎲 Вероятность: 50%
						
💰 Ваш баланс: ${message.user.buybalance} ₽
💸 Ваша ставка: ${bet} ₽
🎰 Возможный выигрыш: ${bet * 2} ₽`
		})

	}

	if (query.data.startsWith("casino")) {
		bot.deleteMessage(message.chat.id, message.message_id)
		var bet = Number(query.data.split("_")[1])
		return bot.sendPhoto(message.chat.id, `chest.png`, {
			parse_mode: "HTML",
			reply_markup: {
				inline_keyboard: [
					[{ text: "1₽", callback_data: "casino_1" },
					{ text: "2₽", callback_data: "casino_2" },
					{ text: "5₽", callback_data: "casino_5" },
					{ text: "10₽", callback_data: "casino_10" }],
					[{ text: "25₽", callback_data: "casino_25" },
					{ text: "50₽", callback_data: "casino_50" },
					{ text: "100₽", callback_data: "casino_100" },
					{ text: "250₽", callback_data: "casino_250" }],
					[{ text: "🔓 Открыть за " + bet + "₽", callback_data: "casino_open_" + bet }]
				]
			}, caption: `🔒 Выберете стоимость сундука
🍀 Вы можете найти в два раза больше ₽, а может быть, сундук окажется пустым
🎲 Вероятность: 50%
						
💰 Ваш баланс: ${message.user.buybalance} ₽
💸 Ваша ставка: ${bet} ₽
🎰 Возможный выигрыш: ${bet * 2} ₽`
		})
	}

	if (query.data == 'game_orelilirehka') {
		var game = JSON.parse((await Gamestat.findOne({ id: 1 })).statusgame)
		if (!game.statusorel) return bot.answerCallbackQuery(query.id, '🛑 Игра временно отключена администратором', true);
		if (message.user.buybalance == 0) return bot.answerCallbackQuery(query.id, '❌ На Вашем игровом балансе недостаточно средств!', true);
		var q =  roundPlus(message.user.buybalance * 0.10)
		var w =  roundPlus(message.user.buybalance * 0.20)
		var e =  roundPlus(message.user.buybalance * 0.35)
		var r =  roundPlus(message.user.buybalance * 0.50)
		var t =  roundPlus(message.user.buybalance * 0.75)
		var y =  roundPlus(message.user.buybalance )
		if (message.user.buybalance == 0) {
var markup = [["🚫 Отмена"]]
		}
		else {
		var markup = [[`${q}`, `${w}`, `${e}`], [`${r}`, `${t}`, `${y}`], ["🚫 Отмена"]]
		}
	//	var d = [[`${q}`, `${w}`, `${e}`], [`${r}`, `${t}`, `${y}`]]
		bot.deleteMessage(message.chat.id, message.message_id);
		state[uid] = 10002
		return bot.sendMessage(message.chat.id, `
<b>🌗 Орел или решка</b>\n

🎲 Ваш баланс: ${roundPlus(message.user.buybalance)}₽
💳 Для вывода: ${roundPlus(message.user.outbalance)}₽

<b>📱 Для начала игры выберите  сумму ставки или введите свою. Минимальная ставка 0.01₽❗️</b>
	`, {
			parse_mode: "HTML",
			reply_markup: {
				keyboard: markup,
				resize_keyboard: true
			}
		});
	}

	if (query.data == 'game_stakan4ik') {
		var game = JSON.parse((await Gamestat.findOne({ id: 1 })).statusgame)
		if (!game.statusstakan) return bot.answerCallbackQuery(query.id, '🛑 Игра временно отключена администратором', true);
		if (message.user.buybalance == 0) return bot.answerCallbackQuery(query.id, '❌ На Вашем игровом балансе недостаточно средств!', true);
		var q =  roundPlus(message.user.buybalance * 0.10)
		var w =  roundPlus(message.user.buybalance * 0.20)
		var e =  roundPlus(message.user.buybalance * 0.35)
		var r =  roundPlus(message.user.buybalance * 0.50)
		var t =  roundPlus(message.user.buybalance * 0.75)
		var y =  roundPlus(message.user.buybalance )
	if (message.user.buybalance == 0) return bot.answerCallbackQuery(query.id, '❌ На Вашем игровом балансе недостаточно средств!', true);
		if (message.user.buybalance == 0) {
var markup = [["🚫 Отмена"]]
		}
		else {
		var markup = [[`${q}`, `${w}`, `${e}`], [`${r}`, `${t}`, `${y}`], ["🚫 Отмена"]]
		}
		bot.deleteMessage(message.chat.id, message.message_id);
		state[uid] = 10003
		return bot.sendMessage(message.chat.id, `
<b>🥛 Стакан</b>\n

🎲 Ваш баланс: ${roundPlus(message.user.buybalance)}₽
💳 Для вывода: ${roundPlus(message.user.outbalance)}₽

<b>📱 Для начала игры выберите  сумму ставки или введите свою. Минимальная ставка 0.01₽❗️</b>
	`, {
			parse_mode: "HTML",
			reply_markup: {
				keyboard: markup,
				resize_keyboard: true
			}
		});
	}
	
	if (query.data == 'game_trade') {
			var game = JSON.parse((await Gamestat.findOne({ id: 1 })).statusgame)
			if (!game.statuskyrs) return bot.answerCallbackQuery(query.id, '🛑 Игра временно отключена администратором', true);
		if (message.user.buybalance == 0) return bot.answerCallbackQuery(query.id, '❌ На Вашем игровом балансе недостаточно средств!', true);
			var q =  roundPlus(message.user.buybalance * 0.10)
			var w =  roundPlus(message.user.buybalance * 0.20)
			var e =  roundPlus(message.user.buybalance * 0.35)
			var r =  roundPlus(message.user.buybalance * 0.50)
			var t =  roundPlus(message.user.buybalance * 0.75)
			var y =  roundPlus(message.user.buybalance )
			if (message.user.buybalance == 0) {
	var markup = [["🚫 Отмена"]]
			}
			else {
			var markup = [[`${q}`, `${w}`, `${e}`], [`${r}`, `${t}`, `${y}`], ["🚫 Отмена"]]
			}
			bot.deleteMessage(message.chat.id, message.message_id);
			state[uid] = 10004
			return bot.sendMessage(message.chat.id, `
	<b>📈 Gold Курс</b>\n
	
	🎲 Ваш баланс: ${roundPlus(message.user.buybalance)}₽
	💳 Для вывода: ${roundPlus(message.user.outbalance)}₽
	
	<b>📱 Для начала игры выберите сумму ставки или введите свою. Минимальная ставка 0.01₽❗️</b>
		`, {
				parse_mode: "HTML",
				reply_markup: {
					keyboard: markup,
					resize_keyboard: true
				}
			});
		}	
	//	await User.findOneAndUpdate({ id: uid }, { $inc: { buybalance: -sum } })
	if (query.data.startsWith("gameorel")) {
    	var game = JSON.parse((await Gamestat.findOne({ id: 1 })).statusgame)
	
		if (!game.statusorel) return bot.answerCallbackQuery(query.id, '🛑 Игра временно отключена администратором', true);
		bot.deleteMessage(message.chat.id, message.message_id)
		var bet = Number(query.data.split("_")[1])
		if (bet > message.user.buybalance) await bot.answerCallbackQuery(query.id, 'Недостаточно средств для ставки!', true);
		 if (Math.random() >= 0.58) {
				await message.user.inc("outbalance", bet)
				await message.user.inc("buybalance", -bet)
				await message.user.inc("win", 1)
				await message.user.inc("gameplay", 1)
				await bot.answerCallbackQuery(query.id, '🌑 Орёл\n💳 Вы выиграли ' + bet * 2 + "₽!", true);
		} else {
				await message.user.inc("buybalance", -bet)
				await message.user.inc("lose", 1)
				await message.user.inc("gameplay", 1)
				await bot.answerCallbackQuery(query.id, "🌕 Решка\n🚫 Вы проиграли " + bet + "₽!", true);
			}
			return bot.sendMessage(message.chat.id, `Хотите сыграть ещё раз?`, {
				parse_mode: "HTML",
				reply_markup: {
					inline_keyboard: [
						[{ text: "🔄 Ещё раз", callback_data: "game_orelilirehka" }]
					],
				},
			})
	
		}

	if (query.data.startsWith("gamereshka")) {
			var game = JSON.parse((await Gamestat.findOne({ id: 1 })).statusgame)
		
		if (!game.statusorel) return bot.answerCallbackQuery(query.id, '🛑 Игра временно отключена администратором', true);
		bot.deleteMessage(message.chat.id, message.message_id)
		var bet = Number(query.data.split("_")[1])
		if (bet > message.user.buybalance) await bot.answerCallbackQuery(query.id, 'Недостаточно средств для ставки!', true);
		if (Math.random() >= 0.58) {
				await message.user.inc("outbalance", bet * 2)
				await message.user.inc("buybalance", -bet)
				await message.user.inc("win", 1)
				await message.user.inc("gameplay", 1)
				await bot.answerCallbackQuery(query.id, '🌕 Решка\n💳 Вы выиграли ' + bet * 2 + "₽!", true);
			} else {
				await message.user.inc("buybalance", -bet)
				await message.user.inc("lose", 1)
				await message.user.inc("gameplay", 1)
				await bot.answerCallbackQuery(query.id, "🌑 Орёл\n🚫 Вы проиграли " + bet + "₽!", true);
			}
			return bot.sendMessage(message.chat.id, `Хотите сыграть ещё раз?`, {
				parse_mode: "HTML",
				reply_markup: {
					inline_keyboard: [
						[{ text: "🔄 Ещё раз", callback_data: "game_orelilirehka" }]
					]
				}
			})
		}	
			
	if (query.data.startsWith("gamestakan")) {
		var game = JSON.parse((await Gamestat.findOne({ id: 1 })).statusgame)
			
		if (!game.statusstakan) return bot.answerCallbackQuery(query.id, '🛑 Игра временно отключена администратором', true);
		bot.deleteMessage(message.chat.id, message.message_id)
		var sum = Number(query.data.split("_")[1])
		var stakan = Number(query.data.split("_")[2])
		var lose = randomInteger(1, 2)
		if(lose == 1) lose = `❗️ Неправильно`
		if(lose == 2) lose = `❗️ Вы не угадали`
		let ctakan = randomInteger(1, 3)
		if (sum > message.user.buybalance) await bot.answerCallbackQuery(query.id, 'Недостаточно средств для ставки!', true);
			else if (ctakan !== stakan) {
				await message.user.inc("buybalance", -sum)
				await message.user.inc("lose", 1)
				await message.user.inc("gameplay", 1)
				await bot.answerCallbackQuery(query.id, `${lose}, это был ${ctakan}-й стакан\n🚫 Вы проиграли ` + sum + "₽!", true);
				} else {
					await message.user.inc("outbalance", sum * 2)
					await message.user.inc("buybalance", -bet)
					await message.user.inc("win", 1)
					await message.user.inc("gameplay", 1)
					await bot.answerCallbackQuery(query.id, "Вы угадали\n💸 Вы выиграли " + sum * 2 + "₽!", true);
				}
				return bot.sendMessage(message.chat.id, `Хотите сыграть ещё раз?`, {
					parse_mode: "HTML",
					reply_markup: {
						inline_keyboard: [
							[{ text: "🔄 Ещё раз", callback_data: "game_stakan4ik" }]
						]
					}
				})
			}			

	if (query.data.startsWith("gametradeup")) {
			var game = JSON.parse((await Gamestat.findOne({ id: 1 })).statusgame)
				
		if (!game.statuskyrs) return bot.answerCallbackQuery(query.id, '🛑 Игра временно отключена администратором', true);
		bot.deleteMessage(message.chat.id, message.message_id)
		var sum = Number(query.data.split("_")[1])
		var kyrs = Number(query.data.split("_")[2])
		let win = randomInteger(1, 3)
		let losesmile = randomizeArr([`😲`, `😣`, ` 😮`,`😔`]) 
		let winsmile = randomizeArr([`😎`, `😀`, ` 🤑`,`😇`]) 
		if (sum > message.user.buybalance) await bot.answerCallbackQuery(query.id, 'Недостаточно средств для ставки!', true);
	      if (win == 1) {
				await message.user.inc("outbalance", sum * 2)
				await message.user.inc("buybalance", -bet)
		    	await message.user.inc("win", 1)
				await message.user.inc("gameplay", 1)
				await bot.answerCallbackQuery(query.id, `Курс подорожал⤴ на ${kyrs}.\n✅ Вы заработали + ` + sum * 2 + `₽! ${winsmile}`, true);
			}
			if (win == 2, 3) {
				await message.user.inc("buybalance", -sum)
				await message.user.inc("lose", 1)
				await message.user.inc("gameplay", 1)
				await bot.answerCallbackQuery(query.id, `Курс подешевел⤵ на ${kyrs}.\n❌ Вы потеряли - ` + sum  + `₽! ${losesmile}`, true);
					}		
					return bot.sendMessage(message.chat.id, `Хотите сыграть ещё раз?`, {
						parse_mode: "HTML",
						reply_markup: {
							inline_keyboard: [
								[{ text: "🔄 Ещё раз", callback_data: "game_trade" }]
							]
						}
					})
	}
	
	if (query.data.startsWith("gametradedown")) {
			var game = JSON.parse((await Gamestat.findOne({ id: 1 })).statusgame)
				
		if (!game.statuskyrs) return bot.answerCallbackQuery(query.id, '🛑 Игра временно отключена администратором', true);
		bot.deleteMessage(message.chat.id, message.message_id)
		var sum = Number(query.data.split("_")[1])
		var kyrs = Number(query.data.split("_")[2])
		let win = randomInteger(1, 3)
		let losesmile = randomizeArr([`😲`, `😣`, ` 😮`,`😔`]) 
		let winsmile = randomizeArr([`😎`, `😀`, ` 🤑`,`😇`]) 
		if (sum > message.user.buybalance) await bot.answerCallbackQuery(query.id, 'Недостаточно средств для ставки!', true);
	      if (win == 1) {
				await message.user.inc("outbalance", sum * 2)
				await message.user.inc("buybalance", -bet)
		    	await message.user.inc("win", 1)
				await message.user.inc("gameplay", 1)
				await bot.answerCallbackQuery(query.id, `Курс подешевел⤵ на ${kyrs}.\n✅ Вы заработали + ` + sum * 2 + `₽! ${losesmile}`, true);
					}
					if (win == 2, 3) {
						await message.user.inc("buybalance", -sum)
						await message.user.inc("lose", 1)
						await message.user.inc("gameplay", 1)
						await bot.answerCallbackQuery(query.id, `Курс подорожал⤴ на ${kyrs}.\n❌ Вы потеряли - ` + sum + `₽! ${winsmile}`, true);
							}		
					return bot.sendMessage(message.chat.id, `Хотите сыграть ещё раз?`, {
						parse_mode: "HTML",
						reply_markup: {
							inline_keyboard: [
								[{ text: "🔄 Ещё раз", callback_data: "game_trade" }]
							]
						}
					})
	}	

	if (query.data == 'game_case') {
		var game = JSON.parse((await Gamestat.findOne({ id: 1 })).statusgame)
		if (!game.statuscase) return bot.answerCallbackQuery(query.id, '🛑 Игра временно отключена администратором', true);
		if (message.user.buybalance == 0) return bot.answerCallbackQuery(query.id, '❌ На Вашем игровом балансе недостаточно средств!', true);
		var q =  roundPlus(message.user.buybalance * 0.10)
		var w =  roundPlus(message.user.buybalance * 0.20)
		var e =  roundPlus(message.user.buybalance * 0.35)
		var r =  roundPlus(message.user.buybalance * 0.50)
		var t =  roundPlus(message.user.buybalance * 0.75)
		var y =  roundPlus(message.user.buybalance )
		if (message.user.buybalance <= 0) {
var markup = [["🚫 Отмена"]]
		}
		else {
		var markup = [[`${q}`, `${w}`, `${e}`], [`${r}`, `${t}`, `${y}`], ["🚫 Отмена"]]
		}
		bot.deleteMessage(message.chat.id, message.message_id);
		state[uid] = 10005
		return bot.sendMessage(message.chat.id, `
<b>📦 Кейс</b>\n

🎲 Ваш баланс: ${roundPlus(message.user.buybalance)}₽
💳 Для вывода: ${roundPlus(message.user.outbalance)}₽

<b>📱 Для начала игры выберите  сумму ставки или введите свою. Минимальная ставка 0.01₽❗️</b>
	`, {
			parse_mode: "HTML",
			reply_markup: {
				keyboard: markup,
				resize_keyboard: true
			}
		});
	}
	
	if (query.data == 'bonus') {
		var date = new Date();
		let lbd = await User.findOne({id: message.chat.id})
		lbd = lbd.last_bonus_day
		let d = date.getDate()
		if (lbd != d && message.chat.id != 0)
			bot.sendMessage(message.chat.id, '<b>🎁 Ежедневный бонус\n\n🔄 Статус: ✅</b>', { parse_mode: "HTML", reply_markup: { inline_keyboard: [[{ text: "🎁 Забрать", callback_data: "takebonus" }]] } });
		else
			bot.sendMessage(message.chat.id, '<b>🎁 Ежедневный бонус</b>\n\n<b>🔄 Статус: ❌</b>', { parse_mode: "HTML" });

}

if (query.data == "takebonus") {
	var date = new Date();
	let u = await User.findOne({id: message.chat.id})
	lbd = u.last_bonus_day
	let d = date.getDate()
	if (lbd != d && message.chat.id != 791618646) {
		bot.sendMessage(message.chat.id, `🎁 Вы успешно получили бонус: ${config.bonusday}₽ \n\n⏳ Следующий бонус будет доступен через <b>24</b> часа`, { parse_mode: "HTML", replyMarkup: { keyboard: Start, resize_keyboard: true } });
		let isUser5 = await User.findOne({ id: message.chat.id })//читаем баланс
		await isUser5.inc("buybalance", config.bonusday)
		await isUser5.inc("bonuscount", 1)
		if (u.bonuscount == 0 && u.ref != 0) {
			var referer = await User.findOne({ id: u.ref })
		//	incField(referer.id, "ref1earnings", config.bonuscount)
		//	incField(referer.ref, "ref2earnings", config.ref2_pay)
			addBal(referer.id, config.refbonus)
		//	addBal(referer.ref, config.ref2_pay)
			bot.sendMessage(referer.id, '💳 Вам начислено <b>' + (config.refbonus) + `</b>₽ за получение <a href="tg://user?id=${message.chat.id}">рефералом</a> бонуса`, { parse_mode: "HTML" })
		//	bot.sendMessage(referer.ref, '💳 Вам начислено <b>' + (config.ref2_pay * 100) + '</b> копеек за верификацию реферала на 2 уровне!', { parseMode: html })
		}
		User.findOneAndUpdate({id: message.chat.id},{last_bonus_day: d}, { upsert: true }, function (err, doc) { });
	}
	else
		bot.sendMessage(message.chat.id, `✅ Вы уже получили бонус!\n❗️ Следующий будет завтра`, { parseMode: 'HTML', replyMarkup: { keyboard: Start, resize_keyboard: true } });

}

if (query.data == 'game_lotterys') {
	var best_count = await BestUser.countDocuments({})
	var fl_count = await FUser.countDocuments({})
	var big_count = await BigUser.countDocuments({})

	return bot.sendMessage(message.chat.id,`
<b>☘️ Классическая лотерея</b>
	
💳 Стоимость Билета: <b>5₽</b> 
🎁 Выигрыш: <b>45₽</b>
📃 Куплено Билетов: ${best_count}
🚪 Осталось Мест: ${11- best_count}
							
<b>🎲 Игровая лотерея</b>
			
💳 Стоимость билета: <b>10₽</b>
🎁 Выигрыш: <b>50₽</b>
📃 Куплено билетов: ${fl_count}
🚪 Осталось мест: ${6- fl_count}
	
<b>🔥 Быстрая лотерея</b>
💳 Стоимость Билета: <b>25₽</b> 
🎁 Выигрыш: <b>45₽</b>
📃 Куплено Билетов: ${big_count}
🚪 Осталось Мест: ${2- big_count}
	
<b>🎲 Ваш игровой баланс:</b> ${message.user.buybalance.toFixed(2)}
			
			`, {
				parse_mode: "HTML",
				reply_markup: {
					inline_keyboard: [
						[{ text: `Купить ☘️ Классическая лотерея `, callback_data: `lottery1` }],
						[{ text: `Купить 🎲 Игровая лотерея `, callback_data: `lottery2` }],
						[{ text: `Купить 🔥 Быстрая лотерея`, callback_data: `lottery3` }]
					]
				}	
			});	
}

if (query.data == "lottery1") {
	var game = JSON.parse((await Gamestat.findOne({ id: 1 })).statusgame)

	if (!game.statuslottery) return bot.answerCallbackQuery(query.id, '🛑 Игра временно отключена администратором', true);

	if ((await BestUser.findOne({ id: message.chat.id })) == null) {
		if (message.user.buybalance < 5)
		bot.editMessageText('❗️<b>Ошибка</b>❗️\n\nНедостаточно денег на игровом балансе! Стоимость билета - 5 ₽ ', { chat_id: message.chat.id, message_id: message.message_id, parse_mode: "HTML"})
		else {
			await message.user.dec("buybalance", 5)
			var uid1 = (await BestUser.countDocuments({})) + 1
			let player = new BestUser({ id: message.chat.id, username: message.chat.first_name, id1: uid1 })
			await player.save()
			bot.editMessageText(`Вы стали участником лотереи 🍀\n\n💳 С вашего баланса снято <b>5 ₽ </b>\n💰 Ваш баланс: <b> ${message.user.buybalance} </b>\n📃 Ваш номер: <b>` + uid1 + '</b>\n🚪Осталось мест: <b>' + (11 - uid1) + '</b>\n\n💣 <i>Игра начнётся, как только будет куплен 11-й билет!</i>', { chat_id: message.chat.id, message_id: message.message_id, parse_mode: "HTML"})

			var players = await BestUser.find({})
			if (players.length < 11 && players.length > 1) {
				for (var i = 0; i < (players.length - 1); i++)
					await bot.sendMessage(players[i].id, '📑 Новый участник: <b>' + message.chat.first_name + '</b>\n🚪 Осталось мест:  <b>' + (11 - players.length) + '</b>', { parse_mode: "HTML", reply_markup: { keyboard: Start, resize_keyboard: true}}).then().catch()
			}
			else if (players.length >= 11) {
				var players_list = ''
				for (var i = 0; i < players.length; i++)
					players_list += '<b>' + (i + 1) + ')</b> <a href="tg://user?id=' + players[i].id + '">' + players[i].username + '</a>\n'
				var winner = randomInteger(1, 11)
				winner = await BestUser.findOne({ id1: winner })
				for (var i = 0; i < players.length; i++)
				try {
					await bot.sendMessage(players[i].id, 'В Лотерее \n\n🎁 Выиграл 🎟 <b>№' + winner.id1 + '</b>\n\n📃 Список участников:\n' + players_list + '\n🎁 Победитель <b>' + winner.username + '</b> получает <b>45 ₽ на баланс вывода</b>!', { parse_mode: "HTML", reply_markup: { keyboard: Start, resize_keyboard: true}}).then().catch()
				addoutBal(winner.id, 45 /2)
				await BestUser.remove({})
				}
				catch { }
			}
		}
	} else
		bot.sendMessage(message.chat.id, '❗️<b>Ошибка</b>❗️\n\nВы уже учавствуете в лотерее!', { parse_mode: "HTML", reply_markup: { keyboard: Start, resize_keyboard: true}})
}

if (query.data == "lottery2") {
	var game = JSON.parse((await Gamestat.findOne({ id: 1 })).statusgame)

	if (!game.statuslottery) return bot.answerCallbackQuery(query.id, '🛑 Игра временно отключена администратором', true);

	if ((await FUser.findOne({ id: message.chat.id })) == null) {
		if (message.user.buybalance < 10)
		bot.editMessageText('❗️<b>Ошибка</b>❗️\n\nНедостаточно денег на игровом балансе! Стоимость билета - 10 ₽ ', { chat_id: message.chat.id, message_id: message.message_id, parse_mode: "HTML"})
		else {
			await message.user.dec("buybalance", 10)
			var uid1 = (await FUser.countDocuments({})) + 1
			let player = new FUser({ id: message.chat.id, username: message.chat.first_name, id1: uid1 })
			await player.save()
			bot.editMessageText(`Вы стали участником лотереи 🍀\n\n💳 С вашего баланса снято <b>10 ₽ </b>\n💰 Ваш баланс: <b> ${message.user.buybalance} </b>\n📃 Ваш номер: <b>` + uid1 + '</b>\n🚪Осталось мест: <b>' + (6 - uid1) + '</b>\n\n💣 <i>Игра начнётся, как только будет куплен 6-й билет!</i>', { chat_id: message.chat.id, message_id: message.message_id, parse_mode: "HTML"})

			var players = await FUser.find({})
			if (players.length < 6 && players.length > 1) {
				for (var i = 0; i < (players.length - 1); i++)
					await bot.sendMessage(players[i].id, '📑 Новый участник: <b>' + message.chat.first_name + '</b>\n🚪 Осталось мест:  <b>' + (6 - players.length) + '</b>', { parse_mode: "HTML", reply_markup: { keyboard: Start, resize_keyboard: true}}).then().catch()
			}
			else if (players.length >= 6) {
				var players_list = ''
				for (var i = 0; i < players.length; i++)
					players_list += '<b>' + (i + 1) + ')</b> <a href="tg://user?id=' + players[i].id + '">' + players[i].username + '</a>\n'
				var winner = randomInteger(1, 6)
				winner = await FUser.findOne({ id1: winner })
				for (var i = 0; i < players.length; i++)
				try {
					await bot.sendMessage(players[i].id, 'В Лотерее \n\n🎁 Выиграл 🎟 <b>№' + winner.id1 + '</b>\n\n📃 Список участников:\n' + players_list + '\n🎁 Победитель <b>' + winner.username + '</b> получает <b>50 ₽ на баланс вывода</b>!', { parse_mode: "HTML", reply_markup: { keyboard: Start, resize_keyboard: true}}).then().catch()
				addoutBal(winner.id, 50 /2)
				await FUser.remove({})
				}
				catch { }
			}
		}
	} else
		bot.sendMessage(message.chat.id, '❗️<b>Ошибка</b>❗️\n\nВы уже учавствуете в лотерее!', { parse_mode: "HTML", reply_markup: { keyboard: Start, resize_keyboard: true}})
}

if (query.data == "lottery3") {
	var game = JSON.parse((await Gamestat.findOne({ id: 1 })).statusgame)

	if (!game.statuslottery) return bot.answerCallbackQuery(query.id, '🛑 Игра временно отключена администратором', true);

	if ((await BigUser.findOne({ id: message.chat.id })) == null) {
		if (message.user.buybalance < 25)
		bot.editMessageText('❗️<b>Ошибка</b>❗️\n\nНедостаточно денег на игровом балансе! Стоимость билета - 25 ₽ ', { chat_id: message.chat.id, message_id: message.message_id, parse_mode: "HTML"})
		else {
			await message.user.dec("buybalance", 25)
			var uid1 = (await BigUser.countDocuments({})) + 1
			let player = new BigUser({ id: message.chat.id, username: message.chat.first_name, id1: uid1 })
			await player.save()
			bot.editMessageText(`Вы стали участником лотереи 🍀\n\n💳 С вашего баланса снято <b>25 ₽ </b>\n💰 Ваш баланс: <b> ${message.user.buybalance} </b>\n📃 Ваш номер: <b>` + uid1 + '</b>\n🚪Осталось мест: <b>' + (2 - uid1) + '</b>\n\n💣 <i>Игра начнётся, как только будет куплен 2-й билет!</i>', { chat_id: message.chat.id, message_id: message.message_id, parse_mode: "HTML"})

			var players = await BigUser.find({})
			if (players.length < 2 && players.length > 1) {
				for (var i = 0; i < (players.length - 1); i++)
					await bot.sendMessage(players[i].id, '📑 Новый участник: <b>' + message.chat.first_name + '</b>\n🚪 Осталось мест:  <b>' + (2 - players.length) + '</b>', { parse_mode: "HTML", reply_markup: { keyboard: Start, resize_keyboard: true}}).then().catch()
			}
			else if (players.length >= 2) {
				var players_list = ''
				for (var i = 0; i < players.length; i++)
					players_list += '<b>' + (i + 1) + ')</b> <a href="tg://user?id=' + players[i].id + '">' + players[i].username + '</a>\n'
				var winner = randomInteger(1, 2)
				winner = await BigUser.findOne({ id1: winner })
				for (var i = 0; i < players.length; i++)
				try {
					await bot.sendMessage(players[i].id, 'В Лотерее \n\n🎁 Выиграл 🎟 <b>№' + winner.id1 + '</b>\n\n📃 Список участников:\n' + players_list + '\n🎁 Победитель <b>' + winner.username + '</b> получает <b>45 ₽ на баланс вывода</b>!', { parse_mode: "HTML", reply_markup: { keyboard: Start, resize_keyboard: true}}).then().catch()
				addoutBal(winner.id, 45 /2)
				await BigUser.remove({})
				}
				catch { }
			}
		}
	} else
		bot.sendMessage(message.chat.id, '❗️<b>Ошибка</b>❗️\n\nВы уже учавствуете в лотерее!', { parse_mode: "HTML", reply_markup: { keyboard: Start, resize_keyboard: true}})
}

	if (query.data == 'withdraw') {
//		if (message.user.buybalance < 0) return bot.answerCallbackQuery(query.id, '🚫 Для вывода погасите задолженность на балансе для покупок, накрутчик ебанный!', true);
//		if (message.user.outbalance < 0) return bot.answerCallbackQuery(query.id, '🚫 Для вывода погасите задолженность на балансе для вывода, накрутчик ебанный!', true);
		if (message.user.outbalance < config.minpay) return bot.answerCallbackQuery(query.id, '🚫 Минимальная сумма вывода: '+ config.minpay +'₽', true);
		bot.deleteMessage(message.chat.id, message.message_id);

		await message.user.set('menu', 'qiwi');
		await bot.sendMessage(message.chat.id, 'Введите номер QIWI или Payeer кошелька для вывода:\nНапример: +79001234567 или P123456789', {
			reply_markup: {
				keyboard: Cancel,
				resize_keyboard: true
			}
		});
	}

	if (query.data.startsWith('withdraw:')) {
		let id = Number(query.data.split('withdraw:')[1]);
		let ticket = await Ticket.findOne({ id });

		if (!ticket) bot.deleteMessage(message.chat.id, message.message_id);
		bot.sendMessage("@playgame_money", `💳 <a href="tg://user?id=${ticket.id}">Пользователю</a> была одобрена выплата в размере <b>${ticket.amount}₽</b>`, { parse_mode: "HTML" })

		if (ticket.wallet.indexOf("P") == -1) { // Платёж через QIWI
			qiwi.toWallet({ account: String(ticket.wallet), amount: ticket.amount, comment: 'Выплата от @PlayGoldBot' }, () => { });
		}
		else // Платёж через Payeer
		{
			require('request')({
				method: 'POST',
				url: 'https://payeer.com/ajax/api/api.php',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: `account=${config.payeer.account}&apiId=${config.payeer.apiId}&apiPass=${config.payeer.apiPass}&action=transfer&curIn=RUB&sum=${ticket.amount * 1.01}&curOut=RUB&to=${ticket.wallet}`
			}, async function (error, response, body) {
				body = JSON.parse(body)
			})
		}

		bot.sendMessage(ticket.id, `✅ <b>Ваша выплата была одобрена</b>
💸 На Ваш ${ticket.wallet.indexOf("P") == -1 ? "QIWI" : "Payeer"} зачислено <b>${ticket.amount}₽</b>\n

🙏 Будем очень признательны за отзыв о боте админу или в чат
☺️ Для нас это очень важно\n
🤝 <b>Рады сотрудничать!</b>
`, {
			parse_mode: "html"
		});
		await User.findOneAndUpdate({ id: 0 }, { $inc: { fc: ticket.amount } })
		await User.findOneAndUpdate({ id: 2 }, { $inc: { deposit: -ticket.amount } })
		await User.findOneAndUpdate({ id: id }, { $inc: { payout: ticket.amount } })
		await ticket.remove();
		bot.editMessageText('Выплатил!', {
			chat_id: message.chat.id,
			message_id: message.message_id
		});
	}

	if (query.data.startsWith('back:')) {
		let id = Number(query.data.split('back:')[1]);
		let ticket = await Ticket.findOne({ id });

		if (!ticket) bot.deleteMessage(message.chat.id, message.message_id);

		let user = await User.findOne({ id: ticket.id });
		bot.sendMessage(ticket.id, `Ваша выплата была отклонена, на ваш счёт возвращено ${ticket.amount}₽`);

		await user.inc('buybalance', ticket.amount);
		await User.findOneAndUpdate({ id: 2 }, { $inc: { deposit: -ticket.amount } })
		await ticket.remove();

		return bot.editMessageText('Вернул!', {
			chat_id: message.chat.id,
			message_id: message.message_id
		});
	}

	if (query.data.startsWith('take:')) {
		let id = Number(query.data.split('take:')[1]);
		let ticket = await Ticket.findOne({ id });

		if (!ticket) bot.deleteMessage(message.chat.id, message.message_id);

		await ticket.remove();
		return bot.editMessageText('Забрал!', {
			chat_id: message.chat.id,
			message_id: message.message_id
		});
	}
	var d = query.data

	if (ADMINS.indexOf(query.from.id) !== -1) {
		if (d == "admin_mm") {
			bot.deleteMessage(message.chat.id, message.message_id);
			bot.sendMessage(uid, 'Введите текст рассылки или отправьте изображение:\n\n<i>Для добавления кнопки-ссылки в рассылаемое сообщение добавьте в конец сообщения строку вида:</i>\n# Текст на кнопке # http://t.me/link #', { reply_markup: RM_admin_return, parse_mode: "HTML" })
			state[uid] = 7770
		} else if (d == "admin_w") {
			bot.deleteMessage(message.chat.id, message.message_id);
			let tickets = await Ticket.find();
			if (tickets.length == 0) return bot.sendMessage(uid, 'Заявок на вывод нет');
			await tickets.map((x) => {
				bot.sendMessage(uid, `📝 Игрок: <a href="tg://user?id=${x.id}">Игрок</a> (ID: <code>${x.id}</code>)\n
	💰 Сумма: <code>${x.amount}</code>₽
	🥝 Кошелёк: <code>${x.wallet}</code>`, {
					parse_mode: "HTML", reply_markup: { inline_keyboard: [[{ text: '📭 Подтвердить выплату', callback_data: `withdraw:${x.id}` }], [{ text: '♻️ Вернуть', callback_data: `back:${x.id}` }], [{ text: '🚫 Забрать', callback_data: `take:${x.id}` }]] }
				});
			});
		}
//{"statuschest":false,"statusroulet":false,"statuskoleso":false,"statusmins":false,"statusorel":false,"statusstakan":false,"statuskyrs":false,"statustakan":false,"statusstsakan":true,"statuslottery":false,"statuscase": false}
		else if (d.startsWith("admin_games")) {
			bot.deleteMessage(message.chat.id, message.message_id);
			var game = JSON.parse((await Gamestat.findOne({ id: 1 })).statusgame)
			if (d.split("_")[2] == "falsechest") game.statuschest = false
			if (d.split("_")[2] == "truechest") game.statuschest = true

			if (d.split("_")[2] == "falseroulet") game.statusroulet = false
			if (d.split("_")[2] == "trueroulet") game.statusroulet = true

			if (d.split("_")[2] == "falsekoleso") game.statuskoleso = false
			if (d.split("_")[2] == "truekoleso") game.statuskoleso = true

			if (d.split("_")[2] == "falsemins") game.statusmins = false
			if (d.split("_")[2] == "truemins") game.statusmins = true

			if (d.split("_")[2] == "falseorel") game.statusorel = false
			if (d.split("_")[2] == "trueorel") game.statusorel = true

			if (d.split("_")[2] == "falsestakan") game.statusstakan = false
			if (d.split("_")[2] == "truestakan") game.statusstakan = true

			if (d.split("_")[2] == "falselottery") game.statuslottery = false
			if (d.split("_")[2] == "truelottery") game.statuslottery = true

			if (d.split("_")[2] == "falsekyrs") game.statuskyrs = false
			if (d.split("_")[2] == "truekyrs") game.statuskyrs = true

			if (d.split("_")[2] == "falsecase") game.statuscase = false
			if (d.split("_")[2] == "truecase") game.statuscase = true
			await Gamestat.updateOne({ id: 1, statusgame: JSON.stringify(game) })
			console.log(game)
			bot.sendMessage(uid, `Настройки игр:\n
Сундук: ${game.statuschest ? "✅ Включено" : "🚫 Выключено"}
Рулетка: ${game.statusroulet ? "✅ Включено" : "🚫 Выключено"}
Колесо фортуны: ${game.statuskoleso ? "✅ Включено" : "🚫 Выключено"}
Минное поле: ${game.statusmins ? "✅ Включено" : "🚫 Выключено"}
Орел и Решка: ${game.statusorel ? "✅ Включено" : "🚫 Выключено"}
Стакан: ${game.statusstakan ? "✅ Включено" : "🚫 Выключено"}
Курс: ${game.statuskyrs ? "✅ Включено" : "🚫 Выключено"}
Кейс: ${game.statuscase ? "✅ Включено" : "🚫 Выключено"}
Лоттереи: ${game.statuslottery ? "✅ Включено" : "🚫 Выключено"}
`, {
				reply_markup: {
					inline_keyboard: [
						[{ text: (game.statuschest ? 'Выключить сундуки' : "Включить сундуки"), callback_data: (game.statuschest ? 'admin_games_falsechest' : "admin_games_truechest") }],
						[{ text: (game.statusroulet ? 'Выключить рулетку' : "Включить рулетку"), callback_data: (game.statusroulet ? 'admin_games_falseroulet' : "admin_games_trueroulet") }],
						[{ text: (game.statuskoleso ? 'Выключить колесо фортуны' : "Включить колесо фортуны"), callback_data: (game.statuskoleso ? 'admin_games_falsekoleso' : "admin_games_truekoleso") }],
						[{ text: (game.statusmins ? 'Выключить мины' : "Включить мины"), callback_data: (game.statusmins ? 'admin_games_falsemins' : "admin_games_truemins") }],
						[{ text: (game.statusorel ? 'Выключить орел и решка ' : "Включить Орла и Решку"), callback_data: (game.statusorel ? 'admin_games_falseorel' : "admin_games_trueorel") }],
						[{ text: (game.statusstakan ? 'Выключить стакан ' : "Включить стакан"), callback_data: (game.statusstakan ? 'admin_games_falsestakan' : "admin_games_truestakan") }],
						[{ text: (game.statuskyrs ? 'Выключить курс ' : "Включить курс"), callback_data: (game.statuskyrs ? 'admin_games_falsekyrs' : "admin_games_truekyrs") }],
						[{ text: (game.statuslottery ? 'Выключить лоттереи ' : "Включить лоттереи"), callback_data: (game.statuslottery ? 'admin_games_falselottery' : "admin_games_truelottery") }],
						[{ text: (game.statuscase ? 'Выключить кейс ' : "Включить кейс"), callback_data: (game.statuscase ? 'admin_games_falsecase' : "admin_games_truecase") }],
						[{ text: "◀️ Назад", callback_data: "admin_return" }],
					]
				}, parse_mode: "HTML"
			})
		}		

		else if (d == "admin_top") {
			bot.deleteMessage(message.chat.id, message.message_id);
			var u = await User.find({ ref: { $ne: 0 }, _id: { $gt: mongo.Types.ObjectId.createFromTime(Date.now() / 1000 - 24 * 60 * 60) } })
			console.log(u)
			var top = []
			u.map((e) => {
				var t = top.filter(u => { if (e.ref == u.id) return true; else return false })
				if (t.length == 0) top.push({ id: e.ref, ref: 1 })
				else {
					top = top.filter(u => { if (e.ref == u.id) return false; else return true })
					top.push({ id: e.ref, ref: t[0].ref + 1 })
				}
			})
			top = top.sort((a, b) => { if (a.ref <= b.ref) return 1; else return -1 })
			top.length = 20
			var str = `<b>🕒 Топ инвесторов за 24 часа:</b>\n\n`
			for (const i in top) {
				var us = await User.findOne({ id: top[i].id })
				str += `<b>${Number(i) + 1})</b> <a href="tg://user?id=${us.id}">${us.name ? us.name : "Пользователь"}</a> - <b>${top[i].ref}</b> рефералов\n`
			}
			bot.sendMessage(uid, str, { reply_markup: { inline_keyboard: [[{ text: "◀️ Назад", callback_data: "admin_return" }]] }, parse_mode: "HTML" })
		}
		else if (d == "admin_b") {
			bot.deleteMessage(message.chat.id, message.message_id);
			bot.sendMessage(uid, 'Введите % для бонуса к пополнению или 0 для отключения:', { reply_markup: RM_admin_return, parse_mode: "HTML" })
			state[uid] = 7771
		}

		else if (d == "admin_u") {
			bot.deleteMessage(message.chat.id, message.message_id);
			bot.sendMessage(uid, 'Введите ID пользователя:', { reply_markup: RM_admin_return, parse_mode: "HTML" })
			state[uid] = 7772
		}
		else if (d.split("_")[0] == "addBuyBal") {
			bot.deleteMessage(message.chat.id, message.message_id);
			bot.sendMessage(uid, 'Введите сумму пополнения баланса для покупок пользователя:', { reply_markup: RM_admin_return, parse_mode: "HTML" })
			state[uid] = 7773
			data[uid] = d.split("_")[1]
		}
		else if (d.split("_")[0] == "addOutBal") {
			bot.deleteMessage(message.chat.id, message.message_id);
			bot.sendMessage(uid, 'Введите сумму пополнения баланса для вывода пользователя:', { reply_markup: RM_admin_return, parse_mode: "HTML" })
			state[uid] = 7774
			data[uid] = d.split("_")[1]
		}
		else if (d.split("_")[0] == "addPayIns") {
			bot.deleteMessage(message.chat.id, message.message_id);
			bot.sendMessage(uid, 'Введите сумму для добавления в сумму пополнений пользователя:', { reply_markup: RM_admin_return, parse_mode: "HTML" })
			state[uid] = 777455
			data[uid] = d.split("_")[1]
		}
		else if (d.split("_")[0] == "addPayOuts") {
			bot.deleteMessage(message.chat.id, message.message_id);
			bot.sendMessage(uid, 'Введите сумму для добавления в сумму выводов пользователя:', { reply_markup: RM_admin_return, parse_mode: "HTML" })
			state[uid] = 77745555
			data[uid] = d.split("_")[1]
		}
		else if (d.split("_")[0] == "editBuyBal") {
			bot.deleteMessage(message.chat.id, message.message_id);
			bot.sendMessage(uid, 'Введите новый баланс для покупок пользователя:', { reply_markup: RM_admin_return, parse_mode: "HTML" })
			state[uid] = 7775
			data[uid] = d.split("_")[1]
		}
		else if (d.split("_")[0] == "editOutBal") {
			bot.deleteMessage(message.chat.id, message.message_id);
			bot.sendMessage(uid, 'Введите новый баланс для вывода пользователя:', { reply_markup: RM_admin_return, parse_mode: "HTML" })
			state[uid] = 7776
			data[uid] = d.split("_")[1]
		}
		else if (d.split("_")[0] == "editPayIns") {
			bot.deleteMessage(message.chat.id, message.message_id);
			bot.sendMessage(uid, 'Введите новую сумму пополнений пользователя:', { reply_markup: RM_admin_return, parse_mode: "HTML" })
			state[uid] = 777655
			data[uid] = d.split("_")[1]
		}
		else if (d.split("_")[0] == "editPayOuts") {
			bot.deleteMessage(message.chat.id, message.message_id);
			bot.sendMessage(uid, 'Введите новую сумму выводов пользователя:', { reply_markup: RM_admin_return, parse_mode: "HTML" })
			state[uid] = 77765555
			data[uid] = d.split("_")[1]
		}
		else if (d == "a_voucherpromo") {
			bot.deleteMessage(message.chat.id, message.message_id);
			bot.sendMessage(uid, 'Выбери баланс для создания промо', { reply_markup: RM_promo, parse_mode: "HTML" })
		}
		else if (d == "voucherbuy") {
			bot.deleteMessage(message.chat.id, message.message_id);
			bot.sendMessage(uid, 'Ввведи сумму', { reply_markup: RM_admin_return, parse_mode: "HTML" })
			state[uid] = 99999
		}
		else if (d == "voucherout") {
			bot.deleteMessage(message.chat.id, message.message_id);
			bot.sendMessage(uid, 'Ввведи сумму', { reply_markup: RM_admin_return, parse_mode: "HTML" })
			state[uid] = 10000
		}

		else if (d == "admin_mm_stop") {
			var tek = Math.round((mm_i / mm_total) * 40)
			var str = ""
			for (var i = 0; i < tek; i++) str += "+"
			str += '>'
			for (var i = tek + 1; i < 41; i++) str += "-"
			mm_status = false;
			bot.editMessageText("Рассылка остановлена!", { chat_id: mm_achatid, message_id: mm_amsgid })
			mm_u = []
		}
		else if (d == "admin_mm_pause") {
			var tek = Math.round((mm_i / mm_total) * 40)
			var str = ""
			for (var i = 0; i < tek; i++) str += "+"
			str += '>'
			for (var i = tek + 1; i < 41; i++) str += "-"
			bot.editMessageText("<b>Выполнено:</b> " + mm_i + '/' + mm_total + ' - ' + Math.round((mm_i / mm_total) * 100) + '%\n' + str + "\n\n<b>Статистика:</b>\n<b>Успешных:</b> " + mm_ok + "\n<b>Неуспешных:</b> " + mm_err, { chat_id: mm_achatid, message_id: mm_amsgid, reply_markup: RM_mm2, parse_mode: html })
			mm_status = false;
		}
		else if (d == "admin_mm_play") {
			mm_status = true;
			bot.editMessageText("Выполнено: " + mm_i + '/' + mm_total + ' - ' + Math.round((mm_i / mm_total) * 100) + '%\n', { chat_id: mm_achatid, message_id: mm_amsgid, reply_markup: RM_mm1 })
		}
		else if (d.split("_")[0] == "ban") {
			var uuid = Number(d.split("_")[1])
			await User.findOneAndUpdate({ id: uuid }, { ban: true })
			bot.editMessageText('<a href="tg://user?id=' + uuid + '">Пользователь</a> заблокирован!', { chat_id: uid, message_id: message.message_id, parse_mode: html })
		}
		else if (d.split("_")[0] == "unban") {
			var uuid = Number(d.split("_")[1])
			await User.findOneAndUpdate({ id: uuid }, { ban: false })
			bot.editMessageText('<a href="tg://user?id=' + uuid + '">Пользователь</a> разбанен!', { chat_id: uid, message_id: message.message_id, parse_mode: html })
		}
		else if (d == "admin_return") {
			bot.deleteMessage(message.chat.id, message.message_id);
			var h = process.uptime() / 3600 ^ 0
			var m = (process.uptime() - h * 3600) / 60 ^ 0
			var s = process.uptime() - h * 3600 - m * 60 ^ 0
			var heap = process.memoryUsage().rss / 1048576 ^ 0
			var b = (await User.findOne({ id: 0 })).deposit
			return qiwi.getBalance(async (err, balance) => {
				bot.sendMessage(uid, '<b>Админ-панель:</b>\n\n<b>Аптайм бота:</b> ' + h + ' часов ' + m + ' минут ' + s + ' секунд\n<b>Пользователей в боте: </b>' + (await User.countDocuments({})) + '\n<b>Памяти использовано:</b> ' + heap + "МБ\n<b>Заявок на вывод:</b> " + await Ticket.countDocuments() + "\n<b>Баланс QIWI:</b> " + balance.accounts[0].balance.amount + "₽\n<b>Бонус к пополнению:</b> " + b + "%", { parse_mode: "HTML", reply_markup: RM_admin })
			})
		}
		else if (d == "admin_finanses") {
			bot.deleteMessage(message.chat.id, message.message_id);
			var exp = (await User.findOne({ id: 2 })).deposit
			var out = (await User.findOne({ id: 0 })).fc
			var dep = (await User.findOne({ id: 0 })).ref
			return qiwi.getBalance(async (err, balance) => {
			bot.sendMessage(uid, '<b>Транзакции</b>\n\n<b>Ожидают:</b> ' + exp + ' ₽\n<b>Выплачено: </b>' + out + ' ₽\n<b>Пополнено:</b> ' + dep + ' ₽\n<b>Баланс Qiwi:</b> ' + balance.accounts[0].balance.amount + " ₽", { 
				parse_mode: "HTML", 
				reply_markup: {
				inline_keyboard: [
					[{ text: "💰 История пополнений", callback_data: "admin_deposit" }]
				]
			}})
		})
		}
		else if (d == "admin_deposit") {
			bot.deleteMessage(message.chat.id, message.message_id)
			var time = new Date()
			time.setHours(0, 0, 0, 0)
			var todayStartTime = time.getTime()
			var weekStartTime = getMonday(new Date()).getTime()
			time = new Date()
			time.setDate(0)
			var monthStartTime = time.getTime()
		  try { var sumAllTime = (await Deposit.aggregate([{ $match: {}, }, { $group: { _id: null, total: { $sum: "$amount" } } }], (e) => { }))[0].total } catch { var sumAllTime = 0 } 
		  try { var sumToday = (await Deposit.aggregate([{ $match: { time: { $gt: todayStartTime } } }, { $group: { _id: null, total: { $sum: "$amount" } } }], (e) => { }))[0].total } catch { var sumToday = 0 }
			try { var sumThisWeek = (await Deposit.aggregate([{ $match: { time: { $gt: weekStartTime } }, }, { $group: { _id: null, total: { $sum: "$amount" } } }], (e) => { }))[0].total } catch { var sumThisWeek = 0 }
			try { var sumThisMonth = (await Deposit.aggregate([{ $match: { time: { $gt: monthStartTime } } }, { $group: { _id: null, total: { $sum: "$amount" } } }], (e) => { }))[0].total } catch { var sumThisMonth = 0 }
			var lastTx = await Deposit.find({}).sort({ time: -1 }).limit(10) 
			bot.sendMessage(uid, `
<b>Статистика депозитов:</b>\n
<b>Всего пополнений:</b> ${await Deposit.countDocuments({})} на ${sumAllTime}₽
<b>Пополнений за сегодня:</b> ${await Deposit.countDocuments({ time: { $gt: todayStartTime } })} на ${sumToday}₽
<b>Пополнений за эту неделю:</b> ${await Deposit.countDocuments({ time: { $gt: weekStartTime } })} на ${sumThisWeek}₽
<b>Пополнений за этот месяц:</b> ${await Deposit.countDocuments({ time: { $gt: monthStartTime } })} на ${sumThisMonth}₽\n
<b>Последние 10 пополнений:</b>
${lastTx.map((o) => { return `<b>${o.amount}₽</b> - <a href="tg://user?id=${o.creator_id}">${o.creator_id}</a> - <i>${o.txnId}</i>` }).join("\n")}
			`, { parse_mode: "HTML" });
		}
		else if (d == "admin_parametr") {
			var params = await Config.find()
			bot.editMessageText(`<b>Текущие параметры бота:</b>\n\n${params.map((o) => { return `<code>${o.parameter}</code> - ${o.value} - <i>${o.description}</i>` }).join("\n")}`, { 
				chat_id: uid, 
				message_id: message.message_id, 
				parse_mode: html, 
				webPreview: false,
				reply_markup: {
					inline_keyboard: [
						[{ text: "Изменить параметры", callback_data: "admin_setparametrs" }],
						[{ text: "◀️ Назад", callback_data: "admin_return" }]
					]
				}
			})
		}
		else if (d == "admin_setparametrs") {
			bot.deleteMessage(message.chat.id, message.message_id)
			bot.sendMessage(uid, "Для изменения параметров бота введите новые параметры в формате <i>ключ = значение</i>:", { reply_markup: RM_admin_return, parse_mode: html })
			state[uid] = 10001
		}
	}
});

var state = []


User.prototype.inc = function (field, value = 1) {
	this[field] += value;
	return this.save();
}

User.prototype.dec = function (field, value = 1) {
	this[field] -= value;
	return this.save();
}

User.prototype.set = function (field, value) {
	this[field] = value;
	return this.save();
}


setInterval(async () => {
	qiwi.getOperationHistory({ rows: 10, operation: 'IN' }, (err, response) => {
		response.data.map(async (x) => {
			if (!x.comment) return;
			if (txnId.indexOf(x.txnId) !== -1) return;
			if (x.comment.startsWith('gamegld')) {
				let id = Number(x.comment.split("gamegld")[1]);
				let user = await User.findOne({ id });
				if (!user) return;
				await user.inc('game_payin', x.sum.amount);
				await user.inc('buybalance', x.sum.amount);
				await bot.sendMessage(id, `💳 Вы успешно пополнили свой игровой баланс на ${x.sum.amount}₽`);
				bot.sendMessage("@viplatu_marvel", `🎖️ <a href="tg://user?id=${id}">Пользователь</a> пополнил игровой баланс на <b>${x.sum.amount}₽</b>`, { parse_mode: "HTML" })
				txnId.push(x.txnId)
				require('fs').writeFileSync('./txnId.json', JSON.stringify(txnId));
				return
			}
			let id = Number(x.comment.split("gamebot")[1]);
			if (!id) return;
			let user = await User.findOne({ id });
			if (!user) return;
			if (x.sum.currency != 643) return;
			var b = (await User.findOne({ id: 0 })).deposit
			var sum = x.sum.amount
/*
			if (b > 0) {
				await user.inc('deposit', x.sum.amount);
				await user.inc('buybalance', x.sum.amount + x.sum.amount * b);
				await User.findOneAndUpdate({ id: 0 }, { $inc: { ref: x.sum.amount } })
				await (new Deposit({ creator_id: id, amount: x.sum.amount, time: (new Date()).getTime(), txnId: x.txnId })).save()
				bot.sendMessage(id, `Ваш баланс пополнен на ${x.sum.amount}₽ и Вы получаете бонус - ${roundPlus(x.sum.amount * b)}₽!`);
			//	bot.sendMessage("@viplatu_marvel", `🎖️ <a href="tg://user?id=${id}">Пользователь</a> пополнил баланс на <b>${x.sum.amount}₽</b> и получил ${roundPlus(x.sum.amount * b)}₽ бонусом через <b>QIWI</b>`, { parse_mode: "HTML" })
				ADMINS.map((a) => bot.sendMessage(a, `<a href="tg://user?id=${id}">Игрок</a> сделал депозит: ${x.sum.amount}₽ + ${roundPlus(x.sum.amount * b)}₽ бонус`, { parse_mode: "HTML" }))

			} */
			if (b == 0) {
				await user.inc('deposit', x.sum.amount);
				await user.inc('buybalance', x.sum.amount);
				await User.findOneAndUpdate({ id: 0 }, { $inc: { ref: x.sum.amount } })
				await (new Deposit({ creator_id: id, amount: x.sum.amount, time: (new Date()).getTime(), txnId: x.txnId })).save()
				bot.sendMessage(id, `Ваш баланс пополнен на ${x.sum.amount}₽`);
			//	bot.sendMessage("@viplatu_marvel", `🎖️ <a href="tg://user?id=${id}">Пользователь</a> пополнил баланс на <b>${x.sum.amount}₽</b> через <b>QIWI</b>`, { parse_mode: "HTML" })
				ADMINS.map((a) => bot.sendMessage(a, `<a href="tg://user?id=${id}">Игрок</a> сделал депозит: ${x.sum.amount}₽`, { parse_mode: "HTML" }))
			} else {
				await user.inc('deposit', x.sum.amount);
				b = b / 100
				await user.inc('buybalance', x.sum.amount + x.sum.amount * b);
				await User.findOneAndUpdate({ id: 0 }, { $inc: { ref: x.sum.amount } })
				await (new Deposit({ creator_id: id, amount: x.sum.amount, time: (new Date()).getTime(), txnId: x.txnId })).save()
				bot.sendMessage(id, `Ваш баланс пополнен на ${x.sum.amount}₽ и Вы получаете бонус - ${roundPlus(x.sum.amount * b)}₽!`);
			//	bot.sendMessage("@viplatu_marvel", `🎖️ <a href="tg://user?id=${id}">Пользователь</a> пополнил баланс на <b>${x.sum.amount}₽</b> и получил ${roundPlus(x.sum.amount * b)}₽ бонусом  через <b>QIWI</b>`, { parse_mode: "HTML" })
				ADMINS.map((a) => bot.sendMessage(a, `<a href="tg://user?id=${id}">Игрок</a> сделал депозит: ${x.sum.amount}₽ + ${roundPlus(x.sum.amount * b)}₽ бонус`, { parse_mode: "HTML" }))

			}
			await User.findOneAndUpdate({ id: user.ref }, { $inc: { buybalance: roundPlus(x.sum.amount * 0.05) } })

			bot.sendMessage(user.ref, `💰 Ваш <a href="tg://user?id=${id}">партнёр</a> пополнил свой баланс на <b>${x.sum.amount}₽</b>!\n🎲 Вам начислено <b>${roundPlus(x.sum.amount * 0.05)}₽</b> на игровой баланс`, { parse_mode: "HTML" }).catch()

			txnId.push(x.txnId)
			require('fs').writeFileSync('./txnId.json', JSON.stringify(txnId));
		});
	});
}, 10000);

async function mmTick() {
	if (mm_status) {
		try {
			mm_i++
			if (mm_type == "text") {
				if (mm_btn_status)
					bot.sendMessage(mm_u[mm_i - 1], mm_text, { reply_markup: { inline_keyboard: [[{ text: mm_btn_text, url: mm_btn_link }]] }, parse_mode: html }).then((err) => { mm_ok++ }).catch((err) => { mm_err++ })
				else
					bot.sendMessage(mm_u[mm_i - 1], mm_text, { parse_mode: html }).then((err) => { console.log((mm_i - 1) + ') ID ' + mm_u[mm_i - 1] + " OK"); mm_ok++ }).catch((err) => { mm_err++ })
			}
			else if (mm_type == "img") {
				if (mm_btn_status)
					bot.sendPhoto(mm_u[mm_i - 1], mm_imgid, { caption: mm_text, reply_markup: { inline_keyboard: [[{ text: mm_btn_text, url: mm_btn_link }]] } }).then((err) => { mm_ok++ }).catch((err) => { mm_err++ })
				else
					bot.sendPhoto(mm_u[mm_i - 1], mm_imgid, { caption: mm_text }).then((err) => { console.log((mm_i - 1) + ') ID ' + mm_u[mm_i - 1] + " OK"); mm_ok++ }).catch((err) => { mm_err++ })
			}
			if (mm_i % 10 == 0) {
				var tek = Math.round((mm_i / mm_total) * 40)
				var str = ""
				for (var i = 0; i < tek; i++) str += "+"
				str += '>'
				for (var i = tek + 1; i < 41; i++) str += "-"
				bot.editMessageText("<b>Выполнено:</b> " + mm_i + '/' + mm_total + ' - ' + Math.round((mm_i / mm_total) * 100) + '%\n' + str + "\n\n<b>Статистика:</b>\n<b>Успешных:</b> " + mm_ok + "\n<b>Неуспешных:</b> " + mm_err, { chat_id: mm_achatid, message_id: mm_amsgid, reply_markup: RM_mm1, parse_mode: html })
			}
			if (mm_i == mm_total) {
				mm_status = false;
				bot.editMessageText("Выполнено: " + mm_i + '/' + mm_total, { chat_id: mm_achatid, message_id: mm_amsgid })
				sendAdmins('<b>Рассылка завершена!\n\nСтатистика:\nУспешно:</b> ' + mm_ok + "\n<b>Неуспешно:</b> " + mm_err, { parse_mode: html })
				mm_u = []
			}
		} finally { }
	}
}

setInterval(mmTick, 100);

var mm_total
var mm_i
var mm_status = false
var mm_amsgid
var mm_type
var mm_imgid
var mm_text
var mm_achatid
var mm_btn_status
var mm_btn_text
var mm_btn_link
var mm_ok
var mm_err

async function mm_t(text, amsgid, achatid, btn_status, btn_text, btn_link, size) {
	let ut = await User.find({}, { id: 1 }).sort({ _id: -1 })
	mm_total = ut.length
	console.log(ut)
	mm_u = []
	for (var i = 0; i < mm_total; i++)
		mm_u[i] = ut[i].id
	if (size != 100) {
		mm_u = randomizeArr(mm_u)
		mm_total = Math.ceil(mm_total * (size / 100))
		mm_u.length = mm_total
	}
	ut = undefined
	mm_i = 0;
	mm_amsgid = amsgid
	mm_type = "text"
	mm_text = text
	mm_ok = 0
	mm_err = 0
	mm_achatid = achatid
	if (btn_status) {
		mm_btn_status = true
		mm_btn_text = btn_text
		mm_btn_link = btn_link
	}
	else
		mm_btn_status = false
	mm_status = true;
}

bot.on('photo', async msg => {
	if (msg.from != undefined) {
		var uid = msg.from.id
		if (state[uid] == 7770 && ADMINS.indexOf(uid) !== -1) {
			state[uid] = undefined
			var text = ""
			if (msg.caption != undefined) text = msg.caption
			bot.sendMessage(uid, "Рассылка запущена!").then((e) => {
				if (text.split("#").length == 4) {
					var btn_text = text.split("#")[1].split("#")[0].replace(/(^\s*)|(\s*)$/g, '')
					var btn_link = text.split("#")[2].split("#")[0].replace(/(^\s*)|(\s*)$/g, '')
					text = text.split("#")[0].replace(/(^\s*)|(\s*)$/g, '').replace(' ', '')
					mm_img(msg.photo[msg.photo.length - 1].file_id, text, e.message_id, e.chat.id, true, btn_text, btn_link, 100)

				}
				else
					mm_img(msg.photo[msg.photo.length - 1].file_id, text, e.message_id, e.chat.id, false, false, false, 100)

			})
		}
	}
})



async function mm_img(img, text, amsgid, achatid, btn_status, btn_text, btn_link, size) {
	let ut = await User.find({}, { id: 1 }).sort({ _id: -1 })
	mm_total = ut.length
	mm_u = []
	for (var i = 0; i < mm_total; i++)
		mm_u[i] = ut[i].id
	if (size != 100) {
		mm_u = randomizeArr(mm_u)
		mm_total = Math.ceil(mm_total * (size / 100))
		mm_u.length = mm_total
	}

	ut = undefined
	mm_i = 0;
	mm_amsgid = amsgid
	mm_type = "img"
	mm_text = text
	mm_imgid = img
	mm_ok = 0
	mm_err = 0
	mm_achatid = achatid
	if (btn_status) {
		mm_btn_status = true
		mm_btn_text = btn_text
		mm_btn_link = btn_link
	}
	else
		mm_btn_status = false
	mm_status = true;
}

function randomizeArr(arr) {
	var j, temp;
	for (var i = arr.length - 1; i > 0; i--) {
		j = Math.floor(Math.random() * (i + 1));
		temp = arr[j];
		arr[j] = arr[i];
		arr[i] = temp;
	}
	return arr;
}

const html = "HTML"

function sendAdmins(text, params) { for (var i = 0; i < ADMINS.length; i++) bot.sendMessage(ADMINS[i], text, params) }

var data = []


function roundPlus(number) { if (isNaN(number)) return false; var m = Math.pow(10, 2); return Math.round(number * m) / m; }

async function main() {
	var u = (await User.find({}, { id: 1 })).map((e) => { return e.id })
	for (var i in u) {
		await User.findOneAndUpdate({ id: u[i] }, { refCount: await User.countDocuments({ ref: u[i] }) })
		console.log(i)
	}

}
//main()




//User.updateMany({}, {payout: 0, not: false}).then()

async function totalEarnCalc() {
	var users = await User.find()
	for (const i in users) {
		try {
			var user = users[i]
			let total_earn = 0;
			user.trees.map((x) => {
				total_earn += trees.find((a) => a.id == x.id).earn
			})
			await User.findOneAndUpdate({ id: user.id }, { totalEarn: total_earn })
			console.log(i + "/" + users.length + " - " + total_earn)
		}
		catch { }
	}
}
setInterval(totalEarnCalc, 1000 * 60 * 15)



async function ticker() {
	var d = new Date()
	var minutes = d.getMinutes()
	var hours = d.getHours()
	var date = d.getDate()
	if (minutes == 0 && hours == 0 && (date == 5 || date == 15 || date == 25))
		clanWar()
	if (minutes == 0 && hours == 0)
		await User.updateMany({}, { game_limit: 5, spinsToday: 0 })
}

setInterval(ticker, 1000 * 60)

function randomizeArr(arr) {
	var j, temp;
	for (var i = arr.length - 1; i > 0; i--) {
		j = Math.floor(Math.random() * (i + 1));
		temp = arr[j];
		arr[j] = arr[i];
		arr[i] = temp;
	}
	return arr;
}

function randomInteger(min, max) {
	// случайное число от min до (max+1)
	let rand = min + Math.random() * (max + 1 - min);
	return Math.floor(rand);
}

initConfig()

async function initConfig() {
    var cfg = await Config.find()
    cfg.map((o) => { config[o.parameter] = o.value; console.log(`Parameter ${o.parameter} setted to ${o.value}`) })
}

function getMonday(d) {
    d = new Date(d);
    var day = d.getDay(),
        diff = d.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
    d.setDate(diff)
    d.setHours(0, 0, 0, 0)
    return new Date(d);
}

bot.on("photo", msg => { console.log(msg) })
