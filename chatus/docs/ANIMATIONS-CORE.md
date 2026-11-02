# Анимации Chatus: вход, анкета, премиум и сохранённый поиск

Дата анализа: 2 ноября 2026. Исходники в [source](../source/) подтверждены воспроизводимой сборкой: все 415 файлов опубликованной сборки совпали с Vercel по SHA-1, JS и CSS дополнительно совпали по SHA-256. См. [проверку файлов deployment](deployment-file-verification.json). Числа ниже взяты из подтверждённого кода; время визуального эффекта в браузере зависит от готовности изображений и частоты кадров. Для пружин указаны физические параметры, а не выдуманная фиксированная длительность.

## Карта реализации

| Эффект | Где искать |
|---|---|
| Логотип, блик, сердце и круговое раскрытие входа | [src/components/Launch/splash.ts:53](../source/src/components/Launch/splash.ts#L53), `:245`, `:307` |
| Автоматическая карусель персонажей входа | [src/components/Launch/Launch.tsx:9](../source/src/components/Launch/Launch.tsx#L9) |
| Карточка на знакомстве и итоговой анкете | [src/isolated-onboarding/OnboardingScreen.tsx:49](../source/src/isolated-onboarding/OnboardingScreen.tsx#L49), [apple-card-motion.ts:4](../source/src/isolated-onboarding/apple-card-motion.ts#L4) |
| Живой золотой свет за карточкой | [src/components/AuthFlow/QuestionnaireGlow.tsx:6](../source/src/components/AuthFlow/QuestionnaireGlow.tsx#L6), [questionnaire-glow.css:1](../source/src/components/AuthFlow/questionnaire-glow.css#L1) |
| Семь полосок прогресса анкеты | [src/components/AuthFlow/AuthFlow.tsx:62](../source/src/components/AuthFlow/AuthFlow.tsx#L62), `:557` |
| Процент заполнения профиля | [src/Prototype.tsx:49](../source/src/Prototype.tsx#L49), `:53`; [src/prototype.css:123](../source/src/prototype.css#L123), `:330`, `:369` |
| Перелив Premium и грани алмаза в шторке | [src/components/premium/PremiumSheet.tsx:24](../source/src/components/premium/PremiumSheet.tsx#L24), `:52`; [premium-sheet.css:32](../source/src/components/premium/premium-sheet.css#L32) |
| Персонаж и молния в баннере профиля | [src/components/PremiumIllustration.tsx:2](../source/src/components/PremiumIllustration.tsx#L2); [src/prototype.css:375](../source/src/prototype.css#L375) |
| Плавающие сообщения приглашения уведомлений | [src/components/AuthFlow/NotificationSheet.tsx:7](../source/src/components/AuthFlow/NotificationSheet.tsx#L7), [notification-sheet.css:11](../source/src/components/AuthFlow/notification-sheet.css#L11) |
| Частицы скрытых пола и возраста | [src/Prototype.tsx:484](../source/src/Prototype.tsx#L484); [src/isolated-onboarding/lib/custom-effects/LiveTelegramSpoiler.ts](../source/src/isolated-onboarding/lib/custom-effects/LiveTelegramSpoiler.ts) |
| Сохранённый компонент поиска с огоньком по контуру | [src/components/LivingSearchSilhouette/](../source/src/components/LivingSearchSilhouette/) — сохранён, не подключён |

## Общие параметры движения

[src/ui/motion.ts:2](../source/src/ui/motion.ts#L2): `surface` и `scene` — spring `{stiffness:400,damping:40,mass:1}`; `gesture` — `{stiffness:300,damping:30,mass:.75}`; fade — 200 мс, cubic-bezier(.2,0,.2,1); input — 300 мс, cubic-bezier(.22,1,.36,1); send — spring 440/42/1. `STILL` — `{duration:0}`. В Motion длительность задаётся в секундах, CSS здесь обычно использует миллисекунды.

Пружина заканчивается по критериям покоя движка и может получать начальную скорость жеста. При переносе на другую платформу нужно сохранить stiffness, damping, mass, начальное состояние и velocity; «примерно 300 мс ease-out» даст другое поведение.

## 1. Загрузка и вход

### 1.1. Сплэш: логотип → блик → сердце → вход

Триггер: обычный первый mount `Launch`, если не передан `skipSplash` и нет `screen=welcome`; повтор по `replay`. Изображения входа заранее декодируются через `image.decode()`, после чего монтируется сцена. Если загрузка/декодирование медленное, к приведённой шкале добавится ожидание ассетов. Ссылки: [Launch.tsx:80](../source/src/components/Launch/Launch.tsx#L80), [splash.ts:307](../source/src/components/Launch/splash.ts#L307).

Основная система координат — 402×874. Масштаб `min(containerWidth/402, containerHeight/874)`, затем центрирование. Применяется ResizeObserver, поэтому круг не должен оставлять непокрытые края при изменении размеров.

| Время от старта сцены | Действие |
|---|---|
| 0–360 мс | Исходный логотип остаётся видимым |
| 360–1060 мс | Блик проходит через маску исходного логотипа |
| 1040–1582 мс | Сердце появляется с увеличением и мягко возвращается к исходному масштабу |
| 1835–2295 мс | Кругом раскрывается реальный экран входа |
| 1835–2035 мс | Логотип плавно исчезает |
| 2955 мс | `onComplete`: экран получает ready/settled, становится интерактивным, сплэш удаляется |

Точные настройки: [splash.ts:245](../source/src/components/Launch/splash.ts#L245). Блик имеет ширину 35.3953 px, смещение X от −150 до +150 px, duration 700 мс, fade-in 100 мс, fade-out 170 мс, opacity 1, blur 0. Его прогресс сначала смешивается с quintic smoother на 25%, затем проходит через `silk = cubic-bezier(.4,0,.6,1)`. Градиент/скос заданы исходными матрицами Figma; не заменять полосой поверх всего экрана — блик ограничен маской букв.

Сердце: scale 0→1.13 за 207 мс по `pop = cubic-bezier(.22,0,.14,1)`, затем 1.13→1 за 335 мс по quintic smoother. Opacity: `smoother(heartProgress/.28)`. Вертикальная составляющая `−.95*sin(π*heartProgress)^4` px; это небольшое движение вверх, а не многократный отскок. Начало связано с бликом через `shineHeartGap = −20`, поэтому сердце стартует за 20 мс до конца блика. Отдельное `heartDelay` в конфиге при этом не определяет реальный start.

Круг: центр в исходных координатах (201,437), radius 0→максимальное расстояние до углов текущего viewport+2 px, duration 460 мс, `portal = cubic-bezier(.55,0,.4,1)`. Реальный DOM входа раскрывается `clip-path:circle(...)`. Основной вариант `variant:'circle'`; другие сохранённые варианты в экспортированном модуле (rays/twist/luma и др.) не нужно считать запущенными эффектами этого входа. В `mountSplash` живой Luma-фон намеренно не монтируется.

Формула сглаживания: `S(t)=t³*(t*(6t−15)+10)` с clamp 0…1. Она обнуляет скорость и ускорение на концах.

Цикл RAF: delta ограничена 48 мс; скрытая вкладка приостанавливает сцену, после возврата previous timestamp сбрасывается. При `prefers-reduced-motion:reduce` вместо всей последовательности вход открывается через 350 мс. [splash.ts:323](../source/src/components/Launch/splash.ts#L323).

Ассеты сплэша: SVG логотипа и сердца встроены data URI в [splash.ts](../source/src/components/Launch/splash.ts). Это редактируемое DOM/SVG-движение, не видео и не Lottie.

### 1.2. Персонажи на входе: карусель с изменением размера

[Launch.tsx:9](../source/src/components/Launch/Launch.tsx#L9). Пять растровых персонажей двигаются справа налево: переход `from → from−1` уменьшает X слота в непрерывном цикле: сначала пауза 1100 мс, затем перемещение 1450 мс; один шаг 2550 мс, полный оборот пяти персонажей 12750 мс. Пользователь не перетаскивает эту карусель: `draggingEnabled={false}`. Анимируются контейнеры целых изображений, отдельные части тела не ригованы.

Слоты X (центры в исходной сцене): `[-213.33,-38.8,201,440.8,615.4,790]`; размеры: `[151.349,171.005,283.697,171.005,151.349,151.349]`. Центральный персонаж имеет 283.697 px, боковые становятся меньше. Между слотами X и size линейно интерполируются по S(t). Y≈264.45 px, у слота 1 добавляется .33 px. Transform: `translate(x−141.8485,y−141.8485) scale(size/283.697)`.

Персонаж переносится в крайний правый невидимый слот перед следующим входом, поэтому не должен перескакивать через центр. Фиксированная круглая рамка и мягкий ореол лежат поверх движущихся картинок. В этой реализации сама рамка не пульсирует и не вращается. Отражение снизу — статический PNG с `scaleY(-1)`, а не отдельно анимированное зеркальное видео.

Карусель запускается после settled сплэша, только пока welcome активен, документ видим, reduced motion выключен и `motion=off` отсутствует. При reduced motion elapsed сбрасывается в 0 и показывается исходная композиция. Delta RAF ограничена 48 мс, после возвращения вкладки скачка времени нет.

Ассеты [/assets/welcome/](../source/public/assets/welcome/): `avatar-far-left`, `avatar-left`, `avatar-center`, `avatar-right`, `avatar-far-right` (`.png` и `-mobile.webp`); `avatar-mask.svg`, `rail-mask.svg`, `ring.svg`, `ring-soft.svg`, `illustration-union.svg`, `reflection.png`. В [launch.css:16](../source/src/components/Launch/launch.css#L16) находятся маски и размещение. Для мобилы srcset выбирает webp 1024w, для крупного вывода png 2000w.

### 1.3. Кнопки входа

[launch.css](../source/src/components/Launch/launch.css): при `:active` scale .985; отдельной временной tween здесь не задано. При reduced motion transform отключается. Золотая заливка, внутренние блики, тени и контур кнопки статические. Не записывать их как отдельный бесконечный перелив.

## 2. Онбординг и анкета

### 2.1. Появление, подсказка и жест карточки

Карточка действительно использует ветку `appleDesign`: это передано в [AuthFlow.tsx:299](../source/src/components/AuthFlow/AuthFlow.tsx#L299) и `:535`. Название ветки осталось от экспериментальной разработки, но она включена в опубликованном runtime.

[OnboardingScreen.tsx:201](../source/src/isolated-onboarding/OnboardingScreen.tsx#L201): карточка intro монтируется после того, как внешний `.flow-screen` два кадра подряд находится в покое: `abs(translateX)<.5` px, `abs(scaleX−1)<.001`. Это предотвращает наложение демонстрационного наклона на горизонтальный переход экрана. В reduced motion ожидание не требуется.

Появление (`:49–90`): обычная карточка y=12→0, opacity=0→1; итоговая (`celebrate`) y=24→0 и scale .97→1. Положение/масштаб — shared spring surface 400/40/1, opacity — fade 200 мс (.2,0,.2,1). Perspective 700 px. После mount через 850 мс однократно показывается приглашение покрутить карточку: pitch `[0,−4.4,2.2,0]`°, yaw `[0,7.2,−4.4,0]`°, duration 1.5 c, times `[0,.3,.65,1]`, easeInOut. На итоговой карточке `hint=false`, покачивания нет.

При первом pointerdown подсказка навсегда отменяется для этого mount; прекращаются и текущие intro/settling анимации. Если вход был прерван касанием, appearanceY/scale мягко доводятся до цели spring bounce0 duration .22, opacity за .12 c. Это позволяет перехватить движение без скачка.

Управление (`:110–167`): primary pointer и левая кнопка, pointer capture, `touch-action:none`; пользователь вращает карточку, не перемещает её по экрану. Исходные углы берутся из текущего presentation state. `yaw=softTilt(initialYaw+Δx/width*44,16)`; `pitch=softTilt(initialPitch−Δy/height*36,14)`. Первые 65% предела проходят свободно, затем сопротивление плавно растёт: для `excess=max(0,abs(v)−.65*limit)`, `room=.35*limit`, добавка `excess*room/(room+excess)`. Отсюда мягкое приближение к ±16° yaw / ±14° pitch.

Отпускание: spring к 0 по каждой оси, stiffness280/damping26/mass.7. Начальная скорость вычисляется по последним 80 мс samples, ограничена ±90°/с; samples хранятся за 100 мс. Если последнему sample >80 мс или был pointercancel/lostcapture, скорость 0. При повторном захвате возвратная пружина останавливается и жест начинается из фактически видимого угла. [apple-card-motion.ts:12](../source/src/isolated-onboarding/apple-card-motion.ts#L12).

Свет на стекле следует за углом (`:91–98`): highlight X=1.4*yaw px, Y=−1.4*pitch px; opacity=`min(.75,hypot(pitch,yaw)/20)`. Сам материал содержит tint, оптическую SVG-рефракцию и контур в [Glass.tsx](../source/src/isolated-onboarding/Glass.tsx); маски/форму нельзя заменить обычным box-shadow без потери вида. При reduced transparency оптика/отражение отключаются, tint становится непрозрачным ([apple-design-preview.css:14](../source/src/isolated-onboarding/apple-design-preview.css#L14)). При reduced motion intro/hint отключены, жест appleDesign не стартует и углы сбрасываются в 0.

Ассеты: [/assets/onboarding/avatar.png](../source/public/assets/onboarding/avatar.png), стекло/фильтры в [Glass.tsx](../source/src/isolated-onboarding/Glass.tsx); содержимое итоговой карточки собирается из аватара, пола, возраста, интересов пользователя ([AuthFlow.tsx:535](../source/src/components/AuthFlow/AuthFlow.tsx#L535)).

### 2.2. Живые золотые лучи за карточкой

[QuestionnaireGlow.tsx:6](../source/src/components/AuthFlow/QuestionnaireGlow.tsx#L6). Это деформация исходной текстуры `questionnaire-glow-gold.png` через WebGL, а не смена кадров видео. Цикл фазы 10 с: `phase=elapsedSeconds*2π/10`. Цвет/alpha исходного изображения сохраняются; края закреплены множителем `edge=sin(πu)*sin(πv)`.

Внутренний сдвиг UV: X=`sin(v*7+phase)*.072+sin(v*13−2phase)*.020`, Y=`sin(u*6−phase)*.032`; весь сдвиг умножается на `edge*sin(phase)`. Alpha дышит в диапазоне .94…1 через `.97+.03*cos(phase)`. При phase0 картинка совпадает с оригиналом. Backing canvas 402×573 с DPR до 2. RAF delta ограничена 100 мс.

Пауза при неактивном экране, вне viewport, скрытой вкладке, reduced motion; остановленный timestamp сбрасывается, время паузы не добавляется. Reduced motion рисует phase0. Контекст WebGL потерян/не поддержан — CSS fallback на том же PNG: 12 с ease-in-out infinite; точки 0/100% (x0,scale1),25% (−9px,1.08×1.03),50% (+9px,1.06×1.02),75% (−6px,1.08×1.03). CSS fallback тоже замораживается по playing и reduced motion. [questionnaire-glow.css:3](../source/src/components/AuthFlow/questionnaire-glow.css#L3).

### 2.3. Переходы шагов и семь полосок

[src/mobile/FlowStack.tsx:184](../source/src/mobile/FlowStack.tsx#L184): новый экран входит с X=ширина экрана, предыдущий уходит на −.28*ширина и уменьшается до .985. Назад текущий уходит вправо, предыдущий возвращается из −.28*width/.985. Shared spring scene400/40/1; reduced motion — duration0. Экраны сохраняют собственные MotionValue, поэтому интерактивный возврат не должен прыгать в начало. Жест из левой зоны 28 px; завершение назад, когда `nextX+releaseVelocity*.2>92`; иначе пружинный возврат с releaseVelocity. За пальцем значения меняются непосредственно.

[AuthFlow.tsx:62](../source/src/components/AuthFlow/AuthFlow.tsx#L62), `:557–565`: шапка fade200 мс, 7 сегментов. Завершённые/текущий `scaleX=1`, будущие 0; transform-origin слева, duration480 мс, cubic-bezier(.22,1,.36,1). Порядок: пол 1 → возраст 2 → никнейм 3 → био 4 → аватар 5 → интересы 6 → обзор профиля 7. Это индикатор шага, отдельный от процента заполнения данных.

### 2.4. Проценты на самой карточке онбординга

`OnboardingCompletionBadge` в [OnboardingScreen.tsx:14](../source/src/isolated-onboarding/OnboardingScreen.tsx#L14): intro показывает фиксированные 20% и дугу .2; финальная карточка фиксированные 100% и полный круг. Здесь нет count-up20→100 при переходе между карточками. Для 100% после покоя внешней flow-сцены, но не ранее 1000 мс от эффекта, начинается заливка значка, через 420 мс — галочка. [onboarding.css:36](../source/src/isolated-onboarding/onboarding.css#L36): fill opacity0→1 и scale.88→1 за 420 мс (.42,0,.22,1); check dashoffset1→0 за 360 мс с той же кривой, opacity за 180 мс. Reduced motion сразу check, без переходов.

### 2.5. Процент заполнения в редактировании профиля

Формула [Prototype.tsx:49](../source/src/Prototype.tsx#L49): по 20% за пять непустых значений — никнейм(trim), возраст, хотя бы один интерес, пол, био(trim). Аватар и фон не дают отдельные 20%. `CompletionBadge` `:53–90` синхронно анимирует SVG `pathLength` и текст `round(progress*100)`.

Обычное изменение процента:900 мс, bezier(.42,0,.22,1). Переход `<100→100`: delay260 мс, затем 1100 мс заполнения кольца. По окончании+60 мс начинается fill, ещё 420 мс до check. Итого от изменения данных:0–260 ожидание;260–1360 кольцо/число;1420 fill;1840 check;3600 hide (если не persistent). Fill: opacity и scale.88→1 за 420 мс; галочка рисуется 360 мс. Цвет/фон розового бейджа переходит к зелёному за 420 мс.

Hide в финальном CSS: opacity0, blur2px, translateY(−1px), scale.97 за 500 мс. Пустой слот затем схлопывается по width/margin-left за 480 мс с задержкой 340 мс ([prototype.css:369](../source/src/prototype.css#L369)), поэтому заголовок не должен перескакивать в момент появления галочки. Ранние CSS-правила про 450 мс «пульс успеха» переопределены: [prototype.css:330](../source/src/prototype.css#L330) отключает эту animation. Приоритет имеет последнее правило.

Persistent используется у компактного бейджа кнопки заполнения и некоторых preview; он не исчезает по таймеру. При первоначальном mount с percent100 кольцо уже 100, не начинается с 0. При reduced motion кольцо/число/fill/check обновляются без движения; hide (для непостоянного бейджа) остаётся через 1600 мс, CSS transition отключён. Таймеры и progress.stop очищаются при смене percent/unmount.

### 2.6. Остальные микродвижения анкеты

| Триггер | Реализация |
|---|---|
| Выбор пола | Контур opacity300 мс; фон/бордер кружка 260 мс; check opacity/scale.8→1 и pathLength0→1 за 240 мс; reduced duration0. [AuthFlow.tsx:304](../source/src/components/AuthFlow/AuthFlow.tsx#L304), [auth-flow.css:62](../source/src/components/AuthFlow/auth-flow.css#L62) |
| Возраст колесом/пальцем | MotionValue позиции, округление/докрутка spring260/30, без пружины в reduce. Дополнительный импульс отпускания по последней скорости. [AuthFlow.tsx:319](../source/src/components/AuthFlow/AuthFlow.tsx#L319), аналог в [Prototype.tsx:120](../source/src/Prototype.tsx#L120) |
| Генерация никнейма | Старый текст Y0→−22, новый 22→0 по surface spring400/40/1, после завершения overlay удаляется; reduce — без swap. [AuthFlow.tsx:365](../source/src/components/AuthFlow/AuthFlow.tsx#L365) |
| Проверка никнейма | Отложенная проверка 450 мс и вращающийся CSS spinner; reduce останавливает spinner. [AuthFlow.tsx:365](../source/src/components/AuthFlow/AuthFlow.tsx#L365), [auth-flow.css:170](../source/src/components/AuthFlow/auth-flow.css#L170) |
| Смена фона аватара | Crossfade550 мс (.22,1,.36,1), старая поверхность остаётся практически непрозрачной, чтобы не мигал фон. [AuthFlow.tsx:451](../source/src/components/AuthFlow/AuthFlow.tsx#L451) |
| Смена персонажа | Crossfade180 мс, без вращения/морфинга тела. [AuthFlow.tsx:454](../source/src/components/AuthFlow/AuthFlow.tsx#L454) |
| Первый назначенный аватар после выбора пола в профиле | Сначала decode изображения; затем avatar/background fade720 мс (.42,0,.22,1); далее 550/180 мс. [Prototype.tsx:92](../source/src/Prototype.tsx#L92) |
| Выбор интересов | Цвет 220 мс, розовый градиентный слой opacity280 мс, filter иконки 220 мс. [auth-flow.css:234](../source/src/components/AuthFlow/auth-flow.css#L234) |
| Плавающие подписи полей | Transform300 мс (.22,1,.36,1), изменение цвета 200–240 мс; reduced отключает. [auth-flow.css:27](../source/src/components/AuthFlow/auth-flow.css#L27), `:157`, `:280` |
| Цифры email-кода | Вход opacity0/Y4→opacity1/Y0, выходY−4/opacity0,180 мс (.22,1,.36,1). Проверка после полного кода 160 мс (reduce0), success удерживается 900 мс, keyboard hide, ещё 280 мс до intro. [AuthFlow.tsx:198](../source/src/components/AuthFlow/AuthFlow.tsx#L198), `:239` |

## 3. Премиум

### 3.1. Перелив логотипа Premium и семи граней алмаза

[PremiumSheet.tsx:24](../source/src/components/premium/PremiumSheet.tsx#L24), [premium-sheet.css:32](../source/src/components/premium/premium-sheet.css#L32). Это слой градиента под SVG-маской слова и отдельные семь clip-path-полигонов поверх исходного алмаза. Исходные SVG не заменяются анимационным растром.

Логотип: цикл 4.9 с cubic-bezier(.45,0,.55,1), delay.12 с, infinite. Светлая полоса шириной 124 px, высотой 75 px, gradient105°, X−136→272 px к 65.3% цикла (≈3.20 с), затем до 100% остаётся справа за маской; на следующем цикле возвращается за левый край. Многопиковые белые stop-ы создают хромовый перелив. Маска — [/assets/premium/2eb1f.svg](../source/public/assets/premium/2eb1f.svg) размер 218.755×74.671 px.

Алмаз: каждая грань имеет цикл 4.9 с с той же кривой; opacity0 на 0%,3%,43%,100%, peak на 18%. Индивидуальные задержки дают проход по поверхности:

| Грань | Delay, с | Peak opacity | Угол градиента |
|---|---:|---:|---:|
| table | 0 | .78 | 90° |
| crown-left | .12 | .70 | 130° |
| crown-centre | .32 | .54 | 110° |
| crown-right | .60 | .64 | 225° |
| pavilion-left | .68 | .62 | 145° |
| pavilion-centre | .94 | .40 | 115° |
| pavilion-right | 1.20 | .72 | 235° |

Полигоны заданы точными координатами исходного 73cc2.svg, общий размер 102.943×87.641 px. Активность — `open && inView && !document.hidden && !reduced`; CSS animation-play-state pause/run сохраняет фазу при скрытии. При reduced motion дополнительная маска и грани вообще не создаются/скрыты; исходные SVG видимы.

### 3.2. Фон и тарифы шторки премиума

`BokehMaterial` [PremiumSheet.tsx:34](../source/src/components/premium/PremiumSheet.tsx#L34): shader Bokeh с radius443,density10.80000019. В доступном runtime это blur исходных векторных пятен, а не доказанная бесконечная анимация фона. Safari без HTML-in-Canvas получает `bokeh-fallback.png` без GPU surface/frame loop. Не приписывать этому материалу движение только из-за названия shader.

Тарифы `:61–75`: press scale.975 (reduce opacity.9); выбранная поверхность crossfade200 мс, текст сдвигается на(+1.5,−.5) px по spring400/40/1; галочка opacity0→1 и scale.86→1 той же пружиной. Автодокрутка выбранной карточки действует только внутри горизонтального rail с 20px отступом: native smooth, reduce instant. Pointerdown прекращает предыдущую smooth-докрутку в текущей позиции.

Шторка открывается общим BottomSheet (см. общий раздел handoff о слоях/жестах); это не отдельная premium-specific временная шкала. Оплата — заглушка, кнопка лишь показывает уведомление «Оплата в прототипе не подключена».

Ассеты [/assets/premium/](../source/public/assets/premium/): `73cc2.svg` (алмаз), `2eb1f.svg` (слово), `3bf50.svg`,`c1226.svg`,`6e16b.svg`,`4f6f2.svg` (материал/маска), `bokeh-fallback.png`, `d90fe.webp`,`0a8ab.webp` (паттерн), `e9f2f.svg` (галочка), прочие иконки/материал кнопки. [PremiumPrice.tsx](../source/src/components/premium/PremiumPrice.tsx) содержит векторные цены; сами цены не имеют count-up анимации.

### 3.3. Плавающая иллюстрация баннера премиума в профиле

[Prototype.tsx:137](../source/src/Prototype.tsx#L137), [PremiumIllustration.tsx:2](../source/src/components/PremiumIllustration.tsx#L2), [prototype.css:375](../source/src/prototype.css#L375). Составная иллюстрация SVG: четыре слоя персонажа, пять слоёв глубины молнии, лицевая сторона и свет `plus-lighter`. Исходные affine matrices сохраняют глубину; движение применяется к двум группам целиком.

Персонаж:6.6 с ease-in-out infinite.0/100% translate(0,0),rotate0;35% translate(1.8,−2.4) px,rotate.96°;70% translate(−1.2,1.2),rotate−.72°. Молния:5.8 с ease-in-out infinite;35% translate(−1.8,−3.6),rotate−1.08°;70% translate(1.2,1.8),rotate.72°.

Подсветка кнопки:8 с ease-in-out infinite,0/100%(0,0),35%(.75,−.3)px,70%(−.5,.2)px. Золотая заливка, обводка и внутренние highlights самой кнопки статические.

Gate `active && inView && visible && !reduced`; пауза при профиле под редактором/настройками/удалением, скрытой вкладке или вне viewport. Reduced motion отключает CSS-анимации. Ассеты [/assets/profile/premium-vector/avatar-01.svg](../source/public/assets/profile/premium-vector/avatar-01.svg)…`avatar-04.svg`, `bolt-depth.svg`,`bolt-face.svg`,`bolt-light.svg`.

## 4. Иллюстрация приглашения уведомлений

[NotificationSheet.tsx:7](../source/src/components/AuthFlow/NotificationSheet.tsx#L7), [notification-sheet.css:11](../source/src/components/AuthFlow/notification-sheet.css#L11). Два исходных пузыря сообщений плавают отдельно с периодом 6 с ease-in-out infinite.

| Фаза | Белый | Зелёный |
|---|---|---|
| 0/100% | Y0 rotate0 | Y0 rotate0 scale1 |
| 25% | Y+3px rotate−1.5° | Y−5px rotate2° scale1.015 |
| 55% | Y−4px rotate1.5° | Y+2px rotate−1.5° scale1 |
| 80% | Y−1px rotate−.5° | Y−2px rotate.5° scale1.006 |

Белая группа transform-origin65%70%, зелёная 35%75%. Gate open && документ видим; pause/run сохраняет фазу. Reduced motion animation:none. Ассеты [/assets/auth/notification-white-source.svg](../source/public/assets/auth/notification-white-source.svg), `notification-green-source.svg`. Включение уведомлений в прототипе только сохраняет локальную отметку; реальный OS permission prompt не вызывается.

## 5. Живой спойлер скрытых данных

В диалоге [Prototype.tsx:484](../source/src/Prototype.tsx#L484) активен ShaderFill56×24 и статический [/assets/dialog/spoiler-fallback.png](../source/public/assets/dialog/spoiler-fallback.png). Параметры: particleSize≈1.4 px, particleDensity≈.26, animationSpeed≈1.05; цвет частицRGB(.1098,.07843,.02745),alpha.56; reveal0. Манифест анимирован только при `active && visible && !reduced`; speed0 в reduce. Родитель карточки дополнительно передаёт inView.

[LiveTelegramSpoiler.ts](../source/src/isolated-onboarding/lib/custom-effects/LiveTelegramSpoiler.ts): сетка частиц spacing1.65 px с hash-рандомизацией положения. Phase=`time*animationSpeed*2.4`; orbital drift по sin/cos с амплитудой.85 px при reveal0. Индивидуальное мерцание `.60+.28*sin(phase*2.2+angle)+.12*sin(phase*3.7+seedPhase)`. Плотность и radius меняются при reveal (в данном использовании reveal постоянно 0), поэтому это вечное мелкое живое зерно; нажатие открывает премиум, а не проигрывает reveal-анимацию. Результат premultiplied и прозрачный между частицами.

[src/isolated-onboarding/Spoiler.tsx](../source/src/isolated-onboarding/Spoiler.tsx) сохраняет самостоятельную обёртку со сходными параметрами, однако текущая intro-карточка показывает «—» и её не импортирует. Не считать эту обёртку отдельно активным эффектом онбординга.

## 6. Сохранённый компонент поиска: в опубликованной версии не подключён

В подтверждённых исходниках есть полностью реализованный `LivingSearchSilhouette`, однако компонент нигде не импортируется и не монтируется за пределами своей папки. Это **сохранённый исходный эффект, не подключённый в опубликованной версии**. Старый README утверждает обратное и содержит устаревшие числа. Для повторного подключения использовать реальные [config.ts](../source/src/components/LivingSearchSilhouette/config.ts), [renderer.ts](../source/src/components/LivingSearchSilhouette/renderer.ts), [shaders.ts](../source/src/components/LivingSearchSilhouette/shaders.ts), а не числовые параметры README.

Реализация: одна WebGL текстура-атлас, один quad и draw, силуэт 402×379 px. Огонёк движется по внешнему alpha-контуру головы/плеч, включая выступы, а не по овалу внутри. Математический путь берётся из [path.ts](../source/src/components/LivingSearchSilhouette/path.ts)/[contour-data.ts](../source/src/components/LivingSearchSilhouette/contour-data.ts), sample по нормированной фазе, начальная phase.128.

Реальные значения [config.ts:10](../source/src/components/LivingSearchSilhouette/config.ts#L10): loop12 с; хвост 7.5% длины контура, ширина 3 px, glow4 px, силуэт opacity1; standalone renderScale.8, DPRmax1.5,30FPS; полноэкранная scene60FPS, backing1 px на CSS px. Luma speed.65,intensity.30,width.90,bend1.55. Сила energy ограничивается intensity0…1, default.35.

[renderer.ts:103](../source/src/components/LivingSearchSilhouette/renderer.ts#L103): в searching фаза растёт равномерно, delta≤100 мс. При matched общее завершение 650 мс: первые 300 мс скорость огонька 1.65× по тому же контуру, затем точка остаётся на контуре; хвост сжимается, локальный свет вспыхивает и силуэт исчезает. Конкретно shader: contraction smoothstep(.34,.86,match), хвост сжимается до 1.5% исходной доли; flash smoothstep(.60,.72)*[1−smoothstep(.72,.90)]; fade1−smoothstep(.76,1). Reduced motion замораживает движение, выключает flash/contract и делает простой fade1−smoothstep(0,1,match).

Остановка: hidden, вне viewport, paused, потерянный контекст. При resume timestamp сбрасывается. WebGL compile/CORS/allocation failure — статический исходный силуэт и свет; при matched fallback opacity0 за 650 мс (ease, reduce linear). WebGL context restore пересоздаёт renderer. Ассеты: [/assets/chatus/character-original.png](../source/public/assets/chatus/character-original.png), `character-contour.png`, `search-light.svg`; fallback оригинального artwork — contour. Шейдер Luma в [luma.ts](../source/src/components/LivingSearchSilhouette/luma.ts) содержит процедурный фон.

## 7. Проверка переноса разработчиком

1. Открыть вход с обычным motion и с reduced motion; убедиться, что после сплэша элементы доступны, круг покрывает углы, картинки не мигают при первом появлении.
2. Смотреть welcome ≥13 с: центральный персонаж плавно меняется, рамка остаётся на месте, recycle не проходит через центр; скрыть/вернуть вкладку — скачка позиции быть не должно.
3. На intro дождаться подсказки, схватить карточку до неё/во время неё/на возврате; проверить непрерывный захват, мягкое сопротивление, инерционный возврат и отсутствие page scroll под пальцем.
4. Закончить анкету: семь полосок и проценты проверяются отдельно. Финальная карточка должна показать fill→check; профиль редактирования должен считать данные по 20%, синхронно обновлять ring и число, не сдвигать заголовок резко при hide.
5. Премиум смотреть≥6 с: один мягкий проход слова, последовательные отражения 7 граней, пауза когда шапка вне viewport; проверить fallback Safari и reduced motion.
6. Уведомления смотреть 6 с, баннер премиума 8 с; группы должны двигаться целиком с заданными фазами, не разъезжаться по слоям.
7. Отдельно проверить WebGL unavailable/context loss и WebGPU unavailable: интерфейс и исходные изображения остаются видимыми. Отсутствие GPU не должно блокировать дальнейшие шаги.
8. Поиск проверять отдельно только после решения, возвращать ли сохранённый компонент в текущую навигацию; не обещать разработчику, что соответствующий маршрут уже подключён.
