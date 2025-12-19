import React, { useState } from "react";
import Sidebar from "./Sidebar";
import ChatBox from "./ChatBox";
import "./index.css";
import ProjectTable from "./ProjectTable";
import GanttChart from "./GanttChart";
import Neo4jGraph from "./ConnectGraph"
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
            src="https://wuca-n8n.zeabur.app/form/c9285050-d74b-49b9-b8b5-5d979d0e749d"  // ← 修改為 n8n 新增專案 URL
            title="新增專案"
            className="iframe"
          />
        )}
        {page === "edit" && (
          <iframe
            src="https://wuca-n8n.zeabur.app/form/2d84c57a-921d-4102-80b5-b966c1f82292"  // ← 修改為 n8n 編輯專案 URL
            title="編輯專案"
            className="iframe"
          />
        )}
        {page === "delete" && (
          <iframe
            src="https://wuca-n8n.zeabur.app/form/eecfa4f0-bbcc-4f4e-bd67-657c9cbbb20e"  // ← 修改為 n8n 刪除專案 URL
            title="刪除專案"
            className="iframe"
          />
        )}
      </div>
    </div>
  );
}

export default App;
