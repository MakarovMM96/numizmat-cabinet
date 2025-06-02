// firebase.js

const firebaseConfig = {
    apiKey: "AIzaSyCW7Ps5_vs2NOwgHCAjNmU5V10Cd3p8fAI", // Web API Key
    authDomain: "numizmat-cabinet.firebaseapp.com",
    projectId: "numizmat-cabinet",                   // Project ID
    storageBucket: "numizmat-cabinet.appspot.com",
    messagingSenderId: "534917918856",               // Project number
    appId: "1:534917918856:web:abcd1234efgh5678"     // App ID (можно оставить шаблонным)
};

// Инициализация Firebase
firebase.initializeApp(firebaseConfig);

// Экспорт сервисов для использования в других файлах
const db = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage();

// Дополнительно: можно экспортировать напрямую
window.db = db;
window.auth = auth;
window.storage = storage;