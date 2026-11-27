# Демо-истории: источники и лицензии

Тикет `tickets/active/1795683301-nodes-consistency.md`, подзадача T2.

Требование владельца: 3 предзаписанных видеоистории без слов — природа России,
Урал, города России. Файлы лежат в `packages/web/public/demo-stories/`
(mp4 H.264, звук удалён, длительность ≤ 8 с, вес ≤ 1 МБ каждый).

| Файл | Сюжет | Оригинал на Wikimedia Commons | Автор | Лицензия |
|---|---|---|---|---|
| `taiga.mp4` / `taiga.jpg` | Низкие облака над русской тайгой (таймлапс) | `File:Time lapse of low clouds drifting across taiga of Russia.webm` | FlykitRu (youtube.com/@FlykitRu) | CC BY 3.0 |
| `ural.mp4` / `ural.jpg` | Лодки на реке Урал | `File:Boats on the Ural River.webm` | User:RoyKabanlit | CC BY-SA 4.0 |
| `spb.mp4` / `spb.jpg` | Санкт-Петербург, Петергофское шоссе (трамвай) | `File:Saint Petersburg tram 8902 2018-02 1517759126 Peterhofskoe Shosse Alstom Citadis 301.webm` | Wikimedia Commons contributor | CC BY 4.0 |

## Что сделано при подготовке

```bash
# скачивание оригиналов (webm), затем:
ffmpeg -i <orig>.webm -t 8 -an -vf "scale='min(1280,iw)':-2" \
       -c:v libx264 -profile:v main -crf 26 -preset veryfast \
       -movflags +faststart <name>.mp4
ffmpeg -i <name>.mp4 -frames:v 1 -q:v 4 <name>.jpg
```

- `-an` — звук удалён: истории без слов, автоплей в браузере не блокируется.
- `-t 8` — не длиннее 8 секунд (как демо-история).
- масштаб ≤ 1280 px по ширине; итоговый вес 263–633 КБ.

## Требования лицензий при публикации

CC BY / CC BY-SA требуют указания автора и лицензии. Подпись автора
показывается под каждым демо-роликом (поле `credit` в
`packages/web/src/screens/stories/demoStories.ts`). При замене файлов
обновить и манифест, и эту таблицу.

Если ролик заменяется на другой — проверить лицензию (CC0 / CC BY / CC BY-SA
допустимы), сохранить автора и ссылку на оригинал.
