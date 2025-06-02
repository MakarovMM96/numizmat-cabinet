// Локальное хранилище коллекции
const USER_COLLECTION_PREFIX = 'user_collection_';

// Переменные для работы с модальным окном
let currentEditItemId = null;
const modal = document.getElementById("editModal");
const closeBtn = document.querySelector(".close");

// Инициализация страницы
window.onload = function() {
    validateAndFixCollections();
    
    const path = window.location.pathname.split('/').pop();
    if (path === 'dashboard.html') {
        initDashboard();
    } else if (path === 'add_item.html') {
        setupAddItemForm();
    }
};

// Регистрация пользователя
function register() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    if (!email || !password) {
        showStatus("status", "❌ Заполните все поля", "error");
        return;
    }

    const userId = generateUserId(email);
    localStorage.setItem('currentUser', JSON.stringify({ 
        email, 
        userId 
    }));
    showStatus("status", "✅ Успешно зарегистрирован!", "success");
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
        showStatus("loginStatus", "❌ Заполните все поля", "error");
        return;
    }

    const userId = generateUserId(email);
    localStorage.setItem('currentUser', JSON.stringify({ 
        email, 
        userId 
    }));
    showStatus("loginStatus", "✅ Вход выполнен! Перенаправление...", "success");
    setTimeout(() => window.location.href = "dashboard.html", 1500);
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

// Инициализация dashboard
function initDashboard() {
    if (!checkAuth()) return;

    // Загрузка коллекции
    loadCollection();
    
    // Поиск
    const searchBtn = document.getElementById("searchBtn");
    const resetSearchBtn = document.getElementById("resetSearchBtn");
    const searchInput = document.getElementById("searchInput");
    
    if (searchBtn) {
        searchBtn.onclick = function() {
            const searchTerm = searchInput.value.trim().toLowerCase();
            if (searchTerm) {
                searchCollection(searchTerm);
            } else {
                loadCollection();
            }
        };
        
        // Поиск при нажатии Enter
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchBtn.click();
            }
        });
    }
    
    if (resetSearchBtn) {
        resetSearchBtn.onclick = function() {
            searchInput.value = "";
            loadCollection();
        };
    }
    
    // Настройка модального окна
    if (closeBtn) {
        closeBtn.onclick = function() {
            modal.style.display = "none";
        };
    }
    
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }
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
    
    renderCollection(collection);
}

// Поиск по коллекции
function searchCollection(term) {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) return;

    const userCollectionKey = USER_COLLECTION_PREFIX + user.userId;
    const collection = JSON.parse(localStorage.getItem(userCollectionKey)) || [];
    
    const filtered = collection.filter(item => {
        // Поиск по названию
        const inName = item.name && item.name.toLowerCase().includes(term);
        // Поиск по описанию
        const inDescription = item.description && item.description.toLowerCase().includes(term);
        // Поиск по тегам
        let inTags = false;
        if (item.tags && item.tags.length > 0) {
            inTags = item.tags.some(tag => tag.toLowerCase().includes(term));
        }
        
        return inName || inDescription || inTags;
    });
    
    renderCollection(filtered);
}

// Отображение коллекции
function renderCollection(collection) {
    const collectionContainer = document.getElementById("collection");
    if (!collectionContainer) return;

    if (collection.length === 0) {
        collectionContainer.innerHTML = `
            <div class="no-results">
                <p>Ничего не найдено</p>
                <p>Попробуйте изменить запрос или добавьте новые предметы</p>
            </div>
        `;
        return;
    }

    collectionContainer.innerHTML = "";
    collection.forEach(item => {
        const card = document.createElement("div");
        card.className = "item-card";
        
        // Формируем теги
        let tagsHtml = '';
        if (item.tags && item.tags.length > 0) {
            tagsHtml = `
                <div class="tags">
                    ${item.tags.map(tag => `<span class="tag">${tag.trim()}</span>`).join('')}
                </div>
            `;
        }
        
        card.innerHTML = `
            <h3>${item.name || "Без названия"}</h3>
            ${item.description ? `<p>${item.description}</p>` : ''}
            ${tagsHtml}
            ${item.imageUrl ? `<img src="${item.imageUrl}" alt="Фото предмета" class="item-image">` : ''}
            <div class="item-date">${formatDate(new Date(item.addedAt))}</div>
            <div class="item-actions">
                <button onclick="openEditModal('${item.id}')" class="btn-edit">✏️ Редактировать</button>
                <button onclick="deleteItem('${item.id}')" class="btn-delete">🗑️ Удалить</button>
            </div>
        `;
        collectionContainer.appendChild(card);
    });
}

