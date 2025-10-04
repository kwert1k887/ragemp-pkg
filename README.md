```markdown
# ragemp-pkg

![image](https://github.com/user-attachments/assets/7f8a77e6-04ed-430e-a025-8716ed418ce6)

Быстрая и удобная загрузка серверных бинарников для RAGE:MP серверов.

## 📦 Установка

bash
npm install --save-dev ragemp-pkg
```

## 🚀 Использование

### Основные команды

| Команда | Описание |
|---------|-----------|
| `npx ragemp-pkg release` | Скачать Windows файлы **(исполняется по умолчанию)** |
| `npx ragemp-pkg windows` | Скачать Windows файлы |
| `npx ragemp-pkg linux` | Скачать Linux файлы |
| `npx ragemp-pkg select` | Выбрать ОС интерактивно |

### Примеры использования

```bash
# Скачать бинарники для Windows (рекомендуется)
npx ragemp-pkg release

# Или явно указать Windows
npx ragemp-pkg windows

# Скачать бинарники для Linux
npx ragemp-pkg linux

# Интерактивный выбор ОС
npx ragemp-pkg select
```

## 💡 Быстрый старт

1. Установите пакет:
```bash
npm install --save-dev ragemp-pkg
```

2. Скачайте бинарники:
```bash
npx ragemp-pkg release
```
Готово! Бинарные файлы сервера RAGE:MP будут загружены в вашу проектную директорию.
