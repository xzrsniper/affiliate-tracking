# Налаштування ngrok authtoken

## Швидкий спосіб:

1. Отримайте ваш authtoken:
   - Відкрийте: https://dashboard.ngrok.com/get-started/your-authtoken
   - Скопіюйте ваш authtoken

2. Відредагуйте файл `ngrok.yml`:
   - Відкрийте `ngrok.yml`
   - Замініть `YOUR_NGROK_AUTHTOKEN_HERE` на ваш токен

3. Запустіть:
   ```bash
   ngrok start --all --config=ngrok.yml
   ```

## Альтернативний спосіб (глобальна конфігурація):

Якщо ви хочете використовувати глобальну конфігурацію:

```bash
ngrok config add-authtoken YOUR_TOKEN
```

Потім видаліть рядок `authtoken:` з файлу `ngrok.yml` і ngrok використає глобальну конфігурацію.