// Форматирование даты
function formatDate(date) {
    if (!date) return "";
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString("ru-RU", options);
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
    document.getElementById("editTags").value = item.tags ? item.tags.join(", ") : "";
    
    const preview = document.getElementById("editPreview");
    if (item.imageUrl) {
        preview.src = item.imageUrl;
        preview.style.display = 'block';
    } else {
        preview.style.display = 'none';
    }

    // Сброс статуса
    document.getElementById("editStatus").innerText = "";
    
    modal.style.display = "block";
}

// Сохранение изменений в модальном окне
if (document.getElementById("saveEditBtn")) {
    document.getElementById("saveEditBtn").onclick = function() {
        const name = document.getElementById("editName").value.trim();
        const description = document.getElementById("editDescription").value.trim();
        const tagsInput = document.getElementById("editTags").value.trim();
        const imageInput = document.getElementById("editImage");
        const file = imageInput.files[0];
        const status = document.getElementById("editStatus");

        if (!name) {
            showStatus("editStatus", "⚠️ Введите название предмета", "warning");
            return;
        }

        const user = JSON.parse(localStorage.getItem('currentUser'));
        if (!user || !currentEditItemId) return;

        const userCollectionKey = USER_COLLECTION_PREFIX + user.userId;
        const collection = JSON.parse(localStorage.getItem(userCollectionKey)) || [];
        const itemIndex = collection.findIndex(i => i.id == currentEditItemId);
        
        if (itemIndex === -1) return;

        showStatus("editStatus", "⏳ Сохранение изменений...", "info");

        // Обработка тегов
        const tags = tagsInput ? 
            tagsInput.split(',')
                .map(tag => tag.trim())
                .filter(tag => tag) 
            : [];

        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                collection[itemIndex].imageUrl = e.target.result;
                saveUpdatedItem(collection, itemIndex, name, description, tags, status);
            };
            reader.readAsDataURL(file);
        } else {
            saveUpdatedItem(collection, itemIndex, name, description, tags, status);
        }
    };
}

function saveUpdatedItem(collection, index, name, description, tags, statusElement) {
    collection[index] = {
        ...collection[index],
        name,
        description,
        tags,
        addedAt: new Date().toISOString()
    };
    
    saveItem(collection[index], statusElement);
}

