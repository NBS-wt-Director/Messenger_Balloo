# Компонент: Voice Message — Голосовое сообщение

## Описание
Компонент отображения и записи голосовых сообщений. Показывает waveform (визуализацию звуковой волны), кнопки воспроизведения/остановки, длительность. Поддерживает два режима: воспроизведённое и записываемое.

## Props / Атрибуты

| Параметр | Тип | Описание | По умолчанию |
|---|---|---|---|
| `waveform` | `number[]` | Массив амплитуд для waveform | `[]` |
| `duration` | `number` | Длительность в секундах | `0` |
| `isPlaying` | `boolean` | Воспроизводится ли сейчас | `false` |
| `isRecording` | `boolean` | Записывается ли сейчас | `false` |
| `progress` | `number` | Прогресс воспроизведения (0-1) | `0` |
| `onPlay` | `() => void` | Воспроизведение | — |
| `onPause` | `() => void` | Пауза | — |
| `onStop` | `() => void` | Остановка | — |

## Сущность VoiceMessage

```typescript
interface VoiceMessage {
  id: string;
  url: string;
  waveform: number[];  // амплитуды для визуализации
  duration: number;    // секунды
  sentAt: bigint;
  receivedAt?: bigint;
  readAt?: bigint;
}
```

## События

| Событие | Описание |
|---|---|
| `voicePlay` | Воспроизведение начато |
| `voicePause` | Пауза |
| `voiceStop` | Остановка |
| `voiceRecordStart` | Запись начата |
| `voiceRecordStop` | Запись остановлена |

## Визуальные элементы

- **Waveform** — столбики 3px шириной
- **Воспроизведённая часть** — цвет `--accent`
- **Невоспроизведённая** — цвет `--border-strong`
- **Запись** — красный фон `--danger-bg`, пульсирующая кнопка
- **Октагон** — для кнопки play/stop

## Стилизация

Использует дизайн-систему из `common.css`:
- `--octagon-clip` для кнопки
- CSS-переменные
- Анимация пульсации через `@keyframes pulse`

## Пример использования

```html
<div class="voice-message">
  <div class="voice-message__play" onclick="togglePlay()">▶</div>
  <div class="voice-message__waveform">
    <div class="voice-message__waveform-bar voice-message__waveform-bar--played" style="height:12px"></div>
    <div class="voice-message__waveform-bar voice-message__waveform-bar--played" style="height:20px"></div>
    <div class="voice-message__waveform-bar" style="height:28px"></div>
  </div>
  <div class="voice-message__duration">0:12</div>
</div>
```

## Связанные экраны
- `voice-message.html` (1_01_19) — экран голосового сообщения
