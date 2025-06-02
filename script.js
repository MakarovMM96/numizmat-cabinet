// Регистрация
function register() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    firebase.auth().createUserWithEmailAndPassword(email, password)
        .then(() => {
            document.getElementById("status").innerText = "✅ Успешно зарегистрирован!";
        })
        .catch((error) => {
            document.getElementById("status").innerText = "❌ Ошибка: " + error.message;
        });
}

// Вход
function login() {
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    firebase.auth().signInWithEmailAndPassword(email, password)
        .then(() => {
            document.getElementById("loginStatus").innerText = "✅ Вход выполнен!";
            window.location.href = "dashboard.html";
        })
        .catch((error) => {
            document.getElementById("loginStatus").innerText = "❌ Ошибка: " + error.message;
        });
}

// Выход
function logout() {
    firebase.auth().signOut();
    window.location.href = "index.html";
}

// Защита страниц
firebase.auth().onAuthStateChanged(user => {
    if (!user && window.location.pathname !== "/index.html") {
        window.location.href = "index.html";
    }
});

// Показывает коллекцию
window.onload = () => {
    if (window.location.pathname === "/dashboard.html") {
        const collection = document.getElementById("collection");
        collection.innerHTML = "";

        firebase.auth().onAuthStateChanged(user => {
            if (user) {
                firebase.firestore().collection("items").where("userId", "==", user.uid).get()
                    .then(snapshot => {
                        snapshot.forEach(doc => {
                            const data = doc.data();
                            const card = document.createElement("div");
                            card.className = "item-card";
                            card.innerHTML = `
                                <h3>${data.name}</h3>
                                <p>${data.description}</p>
                                ${data.imageUrl ? `<img src="${data.imageUrl}" alt="Фото" width="100">` : ""}
                            `;
                            collection.appendChild(card);
                        });
                    });
            }
        });
    }
};

// Добавление предмета
function addItem() {
    const name = document.getElementById("name").value.trim();
    const description = document.getElementById("description").value.trim();
    const imageInput = document.getElementById("image");
    const file = imageInput.files[0];

    firebase.auth().onAuthStateChanged(user => {
        if (!user) return;

        if (!name) {
            alert("Введите название предмета");
            return;
        }

        const storageRef = firebase.storage().ref();
        const imageRef = storageRef.child(`images/${Date.now()}_${file.name}`);

        const reader = new FileReader();
        reader.onload = function (event) {
            imageRef.putString(event.target.result, 'data_url').then(snapshot => {
                snapshot.ref.getDownloadURL().then(url => {
                    firebase.firestore().collection("items").add({
                        userId: user.uid,
                        name,
                        description,
                        imageUrl: url
                    }).then(() => {
                        document.getElementById("addStatus").innerText = "✅ Предмет добавлен!";
                        setTimeout(() => window.location.href = "dashboard.html", 1000);
                    });
                });
            });
        };

        if (file) reader.readAsDataURL(file);
    });
}