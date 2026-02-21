require("dotenv").config();
const { Telegraf, Markup, Scenes, session } = require("telegraf");
const { WizardScene } = Scenes;

const bot = new Telegraf(process.env.BOT_TOKEN);

const adminChatIds = process.env.ADMIN_CHAT_IDS.split(',').map(id => id.trim());

async function notifyAdmins(message, parseMode = "Markdown") {
  for (const id of adminChatIds) {
    try {
      await bot.telegram.sendMessage(id, message, { parse_mode: parseMode });
    } catch (e) {
      console.log(`Ошибка отправки админу ${id}:`, e.message);
    }
  }
}

const tariffs = [
  {
    id: "start",
    name: "Старт",
    basePrice: 9000,
    description: "Одностраничный сайт (Landing Page)\nСовременный дизайн\nАдаптация под телефон\nРазмещение на GitHub Pages\nПодключение формы связи",
    normalTime: "1–1.5 недели",
    urgentTime: "5–7 дней"
  },
  {
    id: "business",
    name: "Бизнес",
    basePrice: 22000,
    description: "Индивидуальный дизайн\nДомен + хостинг (помощь)\nАдаптация под все устройства\nБазовая SEO-настройка\nПодключение форм, мессенджеров\nПодключение аналитики",
    normalTime: "2–3 недели",
    urgentTime: "10–12 дней"
  },
  {
    id: "premium",
    name: "Премиум",
    basePrice: 39000,
    description: "Оплата на сайте\nРегистрация пользователей\nЛичный кабинет\nПовышенная безопасность\nСложная логика",
    normalTime: "3–4 недели",
    urgentTime: "2–2.5 недели"
  },
  {
    id: "professional",
    name: "Профессиональный",
    basePrice: 55000,
    description: "Всё из тарифа «Премиум»\nАдмин-панель\nВозможность добавлять видео, кейсы, отзывы, фото, статьи",
    normalTime: "4–5 недель",
    urgentTime: "3 недели"
  },
  {
    id: "lux",
    name: "Люкс",
    basePrice: 100000,
    description: "Премиальный дизайн\nСложная анимация и эффекты\nМаксимальная SEO-настройка\nИнтеграции (CRM, API, сервисы)\nВысокая скорость и оптимизация\nИндивидуальная архитектура проекта\nПриоритетная разработка",
    normalTime: "4–6 недель",
    urgentTime: "3–4 недели"
  },
];

function getTariffById(id) {
  return tariffs.find(t => t.id === id);
}

bot.use(session());

async function sendTariffSelection(ctx) {
  const buttons = tariffs.map(t => [Markup.button.callback(t.name, `tariff_${t.id}`)]);
  buttons.push([Markup.button.callback("🏠 В меню", "back_to_main")]);
  await ctx.reply(
    "Выберите тариф:",
    Markup.inlineKeyboard(buttons)
  );
}

async function sendDesignQuestion(ctx) {
  await ctx.reply(
    "Нужна ли разработка дизайна? (если у вас уже есть готовый дизайн-макет, выберите «Нет»)",
    Markup.inlineKeyboard([
      [Markup.button.callback("✅ Да (+5000₽)", "design_yes")],
      [Markup.button.callback("❌ Нет", "design_no")],
      [Markup.button.callback("🔙 Назад", "back_to_tariff")],
      [Markup.button.callback("🏠 В меню", "back_to_main")]
    ])
  );
}

