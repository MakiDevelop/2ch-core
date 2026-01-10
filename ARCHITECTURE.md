# Core Design Patterns

2ch.tw 採用 **Node.js + TypeScript** 作為核心服務技術，整體架構以「有狀態、事件驅動、可擴充」為目標。

在實作過程中，核心邏輯主要圍繞三個設計模式：

- **Strategy Pattern（策略模式）**
- **Factory Pattern（工廠模式）**
- **Observer Pattern（觀察者模式）**

這三者共同構成系統的主要擴充與演進方式。

---

## Strategy Pattern（策略模式）

**用途：處理「規則會持續變動」的業務邏輯。**

在 2ch.tw 中，許多行為在不同情境下會有不同規則，例如：

- 不同板規的發文／回文限制
- 不同使用者角色的權限判斷
- 不同事件類型的處理邏輯
- 同一操作在不同狀態下的行為差異

這類邏輯不適合集中在大量 if/else 中。

策略模式的做法是：

- 定義行為介面（interface）
- 將每一種規則實作成獨立策略
- 在執行階段選擇適當策略

好處是新增規則時，只需新增策略實作，不需修改既有流程，降低風險並提高可維護性。

---

## Factory Pattern（工廠模式）

**用途：集中「建立與選擇物件」的責任，避免流程中出現判斷邏輯。**

在系統中，常見需要根據情境建立不同實例的地方包括：

- 根據 request / context 建立對應的 handler
- 根據事件類型選擇對應策略
- 建立帶有狀態的 context（包含權限、連線、 emitter）

工廠模式負責：

- 根據輸入條件，回傳正確的實作
- 將選擇邏輯集中管理
- 保持主流程簡潔、可讀

這讓業務流程只關心「做什麼」，而不是「用誰來做」。

---

## Observer Pattern（觀察者模式）

**用途：處理事件驅動系統中的非同步反應邏輯。**

2ch.tw 的核心並非單純 request-response，而是大量事件流，例如：

- 新文章建立
- 新回文加入
- 狀態變化（封鎖、解鎖、刪文）
- 即時通知（SSE / 未來 WebSocket）

觀察者模式的核心原則是：

- 事件產生者不需要知道誰會處理事件
- 不同 observer 可獨立訂閱與處理同一事件
- 新行為可透過新增 observer 擴充，而非修改既有邏輯

這種模式特別適合 Node.js 的 event loop 與長連線模型，能有效避免 busy waiting 與不必要的 CPU 消耗。

在 Node.js 中，這種模式通常透過事件發射器（EventEmitter）、發佈/訂閱（pub/sub）、SSE 或 WebSocket 等方式實作。

---

## Pattern Collaboration

在 2ch.tw 中，三個模式的責任分工如下：

- **Factory**：決定「現在該使用哪一個實作」
- **Strategy**：定義「在這個情境下要怎麼做」
- **Observer**：負責「事件發生後要如何反應」

這樣的組合能讓系統在功能增加、規則擴張、即時需求提升時，仍維持清晰的結構與可演進性。

---

## Suggested Directory Structure

以下為建議的目錄結構示意，對應三種設計模式與其責任邊界：

```
src/
├─ core/
│  ├─ context/
│  │  └─ RequestContext.ts        # 使用者、權限、連線、emitter
│  │
│  ├─ strategy/
│  │  ├─ interfaces/
│  │  │  └─ PostStrategy.ts       # 策略介面定義
│  │  ├─ BoardRuleStrategy.ts     # 板規策略
│  │  ├─ PermissionStrategy.ts    # 權限策略
│  │  └─ index.ts
│  │
│  ├─ factory/
│  │  ├─ StrategyFactory.ts       # 根據 context 選擇策略
│  │  ├─ HandlerFactory.ts        # 建立對應 handler
│  │  └─ index.ts
│  │
│  ├─ observer/
│  │  ├─ PostCreatedObserver.ts   # 文章建立事件
│  │  ├─ ReplyAddedObserver.ts    # 回文新增事件
│  │  ├─ StateChangedObserver.ts  # 狀態變化事件
│  │  └─ index.ts
│  │
│  └─ events/
│     ├─ EventBus.ts              # 事件發佈／訂閱
│     └─ EventTypes.ts
│
├─ api/
│  └─ routes/
│     └─ post.ts
│
└─ index.ts
```

此結構刻意讓：

- **Strategy** 專注於「規則與行為」
- **Factory** 專注於「選擇與建立」
- **Observer** 專注於「事件反應」

避免責任混雜，並保留未來擴充 SSE / WebSocket 與更多事件的空間。

---

## Why domain lives in `domains/` and not `shared/`

在 2ch.tw 中，所有「業務語意」與「規則判斷」都必須存在於 `domains/` 之下，而不是放入 `shared/`。

這是一個刻意的架構選擇，其核心原因如下。

第一，**Domain 是系統的語言，不是工具程式碼**。  
`domains/` 內的程式碼描述的是「發文是什麼」、「回文如何成立」、「板規如何影響行為」。  
這些不是可重用 utility，而是 2ch.tw 這個產品本身的定義。

第二，**Domain 不應依賴 transport 或 runtime 細節**。  
Domain 邏輯不應知道請求是來自 HTTP、SSE、WebSocket，或未來的其他通道。  
這些差異應由 `app/` 層負責轉接，而非滲入 domain。

第三，**shared 僅用於技術性共用，而非業務共用**。  
`shared/` 的定位僅限於：
- logger
- error base class
- infra adapter
- 輔助型 helper

一旦業務規則進入 `shared/`，會導致 domain 語意被稀釋，並增加跨模組耦合風險。

第四，**domain-first 能確保系統可演進性**。  
當功能增加、規則變複雜時，domain 會自然成為策略、工廠與觀察者模式的聚合點。  
這能避免業務邏輯散落在 controller、route 或 adapter 中。

總結來說：

- `domains/`：定義「系統是什麼」
- `app/`：處理「系統如何被呼叫」
- `shared/`：提供「技術性輔助能力」

這樣的分層能確保 2ch.tw 在功能成長、即時需求增加、與團隊擴張時，仍維持清楚的責任邊界。