# Компонент: Voice Record Mobile — Запись голосового (mobile)

## Описание
Компонент записи голосовых сообщений для мобильных устройств: анимированный таймер, визуализация waveform, кнопка записи с пульсацией.

## Props / Атрибуты

| Параметр | Тип | Описание | По умолчанию |
|---|---|---|---|
| `duration` | `number` | Текущая длительность (сек) | `0` |
| `isRecording` | `boolean` | Записывается ли сейчас | `true` |
| `onStop` | `() => void` | Остановить запись | — |
| `onSend` | `() => void` | Отправить запись | — |
| `onDelete` | `() => void` | Удалить запись | — |

## Стилизация

Использует дизайн-систему из `common.css`. Анимация waveform через `@keyframes waveform`.

## Пример использования

```html
<div class="voice-record-mobile">
  <div class="voice-record-mobile__timer">0:03</div>
  <div class="voice-record-mobile__waveform">
    <div class="voice-record-mobile__waveform-bar"></div>
    <div class="voice-record-mobile__waveform-bar"></div>
    <div class="voice-record-mobile__waveform-bar"></div>
  </div>
  <div class="voice-record-mobile__btn">⏹</div>
</div>
```

## Связанные экраны
- `voice-record-mobile.html` (1_08_03) — мобильная запись голосового
