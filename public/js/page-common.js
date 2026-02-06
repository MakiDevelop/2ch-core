// Shared page initialization logic
// Handles: theme toggle, mobile boards list, syntax help tooltips, back-to-top, report link
document.addEventListener('DOMContentLoaded', function() {
    // Mobile: Collapsible boards list
    var boardsList = document.querySelector('.boards-list');
    var boardsHeader = boardsList ? boardsList.querySelector('h2') : null;
    if (boardsHeader) {
        boardsHeader.addEventListener('click', function() {
            boardsList.classList.toggle('expanded');
        });
    }

    // Mobile tap toggle for syntax help tooltips
    document.querySelectorAll('.syntax-help').forEach(function(el) {
        el.addEventListener('click', function(e) {
            if (e.target.classList.contains('help-tooltip-close')) {
                el.classList.remove('active');
                return;
            }
            e.stopPropagation();
            el.classList.toggle('active');
        });
    });
    document.querySelectorAll('.help-tooltip-close').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            var syntaxHelp = btn.closest('.syntax-help');
            if (syntaxHelp) syntaxHelp.classList.remove('active');
        });
    });
    document.addEventListener('click', function() {
        document.querySelectorAll('.syntax-help.active').forEach(function(el) {
            el.classList.remove('active');
        });
    });

    // Theme toggle button
    var themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            var currentTheme = document.documentElement.getAttribute('data-theme');
            var newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }

    // Back to top button
    var backToTop = document.getElementById('back-to-top');
    if (backToTop) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 300) {
                backToTop.classList.add('visible');
            } else {
                backToTop.classList.remove('visible');
            }
        });
        backToTop.addEventListener('click', function() {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Report problem links (replace inline onclick)
    document.querySelectorAll('.footer-report-link').forEach(function(link) {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            if (typeof showReportProblemModal === 'function') {
                showReportProblemModal();
            }
        });
    });

    // Sort buttons (board page, replace inline onclick)
    document.querySelectorAll('[data-sort]').forEach(function(btn) {
        btn.addEventListener('click', function() {
            if (typeof setSort === 'function') {
                setSort(btn.getAttribute('data-sort'));
            }
        });
    });
});
