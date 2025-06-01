document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("addItemForm");
    const collection = document.getElementById("collection");
    const preview = document.getElementById("preview");

    // Загрузка данных из localStorage
    let items = JSON.parse(localStorage.getItem("numizmatItems")) || [];

    if (window.location.pathname.endsWith("dashboard.html")) {
        renderCollection();
    }

    if (form) {
        form.addEventListener("submit", function (e) {
            e.preventDefault();

            const name = document.getElementById("name").value.trim();
            const description = document.getElementById("description").value.trim();
            const imageInput = document.getElementById("image");
            const file = imageInput.files[0];

            if (!name) {
                alert("Введите название предмета");
                return;
            }

            const reader = new FileReader();
            reader.onload = function (event) {
                const newItem = {
                    name,
                    description,
                    image: event.target.result
                };

                items.push(newItem);
                localStorage.setItem("numizmatItems", JSON.stringify(items));

                alert("Предмет успешно добавлен!");
                window.location.href = "dashboard.html";
            };

            if (file) {
                reader.readAsDataURL(file);
            } else {
                const newItem = {
                    name,
                    description,
                    image: null
                };

                items.push(newItem);
                localStorage.setItem("numizmatItems", JSON.stringify(items));

                alert("Предмет добавлен без изображения");
                window.location.href = "dashboard.html";
            }
        });

        imageInput.addEventListener("change", function () {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    preview.src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    function renderCollection() {
        if (items.length === 0) {
            collection.innerHTML = "<p>Ваша коллекция пока пуста.</p>";
            return;
        }

        items.forEach(item => {
            const card = document.createElement("div");
            card.className = "item-card";

            const h3 = document.createElement("h3");
            h3.textContent = item.name;

            const p = document.createElement("p");
            p.textContent = item.description;

            if (item.image) {
                const img = document.createElement("img");
                img.src = item.image;
                img.alt = "Фото";
                img.width = 100;
                card.appendChild(img);
            }

            card.appendChild(h3);
            card.appendChild(p);
            collection.appendChild(card);
        });
    }
});