// 2ch.tw Thread Detail Page Script

// Version for cache busting
const APP_VERSION = '20260305';

// Edit token auto-save (localStorage)
const EditTokenStore = {
    KEY: '2ch_edit_tokens',
    TTL: 10 * 60 * 1000, // 10 minutes

    save(postId, token) {
        try {
            const store = JSON.parse(localStorage.getItem(this.KEY) || '{}');
            store[postId] = { token, savedAt: Date.now() };
            // Purge expired entries
            for (const [id, entry] of Object.entries(store)) {
                if (Date.now() - entry.savedAt > this.TTL) delete store[id];
            }
            localStorage.setItem(this.KEY, JSON.stringify(store));
        } catch (e) { /* ignore */ }
    },

    get(postId) {
        try {
            const store = JSON.parse(localStorage.getItem(this.KEY) || '{}');
            const entry = store[postId];
            if (!entry) return null;
            if (Date.now() - entry.savedAt > this.TTL) return null;
            return entry.token;
        } catch (e) { return null; }
    }
};

// Copy share link to clipboard
const copyShareLink = (postId, floor = null) => {
    const baseUrl = window.location.origin;
    let url;
    if (floor) {
        // Reply: link to thread with floor anchor
        url = `${baseUrl}/posts/${threadId}#reply-${floor}`;
    } else {
        // Thread OP: link directly to thread
        url = `${baseUrl}/posts/${postId}`;
    }

    navigator.clipboard.writeText(url).then(() => {
        // Show feedback
        showCopyFeedback();
    }).catch(err => {
        console.error('Failed to copy:', err);
        // Fallback: select text
        prompt('複製此連結:', url);
    });
};

// Show copy feedback toast
const showCopyFeedback = () => {
    // Remove existing toast if any
    const existing = document.querySelector('.copy-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'copy-toast';
    toast.textContent = '已複製分享連結';
    document.body.appendChild(toast);

    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);

    // Remove after animation
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 2000);
};

// Get thread ID from URL
const getThreadId = () => {
    const path = window.location.pathname;
    const match = path.match(/\/posts\/(\d+)/);
    return match ? match[1] : null;
};

const threadId = getThreadId();
const API_BASE = '';

