import React, { useState } from "react";
import Sidebar from "./Sidebar";
import ChatBox from "./ChatBox";
import "./index.css";
import ProjectTable from "./ProjectTable";
import GanttChart from "./GanttChart";
import Neo4jGraph from "./Connect_Graph"
function App() {
  const [page, setPage] = useState("chat");

  return (
    <div className="app-container">
      <Sidebar setPage={setPage} />
      <div className="content">
        {page === "chat" && <ChatBox />}
        {page === "projects" && <ProjectTable />}
        {page === "progress" && <GanttChart />}
        {page === "graphbyproject" && <Neo4jGraph />}
        {page === "add" && (
          <iframe
            src="https://"  // ← 修改為 n8n 新增專案 URL
            title="新增專案"
            className="iframe"
          />
        )}
        {page === "edit" && (
          <iframe
            src="https://"  // ← 修改為 n8n 編輯專案 URL
            title="編輯專案"
            className="iframe"
          />
        )}
        {page === "delete" && (
          <iframe
            src="https://"  // ← 修改為 n8n 刪除專案 URL
            title="刪除專案"
            className="iframe"
          />
        )}
      </div>
    </div>
  );
}

export default App;
