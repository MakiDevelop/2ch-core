// 2ch.tw Board Page Script

// Version for cache busting
const APP_VERSION = '20260117b';

// Get board slug from URL
const getBoardSlug = () => {
    const path = window.location.pathname;
    const match = path.match(/\/boards\/([^\/]+)/);
    return match ? match[1] : null;
};

const boardSlug = getBoardSlug();
const API_BASE = '';

// Sort state management
let currentSort = localStorage.getItem('threadSort') || 'latest';

const setSort = (sort) => {
    currentSort = sort;
    localStorage.setItem('threadSort', sort);
    updateSortButtons();
    loadBoard();
};

const updateSortButtons = () => {
    const hotBtn = document.getElementById('sort-hot');
    const activeBtn = document.getElementById('sort-active');
    const latestBtn = document.getElementById('sort-latest');
    if (hotBtn) hotBtn.classList.toggle('active', currentSort === 'hot');
    if (activeBtn) activeBtn.classList.toggle('active', currentSort === 'active');
    if (latestBtn) latestBtn.classList.toggle('active', currentSort === 'latest');
};

// Board banners mapping
const BOARD_BANNERS = {
    'chat': 'banner-chat',
    'news': 'banner-news',
    'tech': 'banner-tech',
    'work': 'banner-work',
    'love': 'banner-love',
    'money': 'banner-money',
    'acg': 'banner-acg',
    'life': 'banner-life',
    'gossip': 'banner-gossip',
    'meta': 'banner-meta'
};

// Update breadcrumb and banner
const updateBreadcrumbAndBanner = (board) => {
    // Update breadcrumb
    const breadcrumbBoard = document.getElementById('breadcrumb-board');
    if (breadcrumbBoard) {
        breadcrumbBoard.textContent = board.name || '討論版';
    }

    // Update banner
    const bannerContainer = document.querySelector('.board-banner-container');
    const bannerImg = document.getElementById('board-banner');
    const bannerWebp = document.getElementById('banner-webp');

    if (bannerContainer && bannerImg) {
        const bannerName = BOARD_BANNERS[boardSlug];
        if (bannerName) {
            const webpPath = `/images/banners/optimized/${bannerName}.webp`;
            const pngPath = `/images/banners/optimized/${bannerName}.png`;

            if (bannerWebp) {
                bannerWebp.srcset = webpPath;
            }
            bannerImg.src = pngPath;
            bannerImg.alt = `${board.name} Banner`;
            bannerContainer.style.display = 'block';
        } else {
            bannerContainer.style.display = 'none';
        }
    }
};

// Update meta tags for SEO
const updateMetaTags = (board) => {
    const boardName = board.name || '討論版';
    const boardDesc = board.description || '';
    const title = `${boardName} - 2ch.tw`;
    const description = `${boardName} - ${boardDesc} | 2ch.tw 匿名討論版`;
    const url = `https://2ch.tw/boards/${boardSlug}/threads`;

    // Update title
    document.title = title;

    // Update meta description
    const metaDesc = document.getElementById('meta-description');
    if (metaDesc) metaDesc.setAttribute('content', description);

    // Update canonical URL
    const canonical = document.getElementById('canonical-url');
    if (canonical) canonical.setAttribute('href', url);

    // Update Open Graph
    const ogTitle = document.getElementById('og-title');
    const ogDesc = document.getElementById('og-description');
    const ogUrl = document.getElementById('og-url');
    if (ogTitle) ogTitle.setAttribute('content', title);
    if (ogDesc) ogDesc.setAttribute('content', description);
    if (ogUrl) ogUrl.setAttribute('content', url);

    // Update Twitter Card
    const twitterTitle = document.getElementById('twitter-title');
    const twitterDesc = document.getElementById('twitter-description');
    if (twitterTitle) twitterTitle.setAttribute('content', title);
    if (twitterDesc) twitterDesc.setAttribute('content', description);

    // Update structured data
    const structuredData = document.getElementById('structured-data');
    if (structuredData) {
        const data = {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": title,
            "description": description,
            "url": url,
            "isPartOf": {
                "@type": "WebSite",
                "name": "2ch.tw",
                "url": "https://2ch.tw/"
            },
            "publisher": {
                "@type": "Organization",
                "name": "2ch.tw",
                "url": "https://2ch.tw/"
            }
        };
        structuredData.textContent = JSON.stringify(data);
    }
};

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

// Truncate content
const truncate = (text, length = 150) => {
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
};

// Load board info and threads
const loadBoard = async () => {
    // Show loading skeleton
    showLoading();

    try {
        // 使用預載入的資料（如果有的話，但排序需重新載入）
        let data;
        const prefetchSort = window.__prefetchSort;
        if (window.__prefetchData && prefetchSort === currentSort) {
            data = await window.__prefetchData;
            window.__prefetchData = null; // 只用一次
        } else {
            window.__prefetchData = null; // 清除不匹配的預載入資料
            const response = await fetch(`${API_BASE}/boards/${boardSlug}/threads?sort=${currentSort}&v=${APP_VERSION}`, {
                headers: { 'Accept': 'application/json' }
            });
            if (!response.ok) {
                throw new Error('無法載入板塊');
            }
            data = await response.json();
        }

        // Update page title and header
        const pageTitleEl = document.getElementById('page-title');
        const boardNameEl = document.getElementById('board-name');
        const boardDescEl = document.getElementById('board-description');

        if (pageTitleEl) pageTitleEl.textContent = `${data.board.name} - 2ch.tw`;
        if (boardNameEl) boardNameEl.textContent = data.board.name;
        if (boardDescEl) boardDescEl.textContent = data.board.description || '';

        // Update meta tags for SEO
        updateMetaTags(data.board);

        // Update breadcrumb and banner
        updateBreadcrumbAndBanner(data.board);

        // Update sort buttons
        updateSortButtons();

        // Render threads
        renderThreads(data.threads);
    } catch (error) {
        console.error('Error loading board:', error);
        showError('載入失敗');
    }
};

