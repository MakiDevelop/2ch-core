// 2ch.tw Board Page Script

// Version for cache busting
const APP_VERSION = '20260117d';

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

// Pagination state
const PAGE_SIZE = 20;
let currentPage = 1;
let totalItems = 0;

const setSort = (sort) => {
    currentSort = sort;
    localStorage.setItem('threadSort', sort);
    currentPage = 1; // Reset to first page when changing sort
    updateSortButtons();
    loadBoard();
};

// Go to specific page
const goToPage = (page) => {
    const totalPages = Math.ceil(totalItems / PAGE_SIZE);
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    loadBoard();
    // Scroll to top of threads container
    const container = document.querySelector('.threads-container');
    if (container) {
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
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
        // Calculate offset from current page
        const offset = (currentPage - 1) * PAGE_SIZE;

        // 使用預載入的資料（如果有的話，但只限第一頁且排序匹配）
        let data;
        const prefetchSort = window.__prefetchSort;
        if (window.__prefetchData && prefetchSort === currentSort && currentPage === 1) {
            data = await window.__prefetchData;
            window.__prefetchData = null; // 只用一次
        } else {
            window.__prefetchData = null; // 清除不匹配的預載入資料
            const response = await fetch(`${API_BASE}/boards/${boardSlug}/threads?sort=${currentSort}&limit=${PAGE_SIZE}&offset=${offset}&v=${APP_VERSION}`, {
                headers: { 'Accept': 'application/json' }
            });
            if (!response.ok) {
                throw new Error('無法載入板塊');
            }
            data = await response.json();
        }

        // Update total items from pagination data
        if (data.pagination) {
            totalItems = data.pagination.total || 0;
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

        // Render pagination
        renderPagination();
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

    // Clear pagination while loading
    const paginationContainer = document.getElementById('pagination');
    if (paginationContainer) {
        paginationContainer.innerHTML = '';
    }
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

// Render pagination controls
const renderPagination = () => {
    let paginationContainer = document.getElementById('pagination');

    // Create pagination container if it doesn't exist
    if (!paginationContainer) {
        const threadsContainer = document.querySelector('.threads-container');
        if (!threadsContainer) return;

        paginationContainer = document.createElement('div');
        paginationContainer.id = 'pagination';
        paginationContainer.className = 'pagination';
        threadsContainer.appendChild(paginationContainer);
    }

    const totalPages = Math.ceil(totalItems / PAGE_SIZE);

    // Don't show pagination if only one page or no items
    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }

    let html = '';

    // Previous button
    html += `<button class="pagination-btn" onclick="goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>‹</button>`;

    // Page numbers with ellipsis logic
    const pages = generatePageNumbers(currentPage, totalPages);

    pages.forEach((page, index) => {
        if (page === '...') {
            html += `<span class="pagination-ellipsis">...</span>`;
        } else {
            html += `<button class="pagination-btn ${page === currentPage ? 'active' : ''}" onclick="goToPage(${page})">${page}</button>`;
        }
    });

    // Next button
    html += `<button class="pagination-btn" onclick="goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>›</button>`;

    // Page info
    const startItem = (currentPage - 1) * PAGE_SIZE + 1;
    const endItem = Math.min(currentPage * PAGE_SIZE, totalItems);
    html += `<span class="pagination-info">${startItem}-${endItem} / ${totalItems}</span>`;

    paginationContainer.innerHTML = html;
};

// Generate page numbers with ellipsis
const generatePageNumbers = (current, total) => {
    const pages = [];
    const delta = 2; // Number of pages to show on each side of current

    if (total <= 7) {
        // Show all pages if total is small
        for (let i = 1; i <= total; i++) {
            pages.push(i);
        }
    } else {
        // Always show first page
        pages.push(1);

        // Calculate start and end of middle section
        let start = Math.max(2, current - delta);
        let end = Math.min(total - 1, current + delta);

        // Adjust if at the beginning
        if (current <= delta + 2) {
            end = Math.min(total - 1, delta * 2 + 2);
        }

        // Adjust if at the end
        if (current >= total - delta - 1) {
            start = Math.max(2, total - delta * 2 - 1);
        }

        // Add ellipsis before middle section if needed
        if (start > 2) {
            pages.push('...');
        }

        // Add middle section
        for (let i = start; i <= end; i++) {
            pages.push(i);
        }

        // Add ellipsis after middle section if needed
        if (end < total - 1) {
            pages.push('...');
        }

        // Always show last page
        pages.push(total);
    }

    return pages;
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

// Prevent duplicate submissions
let isSubmitting = false;

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

    // Prevent duplicate submissions
    if (isSubmitting) return;

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

    // Lock submission
    isSubmitting = true;
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

        // Reset to first page and reload
        currentPage = 1;
        setTimeout(() => {
            loadBoard();
            postMessage.textContent = '';
        }, 1000);

    } catch (error) {
        console.error('Error posting:', error);
        showMessage(error.message || '發文失敗，請稍後再試', 'error');
    } finally {
        isSubmitting = false;
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