// Удаление предмета
function deleteItem(itemId) {
    if (!confirm("Вы уверены, что хотите удалить этот предмет?")) return;

    try {
        const user = JSON.parse(localStorage.getItem('currentUser'));
        if (!user) {
            throw new Error("Пользователь не авторизован");
        }

        const userCollectionKey = USER_COLLECTION_PREFIX + user.userId;
        const collection = JSON.parse(localStorage.getItem(userCollectionKey)) || [];
        const updatedCollection = collection.filter(item => String(item.id) !== String(itemId));
        
        localStorage.setItem(userCollectionKey, JSON.stringify(updatedCollection));
        
        // Покажем сообщение об успехе
        showTempMessage("✅ Предмет успешно удален!");
        
        // Обновим список
        loadCollection();
    } catch (error) {
        console.error("Ошибка удаления:", error);
        showTempMessage("❌ Ошибка при удалении: " + error.message, "error");
    }
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
        const tagsInput = document.getElementById("tags").value.trim();
        const file = imageInput.files[0];

        if (!name) {
            showStatus("addStatus", "⚠️ Введите название предмета", "warning");
            return;
        }

        showStatus("addStatus", "⏳ Сохранение предмета...", "info");

        // Обработка тегов
        const tags = tagsInput ? 
            tagsInput.split(',')
                .map(tag => tag.trim())
                .filter(tag => tag) 
            : [];

        const newItem = {
            id: Date.now(),
            name,
            description,
            tags,
            addedAt: new Date().toISOString(),
            imageUrl: null
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

// Сохранение предмета (обновление или добавление)
function saveItem(item, statusElement) {
    try {
        const user = JSON.parse(localStorage.getItem('currentUser'));
        if (!user) {
            throw new Error("Пользователь не авторизован");
        }

        const userCollectionKey = USER_COLLECTION_PREFIX + user.userId;
        let collection = JSON.parse(localStorage.getItem(userCollectionKey)) || [];
        
        // Проверяем, существует ли уже элемент с таким ID
        const existingItemIndex = collection.findIndex(i => i.id === item.id);
        
        if (existingItemIndex >= 0) {
            // Обновляем существующий элемент
            collection[existingItemIndex] = item;
        } else {
            // Добавляем новый элемент
            collection.unshift(item);
        }

        // Сохраняем обновленную коллекцию
        localStorage.setItem(userCollectionKey, JSON.stringify(collection));
        
        showStatus(statusElement.id, "✅ Успешно сохранено!", "success");
        
        // Если это добавление нового предмета, переходим на dashboard
        if (window.location.pathname.endsWith("add_item.html")) {
            setTimeout(() => {
                window.location.href = "dashboard.html";
            }, 1500);
        } else {
            // Если редактирование, просто закрываем модальное окно
            setTimeout(() => {
                modal.style.display = "none";
                loadCollection();
            }, 1500);
        }
    } catch (error) {
        console.error("Ошибка сохранения:", error);
        showStatus(statusElement.id, "❌ Ошибка сохранения: " + error.message, "error");
    }
}

// Проверка и исправление коллекции
function validateAndFixCollections() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) return;

    const userCollectionKey = USER_COLLECTION_PREFIX + user.userId;
    let collection = JSON.parse(localStorage.getItem(userCollectionKey)) || [];
    
    // Фильтруем некорректные записи
    collection = collection.filter(item => {
        return item && typeof item === 'object' && 'id' in item;
    });
    
    // Убедимся, что у каждого элемента есть массив тегов
    collection = collection.map(item => {
        if (!item.tags || !Array.isArray(item.tags)) {
            item.tags = [];
        }
        return item;
    });
    
    // Сохраняем исправленную коллекцию
    localStorage.setItem(userCollectionKey, JSON.stringify(collection));
}

// Показать статусное сообщение
function showStatus(elementId, message, type = "info") {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    element.innerText = message;
    element.style.display = "block";
    
    // Очищаем классы
    element.className = "status-message";
    
    // Добавляем класс в зависимости от типа
    switch(type) {
        case "success":
            element.classList.add("success");
            element.style.backgroundColor = "#d4edda";
            element.style.color = "#155724";
            break;
        case "error":
            element.classList.add("error");
            element.style.backgroundColor = "#f8d7da";
            element.style.color = "#721c24";
            break;
        case "warning":
            element.classList.add("warning");
            element.style.backgroundColor = "#fff3cd";
            element.style.color = "#856404";
            break;
        case "info":
        default:
            element.classList.add("info");
            element.style.backgroundColor = "#d1ecf1";
            element.style.color = "#0c5460";
            break;
    }
}

// Показать временное сообщение
function showTempMessage(message, type = "success") {
    const container = document.getElementById("collection");
    if (!container) return;
    
    const messageDiv = document.createElement("div");
    messageDiv.className = "status-message";
    
    switch(type) {
        case "success":
            messageDiv.style.backgroundColor = "#d4edda";
            messageDiv.style.color = "#155724";
            break;
        case "error":
            messageDiv.style.backgroundColor = "#f8d7da";
            messageDiv.style.color = "#721c24";
            break;
        default:
            messageDiv.style.backgroundColor = "#d1ecf1";
            messageDiv.style.color = "#0c5460";
    }
    
    messageDiv.innerText = message;
    messageDiv.style.margin = "15px 0";
    messageDiv.style.padding = "15px";
    messageDiv.style.borderRadius = "6px";
    messageDiv.style.textAlign = "center";
    
    container.prepend(messageDiv);
    
    // Удалить сообщение через 3 секунды
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}