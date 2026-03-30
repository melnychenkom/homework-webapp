const changeExampleBtn = document.getElementById("change-example-btn");
const exampleOne = document.getElementById("example-one");
const exampleTwo = document.getElementById("example-two");
const feedbackForm = document.getElementById("feedback-form");
const formStatus = document.getElementById("form-status");
const messagesList = document.querySelector(".messages-list");

if (changeExampleBtn && exampleOne && exampleTwo) {
    changeExampleBtn.addEventListener("click", () => {
        const firstIsVisible = !exampleOne.hasAttribute("hidden");
        if (firstIsVisible) {
            exampleOne.setAttribute("hidden", "");
            exampleTwo.removeAttribute("hidden");
        } else {
            exampleTwo.setAttribute("hidden", "");
            exampleOne.removeAttribute("hidden");
        }
    });
}

if (feedbackForm && formStatus) {
    feedbackForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        formStatus.textContent = "Надсилання...";

        const formData = new FormData(feedbackForm);
        console.log(formData)

        try {
            const response = await fetch(feedbackForm.action, {
                method: "POST",
                body: formData,
            });

            const result = await response.json();

            if (result.success) {
                formStatus.textContent = result.message;
                feedbackForm.reset();
                document.body.dispatchEvent(new Event("feedback:submitted"));
            } else {
                formStatus.textContent = result.message || "Помилка надсилання.";
            }
        } catch (error) {
            console.log(error);
            formStatus.textContent = "Не вдалося надіслати форму. Спробуйте ще раз.";
        }
    });
}

if (messagesList) {
    messagesList.addEventListener("click", async (event) => {
        const button = event.target.closest(".delete-message-btn");
        if (!button) {
            return;
        }

        const messageItem = button.closest(".message-item");
        const messageId = messageItem?.dataset.id;
        if (!messageId) {
            return;
        }

        const isConfirmed = window.confirm("Видалити це повідомлення?");
        if (!isConfirmed) {
            return;
        }

        const formData = new FormData();
        formData.append("id", messageId);

        try {
            const response = await fetch("delete.php", {
                method: "POST",
                body: formData,
            });

            const result = await response.json();

            if (result.success) {
                messageItem.remove();
                document.body.dispatchEvent(new Event("message:deleted"));
            } else {
                alert(result.message || "Не вдалося видалити повідомлення.");
            }
        } catch (error) {
            alert("Не вдалося видалити повідомлення. Спробуйте ще раз.");
        }
    });
}