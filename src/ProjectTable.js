import React, { useEffect, useState } from "react";

// 新增的樣式元件，用於版面配置
const TableStyles = () => (
    <style>{`
    .table-page-container {
      display: flex;
      flex-direction: column;
      height: 100%; /* 填滿父層 (.content) 的高度 */
      width: 100%;
    }
    .table-controls {
      padding-bottom: 15px;
      margin-bottom: 15px;
      border-bottom: 1px solid #e0e0e0;
      flex-shrink: 0; /* 確保控制區塊高度固定不被壓縮 */
    }
    .table-controls h2 {
      font-size: 28px; /* ✅ 設定與 Sidebar 標題相同的大小 */
      margin-top: 0;
      margin-bottom: 0;
    }
    /* ✅ 這個 wrapper 現在負責捲動 */
    .table-wrapper {
      flex: 1;
      overflow: auto; /* ✅ 將捲動功能交給此容器，同時支援水平與垂直捲動 */
    }
    `}</style>
);

function ProjectTable() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("https://wuca-n8n.zeabur.app/webhook/table") // 替換成你的 production Webhook URL
      .then((res) => res.json())
      .then((data) => {
        setRows(data)
        setLoading(false);
      })
      .catch((err) => {
          console.error("讀取錯誤", err)
          setLoading(false);
      });
  }, []);

  if (loading) return <p>載入中...</p>;

  // 避免在沒有資料時出錯
  if (!rows.length) return <p>沒有專案資料</p>;

  const headers = Object.keys(rows[0]).filter((h) => h !== "row_number");

  return (
    <>
      <TableStyles />
      <div className="table-page-container">
        <div className="table-controls">
          <h2>專案總表</h2>
        </div>
        <div className="table-wrapper">
          <table border="1" style={{ width: "200%", textAlign: "center", borderCollapse: "collapse" , margin: 0}}>
            <thead>
              <tr>
                {headers.map((h) => (
                  <th key={h} style={{ padding: "10px", background: "#f0f0f0" , margin: 0}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx}>
                  {headers.map((h) => (
                    <td key={h} style={{ padding: "6px" , margin: 0}}>{row[h]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default ProjectTable;
