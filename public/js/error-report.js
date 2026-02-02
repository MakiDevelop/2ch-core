/**
 * 2ch.tw 錯誤回報系統
 * - 提供全站通用的回報功能
 * - 先存 localStorage，再嘗試送後端
 */

(function() {
    'use strict';

    const STORAGE_KEY = '2ch_error_reports';

    // Save to localStorage
    function saveLocal(report) {
        try {
            const reports = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            reports.push({
                ...report,
                id: Date.now(),
                savedAt: new Date().toISOString(),
            });
            if (reports.length > 20) reports.shift();
            localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
            return true;
        } catch (e) {
            console.error('Failed to save error report locally:', e);
            return false;
        }
    }

    // Send to backend
    async function sendToBackend(report) {
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
    }

    // Escape HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Show report modal
    window.showReportProblemModal = function() {
        const overlay = document.createElement('div');
        overlay.className = 'error-report-modal-overlay';

        overlay.innerHTML = `
            <div class="error-report-modal">
                <h3>回報問題</h3>
                <p class="report-hint">遇到問題了嗎？請描述您遇到的狀況，我們會盡快處理。</p>
                <label for="report-type">問題類型</label>
                <select id="report-type">
                    <option value="post_failure">發文/回覆失敗</option>
                    <option value="page_error">頁面顯示異常</option>
                    <option value="feature_bug">功能異常</option>
                    <option value="suggestion">建議與意見</option>
                    <option value="other">其他</option>
                </select>
                <label for="report-description">問題描述</label>
                <textarea id="report-description" placeholder="請描述您遇到的問題，越詳細越好..." maxlength="2000" rows="5"></textarea>
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

        cancelBtn.addEventListener('click', function() { overlay.remove(); });

        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) overlay.remove();
        });

        document.addEventListener('keydown', function handler(e) {
            if (e.key === 'Escape') {
                overlay.remove();
                document.removeEventListener('keydown', handler);
            }
        });

        submitBtn.addEventListener('click', async function() {
            const reportType = overlay.querySelector('#report-type').value;
            const description = overlay.querySelector('#report-description').value.trim();

            if (!description) {
                errorDiv.textContent = '請描述您遇到的問題';
                errorDiv.style.display = 'block';
                return;
            }

            submitBtn.disabled = true;
            submitBtn.textContent = '送出中...';
            errorDiv.style.display = 'none';

            const report = {
                errorType: reportType,
                errorMessage: description.substring(0, 100),
                url: window.location.href,
                userAgent: navigator.userAgent,
                userDescription: description,
            };

            // Save locally first
            const savedLocally = saveLocal(report);
            // Then try backend
            const sentToBackend = await sendToBackend(report);

            if (savedLocally || sentToBackend) {
                const statusMsg = sentToBackend
                    ? '回報已送出，感謝您的回饋！'
                    : '回報已儲存在本機，待網路恢復後將自動送出。';

                overlay.querySelector('.error-report-modal').innerHTML = `
                    <div class="report-success">
                        <h3>感謝您的回報</h3>
                        <p>${statusMsg}</p>
                        <button class="close-report-btn">關閉</button>
                    </div>
                `;
                overlay.querySelector('.close-report-btn').addEventListener('click', function() { overlay.remove(); });
            } else {
                errorDiv.textContent = '回報儲存失敗，請稍後再試或到站務版反映。';
                errorDiv.style.display = 'block';
                submitBtn.disabled = false;
                submitBtn.textContent = '重試';
            }
        });
    };
})();
