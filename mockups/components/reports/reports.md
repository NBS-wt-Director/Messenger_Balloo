# Компонент: Reports — Отчёты

## Описание
Компонент списка отчётов: карточки с иконкой, названием, датой формирования и кнопкой скачивания.

## Props / Атрибуты

| Параметр | Тип | Описание | По умолчанию |
|---|---|---|---|
| `reports` | `Report[]` | Список отчётов | `[]` |
| `onDownload` | `(reportId: string) => void` | Скачивание | — |
| `onGenerate` | `(type: string) => void` | Генерация нового | — |

## События

| Событие | Описание |
|---|---|
| `reportDownload` | Отчёт скачан |
| `reportGenerate` | Новый отчёт сгенерирован |

## Стилизация

Использует дизайн-систему из `common.css`.

## Пример использования

```html
<div class="reports-list">
  <div class="report-item">
    <div class="report-item__icon">📊</div>
    <div class="report-item__info">
      <div class="report-item__name">Ежемесячный отчёт</div>
      <div class="report-item__date">23.07.2026</div>
    </div>
    <div class="report-item__action" onclick="onDownload('r1')">Скачать</div>
  </div>
</div>
```

## Связанные экраны
- `reports.html` (1_02_09) — экран отчётов
