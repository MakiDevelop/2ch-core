// 2ch.tw Bookmark Feature (LocalStorage)
// 收藏功能 - 資料存在瀏覽器 localStorage

const Bookmarks = {
    KEY: '2ch_bookmarks',
    VERSION: 1,

    // 取得所有收藏
    getAll() {
        try {
            const data = localStorage.getItem(this.KEY);
            if (!data) return [];
            const parsed = JSON.parse(data);
            return parsed.items || [];
        } catch (e) {
            console.error('Failed to load bookmarks:', e);
            return [];
        }
    },

    // 儲存收藏
    _save(items) {
        try {
            localStorage.setItem(this.KEY, JSON.stringify({
                v: this.VERSION,
                items: items
            }));
            return true;
        } catch (e) {
            console.error('Failed to save bookmarks:', e);
            return false;
        }
    },

    // 新增收藏
    add(id, title, board) {
        const items = this.getAll();
        // 避免重複
        if (items.some(item => item.id === id)) return false;

        items.unshift({
            id: id,
            title: title || '無標題',
            board: board || '',
            ts: Date.now()
        });
        return this._save(items);
    },

    // 移除收藏
    remove(id) {
        const items = this.getAll();
        const filtered = items.filter(item => item.id !== id);
        return this._save(filtered);
    },

    // 檢查是否已收藏
    has(id) {
        return this.getAll().some(item => item.id === id);
    },

    // 取得收藏數量
    count() {
        return this.getAll().length;
    }
};

// 建立收藏按鈕 UI
function createBookmarkButton(threadId, title, board) {
    const isBookmarked = Bookmarks.has(threadId);

    const container = document.createElement('span');
    container.className = 'bookmark-container';

    // 收藏按鈕
    const btn = document.createElement('button');
    btn.className = 'bookmark-btn' + (isBookmarked ? ' bookmarked' : '');
    btn.innerHTML = isBookmarked ? '★' : '☆';
    btn.title = isBookmarked ? '取消收藏' : '加入收藏';
    btn.setAttribute('aria-label', btn.title);

    btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (Bookmarks.has(threadId)) {
            Bookmarks.remove(threadId);
            btn.innerHTML = '☆';
            btn.classList.remove('bookmarked');
            btn.title = '加入收藏';
            showBookmarkToast('已取消收藏');
        } else {
            Bookmarks.add(threadId, title, board);
            btn.innerHTML = '★';
            btn.classList.add('bookmarked');
            btn.title = '取消收藏';
            showBookmarkToast('已加入收藏');
        }
    });

    // 問號提示
    const help = document.createElement('span');
    help.className = 'bookmark-help';
    help.innerHTML = '(?)';
    help.tabIndex = 0;

    const tooltip = document.createElement('span');
    tooltip.className = 'bookmark-tooltip';
    tooltip.innerHTML = `
        <strong>LocalStorage 方案</strong><br>
        • 收藏存在瀏覽器裡<br>
        • 缺點：換瀏覽器/清快取就沒了
    `;
    help.appendChild(tooltip);

    container.appendChild(btn);
    container.appendChild(help);

    return container;
}

// 顯示收藏 toast 通知
function showBookmarkToast(message) {
    const existing = document.querySelector('.bookmark-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'bookmark-toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 1500);
}

// Export for use in other scripts
window.Bookmarks = Bookmarks;
window.createBookmarkButton = createBookmarkButton;
