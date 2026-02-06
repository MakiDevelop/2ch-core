// Bookmarks page logic
(function() {
    function escapeHtml(text) {
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function formatDate(ts) {
        var date = new Date(ts);
        var now = new Date();
        var diff = now - date;
        var days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days > 0) return days + '天前收藏';
        var hours = Math.floor(diff / (1000 * 60 * 60));
        if (hours > 0) return hours + '小時前收藏';
        var minutes = Math.floor(diff / (1000 * 60));
        if (minutes > 0) return minutes + '分鐘前收藏';
        return '剛剛收藏';
    }

    function renderBookmarks() {
        var container = document.getElementById('bookmarks-list');
        var countEl = document.getElementById('bookmark-count');
        var bookmarks = Bookmarks.getAll();

        countEl.textContent = '共 ' + bookmarks.length + ' 個收藏';

        if (bookmarks.length === 0) {
            container.innerHTML =
                '<div class="empty">' +
                    '<p>還沒有收藏任何討論串</p>' +
                    '<p style="font-size: 0.9em; color: var(--text-muted); margin-top: 10px;">' +
                        '在討論串頁面點擊標題旁的 ☆ 即可收藏' +
                    '</p>' +
                '</div>';
            return;
        }

        var html = bookmarks.map(function(item) {
            return '<div class="thread-item bookmark-item" data-id="' + item.id + '">' +
                '<div class="thread-content">' +
                    '<div class="thread-title">' + escapeHtml(item.title) + '</div>' +
                '</div>' +
                '<div class="thread-meta">' +
                    '<span class="thread-id">#' + item.id + '</span>' +
                    (item.board ? '<span class="thread-board">/' + item.board + '/</span>' : '') +
                    '<span class="thread-time">' + formatDate(item.ts) + '</span>' +
                    '<button class="remove-bookmark-btn" data-id="' + item.id + '" title="取消收藏">✕</button>' +
                    '<a href="/posts/' + item.id + '" class="thread-link">查看討論串 →</a>' +
                '</div>' +
            '</div>';
        }).join('');

        container.innerHTML = html;

        container.querySelectorAll('.remove-bookmark-btn').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                var id = parseInt(this.dataset.id);
                if (confirm('確定要取消收藏嗎？')) {
                    Bookmarks.remove(id);
                    renderBookmarks();
                }
            });
        });
    }

    document.addEventListener('DOMContentLoaded', function() {
        renderBookmarks();
    });
})();
