document.addEventListener('DOMContentLoaded', function () {
    /* Back to Top Button */
    const backToTopButton = document.getElementById('back-to-top');
    const progressBar = document.getElementById('progress-bar');

    function updateBackToTop() {
        if (!backToTopButton) return;
        if (window.pageYOffset > 300) { // Show after scrolling 300px
            backToTopButton.style.display = 'block';
        } else {
            backToTopButton.style.display = 'none';
        }
    }

    function updateReadingProgress() {
        if (!progressBar) return;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        if (scrollHeight <= 0) {
            progressBar.style.width = '0%';
            return;
        }
        const scrolled = (scrollTop / scrollHeight) * 100;
        progressBar.style.width = scrolled + '%';
    }

    window.addEventListener('scroll', function () {
        updateBackToTop();
        updateReadingProgress();
    });

    if (backToTopButton) {
        backToTopButton.addEventListener('click', function () {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    updateBackToTop();
    updateReadingProgress();
});
