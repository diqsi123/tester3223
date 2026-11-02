# Реестр покрытия motion-аудита

Сгенерировано по исходникам, 2026-11-02. Это поисковый реестр: наличие определения не означает, что оно активно в текущей сцене. Фактические триггеры и поздние CSS overrides разобраны в спецификациях. Таймеры, layout observers и requestAnimationFrame могут обслуживать геометрию, а не отдельную визуальную анимацию.

## Определения CSS keyframes

| Keyframes | Исходник | Статус/примечание |
|---|---|---|
| `auth-nickname-check-spin` | [src/components/AuthFlow/auth-flow.css:174](../source/src/components/AuthFlow/auth-flow.css#L174) | см. компонент и animation-play-state |
| `notification-white-life` | [src/components/AuthFlow/notification-sheet.css:16](../source/src/components/AuthFlow/notification-sheet.css#L16) | см. компонент и animation-play-state |
| `notification-green-life` | [src/components/AuthFlow/notification-sheet.css:17](../source/src/components/AuthFlow/notification-sheet.css#L17) | см. компонент и animation-play-state |
| `questionnaire-glow-life` | [src/components/AuthFlow/questionnaire-glow.css:9](../source/src/components/AuthFlow/questionnaire-glow.css#L9) | см. компонент и animation-play-state |
| `chat-status-turn` | [src/components/chat-actions.css:93](../source/src/components/chat-actions.css#L93) | legacy; действующий pending loader вращается Motion animate() |
| `nickname-checking` | [src/components/mobile-app.css:62](../source/src/components/mobile-app.css#L62) | см. компонент и animation-play-state |
| `premium-wordmark-shine` | [src/components/premium/premium-sheet.css:43](../source/src/components/premium/premium-sheet.css#L43) | см. компонент и animation-play-state |
| `premium-facet-glint` | [src/components/premium/premium-sheet.css:44](../source/src/components/premium/premium-sheet.css#L44) | см. компонент и animation-play-state |
| `profile-complete-accent` | [src/prototype.css:202](../source/src/prototype.css#L202) | переопределён animation:none в позднем CSS |
| `profile-person-float` | [src/prototype.css:381](../source/src/prototype.css#L381) | активные слои PremiumIllustration; gate data-animated |
| `profile-lightning-float` | [src/prototype.css:382](../source/src/prototype.css#L382) | активные слои PremiumIllustration; gate data-animated |
| `profile-source-glow-drift` | [src/prototype.css:407](../source/src/prototype.css#L407) | см. компонент и animation-play-state |
| `profile-nickname-coupled-enter` | [src/prototype.css:412](../source/src/prototype.css#L412) | см. компонент и animation-play-state |
| `profile-nickname-sheet-exit` | [src/prototype.css:415](../source/src/prototype.css#L415) | см. компонент и animation-play-state |
| `profile-nickname-keyboard-exit` | [src/prototype.css:416](../source/src/prototype.css#L416) | см. компонент и animation-play-state |
| `profile-nickname-check-spin` | [src/prototype.css:427](../source/src/prototype.css#L427) | см. компонент и animation-play-state |
| `profile-delete-shimmer` | [src/prototype.css:522](../source/src/prototype.css#L522) | см. компонент и animation-play-state |
| `chat-record-pulse` | [src/prototype.css:777](../source/src/prototype.css#L777) | см. компонент и animation-play-state |
| `chat-caret-blink` | [src/prototype.css:824](../source/src/prototype.css#L824) | см. компонент и animation-play-state |
| `chat-record-glow-turn` | [src/prototype.css:909](../source/src/prototype.css#L909) | см. компонент и animation-play-state |
| `device-menu-in` | [src/styles.css:140](../source/src/styles.css#L140) | см. компонент и animation-play-state |

Динамические keyframes дополнительно формируются в `PeerProfile.tsx` (mask/rail/compact/identity, scroll timeline), в splash export/runtime и shader runtime; они не ограничиваются именами, найденными в CSS-файлах.

## Файлы с механизмами движения

| Файл | Число строк-сигналов | Строки |
|---|---:|---|
| `src/Prototype.tsx` | 69 | 66, 67, 72, 73, 74, 84, 110, 111, 123, 151, 156, 164, 166, 170, 179, 199, 200, 201, 216, 220, 224, 225, 248, 251, 299, 300, 329, 330, 346, 348, 355, 357, 364, 369, 375, 418, 420, 426, 432, 440, 445, 451, 465, 469, 470, 471, 495, 496, 507, 508, 555, 580, 635, 641, 699, 708, 731, 771, 789, 793, 805, 810, 814, 817, 818, 823, 830, 862, 868 |
| `src/components/AppSheet.tsx` | 7 | 11, 20, 22, 25, 28, 29, 30 |
| `src/components/AuthFlow/AuthFlow.tsx` | 29 | 67, 71, 149, 194, 196, 201, 204, 216, 239, 259, 260, 313, 316, 330, 346, 365, 389, 390, 451, 454, 455, 484, 487, 488, 513, 516, 517, 547, 550 |
| `src/components/AuthFlow/QuestionnaireGlow.tsx` | 2 | 23, 29 |
| `src/components/AuthFlow/auth-flow.css` | 30 | 26, 27, 36, 62, 68, 137, 140, 142, 143, 156, 157, 168, 173, 175, 179, 190, 211, 215, 217, 234, 235, 237, 260, 269, 270, 275, 280, 292, 293, 320 |
| `src/components/AuthFlow/notification-sheet.css` | 3 | 13, 14, 27 |
| `src/components/AuthFlow/questionnaire-glow.css` | 4 | 3, 4, 7, 10 |
| `src/components/ChatActions.tsx` | 19 | 38, 40, 71, 72, 75, 77, 78, 85, 86, 88, 89, 90, 96, 97, 107, 108, 117, 124, 141 |
| `src/components/ChatCircleRecorder.tsx` | 5 | 23, 52, 57, 58, 66 |
| `src/components/ChatConversation.tsx` | 29 | 37, 61, 63, 70, 71, 72, 76, 97, 118, 142, 167, 175, 176, 181, 190, 197, 216, 299, 306, 311, 313, 315, 316, 322, 325, 326, 328, 329, 330 |
| `src/components/ChatHint.tsx` | 1 | 7 |
| `src/components/ChatMedia.tsx` | 31 | 87, 98, 131, 132, 135, 138, 139, 140, 141, 146, 149, 155, 156, 159, 160, 164, 165, 169, 170, 172, 176, 194, 236, 237, 247, 250, 251, 253, 282, 287, 309 |
| `src/components/ChatOutgoingMask.tsx` | 1 | 29 |
| `src/components/ChatStickers.tsx` | 6 | 27, 28, 36, 37, 39, 40 |
| `src/components/ChatVideoCircle.tsx` | 3 | 40, 52, 55 |
| `src/components/Launch/Launch.tsx` | 2 | 49, 53 |
| `src/components/Launch/launch.css` | 1 | 42 |
| `src/components/Launch/splash.ts` | 4 | 330, 334, 335, 338 |
| `src/components/LivingSearchSilhouette/living-search.css` | 3 | 6, 10, 11 |
| `src/components/LivingSearchSilhouette/renderer.ts` | 2 | 121, 127 |
| `src/components/PeerProfile.tsx` | 16 | 73, 78, 86, 93, 95, 96, 99, 170, 171, 177, 184, 185, 186, 207, 210, 211 |
| `src/components/PreviewControls.tsx` | 2 | 29, 31 |
| `src/components/chat-actions.css` | 3 | 94, 133, 203 |
| `src/components/chat-entry.css` | 7 | 10, 16, 19, 23, 26, 35, 38 |
| `src/components/mobile-app.css` | 7 | 3, 5, 34, 48, 55, 61, 67 |
| `src/components/peer-profile.css` | 1 | 4 |
| `src/components/premium/PremiumSheet.tsx` | 8 | 62, 63, 64, 65, 66, 67, 110, 115 |
| `src/components/premium/premium-sheet.css` | 2 | 38, 40 |
| `src/isolated-onboarding/OnboardingScreen.tsx` | 24 | 29, 32, 33, 35, 56, 57, 73, 74, 76, 79, 82, 83, 121, 122, 123, 157, 158, 165, 169, 170, 211, 213, 226, 229 |
| `src/isolated-onboarding/lib/custom-effect-runtime/useShaderRuntime.ts` | 2 | 260, 267 |
| `src/isolated-onboarding/onboarding.css` | 3 | 44, 45, 48 |
| `src/mobile/BottomSheet.tsx` | 5 | 85, 91, 95, 106, 113 |
| `src/mobile/Carousel.tsx` | 4 | 106, 108, 135, 137 |
| `src/mobile/FlowStack.tsx` | 4 | 61, 173, 174, 251 |
| `src/mobile/Keyboard.tsx` | 2 | 223, 232 |
| `src/mobile/MobileScroll.tsx` | 6 | 97, 159, 162, 185, 290, 295 |
| `src/mobile/components.tsx` | 2 | 10, 13 |
| `src/prototype.css` | 92 | 35, 42, 44, 45, 46, 51, 52, 70, 89, 123, 125, 130, 131, 190, 198, 199, 204, 259, 261, 269, 296, 309, 315, 316, 317, 318, 319, 320, 322, 324, 330, 331, 333, 334, 339, 346, 368, 369, 378, 379, 391, 405, 408, 411, 413, 414, 418, 420, 426, 428, 443, 468, 471, 477, 486, 488, 495, 503, 523, 538, 580, 603, 605, 612, 637, 683, 767, 778, 789, 791, 792, 793, 806, 807, 819, 823, 825, 826, 829, 841, 842, 844, 856, 860, 861, 862, 863, 877, 878, 882, 908, 910 |
| `src/styles.css` | 8 | 39, 110, 292, 335, 363, 475, 483, 496 |
| `src/ui/press.ts` | 3 | 4, 12, 13 |
| `src/ui/useCardTilt.ts` | 1 | 10 |
| `src/ui/viewport.ts` | 2 | 23, 24 |

## Дополнительные механизмы, требующие исходников

- `src/ui/useCardTilt.ts` и `src/isolated-onboarding/apple-card-motion.ts`: held-card tilt, release velocity, soft limit.
- `src/isolated-onboarding/lib/custom-effects/LiveTelegramSpoiler.ts`: WGSL/ShaderFill частицы, reveal и live drift.
- `src/components/LivingSearchSilhouette/`: Canvas/WebGL и time uniforms, единая сцена поиска.
- `src/components/premium/`: premium wordmark/facets и программный fluid shader.
- `src/components/Launch/`: экспорт splash и welcome roulette.
- `src/components/ChatusViewport.ts`, `src/ui/viewport.ts`: native viewport commits; не независимые декоративные анимации.
- `src/mobile/MobileCursor.tsx`: служебный cursor симулятора.

Полный исходный код находится в `../source/`. В этом реестре `src/...` обозначает путь внутри `source/`. Рабочий raw grep остаётся локально и в публикацию не входит.
