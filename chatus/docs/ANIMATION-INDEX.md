# Каталог анимаций Chatus

Краткий навигатор по фактической реализации. Полная спецификация: [вход, онбординг и премиум](ANIMATIONS-CORE.md), [чат, профили и интерфейс](ANIMATIONS-EXTENDED.md). Время пружины не фиксировано; `surface/scene`=400/40/1, `gesture`=300/30/.75, `send`=440/42/1 (stiffness/damping/mass). Размеры указаны в координатах дизайна 402 px. Полный [реестр механизмов](MOTION-COVERAGE.md) помогает проверить покрытие по исходникам.

| № | Группа | Что видно | Триггер | Основное время/механизм | Подробнее |
|---:|---|---|---|---|---|
| 1 | Загрузка | Блик проходит по логотипу | Старт приложения / replay | 360–1060 ms от старта | [CORE](ANIMATIONS-CORE.md#1-загрузка-и-вход) |
| 2 | Загрузка | Сердце появляется и возвращается к размеру | Splash timeline | 1040–1582 ms | [CORE](ANIMATIONS-CORE.md#1-загрузка-и-вход) |
| 3 | Загрузка | Круг раскрывает настоящий welcome | Splash timeline | 1835–2295 ms; complete2955 ms | [CORE](ANIMATIONS-CORE.md#1-загрузка-и-вход) |
| 4 | Вход | Пять персонажей едут и меняют размер в слотах | Welcome active после splash | Пауза 1100 + glide1450 ms; шаг 2550 ms | [CORE](ANIMATIONS-CORE.md#1-загрузка-и-вход) |
| 5 | Вход | Кнопка слегка уменьшается | Нажатие | scale .985; CSS active | [CORE](ANIMATIONS-CORE.md#1-загрузка-и-вход) |
| 6 | Онбординг | Стеклянная карточка поднимается/появляется | Вход сцены завершён | surface, opacity200 ms; y12→0 | [CORE](ANIMATIONS-CORE.md#2-онбординг-и-анкета) |
| 7 | Онбординг | Карточка даёт однократную подсказку наклоном | Через 850 ms после mount | 1.5 s, pitch/yaw keyframes | [CORE](ANIMATIONS-CORE.md#2-онбординг-и-анкета) |
| 8 | Онбординг | Карточка наклоняется в 3D и отражает свет | Удержание/drag | Прямое следование; возврат spring280/26/.7 | [CORE](ANIMATIONS-CORE.md#2-онбординг-и-анкета) |
| 9 | Онбординг | Золотые лучи за карточкой живут | Active+inView+visible | UV-деформация 10 s; fallback CSS12 s | [CORE](ANIMATIONS-CORE.md#2-онбординг-и-анкета) |
| 10 | Анкета | Экраны въезжают/возвращаются | Далее/назад/edge swipe | scene; предыдущий x−28%, scale.985 | [CORE](ANIMATIONS-CORE.md#2-онбординг-и-анкета) |
| 11 | Анкета | Заполняются семь полосок шага | Переход к следующему полю | scaleX0→1,480 ms | [CORE](ANIMATIONS-CORE.md#2-онбординг-и-анкета) |
| 12 | Онбординг | Значок 100% на итоговой карточке заливается и рисуется check | Покой сцены 100% | Не ранее 1000 ms; fill420/check360 ms | [CORE](ANIMATIONS-CORE.md#2-онбординг-и-анкета) |
| 13 | Анкета | Цифры email-кода сменяются | Ввод/удаление кода | opacity+Y±4,180 ms | [CORE](ANIMATIONS-CORE.md#2-онбординг-и-анкета) |
| 14 | Анкета/профиль | Выбор пола подсвечивается, галочка рисуется | Выбор пола | Контур 300 ms, check240 ms | [CORE](ANIMATIONS-CORE.md#2-онбординг-и-анкета) |
| 15 | Анкета/профиль | Колесо возраста следует пальцу и докручивается | Drag/wheel/стрелки | 61 px/год, spring260/30 | [EXTENDED](ANIMATIONS-EXTENDED.md#profile) |
| 16 | Анкета/профиль | Новый никнейм выезжает из-под старого | Случайный nickname | y22→0 / 0→−22, surface | [EXTENDED](ANIMATIONS-EXTENDED.md#profile) |
| 17 | Анкета/профиль | Spinner проверки nickname | Изменён корректный nickname | Debounce450 ms; spin750 ms | [EXTENDED](ANIMATIONS-EXTENDED.md#profile) |
| 18 | Анкета/профиль | Цвет и персонаж аватара crossfade | Выбор / первое назначение | Фон 550 ms, персонаж 180; первое 720 ms | [CORE](ANIMATIONS-CORE.md#2-онбординг-и-анкета) |
| 19 | Анкета/профиль | Интересы подсвечиваются | Выбор интереса | Цвет/filter220 ms, gradient opacity280 ms | [CORE](ANIMATIONS-CORE.md#2-онбординг-и-анкета) |
| 20 | Поля | Подписи всплывают, состояния меняют цвет | Фокус/непустое поле | transform300 ms, color200–240 ms | [CORE](ANIMATIONS-CORE.md#2-онбординг-и-анкета) |
| 21 | Профиль | Число процентов и дуга заполняются | Изменение одного из 5 полей | 900 ms, финал delay260 +1100 ms | [EXTENDED](ANIMATIONS-EXTENDED.md#profile) |
| 22 | Профиль |100% превращается в check и исчезает | Достигнуто 100% | fill420/check360; hide500, slot480 ms | [EXTENDED](ANIMATIONS-EXTENDED.md#profile) |
| 23 | Профиль | Редактор/настройки въезжают, фон отступает | Открыть раздел | scene; header250 ms | [EXTENDED](ANIMATIONS-EXTENDED.md#profile) |
| 24 | Профиль | Рамка темы переезжает, тумблер сдвигается | Выбор темы/настройки | shared layout/scene; бегунок 20 px | [EXTENDED](ANIMATIONS-EXTENDED.md#profile) |
| 25 | Профиль | Шторка nickname и клавиатура движутся вместе | Открыть/закрыть nickname | Simulator560/320 ms; native viewport | [EXTENDED](ANIMATIONS-EXTENDED.md#profile) |
| 26 | Премиум | Хромовый перелив слова Premium | Шторка visible+inView | Цикл 4.9 s, delay.12 s | [CORE](ANIMATIONS-CORE.md#3-премиум) |
| 27 | Премиум | Семь граней алмаза последовательно бликуют | Шторка visible+inView | Цикл 4.9 s, delays0…1.2 s | [CORE](ANIMATIONS-CORE.md#3-премиум) |
| 28 | Премиум | Тариф подсвечивается, текст и check смещаются | Выбор тарифа | fade200 ms + surface, rail smooth scroll | [CORE](ANIMATIONS-CORE.md#3-премиум) |
| 29 | Премиум | Персонаж, молния и glow в баннере плавают | Профиль active+inView | 6.6 s /5.8 s /8 s ease-in-out | [CORE](ANIMATIONS-CORE.md#3-премиум) |
| 30 | Уведомления | Два пузыря сообщений плавают по-разному | Notification sheet open | 6 s ease-in-out loop | [CORE](ANIMATIONS-CORE.md#4-иллюстрация-приглашения-уведомлений) |
| 31 | Скрытые данные | Мелкие частицы дрейфуют и мерцают | Карточка/peer active+visible | Shader time, speed1.05, reveal0 | [CORE](ANIMATIONS-CORE.md#5-живой-спойлер-скрытых-данных) |
| 32 | Чат | Строка сообщения растёт, история доскролливается | Отправка текста/voice/circle | height+opacity, send spring | [EXTENDED](ANIMATIONS-EXTENDED.md#chat) |
| 33 | Чат | Пузырь тянется вправо и возвращается | Swipe reply | Rubber after56 px, gesture return | [EXTENDED](ANIMATIONS-EXTENDED.md#chat) |
| 34 | Чат | Меню действий появляется над сообщением | Hold450 ms/context menu | scale.96/y6/opacity, surface | [EXTENDED](ANIMATIONS-EXTENDED.md#chat) |
| 35 | Чат | Реакция появляется и освобождает место снизу | Добавлена/удалена реакция | opacity200 ms; padding0↔22, surface | [EXTENDED](ANIMATIONS-EXTENDED.md#chat) |
| 36 | Чат | Цитируемое сообщение подсвечивается | Нажатие цитаты | Smooth scroll +brightness650 ms | [EXTENDED](ANIMATIONS-EXTENDED.md#chat) |
| 37 | Composer | Иконки меняются, поле расширяется, reply сдвигает текст | Текст/ответ/режим/клавиатура | fade200 ms, layout spring, reply480 ms | [EXTENDED](ANIMATIONS-EXTENDED.md#composer) |
| 38 | Voice | Волна реагирует на аудио и закрашивается по времени | Play голосового | FFT+RAF; bars60 ms linear; progress currentTime | [EXTENDED](ANIMATIONS-EXTENDED.md#voice) |
| 39 | Voice | Текст расшифровки разворачивается | Кнопка расшифровки | height0↔auto, opacity200 ms | [EXTENDED](ANIMATIONS-EXTENDED.md#voice) |
| 40 | Запись | Glow вращается и дышит от громкости, точка пульсирует | Активная voice запись | Glow8 s +RMS spring180/22/.6; точка 1.2 s | [EXTENDED](ANIMATIONS-EXTENDED.md#voice) |
| 41 | Запись | Замок поднимается/закрывается, режим закрепляется | Swipe вверх 64 px /короткий tap | lockY0→29, crossfade, gesture | [EXTENDED](ANIMATIONS-EXTENDED.md#voice) |
| 42 | Кружки | Видеокружок растёт и сворачивается | Play/ended | 220↔370 px, surface | [EXTENDED](ANIMATIONS-EXTENDED.md#circles) |
| 43 | Кружки | Once-кружок исчезает после просмотра | Ended у once | opacity spring, remove650 ms | [EXTENDED](ANIMATIONS-EXTENDED.md#circles) |
| 44 | Кружки | Панель demo записи появляется | Открыт recorder preset | opacity200 ms; gestures64 px | [EXTENDED](ANIMATIONS-EXTENDED.md#circles) |
| 45 | Медиа | Меню вложений, редактор и viewer появляются | Открытие/закрытие | fade200 ms; menu scale.98/y6, surface | [EXTENDED](ANIMATIONS-EXTENDED.md#media) |
| 46 | Медиа | Подсказка once, иконки и filmstrip меняются | Once/focus подписи/выбор фото | fade200 ms, tooltip surface, smooth rail | [EXTENDED](ANIMATIONS-EXTENDED.md#media) |
| 47 | Стикеры | Pill и панели переключаются | Таб стикеры/GIF | Pill surface, panels200 ms | [EXTENDED](ANIMATIONS-EXTENDED.md#media) |
| 48 | Дружба | Loader завершается, круг заливается, check рисуется | pending→accepted | Spin.9 s; три этапа по 200 ms | [EXTENDED](ANIMATIONS-EXTENDED.md#friendship) |
| 49 | Дружба | Карточка заявки меняет высоту | pending→accepted/declined | 271→182 px, surface | [EXTENDED](ANIMATIONS-EXTENDED.md#friendship) |
| 50 | Диалог | Presence меняется на «завершён» | Завершение диалога | Crossfade200 ms | [EXTENDED](ANIMATIONS-EXTENDED.md#friendship) |
| 51 | Peer | Профиль собеседника въезжает поверх чата | Открыть профиль | scene, background x−28%/scale.985 | [EXTENDED](ANIMATIONS-EXTENDED.md#peer) |
| 52 | Peer | Header сжимается, ellipse и rail меняются со скроллом | Вертикальный scroll | Scroll timeline /smoothstep, без duration | [EXTENDED](ANIMATIONS-EXTENDED.md#peer) |
| 53 | Peer | Pill вкладок едет, контент сдвигается по направлению | Выбор media/audio/links/GIF | 200 ms, X±402 | [EXTENDED](ANIMATIONS-EXTENDED.md#peer) |
| 54 | Чат | Карточка собеседника наклоняется с отражением | Held drag по карточке | perspective700, gesture return | [EXTENDED](ANIMATIONS-EXTENDED.md#peer) |
| 55 | Удаление | Причины/поле появляются, slider тянется и возвращается | Выбор/drag confirmation | check240 ms, field300; slider94% threshold | [EXTENDED](ANIMATIONS-EXTENDED.md#deletion) |
| 56 | Удаление | Shine проходит по тексту slider | Confirmation open+visible | 3.2 s linear infinite | [EXTENDED](ANIMATIONS-EXTENDED.md#deletion) |
| 57 | Слои | BottomSheet едет, overlay растворяется, drag закрывает | Любая app шторка | surface +fade200 ms, velocity projection | [EXTENDED](ANIMATIONS-EXTENDED.md#runtime) |
| 58 | Runtime | Клавиатура, scroll, carousel и bounce следуют жесту | Focus/drag/release | surface либо exp decay2.1/bounce200/40 | [EXTENDED](ANIMATIONS-EXTENDED.md#runtime) |
| 59 | Общие | Нажатие слегка уменьшает кнопку, tooltip всплывает | Press/hover/focus | scale.985+surface; tooltip200 ms | [EXTENDED](ANIMATIONS-EXTENDED.md#tokens) |
| 60 | Сохранённый поиск | Огонёк идёт по контуру, совпадение завершает сцену | Компонент сохранён, **не подключён в текущем flow** | Loop12 s; match650 ms | [CORE](ANIMATIONS-CORE.md#6-сохранённый-компонент-поиска-в-опубликованной-версии-не-подключён) |

Reduced motion и hidden/inView различаются по компонентам и подробно указаны в спецификациях. Бесконечные декоративные циклы обычно останавливаются, а доступные действия сохраняются.

Не путать с анимациями: GIF-превью и Figma video-постеры статичны; progress.svg расширенного кружка статичен; Bokeh — материал без доказанного бесконечного движения; цифровой таймер удаления просто меняет текст раз в секунду. На intro-карточке 20% и итоговой 100% заданы фиксированно, между ними нет count-up. Старые/неиспользуемые определения отмечены в реестре.

