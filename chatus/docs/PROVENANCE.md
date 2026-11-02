# Происхождение и воспроизводимость

Проверка выполнена 2 ноября 2026 года на desktop. Цель — установить, что передаваемый код воспроизводит конкретную опубликованную версию Chatus, и отдельно зафиксировать границы этой проверки.

## Исходник и публикация

Основной локальный оригинал найден в `~/Documents/Codex/2026-10-16/task/chatus-recovered`. Другие копии и материалы перечислены в [LOCAL-INVENTORY.md](LOCAL-INVENTORY.md).

В исходном локальном журнале `AGENTS.md:717` и `design/QA-DEFECTS.md:97` записаны финальная mobile-публикация, её immutable URL и хеши JS/CSS. Совпадение проверено сборкой текущих файлов, а не только этой исторической записью.

| Поле | Значение |
| --- | --- |
| Публичный alias | <https://chatus-mobile-20261016.vercel.app/> |
| Проверенный deployment | `dpl_78W4cSTzAGR6SfLSvSJGz5yvrbnm` |
| Immutable URL | <https://chatus-mobile-20261016-85wn8jhx9-layout4.vercel.app/> |
| Дата версии | 21 октября 2026 года |
| Обозначение в исходном журнале | `composer-keyboard-21b` |
| Источник публикации Vercel | CLI |
| Дата новой проверки передачи | 2 ноября 2026 года |

Публичный alias со временем может указывать на другую публикацию. Для сопоставления этой передачи используйте deployment ID, immutable URL и хеши, приведённые здесь.

В исходном локальном `.git` найден базовый коммит `f33f3c5` от 16 октября, `Restore Chatus prototype local baseline`; remote отсутствует. После этого проект менялся. Поэтому baseline commit сам по себе не удостоверяет переданный набор: для него сформирован отдельный пофайловый манифест и воспроизведён build.

## Что сохранено

[`../source/`](../source/) содержит актуальные найденные `src`, `public`, `scripts`, `tests`, `worker`, package/lock-файлы, HTML entry, TypeScript/Vite-конфигурации, `.openai/hosting.json` и `mobile-runtime.lock.json`. Код, assets и рабочие конфигурации переданы без функциональных изменений.

Новая документация находится вне `source/`. В GitHub-пакет не входят установленный `node_modules`, локальный `dist`, `.git`, `.local-recovery`, персональные логи бесед и приватные видео. Во время проверки зависимости и результаты сборки были доступны в локальной рабочей копии; разработчик заново создаёт их командами из [runbook](DEVELOPER-RUNBOOK.md).

## Результат сравнения deployment files

Локальный `npm run build` создал статический клиент в `source/dist/client`. Получившиеся файлы сравнены с деревом Vercel deployment: для каждого проверялся **SHA-1 сырых байтов файла**, который соответствует Vercel file `uid`.

**415 из 416 файлов deployment совпали.** Один дополнительный файл Vercel — `vercel.json` — отсутствует в выходе Vite. Это ожидаемое разделение приложения и конфигурации публикации, а не несовпадение JavaScript, CSS или assets.

Конфигурация сохранена как [`../reference-deployment/vercel.json`](../reference-deployment/vercel.json):

```json
{"framework": null, "buildCommand": "", "installCommand": "", "outputDirectory": "."}
```

Она описывает публикацию **уже собранной статической папки**. Это не исходный Vite config и не команда сборки репозитория. Не помещайте её автоматически в `source/`: пустые `buildCommand`/`installCommand` там изменят смысл нового deploy. Рабочая конфигурация сборки находится в [`../source/vite.config.ts`](../source/vite.config.ts).

Машиночитаемый результат исходного сравнения: [`deployment-file-verification.json`](deployment-file-verification.json). Все 415 runtime-файлов совпали; отдельная reference-копия `vercel.json` также сверена по SHA-1 `865ccb262ce7512b0cbcc0cec58eb845f323dd2e`. Полный [манифест Vercel](deployment-file-manifest.json) включён в пакет.

## Контрольные хеши основных bundles

| Файл | Байты | SHA-256 |
| --- | ---: | --- |
| `assets/index-C9Z2bnPp.js` | 789 630 | `d35b6b1099da9129e133caf825df4183163e2e4b6eda987a4e36dec440ff3c8a` |
| `assets/index-Dm2NM7XH.css` | 231 542 | `70571647cb0f340bd9df84a1da8c25120716ee65b77673bd87da946cce6dae22` |

Машиночитаемые значения: [`build-checks.json`](build-checks.json).

## Два вида SHA-1 в материалах

Не смешивайте алгоритм deployment-проверки с алгоритмом source-манифеста:

| Материал | Что хешируется | Как повторить |
| --- | --- | --- |
| Deployment comparison | Сырые байты файла, без заголовка | `sha1sum FILE` или `shasum FILE` |
| [`source-file-manifest.json`](source-file-manifest.json), поле `sha` | Git blob: `blob <число_байт>\0` + байты файла | `git hash-object FILE` |
| Контроль JS/CSS выше | Сырые байты файла алгоритмом SHA-256 | `sha256sum FILE` или `shasum -a 256 FILE` |

В source-манифесте `path` указан относительно корня пакета Chatus, например `source/package.json`, а `size` — размер в байтах. Манифест фиксирует переданные исходники и assets; он не требует установки зависимостей и не включает результаты build.

## Выполненные проверки

| Проверка | Результат 2 ноября 2026 года |
| --- | --- |
| TypeScript | Passed |
| `npm run check:runtime` | Passed: 28 защищённых файлов |
| Vite production build | Passed |
| `scripts/prepare-sites-build.mjs` | Passed; подготовлены Sites worker/hosting outputs |
| `node --test tests/*.test.mjs` | 116 passed / 116, 0 failed |
| SHA-1 deployment file comparison | 415/416 совпали; оставшийся `vercel.json` сохранён отдельно |
| SHA-256 основных JS/CSS | Совпадают с проверенным deployment |

Вывод Node-тестов сохранён в [`unit-tests.txt`](unit-tests.txt). Эти проверки относятся к коду и сборке. Они не означают новый полный визуальный прогон всех состояний, измерение FPS, проверку физического телефона, Safari iOS, нативной клавиатуры/IME или живой записи речи.

## Практические границы

- В передаче сохранено поведение найденного прототипа. Auth, payment, notification и deletion остаются local demos; backend не появился в результате упаковки.
- Статические изображения/постеры и демомедиа остаются такими же. Сравнение хешей подтверждает воспроизводимость этих файлов, но не восстанавливает отсутствующие оригинальные GIF/video/dissolve.
- GPU-эффекты и их fallback зависят от доступных браузерных API. Совпадение кода не обещает одинаковую поддержку WebGPU на разных устройствах.
- Описания движения подготовлены по текущему коду и доступным материалам. Старые журналы локального проекта содержат отменённые решения и не должны подменять текущую реализацию.
- Отдельные TGS и AE-материалы не участвуют в проверенном build сайта. TGS приложены как supplemental; большие AE-проекты перечислены только в inventory.