// Update meta tags for SEO
const updateMetaTags = (thread, replyCount = 0) => {
    const title = thread.title || '討論串';
    const contentPreview = (thread.content || '').substring(0, 150).replace(/\s+/g, ' ');
    const pageTitle = `${title} - 2ch.tw`;
    const description = contentPreview || `${title} - 2ch.tw 匿名討論`;
    const url = `https://2ch.tw/posts/${thread.id}`;
    const boardName = thread.board?.name || '討論版';

    // Update title
    document.title = pageTitle;

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
    const ogPublished = document.getElementById('og-published');
    const ogSection = document.getElementById('og-section');
    if (ogTitle) ogTitle.setAttribute('content', pageTitle);
    if (ogDesc) ogDesc.setAttribute('content', description);
    if (ogUrl) ogUrl.setAttribute('content', url);
    if (ogPublished && thread.createdAt) ogPublished.setAttribute('content', thread.createdAt);
    if (ogSection) ogSection.setAttribute('content', boardName);

    // Update Twitter Card
    const twitterTitle = document.getElementById('twitter-title');
    const twitterDesc = document.getElementById('twitter-description');
    if (twitterTitle) twitterTitle.setAttribute('content', pageTitle);
    if (twitterDesc) twitterDesc.setAttribute('content', description);

    // Update structured data
    const structuredData = document.getElementById('structured-data');
    if (structuredData) {
        const data = {
            "@context": "https://schema.org",
            "@type": "DiscussionForumPosting",
            "headline": title,
            "text": contentPreview,
            "url": url,
            "datePublished": thread.createdAt ? new Date(thread.createdAt).toISOString() : new Date().toISOString(),
            "author": {
                "@type": "Person",
                "name": thread.authorName || "匿名",
                "url": url
            },
            "publisher": {
                "@type": "Organization",
                "name": "2ch.tw",
                "url": "https://2ch.tw/"
            },
            "interactionStatistic": {
                "@type": "InteractionCounter",
                "interactionType": "https://schema.org/CommentAction",
                "userInteractionCount": replyCount
            },
            "comment": []
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

// Escape HTML to prevent XSS
const escapeHtml = (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
};

// Show edit token modal after successful reply
const showEditTokenModal = (editToken, onClose) => {
    const overlay = document.createElement('div');
    overlay.className = 'edit-token-modal-overlay';

    overlay.innerHTML = `
        <div class="edit-token-modal">
            <h3>回覆成功！請保存編輯密碼</h3>
            <div class="edit-token-display">
                <span class="edit-token-code">${escapeHtml(editToken)}</span>
            </div>
            <div class="edit-token-warning">
                此密碼只會顯示一次，關閉後無法再次查看。<br>
                在發文後 10 分鐘內可使用此密碼編輯內容。
            </div>
            <div class="edit-token-actions">
                <button class="copy-token-btn">複製密碼</button>
                <button class="close-modal-btn">我已保存，關閉</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    const copyBtn = overlay.querySelector('.copy-token-btn');
    copyBtn.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(editToken);
            copyBtn.textContent = '已複製！';
            setTimeout(() => copyBtn.textContent = '複製密碼', 2000);
        } catch (err) {
            prompt('請手動複製：', editToken);
        }
    });

    const closeBtn = overlay.querySelector('.close-modal-btn');
    closeBtn.addEventListener('click', () => {
        overlay.remove();
        if (onClose) onClose();
    });

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            if (confirm('確定要關閉嗎？編輯密碼將無法再次查看。')) {
                overlay.remove();
                if (onClose) onClose();
            }
        }
    });
};

// Show report modal
const showReportModal = (postId) => {
    const overlay = document.createElement('div');
    overlay.className = 'report-modal-overlay';

    overlay.innerHTML = `
        <div class="report-modal">
            <h3>檢舉貼文</h3>
            <p class="report-hint">請選擇檢舉原因：</p>
            <div class="report-categories">
                <label><input type="radio" name="report-category" value="hate_speech"> 仇恨言論 / 歧視</label>
                <label><input type="radio" name="report-category" value="spam"> 廣告 / 詐騙</label>
                <label><input type="radio" name="report-category" value="nsfw"> 不當內容</label>
                <label><input type="radio" name="report-category" value="personal_attack"> 人身攻擊</label>
                <label><input type="radio" name="report-category" value="illegal"> 違法內容</label>
                <label><input type="radio" name="report-category" value="other"> 其他</label>
            </div>
            <label for="report-text">補充說明（選填）</label>
            <textarea id="report-text" placeholder="請簡述檢舉原因..." maxlength="500"></textarea>
            <div class="report-error" style="display: none;"></div>
            <div class="report-actions">
                <button class="cancel-report-btn">取消</button>
                <button class="submit-report-btn">送出檢舉</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    const errorDiv = overlay.querySelector('.report-error');
    const submitBtn = overlay.querySelector('.submit-report-btn');
    const cancelBtn = overlay.querySelector('.cancel-report-btn');

    // Cancel button
    cancelBtn.addEventListener('click', () => overlay.remove());

    // Click outside to close
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
    });

    // Submit button
    submitBtn.addEventListener('click', async () => {
        const categoryInput = overlay.querySelector('input[name="report-category"]:checked');
        const textInput = overlay.querySelector('#report-text');

        if (!categoryInput) {
            errorDiv.textContent = '請選擇檢舉原因';
            errorDiv.style.display = 'block';
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = '送出中...';
        errorDiv.style.display = 'none';

        try {
            const response = await fetch(`${API_BASE}/posts/${postId}/report`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    category: categoryInput.value,
                    text: textInput.value.trim() || undefined,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || '檢舉失敗');
            }

            // Success - show message and close
            overlay.querySelector('.report-modal').innerHTML = `
                <div class="report-success">
                    <h3>✓ 檢舉已送出</h3>
                    <p>感謝您的回報，我們會盡快處理。</p>
                    <button class="close-report-btn">關閉</button>
                </div>
            `;
            overlay.querySelector('.close-report-btn').addEventListener('click', () => overlay.remove());

        } catch (err) {
            errorDiv.textContent = err.message;
            errorDiv.style.display = 'block';
            submitBtn.disabled = false;
            submitBtn.textContent = '送出檢舉';
        }
    });
};

// Show edit post modal
const showEditPostModal = (postId, currentContent, onSuccess) => {
    const savedToken = EditTokenStore.get(postId);
    const overlay = document.createElement('div');
    overlay.className = 'edit-post-modal-overlay';

    // Build modal content safely
    const modal = document.createElement('div');
    modal.className = 'edit-post-modal';

    const title = document.createElement('h3');
    title.textContent = '編輯貼文';
    modal.appendChild(title);

    let tokenInput = null;
    if (!savedToken) {
        const tokenLabel = document.createElement('label');
        tokenLabel.setAttribute('for', 'edit-token-input');
        tokenLabel.textContent = '編輯密碼';
        modal.appendChild(tokenLabel);

        tokenInput = document.createElement('input');
        tokenInput.type = 'text';
        tokenInput.id = 'edit-token-input';
        tokenInput.placeholder = '請輸入 8 位編輯密碼';
        tokenInput.maxLength = 8;
        modal.appendChild(tokenInput);
    }

    const contentLabel = document.createElement('label');
    contentLabel.setAttribute('for', 'edit-content-input');
    contentLabel.textContent = '內容';
    modal.appendChild(contentLabel);

    const contentInput = document.createElement('textarea');
    contentInput.id = 'edit-content-input';
    contentInput.textContent = currentContent;
    modal.appendChild(contentInput);

    const errorDiv = document.createElement('div');
    errorDiv.className = 'edit-post-error';
    errorDiv.style.display = 'none';
    modal.appendChild(errorDiv);

    const actions = document.createElement('div');
    actions.className = 'edit-post-actions';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'cancel-edit-btn';
    cancelBtn.textContent = '取消';
    actions.appendChild(cancelBtn);

    const saveBtn = document.createElement('button');
    saveBtn.className = 'save-edit-btn';
    saveBtn.textContent = '儲存';
    actions.appendChild(saveBtn);

    modal.appendChild(actions);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Cancel button
    cancelBtn.addEventListener('click', () => overlay.remove());

    // Click outside to close
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
    });

    // Save button
    saveBtn.addEventListener('click', async () => {
        const editToken = savedToken || (tokenInput ? tokenInput.value.trim() : '');
        const content = contentInput.value.trim();

        if (!editToken) {
            errorDiv.textContent = '請輸入編輯密碼';
            errorDiv.style.display = 'block';
            return;
        }

        if (!content) {
            errorDiv.textContent = '內容不能為空';
            errorDiv.style.display = 'block';
            return;
        }

        saveBtn.disabled = true;
        saveBtn.textContent = '儲存中...';
        errorDiv.style.display = 'none';

        try {
            const response = await fetch(`${API_BASE}/posts/${postId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ editToken, content }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || '編輯失敗');
            }

            overlay.remove();
            if (onSuccess) onSuccess();
        } catch (err) {
            errorDiv.textContent = err.message;
            errorDiv.style.display = 'block';
            saveBtn.disabled = false;
            saveBtn.textContent = '儲存';
        }
    });

    // Focus on content if token is auto-filled, otherwise on token input
    if (savedToken) {
        contentInput.focus();
    } else if (tokenInput) {
        tokenInput.focus();
    }
};

// Format edited time
// Only show if post is still within 10-minute edit window (based on createdAt)
const formatEditedTime = (editedAt, createdAt) => {
    if (!editedAt) return '';

    // If we have createdAt, check if post is older than 10 minutes
    // If so, hide the edited badge since edit window has expired
    if (createdAt) {
        const created = new Date(createdAt);
        const now = new Date();
        const minutesSinceCreation = (now - created) / 60000;
        if (minutesSinceCreation > 10) {
            return ''; // Hide badge after edit window expires
        }
    }

    const date = new Date(editedAt);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    let timeStr;
    if (days > 0) timeStr = `${days}天前`;
    else if (hours > 0) timeStr = `${hours}小時前`;
    else if (minutes > 0) timeStr = `${minutes}分鐘前`;
    else timeStr = '剛剛';

    return `<span class="edited-badge">(已編輯 · ${timeStr})</span>`;
};

// Parse custom syntax: <yt>, <iu>, <code>
const parseContent = (text) => {
    if (!text) return '';

    // Step 1: Extract and protect <code> blocks
    const codeBlocks = [];
    let content = text.replace(/<code>([\s\S]*?)<\/code>/gi, (match, code) => {
        const index = codeBlocks.length;
        codeBlocks.push(code);
        return `__CODE_BLOCK_${index}__`;
    });

    // Step 2: Escape HTML for safety
    content = escapeHtml(content);

    // Step 3: Parse <yt> tags (max 1)
    let ytCount = 0;
    content = content.replace(/&lt;yt&gt;(.*?)&lt;\/yt&gt;/gi, (match, url) => {
        if (ytCount >= 1) return escapeHtml(`<yt>${url}</yt>`);

        // URL was already escaped, need to unescape first
        const unescapedUrl = url.trim()
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#039;/g, "'");

        // Extract YouTube video ID
        const videoId = extractYouTubeId(unescapedUrl);
        if (!videoId) return escapeHtml(`<yt>${unescapedUrl}</yt>`);

        ytCount++;
        return `<div class="embed-youtube"><iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
    });

    // Step 4: Parse <iu> tags (max 3)
    let iuCount = 0;
    content = content.replace(/&lt;iu&gt;(.*?)&lt;\/iu&gt;/gi, (match, url) => {
        if (iuCount >= 3) return escapeHtml(`<iu>${url}</iu>`);

        // URL was already escaped, need to unescape first
        const unescapedUrl = url.trim()
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#039;/g, "'");

        // Validate URL: must be https
        if (!unescapedUrl.startsWith('https://')) return escapeHtml(`<iu>${unescapedUrl}</iu>`);

        iuCount++;

        // Check if URL looks like a direct image (has image extension)
        if (/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(unescapedUrl)) {
            // Try to load as image, fallback to link on error
            // Use encodeURI for safe URL in attributes
            const encodedUrl = encodeURI(unescapedUrl);
            return `<div class="embed-image"><img src="${encodedUrl}" alt="使用者圖片" loading="lazy" onerror="this.onerror=null;this.parentElement.innerHTML='<a href=\\'${encodedUrl}\\' target=\\'_blank\\' rel=\\'noopener\\' class=\\'image-fallback-link\\'>🔗 開啟圖片</a>'"></div>`;
        } else {
            // URL doesn't look like direct image, show as link directly
            const encodedUrl = encodeURI(unescapedUrl);
            return `<div class="embed-image"><a href="${encodedUrl}" target="_blank" rel="noopener" class="image-fallback-link">🔗 開啟圖片連結</a></div>`;
        }
    });

    // Step 5: Restore <code> blocks
    codeBlocks.forEach((code, index) => {
        content = content.replace(`__CODE_BLOCK_${index}__`, `<pre class="code-block"><code>${escapeHtml(code)}</code></pre>`);
    });

    // Step 6: Auto-link plain URLs (not already in tags)
    // Match URLs preceded by start, whitespace, or > (not inside href="..." or src="...")
    content = content.replace(/(^|[\s>])(https?:\/\/[^\s<>"']+)/gi, (match, prefix, url) => {
        return `${prefix}<a href="${url}" target="_blank" rel="noopener nofollow">${url}</a>`;
    });

    // Step 7: Parse >>N reply references (after HTML escape, so it's &gt;&gt;)
    content = content.replace(/&gt;&gt;(\d+)/g, (match, num) => {
        return `<a href="#reply-${num}" class="reply-ref" data-floor="${num}">&gt;&gt;${num}</a>`;
    });

    // Convert newlines to <br>
    content = content.replace(/\n/g, '<br>');

    // Convert literal \n strings to <br> (for seed data with escaped newlines)
    content = content.replace(/\\n/g, '<br>');

    // Sanitize with DOMPurify to prevent XSS
    return DOMPurify.sanitize(content, {
        ALLOWED_TAGS: ['br', 'div', 'pre', 'code', 'iframe', 'img', 'a'],
        ALLOWED_ATTR: ['src', 'href', 'class', 'alt', 'target', 'rel', 'loading', 'width', 'height', 'frameborder', 'allow', 'allowfullscreen'],
        ALLOW_DATA_ATTR: false
    });
};

// Extract YouTube video ID from various URL formats
const extractYouTubeId = (url) => {
    if (!url) return null;
    const trimmed = url.trim();

    // Format: https://www.youtube.com/watch?v=VIDEO_ID or https://youtube.com/watch?v=VIDEO_ID
    const watchMatch = trimmed.match(/(?:youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})/);
    if (watchMatch) return watchMatch[1];

    // Format: https://youtu.be/VIDEO_ID
    const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (shortMatch) return shortMatch[1];

    // Format: https://www.youtube.com/embed/VIDEO_ID
    const embedMatch = trimmed.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
    if (embedMatch) return embedMatch[1];

    // Format: https://youtube.com/shorts/VIDEO_ID (YouTube Shorts)
    const shortsMatch = trimmed.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
    if (shortsMatch) return shortsMatch[1];

    return null;
};

// Render link preview card
const renderLinkPreview = (linkPreview) => {
    if (!linkPreview || !linkPreview.title) return '';

    const title = escapeHtml(linkPreview.title);
    const description = linkPreview.description ? escapeHtml(linkPreview.description) : '';
    const siteName = linkPreview.siteName ? escapeHtml(linkPreview.siteName) : new URL(linkPreview.url).hostname;
    const imageHtml = linkPreview.image
        ? `<img class="link-preview-image" src="${encodeURI(linkPreview.image)}" alt="" loading="lazy" onerror="this.style.display='none'">`
        : '';

    return `
        <a href="${encodeURI(linkPreview.url)}" target="_blank" rel="noopener nofollow" class="link-preview">
            ${imageHtml}
            <div class="link-preview-content">
                <div class="link-preview-title">${title}</div>
                ${description ? `<div class="link-preview-description">${description}</div>` : ''}
                <div class="link-preview-site">${siteName}</div>
            </div>
        </a>
    `;
};

// Render reaction buttons (push/boo)
const renderReactionButtons = (postId, reactions) => {
    if (!reactions) reactions = { pushCount: 0, booCount: 0 };
    return `
        <span class="reaction-buttons" data-post-id="${postId}">
            <button class="reaction-btn push-btn" data-post-id="${postId}" data-type="push" title="推">
                <span class="reaction-icon">&#9650;</span>
                <span class="reaction-count">${reactions.pushCount || 0}</span>
            </button>
            <button class="reaction-btn boo-btn" data-post-id="${postId}" data-type="boo" title="噓">
                <span class="reaction-icon">&#9660;</span>
                <span class="reaction-count">${reactions.booCount || 0}</span>
            </button>
        </span>
    `;
};

// Handle reaction click
const handleReaction = async (postId, type) => {
    try {
        const response = await fetch(`${API_BASE}/posts/${postId}/react`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type }),
        });

        if (!response.ok) {
            const err = await response.json();
            console.error('Reaction failed:', err.error);
            return;
        }

        const data = await response.json();

        // Update button counts in DOM
        const container = document.querySelector(`.reaction-buttons[data-post-id="${postId}"]`);
        if (container) {
            const pushCount = container.querySelector('.push-btn .reaction-count');
            const booCount = container.querySelector('.boo-btn .reaction-count');
            if (pushCount) pushCount.textContent = data.counts.pushCount;
            if (booCount) booCount.textContent = data.counts.booCount;

            // Toggle active state
            const pushBtn = container.querySelector('.push-btn');
            const booBtn = container.querySelector('.boo-btn');
            pushBtn.classList.toggle('active', data.counts.userReaction === 'push');
            booBtn.classList.toggle('active', data.counts.userReaction === 'boo');
        }
    } catch (err) {
        console.error('Reaction error:', err);
    }
};

