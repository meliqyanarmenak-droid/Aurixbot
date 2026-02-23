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

const siteTariffs = [
  {
    id: "dominion",
    name: "DOMINION",
    basePrice: 329000,
    description: "Флагманская цифровая система\n• Маркетинговый аудит\n• Смысловая архитектура\n• Уникальный high‑end дизайн\n• Сложные анимации (3D, параллакс)\n• Профессиональный копирайтинг\n• CRM‑интеграции (Bitrix24 / AmoCRM)\n• Сквозная аналитика (Метрика + GA4)\n• Автоматизация лидов\n• Оптимизация скорости (Core Web Vitals)\n• Инструкция и 1 месяц поддержки",
    normalTime: "30-60 рабочих дней",
    urgentTime: "25-35 дней"
  },
  {
    id: "ascent",
    name: "ASCENT",
    basePrice: 139000,
    description: "Бизнес‑сайт с маркетинговой основой\n• Анализ конкурентов и ключевых смыслов\n• Уникальный дизайн без шаблонов\n• Базовая анимация (hover, появления)\n• Структура под удержание пользователя\n• Формы заявок в Telegram / на почту\n• Базовая аналитика (цели, счётчики)\n• Оптимизация скорости",
    normalTime: "18-30 рабочих дней",
    urgentTime: "15-25 дней"
  },
  {
    id: "origin",
    name: "ORIGIN",
    basePrice: 65000,
    description: "Стартовый сайт (Landing Page)\n• Современный дизайн\n• Адаптация под мобильные\n• Формы обратной связи (заявки на почту)\n• Установка на домен и хостинг\n• Базовая аналитика",
    normalTime: "7-14 рабочих дней",
    urgentTime: "5-9 дней"
  }
];

const botTariffs = [
  {
    id: "core",
    name: "CORE",
    basePrice: 89000,
    description: "Флагманский бот с полной автоматизацией\n• Автоворонки + CRM + API + платежи\n• Многоуровневая логика, роли, персонализация\n• Интеграции с сайтами и Google Sheets\n• Кастомный UX/дизайн сообщений\n• 30 дней поддержки и документация",
    normalTime: "25-45 рабочих дней",
    urgentTime: "18-30 дней"
  },
  {
    id: "flow",
    name: "FLOW",
    basePrice: 39000,
    description: "Сбалансированный бот для бизнеса\n• Сценарии диалогов и меню\n• Сбор заявок и рассылки\n• Интеграции (Telegram/Sheets)\n• Чистая структура и UX-логика",
    normalTime: "14-25 рабочих дней",
    urgentTime: "10-17 дней"
  },
  {
    id: "start",
    name: "START",
    basePrice: 17000,
    description: "Базовый Telegram-бот\n• Меню, автоответы, кнопки\n• Сбор заявок\n• Простое развертывание",
    normalTime: "5-10 рабочих дней",
    urgentTime: "3-7 дней"
  }
];

const siteAddons = [
  {
    id: "maintenance",
    name: "Техническое обслуживание",
    price: 9000,
    description: "ежемесячно (бэкапы, мониторинг, обновления)",
    freeFor: []
  },
  {
    id: "seo",
    name: "SEO-оптимизация",
    price: 29000,
    description: "разовая (мета-теги, оптимизация контента)",
    freeFor: []
  },
  {
    id: "branding",
    name: "Фирменный стиль + логотип",
    price: 30000,
    description: "айдентика, визуальная система",
    freeFor: []
  },
  {
    id: "context",
    name: "Контекстная реклама",
    price: 19000,
    description: "настройка Яндекс/Google + % от бюджета",
    freeFor: []
  }
];

