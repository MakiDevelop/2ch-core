# Codex Risk Checklist 20260113

發現項目: 自訂 tag 解析可被繞過導致 XSS/HTML 注入
風險描述: 系統宣稱不支援 HTML/Markdown，但若自訂 tag 解析器對大小寫、空白、巢狀、未閉合、混淆字元處理不嚴謹，可能產生意外的 HTML 輸出或 tag 注入。
可能攻擊方式: 構造 <yt> / <iu> / <code> 的變體（如 </yt><img onerror=...>、寬字元、混合控制字元、未閉合 tag），讓解析器輸出可執行的 HTML。
風險等級（Low / Medium / High）: High
攻擊成本（低 / 中 / 高）: 低
改善建議: 以白名單語法與嚴格的 parser state machine 解析；只允許精確格式（明確起訖、不得巢狀、拒絕未知 tag）；所有輸出再做 HTML entity escape。
是否「必須立即修」: 是
是否「可接受但需記錄」: 否
是否「設計選擇，不建議修」: 否

發現項目: <code> 區塊的 escape 漏洞
風險描述: <code> 常被視為「原樣輸出」，若 escape 處理不完整或僅做部分替換，會成為儲存型 XSS 的入口。
可能攻擊方式: 在 <code> 中注入 </code><script>... 或利用 & / < / > 的編碼邊界繞過。
風險等級（Low / Medium / High）: High
攻擊成本（低 / 中 / 高）: 低
改善建議: <code> 內容一律做完整 HTML entity escape（至少 & < > " '），並避免雙重解碼。
是否「必須立即修」: 是
是否「可接受但需記錄」: 否
是否「設計選擇，不建議修」: 否

發現項目: <yt> 解析導致任意 iframe 輸出
風險描述: 若 <yt> 接受完整 URL 而非 YouTube 影片 ID，攻擊者可嵌入任意 iframe（釣魚、惡意內容、追蹤）。
可能攻擊方式: <yt>https://evil.example/iframe</yt> 或利用 URL 參數繞過白名單。
風險等級（Low / Medium / High）: Medium
攻擊成本（低 / 中 / 高）: 低
改善建議: 僅接受 YouTube 影片 ID；輸出固定 https://www.youtube.com/embed/{id}；加上 sandbox、referrerpolicy="no-referrer"、allow 僅必要權限。
是否「必須立即修」: 是
是否「可接受但需記錄」: 否
是否「設計選擇，不建議修」: 否

發現項目: <iu> 外部圖片連結造成追蹤與隱私洩漏
風險描述: 圖片不 re-host 代表使用者瀏覽時直接向第三方發出請求，會洩漏 IP、User-Agent、Referrer，且可被用於追蹤與精準廣告。
可能攻擊方式: 攻擊者貼上 tracking pixel；藉由 Referrer 取得貼文 URL 與版位資訊。
風險等級（Low / Medium / High）: Medium
攻擊成本（低 / 中 / 高）: 低
改善建議: img 設定 referrerpolicy="no-referrer"；提示使用者外部圖片風險；可選擇性加上「點擊後載入」機制降低自動請求。
是否「必須立即修」: 否
是否「可接受但需記錄」: 是
是否「設計選擇，不建議修」: 否

發現項目: Mixed Content 與 HTTPS 降級風險
風險描述: 若 <iu> 或 <yt> 允許 http://，將造成混合內容或被中間人劫持。
可能攻擊方式: 插入 http:// 圖片或 iframe；在公共 Wi-Fi 篡改內容。
風險等級（Low / Medium / High）: Medium
攻擊成本（低 / 中 / 高）: 低
改善建議: 僅允許 https://；在輸出端強制 https 並拒絕其他 scheme（如 javascript:, data:）。
是否「必須立即修」: 是
是否「可接受但需記錄」: 否
是否「設計選擇，不建議修」: 否

發現項目: URL 輸入類型的繞過（scheme / IDN / punycode）
風險描述: 使用者可透過 javascript:、data:、file: 等 scheme 或 IDN 同形字元迷惑使用者點擊惡意連結。
可能攻擊方式: <iu>javascript:alert(1)</iu>、https://g00gle.com 類似域名誤導。
風險等級（Low / Medium / High）: Medium
攻擊成本（低 / 中 / 高）: 低
改善建議: 僅允許 https://；對 URL 做嚴格解析與 canonicalization；顯示可疑連結警告或標記 IDN。
是否「必須立即修」: 是
是否「可接受但需記錄」: 否
是否「設計選擇，不建議修」: 否