// Show loading skeleton
const showLoading = () => {
    const container = document.getElementById('threads-list');
    if (!container) return;

    // Generate 5 skeleton items
    const skeletonHTML = Array(5).fill(null).map(() => `
        <div class="skeleton-item">
            <div class="skeleton skeleton-title"></div>
            <div class="skeleton-meta">
                <div class="skeleton skeleton-author"></div>
                <div class="skeleton skeleton-time"></div>
                <div class="skeleton skeleton-replies"></div>
            </div>
        </div>
    `).join('');

    container.innerHTML = skeletonHTML;
};

// Show error state
const showError = (message = '載入失敗') => {
    const container = document.getElementById('threads-list');
    if (!container) return;

    container.innerHTML = `
        <div style="padding: 48px 24px; text-align: center;">
            <p style="color: var(--text-secondary, #999); margin-bottom: 16px;">${escapeHtml(message)}</p>
            <button onclick="loadBoard()" style="padding: 10px 20px; background: transparent; color: var(--accent, #5b8ef4); border: 1px solid var(--accent, #5b8ef4); border-radius: 8px; cursor: pointer; font-size: 15px;">重試</button>
        </div>
    `;
};

// Render threads list
const renderThreads = (threads) => {
    const container = document.getElementById('threads-list');
    if (!container) return;

    // Empty state
    if (!threads || threads.length === 0) {
        container.innerHTML = `
            <div style="padding: 80px 24px; text-align: center;">
                <p style="font-size: 17px; color: var(--text-secondary, #999); margin-bottom: 8px;">目前尚無討論串</p>
                <p style="font-size: 14px; color: var(--text-tertiary, #666);">發一篇開始對話吧</p>
            </div>
        `;
        return;
    }

    // Render thread cards
    const threadsHTML = threads.map(thread => `
        <a href="/posts/${thread.id}" class="thread-item" style="display: block; text-decoration: none; color: inherit;">
            <div class="thread-content">
                <h4 class="thread-title">${escapeHtml(thread.title || '無標題')}</h4>
                <div style="display: flex; align-items: center; gap: 8px; margin-top: 8px; font-size: 14px; color: var(--text-secondary, #999);">
                    <span class="thread-author">${escapeHtml(thread.authorName || '名無しさん')}</span>
                    <span>•</span>
                    <span class="thread-time">${formatDate(thread.createdAt)}</span>
                    <span style="margin-left: auto; color: var(--accent, #5b8ef4); font-weight: 500;">${thread.replyCount || 0} 回應</span>
                </div>
            </div>
        </a>
    `).join('');

    container.innerHTML = threadsHTML;
};

// Escape HTML to prevent XSS
const escapeHtml = (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
};

// Handle post form submission
const postForm = document.getElementById('post-form');
const postTitle = document.getElementById('post-title');
const postAuthor = document.getElementById('post-author');
const postContent = document.getElementById('post-content');
const submitBtn = document.getElementById('submit-btn');
const postMessage = document.getElementById('post-message');
const charCount = document.querySelector('.char-count');

// Update character count
if (postContent && charCount) {
    postContent.addEventListener('input', () => {
        const length = postContent.value.length;
        charCount.textContent = `${length} / 10000`;
    });
}

if (postForm) {
    postForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = postTitle.value.trim();
    const authorName = postAuthor.value.trim();
    const content = postContent.value.trim();

    if (!title) {
        showMessage('請輸入標題', 'error');
        return;
    }

    if (!content) {
        showMessage('請輸入內容', 'error');
        return;
    }

    // Disable form
    submitBtn.disabled = true;
    submitBtn.textContent = '發送中...';
    postMessage.textContent = '';

    try {
        const response = await fetch(`${API_BASE}/boards/${boardSlug}/threads`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title,
                content,
                authorName: authorName || '名無しさん',
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || '發文失敗');
        }

        const data = await response.json();

        // Success
        showMessage('發文成功！', 'success');
        postTitle.value = '';
        postAuthor.value = '';
        postContent.value = '';
        charCount.textContent = '0 / 10000';

        // Reload threads after 1 second
        setTimeout(() => {
            loadBoard();
            postMessage.textContent = '';
        }, 1000);

    } catch (error) {
        console.error('Error posting:', error);
        showMessage(error.message || '發文失敗，請稍後再試', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = '發表';
    }
    });
}

// Show message
const showMessage = (text, type = 'info') => {
    if (!postMessage) return;

    postMessage.textContent = text;
    postMessage.className = `message ${type}`;
    postMessage.hidden = false;
};

// Refresh button
const refreshBtn = document.getElementById('refresh-btn');
if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
        loadBoard();
    });
}

// Initial load
if (!boardSlug) {
    showError('無效的板塊');
} else {
    loadBoard();
}