async function sendTimeQuestion(ctx) {
  if (!ctx.session.calculator || !ctx.session.calculator.tariff) {
    await ctx.reply("Сессия сброшена. Начнём заново.");
    return ctx.scene.enter("calculator-wizard");
  }

  const tariff = ctx.session.calculator.tariff;
  const normalTimeText = `Обычные сроки (${tariff.normalTime})`;
  const urgentTimeText = `Срочно (+5000₽, ${tariff.urgentTime})`;

  await ctx.reply(
    "Выберите сроки выполнения:",
    Markup.inlineKeyboard([
      [Markup.button.callback(normalTimeText, "time_normal")],
      [Markup.button.callback(urgentTimeText, "time_urgent")],
      [Markup.button.callback("🔙 Назад", "back_to_design")],
      [Markup.button.callback("🏠 В меню", "back_to_main")]
    ])
  );
}
const calculatorWizard = new WizardScene(
  "calculator-wizard",

  async (ctx) => {
    ctx.session.calculator = {};
    await ctx.reply("Калькулятор стоимости", Markup.removeKeyboard());
    await sendTariffSelection(ctx);
    return ctx.wizard.next();
  },

  async (ctx) => {
    if (!ctx.callbackQuery) return;
    const data = ctx.callbackQuery.data;
    await ctx.answerCbQuery();

    if (data === "back_to_main") {
      ctx.session.calculator = null;
      await ctx.scene.leave();
      return exitToMainMenu(ctx);
    }    

    if (data.startsWith("tariff_")) {
      const tariffId = data.replace("tariff_", "");
      const tariff = getTariffById(tariffId);
      if (!tariff) {
        await ctx.reply("Ошибка, попробуйте снова");
        return ctx.scene.leave();
      }
      ctx.session.calculator.tariff = tariff;
      await ctx.reply(
        `Вы выбрали тариф *${tariff.name}*.\n\n${tariff.description}\n\nБазовая стоимость: ${tariff.basePrice}₽`,
        { parse_mode: "Markdown" }
      );
      await sendDesignQuestion(ctx);
      return ctx.wizard.next();
    } else {
      await ctx.reply("Пожалуйста, выберите тариф кнопками.");
    }
  },

  async (ctx) => {
    if (!ctx.callbackQuery) return;
    const data = ctx.callbackQuery.data;
    await ctx.answerCbQuery();

    if (data === "back_to_main") {
      ctx.session.calculator = null;
      await ctx.scene.leave();
      return exitToMainMenu(ctx);
    }

    if (data === "back_to_tariff") {
      delete ctx.session.calculator.design;
      delete ctx.session.calculator.urgent;
      await sendTariffSelection(ctx);
      return ctx.wizard.selectStep(1);
    }

    if (data === "design_yes") {
      ctx.session.calculator.design = true;
      await ctx.reply("✅ Дизайн будет разработан (+5000₽)");
    } else if (data === "design_no") {
      ctx.session.calculator.design = false;
      await ctx.reply("❌ Дизайн не требуется");
    } else {
      await ctx.reply("Пожалуйста, выберите вариант кнопками.");
      return;
    }

    await sendTimeQuestion(ctx);
    return ctx.wizard.next();
  },

  async (ctx) => {
    if (!ctx.callbackQuery) return;
    const data = ctx.callbackQuery.data;
    await ctx.answerCbQuery();

    if (data === "back_to_main") {
      ctx.session.calculator = null;
      await ctx.scene.leave();
      return exitToMainMenu(ctx);
    }    

    if (data === "back_to_design") {
      delete ctx.session.calculator.urgent;
      await sendDesignQuestion(ctx);
      return ctx.wizard.selectStep(2);
    }

    if (data === "time_normal") {
      ctx.session.calculator.urgent = false;
    } else if (data === "time_urgent") {
      ctx.session.calculator.urgent = true;
    } else {
      await ctx.reply("Пожалуйста, выберите сроки кнопками.");
      return;
    }

    const tariff = ctx.session.calculator.tariff;
    let total = tariff.basePrice;
    if (ctx.session.calculator.design) total += 5000;
    if (ctx.session.calculator.urgent) total += 5000;

    const designText = ctx.session.calculator.design ? "✅ Дизайн (включён)" : "❌ Дизайн (не требуется)";
    const timeText = ctx.session.calculator.urgent
      ? `⏱ Срочно (${tariff.urgentTime})`
      : `⏱ Обычные сроки (${tariff.normalTime})`;

    const resultMessage = `
🎯 *Ваш расчёт:*

Тариф: *${tariff.name}*
${designText}
${timeText}

💰 *Итоговая стоимость: ${total}₽*

Спасибо за использование калькулятора! Наш менеджер скоро свяжется с вами.
    `;

    await ctx.reply(resultMessage, { parse_mode: "Markdown" });

    const managerMessage = `
📩 *Новая заявка из калькулятора*
👤 Пользователь: @${ctx.from.username || "нет username"} (ID: ${ctx.from.id})

Тариф: *${tariff.name}*
Дизайн: ${ctx.session.calculator.design ? "Да (+5000₽)" : "Нет"}
Срочность: ${ctx.session.calculator.urgent ? `Срочно (+5000₽) — ${tariff.urgentTime}` : `Обычная — ${tariff.normalTime}`}
💰 *Итоговая стоимость: ${total}₽*
    `;
    await notifyAdmins(managerMessage);

    await ctx.reply(
      "Вы можете сразу написать менеджеру или пересчитать заново:",
      Markup.inlineKeyboard([
        [Markup.button.url("💬 Написать менеджеру", "https://t.me/ilnaz_manager")],
        [Markup.button.callback("🔄 Рассчитать заново", "restart_calculator")],
        [Markup.button.callback("🏠 В меню", "back_to_main")]
      ])
    );

    return ctx.scene.leave();
  }
);

const stage = new Scenes.Stage([calculatorWizard]);
bot.use(stage.middleware());

async function exitToMainMenu(ctx) {
  await ctx.reply(
    "Главное меню:",
    Markup.keyboard([
      ["💰 Рассчитать стоимость", "📩 Оставить заявку"],
      ["🎨 Наши проекты", "❓ Вопросы и ответы"],
      ["💬 Связаться с менеджером"]
    ]).resize()
  );
}

bot.action("restart_calculator", async (ctx) => {
  await ctx.answerCbQuery().catch(() => {});
  
  if (ctx.session) {
    ctx.session.calculator = null;
  }

  return ctx.scene.enter("calculator-wizard");
});

