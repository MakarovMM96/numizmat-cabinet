// Локальное хранилище коллекции
const USER_COLLECTION_PREFIX = 'user_collection_';

// Переменные для работы с модальным окном
let currentEditItemId = null;
const modal = document.getElementById("editModal");
const closeBtn = document.querySelector(".close");

// Регистрация пользователя
function register() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    if (!email || !password) {
        document.getElementById("status").innerText = "❌ Заполните все поля";
        return;
    }

    const userId = generateUserId(email);
    localStorage.setItem('currentUser', JSON.stringify({ 
        email, 
        userId 
    }));
    document.getElementById("status").innerText = "✅ Успешно зарегистрирован!";
}

// Генерация ID пользователя
function generateUserId(email) {
    return 'user_' + Math.abs(email.split('').reduce((hash, char) => {
        return (hash << 5) - hash + char.charCodeAt(0);
    }, 0));
}

// Вход пользователя
function login() {
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    if (!email || !password) {
        document.getElementById("loginStatus").innerText = "❌ Заполните все поля";
        return;
    }

    const userId = generateUserId(email);
    localStorage.setItem('currentUser', JSON.stringify({ 
        email, 
        userId 
    }));
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

    const user = JSON.parse(localStorage.getItem('currentUser'));
    const collectionContainer = document.getElementById("collection");
    if (!collectionContainer) return;

    collectionContainer.innerHTML = "<p>Загрузка коллекции...</p>";

    const userCollectionKey = USER_COLLECTION_PREFIX + user.userId;
    const collection = JSON.parse(localStorage.getItem(userCollectionKey)) || [];
    
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
            <div class="item-actions">
                <button onclick="openEditModal('${item.id}')" class="btn-edit">✏️ Редактировать</button>
                <button onclick="deleteItem('${item.id}')" class="btn-delete">🗑️ Удалить</button>
            </div>
        `;
        collectionContainer.appendChild(card);
    });
}

// Открытие модального окна для редактирования
function openEditModal(itemId) {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) return;

    const userCollectionKey = USER_COLLECTION_PREFIX + user.userId;
    const collection = JSON.parse(localStorage.getItem(userCollectionKey)) || [];
    const item = collection.find(i => i.id == itemId);
    
    if (!item) return;

    currentEditItemId = itemId;
    document.getElementById("editName").value = item.name || "";
    document.getElementById("editDescription").value = item.description || "";
    
    const preview = document.getElementById("editPreview");
    if (item.imageUrl) {
        preview.src = item.imageUrl;
        preview.style.display = 'block';
    } else {
        preview.style.display = 'none';
    }

    modal.style.display = "block";
}

// Закрытие модального окна
closeBtn.onclick = function() {
    modal.style.display = "none";
}

window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

// Сохранение изменений
document.getElementById("saveEditBtn").onclick = function() {
    const name = document.getElementById("editName").value.trim();
    const description = document.getElementById("editDescription").value.trim();
    const imageInput = document.getElementById("editImage");
    const file = imageInput.files[0];
    const status = document.getElementById("editStatus");

    if (!name) {
        status.innerText = "⚠️ Введите название предмета";
        return;
    }

    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user || !currentEditItemId) return;

    const userCollectionKey = USER_COLLECTION_PREFIX + user.userId;
    const collection = JSON.parse(localStorage.getItem(userCollectionKey)) || [];
    const itemIndex = collection.findIndex(i => i.id == currentEditItemId);
    
    if (itemIndex === -1) return;

    status.innerText = "⏳ Сохранение изменений...";

    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            collection[itemIndex].imageUrl = e.target.result;
            finishEdit(collection, userCollectionKey, status);
        };
        reader.readAsDataURL(file);
    } else {
        // Если новый файл не выбран, оставляем старое изображение
        finishEdit(collection, userCollectionKey, status);
    }

    function finishEdit(collection, key, statusElement) {
        collection[itemIndex].name = name;
        collection[itemIndex].description = description;
        collection[itemIndex].addedAt = new Date().toISOString();
        
        localStorage.setItem(key, JSON.stringify(collection));
        statusElement.innerText = "✅ Изменения сохранены!";
        
        setTimeout(() => {
            modal.style.display = "none";
            loadCollection();
        }, 1000);
    }
}

// Удаление предмета
function deleteItem(itemId) {
    if (!confirm("Вы уверены, что хотите удалить этот предмет?")) return;

    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) return;

    const userCollectionKey = USER_COLLECTION_PREFIX + user.userId;
    const collection = JSON.parse(localStorage.getItem(userCollectionKey)) || [];
    const updatedCollection = collection.filter(item => item.id != itemId);
    
    localStorage.setItem(userCollectionKey, JSON.stringify(updatedCollection));
    loadCollection();
}

// Добавление предмета
function setupAddItemForm() {
    if (!checkAuth()) return;

    const imageInput = document.getElementById("image");
    const preview = document.getElementById("preview");
    const addButton = document.getElementById("addItemBtn");
    const status = document.getElementById("addStatus");

    if (!addButton) return;

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

// Сохранение предмета
function saveItem(item, statusElement) {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) return;

    const userCollectionKey = USER_COLLECTION_PREFIX + user.userId;
    const collection = JSON.parse(localStorage.getItem(userCollectionKey)) || [];
    
    collection.unshift(item);
    localStorage.setItem(userCollectionKey, JSON.stringify(collection));

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