# Запуск и разбор анимаций

Передача находится в `chatus/` репозитория `diqsi123/tester3223`, ветка `chatus/animation-handoff-2026-11-02`. Главные описания: [ANIMATIONS-CORE.md](ANIMATIONS-CORE.md), [ANIMATIONS-EXTENDED.md](ANIMATIONS-EXTENDED.md), [MOTION-COVERAGE.md](MOTION-COVERAGE.md).

## Установка и запуск

Нужны Git, npm и Node.js **24.x** (проверено на 24.22.1). В lockfile зафиксированы React 19.2.7, Motion 12.42.2, TypeScript 7.0.2 и Vite 8.1.3. Для первой установки `npm ci` нужен доступ к npm registry.

```bash
git clone --branch 'chatus/animation-handoff-2026-11-02' --single-branch https://github.com/diqsi123/tester3223.git
cd tester3223/chatus/source
npm ci
npm run dev
```

`predev` автоматически проверит сохранность mobile runtime. Откройте URL из вывода Vite, обычно `http://localhost:5173/`. Если порт занят, Vite может выбрать следующий. Для доступа только с этого компьютера можно запустить `npm run dev -- --host 127.0.0.1`.

Backend, база данных, `.env` и API-ключи для просмотра не нужны. Это локальный frontend-прототип. Нажатие на demo-авторизацию не отправляет письмо; код **411111** проходит проверку. Для изучения анимаций записи достаточно preview-состояний, микрофон включать не требуется.

## Быстрые входы в состояния

Пути ниже добавляются к адресу локального сервера. Параметры прочитаны из текущих `Prototype.tsx`, `AuthFlow.tsx` и `Launch.tsx`; это переключатели прототипа, а не backend-маршруты.

| Что смотреть | Локальный путь / действие |
| --- | --- |
| Полный splash и вход | `/`; с welcome повторяется внешней кнопкой «Повторить сплеш» |
| Персонажи welcome без splash | `/?screen=welcome` |
| Welcome в неподвижной композиции | `/?screen=welcome&motion=off` — этот параметр замораживает именно roulette персонажей |
| Карточка знакомства | `/?auth=intro` |
| Пол / возраст / ник | `/?auth=gender`, `/?auth=age`, `/?auth=nickname` |
| Био / аватар / интересы | `/?auth=bio`, `/?auth=avatar`, `/?auth=interests` |
| Review анкеты и заполненная карточка | `/?auth=profile` |
| Собственный профиль | `/?section=profile` |
| Профиль с premium-статусом | `/?section=profile&profile=premium` |
| Редактирование и progress | `/?section=profile&profile=edit`; внешняя кнопка «Показать 80 → 100%» |
| Шторки редактирования | `/?section=profile&profile=avatar`, `...&profile=interests`, `...&profile=age`, `...&profile=gender`, `...&profile=nickname` |
| Оформление | `/?section=profile&profile=appearance` |
| Шторка подтверждения удаления | `/?section=profile&profile=deletion-confirm` |
| Тикающий demo-deadline | `/?section=profile&profile=deleting` |
| Начало диалога | `/?section=dialog` |
| История / отправленное голосовое | `/?section=dialog&chat=history`, `/?section=dialog&chat=sent-voice` |
| Запись без запроса микрофона | `/?section=dialog&chat=recording`, `/?section=dialog&chat=locked` |
| Ответ / реакции | `/?section=dialog&chat=reply-compose`, `/?section=dialog&chat=reactions` |
| Профиль собеседника и scroll-collapse | `/?section=dialog&peer=media` |
| Шторка premium с переливами и тарифами | Открыть `/?section=dialog`, нажать скрытые «Пол и возраст» в карточке — кнопка «Пол и возраст скрыты — открыть премиум» |
| Уведомления | `/?notifications=1` или внешняя кнопка «Шторка уведомлений» |
| Изолированный onboarding | `/onboarding.html` |
| Отдельный Apple-design эксперимент | `/onboarding.html?apple-design=1` |

`profile=premium` показывает premium-состояние собственного профиля и не открывает большую шторку покупки. Отдельного query-параметра для открытия этой шторки в текущем коде нет: используется действие на спойлере в диалоге/профиле собеседника.

На desktop под макетом доступны переключатели «Авторизация / Профиль / Диалог» и списки состояний. Полные идентификаторы находятся в:

- [`../source/src/components/AuthFlow/AuthFlow.tsx`](../source/src/components/AuthFlow/AuthFlow.tsx), `AUTH_PREVIEWS`;
- [`../source/src/Prototype.tsx`](../source/src/Prototype.tsx), `PROFILE_PREVIEWS`;
- [`../source/src/components/chat-scenarios.ts`](../source/src/components/chat-scenarios.ts), `CHAT_PREVIEWS`;
- [`../source/src/components/PeerProfile.tsx`](../source/src/components/PeerProfile.tsx), `PEER_PREVIEWS`.

Переходы внутри формы и прямой вход могут иметь разную начальную подготовку данных: query-режимы специально заполняют demo-поля. Чтобы изучить полный прогресс, пройдите email → code → intro → анкету, а не только открывайте готовые конечные состояния.

## Где искать реализацию