發現項目: IP-based rate limit 對 bot 與殭屍網路不足
風險描述: 單純 IP 限速容易被 NAT/代理/殭屍網路繞過，導致刷版與垃圾文氾濫。
可能攻擊方式: 分散 IP 送文、使用公開代理池、雲端短租 IP。
風險等級（Low / Medium / High）: High
攻擊成本（低 / 中 / 高）: 中
改善建議: 加入多維度限速（IP /24、User-Agent、指紋、行為頻率）；針對突發流量啟用 JS proof-of-work 或限時 captcha（不需登入）。
是否「必須立即修」: 是
是否「可接受但需記錄」: 否
是否「設計選擇，不建議修」: 否

發現項目: DoS / 資源耗盡風險（大量貼文或超長內容）
風險描述: 匿名平台容易被大量貼文、超長內容、惡意 tag 觸發解析器或儲存成本膨脹。
可能攻擊方式: 自動化腳本連續發文；提交極長字串造成 CPU / DB 壓力。
風險等級（Low / Medium / High）: High
攻擊成本（低 / 中 / 高）: 中
改善建議: 限制每篇最大字數/タグ數；限制單 IP 的佔用量；對解析器設定時間/深度上限。
是否「必須立即修」: 是
是否「可接受但需記錄」: 否
是否「設計選擇，不建議修」: 否

發現項目: Pagination 易被大量爬取與資料歸檔
風險描述: Page-based pagination 易被機器人完整掃描，平台內容可被快速備份、索引、再公開。
可能攻擊方式: 依序抓取頁碼，建立全站鏡像與搜索。
風險等級（Low / Medium / High）: Medium
攻擊成本（低 / 中 / 高）: 低
改善建議: 對爬取行為設置節流；增加 robots 設定與行為偵測（非阻擋，但降低效率）；在回應頭加入可審計的速率限制提示。
是否「必須立即修」: 否
是否「可接受但需記錄」: 是
是否「設計選擇，不建議修」: 否

發現項目: Error message 可能洩漏內部資訊
風險描述: 若錯誤訊息回傳堆疊或路徑，會揭露框架、路由、檔案結構，提升攻擊效率。
可能攻擊方式: 以畸形 payload 觸發 500 錯誤，觀察回應內容。
風險等級（Low / Medium / High）: Medium
攻擊成本（低 / 中 / 高）: 低
改善建議: 對外只回傳通用錯誤訊息與追蹤 ID；錯誤細節僅寫入內部 log。
是否「必須立即修」: 否
是否「可接受但需記錄」: 是
是否「設計選擇，不建議修」: 否

發現項目: 匿名平台濫用與法律風險（誹謗、仇恨、非法內容）
風險描述: 匿名設計易被用於誹謗、詐騙、仇恨與非法內容，平台可能遭到要求提供證據或配合調查。
可能攻擊方式: 有組織抹黑、散播違法內容並要求平台承擔責任。
風險等級（Low / Medium / High）: Medium
攻擊成本（低 / 中 / 高）: 低
改善建議: 制定明確的內容政策與取締流程；保留必要的最小化紀錄（IP/UA）並確保存取控管；建立可核對的事件記錄（tamper-evident）。
是否「必須立即修」: 否
是否「可接受但需記錄」: 是
是否「設計選擇，不建議修」: 否

發現項目: HTTP headers 缺失導致防護面不足
風險描述: 未設定安全標頭會放大 XSS、iframe 攻擊與外部資源風險。
可能攻擊方式: 針對缺失 CSP 或 clickjacking 防護的利用。
風險等級（Low / Medium / High）: Medium
攻擊成本（低 / 中 / 高）: 低
改善建議: 設定符合實際功能的 Content-Security-Policy（僅允許 YouTube iframe + 可信圖片來源）、X-Content-Type-Options: nosniff、Referrer-Policy、Permissions-Policy。
是否「必須立即修」: 否
是否「可接受但需記錄」: 是
是否「設計選擇，不建議修」: 否