// Delegate reaction clicks (works for dynamically rendered content)
document.addEventListener('click', (e) => {
    const btn = e.target.closest('.reaction-btn');
    if (!btn) return;
    const postId = btn.dataset.postId;
    const type = btn.dataset.type;
    if (postId && type) handleReaction(postId, type);
});

// Load thread and replies
const loadThread = async () => {
    try {
        // 使用預載入的資料（如果有的話）
        let threadData, repliesData;

        if (window.__prefetchThread) {
            threadData = await window.__prefetchThread;
            window.__prefetchThread = null;
        } else {
            const threadResponse = await fetch(`${API_BASE}/posts/${threadId}?v=${APP_VERSION}`, {
                headers: { 'Accept': 'application/json' }
            });
            if (!threadResponse.ok) {
                throw new Error('無法載入討論串');
            }
            threadData = await threadResponse.json();
        }

        // Render OP first
        renderOP(threadData);

        // 已刪除的主帖：隱藏回覆區域和回覆表單
        if (threadData.status === 2) {
            document.getElementById('replies-list').innerHTML = '';
            const replyForm = document.getElementById('reply-form');
            if (replyForm) replyForm.style.display = 'none';
            const repliesSection = document.querySelector('.replies-section');
            if (repliesSection) repliesSection.style.display = 'none';
            return;
        }

        // Load replies (使用預載入或重新請求)
        if (window.__prefetchReplies) {
            repliesData = await window.__prefetchReplies;
            window.__prefetchReplies = null;
        } else {
            const repliesResponse = await fetch(`${API_BASE}/posts/${threadId}/replies?v=${APP_VERSION}`, {
                headers: { 'Accept': 'application/json' }
            });
            if (!repliesResponse.ok) {
                throw new Error('無法載入回覆');
            }
            repliesData = await repliesResponse.json();
        }

        // Render replies
        renderReplies(repliesData.replies);

        // Update meta tags for SEO (after we have reply count)
        const replyCount = repliesData.replies?.length || 0;
        updateMetaTags(threadData, replyCount);

        // Update bookmark's lastSeen (if bookmarked)
        if (typeof Bookmarks !== 'undefined' && Bookmarks.has(threadData.id)) {
            Bookmarks.updateLastSeen(threadData.id, replyCount);
            if (typeof updateBookmarkBadge === 'function') {
                updateBookmarkBadge();
            }
        }

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

    const isArchived = thread.replyCount >= 999;
    const isDeleted = thread.status === 2;

    // 已刪除的帖子：只顯示刪除通知，隱藏所有原始內容
    if (isDeleted) {
        const html = `
            <div class="op-post deleted">
                <div class="deleted-notice">
                    <h2>此討論串已被刪除</h2>
                    <p class="delete-reason">刪除原因：${escapeHtml(thread.deletedReason || '違反版規')}</p>
                </div>
            </div>
        `;
        container.innerHTML = html;
        return;
    }

    const archivedBadge = isArchived ? '<span class="archived-badge">已封存</span>' : '';

    const html = `
        <div class="op-post${isArchived ? ' archived' : ''}">
            <h2 class="thread-title">
                <span class="title-text">${escapeHtml(thread.title || '無標題')}</span>
                ${archivedBadge}
                <span id="bookmark-btn-container"></span>
            </h2>
            <div class="post-header">
                <span class="post-author">${escapeHtml(thread.authorName || '名無しさん')}</span>
                ${thread.dailyId ? `<span class="daily-id">ID:${thread.dailyId}</span>` : ''}
                <span class="post-id share-id" data-post-id="${thread.id}" title="點擊複製分享連結">#${thread.id}</span>
                <span class="post-time">${formatDate(thread.createdAt)}</span>
                ${thread.board ? `<span class="post-board">/${thread.board.slug}/</span>` : ''}
            </div>
            <div class="post-content">
                ${parseContent(thread.content)}
                ${renderLinkPreview(thread.linkPreview)}
            </div>
            <div class="post-meta">
                <span class="reply-count">${thread.replyCount || 0} 則回覆</span>
                ${renderReactionButtons(thread.id, thread.reactions)}
                ${isArchived ? '<span class="archived-notice">此討論串已達 999 樓上限，已封存無法回覆</span>' : ''}
                <button class="report-post-btn op-report-btn" data-post-id="${thread.id}" title="檢舉此貼文">檢舉</button>
            </div>
        </div>
    `;

    container.innerHTML = html;

    // Add click handler for share ID
    const shareId = container.querySelector('.share-id');
    if (shareId) {
        shareId.addEventListener('click', () => {
            copyShareLink(shareId.dataset.postId);
        });
    }

    // Add bookmark button (if bookmark.js is loaded)
    if (typeof createBookmarkButton === 'function') {
        const bookmarkContainer = container.querySelector('#bookmark-btn-container');
        if (bookmarkContainer) {
            const bookmarkBtn = createBookmarkButton(
                thread.id,
                thread.title || '無標題',
                thread.board?.slug || '',
                thread.replyCount || 0
            );
            bookmarkContainer.appendChild(bookmarkBtn);
        }
    }

    // Add click handler for OP report button
    const opReportBtn = container.querySelector('.op-report-btn');
    if (opReportBtn) {
        opReportBtn.addEventListener('click', () => {
            showReportModal(opReportBtn.dataset.postId);
        });
    }

    // Hide or show reply form based on archived status
    const replyFormContainer = document.querySelector('.reply-form-container');
    if (replyFormContainer) {
        if (isArchived) {
            replyFormContainer.style.display = 'none';
        } else {
            replyFormContainer.style.display = '';
        }
    }
};

// Render replies list
const renderReplies = (replies) => {
    const container = document.getElementById('replies-list');

    if (!replies || replies.length === 0) {
        container.innerHTML = '<p class="empty">目前尚無回覆，搶頭香吧～</p>';
        return;
    }

    // Map with original index first, then reverse for newest-first display
    const repliesWithIndex = replies.map((reply, index) => ({ reply, floor: index + 1 }));
    const reversedReplies = [...repliesWithIndex].reverse();

    const repliesHTML = reversedReplies.map(({ reply, floor }) => {
        const isDeleted = reply.status === 2;

        // 已刪除的回覆：只顯示樓層和刪除原因
        if (isDeleted) {
            return `
            <div class="reply-item deleted" id="reply-${floor}">
                <div class="reply-header">
                    <span class="reply-number" data-floor="${floor}">${floor}樓</span>
                    <span class="deleted-badge">已刪除</span>
                </div>
                <div class="reply-content">
                    <div class="deleted-notice">
                        <p>此回覆已被刪除</p>
                        <p class="delete-reason">刪除原因：${escapeHtml(reply.deletedReason || '違反版規')}</p>
                    </div>
                </div>
            </div>
            `;
        }

        return `
        <div class="reply-item" id="reply-${floor}" data-content="${escapeHtml(reply.content)}">
            <div class="reply-header">
                <span class="reply-number" data-floor="${floor}">${floor}樓</span>
                <span class="reply-author">${escapeHtml(reply.authorName || '名無しさん')}</span>
                ${reply.dailyId ? `<span class="daily-id">ID:${reply.dailyId}</span>` : ''}
                <span class="reply-id share-id" data-post-id="${reply.id}" data-floor="${floor}" title="點擊複製分享連結">#${reply.id}</span>
                <span class="reply-time">${formatDate(reply.createdAt)}</span>
                ${formatEditedTime(reply.editedAt, reply.createdAt)}
                <button class="edit-post-btn" data-post-id="${reply.id}" title="編輯此回覆">編輯</button>
                <button class="report-post-btn" data-post-id="${reply.id}" title="檢舉此回覆">檢舉</button>
            </div>
            <div class="reply-content">
                ${parseContent(reply.content)}
                ${renderLinkPreview(reply.linkPreview)}
            </div>
            <div class="reply-meta">
                ${renderReactionButtons(reply.id, reply.reactions)}
            </div>
        </div>
    `}).join('');

    container.innerHTML = repliesHTML;

    // Add click handlers for reply numbers to insert >>N
    container.querySelectorAll('.reply-number').forEach(el => {
        el.style.cursor = 'pointer';
        el.addEventListener('click', () => {
            const floor = el.dataset.floor;
            const textarea = document.getElementById('reply-content');
            const text = `>>${floor} `;
            // Insert at cursor position or append
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const value = textarea.value;
            textarea.value = value.substring(0, start) + text + value.substring(end);
            textarea.focus();
            textarea.selectionStart = textarea.selectionEnd = start + text.length;
            // Update char count
            const charCount = document.querySelector('.char-count');
            if (charCount) charCount.textContent = `${textarea.value.length} / 10000`;
        });
    });

    // Add click handlers for reply references to scroll smoothly
    container.querySelectorAll('.reply-ref').forEach(el => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            const floor = el.dataset.floor;
            const target = document.getElementById(`reply-${floor}`);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Highlight briefly
                target.style.transition = 'background 0.3s';
                target.style.background = 'var(--warning-bg)';
                setTimeout(() => {
                    target.style.background = '';
                }, 1500);
            }
        });
    });

    // Add click handlers for share IDs to copy link
    container.querySelectorAll('.share-id').forEach(el => {
        el.addEventListener('click', () => {
            const floor = el.dataset.floor;
            copyShareLink(el.dataset.postId, floor);
        });
    });

    // Add click handlers for edit buttons
    container.querySelectorAll('.edit-post-btn').forEach(el => {
        el.addEventListener('click', () => {
            const postId = el.dataset.postId;
            const replyItem = el.closest('.reply-item');
            const currentContent = replyItem.dataset.content || '';
            showEditPostModal(postId, currentContent, () => {
                loadThread(); // Reload to show updated content
            });
        });
    });

    // Add click handlers for report buttons
    container.querySelectorAll('.report-post-btn').forEach(el => {
        el.addEventListener('click', () => {
            const postId = el.dataset.postId;
            showReportModal(postId);
        });
    });
};

