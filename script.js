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

        // На странице add_item слушаем кнопку
        if (path.endsWith("add_item.html") && user) {
            document.getElementById("addItemBtn")?.addEventListener("click", () => addItem(db, user));
        }
    });
};

// Функция загрузки коллекции
function loadCollection(db, userId) {
    const collectionContainer = document.getElementById("collection");
    if (!collectionContainer) return;

    collectionContainer.innerHTML = "<p>Загрузка коллекции...</p>";

    db.collection("items")
        .where("userId", "==", userId)
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
                    <p>${data.description || ""}</p>
                    ${data.imageUrl ? `<img src="${data.imageUrl}" alt="Фото" width="100">` : ""}
                `;
                collectionContainer.appendChild(card);
            });
        })
        .catch(error => {
            console.error("Ошибка загрузки коллекции: ", error);
            collectionContainer.innerHTML = `<p>Ошибка загрузки данных: ${error.message}</p>`;
        });
}

// Функция добавления предмета
function addItem(db, user) {
    const name = document.getElementById("name").value.trim();
    const description = document.getElementById("description").value.trim();
    const imageInput = document.getElementById("image");
    const file = imageInput.files[0];
    const status = document.getElementById("addStatus");

    if (!name) {
        status.innerText = "⚠️ Введите название предмета";
        return;
    }

    const storage = firebase.storage();
    const imageRef = file
        ? storage.ref(`images/${Date.now()}_${file.name}`)
        : null;

    if (file && imageRef) {
        const reader = new FileReader();

        reader.onload = function (e) {
            imageRef.putString(e.target.result, 'data_url')
                .then(snapshot => snapshot.ref.getDownloadURL())
                .then(url => saveItemToFirestore(db, user, name, description, url, status))
                .catch(error => {
                    console.error("Ошибка загрузки изображения: ", error);
                    status.innerText = "❌ Ошибка: Не удалось загрузить изображение.";
                });
        };

        reader.readAsDataURL(file);
    } else {
        saveItemToFirestore(db, user, name, description, null, status);
    }
}

// Сохранение предмета в Firestore
function saveItemToFirestore(db, user, name, description, imageUrl, status) {
    db.collection("items").add({
        userId: user.uid,
        name,
        description,
        imageUrl: imageUrl || "",
        addedAt: firebase.firestore.FieldValue.serverTimestamp()
    })
        .then(() => {
            status.innerText = "✅ Предмет успешно добавлен!";
            setTimeout(() => {
                window.location.href = "dashboard.html";
            }, 1000);
        })
        .catch(error => {
            console.error("Ошибка сохранения в Firestore: ", error);
            status.innerText = "❌ Ошибка: Не удалось сохранить предмет.";
        });
}