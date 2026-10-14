
# Yandex Music Collection TrackList

A lightweight console script for collecting and exporting tracks from **Yandex Music playlists**.

Yandex Music uses virtualized lists: not every track is present in the page DOM at once. The script collects tracks as you scroll through a playlist and allows you to export the results to TXT or CSV.

Based on [YM Track Collector](https://github.com/idaniil24/ym-track-collector) by **idaniil24** (MIT License).

Modified and maintained by **[nott-thatt](https://github.com/nott-thatt)**.

---

## English

### Features

- Collects tracks from Yandex Music playlists
- Works with virtualized lists and lazy-loaded rows
- Monitors scrolling and DOM updates
- Exports tracks to TXT
- Exports tracks to CSV with `Artist,Title,Duration`
- Runs directly in the browser's DevTools Console
- No extensions or additional software required

### How to Use

1. Open a playlist on **Yandex Music**.
2. Open your browser's Developer Tools (`F12 → Console`).
3. Open the `ym-track-collector.js` file in this repository.
4. Copy the entire script and paste it into the Console.
5. Press **Enter** to run the script.
6. Scroll through the playlist until all required tracks have appeared.
7. Click **Finish Capture**.
8. Download the collected tracks as `.txt` or `.csv`.

### Output Formats

**TXT**

```text
Artist - Title
```

**CSV**

```csv
Artist,Title,Duration
```

### Notes

- The script runs locally in your browser.
- Tracks must appear on the page to be collected.
- For large playlists, scroll through the entire list before finalizing.
- Changes to the Yandex Music website may affect the script's functionality.

---

## Русская версия

### Описание

**Yandex Music Collection TrackList** — консольный скрипт для сбора и экспорта треков из плейлистов **Яндекс Музыки**.

Яндекс Музыка использует виртуализированные списки: не все композиции одновременно присутствуют в DOM страницы. Скрипт собирает информацию о треках по мере прокрутки плейлиста и позволяет сохранить полученный список в TXT или CSV.

Для работы не требуется устанавливать расширения или дополнительные программы.

### Возможности

- Сбор треков из плейлистов Яндекс Музыки
- Поддержка виртуализированных списков и динамической загрузки
- Отслеживание прокрутки и изменений DOM
- Экспорт списка в TXT
- Экспорт в CSV с колонками `Artist,Title,Duration`
- Запуск через консоль браузера
- Работа без установки расширений

### Как использовать

1. Откройте нужный плейлист в **Яндекс Музыке**.
2. Откройте инструменты разработчика браузера (`F12 → Console`).
3. Откройте файл `ym-track-collector.js` в этом репозитории.
4. Скопируйте весь код скрипта.
5. Вставьте его в консоль браузера.
6. Нажмите **Enter** для запуска.
7. Прокрутите плейлист до конца или до нужного места.
8. Нажмите **Finish Capture**.
9. Скачайте список в формате `.txt` или `.csv`.

### Форматы экспорта

**TXT**

```text
Исполнитель - Название
```

Пример:

```text
Baby Lasagna - Rim Tim Tagi Dim
Nothing But Thieves - Oh No :: He Said What?
Palaye Royale - Death or Glory
```

**CSV**

```csv
Artist,Title,Duration
```

### Примечания

- Скрипт выполняется локально в браузере.
- Для сбора треки должны появиться на странице при прокрутке.
- В больших плейлистах необходимо прокрутить весь список перед завершением сбора.
- При изменении интерфейса Яндекс Музыки скрипту может потребоваться обновление.

---

## Support the Project / Поддержать проект

If you find this project useful, you can support the development of this modified version with a cryptocurrency donation.

Если проект оказался полезным, вы можете поддержать развитие этой модифицированной версии криптовалютным пожертвованием.

### Crypto Donations / Криптовалютные пожертвования

**Network / Сеть: Arbitrum One**

Supported assets / Поддерживаемые активы:

- ETH
- USDC
- USDT

**Wallet address / Адрес кошелька:**

```text
0x4310e1ca3692ad56c80290bd0392658340c1a9c9
```

Please send funds using the Arbitrum One network only.

Отправляйте средства только через сеть Arbitrum One.

---

## Credits / Авторы

**Original project / Исходный проект:**

[YM Track Collector](https://github.com/idaniil24/ym-track-collector) — **idaniil24**

**Modified version / Модифицированная версия:**

[Yandex Music Collection TrackList](https://github.com/nott-thatt/Yandex-Music-Collection-TrackList) — **nott-thatt**

This project is based on YM Track Collector and distributed under the MIT License.

Проект основан на YM Track Collector и распространяется на условиях лицензии MIT.

---

## License / Лицензия

MIT License. See the [LICENSE](LICENSE) file for details.

Лицензия MIT. Подробные условия приведены в файле [LICENSE](LICENSE).

---

If you find this project useful, consider giving the repository a star.

Если проект оказался полезным, вы можете поддержать его звездой на GitHub.