// Handle reply form submission
const replyForm = document.getElementById('reply-form');
const replyAuthor = document.getElementById('reply-author');
const replyContent = document.getElementById('reply-content');
const submitBtn = document.getElementById('submit-btn');
const replyMessage = document.getElementById('reply-message');
const charCount = document.querySelector('.char-count');

// Prevent duplicate submissions
let isSubmitting = false;

// Update character count
replyContent.addEventListener('input', () => {
    const length = replyContent.value.length;
    charCount.textContent = `${length} / 10000`;
});

replyForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Prevent duplicate submissions
    if (isSubmitting) return;

    const authorName = replyAuthor.value.trim();
    const content = replyContent.value.trim();

    if (!content) {
        showMessage('請輸入內容', 'error');
        return;
    }

    // Lock submission
    isSubmitting = true;
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

        const data = await response.json();

        // Clear form
        replyAuthor.value = '';
        replyContent.value = '';
        charCount.textContent = '0 / 10000';

        // Auto-save edit token and show simple success message
        if (data.editToken && data.id) {
            EditTokenStore.save(data.id, data.editToken);
        }

        // 自動收藏：回覆過的串自動加入收藏（方便追蹤後續回覆）
        if (typeof Bookmarks !== 'undefined' && !Bookmarks.has(parseInt(threadId))) {
            const threadEl = document.querySelector('.thread-title .title-text');
            const boardEl = document.querySelector('.post-board');
            const threadTitle = threadEl ? threadEl.textContent : '討論串';
            const boardSlug = boardEl ? boardEl.textContent.replace(/\//g, '') : '';
            Bookmarks.add(parseInt(threadId), threadTitle, boardSlug, 0);
            if (typeof updateBookmarkBadge === 'function') updateBookmarkBadge();
        }

        showMessage('回覆成功！已自動收藏此討論串，有新回覆時會通知你。', 'success');
        setTimeout(() => {
            loadThread();
            replyMessage.textContent = '';
        }, 1500);

    } catch (error) {
        console.error('Error posting reply:', error);
        // Show error with report option
        showErrorWithReport(
            error.message || '回覆失敗，請稍後再試',
            { content, authorName: authorName || '名無しさん', threadId }
        );
    } finally {
        isSubmitting = false;
        submitBtn.disabled = false;
        submitBtn.textContent = '回覆';
    }
});

