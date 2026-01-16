// 2ch.tw Bookmark Feature (LocalStorage)
// 收藏功能 - 資料存在瀏覽器 localStorage

const Bookmarks = {
    KEY: '2ch_bookmarks',
    VERSION: 2,

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
    add(id, title, board, replyCount = 0) {
        const items = this.getAll();
        // 避免重複
        if (items.some(item => item.id === id)) return false;

        items.unshift({
            id: id,
            title: title || '無標題',
            board: board || '',
            ts: Date.now(),
            lastSeenReplies: replyCount,  // 記錄收藏時的回覆數
            currentReplies: replyCount
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

    // 取得單一收藏
    get(id) {
        return this.getAll().find(item => item.id === id);
    },

    // 更新已讀回覆數（當用戶進入討論串時呼叫）
    updateLastSeen(id, replyCount) {
        const items = this.getAll();
        const item = items.find(i => i.id === id);
        if (item) {
            item.lastSeenReplies = replyCount;
            item.currentReplies = replyCount;
            this._save(items);
        }
    },

    // 更新當前回覆數（用於顯示新回覆數）
    updateCurrentReplies(id, replyCount) {
        const items = this.getAll();
        const item = items.find(i => i.id === id);
        if (item) {
            item.currentReplies = replyCount;
            this._save(items);
        }
    },

    // 計算新回覆數
    getNewReplies(id) {
        const item = this.get(id);
        if (!item) return 0;
        const lastSeen = item.lastSeenReplies || 0;
        const current = item.currentReplies || 0;
        return Math.max(0, current - lastSeen);
    },

    // 計算總共有多少未讀
    getTotalNewReplies() {
        return this.getAll().reduce((sum, item) => {
            const lastSeen = item.lastSeenReplies || 0;
            const current = item.currentReplies || 0;
            return sum + Math.max(0, current - lastSeen);
        }, 0);
    },

    // 取得收藏數量
    count() {
        return this.getAll().length;
    }
};

// 建立收藏按鈕 UI
function createBookmarkButton(threadId, title, board, replyCount = 0) {
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
            Bookmarks.add(threadId, title, board, replyCount);
            btn.innerHTML = '★';
            btn.classList.add('bookmarked');
            btn.title = '取消收藏';
            showBookmarkToast('已加入收藏');
        }
        // 更新側邊欄 badge
        updateBookmarkBadge();
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

// =============================================
// 浮動側邊欄功能
// =============================================

// 建立浮動按鈕和側邊欄
function initBookmarkSidebar() {
    // 浮動按鈕
    const fab = document.createElement('button');
    fab.className = 'bookmark-fab';
    fab.innerHTML = '⭐';
    fab.title = '我的收藏';
    fab.setAttribute('aria-label', '開啟收藏列表');

    // Badge 顯示未讀數
    const badge = document.createElement('span');
    badge.className = 'bookmark-fab-badge';
    badge.style.display = 'none';
    fab.appendChild(badge);

    // 側邊欄
    const sidebar = document.createElement('div');
    sidebar.className = 'bookmark-sidebar';
    sidebar.innerHTML = `
        <div class="bookmark-sidebar-header">
            <h3>⭐ 我的收藏</h3>
            <span class="bookmark-help-inline">(?)
                <span class="bookmark-tooltip">
                    <strong>LocalStorage 方案</strong><br>
                    • 收藏存在瀏覽器裡<br>
                    • 缺點：換瀏覽器/清快取就沒了
                </span>
            </span>
            <button class="bookmark-sidebar-close" aria-label="關閉">✕</button>
        </div>
        <div class="bookmark-sidebar-content">
            <div class="bookmark-sidebar-list"></div>
        </div>
    `;

    // 遮罩
    const overlay = document.createElement('div');
    overlay.className = 'bookmark-overlay';

    document.body.appendChild(fab);
    document.body.appendChild(sidebar);
    document.body.appendChild(overlay);

    // 事件綁定
    fab.addEventListener('click', () => toggleSidebar(true));
    overlay.addEventListener('click', () => toggleSidebar(false));
    sidebar.querySelector('.bookmark-sidebar-close').addEventListener('click', () => toggleSidebar(false));

    // ESC 關閉
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebar.classList.contains('open')) {
            toggleSidebar(false);
        }
    });

    // 初始化 badge
    updateBookmarkBadge();
}

// 切換側邊欄
function toggleSidebar(open) {
    const sidebar = document.querySelector('.bookmark-sidebar');
    const overlay = document.querySelector('.bookmark-overlay');

    if (open) {
        sidebar.classList.add('open');
        overlay.classList.add('show');
        document.body.style.overflow = 'hidden';
        renderBookmarkList();
    } else {
        sidebar.classList.remove('open');
        overlay.classList.remove('show');
        document.body.style.overflow = '';
    }
}

// 渲染收藏列表
function renderBookmarkList() {
    const container = document.querySelector('.bookmark-sidebar-list');
    if (!container) return;

    const bookmarks = Bookmarks.getAll();

    if (bookmarks.length === 0) {
        container.innerHTML = `
            <div class="bookmark-empty">
                <p>還沒有收藏任何討論串</p>
                <p class="bookmark-empty-hint">在討論串頁面點擊標題旁的 ☆ 即可收藏</p>
            </div>
        `;
        return;
    }

    const html = bookmarks.map(item => {
        const newReplies = Math.max(0, (item.currentReplies || 0) - (item.lastSeenReplies || 0));
        const newBadge = newReplies > 0
            ? `<span class="bookmark-new-badge">+${newReplies}</span>`
            : '';

        return `
            <a href="/posts/${item.id}" class="bookmark-item" data-id="${item.id}">
                <div class="bookmark-item-title">
                    ${_bmEscapeHtml(item.title)}
                    ${newBadge}
                </div>
                <div class="bookmark-item-meta">
                    <span class="bookmark-item-id">#${item.id}</span>
                    ${item.board ? `<span class="bookmark-item-board">/${item.board}/</span>` : ''}
                </div>
                <button class="bookmark-item-remove" data-id="${item.id}" title="取消收藏">✕</button>
            </a>
        `;
    }).join('');

    container.innerHTML = html;

    // 綁定刪除按鈕
    container.querySelectorAll('.bookmark-item-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const id = parseInt(btn.dataset.id);
            Bookmarks.remove(id);
            renderBookmarkList();
            updateBookmarkBadge();
            showBookmarkToast('已取消收藏');
        });
    });
}

// 更新浮動按鈕的 badge
function updateBookmarkBadge() {
    const badge = document.querySelector('.bookmark-fab-badge');
    if (!badge) return;

    const total = Bookmarks.getTotalNewReplies();
    if (total > 0) {
        badge.textContent = total > 99 ? '99+' : total;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

// Escape HTML (private to avoid conflicts with other scripts)
function _bmEscapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 頁面載入時初始化側邊欄
document.addEventListener('DOMContentLoaded', () => {
    initBookmarkSidebar();
});

// Export for use in other scripts
window.Bookmarks = Bookmarks;
window.createBookmarkButton = createBookmarkButton;
window.updateBookmarkBadge = updateBookmarkBadge;
