document.addEventListener('DOMContentLoaded', function () {
    const menuToggle = document.querySelector('.menu-toggle');
    const fixedMenu = document.querySelector('.fixed-menu');

    if (menuToggle && fixedMenu) {
        menuToggle.addEventListener('click', function (e) {
            e.stopPropagation(); // Prevent click from bubbling up
            fixedMenu.classList.toggle('active');

            // Update aria-expanded attribute
            const expanded = menuToggle.getAttribute('aria-expanded') === 'true' || false;
            menuToggle.setAttribute('aria-expanded', !expanded);
        });

        // Close the menu when clicking outside
        document.addEventListener('click', function (e) {
            if (fixedMenu.classList.contains('active')) {
                fixedMenu.classList.remove('active');
                menuToggle.setAttribute('aria-expanded', false);
            }
        });

        // Prevent closing when clicking inside the menu
        fixedMenu.addEventListener('click', function (e) {
            e.stopPropagation();
        });
    }
    // Removed the else block that logs an error message
});