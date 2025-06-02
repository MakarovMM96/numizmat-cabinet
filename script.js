// Регистрация пользователя
function register() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    firebase.auth().createUserWithEmailAndPassword(email, password)
        .then(() => {
            document.getElementById("status").innerText = "✅ Успешно зарегистрирован!";
        })
        .catch((error) => {
            console.error("Ошибка регистрации: ", error);
            document.getElementById("status").innerText = "❌ Ошибка: " + error.message;
        });
}

// Вход пользователя
function login() {
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    firebase.auth().signInWithEmailAndPassword(email, password)
        .then(() => {
            document.getElementById("loginStatus").innerText = "✅ Вход выполнен!";
            window.location.href = "dashboard.html";
        })
        .catch((error) => {
            console.error("Ошибка входа: ", error);
            document.getElementById("loginStatus").innerText = "❌ Ошибка: " + error.message;
        });
}

// Выход пользователя
function logout() {
    firebase.auth().signOut()
        .then(() => {
            window.location.href = "index.html";
        })
        .catch((error) => {
            console.error("Ошибка выхода: ", error);
        });
}

// Защита страниц (только для авторизованных)
window.onload = () => {
    const auth = firebase.auth();
    const db = firebase.firestore();
    const storage = firebase.storage();

    auth.onAuthStateChanged(user => {
        const path = window.location.pathname;

        // Если не главная и пользователь не авторизован — отправляем на вход
        if (!user && !path.endsWith("index.html")) {
            window.location.href = "index.html";
            return;
        }

        // На главной показываем форму
        if (path.endsWith("index.html")) {
            console.log("Главная загружена");
        }

        // На странице dashboard подгружаем коллекцию
        if (path.endsWith("dashboard.html") && user) {
            loadCollection(db, user.uid);
        }

        // На странице add_item настраиваем форму
        if (path.endsWith("add_item.html") && user) {
            setupAddItemForm(db, storage, user);
        }
    });
};

// Настройка формы добавления предмета
function setupAddItemForm(db, storage, user) {
    const imageInput = document.getElementById("image");
    const preview = document.getElementById("preview");
    const addButton = document.getElementById("addItemBtn");
    const status = document.getElementById("addStatus");

    if (!addButton) {
        console.error("Кнопка добавления не найдена");
        return;
    }

    // Обработчик для предпросмотра изображения
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

    // Обработчик кнопки добавления
    addButton.onclick = async () => {
        const name = document.getElementById("name").value.trim();
        const description = document.getElementById("description").value.trim();
        const file = imageInput.files[0];

        if (!name) {
            status.innerText = "⚠️ Введите название предмета";
            status.style.color = "#e67e22";
            return;
        }

        status.innerText = "⏳ Сохранение предмета...";
        status.style.color = "#3498db";

        try {
            let imageUrl = null;
            
            // Если есть файл - загружаем его в Storage
            if (file) {
                const storageRef = storage.ref();
                const fileRef = storageRef.child(`users/${user.uid}/items/${Date.now()}_${file.name}`);
                await fileRef.put(file);
                imageUrl = await fileRef.getDownloadURL();
            }

            // Сохраняем данные в Firestore
            await db.collection("items").add({
                userId: user.uid,
                name: name,
                description: description,
                imageUrl: imageUrl || "",
                addedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            status.innerText = "✅ Предмет успешно добавлен!";
            status.style.color = "#2ecc71";
            
            // Через 1.5 сек переходим на страницу коллекции
            setTimeout(() => {
                window.location.href = "dashboard.html";
            }, 1500);
            
        } catch (error) {
            console.error("Ошибка при добавлении предмета:", error);
            status.innerText = "❌ Ошибка: " + error.message;
            status.style.color = "#e74c3c";
        }
    };
}

// Функция загрузки коллекции
function loadCollection(db, userId) {
    const collectionContainer = document.getElementById("collection");
    if (!collectionContainer) return;

    collectionContainer.innerHTML = "<p>Загрузка коллекции...</p>";

    db.collection("items")
        .where("userId", "==", userId)
        .orderBy("addedAt", "desc")
        .get()
        .then(snapshot => {
            collectionContainer.innerHTML = "";

            if (snapshot.empty) {
                collectionContainer.innerHTML = "<p>Ваша коллекция пока пуста.</p>";
                return;
            }

            snapshot.forEach(doc => {
                const data = doc.data();
                const card = document.createElement("div");
                card.className = "item-card";

                card.innerHTML = `
                    <h3>${data.name || "Без названия"}</h3>
                    ${data.description ? `<p>${data.description}</p>` : ''}
                    ${data.imageUrl ? `<img src="${data.imageUrl}" alt="Фото предмета" class="item-image">` : ''}
                    <div class="item-date">${formatDate(data.addedAt?.toDate())}</div>
                `;
                collectionContainer.appendChild(card);
            });
        })
        .catch(error => {
            console.error("Ошибка загрузки коллекции: ", error);
            collectionContainer.innerHTML = `<p class="error">Ошибка загрузки данных: ${error.message}</p>`;
        });
}

// Форматирование даты
function formatDate(date) {
    if (!date) return "";
    return date.toLocaleDateString("ru-RU", {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}