# AIPM-frontend ✨

**AI 專案管理助手（Frontend）**

一個以 React 建置的簡易前端介面，用來展示並管理專案任務，同時與 n8n 工作流程整合（webhook & embedded forms）。

---

## 快速開始 🔧

1. 安裝相依套件：

```bash
npm install
```

2. 本機開發：

```bash
npm start
```

3. 建置 (production)：

```bash
npm run build
```

---

## 檔案一覽 📁

| 檔案 | 說明 | 備註 |
|---|---:|---|
| `src/App.js` | 應用入口；頁面切換、嵌入表單 (iframe) | 表單 URL 為可替換的環境設定 |
| `src/Sidebar.js` | 側邊選單與導航按鈕 | - |
| `src/ChatBox.js` | AI 對話元件（初始化會顯示專案摘要、發送訊息給 chatbot webhook） | 支援 sessionId 與 chatHistory |
| `src/ProjectTable.js` | 顯示專案總表（可水平捲動） | 從 table webhook 讀取資料 |
| `src/GanttChart.js` | 甘特圖與任務編輯、AI 分析按鈕、更新提交 | 動態載入 vis-timeline CDN |
| `src/Connect_Graph.js` | 專案關係圖（視實作） | 視資料來源而定 |
| `src/index.js` / `src/index.css` | React 進入點與全域樣式 | - |

---

## n8n Webhook 與表單（占位說明）🔗

重要：**本檔案已移除專案中真實的 n8n 網址與表單連結**。請在部署或測試時將下列佔位符替換為你自己的 n8n Base URL（例如 `https://your-n8n.example` 或 `https://<YOUR_N8N_HOST>`）。

| 路徑 (相對) | 方法 | 目的 | 被呼叫於 |
|---|---:|---|---|
| `/webhook/ab` | GET | 取得「專案摘要」，顯示為聊天第一則訊息 | `src/ChatBox.js` |
| `/webhook/chatbot` | POST | 傳送使用者訊息，payload 包含 `message`, `sessionId`, `chatHistory` | `src/ChatBox.js` |
| `/webhook/table` | GET | 回傳專案任務陣列，用於表格與甘特圖 | `src/ProjectTable.js`, `src/GanttChart.js` |
| `/webhook/analysis` | POST | 請求 AI 分析（輸入 `projectName`）並回傳 `analysis_text` | `src/GanttChart.js` |
| `/webhook/update_on_gantt` | POST | 提交甘特圖編輯後的任務變更（包含 `_status` 欄位） | `src/GanttChart.js` |

範例：在程式中請使用下列格式（以 env 或設定檔替代真實網址）：

```js
const N8N_BASE = process.env.REACT_APP_N8N_BASE_URL || 'https://<YOUR_N8N_BASE>'
fetch(`${N8N_BASE}/webhook/table`)
```

---

## 嵌入表單（iframe）

`App` 使用 iframe 嵌入 n8n 的表單（例如：新增 / 編輯 / 刪除 專案表單）。請替換為你自己的表單網址：

```
https://<YOUR_N8N_BASE>/form/<YOUR_FORM_ID>
```

建議：將表單 URL 儲存在環境變數中（例如 `.env`），避免把敏感的專用 URL 直接推到版本控制。

---

## 注意事項 & 建議 💡

- 不要在公開 repo 中保留真實 webhook 或表單 URL；使用環境變數或設定檔替代。
- `ChatBox` 會自動產生 `sessionId`（`crypto.randomUUID()`），後端可以利用此 ID 綁定對話會話。 
- `/webhook/update_on_gantt` 的 payload `tasks` 內部請包含 `_status`（`create`/`update`/`delete`）以供後端處理。
- `GanttChart` 動態載入 `vis-timeline`，請確保執行環境能存取 CDN（或改為自行打包依賴）。

---

## 想要更多？

- 想要我幫你把專案中的所有實際 URL 換成 env 變數並更新程式碼範例嗎？ (✅ 我可以直接幫你改)

---

Made with ❤️  by the AIPM team
