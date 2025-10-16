import React, { useState, useEffect, useRef } from "react";

// 將 CSS 樣式直接整合到元件中，並根據您的需求進行美化
const ChatStyles = () => (
    <style>{`
/* 全局字體與盒模型設定 */
body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
      sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: #f0f2f5;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    margin: 0;
}

/* ChatBox 專區 */
.chatbox {
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 75vh; /* 調整高度以獲得更好看的比例 */
  width: 1036px; 
  max-width: 95%;
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden; /* 避免多出滾動條 */
}

/* 對話紀錄區域（滾動） */
.messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  gap: 15px; /* 訊息間的間距 */
}

/* 訊息容器 (用於對齊) */
.message-container {
    display: flex;
    width: 100%;
}

.my-message {
    justify-content: flex-end; /* 「我」的訊息靠右 */
}

.other-message {
    justify-content: flex-start; /* 其他訊息靠左 */
}

/* 訊息泡泡 */
.message-bubble {
    max-width: 80%;
    padding: 10px 15px;
    border-radius: 18px;
    line-height: 1.5;
    word-wrap: break-word; /* 自動換行 */
    white-space: pre-wrap; /* 保留換行符號 */
}

.my-message .message-bubble {
    background-color: #c9e2fdff;
    color: #333;
    border-bottom-right-radius: 4px;
}

.other-message .message-bubble {
    background-color: #e9e9eb;
    color: #333;
    border-bottom-left-radius: 4px;
}

.message-bubble strong {
    display: block;
    margin-bottom: 5px;
    font-weight: 600;
}

/* 專案摘要的特殊樣式 */
.message-summary {
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  color: #495057;
  max-width: 100%;
  border-radius: 10px;
}

/* 輸入框區域 */
.input-box {
    display: flex;
    padding: 15px;
    border-top: 1px solid #e0e0e0;
    background-color: #f9f9f9;
}

.input-box textarea { /* 改為 textarea 以支援換行 */
    flex-grow: 1;
    border: 1px solid #ccc;
    border-radius: 20px;
    padding: 10px 15px;
    font-size: 1rem;
    resize: none;
    overflow-y: auto;
    max-height: 100px;
    line-height: 1.4;
    margin-right: 10px;
}

.input-box textarea:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.2);
}

.input-box button {
    padding: 10px 20px;
    border: none;
    background-color: #007bff;
    color: white;
    border-radius: 20px;
    cursor: pointer;
    font-size: 1rem;
    font-weight: bold;
    transition: background-color 0.2s;
}

.input-box button:hover {
    background-color: #0056b3;
}
    `}</style>
);


function ChatBox() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    // ✅ 這是解決中文輸入問題的關鍵
    const [isComposing, setIsComposing] = useState(false);
    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);
    // ✅ 1. 新增一個 state 來儲存 Session ID
    const [sessionId, setSessionId] = useState('');

    useEffect(() => {
        // 直接產生一個全新的 ID，不要讀取 localStorage
        const newSessionId = crypto.randomUUID();
        setSessionId(newSessionId);

        const fetchSummary = async () => {
            try {
                const response = await fetch("https://wuca-n8n.zeabur.app/webhook/ab", {
                    method: "GET",
                });
                const data = await response.json();
                if (data && data.output) {
                    const summary = data.output + "有任何專案問題都可以問我喔🏌️🥊";
                    setMessages([{ sender: "PM 專案摘要", text: summary }]);
                } else {
                    setMessages([{ sender: "PM 專案摘要", text: "目前沒有專案摘要" }]);
                }
            } catch (err) {
                setMessages([{ sender: "PM 專案摘要", text: "（錯誤，無法取得專案摘要）" }]);
            }
        };
        fetchSummary();
    }, []);

    const sendMessage = async () => {       
        const trimmedInput = input.trim();
        if (!trimmedInput) return;

        // ✅ 在這裡加入 console.log
        console.log("正在發送的 Session ID:", sessionId);

        // ✅ 使用函數式更新，確保狀態同步正確
        setMessages(prevMessages => [...prevMessages, { sender: "我", text: trimmedInput }]);
        setInput("");

        try {
            const response = await fetch("https://wuca-n8n.zeabur.app/webhook/chatbot", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: trimmedInput, sessionId: sessionId }),
            });
            const data = await response.json();
            setMessages(prevMessages => [
                ...prevMessages,
                { sender: "PM 助手", text: data.output || "你的小幫手沒有聽清楚，可以在問一次嗎🤩" },
            ]);
        } catch (err) {
            setMessages(prevMessages => [
                ...prevMessages,
                { sender: "PM 助手", text: "（錯誤，無法取得回覆）" },
            ]);
        }
    };

    const handleKeyDown = (e) => {
        // ✅ 修正：判斷我們自己維護的 isComposing 狀態，而非 e.isComposing
        if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
            e.preventDefault();
            sendMessage();
        }
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);
    
    // 自動調整 textarea 高度
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    }, [input]);

    return (
        <>
            <ChatStyles />
            <div className="chatbox">
                <div className="messages">
                    {messages.map((msg, i) => (
                        <div key={i} className={`message-container ${msg.sender === "我" ? "my-message" : "other-message"}`}>
                            <div className={`message-bubble ${msg.sender === "PM 專案摘要" ? "message-summary" : ""}`}>
                                <strong>{msg.sender}：</strong>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                <div className="input-box">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        // ✅ 這兩個事件是修正中文輸入問題的核心
                        onCompositionStart={() => setIsComposing(true)}
                        onCompositionEnd={() => setIsComposing(false)}
                        placeholder="輸入訊息 (Shift+Enter 換行)..."
                        rows="1"
                    />
                    <button onClick={sendMessage}>送出</button>
                </div>
            </div>
        </>
    );
}

export default ChatBox;

