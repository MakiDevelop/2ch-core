/**
 * 2ch.tw 公告系統
 * - 彈窗公告
 * - 看過的人不再顯示（localStorage）
 * - 可設定顯示期限
 */

(function() {
    'use strict';

    // 公告設定
    const ANNOUNCEMENT = {
        id: '2026-02-02-apology',  // 唯一識別碼，換公告時要改這個
        expiresAt: '2026-02-09T23:59:59+08:00',  // 公告顯示到什麼時候
        title: '向大家誠摯道歉',
        content: `
            <p>各位鄉民好，</p>
            <p>真的很抱歉。</p>
            <p>因為我個人的疏失，<strong>1/30 到 2/2 這三天</strong>，部分用戶的發文和回覆功能出現故障。</p>
            <p>如果你在這段期間發過文或回過覆，然後發現怎麼送都送不出去 — 真的非常對不起。我知道那種花時間打了一篇文，結果消失不見的感覺有多差。</p>
            <p><strong>很遺憾，那些內容沒有被儲存，我無法幫你們找回來。</strong></p>
            <p>這是一個很基本的程式錯誤，我沒有做好測試就上線，讓大家受到影響，這完全是我的責任。</p>
            <p>問題已經在今天（2/2）修復，現在發文功能正常運作。</p>
            <p>我也加入了<a href="#" class="announcement-report-link">錯誤回報功能</a>，以後如果再遇到任何問題，可以直接回報給我（頁尾也有連結）。</p>
            <p>如果你有任何想法或建議，歡迎到<a href="/boards/meta/threads">站務版</a>跟我說。</p>
            <p style="margin-top: 20px; text-align: right; color: var(--text-secondary);">再次說聲抱歉<br>— 站長</p>
        `
    };

    // 檢查是否應該顯示公告
    function shouldShowAnnouncement() {
        // 檢查是否過期
        const now = new Date();
        const expires = new Date(ANNOUNCEMENT.expiresAt);
        if (now > expires) {
            return false;
        }

        // 檢查是否已經看過
        const dismissedId = localStorage.getItem('announcement_dismissed');
        if (dismissedId === ANNOUNCEMENT.id) {
            return false;
        }

        return true;
    }

    // 關閉公告
    function dismissAnnouncement() {
        localStorage.setItem('announcement_dismissed', ANNOUNCEMENT.id);
        const overlay = document.getElementById('announcement-overlay');
        if (overlay) {
            overlay.classList.add('closing');
            setTimeout(function() {
                overlay.remove();
            }, 300);
        }
    }

    // 顯示公告
    function showAnnouncement() {
        if (!shouldShowAnnouncement()) {
            return;
        }

        // 建立 DOM
        const overlay = document.createElement('div');
        overlay.id = 'announcement-overlay';
        overlay.className = 'announcement-overlay';
        overlay.innerHTML = `
            <div class="announcement-modal">
                <div class="announcement-header">
                    <h2>${ANNOUNCEMENT.title}</h2>
                </div>
                <div class="announcement-body">
                    ${ANNOUNCEMENT.content}
                </div>
                <div class="announcement-footer">
                    <button id="announcement-dismiss" class="announcement-btn">我知道了</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // 綁定關閉事件
        document.getElementById('announcement-dismiss').addEventListener('click', dismissAnnouncement);

        // 綁定回報連結
        var reportLink = overlay.querySelector('.announcement-report-link');
        if (reportLink) {
            reportLink.addEventListener('click', function(e) {
                e.preventDefault();
                if (typeof showReportProblemModal === 'function') {
                    showReportProblemModal();
                }
            });
        }

        // 點擊背景也可以關閉
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                dismissAnnouncement();
            }
        });

        // ESC 鍵關閉
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                dismissAnnouncement();
            }
        });
    }

    // DOM 載入後顯示
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', showAnnouncement);
    } else {
        showAnnouncement();
    }
})();
