import React, { useState, useEffect, useRef } from "react";
import "./index.css";

function ChatBox() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const messagesEndRef = useRef(null);

    // ✅ 第一次載入時抓摘要
    useEffect(() => {
        const fetchSummary = async () => {
            try {
            const response = await fetch("https://wuca-n8n.zeabur.app/webhook/ab", {
                method: "GET",
            });
            const data = await response.json();
            console.log("專案摘要回傳：", data);

            // 避免太快輸出空白內容
            if (data) {
                const summary = data.output + "\n有任何專案問題都可以問我喔🍕";
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
        if (!input.trim()) return;

        const newMessages = [...messages, { sender: "我", text: input }];
        setMessages(newMessages);

        try {
        const response = await fetch("https://wuca-n8n.zeabur.app/webhook/b6d9e6a6-32ef-4e39-b99d-24cc02275e1b", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: input }),
        });
        const data = await response.json();
        console.log("n8n 回傳：", data); 

        setMessages([
            ...newMessages,
            { sender: "PM 助手", text: data.output || "(沒有回覆)" },
        ]);
        } catch (err) {
        setMessages([
            ...newMessages,
            { sender: "PM 助手", text: "（錯誤，無法取得回覆）" },
        ]);
        }

        setInput("");
    };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="chatbox">
        <div className="messages">
        {messages.map((msg, i) => (
            <p
            key={i}
            className={msg.sender === "PM 專案摘要" ? "message-summary" : ""}
            >
            <strong>{msg.sender}：</strong> {msg.text}
            </p>
        ))}
        <div ref={messagesEndRef} />
        </div>

        <div className="input-box">
            <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="輸入訊息..."
            />
            <button onClick={sendMessage}>送出</button>
        </div>
    </div>
  );
}

export default ChatBox;
