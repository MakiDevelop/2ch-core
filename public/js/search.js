// Search page logic
(function() {
    var COOLDOWN_MS = 10 * 1000;
    var lastSearchTime = parseInt(localStorage.getItem('lastSearchTime') || '0', 10);
    var cooldownInterval = null;

    function updateCooldown() {
        var now = Date.now();
        var elapsed = now - lastSearchTime;
        var remaining = Math.max(0, COOLDOWN_MS - elapsed);
        var display = document.getElementById('cooldown-display');
        var btn = document.getElementById('search-btn');

        if (remaining > 0) {
            var secs = Math.ceil(remaining / 1000);
            display.innerHTML = '<span class="cooldown-timer">冷卻中: ' + secs + '秒</span> | ';
            btn.disabled = true;
        } else {
            display.innerHTML = '';
            btn.disabled = false;
            if (cooldownInterval) {
                clearInterval(cooldownInterval);
                cooldownInterval = null;
            }
        }
    }

    function startCooldown() {
        lastSearchTime = Date.now();
        localStorage.setItem('lastSearchTime', lastSearchTime.toString());
        updateCooldown();
        cooldownInterval = setInterval(updateCooldown, 1000);
    }

    function escapeHtml(text) {
        if (!text) return '';
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function highlightText(text, query) {
        if (!query) return text;
        var regex = new RegExp('(' + escapeRegex(query) + ')', 'gi');
        return text.replace(regex, '<span class="highlight">$1</span>');
    }

    function formatTime(dateStr) {
        if (!dateStr) return '';
        var date = new Date(dateStr);
        var now = new Date();
        var diff = now - date;
        var mins = Math.floor(diff / 60000);
        var hours = Math.floor(mins / 60);
        var days = Math.floor(hours / 24);

        if (days > 0) return days + '天前';
        if (hours > 0) return hours + '小時前';
        if (mins > 0) return mins + '分鐘前';
        return '剛剛';
    }

    function doSearch() {
        var input = document.getElementById('search-input');
        var resultsEl = document.getElementById('search-results');
        var statusEl = document.getElementById('search-status');
        var query = input.value.trim();

        if (query.length < 2) {
            statusEl.style.display = 'block';
            statusEl.textContent = '請輸入至少 2 個字元';
            resultsEl.innerHTML = '';
            return;
        }

        var now = Date.now();
        if (now - lastSearchTime < COOLDOWN_MS) {
            var secs = Math.ceil((COOLDOWN_MS - (now - lastSearchTime)) / 1000);
            statusEl.style.display = 'block';
            statusEl.innerHTML = '<span class="cooldown-timer">請等待 ' + secs + ' 秒後再搜尋</span>';
            return;
        }

        statusEl.style.display = 'block';
        statusEl.textContent = '搜尋中...';
        resultsEl.innerHTML = '';

        fetch('/search?q=' + encodeURIComponent(query))
            .then(function(res) {
                return res.json().then(function(data) {
                    return { ok: res.ok, data: data };
                });
            })
            .then(function(result) {
                if (!result.ok) {
                    statusEl.textContent = result.data.error || '搜尋失敗';
                    if (result.data.retryAfter) {
                        lastSearchTime = Date.now() - COOLDOWN_MS + (result.data.retryAfter * 1000);
                        localStorage.setItem('lastSearchTime', lastSearchTime.toString());
                        startCooldown();
                    }
                    return;
                }

                startCooldown();
                history.replaceState(null, '', '/search.html?q=' + encodeURIComponent(query));

                if (result.data.count === 0) {
                    statusEl.textContent = '找不到「' + query + '」相關的討論串';
                    return;
                }

                statusEl.style.display = 'none';
                resultsEl.innerHTML = result.data.items.map(function(item) {
                    return '<a href="/posts/' + item.id + '" class="search-result-item">' +
                        '<div class="result-title">' + highlightText(escapeHtml(item.title || '無標題'), query) + '</div>' +
                        '<div class="result-content">' + highlightText(escapeHtml(item.content || ''), query) + '</div>' +
                        '<div class="result-meta">' +
                            '<span class="board">/' + (item.boardSlug || 'unknown') + '/</span>' +
                            '<span>' + escapeHtml(item.authorName || '名無しさん') + '</span>' +
                            '<span>' + formatTime(item.createdAt) + '</span>' +
                            '<span class="replies">' + (item.replyCount || 0) + ' 回覆</span>' +
                        '</div>' +
                    '</a>';
                }).join('');
            })
            .catch(function() {
                statusEl.textContent = '搜尋失敗，請稍後再試';
            });
    }

    // Init
    updateCooldown();
    if (Date.now() - lastSearchTime < COOLDOWN_MS) {
        cooldownInterval = setInterval(updateCooldown, 1000);
    }

    // Check URL params for initial search
    var urlParams = new URLSearchParams(window.location.search);
    var initialQuery = urlParams.get('q');
    if (initialQuery) {
        document.getElementById('search-input').value = initialQuery;
        setTimeout(doSearch, 100);
    }

    // Event listeners
    document.getElementById('search-btn').addEventListener('click', doSearch);
    document.getElementById('search-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') doSearch();
    });

    // Theme toggle
    var themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            var currentTheme = document.documentElement.getAttribute('data-theme');
            var newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }
})();