// Show message
const showMessage = (text, type = 'info') => {
    replyMessage.textContent = text;
    replyMessage.className = `message ${type}`;
};

// Error reporting - save to localStorage first, then try to send to backend
// This ensures errors are captured even if the backend is broken
const ErrorReporter = {
    STORAGE_KEY: '2ch_error_reports',

    saveLocal: function(report) {
        try {
            const reports = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
            reports.push({
                ...report,
                id: Date.now(),
                savedAt: new Date().toISOString(),
            });
            if (reports.length > 20) reports.shift();
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(reports));
            return true;
        } catch (e) {
            console.error('Failed to save error report locally:', e);
            return false;
        }
    },

    sendToBackend: async function(report) {
        try {
            const response = await fetch('/error-reports', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(report),
            });
            return response.ok;
        } catch (e) {
            console.error('Failed to send error report to backend:', e);
            return false;
        }
    },

    report: async function(report) {
        const savedLocally = this.saveLocal(report);
        const sentToBackend = await this.sendToBackend(report);
        return { savedLocally, sentToBackend };
    },
};

// Show error with report option
const showErrorWithReport = (errorMsg, requestBody = null) => {
    replyMessage.innerHTML = `
        ${escapeHtml(errorMsg)}
        <button class="error-report-link">回報問題</button>
    `;
    replyMessage.className = 'message error';
    replyMessage.querySelector('.error-report-link').addEventListener('click', function() {
        showErrorReportModal(errorMsg, requestBody ? btoa(encodeURIComponent(JSON.stringify(requestBody))) : null);
    });
};

