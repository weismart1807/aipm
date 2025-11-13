import React from "react";

function Sidebar({ setPage }) {
  return (
    <div className="sidebar">
      <h2>AI 專案管理助手</h2>
      <h4>Agentic Version</h4>
      <button onClick={() => setPage("chat")}>AI 對話筐</button>
      <button onClick={() => setPage("graphbyproject")}>專案關係圖</button>
      <button onClick={() => setPage("progress")}>專案甘特圖</button>
      <button onClick={() => setPage("projects")}>專案總表</button>
      <button onClick={() => setPage("add")}>新增</button>
      <button onClick={() => setPage("edit")}>編輯</button>
      <button onClick={() => setPage("delete")}>刪除</button>

      <div className="sidebar-logo">
        <img src="logo.png" alt="Logo" />
      </div>
    </div>
  );
}

export default Sidebar;
