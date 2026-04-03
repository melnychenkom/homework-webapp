/*!
* Start Bootstrap - Freelancer v7.0.7 (https://startbootstrap.com/theme/freelancer)
* Copyright 2013-2023 Start Bootstrap
* Licensed under MIT (https://github.com/StartBootstrap/startbootstrap-freelancer/blob/master/LICENSE)
*/
//
// Scripts
// 

window.addEventListener('DOMContentLoaded', event => {

    // Navbar shrink function
    var navbarShrink = function () {
        const navbarCollapsible = document.body.querySelector('#mainNav');
        if (!navbarCollapsible) {
            return;
        }
        if (window.scrollY === 0) {
            navbarCollapsible.classList.remove('navbar-shrink')
        } else {
            navbarCollapsible.classList.add('navbar-shrink')
        }

    };

    // Shrink the navbar 
    navbarShrink();

    // Shrink the navbar when page is scrolled
    document.addEventListener('scroll', navbarShrink);

    // Activate Bootstrap scrollspy on the main nav element
    const mainNav = document.body.querySelector('#mainNav');
    if (mainNav) {
        new bootstrap.ScrollSpy(document.body, {
            target: '#mainNav',
            rootMargin: '0px 0px -40%',
        });
    };

    // Collapse responsive navbar when toggler is visible
    const navbarToggler = document.body.querySelector('.navbar-toggler');
    const responsiveNavItems = [].slice.call(
        document.querySelectorAll('#navbarResponsive .nav-link')
    );
    responsiveNavItems.map(function (responsiveNavItem) {
        responsiveNavItem.addEventListener('click', () => {
            if (window.getComputedStyle(navbarToggler).display !== 'none') {
                navbarToggler.click();
            }
        });
    });

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
            formData.append(
                "csrfmiddlewaretoken",
                document.querySelector('[name="csrfmiddlewaretoken"]').value
            );

            try {
                const response = await fetch("/delete/", {
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

});
