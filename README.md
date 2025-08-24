# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

# My Earnings App

Додаток для відстеження особистого заробітку з авторизацією через Firebase.

## Функціонал

- ✅ Авторизація та реєстрація користувачів
- ✅ Перегляд 12 місяців року
- ✅ Додавання заробітку по місяцях
- ✅ Підтримка USD та UAH валют
- ✅ Збереження даних в Firebase Firestore
- ✅ Адаптивний дизайн з SCSS

## Налаштування

### 1. Клонування та встановлення

```bash
npm install
```

### 2. Налаштування Firebase

1. Створіть проект в [Firebase Console](https://console.firebase.google.com/)
2. Увімкніть Authentication з Email/Password
3. Створіть Firestore Database
4. Скопіюйте конфігурацію з Project Settings
5. Оновіть файл `src/firebase/config.ts` вашими даними:

```typescript
const firebaseConfig = {
  apiKey: "ваш-api-key",
  authDomain: "ваш-project-id.firebaseapp.com",
  projectId: "ваш-project-id",
  storageBucket: "ваш-project-id.appspot.com",
  messagingSenderId: "ваш-sender-id",
  appId: "ваш-app-id"
};
```

### 3. Налаштування Firestore правил

У Firebase Console > Firestore Database > Rules додайте:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /earnings/{document} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}
```

## Запуск

```bash
npm run dev
```

Додаток буде доступний за адресою http://localhost:5173

## Технології

- React 19 + TypeScript
- Firebase (Auth + Firestore)
- React Router
- SCSS
- Vite

## Структура проекту

```
src/
├── components/
│   ├── Login.tsx         # Форма авторизації
│   ├── Login.scss        # Стилі авторизації
│   ├── Dashboard.tsx     # Головна сторінка з місяцями
│   ├── Dashboard.scss    # Стилі головної сторінки
│   ├── MonthView.tsx     # Сторінка місяця з заробітками
│   └── MonthView.scss    # Стилі сторінки місяця
├── firebase/
│   └── config.ts         # Конфігурація Firebase
├── App.tsx               # Головний компонент з роутингом
├── App.scss              # Глобальні стилі
├── main.tsx              # Точка входу
└── index.scss            # Базові стилі
```

## Використання

1. Зареєструйтеся або увійдіть в систему
2. Виберіть місяць на головній сторінці
3. Додайте заробіток: введіть суму, виберіть валюту та опишіть завдання
4. Переглядайте загальну статистику та історію заробітків

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
