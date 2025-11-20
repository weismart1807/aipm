import React, { useState, useEffect, useRef } from "react";

// 將 CSS 樣式直接整合到元件中，並根據您的需求進行美化
const ChatStyles = () => (
    <style>{`
/* ChatBox 專區 - 移除獨立樣式，使其能融入父層容器 */
.chatbox {
  display: flex;
  flex-direction: column;
  width: 100%;  /* 寬度設為 100% */
  height: 100%; /* 高度設為 100% 以填滿 .content 區域 */
  overflow: hidden; /* 避免多出滾動條 */
  background-color: #fff; /* 保留背景色 */
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
  border: 1px solid #ddd; /* 參考您提供的 messages 樣式 */
  border-radius: 4px;
  margin-bottom: 10px;
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
.message-bubble.message-summary {
  background-color: #f8f9fa;
  border: 1px solid #f0f0f0ff;
  color: #afafafff;
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

.input-box textarea {
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

/* ✅ 新增：載入中 Spinner */
.spinner {
  width: 18px;
  height: 18px;
  border: 3px solid rgba(150, 150, 150, 0.2); /* 淺灰色底 */
  border-top-color: #888; /* 轉動的顏色 (灰色) */
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-right: 10px; /* 跟文字有點間距 */
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* ✅ 新增：讓 spinner 和文字水平排列 */
.loading-bubble {
    display: flex;
    align-items: center;
    color: #555; /* 讓「思考中」的文字也是灰色 */
}
    `}</style>
);


function ChatBox() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isComposing, setIsComposing] = useState(false);
    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);
    const [sessionId, setSessionId] = useState('');
    
    // ✅ 1. 新增載入狀態
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const newSessionId = crypto.randomUUID();
        setSessionId(newSessionId);

        const fetchSummary = async () => {
            try {
                const response = await fetch("https://wuca-n8n.zeabur.app/webhook/ab", {
                    method: "GET",
                });
                const data = await response.json();
                if (data && data.output) {
                    const summary = data.output + "有任何專案問題都可以問我喔🏌️";
                    setMessages([{ sender: "AI 專案摘要", text: summary }]);
                } else {
                    setMessages([{ sender: "AI 專案摘要", text: "目前沒有專案摘要" }]);
                }
            } catch (err) {
                setMessages([{ sender: "AI 專案摘要", text: "（錯誤，無法取得專案摘要）" }]);
            }
        };
        fetchSummary();
    }, []);

    const sendMessage = async () => {       
        const trimmedInput = input.trim();
        if (!trimmedInput || isLoading) return; // ✅ 如果正在載入中，禁止重複發送

        console.log("正在發送的 Session ID:", sessionId);

        setMessages(prevMessages => [...prevMessages, { sender: "我", text: trimmedInput }]);
        setInput("");
        
        // ✅ 2. 開始載入
        setIsLoading(true);

        try {
            const response = await fetch("https://wuca-n8n.zeabur.app/webhook/chatbot", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: trimmedInput, sessionId: sessionId }),
            });
            const data = await response.json();
            
            // ✅ 3. 停止載入
            setIsLoading(false);
            setMessages(prevMessages => [
                ...prevMessages,
                { sender: "PM 助手", text: data.output || "你的小幫手沒有聽清楚，可以在問一次嗎🤩" },
            ]);
        } catch (err) {
            // ✅ 3. 停止載入 (即使是錯誤)
            setIsLoading(false);
            setMessages(prevMessages => [
                ...prevMessages,
                { sender: "PM 助手", text: "（錯誤，無法取得回覆）" },
            ]);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
            e.preventDefault();
            sendMessage();
        }
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]); // ✅ 當 isLoading 變化時也滾動
    
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
                            <div className={`message-bubble ${msg.sender === "AI 專案摘要" ? "message-summary" : ""}`}>
                                <strong>{msg.sender}：</strong>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    
                    {/* ✅ 4. 顯示載入中動畫 */}
                    {isLoading && (
                        <div className="message-container other-message">
                            <div className="message-bubble">
                                <div className="loading-bubble">
                                    <div className="spinner"></div>
                                    <span>PM 助手 思考中...</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                <div className="input-box">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onCompositionStart={() => setIsComposing(true)}
                        onCompositionEnd={() => setIsComposing(false)}
                        placeholder="輸入詢問專案細節，或新增、編輯、刪除專案任務 (Shift+Enter 換行)..."
                        rows="1"
                        disabled={isLoading} // ✅ (可選) 載入中禁止輸入
                    />
                    <button onClick={sendMessage} disabled={isLoading}>
                        {isLoading ? "..." : "送出"} 
                    </button>
                </div>
            </div>
        </>
    );
}

export default ChatBox;