// Show error report modal
const showErrorReportModal = (errorMsg, encodedBody = null) => {
    const requestBody = encodedBody ? JSON.parse(decodeURIComponent(atob(encodedBody))) : null;

    const overlay = document.createElement('div');
    overlay.className = 'error-report-modal-overlay';

    overlay.innerHTML = `
        <div class="error-report-modal">
            <h3>回報問題</h3>
            <p class="report-hint">很抱歉造成不便。請描述您遇到的問題，我們會盡快修復。</p>
            <div class="error-detail">
                <strong>錯誤訊息：</strong>${escapeHtml(errorMsg)}
            </div>
            <label for="error-description">補充說明（選填）</label>
            <textarea id="error-description" placeholder="例如：回覆時按下送出後出現錯誤..." maxlength="1000"></textarea>
            <div class="error-report-error" style="display: none;"></div>
            <div class="error-report-actions">
                <button class="cancel-report-btn">取消</button>
                <button class="submit-report-btn">送出回報</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    const errorDiv = overlay.querySelector('.error-report-error');
    const submitBtn = overlay.querySelector('.submit-report-btn');
    const cancelBtn = overlay.querySelector('.cancel-report-btn');

    cancelBtn.addEventListener('click', () => overlay.remove());

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
    });

    submitBtn.addEventListener('click', async () => {
        const description = overlay.querySelector('#error-description').value.trim();

        submitBtn.disabled = true;
        submitBtn.textContent = '送出中...';
        errorDiv.style.display = 'none';

        const report = {
            errorType: 'reply_failure',
            errorMessage: errorMsg,
            url: window.location.href,
            userAgent: navigator.userAgent,
            userDescription: description || undefined,
            requestBody: requestBody ? JSON.stringify(requestBody) : undefined,
        };

        const result = await ErrorReporter.report(report);

        if (result.savedLocally || result.sentToBackend) {
            const statusMsg = result.sentToBackend
                ? '回報已送出，我們會盡快調查並修復問題。'
                : '回報已儲存在本機，待網路恢復後將自動送出。';

            overlay.querySelector('.error-report-modal').innerHTML = `
                <div class="report-success">
                    <h3>感謝您的回報</h3>
                    <p>${statusMsg}</p>
                    <button class="close-report-btn">關閉</button>
                </div>
            `;
            overlay.querySelector('.close-report-btn').addEventListener('click', () => overlay.remove());
        } else {
            errorDiv.textContent = '回報儲存失敗，請截圖錯誤訊息並透過其他方式聯繫我們。';
            errorDiv.style.display = 'block';
            submitBtn.disabled = false;
            submitBtn.textContent = '重試';
        }
    });
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