bot.action("back_to_main", async (ctx) => {
  await ctx.answerCbQuery().catch(() => {});
  
  if (ctx.session) {
    ctx.session.calculator = null;
  }

  await ctx.scene.leave().catch(() => {});
  await exitToMainMenu(ctx);
});

bot.start((ctx) => {
  ctx.reply(
    `Привет! Я бот студии AURIX.\nВыберите, что хотите сделать:`,
    Markup.keyboard([
      ["💰 Рассчитать стоимость", "📩 Оставить заявку"],
      ["🎨 Наши проекты", "❓ Вопросы и ответы"],
      ["💬 Связаться с менеджером"]
    ]).resize()
  );
});

bot.hears("💰 Рассчитать стоимость", async (ctx) => {
  await ctx.scene.enter("calculator-wizard");
});

bot.hears("📩 Оставить заявку", async (ctx) => {
  const user = ctx.from;
  const message = `📩 *Новая заявка* от пользователя @${user.username || "нет username"} (ID: ${user.id})\nЖелает, чтобы с ним связались.`;
  await notifyAdmins(message);
  await ctx.reply(
    "Спасибо! Мы передали вашу заявку менеджерам. Они свяжутся с вами в ближайшее время. Если хотите ускорить процесс, напишите напрямую: @ilnaz_manager",
    Markup.keyboard([["⬅️ Назад"]]).resize()
  );
});

bot.hears("🎨 Наши проекты", (ctx) => {
  ctx.reply(
    "Наши проекты:",
    Markup.inlineKeyboard([
      [Markup.button.url("🚀 Инфопродукт", "https://meliqyanarmenak-droid.github.io/info-prod/")],
      [Markup.button.url("🎬 Портфолио монтажа", "https://meliqyanarmenak-droid.github.io/editing-portfolio/")],
      [Markup.button.url("💼 Портфолио сайта", "https://meliqyanarmenak-droid.github.io/portfolio/")],
      [Markup.button.callback("⬅️ Назад", "back_to_main")]
    ]),
  );
});

bot.hears("❓ Вопросы и ответы", (ctx) => {
  ctx.reply(
    `FAQ:
1️⃣ Как долго делается сайт?
1–3 недели в зависимости от тарифа, сложности и скорости согласования

2️⃣ Как высчитывается цена?
Стоимость рассчитывается через калькулятор внутри бота на основе задач и функционала

3️⃣ Сколько стоит обслуживание?
3–4 тыс ₽/мес в зависимости от тарифа и объёма работ

4️⃣ Что входит в обслуживание?
Ежемесячное обслуживание включает:
- техническую поддержку сайта
- исправление мелких багов
- обновление контента (фото, текст)
- контроль работоспособности
- резервные копии
- продление домена и хостинга (если через нас)

5️⃣ Нужна ли предоплата?
Да, работа начинается после полной или частичной предоплаты. В случае частичной предоплаты оставшаяся часть выплачивается после готовности сайта

6️⃣ Делаете ли сайты под ключ?
Да, создаём сайт полностью под ключ - от идеи до запуска

7️⃣ Сайт будет адаптирован под телефон?
Да, все сайты полностью адаптивные и корректно работают на телефонах и планшетах

8️⃣ Можно ли вносить правки?
Да, правки входят в процесс разработки. Объём зависит от тарифа

9️⃣ Помогаете ли с дизайном и текстом?
Да, помогаем с дизайном, структурой и текстами при необходимости

🔟 Подключаете домен и хостинг?
Да, можем полностью настроить домен, хостинг и запуск сайта

1️⃣1️⃣ Будет ли у меня доступ к сайту?
Да, после сдачи проекта вы получаете полный доступ к сайту

1️⃣2️⃣ Что если сайт перестанет работать?
В рамках обслуживания мы оперативно исправляем ошибки и восстанавливаем сайт из резервных копий

1️⃣3️⃣ Есть ли гарантия?
Да, предоставляем гарантию на корректную работу сайта после запуска

1️⃣4️⃣ Как происходит процесс работы?
Обсуждение → предоплата → разработка → правки → запуск сайта

1️⃣5️⃣ Как с вами связаться?
Связь только через Telegram — заявка через бота или менеджера
`,
    Markup.keyboard([["⬅️ Назад"]]).resize()
  );
});

bot.hears("💬 Связаться с менеджером", (ctx) => {
  ctx.reply(
    `Вы можете написать менеджеру напрямую: @ilnaz_manager`,
    Markup.keyboard([["⬅️ Назад"]]).resize()
  );
});

bot.hears("⬅️ Назад", (ctx) => {
  ctx.reply(
    "Главное меню:",
    Markup.keyboard([
      ["💰 Рассчитать стоимость", "📩 Оставить заявку"],
      ["🎨 Наши проекты", "❓ Вопросы и ответы"],
      ["💬 Связаться с менеджером"]
    ]).resize()
  );
});

bot.catch((err, ctx) => {
  console.error("Ошибка бота:", err);
});

bot.launch();
console.log("Бот AURIX с интерактивным калькулятором запущен!");

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});