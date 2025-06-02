// Локальное хранилище коллекции
const STORAGE_KEY = 'numizmat_collection';

// Регистрация пользователя (упрощенная версия для локального хранения)
function register() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    if (!email || !password) {
        document.getElementById("status").innerText = "❌ Заполните все поля";
        return;
    }

    localStorage.setItem('currentUser', JSON.stringify({ email }));
    document.getElementById("status").innerText = "✅ Успешно зарегистрирован!";
}

// Вход пользователя
function login() {
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    if (!email || !password) {
        document.getElementById("loginStatus").innerText = "❌ Заполните все поля";
        return;
    }

    localStorage.setItem('currentUser', JSON.stringify({ email }));
    document.getElementById("loginStatus").innerText = "✅ Вход выполнен!";
    setTimeout(() => window.location.href = "dashboard.html", 500);
}

// Выход пользователя
function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = "index.html";
}

// Проверка авторизации
function checkAuth() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    const path = window.location.pathname.split('/').pop();

    if (!user && path !== 'index.html') {
        window.location.href = "index.html";
        return false;
    }

    return !!user;
}

// Загрузка коллекции
function loadCollection() {
    if (!checkAuth()) return;

    const collectionContainer = document.getElementById("collection");
    if (!collectionContainer) return;

    collectionContainer.innerHTML = "<p>Загрузка коллекции...</p>";

    const collection = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    
    if (collection.length === 0) {
        collectionContainer.innerHTML = "<p>Ваша коллекция пока пуста.</p>";
        return;
    }

    collectionContainer.innerHTML = "";
    collection.forEach(item => {
        const card = document.createElement("div");
        card.className = "item-card";
        card.innerHTML = `
            <h3>${item.name || "Без названия"}</h3>
            ${item.description ? `<p>${item.description}</p>` : ''}
            ${item.imageUrl ? `<img src="${item.imageUrl}" alt="Фото предмета" class="item-image">` : ''}
            <div class="item-date">${new Date(item.addedAt).toLocaleString()}</div>
        `;
        collectionContainer.appendChild(card);
    });
}

// Добавление предмета
function setupAddItemForm() {
    if (!checkAuth()) return;

    const imageInput = document.getElementById("image");
    const preview = document.getElementById("preview");
    const addButton = document.getElementById("addItemBtn");
    const status = document.getElementById("addStatus");

    if (!addButton) return;

    // Предпросмотр изображения
    imageInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                preview.src = e.target.result;
                preview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        } else {
            preview.style.display = 'none';
        }
    });

    // Добавление предмета
    addButton.onclick = function() {
        const name = document.getElementById("name").value.trim();
        const description = document.getElementById("description").value.trim();
        const file = imageInput.files[0];

        if (!name) {
            status.innerText = "⚠️ Введите название предмета";
            return;
        }

        status.innerText = "⏳ Сохранение предмета...";

        const newItem = {
            id: Date.now(),
            name,
            description,
            addedAt: new Date().toISOString()
        };

        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                newItem.imageUrl = e.target.result;
                saveItem(newItem, status);
            };
            reader.readAsDataURL(file);
        } else {
            saveItem(newItem, status);
        }
    };
}

// Сохранение предмета в localStorage
function saveItem(item, statusElement) {
    const collection = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    collection.unshift(item); // Добавляем в начало массива
    localStorage.setItem(STORAGE_KEY, JSON.stringify(collection));

    statusElement.innerText = "✅ Предмет успешно добавлен!";
    setTimeout(() => window.location.href = "dashboard.html", 1500);
}

// Инициализация страницы
window.onload = function() {
    const path = window.location.pathname.split('/').pop();

    if (path === 'dashboard.html') {
        loadCollection();
    } else if (path === 'add_item.html') {
        setupAddItemForm();
    }
};