const botAddons = [
  {
    id: "support",
    name: "Техническая поддержка",
    price: 7000,
    description: "ежемесячно",
    freeFor: []
  },
  {
    id: "ai",
    name: "Разработка AI-бота (нейросеть)",
    price: 35000,
    description: "подключение искусственного интеллекта",
    freeFor: ["core"]
  },
  {
    id: "payments",
    name: "Интеграция платежей",
    price: 18000,
    description: "приём оплат внутри бота",
    freeFor: ["core", "flow"]
  },
  {
    id: "crm",
    name: "Подключение CRM",
    price: 20000,
    description: "интеграция с внешней CRM",
    freeFor: ["core"]
  },
  {
    id: "admin",
    name: "Админ-панель для управления ботом",
    price: 30000,
    description: "веб-интерфейс для управления",
    freeFor: ["core"]
  },
  {
    id: "mailings",
    name: "Массовые рассылки и автоворонки",
    price: 22000,
    description: "настройка автоматических воронок",
    freeFor: []
  }
];

function getTariffsByType(type) {
  return type === 'site' ? siteTariffs : botTariffs;
}

function getAddonsByType(type) {
  return type === 'site' ? siteAddons : botAddons;
}

function getTariffById(type, id) {
  const tariffs = getTariffsByType(type);
  return tariffs.find(t => t.id === id);
}

function getAddonById(type, id) {
  const addons = getAddonsByType(type);
  return addons.find(a => a.id === id);
}

function calculateTotal(sessionData) {
  const { projectType, tariff, addons = [], urgent } = sessionData;
  if (!tariff) return 0;
  let total = tariff.basePrice;
  const addonsList = getAddonsByType(projectType);
  for (const addonId of addons) {
    const addon = addonsList.find(a => a.id === addonId);
    if (addon && !addon.freeFor.includes(tariff.id)) {
      total += addon.price;
    }
  }
  if (urgent) total += 20000;
  return total;
}

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

const calculatorWizard = new WizardScene(
  "calculator-wizard",

  async (ctx) => {
    ctx.session.calculator = {};
    await ctx.reply(
      "Выберите тип проекта:",
      Markup.inlineKeyboard([
        [Markup.button.callback("🌐 Сайт", "project_site")],
        [Markup.button.callback("🤖 Чат-бот", "project_bot")],
        [Markup.button.callback("🏠 В меню", "back_to_main")]
      ])
    );
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

    let projectType;
    if (data === "project_site") {
      projectType = "site";
    } else if (data === "project_bot") {
      projectType = "bot";
    } else {
      await ctx.reply("Пожалуйста, выберите тип проекта кнопками.");
      return;
    }

    ctx.session.calculator.projectType = projectType;
    const tariffs = getTariffsByType(projectType);
    const buttons = tariffs.map(t => [Markup.button.callback(t.name, `tariff_${t.id}`)]);
    buttons.push([Markup.button.callback("🔙 Назад", "back_to_project_type")]);
    buttons.push([Markup.button.callback("🏠 В меню", "back_to_main")]);

    await ctx.reply(
      "Выберите тариф:",
      Markup.inlineKeyboard(buttons)
    );
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

    if (data === "back_to_project_type") {
      await ctx.reply(
        "Выберите тип проекта:",
        Markup.inlineKeyboard([
          [Markup.button.callback("🌐 Сайт", "project_site")],
          [Markup.button.callback("🤖 Чат-бот", "project_bot")],
          [Markup.button.callback("🏠 В меню", "back_to_main")]
        ])
      );
      return ctx.wizard.selectStep(1);
    }

    if (data.startsWith("tariff_")) {
      const tariffId = data.replace("tariff_", "");
      const type = ctx.session.calculator.projectType;
      const tariff = getTariffById(type, tariffId);
      if (!tariff) {
        await ctx.reply("Ошибка, попробуйте снова");
        return ctx.scene.leave();
      }
      ctx.session.calculator.tariff = tariff;
      ctx.session.calculator.addons = [];

      await ctx.reply(
        `Вы выбрали тариф *${tariff.name}*.\n\n${tariff.description}\n\nБазовая стоимость: ${tariff.basePrice}₽`,
        { parse_mode: "Markdown" }
      );

      await renderAddons(ctx);
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
      ctx.session.calculator.addons = [];
      const type = ctx.session.calculator.projectType;
      const tariffs = getTariffsByType(type);
      const buttons = tariffs.map(t => [Markup.button.callback(t.name, `tariff_${t.id}`)]);
      buttons.push([Markup.button.callback("🔙 Назад", "back_to_project_type")]);
      buttons.push([Markup.button.callback("🏠 В меню", "back_to_main")]);
      await ctx.reply(
        "Выберите тариф:",
        Markup.inlineKeyboard(buttons)
      );
      return ctx.wizard.selectStep(2);
    }

    if (data === "addons_next") {
      await sendUrgencyQuestion(ctx);
      return ctx.wizard.next();
    }

    if (data.startsWith("addon_")) {
      const addonId = data.replace("addon_", "");
      const type = ctx.session.calculator.projectType;
      const addon = getAddonById(type, addonId);
      if (!addon) return;

      let addons = ctx.session.calculator.addons || [];
      const index = addons.indexOf(addonId);
      if (index === -1) {
        addons.push(addonId);
      } else {
        addons.splice(index, 1);
      }
      ctx.session.calculator.addons = addons;

      try {
        await renderAddons(ctx, true);
      } catch (e) {
        if (e.description?.includes('message is not modified')) {
        } else {
          throw e;
        }
      }
      return;
    }

    await ctx.reply("Пожалуйста, используйте кнопки.");
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

    if (data === "back_to_addons") {
      await renderAddons(ctx);
      return ctx.wizard.selectStep(3);
    }

    if (data === "time_normal") {
      ctx.session.calculator.urgent = false;
    } else if (data === "time_urgent") {
      ctx.session.calculator.urgent = true;
    } else {
      await ctx.reply("Пожалуйста, выберите сроки кнопками.");
      return;
    }

    await showResult(ctx);
    return ctx.scene.leave();
  }
);

