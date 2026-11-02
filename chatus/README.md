# Chatus: исходники и каталог анимаций

Для разработчика: начните с [каталога 60 эффектов](docs/ANIMATION-INDEX.md), затем откройте [основные анимации](docs/ANIMATIONS-CORE.md), затем откройте [остальные анимации и взаимодействия](docs/ANIMATIONS-EXTENDED.md) и [карту покрытия](docs/MOTION-COVERAGE.md). В описаниях указаны триггеры, тайминги, ограничения и файлы реализации.

В [`source/`](source/) находятся исходники mobile-прототипа [chatus-mobile-20261016.vercel.app](https://chatus-mobile-20261016.vercel.app/). Их локальная сборка 2 ноября 2026 года воспроизвела **все 415 файлов сайта побайтно**. Дополнительный 416-й файл — конфигурация публикации `vercel.json` — сохранён отдельно и также совпал. JavaScript и CSS совпали с финальной публикацией от 21 октября. Подробности: [происхождение и проверка](docs/PROVENANCE.md).

## Что передано

[Визуальные ориентиры](docs/VISUAL-REFERENCE.md) · [Отчёт сравнения файлов](docs/deployment-file-verification.json)

| Путь | Назначение |
| --- | --- |
| [`docs/ANIMATIONS-CORE.md`](docs/ANIMATIONS-CORE.md) | Персонажи на входе, splash, карточка онбординга, свет/спойлеры, progress и premium |
| [`docs/ANIMATIONS-EXTENDED.md`](docs/ANIMATIONS-EXTENDED.md) | Остальные переходы, жесты, чат, медиа и состояния интерфейса |
| [`docs/MOTION-COVERAGE.md`](docs/MOTION-COVERAGE.md) | Карта проверенного покрытия и границы описания |
| [`docs/ANIMATION-INDEX.md`](docs/ANIMATION-INDEX.md) | Короткий указатель по эффектам и файлам реализации |
| [`docs/DEVELOPER-RUNBOOK.md`](docs/DEVELOPER-RUNBOOK.md) | Запуск, прямые ссылки на состояния, проверки и сборка |
| [`docs/PROVENANCE.md`](docs/PROVENANCE.md) | Связь локального исходника с конкретной публикацией и хешами |
| [`docs/LOCAL-INVENTORY.md`](docs/LOCAL-INVENTORY.md) | Карта найденных на компьютере копий и дополнительных материалов |
| [`docs/source-file-manifest.json`](docs/source-file-manifest.json) | Пофайловый манифест исходного кода и assets: путь, размер, Git blob SHA-1 |
| [`source/`](source/) | React/TypeScript, CSS, shaders, оригинальные assets, runtime и тесты |
| [`reference-deployment/vercel.json`](reference-deployment/vercel.json) | Конфигурация уже собранной статической Vercel-публикации |
| [`supplemental/telegram-logo/`](supplemental/telegram-logo/) | Три отдельных TGS логотипа; сайт их не использует |

Пакет размещается в `chatus/` репозитория [diqsi123/tester3223](https://github.com/diqsi123/tester3223/tree/chatus/animation-handoff-2026-11-02/chatus), ветка `chatus/animation-handoff-2026-11-02`.

## Быстрый запуск

Используйте Node.js **24.x** (проверено на 24.22.1) и npm.

```bash
git clone --branch 'chatus/animation-handoff-2026-11-02' --single-branch https://github.com/diqsi123/tester3223.git
cd tester3223/chatus/source
npm ci
npm run dev
```

Откройте адрес, напечатанный Vite, обычно `http://localhost:5173/`. Backend, база данных и API-ключи для просмотра анимаций не нужны. Для визуального разбора микрофон не требуется: есть готовые состояния записи и тестовые аудиофайлы. Demo-код входа: **411111**.

```bash
npm run build
node --test tests/*.test.mjs
```

На передаваемом исходнике прошли TypeScript, проверка **28** защищённых runtime-файлов, Vite build и подготовка Sites-выхода, а также **116/116** Node unit tests. Это desktop-проверки от 2 ноября 2026 года; они не подтверждают FPS и поведение физического телефона. Установленные зависимости и `dist` в GitHub-пакет не включены: `npm ci` и `npm run build` создадут их локально.

## Что важно при переносе

Исходный `src`, `public`, `scripts`, `tests`, `worker` и конфигурации сохранены без функциональных изменений. Сохраняйте assets вместе с кодом: часть иллюстраций и оптических поверхностей — исходные PNG/WebP/SVG, а некоторые эффекты используют WebGL/WGSL и fallback. Одни только CSS keyframes не воспроизведут весь интерфейс.

Авторизация, доступность ника, уведомления ОС, оплата, транскрипция и удаление аккаунта здесь демонстрационные. Реального backend нет. Часть исходных moving GIF/video/dissolve отсутствовала уже в найденном проекте; используются обозначенные demo/poster-состояния. Реальные camera/microphone-функции зависят от разрешений браузера, но для изучения движения можно использовать preview-состояния.

Стеклянные поверхности реконструированы для браузера и не заявлены как побитово идентичный эффект Figma. Bokeh и другие GPU-эффекты зависят от поддержки браузера; сохранённый fallback может быть статическим. Режим reduced motion и остановка скрытых эффектов — часть реализации.

Локальные журналы бесед, приватные видео с телефона, старые копии всего проекта и большие After Effects-проекты в app handoff не включены. Их наличие и расположение описаны в локальном inventory. Каталог анимаций описывает найденную текущую версию, включая её ограничения; он не обещает наличие отсутствующих оригинальных медиа.
