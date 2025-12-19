import React, { useEffect, useRef, useState } from "react";
import { Network } from "vis-network";
import { DataSet } from "vis-data";
import "vis-network/styles/vis-network.css";

// ✅ CSS 樣式常數，只保留 vis-network 需要的部分
const componentStyles = `
  .vis-current-time {
    background-color: transparent !important;
    border-left: 2px dashed rgb(255, 214, 10) !important;
    width: 0 !important;
  }
  .vis-group-level-1,
  .vis-group-level-1 .vis-inner,
  .vis-group-level-2,
  .vis-group-level-2 .vis-inner {
    padding-left: 0 !important;
    margin-left: 0 !important;
  }
  .vis-panel.vis-left {
    padding: 0 !important;
    margin: 0 !important;
  }
  .vis-group {
    margin: 0 !important;
    padding: 0 !important;
  }
`;

function Neo4jGraph() {
  const containerRef = useRef(null);
  const modalRef = useRef(null); // ✅ 新增 modal 的 ref
  const [rows, setRows] = useState([]);
  const [modalContent, setModalContent] = useState(null);

  useEffect(() => {
    fetch("https://<your-n8n-url>/webhook/table") // ← 修改為 n8n 資料 URL
      .then((res) => res.json())
      .then((data) => setRows(data))
      .catch((err) => console.error("讀取錯誤", err));
  }, []);

  // ✅ 新增 Hook：處理點擊視窗外部來關閉
  useEffect(() => {
    function handleClickOutside(event) {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setModalContent(null);
      }
    }
    // 當 modal 打開時，才監聽點擊事件
    if (modalContent) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    // cleanup function，當元件卸載或 modal 關閉時，移除監聽
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [modalContent]); // 這個 effect 會在 modalContent 改變時重新執行

  useEffect(() => {
    if (!rows.length || !containerRef.current) return;

    const nodes = [];
    const edges = [];

    rows.forEach((r) => {
      if (!nodes.find((n) => n.id === r["專案ID"])) {
        nodes.push({
          id: r["專案ID"],
          label: r["專案名稱"],
          group: "project",
          shape: "box",
          color: "#FFD966",
        });
      }
      if (!nodes.find((n) => n.id === r["成員姓名"])) {
        nodes.push({
          id: r["成員姓名"],
          label: r["成員姓名"],
          group: "member",
          shape: "ellipse",
          color: "#9FC5E8",
        });
      }
      edges.push({
        from: r["專案ID"],
        to: r["成員姓名"],
        label: "▶︎",
      });
    });

    const data = { nodes: new DataSet(nodes), edges: new DataSet(edges) };
    const options = {
      nodes: { font: { size: 26, color: "#333" }, borderWidth: 1 },
      edges: {
        arrows: { to: { enabled: false } },
        font: { align: "middle", size: 12 },
        color: { color: "#666" },
        smooth: true,
      },
      physics: {
        enabled: true,
        solver: "forceAtlas2Based",
        stabilization: { iterations: 200 },
        repulsion: {
          centralGravity: 0.02,
          springLength: 250,
          springConstant: 0.5,
          nodeDistance: 150,
          damping: 0.09,
        },
      },
      interaction: { hover: true, tooltipDelay: 200 },
    };

    const network = new Network(containerRef.current, data, options);

    network.on("click", (params) => {
      if (!params.nodes.length) return;
      const nodeId = params.nodes[0];
      const node = data.nodes.get(nodeId);

      if (node.group === "project") {
        const members = {};
        rows
          .filter((r) => r["專案ID"] === nodeId)
          .forEach((r) => {
            if (!members[r["成員姓名"]]) members[r["成員姓名"]] = [];
            members[r["成員姓名"]].push(r["任務名稱"]);
          });
        setModalContent({ type: "project", name: node.label, members });
      } else if (node.group === "member") {
        const projects = {};
        rows
          .filter((r) => r["成員姓名"] === nodeId)
          .forEach((r) => {
            if (!projects[r["專案名稱"]]) projects[r["專案名稱"]] = [];
            projects[r["專案名稱"]].push(r["任務名稱"]);
          });
        setModalContent({ type: "member", name: node.label, projects });
      }
    });
  }, [rows]);

  return (
    <>
      <style>{componentStyles}</style>
      
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h2 style={{ fontSize: '28px', margin: 0 }}>專案關係圖</h2>
            <p style={{ color: '#888', fontSize: '14px', margin: 0, fontStyle: 'italic' }}>
                點擊節點以查看更詳細內容
            </p>
        </div>
        
        <div
          ref={containerRef}
          style={{ height: "600px", border: "1px solid #ccc", borderRadius: "8px" }}
        />

        {modalContent && (
          // ✅ 加上 ref={modalRef}
          <div
            ref={modalRef}
            style={{
              position: "fixed",
              top: "15%",
              left: "50%",
              transform: "translateX(-50%)",
              background: "#fff",
              padding: "0px 15px 15px 15px",
              border: "1px solid #666",
              borderRadius: "6px",
              zIndex: 1000,
              width: "450px",
              display: "flex",
              flexDirection: "column",
              fontSize: "14px",
              boxShadow: "0 5px 15px rgba(0,0,0,0.3)", // 加上陰影讓視窗更突出
            }}
          >
            <h3 style={{ marginBottom: "10px", fontSize: "28px" }}>
              {modalContent.name}
              {modalContent.type === "member" && (
                <div style={{ fontSize: "14px", color: "#666", marginTop: "4px" }}>
                  {rows.find(r => r["成員姓名"] === modalContent.name)?.["部門"] || "未知部門"}
                </div>
              )}
            </h3>

            <div style={{ display: "flex", flexDirection: "row", gap: "1px" }}>
              <div style={{ flex: 1.5, overflowY: "auto", maxHeight: "250px" }}>
                {modalContent.type === "project"
                  ? Object.entries(modalContent.members).map(([member, tasks]) => (
                      <div key={member} style={{ marginBottom: "10px" }}>
                        <b style={{ color: "#006effff", fontSize: "16px" }}>{member}</b>
                        <div style={{ fontSize: "12px", color: "#555" }}>
                          {rows.find(r => r["成員姓名"] === member)?.["部門"]}
                        </div>
                        <ul style={{ margin: "4px 0 0 15px", padding: 0, listStyle: "none" }}>
                          {tasks.map((taskName, i) => {
                            const row = rows.find(r => r["任務名稱"] === taskName && r["成員姓名"] === member && r["專案名稱"] === modalContent.name);
                            if (!row) return null;
                            let color = "#ccc";
                            if (row["任務狀態"] === "完成") color = "green";
                            else if (row["任務狀態"] === "進行中") color = "orange";
                            else if (row["任務狀態"] === "延遲") color = "red";
                            return (
                              <li key={i} style={{ margin: "6px 0", fontSize: "13px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                  <span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "50%", backgroundColor: color }}></span>
                                  <b>{row["任務名稱"]}</b>
                                </div>
                                <div style={{ marginLeft: "15px", fontSize: "12px", color: "#333" }}>
                                  <div><b>描述：</b>{row["任務描述"]}</div>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))
                  : Object.entries(modalContent.projects).map(([proj, tasks]) => (
                      <div key={proj} style={{ marginBottom: "10px" }}>
                        <b style={{ color: "#006effff", fontSize: "16px" }}>{proj}</b>
                        <ul style={{ margin: "4px 0 0 15px", padding: 0, listStyle: "none" }}>
                          {tasks.map((taskName, i) => {
                            const row = rows.find(r => r["任務名稱"] === taskName && r["專案名稱"] === proj && r["成員姓名"] === modalContent.name);
                            if (!row) return null;
                            let color = "#ccc";
                            if (row["任務狀態"] === "完成") color = "green";
                            else if (row["任務狀態"] === "進行中") color = "orange";
                            else if (row["任務狀態"] === "延遲") color = "red";
                            return (
                              <li key={i} style={{ margin: "6px 0", fontSize: "13px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                  <span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "50%", backgroundColor: color }}></span>
                                  <b>{row["任務名稱"]}</b>
                                </div>
                                <div style={{ marginLeft: "15px", fontSize: "12px", color: "#333" }}>
                                  <div><b>描述：</b>{row["任務描述"]}</div>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))}
              </div>

              <div style={{ width: "250px", height: "200px" }}>
                <GraphView content={modalContent} />
              </div>
            </div>

            <button
              onClick={() => setModalContent(null)}
              style={{ marginTop: "10px", fontSize: "13px", padding: "4px 10px", alignSelf: 'center' }}
            >
              關閉
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// 小圖（Top-down 層級顯示）
const GraphView = ({ content }) => {
  // ... (此元件未變動)
  const graphRef = useRef(null);

  useEffect(() => {
    if (!content || !graphRef.current) return;

    let nodes = [];
    let edges = [];

    if (content.type === "project") {
      const projId = content.name;
      nodes.push({ id: projId, label: projId, group: "project", shape: "box", color: "#FFD966" });
      Object.entries(content.members).forEach(([member, tasks]) => {
        if (!nodes.find(n => n.id === member)) {
          nodes.push({ id: member, label: member, group: "member", shape: "ellipse", color: "#9FC5E8", font: { size: 13 } });
        }
        edges.push({ from: projId, to: member });
      });
    } else if (content.type === "member") {
      const memberId = content.name;
      nodes.push({ id: memberId, label: memberId, group: "member", shape: "ellipse", color: "#9FC5E8" });
      Object.entries(content.projects).forEach(([proj, tasks]) => {
        if (!nodes.find(n => n.id === proj)) {
          nodes.push({ id: proj, label: proj, group: "project", shape: "box", color: "#FFD966", font: { size: 13 } });
        }
        edges.push({ from: memberId, to: proj });
      });
    }

    const data = { nodes: new DataSet(nodes), edges: new DataSet(edges) };
    const options = {
      layout: {
        hierarchical: {
          enabled: true,
          direction: "UD",
          sortMethod: "directed",
          levelSeparation: 80,
          nodeSpacing: 120,
        },
      },
      nodes: { font: { size: 16 } },
      edges: { arrows: { to: false }, smooth: false },
      physics: false,
    };

    new Network(graphRef.current, data, options);
  }, [content]);

  return <div ref={graphRef} style={{ width: "100%", height: "100%" }} />;
};

export default Neo4jGraph;