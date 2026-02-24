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
  await ctx.reply("Запускаем калькулятор...", Markup.removeKeyboard());
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
    `FAQ: Разработка сайтов и Telegram-ботов

1️⃣ Как долго разрабатывается сайт или бот?
Сроки зависят от сложности проекта и тарифа.  
- Сайты: от 1 до 9 недель.  
- Боты: от 5 дней до 6 недель.

2️⃣ Как рассчитывается стоимость?
Цена формируется на основе выбранного тарифа и необходимого функционала. Для предварительного расчёта вы можете воспользоваться нашим ботом-калькулятором или связаться с менеджером.

3️⃣ Сколько стоит обслуживание?
- Для сайтов: техническое обслуживание — 9 000 ₽/мес. 
- Для ботов: техническая поддержка — 7 000 ₽/мес.  
Также доступны дополнительные услуги (SEO, контекстная реклама и др.).

4️⃣ Что входит в обслуживани
Для сайтов:  
- техническая поддержка и исправление багов  
- обновление контента (фото, текст)  
- резервное копирование  
- мониторинг работоспособности  
- продление домена и хостинга (если оформлено через нас)  

Для ботов:  
- техническая поддержка и исправление ошибок  
- контроль стабильности работы  
- резервное копирование  
- помощь с обновлением сценариев (в рамках тарифа)

5️⃣ Нужна ли предоплата?  
Да, работа начинается после внесения полной предоплаты (иногда 50%). Если предоплача частичная, то оставшаяся часть выплачивается после готовности проекта.

6️⃣ Вы делаете проекты «под ключ»?  
Да, мы полностью берём на себя разработку — от идеи до финального запуска.

7️⃣ Сайт будет адаптирован под мобильные устройства?  
Обязательно. Все сайты разрабатываются с адаптивным дизайном и корректно работают на любых экранах. Для ботов адаптация не требуется — они оптимизированы под интерфейс Telegram, Vk, MAX.

8️⃣ Можно ли вносить правки в процессе разработки?  
Да, правки входят в процесс. Их количество и объём зависят от тарифа.

9️⃣ Помогаете с дизайном и текстами?  
Да, мы помогаем с разработкой дизайна, структуры, текстов для сайтов и сценариев для ботов. Уровень проработки зависит от выбранного тарифа.

🔟 Вы подключаете домен и хостинг?  
Да. Для сайтов мы полностью настраиваем домен, хостинг и запуск. Для ботов также настраиваем серверную часть.

1️⃣1️⃣ Получу ли я доступ к сайту/боту после сдачи?  
Да, после завершения проекта вы получаете полный доступ к исходному коду, панели управления и всем материалам.

1️⃣2️⃣ Что если сайт или бот перестанет работать?  
В рамках обслуживания мы оперативно исправляем ошибки и восстанавливаем работоспособность из резервных копий.

1️⃣3️⃣ Даёте гарантию?  
Да, мы гарантируем корректную работу проекта в течение 30 дней после запуска. Для флагманских тарифов гарантия может быть расширена.

1️⃣4️⃣ Как выглядит процесс работы?  
1. Обсуждение задачи и целей
2. Анализ ниши и конкурентов  
3. Согласование тарифа и предоплата  
4. Проектирование, дизайн и разработка 
5. Тестирование и правки  
6. Запуск проекта  

1️⃣5️⃣ Как с вами связаться?  
Вся связь осуществляется через Telegram. Оставьте заявку в нашем боте или напишите менеджеру напрямую.

---

Вопросы по разработке ботов

1️⃣6️⃣ Какие тарифы на создание ботов?  
- AURIX «CORE» (Флагман) — 89 000 ₽  
  Полная автоматизация, CRM, платежи, база данных, многоуровневая логика, автоворонки.  
- AURIX «FLOW» (Бизнес) — 39 000 ₽  
  Сценарии диалогов, рассылки, интеграции с Telegram/Sheets, UX-логика.  
- AURIX «START» (Базовый) — 17 000 ₽  
  Меню, кнопки, автоответы, сбор заявок, базовая логика.  

1️⃣7️⃣ Какие дополнительные функции можно подключить к боту?  
- Техническая поддержка — 7 000 ₽/мес  
- Разработка AI-бота (с нейросетью) — от 35 000 ₽ (бесплатно для CORE)  
- Интеграция платежей — от 18 000 ₽ (бесплатно для CORE и FLOW)  
- Подключение CRM — от 20 000 ₽ (бесплатно для CORE)  
- Админ-панель для управления ботом — от 30 000 ₽ (бесплатно для CORE)  
- Массовые рассылки и автоворонки — от 22 000 ₽  

1️⃣8️⃣ Где будет размещён бот?  
Мы настраиваем хостинг для бота. Вы можете использовать наш сервер (выплачивается отдельно) или предоставить свой. После сдачи вы получите доступ к коду и сможете перенести бота самостоятельно.

1️⃣9️⃣ Как происходит интеграция с CRM и платёжными системами?  
В зависимости от тарифа мы подключаем нужные API. В CORE все интеграции включены, для FLOW они опциональны и настраиваются за дополнительную плату.

2️⃣0️⃣ Можно ли дорабатывать бота после запуска?  
Да, в рамках обслуживания мы вносим изменения. Для тарифа CORE предусмотрены 30 дней бесплатных доработок.

---

Вопросы по разработке сайтов

2️⃣1️⃣ Какие тарифы на создание сайтов?
- AURIX «DOMINION» (Флагман) — 329 000 ₽  
  Маркетинговый аудит, премиальный дизайн с анимациями, копирайтинг, CRM, сквозная аналитика.  
- AURIX «ASCENT» (Бизнес) — 139 000 ₽  
  Уникальный дизайн, адаптив, анимации, аналитика, формы заявок.  
- AURIX «ORIGIN» (Стартовый) — 65 000 ₽  
  Landing page, дизайн, базовый функционал, запуск под ключ.  

2️⃣2️⃣ Какие дополнительные услуги доступны для сайтов?  
- Техническое обслуживание — 9 000 ₽/мес  
- SEO-оптимизация — от 29 000 ₽/мес  
- Разработка фирменного стиля и логотипа — 30 000 ₽  
- Настройка контекстной рекламы (Яндекс / Google) — 19 000 ₽ + % от бюджета  

2️⃣3️⃣ Будет ли сайт готов к продвижению в поисковиках?  
Да, мы закладываем базовую SEO-оптимизацию (мета-теги, структура, скорость загрузки). Для глубокого продвижения можно заказать отдельную услугу SEO-оптимизации.

Если у вас остались вопросы — оставьте заявку, мы с вами свяжемся!
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