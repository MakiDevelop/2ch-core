// Apply saved theme immediately to prevent flash of unstyled content (FOUC)
// This script must be loaded synchronously in <head>
(function() {
    var theme = localStorage.getItem('theme');
    if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
})();
