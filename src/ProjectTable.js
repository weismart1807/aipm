import React, { useEffect, useState } from "react";

function ProjectTable() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    fetch("https://wuca-n8n.zeabur.app/webhook/table") // 替換成你的 production Webhook URL
      .then((res) => res.json())
      .then((data) => setRows(data))
      .catch((err) => console.error("讀取錯誤", err));
  }, []);

  if (!rows.length) return <p>載入中...</p>;

const headers = Object.keys(rows[0]).filter((h) => h !== "row_number");

  return (
    <div style={{ overflowX: "auto" }}>
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
  );
}

export default ProjectTable;