| Область | Файлы |
| --- | --- |
| Splash / персонажи welcome | `src/components/Launch/` |
| Карточка, Glass, отражение, tilt, spoiler | `src/isolated-onboarding/` |
| Форма и progress анкеты | `src/components/AuthFlow/` |
| Шторка premium, glints, тарифы, bokeh | `src/components/premium/` |
| Профиль, completion, настройки, удаление, shell | `src/Prototype.tsx` и связанные CSS |
| Сообщения, запись, реакции, media | `src/components/Chat*.tsx`, `src/components/chat-*.ts`, соответствующие CSS |
| Профиль собеседника и scroll/tabs | `src/components/PeerProfile.tsx`, `src/components/peer-profile.css` |
| Общие spring/fade tokens | `src/ui/motion.ts` |
| Viewport / native keyboard geometry | `src/components/ChatusViewport.ts`, `src/ui/viewport.ts`, `src/ui/viewport-model.ts` |
| Mobile runtime / Carousel / FlowStack / keyboard | `src/mobile/` |
| Изображения, SVG, шрифты, demo audio/video | `public/assets/` |

Сохраняйте прозрачность, padding и размеры исходных assets: в некоторых PNG/WebP уже включены тень, glow или optical rim. Повторное добавление этих эффектов в CSS может удвоить их.

## Проверки и сборка

Из `chatus/source`:

```bash
npm run check:runtime
npx tsc --noEmit
npm run build
node --test tests/*.test.mjs
```

`npm run build` включает `prebuild` runtime check, `tsc`, Vite и `scripts/prepare-sites-build.mjs`. Результаты:

- `dist/client/` — статический сайт, включая assets;
- `dist/server/index.js` — Sites worker из `worker/index.js`;
- `dist/.openai/hosting.json` — подготовленная hosting-конфигурация.

Для просмотра build:

```bash
npx vite preview --host 127.0.0.1 --port 4173
```

Откройте `http://127.0.0.1:4173/`. Node unit tests не требуют браузера и не обращаются к микрофону. `npm run test:runtime` — отдельный Playwright-набор; его не следует путать с подтверждёнными 116 Node tests. Для него нужны browser dependencies Playwright, и результат его нового запуска здесь не заявляется.

Изолированный `/onboarding.html` использует собственный entry. Он доступен через dev server, а отдельная production-сборка выполняется командой:

```bash
npx vite build --config vite.onboarding.config.ts
```

Она создаёт `dist/onboarding/`, не заменяя `dist/client/`. Основной `npm run build` сам по себе не объединяет два entry в один deploy.

На исходном наборе 2 ноября 2026 года прошли TypeScript, runtime check **28/28**, основной build/prepare-sites и **116/116** Node tests. Воспроизводимость Vercel описана в [PROVENANCE.md](PROVENANCE.md); `node_modules` и `dist` в upload отсутствуют.

## Сравнение собранных bundles

После основного build на macOS:

```bash
shasum -a 256 dist/client/assets/index-C9Z2bnPp.js dist/client/assets/index-Dm2NM7XH.css
```

Ожидаемые значения и размеры — в [`build-checks.json`](build-checks.json). Пофайловый source-манифест использует Git blob SHA-1, поэтому для него применяется `git hash-object FILE`, а не `shasum FILE`.

[`../reference-deployment/vercel.json`](../reference-deployment/vercel.json) относится к публикации готовой статической папки с пустой build-командой. Он не является новым Vite config. Для самостоятельной публикации сначала создайте `dist/client` и явно выберите этот результат либо настройте установку/сборку репозитория; не переносите static-конфигурацию в исходники механически. Этот runbook не выполняет новую публикацию приложения.

## Если движение отличается

1. Проверьте системную настройку reduced motion: она отключает или сокращает декоративное движение. `motion=off` дополнительно останавливает welcome roulette.
2. Держите вкладку видимой и компонент в активной сцене: многие loops сознательно останавливаются в фоне/вне экрана.
3. Проверьте поддержку GPU API. Bokeh хранит исходный shader, но при отсутствии HTML-in-Canvas capture показывает authored static fallback; Safari не обязан проигрывать этот shader.
4. Открывайте проект через HTTP dev/preview, а не как `file://`: абсолютные `/assets/...`, модули и браузерные API рассчитаны на сервер.
5. Сравнивайте то же состояние и тот же размер canvas. Натуральная клавиатура телефона и симулированная desktop-клавиатура имеют разные источники геометрии.

Если `check:runtime` сообщает изменение защищённых файлов, сначала выясните причину и восстановите случайные правки. Команда `update:runtime-lock` меняет базовые хеши; её не следует использовать для скрытия неразобранного сбоя.

## Границы прототипа

- Email/Apple/Google, доступность nickname, notification Enable, оплата и удаление — local demos. Demo-deadline удаления сохраняется локально на 14 дней; реальный серверный аккаунт не удаляется. Mail-кнопка визуальная.
- Seeded voice/transcription и preview-запись не доказывают работу реального microphone capture. Реальная запись требует поддержки браузера и разрешения пользователя. Для разбора формы анимации достаточно готовых fixtures.
- Часть оригинальных moving GIF/video/dissolve отсутствует в найденном проекте; имеющиеся постеры/neutral demos сохранены. TGS из supplemental не заменяют эти медиа и не подключены к сайту.
- Glass — браузерная реконструкция, а не нативный эффект Figma. Визуальные fallback и reduced motion являются частью текущего поведения.
- Desktop-сборка и unit tests не подтверждают физический iPhone/Safari, IME, camera, микрофон или FPS. На реальном устройстве это отдельная проверка при переносе.
