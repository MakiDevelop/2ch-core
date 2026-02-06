// System status dashboard logic
const API_BASE = '';

function formatTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function loadSystemStatus() {
    const refreshBtn = document.getElementById('refresh-btn');
    const errorContainer = document.getElementById('error-container');
    const content = document.getElementById('content');

    refreshBtn.disabled = true;
    refreshBtn.textContent = '載入中...';
    errorContainer.innerHTML = '';

    try {
        const response = await fetch(`${API_BASE}/admin/system-status`);

        if (!response.ok) {
            if (response.status === 403) {
                throw new Error('權限不足：您沒有訪問此頁面的權限');
            }
            throw new Error(`HTTP ${response.status}: 無法載入系統狀態`);
        }

        const data = await response.json();
        renderSystemStatus(data);
        document.getElementById('last-update').textContent = formatTime(data.timestamp);

    } catch (error) {
        console.error('Error loading system status:', error);
        errorContainer.innerHTML = `
            <div class="error-message">
                <strong>錯誤：</strong> ${error.message}
            </div>
        `;
        content.innerHTML = '';
    } finally {
        refreshBtn.disabled = false;
        refreshBtn.textContent = '重新整理';
    }
}

function renderSystemStatus(data) {
    const { system, process, database, containers } = data;

    const memUsagePercent = parseFloat(system.memoryUsagePercent);
    const memUsageClass = memUsagePercent > 90 ? 'error' : memUsagePercent > 70 ? 'warning' : '';

    const html = `
        <!-- 系統資訊 -->
        <div class="section">
            <h2>系統資訊</h2>
            <div class="grid">
                <div class="stat-card">
                    <div class="stat-label">主機名稱</div>
                    <div class="stat-value" style="font-size: 18px;">${system.hostname}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">系統運行時間</div>
                    <div class="stat-value" style="font-size: 18px;">${system.uptimeFormatted}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">平台 / 架構</div>
                    <div class="stat-value" style="font-size: 18px;">${system.platform} / ${system.arch}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">CPU 核心數</div>
                    <div class="stat-value">${system.cpus} <span class="stat-unit">cores</span></div>
                </div>
            </div>
        </div>

        <!-- 負載與記憶體 -->
        <div class="section">
            <h2>負載與記憶體</h2>
            <div class="grid">
                <div class="stat-card">
                    <div class="stat-label">系統負載 (1/5/15 分鐘)</div>
                    <div class="stat-value" style="font-size: 16px;">
                        ${system.loadavg.map(l => l.toFixed(2)).join(' / ')}
                    </div>
                </div>
                <div class="stat-card ${memUsageClass}">
                    <div class="stat-label">記憶體使用率</div>
                    <div class="stat-value">${system.memoryUsagePercent}<span class="stat-unit">%</span></div>
                    <div class="progress-bar">
                        <div class="progress-fill ${memUsageClass}" style="width: ${system.memoryUsagePercent}%"></div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">已用記憶體</div>
                    <div class="stat-value" style="font-size: 16px;">
                        ${formatBytes(system.usedMemory)} / ${formatBytes(system.totalMemory)}
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">可用記憶體</div>
                    <div class="stat-value" style="font-size: 18px;">${formatBytes(system.freeMemory)}</div>
                </div>
            </div>
        </div>

        <!-- Node.js 程序資訊 -->
        <div class="section">
            <h2>Node.js 程序</h2>
            <div class="grid">
                <div class="stat-card">
                    <div class="stat-label">Node 版本</div>
                    <div class="stat-value" style="font-size: 18px;">${process.nodeVersion}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">程序 ID</div>
                    <div class="stat-value">${process.pid}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">程序運行時間</div>
                    <div class="stat-value" style="font-size: 18px;">${process.uptimeFormatted}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">程序記憶體 (RSS)</div>
                    <div class="stat-value" style="font-size: 18px;">${formatBytes(process.memoryUsage.rss)}</div>
                </div>
            </div>
        </div>

        <!-- 資料庫狀態 -->
        <div class="section">
            <h2>資料庫狀態</h2>
            ${database.connected ? `
                <div class="grid">
                    <div class="stat-card">
                        <div class="stat-label">資料庫名稱</div>
                        <div class="stat-value" style="font-size: 18px;">${database.database}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">資料庫大小</div>
                        <div class="stat-value" style="font-size: 18px;">${database.size}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">討論版數量</div>
                        <div class="stat-value">${database.stats.boards}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">討論串總數</div>
                        <div class="stat-value">${database.stats.threads}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">回覆總數</div>
                        <div class="stat-value">${database.stats.replies}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">文章總數</div>
                        <div class="stat-value">${database.stats.posts}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">今日新文章</div>
                        <div class="stat-value">${database.stats.todayPosts}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">今日新討論串</div>
                        <div class="stat-value">${database.stats.todayThreads}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">已刪除文章</div>
                        <div class="stat-value">${database.stats.deletedPosts}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">管理記錄</div>
                        <div class="stat-value">${database.stats.moderationLogs}</div>
                    </div>
                </div>
                <div style="margin-top: 12px; font-size: 13px; color: #666;">
                    PostgreSQL ${database.version.split(' ')[1]}
                </div>
            ` : `
                <div class="stat-card error">
                    <div class="stat-label">連線狀態</div>
                    <div class="stat-value" style="font-size: 18px; color: #f44242;">連線失敗</div>
                </div>
            `}
        </div>

        <!-- 容器狀態 -->
        <div class="section">
            <h2>容器狀態</h2>
            ${containers.error ? `
                <div class="stat-card error">
                    <div class="stat-label">容器資訊</div>
                    <div class="stat-value" style="font-size: 16px; color: #f44242;">${containers.error}</div>
                </div>
            ` : `
                <table class="table">
                    <thead>
                        <tr>
                            <th>容器名稱</th>
                            <th>狀態</th>
                            <th>運行狀態</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${containers.containers.map(c => `
                            <tr>
                                <td>${c.name}</td>
                                <td>${c.status}</td>
                                <td><span class="status-badge status-running">${c.state}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `}
        </div>
    `;

    document.getElementById('content').innerHTML = html;
}

// Event listeners
document.getElementById('refresh-btn').addEventListener('click', loadSystemStatus);

// Initial load
loadSystemStatus();

// Auto-refresh every 30 seconds
setInterval(loadSystemStatus, 30000);