async function renderAddons(ctx, edit = false) {
  const type = ctx.session.calculator.projectType;
  const tariff = ctx.session.calculator.tariff;
  const selectedAddons = ctx.session.calculator.addons || [];
  const addons = getAddonsByType(type);

  let text = `*Дополнительные услуги для тарифа ${tariff.name}*\n\n`;
  text += `Базовая стоимость: ${tariff.basePrice}₽\n`;
  let addonsTotal = 0;
  const addonLines = [];
  for (const addon of addons) {
    const isFree = addon.freeFor.includes(tariff.id);
    const priceText = isFree ? "0₽ (бесплатно)" : `${addon.price}₽`;
    const selected = selectedAddons.includes(addon.id) ? "✅ " : "";
    addonLines.push(`${selected}${addon.name} — ${priceText}\n_${addon.description}_`);
    if (selectedAddons.includes(addon.id) && !isFree) {
      addonsTotal += addon.price;
    }
  }
  text += addonLines.join("\n\n");
  text += `\n\n*Сумма доп. услуг: ${addonsTotal}₽*\n`;
  text += `*Текущая предварительная стоимость: ${tariff.basePrice + addonsTotal}₽*`;
  text += `\n\nНажимайте на услуги, чтобы выбрать или отменить.`;

  const buttons = addons.map(addon => {
    const selected = selectedAddons.includes(addon.id) ? "✅ " : "";
    const isFree = addon.freeFor.includes(tariff.id);
    const priceMark = isFree ? " (бесплатно)" : ` (+${addon.price}₽)`;
    return [Markup.button.callback(`${selected}${addon.name}${priceMark}`, `addon_${addon.id}`)];
  });
  buttons.push([
    Markup.button.callback("🔙 Назад к тарифам", "back_to_tariff"),
    Markup.button.callback("⏩ Далее", "addons_next")
  ]);
  buttons.push([Markup.button.callback("🏠 В меню", "back_to_main")]);

  if (edit) {
    await ctx.editMessageText(text, {
      parse_mode: "Markdown",
      reply_markup: Markup.inlineKeyboard(buttons).reply_markup
    });
  } else {
    await ctx.reply(text, {
      parse_mode: "Markdown",
      reply_markup: Markup.inlineKeyboard(buttons).reply_markup
    });
  }
}

