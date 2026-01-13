// 2ch.tw Thread Detail Page Script

// Version for cache busting
const APP_VERSION = '20260113';

// Get thread ID from URL
const getThreadId = () => {
    const path = window.location.pathname;
    const match = path.match(/\/posts\/(\d+)/);
    return match ? match[1] : null;
};

const threadId = getThreadId();
const API_BASE = '';

// Format date
const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}天前`;
    if (hours > 0) return `${hours}小時前`;
    if (minutes > 0) return `${minutes}分鐘前`;
    return '剛剛';
};

// Escape HTML to prevent XSS
const escapeHtml = (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
};

// Load thread and replies
const loadThread = async () => {
    try {
        // Load thread OP
        const threadResponse = await fetch(`${API_BASE}/posts/${threadId}?v=${APP_VERSION}`);
        if (!threadResponse.ok) {
            throw new Error('無法載入討論串');
        }
        const threadData = await threadResponse.json();

        // Update page title
        const preview = threadData.content.substring(0, 50);
        document.getElementById('page-title').textContent = `${preview}... - 2ch.tw`;

        // Render OP
        renderOP(threadData);

        // Load replies
        const repliesResponse = await fetch(`${API_BASE}/posts/${threadId}/replies?v=${APP_VERSION}`);
        if (!repliesResponse.ok) {
            throw new Error('無法載入回覆');
        }
        const repliesData = await repliesResponse.json();

        // Render replies
        renderReplies(repliesData.replies);

        // Store board slug for back button
        if (threadData.board) {
            sessionStorage.setItem('currentBoardSlug', threadData.board.slug);
        }
    } catch (error) {
        console.error('Error loading thread:', error);
        document.getElementById('thread-op').innerHTML =
            '<p class="error">載入失敗，請稍後再試。</p>';
        document.getElementById('replies-list').innerHTML = '';
    }
};

// Render original post
const renderOP = (thread) => {
    const container = document.getElementById('thread-op');

    const html = `
        <div class="op-post">
            <h2 class="thread-title">${escapeHtml(thread.title || '無標題')}</h2>
            <div class="post-header">
                <span class="post-author">${escapeHtml(thread.authorName || '名無しさん')}</span>
                <span class="post-id">#${thread.id}</span>
                <span class="post-time">${formatDate(thread.createdAt)}</span>
                ${thread.board ? `<span class="post-board">/${thread.board.slug}/</span>` : ''}
            </div>
            <div class="post-content">
                <p>${escapeHtml(thread.content)}</p>
            </div>
            <div class="post-meta">
                <span class="reply-count">${thread.replyCount || 0} 則回覆</span>
            </div>
        </div>
    `;

    container.innerHTML = html;
};

// Render replies list
const renderReplies = (replies) => {
    const container = document.getElementById('replies-list');

    if (!replies || replies.length === 0) {
        container.innerHTML = '<p class="empty">目前尚無回覆，搶頭香吧～</p>';
        return;
    }

    const repliesHTML = replies.map((reply, index) => `
        <div class="reply-item">
            <div class="reply-header">
                <span class="reply-number">${index + 1}樓</span>
                <span class="reply-author">${escapeHtml(reply.authorName || '名無しさん')}</span>
                <span class="reply-id">#${reply.id}</span>
                <span class="reply-time">${formatDate(reply.createdAt)}</span>
            </div>
            <div class="reply-content">
                <p>${escapeHtml(reply.content)}</p>
            </div>
        </div>
    `).join('');

    container.innerHTML = repliesHTML;
};

// Handle reply form submission
const replyForm = document.getElementById('reply-form');
const replyAuthor = document.getElementById('reply-author');
const replyContent = document.getElementById('reply-content');
const submitBtn = document.getElementById('submit-btn');
const replyMessage = document.getElementById('reply-message');
const charCount = document.querySelector('.char-count');

// Update character count
replyContent.addEventListener('input', () => {
    const length = replyContent.value.length;
    charCount.textContent = `${length} / 10000`;
});

replyForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const authorName = replyAuthor.value.trim();
    const content = replyContent.value.trim();

    if (!content) {
        showMessage('請輸入內容', 'error');
        return;
    }

    // Disable form
    submitBtn.disabled = true;
    submitBtn.textContent = '發送中...';
    replyMessage.textContent = '';

    try {
        const response = await fetch(`${API_BASE}/posts/${threadId}/replies`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                content,
                authorName: authorName || '名無しさん',
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || '回覆失敗');
        }

        // Success
        showMessage('回覆成功！', 'success');
        replyAuthor.value = '';
        replyContent.value = '';
        charCount.textContent = '0 / 10000';

        // Reload thread after 1 second
        setTimeout(() => {
            loadThread();
            replyMessage.textContent = '';
        }, 1000);

    } catch (error) {
        console.error('Error posting reply:', error);
        showMessage(error.message || '回覆失敗，請稍後再試', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = '回覆';
    }
});

// Show message
const showMessage = (text, type = 'info') => {
    replyMessage.textContent = text;
    replyMessage.className = `message ${type}`;
};

// Refresh button
document.getElementById('refresh-btn').addEventListener('click', () => {
    loadThread();
});

// Back button
document.getElementById('back-btn').addEventListener('click', () => {
    const boardSlug = sessionStorage.getItem('currentBoardSlug') || 'chat';
    window.location.href = `/boards/${boardSlug}/threads`;
});

// Initial load
if (!threadId) {
    document.getElementById('thread-op').innerHTML =
        '<p class="error">無效的討論串</p>';
    document.getElementById('replies-list').innerHTML = '';
} else {
    loadThread();
}
