import React, { useEffect, useRef, useState } from "react";
import { Network } from "vis-network";
import { DataSet } from "vis-data";
import "vis-network/styles/vis-network.css";

function ProjectGraph() {
  const containerRef = useRef(null);
  const [rows, setRows] = useState([]);
  const [modalContent, setModalContent] = useState(null);

  useEffect(() => {
    // 🚀 讀取 n8n 提供的 table
    fetch("https://wuca-n8n.zeabur.app/webhook/table")
      .then((res) => res.json())
      .then((data) => setRows(data))
      .catch((err) => console.error("讀取錯誤", err));
  }, []);

  useEffect(() => {
    if (!rows.length || !containerRef.current) return;

    const nodes = [];
    const edges = [];

    rows.forEach((r, idx) => {
      // 專案節點
      if (!nodes.find((n) => n.id === r["專案ID"])) {
        nodes.push({
          id: r["專案ID"],
          label: r["專案名稱"],
          group: "project",
          shape: "box",
          color: "#FFD966",
        });
      }

      // 人員節點
      if (!nodes.find((n) => n.id === r["成員姓名"])) {
        nodes.push({
          id: r["成員姓名"],
          label: r["成員姓名"],
          group: "member",
          shape: "ellipse",
          color: "#9FC5E8",
        });
      }

      // 邊：專案 → 人員
      edges.push({
        from: r["專案ID"],
        to: r["成員姓名"],
        label: "參與",
      });
    });

    const data = { nodes: new DataSet(nodes), edges: new DataSet(edges) };
    const options = {
      nodes: {
        font: { size: 20, color: "#333" },
        borderWidth: 1,
      },
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
            centralGravity: 0.02,   // 中心吸引力
            springLength: 150,      // 節點間的最小距離（加大可以避免重疊）
            springConstant: 0.05,   // 邊的拉力
            nodeDistance: 50,      // 節點間距離（重要！）
            damping: 0.09,
        },
      },
      interaction: { hover: true, tooltipDelay: 200 },
    };

    const network = new Network(containerRef.current, data, options);

    // 點擊事件 → 打開 modal
    network.on("click", (params) => {
      if (!params.nodes.length) return;
      const nodeId = params.nodes[0];
      const node = nodes.find((n) => n.id === nodeId);

      if (node.group === "project") {
        // 該專案下的成員與任務
        const members = {};
        rows
          .filter((r) => r["專案ID"] === nodeId)
          .forEach((r) => {
            if (!members[r["成員姓名"]]) members[r["成員姓名"]] = [];
            members[r["成員姓名"]].push(r["任務名稱"]);
          });
        setModalContent({ type: "project", name: node.label, members });
      } else if (node.group === "member") {
        // 該成員的專案與任務
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
    <div>
      <h2>專案圖</h2>
      <div
        ref={containerRef}
        style={{ height: "600px", border: "1px solid #ccc", borderRadius: "8px" }}
      />

      {/* 彈出視窗 */}
        {modalContent && (
        <div
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
            width: "450px",   // ✅ 縮小寬度
            display: "flex",
            flexDirection: "column",
            fontSize: "14px", // ✅ 字體縮小
            }}
        >
            <h3 style={{ marginBottom: "10px", fontSize: "28px" }}>
                {modalContent.type === "project"
                    ? `${modalContent.name}`
                    : `${modalContent.name}`}
                {modalContent.type === "member" && (
                    <div style={{ fontSize: "14px", color: "#666", marginTop: "4px" }}>
                        {rows.find(r => r["成員姓名"] === modalContent.name)?.["部門"] || "未知部門"}
                    </div>
                )}
            </h3>


            <div style={{ display: "flex", flexDirection: "row", gap: "1px" }}>
            {/* 左邊文字檢視 */}
            <div style={{ flex: 1.5, overflowY: "auto", maxHeight: "250px" }}>
            {modalContent.type === "project"
                ? Object.entries(modalContent.members).map(([member, tasks]) => (
                    <div key={member} style={{ marginBottom: "10px" }}>
                    <b style={{ color: "#006effff", fontSize: "16px" }}>{member}</b>

                    {/* 部門 (換行小字) */}
                    <div style={{ fontSize: "12px", color: "#555", marginLeft: "0px" }}>
                        {rows.find(r => r["成員姓名"] === member)?.["部門"]}
                    </div>
                    <ul style={{ margin: "4px 0 0 15px", padding: 0, listStyle: "none" }}>
                        {tasks.map((t, i) => {
                        // 找出完整 row
                        const row = rows.find(r => r["任務名稱"] === t && r["成員姓名"] === member);
                        if (!row) return null;

                        // 狀態顏色
                        let color = "#ccc";
                        if (row["任務狀態"] === "完成") color = "green";
                        else if (row["任務狀態"] === "進行中") color = "orange";
                        else if (row["任務狀態"] === "延遲") color = "red";

                        return (
                            <li key={i} style={{ margin: "6px 0", fontSize: "13px" }}>
                            {/* 任務名稱 + 狀態點 */}
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{
                                display: "inline-block",
                                width: "10px",
                                height: "10px",
                                borderRadius: "50%",
                                backgroundColor: color
                                }}></span>
                                <b>{row["任務名稱"]}</b>
                            </div>
                            
                            {/* 額外資訊 */}
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
                        {tasks.map((t, i) => {
                        const row = rows.find(r => r["任務名稱"] === t && r["專案名稱"] === proj);
                        if (!row) return null;

                        let color = "#ccc";
                        if (row["任務狀態"] === "完成") color = "green";
                        else if (row["任務狀態"] === "進行中") color = "orange";
                        else if (row["任務狀態"] === "延遲") color = "red";

                        return (
                            <li key={i} style={{ margin: "6px 0", fontSize: "13px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{
                                display: "inline-block",
                                width: "10px",
                                height: "10px",
                                borderRadius: "50%",
                                backgroundColor: color
                                }}></span>
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
            }
            </div>


            {/* 右邊小圖檢視 */}
            <div
                style={{
                width: "250px",   // ✅ 縮小圖區
                height: "200px",
                //border: "1px solid #ccc",
                }}
            >
                <GraphView content={modalContent} />
            </div>
            </div>

            <button
            onClick={() => setModalContent(null)}
            style={{ marginTop: "10px", fontSize: "13px", padding: "4px 10px" }}
            >
            關閉
            </button>
        </div>
        )}

    </div>
  );
}

// 小圖（Top-down 層級顯示）
const GraphView = ({ content }) => {
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
        nodes.push({ id: member, label: member, group: "member", shape: "ellipse", color: "#9FC5E8" , font: { size: 13 }});
        }
        edges.push({ from: projId, to: member });
    });
    } else if (content.type === "member") {
        const memberId = content.name;
        nodes.push({ id: memberId, label: memberId, group: "member", shape: "ellipse", color: "#9FC5E8" });

        Object.entries(content.projects).forEach(([proj, tasks]) => {
            if (!nodes.find(n => n.id === proj)) {
            nodes.push({ id: proj, label: proj, group: "project", shape: "box", color: "#FFD966" , font: { size: 13 }});
            }
            edges.push({ from: memberId, to: proj });
            // ❌ 不再加任務 node
        });
    }


    const data = { nodes: new DataSet(nodes), edges: new DataSet(edges) };
    const options = {
      layout: {
        hierarchical: {
          enabled: true,
          direction: "UD", // top → down
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

export default ProjectGraph;
