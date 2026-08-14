# 1_01_39 — Голосовое сообщение (запись)

**ID:** `1_01_39`  
**Функция:** `0_01_05` — Отправка сообщений  
**Формат:** Модалка из чата  
**Файл:** `voice-message.html`

---

## Описание

Модалка записи голосового сообщения. 4 состояния: готовность → запись → прослушивание → отправка. Визуализация волны, таймер, громкость, скорость воспроизведения, транскрипция.

---

## Структура

### Top Bar
- Логотип Balloo + навигация
- Заголовок: «Запись голосового»
- Аватар + язык/тема

### Sidebar
- Список чатов (упрощённый)

### Content (чат)
- Заголовок чата
- Сообщение с голосовым (play button + waveform + duration)
- Input area с кнопкой 🎤 → openModal('modal-voice-message')

### Modal (voice-message) — top-right modal, 480px

#### State 1: Idle (готовность)
- 🎤 аватар 120px (gradient accent), cursor pointer
- Текст: «Нажмите для записи»
- Подсказка: «Удерживайте для записи»
- Макс: 10 минут, OGG формат

#### State 2: Recording (запись)
- Таймер: 48px, font-variant-numeric: tabular-nums, color var(--danger)
- Waveform: 40 баров, height random 8-68px, background var(--accent)
- Громкость: meter bar (height 8px, width 10-90% random)
- Кнопки: 🗑 Отмена, ⏹ Stop (red octagon, pulse animation), 1x
- Максимум: 10 минут (600 сек)

#### State 3: Preview (прослушивание)
- ▶ / ⏸ кнопка
- Waveform (40 баров, static)
- Длительность: M:SS
- Скорость: 0.5x / 1x / 1.5x / 2x
- Чекбокс: «Включить транскрипцию»
- Скорость по умолчанию: select

#### State 4: Sending (отправка)
- 📤 иконка 48px
- Текст: «Отправка...»
- Progress bar (skeleton animation)

---

## Дизайн-требования
- Modal: 480px width, status info (border var(--info))
- Recording: red octagon button с animation pulse
- Waveform: flex gap 2px, bars 3px width
- Timer: tabular-nums, var(--danger)
- Pulse animation: scale 1→1.05, infinite 1.5s

---

## Взаимодействия
- startRecording(): idle → recording, timer starts, waveform updates
- stopRecording(): recording → preview, duration set
- cancelRecording(): recording → idle, timer stops
- togglePlayback(): play/pause, progress interval
- setSpeed(speed): showToast(`Скорость: ${speed}x`)
- sendVoiceMessage(): preview → sending → closeModal() → showToast

---

## API (предполагаемые)
| Метод | Путь | Описание |
|---|---|---|
| POST | `/api/messages/voice` | Отправить голосовое |
| POST | `/api/messages/{id}/transcribe` | Транскрипция |
| GET | `/api/messages/voice/{id}/play` | Воспроизвести |

---

## Технологии
- HTML5 + CSS3 (common.css)
- Vanilla JS (inline)
- CSS animations (pulse, skeleton-pulse)
- Web Audio API (в реальной реализации)
