# Chatus: интерфейсные анимации вне входа и премиума

Аудит исходников `source/`, соответствующих опубликованному мобильному прототипу. Ссылки `src/...:строка` ниже отсчитываются внутри `source/`. Это спецификация фактического кода, а не обещание продакшен-функций. Значения размеров ниже заданы в координатах исходного экрана 402 px; внешний масштаб устройства применяется отдельно. Для пружин время не фиксировано: длительность зависит от расстояния, начальной скорости и порога остановки.


## Быстрые ссылки на исходный код

| Механизм | Код |
|---|---|
| Motion tokens и press | [motion.ts](../source/src/ui/motion.ts#L2), [press.ts](../source/src/ui/press.ts#L11) |
| Сообщения, swipe, voice и запись | [ChatConversation.tsx](../source/src/components/ChatConversation.tsx#L25) |
| Панель чата и синхронизация истории | [Prototype.tsx](../source/src/Prototype.tsx#L649) |
| Шторки | [AppSheet.tsx](../source/src/components/AppSheet.tsx#L14) |
| Friendship loader | [ChatActions.tsx](../source/src/components/ChatActions.tsx#L60) |
| Кружки | [ChatVideoCircle.tsx](../source/src/components/ChatVideoCircle.tsx#L10), [ChatCircleRecorder.tsx](../source/src/components/ChatCircleRecorder.tsx#L9) |
| Медиа и viewer | [ChatMedia.tsx](../source/src/components/ChatMedia.tsx#L215) |
| Профиль собеседника и scroll | [PeerProfile.tsx](../source/src/components/PeerProfile.tsx#L105) |
| Наклон карточки | [useCardTilt.ts](../source/src/ui/useCardTilt.ts#L7) |
| Проценты профиля | [Prototype.tsx](../source/src/Prototype.tsx#L49) |
| Удаление slider | [Prototype.tsx](../source/src/Prototype.tsx#L208) |
| Scroll physics | [MobileScroll.tsx](../source/src/mobile/MobileScroll.tsx#L17), [Carousel.tsx](../source/src/mobile/Carousel.tsx#L20) |
| Клавиатура | [Keyboard.tsx](../source/src/mobile/Keyboard.tsx#L113) |

<a id="tokens"></a>

## Общие параметры движения

Источник: `src/ui/motion.ts:2`, `src/ui/press.ts:11`.

| Токен | Параметры | Применение |
|---|---|---|
| `surface`, `scene` | spring, stiffness 400, damping 40, mass 1 | шторки, экранные переходы, размеры, переключатели |
| `gesture` | spring, stiffness 300, damping 30, mass 0.75 | возврат свайпа, замок записи, наклон карточек |
| `send` | spring, stiffness 440, damping 42, mass 1 | появление сообщения и синхронный доскролл |
| `fade` | 200 ms, cubic-bezier(.2,0,.2,1) | прозрачность, иконки, подсказки |
| `input` | 300 ms, cubic-bezier(.22,1,.36,1) | поля ввода |
| `STILL` | duration 0 | большинство вариантов reduced motion |

Общий press feedback: во время нажатия scale .985 и opacity .88, отпускание перенаправляет ту же `surface`-пружину. При reduced motion остаётся только opacity .88, без масштабирования и с нулевой длительностью. Не все старые CSS-кнопки используют этот helper; переносить поведение нужно по реальному `getPressProps`/`data-chatus-press`, а не глобально на все элементы.

<a id="chat"></a>

## Чат: сообщения, ответы и реакции

Источник: `src/components/ChatConversation.tsx:79–183`, `src/Prototype.tsx:641`, `src/Prototype.tsx:649–772`.

| Событие | Что происходит | Параметры/условия |
|---|---|---|
| Отправлено новое сообщение (`fresh`) | Высота строки растёт от 0 до фактической высоты пузыря + gap; opacity = clamp(height/target,0,1). После окончания height становится auto | `UI_MOTION.send`. У кружков target дополнительно включает 16 px. Это перестройка потока, а не полёт пузыря из поля ввода |
| Отправка при истории выше нижнего края | `scrollGap` пружинит к 0; история и composer пересчитываются в одном кадре | Та же `send`-пружина; повторная отправка сохраняет текущую позицию/скорость, не запускает сцену с нуля. Pointerdown/wheel прерывают автоскролл |
| Появилась/исчезла реакция | Нижний отступ строки плавно меняется между 0 и 22 px; сама реакция появляется прозрачностью | Отступ `surface`, opacity `fade`. Отступ складывается с ещё идущим появлением сообщения |
| Свайп пузыря вправо для ответа | Пузырь следует пальцу, после 56 px получает сопротивление; после отпускания возвращается | До 56: x=travel; далее x=56+24*(1-exp(-(travel-56)/48)). Захват после 12 px горизонтального движения вправо, вертикаль уступает скроллу. Ответ при dx>44 px. Возврат `gesture` с реальной release velocity |
| Удержание сообщения | Открывается меню действий | Hold 450 ms; отменяется при смещении >8 px. Double click и R также вызывают ответ, context menu/Shift+F10/Enter открывают действия |
| Переход к цитате | Smooth scroll к сообщению с верхним отступом 156 px и короткая подсветка | `filter:brightness(1) → .94 → 1`, 650 ms через Web Animations. Reduced motion: instant scroll, 0 ms |
| Изменился конец группы сообщений | Скругление пузыря изменяется | 240 ms cubic-bezier(.32,0,.2,1), `src/prototype.css:877` |

При reduced motion появление строки, возврат свайпа и перерасчёт отступов выполняются сразу; swipe reply остаётся доступным, но сам пузырь не перемещается. История не должна прыгать дважды при одновременной отправке и сворачивании поля записи.

Меню сообщения (`src/components/ChatActions.tsx:19–57`): opacity 0→1, scale .96→1, y 6→0, `surface`; выход opacity→0. Reduced motion: без масштаба/сдвига, opacity 120 ms. Выбранная строка получает статичный розовый фон, который не является отдельной анимацией.

<a id="composer"></a>

## Поле ввода, клавиатура и нижняя панель чата

Источник: `src/components/ChatConversation.tsx:220–330`, `src/components/chat-entry.css:1–25`, `src/Prototype.tsx:714–772`.

- Переключение «микрофон ↔ отправить», «клавиатура ↔ меню», обычного composer ↔ записи и reply preview: `fade` 200 ms; иконка режима дополнительно scale .9↔1.
- Форма поля: border radius 24 px для одной строки без ответа, иначе 20 px, `surface`. Высота измеряется из текста и reply; она участвует в единой геометрии footer/history, а не в нескольких конкурирующих CSS-анимациях.
- Появление ответа сдвигает слой текста и каретки на `--chat-reply-height`, 480 ms cubic-bezier(.32,0,.2,1). В native режиме и при перетаскивании клавиатуры этот CSS transition отключён. Старые правила top/height в `prototype.css` переопределены `chat-entry.css` и поздними overrides.
- Нижняя навигация скрывается opacity 1→0 и y 0→12 при клавиатуре; opacity использует `fade`, y следует общей геометрии.
- В режиме симулятора `bottom/composer/actions/keyboard travel/mask` интерполируются одним `surface`-прогрессом. При drag или reduced motion кадр сразу соответствует пальцу/целевой геометрии.
- На настоящем мобильном браузере положение берётся из VisualViewport. Composer, история и mask получают один общий commit; отдельная временная имитация движения системной клавиатуры не запускается. Меню и клавиатура обмениваются уже занимаемым пространством, чтобы не получить удвоенную высоту.
- Пустая/синтетическая каретка: 1 s `step-end`, opacity 1 на 0–45% и 100%, 0 на 50–95%. Reduced motion выключает мигание. Непустой текст на native использует системную каретку и IME.

Важная оговорка: `ChatOutgoingMask` в текущем коде — материал/геометрия исходящего сообщения, а не отдельный эффект исчезновения. `chat-composer-mask` имеет поздний `transition:none!important`; ранний CSS transition маски не следует воспроизводить как действующую анимацию.

<a id="voice"></a>

## Голосовые сообщения и запись

Источник: `src/components/ChatConversation.tsx:25–76`, `src/components/ChatConversation.tsx:186–207`, `src/components/ChatConversation.tsx:289–330`, `src/prototype.css:767–825`, `src/prototype.css:908–910`.

**Воспроизведение голосового.** Play/pause и подложка crossfade 200 ms. Прогресс волны — clipPath `inset(0 (100-progress*100)% 0 0)`, где progress = audio.currentTime/duration. Звук анализируется Web Audio (`fftSize=256`, smoothingTimeConstant .65); для 37 полос берётся частотный bin `2+floor(i*1.7)`, амплитуда min(1,bin/180). Высота каждой полосы масштабируется `clamp(.45+level*1.25,.35,29/baseHeight)`; CSS сглаживает transform за 60 ms linear. При паузе и reduced motion полосы возвращаются к scaleY(1), временной прогресс остаётся функциональным. Текст расшифровки разворачивает height 0↔auto и opacity 0↔1 за `fade`.

Audio currentTime отслеживается через requestAnimationFrame; React-текст времени обновляется только на границе 1/5 секунды. При уходе из чата/скрытии документа воспроизведение останавливается; запуск другого аудио/кружка останавливает предыдущее через `chatus-voice-play`. При once-demo после окончания появляется «Прослушано»; серверного удаления в прототипе нет.

**Живая запись.** Энергия микрофона = min(1,RMS(time-domain samples)*6). Она сглаживается spring 180/22/.6 и управляет золотым glow: scale = 1+energy*.12, opacity=.7+energy*.3. Reduced motion фиксирует scale/opacity на 1. Сам SVG glow вращается 360° за 8 s linear infinite; при document.hidden/reduced/выходе из записи paused. Розовая точка записи пульсирует 1.2 s ease-in-out infinite, opacity .45 в середине; reduced motion отключает пульс.

Захват микрофона начинается на pointerdown. Горизонтальный уход влево >64 px отменяет запись. Движение вверх даёт lockProgress=clamp((startY-currentY)/64,0,1); при 1 запись закрепляется. Короткое отпускание <220 ms также закрепляет, более длинное отправляет. `pointercancel` отменяет. Замок движется y 0→29 px; открытая и закрытая иконки crossfade по прогрессу [0,.6,1] с opacity [1,.4,0] и [0,.4,1]. Автоматическое изменение состояния использует `gesture`-пружину. После отправки clearance и высота composer связаны с прогрессом входящей строки, чтобы не было пустого зазора.

<a id="circles"></a>

## Видеокружки

Источник: `src/components/ChatVideoCircle.tsx:10–77`, `src/components/ChatCircleRecorder.tsx:9–70`, `src/components/circle-geometry.ts:14`.

- Нажатие playable-кружка увеличивает контейнер 220×220→370×370 px через `surface`; после окончания он сворачивается. Внутренний inset 2 px для исходящего, 3 px для входящего. Прямой poster→video swap связан с `started`, отдельного crossfade нет.
- Время берётся из video.currentTime; обновления текста ограничены 5 раз/сек. Кружок останавливается вне видимой области, при inactive, document.hidden и запуске другого voice/circle.
- Once-кружок после окончания становится consumed, opacity→0 с `surface`; удаление DOM через 650 ms (0 при reduced motion). Явный preview «просмотрено» сохраняет исходный end-frame.
- В расширенном кружке картинка progress.svg статична. Код не рисует прогресс по окружности на основе времени: разработчику нельзя принять её за полноценный динамический circular progress.
- Панель записи кружка появляется/исчезает opacity 200 ms. Она является визуальным тестовым контроллером: камеру/микрофон сама не открывает. Свайп влево >64 px отменяет; вверх >64 px закрепляет; release guard предотвращает случайную отправку после закрепления. Время 1/2 секунды в этом экране — preset, а не настоящий таймер камеры. Набор demoSrc передаётся явно.
- Подсказка once в recorder скрывается через 3 s. Иконки/кнопки используют общий press feedback. Recorder glow — статичная картинка, в отличие от вращающегося voice glow.

<a id="media"></a>

## Вложения, медиавьюер и стикеры

Источник: `src/components/ChatMedia.tsx:130–178`, `src/components/ChatMedia.tsx:215–327`, `src/components/ChatStickers.tsx:20–41`.

| Элемент | Анимация |
|---|---|
| Меню источника вложения | Слой opacity 0↔1 `fade`; само меню y 6↔0, scale .98↔1, `surface` |
| Предпросмотр и полноэкранный в пределах телефона viewer | opacity 0↔1, `fade` |
| Once-переключатель | Outline/filled SVG crossfade `fade` |
| Подсказка once во вложениях | opacity + y 4↔0, `surface`, автоскрытие 2600 ms |
| Filmstrip при фокусе подписи | opacity 1→0, `fade`; при возврате 0→1 |
| Выбор фото в viewer | Само фото меняется без отдельного перехода; ряд миниатюр `scrollTo(..., behavior:'smooth')` центрирует выбранную с шагом 74 px; reduced motion — auto |
| Видео | Нативное воспроизведение, таймер/slider следует currentTime; при hidden pause. Figma video-poster отображается картинкой и не воспроизводится |
| Once-вложение | Скрывается после завершения exit viewer; это локальное demo-потребление |
| Таб стикеров/GIF | Pill x 0↔89 и width по TAB_WIDTHS, `surface`; панели opacity crossfade 200 ms |

GIF в picker и GIF-вкладке профиля — **статичные превью**. Это явно написано в aria-label и реализовано обычными PNG/JPG; живой GIF-анимации в этом наборе нет.

Общая `ChatHint` (`src/components/ChatHint.tsx:4`): hover/focus или show открывают opacity 0→1, y 3→0 за `fade`; уход/blur закрывают в обратную сторону. Escape снимает hover-состояние. Reduced motion — сразу и без сдвига.

<a id="friendship"></a>

## Заявка в друзья и окончание диалога

Источник: `src/components/ChatActions.tsx:60–110`, `src/Prototype.tsx:479–509`, `src/Prototype.tsx:635`.

- Pending-индикатор крутится 360° за .9 s linear infinite; ring target .72. Активен лишь при active+inView+visible и без reduced motion.
- Переход pending→accepted: довести ring до 1 (`fade` 200 ms), затем заполнить круг (`fade` 200 ms), затем нарисовать check pathLength 0→1 (`fade` 200 ms). Одновременно badge background/color меняется с розового на зелёный за 200 ms. При declined ставится статичная красная иконка и цвет.
- Incoming friend card при смене pending→resolved меняет height 271→182 px; outgoing height 186 px. Вход opacity 0→1 и y 8→0 с `surface`.
- Presence/«диалог завершён» crossfade 200 ms. Онлайн-точка скрывается той же прозрачностью.
- Кнопка «Дальше» сначала меняет текст на «Точно?», через 5 s возвращается. Это таймер состояния, не морфинг текста.
- Toast живёт 2600 ms; CSS задаёт его положение/материал, отдельной enter-анимации у самого toast в текущем render нет.
- End-confirmation использует общую app BottomSheet. Оценка, завершение и next остаются состояниями прототипа; отдельный production backend из анимаций не следует.

<a id="peer"></a>

## Переход в профиль собеседника, скролл и spoiler

Источник: `src/Prototype.tsx:786–823`, `src/components/PeerProfile.tsx:37–46`, `src/components/PeerProfile.tsx:89–166`.

- При открытии профиль едет x 402→0 через `scene`. Нижележащий диалог и header уходят x 0→−112.56 (=−402*.28), scale 1→.985 той же пружиной; закрытие возвращает их. Выходящий слой сразу inert и не перехватывает ввод.
- Вкладки медиа: pill перемещается по x [0,76,221,303], width [76,145,82,52], 200 ms. Панель входит с ±402 px и выходит в противоположную сторону за тот же fade-timing. Направление берётся из порядка вкладок, reduced motion — мгновенно без x.
- Стягивание большого профиля в компактный header привязано к **scroll position**, а не времени. smoothstep(t)=t²(3−2t), t=clamp((scroll−start)/(end−start),0,1). Compact opacity растёт на y=128…200, y-offset 6→0; большой identity opacity убывает на 100…184.
- Media rail стоит на max(132,tabsTop−scrollY). Нижний bounce не двигает уже pinned rail, верхний rubber-band двигает его вместе с контентом.
- Верхняя эллиптическая маска: rx=846.5−92*sticky, ry=169.5−5*sticky; cy=−61.5+8*smoothstep(y,0,339)+73*sticky, sticky=smoothstep(y,tabsTop−132,tabsTop+25). Если браузер поддерживает scroll timelines, используется CSS animation-timeline; иначе те же формулы MotionValue. Это два механизма одной композиции, не две разные анимации.
- Скрытые пол/возраст: ShaderFill LiveTelegramSpoiler 40×16, particleSize1.4, density .24, ink RGBA(28/255,20/255,7/255,.56), bubble(244/255,...,1), reveal0, animationSpeed1.05. Движение только active+inView+visible&&!reduced. Нажатие открывает премиум; автоматического раскрытия пола/возраста нет.

Наклон карточки собеседника в истории чата (`src/Prototype.tsx:493`, `src/ui/useCardTilt.ts:7–17`) активен только при удержании: perspective700; pitch=softTilt(startPitch−dy/height*26,10), yaw=softTilt(startYaw+dx/width*26,12). Mouse захватывает сразу, touch после 8 px горизонтального намерения; вертикаль уступает скроллу. При отпускании две `gesture`-пружины возвращают pitch/yaw к 0 с вычисленной скоростью последних 80 ms (хранятся samples 100 ms, при release age>80 ms скорость 0, clamp скорости ±90°/s). Reflection — radial gradient с центром (50+yaw*2)%,(50−pitch*2)% и opacity min(.2,hypot(pitch,yaw)/35). При reduced motion tilt отключён. Карточка не переводится по x/y.

У этой карточки собственный DialogSpoiler (`src/Prototype.tsx:484`): 56×24 px, density .26, bubble RGB249 (в отличие от peer-profile 40×16/density.24/RGB244). Остальные параметры частиц и visibility/reduced gates сходны. Нельзя потерять разницу материала/размера, вынеся всё в один generic placeholder.

<a id="profile"></a>

## Собственный профиль, проценты и поля

Источник: `src/Prototype.tsx:48–111`, `src/Prototype.tsx:149–180`, `src/prototype.css:123–132`, `src/prototype.css:330–334`, `src/prototype.css:369`.

Процент = число заполненных nickname, age, interests, gender, bio ×20. Аватар не добавляет проценты. Обычное изменение кольца и цифры: 900 ms cubic-bezier(.42,0,.22,1), цифра Math.round(progress*100). Финал с предыдущего значения <100: delay260 ms, ring1100 ms; через 60 ms fill (opacity/scale .88→1 за 420 ms), через 420 ms phase-check (stroke-dashoffset1→0 за 360 ms, opacity180 ms). Через 1760 ms после check badge начинает hide: opacity/filter/translateY(−1)/scale(.97) за 500 ms; slot width и margin схлопываются за 480 ms после 340 ms задержки. При `persistent` badge остаётся. Reduced motion: ring/fill/check мгновенные, hide через 1600 ms.

Ранний `profile-complete-accent` scale1→1.1→1 переопределён правилом `.phase-check svg{animation:none}`: финальный код **не подпрыгивает**.

Первое назначение аватара после выбора пола: сначала decode картинки, затем картинка и фон появляются 720 ms cubic-bezier(.42,0,.22,1). Дальнейший выбор цвета crossfade550 ms cubic-bezier(.22,1,.36,1), персонажа 180 ms. Старый фон на выходе держит opacity.999, что предотвращает просвет под новым.

Редактор/настройки/уведомления: новый экран x402→0, underlying x0→−112.56 и scale1→.985, `scene`; header fade250 ms. Тема оформления использует shared layoutId рамки, `scene`. Тумблер переводит бегунок x0↔20, `surface/scene`; фон 350 ms cubic-bezier(.45,0,.55,1).

Мелкие реакции профиля: floating label300 ms cubic-bezier(.22,1,.36,1), цвет 240 ms; выбор цветового swatch width/height220 ms cubic-bezier(.22,1,.36,1), обводка персонажа 220 ms opacity; gender-selection300 ms opacity, SVG галочка pathLength и scale .8→1 за 240 ms; Save opacity/background260 ms.

Возраст (`src/Prototype.tsx:120–135`): колесо напрямую следует вертикальному drag, 61 px на год в исходных координатах; границы 18…99. На release целое значение=round(position−recentVelocity*110/scale/61), velocity clamp±3 px/ms и считается недавней только≤80 ms. При tap выбирается строка относительно центра 173 px; wheel и стрелки меняют возраст на 1. Доведение к целому spring stiffness260/damping30; reduced motion сразу.

Nickname: проверка после 450 ms debounce; spinner750 ms linear infinite, при reduced motion неподвижный. Случайный nickname сменяется вертикально: предыдущий y0→−22, новый y22→0, `surface`. В симуляторе шторка и клавиатура входят одной sampled spring-like CSS linear-кривой за 560 ms; при закрытии обе движутся с текущего transform вниз за 320 ms cubic-bezier(.2,.8,.2,1). Reduced motion1 ms. На native вход следует системной клавиатуре и не использует этот симуляторный цикл.

<a id="deletion"></a>

## Удаление профиля: slider и таймер

Источник: `src/Prototype.tsx:195–255`, `src/prototype.css:486–523`.

- Причины: SVG selection opacity260 ms, галочка pathLength240 ms. Поле «другая причина» появляется opacity/y6→0 и исчезает opacity/y0→4 за 300 ms cubic-bezier(.22,1,.36,1); focused content y−61 через `scene`.
- Ползунок удаления перемещается непосредственно пальцем на 0…298 px; отпускание ≥94% подтверждает, иначе `scene` возвращает в 0. Доведение до конца после подтверждения 180 ms cubic-bezier(.22,1,.36,1). Label opacity по x=[0,74.5,208.6] → [1,.65,0]. Клавиши меняют прогресс шагами 10%; Enter/Space подтверждают только после 94%.
- Текст «Проведи для удаления» имеет белый shine через background-position200%→0% за 3.2 s linear infinite. Running только при открытой видимой confirmation и без reduced motion.
- Pending deletion screen crossfade350 ms. Таймер DD:HH:MM:SS пересчитывается раз в секунду, из deadline−Date.now(), и синхронизируется после visibilitychange. Это цифровая смена текста без roller-анимации. Хранение deadline локальное; реального удаления аккаунта код не выполняет.

<a id="runtime"></a>

## Общие шторки и физика runtime

Источник: `src/components/AppSheet.tsx:14–33` — **применяемая app шторка**. Она отличается от базового `src/mobile/BottomSheet.tsx`, который также сохранён в runtime.

App BottomSheet: height=max(260,round(screenHeight*snap)); y начинает с height+36 и пружинит к 0 (`surface`). Overlay fade200 ms. Drag напрямую пишет y=max(0,grab+offsetY); закрытие если y+velocityY*.2 > min(160,height*.34), иначе возврат с release velocity. Exit едет на height+36. Клавиатура скрывается перед открытием, кроме шторок с intentional initialFocus. Reduced motion —0 ms. Radix focus scope и inert на выходе должны сохраняться: анимационный слой не блокирует следующий экран после логического закрытия.

`src/mobile/BottomSheet.tsx` (базовый runtime): close threshold96 px либо velocity>.55 вниз; exit spring250/30/1.05, enter500/43/.9; overlay160 ms. Не подменять этим действующие app-sheet параметры.

Симулированная клавиатура (`src/mobile/Keyboard.tsx:113–182`, `src/mobile/Keyboard.tsx:214`): `surface`-пружина, drag задаёт transform напрямую. Отпускание ниже 76 px или velocity>.45 px/ms закрывает, иначе возвращает. Native keyboard геометрия берётся из viewport. Компоненты input/textarea связаны с KeyboardProvider, это важно для синхронного footer.

`Carousel` и `MobileScroll` (`src/mobile/Carousel.tsx:20`, `src/mobile/MobileScroll.tsx:17`) используют requestAnimationFrame-физику: скорость*=exp(−2.1*dt), stop при |v|<18; release speed из последних 100 ms ×890; overdrag=.5*distance, ограничение±96 px. Bounce: acceleration=−200*x−40*v, initial velocity clamp±1400, stop при |x| и |v|<.5, dt≤.034 s. Tap slop/drag intent8 px. После drag подавляется ошибочный click. На настоящем устройстве native scroll остаётся владельцем жеста. У этих самописных физических циклов нет собственного useReducedMotion-ветвления; не следует утверждать глобальное отключение инерции.

`FlowStack` (`src/mobile/FlowStack.tsx:139–174`): back swipe только с левых 28 px, текущий экран следует пальцу, предыдущий движется на .28 текущего dx; pop если x+velocity*.2>92 px. Возврат `scene` с velocity. Reduced motion исключает видимый drag/переход; клавиатура скрывается перед push/pop/replace. В основном Chatus часть сцен собрана напрямую в Prototype, поэтому FlowStack — механизм runtime, не доказательство дополнительного видимого пользовательского перехода.

Служебная рамка: device menu120 ms ease-out (opacity0/scale.98/y−2→opacity1/scale1/y0), scrollbar fade150/180 ms; pointer cursor opacity90 ms, материал 80 ms. Это анимации симулятора, отдельно от интерфейса продукта.

<a id="checks"></a>

## Что проверить при переносе

1. Один и тот же жест прерывает текущую пружину и продолжает от показанной позиции; не возвращает контрол в старую логическую точку.
2. Voice glow, pending loader и shader не продолжают бесконечный цикл на скрытом экране; аудио/видео паузятся при hidden/inactive.
3. Отправка текста/voice/circle при открытой клавиатуре не вызывает второго скачка истории.
4. Reduced motion проверяется по компоненту: большинство анимаций мгновенно, однако message-menu fade120 ms и собственная scroll inertia имеют отдельные оговорки.
5. Статичные GIF/poster/progress.svg и demo timer не выдаются за отсутствующее настоящее медиа или production progress.