async function sendUrgencyQuestion(ctx) {
  const tariff = ctx.session.calculator.tariff;
  const normalTimeText = `Обычные сроки (${tariff.normalTime})`;
  const urgentTimeText = `Срочно (+20000₽, ${tariff.urgentTime})`;

  await ctx.reply(
    "Выберите сроки выполнения:",
    Markup.inlineKeyboard([
      [Markup.button.callback(normalTimeText, "time_normal")],
      [Markup.button.callback(urgentTimeText, "time_urgent")],
      [Markup.button.callback("🔙 Назад к доп. услугам", "back_to_addons")],
      [Markup.button.callback("🏠 В меню", "back_to_main")]
    ])
  );
}

async function showResult(ctx) {
  const { projectType, tariff, addons = [], urgent } = ctx.session.calculator;
  const total = calculateTotal(ctx.session.calculator);

  const addonsList = getAddonsByType(projectType);
  const selectedAddons = addons.map(id => addonsList.find(a => a.id === id)).filter(Boolean);
  let addonsText = "";
  if (selectedAddons.length > 0) {
    addonsText = selectedAddons.map(a => {
      const isFree = a.freeFor.includes(tariff.id);
      return `• ${a.name} — ${isFree ? "бесплатно" : a.price + "₽"}`;
    }).join("\n");
  } else {
    addonsText = "• Не выбраны";
  }

  const timeText = urgent ? `Срочно (+20000₽, ${tariff.urgentTime})` : `Обычные сроки (${tariff.normalTime})`;

  const resultMessage = `
🎯 *Ваш расчёт:*

Тип проекта: *${projectType === 'site' ? 'Сайт' : 'Чат-бот'}*
Тариф: *${tariff.name}*

*Дополнительные услуги:*
${addonsText}

*Сроки:* ${timeText}

💰 *Итоговая стоимость: ${total}₽*

Спасибо за использование калькулятора! Наш менеджер скоро свяжется с вами.
  `;

  await ctx.reply(resultMessage, { parse_mode: "Markdown" });

  const managerMessage = `
📩 *Новая заявка из калькулятора*
👤 Пользователь: @${ctx.from.username || "нет username"} (ID: ${ctx.from.id})

Тип: ${projectType === 'site' ? 'Сайт' : 'Чат-бот'}
Тариф: *${tariff.name}*
Доп. услуги: ${addons.length ? addons.map(id => {
    const a = addonsList.find(a => a.id === id);
    const isFree = a.freeFor.includes(tariff.id);
    return `${a.name} (${isFree ? 'бесплатно' : a.price + '₽'})`;
  }).join(', ') : 'нет'}
Срочность: ${urgent ? `Срочно (+20000₽) — ${tariff.urgentTime}` : `Обычная — ${tariff.normalTime}`}
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
}

const stage = new Scenes.Stage([calculatorWizard]);
bot.use(session());
bot.use(stage.middleware());

bot.action("restart_calculator", async (ctx) => {
  await ctx.answerCbQuery().catch(() => {});
  if (ctx.session) ctx.session.calculator = null;
  return ctx.scene.enter("calculator-wizard");
});

bot.action("back_to_main", async (ctx) => {
  await ctx.answerCbQuery().catch(() => {});
  if (ctx.session) ctx.session.calculator = null;
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
  exitToMainMenu(ctx);
});

bot.catch((err, ctx) => {
  console.error("Ошибка бота:", err);
});

bot.launch();
console.log("Бот AURIX с новым калькулятором запущен!");

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});