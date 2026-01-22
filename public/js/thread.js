// 2ch.tw Thread Detail Page Script

// Version for cache busting
const APP_VERSION = '20260122';

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
            "datePublished": thread.createdAt || '',
            "author": {
                "@type": "Person",
                "name": thread.authorName || "匿名"
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

// Show edit post modal
const showEditPostModal = (postId, currentContent, onSuccess) => {
    const overlay = document.createElement('div');
    overlay.className = 'edit-post-modal-overlay';

    overlay.innerHTML = `
        <div class="edit-post-modal">
            <h3>編輯貼文</h3>
            <label for="edit-token-input">編輯密碼</label>
            <input type="text" id="edit-token-input" placeholder="請輸入 8 位編輯密碼" maxlength="8">
            <label for="edit-content-input">內容</label>
            <textarea id="edit-content-input">${escapeHtml(currentContent)}</textarea>
            <div class="edit-post-error" style="display: none;"></div>
            <div class="edit-post-actions">
                <button class="cancel-edit-btn">取消</button>
                <button class="save-edit-btn">儲存</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    const tokenInput = overlay.querySelector('#edit-token-input');
    const contentInput = overlay.querySelector('#edit-content-input');
    const errorDiv = overlay.querySelector('.edit-post-error');
    const saveBtn = overlay.querySelector('.save-edit-btn');
    const cancelBtn = overlay.querySelector('.cancel-edit-btn');

    // Cancel button
    cancelBtn.addEventListener('click', () => overlay.remove());

    // Click outside to close
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
    });

    // Save button
    saveBtn.addEventListener('click', async () => {
        const editToken = tokenInput.value.trim();
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

    // Focus on token input
    tokenInput.focus();
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
                ${isArchived ? '<span class="archived-notice">此討論串已達 999 樓上限，已封存無法回覆</span>' : ''}
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

    const repliesHTML = reversedReplies.map(({ reply, floor }) => `
        <div class="reply-item" id="reply-${floor}" data-content="${escapeHtml(reply.content)}">
            <div class="reply-header">
                <span class="reply-number" data-floor="${floor}">${floor}樓</span>
                <span class="reply-author">${escapeHtml(reply.authorName || '名無しさん')}</span>
                <span class="reply-id share-id" data-post-id="${reply.id}" data-floor="${floor}" title="點擊複製分享連結">#${reply.id}</span>
                <span class="reply-time">${formatDate(reply.createdAt)}</span>
                ${formatEditedTime(reply.editedAt, reply.createdAt)}
                <button class="edit-post-btn" data-post-id="${reply.id}" title="編輯此回覆">編輯</button>
            </div>
            <div class="reply-content">
                ${parseContent(reply.content)}
                ${renderLinkPreview(reply.linkPreview)}
            </div>
        </div>
    `).join('');

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

        // Show edit token modal if available
        if (data.editToken) {
            showEditTokenModal(data.editToken, () => {
                loadThread();
            });
        } else {
            // Fallback if no edit token
            showMessage('回覆成功！', 'success');
            setTimeout(() => {
                loadThread();
                replyMessage.textContent = '';
            }, 1000);
        }

    } catch (error) {
        console.error('Error posting reply:', error);
        showMessage(error.message || '回覆失敗，請稍後再試', 'error');
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
