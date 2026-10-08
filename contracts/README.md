# ClearGrant Smart Contracts

Смарт-контракты эскроу для платформы целевых пожертвований ClearGrant (МөлдірGrant).

## 📄 Контракты

- **`ClearGrantEscrow.sol`**: Основной контракт эскроу с поддержкой кампаний, этапов (milestones), блокировки средств, оракула валидации с ECDSA подписью, автоматических выплат и пропорциональных возвратов.
- **`MockUSDC.sol`**: Тестовый токен USDC (6 знаков после запятой) для локального тестирования и тестнетов.

## ⚙️ Установка и запуск тестов

```bash
# Установка зависимостей
npm install

# Компиляция контрактов
npx hardhat compile

# Запуск тестов
npx hardhat test

# Проверка покрытия тестами
npx hardhat coverage

# Локальная нода Hardhat
npx hardhat node

# Деплой в локальную сеть
npx hardhat run scripts/deploy.ts --network localhost

# Деплой в тестовую сеть Polygon Amoy
npx hardhat run scripts/deploy.ts --network amoy
```

## 🔒 Безопасность
- **ReentrancyGuard** на всех функциях перевода токенов.
- **ECDSA подпись** оракула с уникальным nonce на уровне кампании (защита от replay атак).
- Использование OpenZeppelin SafeERC20.
- Невозможность вывода средств организатором в обход этапов и оракула.
