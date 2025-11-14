import React, { useEffect, useRef, useState } from "react";
// import { DataSet, Timeline } from "vis-timeline/standalone"; // Removed - Will be loaded from CDN
// import "vis-timeline/styles/vis-timeline-graph2d.min.css"; // Removed - Will be loaded from CDN
// import "./index.css"; // Removed - Styles are self-contained

// 新增的樣式元件，用於版面配置
const GanttStyles = () => (
    <style>{`
    .gantt-page-container {
      display: flex;
      flex-direction: column;
      height: 100%; /* 填滿父層 (.content) 的高度 */
      width: 100%;
    }
    .gantt-controls {
      padding-bottom: 15px;
      margin-bottom: 15px;
      border-bottom: 1px solid #e0e0e0;
      flex-shrink: 0; /* ✅ 確保控制區塊高度固定不被壓縮 */
    }
    .gantt-controls h2 {
      font-size: 28px;
      margin-top: 0;
      margin-bottom: 0px;
    }
    /* ✅ 修改：這個 wrapper 現在負責捲動 */
    .timeline-wrapper {
      flex: 1;
      overflow-y: auto; /* ✅ 修改：將捲動功能交給此容器，滾輪就會出現在右邊 */
      border: 1px solid #ddd;
      border-radius: 4px;
      position: relative; 
    }
    /* 覆蓋 vis-timeline 的預設尺寸計算 */
    .vis-timeline {
        border: none;
        padding-left: 0 !important;
    }
    .timeline-container.fade-in {
        opacity: 1;
        transition: opacity 0.8s ease-in;
    }
    .timeline-container {
        opacity: 0;
        height: 100%; /* 確保此容器填滿其父層 wrapper */
    }
    `}</style>
);


function GanttChart() {
  const ref = useRef(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [libraryLoaded, setLibraryLoaded] = useState(false); // 新增狀態來追蹤 CDN 函式庫是否載入
  const [visible, setVisible] = useState(false);

  const groupsRef = useRef(null);
  const timelineRef = useRef(null);

  // ✅ 動態載入 CDN 資源
  useEffect(() => {
    if (window.vis) {
      setLibraryLoaded(true);
      return;
    }

    // 載入 CSS
    const cssLink = document.createElement("link");
    cssLink.rel = "stylesheet";
    cssLink.href = "https://unpkg.com/vis-timeline@latest/styles/vis-timeline-graph2d.min.css";
    document.head.appendChild(cssLink);
    
    // 載入 JS
    const script = document.createElement("script");
    script.src = "https://unpkg.com/vis-timeline@latest/standalone/umd/vis-timeline-graph2d.min.js";
    script.onload = () => {
      setLibraryLoaded(true);
    };
    script.onerror = () => {
        console.error("無法載入 vis-timeline 函式庫");
        setLoading(false);
    }
    document.body.appendChild(script);

    return () => {
        document.head.removeChild(cssLink);
        document.body.removeChild(script);
    }
  }, []);

  useEffect(() => {
    fetch("https://wuca-n8n.zeabur.app/webhook/table")
      .then((res) => res.json())
      .then((data) => {
        setRows(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("讀取錯誤", err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    // ✅ 確保函式庫已載入、資料已取得，且 ref 存在
    if (!libraryLoaded || !rows.length || !ref.current) return;

    // ✅ 從 window.vis 取得 DataSet 和 Timeline
    const { DataSet, Timeline } = window.vis;

    const groups = new DataSet();
    const items = new DataSet();
    const projects = {};
    const today = new Date();

    // ✅【修改 1】: 在這裡過濾掉無效的行 (沒有ID、名稱或日期的)
    // 這樣可以防止無效資料汙染計算
    const validRows = rows.filter(row => 
      row.專案ID && 
      row.專案名稱 && 
      row.任務名稱 &&
      row['開始日期'] && 
      row['預計完成日期']
    );

    // ✅ 使用 validRows 進行後續處理
    validRows.forEach((row) => {
      if (!projects[row.專案ID]) {
        projects[row.專案ID] = {
          專案名稱: row.專案名稱,
          tasks: [],
        };
      }
      projects[row.專案ID].tasks.push(row);
    });

    Object.entries(projects).forEach(([projId, proj]) => {
      
      // ✅【修改 2】: 如果一個專案在過濾後沒有任何任務了，就跳過它
      // 這可以防止顯示如截圖中 (0%) 旁邊的空白列
      if (proj.tasks.length === 0) {
        return; // 略過這個空白的專案群組
      }

      const taskGroupIds = proj.tasks.map((_, i) => `${projId}-taskgroup-${i}`);

      // 父專案 group
      groups.add({
        id: projId,
        content: `<div style="text-align:center;"><b>${proj.專案名稱}</b></div>`,
        nestedGroups: taskGroupIds,
        showNested: false, // 預設收合
      });

      // 總進度
      const totalProgress =
        proj.tasks.reduce((sum, t) => sum + Number(t["進度百分比"] || 0), 0) /
        proj.tasks.length;

      const minStart = new Date(
        Math.min(...proj.tasks.map((t) => new Date(t["開始日期"])))
      );
      const maxEnd = new Date(
        Math.max(...proj.tasks.map((t) => new Date(t["預計完成日期"])))
      );

      const totalPercent = Math.round(totalProgress * 100);

      items.add({
        id: `${projId}-summary`,
        group: projId,
        content: `<div style="text-align:center;">${proj.專案名稱} (${totalPercent}%)</div>`,
        start: minStart,
        end: maxEnd,
        type: "range",
        style: `
          background: linear-gradient(
            to right,
            rgba(200,198,198,0.9) ${totalPercent}%,
            rgba(200,198,198,0.4) ${totalPercent}%
          );
          border:1px solid #666;
          font-size:14px;
          font-weight:bold;
          width: 0 !important;
        `,
      });

      // 子任務
      proj.tasks.forEach((task, idx) => {
        const start = new Date(task["開始日期"]);
        const end = new Date(task["預計完成日期"]);
        const actualProgress = Number(task["進度百分比"] || 0);
        const progressPercent = Math.round(actualProgress * 100);

        let gradientStyle;
        if (progressPercent === 100) {
          gradientStyle = `
            background: linear-gradient(
              to right,
              rgba(0,200,0,0.7) ${progressPercent}%,
              rgba(144,238,144,0.3) ${progressPercent}%
            );
          `;
        } else if (end < today && progressPercent < 100) {
          gradientStyle = `
            background: linear-gradient(
              to right,
              rgba(255,99,71,0.6) ${progressPercent}%,
              rgba(255,182,193,0.2) ${progressPercent}%
            );
          `;
        } else {
          gradientStyle = `
            background: linear-gradient(
              to right,
              rgba(91,170,255,0.6) ${progressPercent}%,
              rgba(0,123,255,0.15) ${progressPercent}%
            );
          `;
        }

        // 子任務 group
        groups.add({
          id: `${projId}-taskgroup-${idx}`,
          content: `<div style="text-align:left;">${task["任務名稱"]}</div>`,
          style: "border:1px solid #666;font-size:14px; "
        });

        // 子任務 item
        items.add({
          id: `${projId}-task-${idx}`,
          group: `${projId}-taskgroup-${idx}`,
          content: `<div style="text-align:center;">${task["任務名稱"]} (${progressPercent}%)</div>`,
          start: start,
          end: end,
          type: "range",
          style: gradientStyle + "border:1px solid #666;font-size:11px;"
        });
      });
    });

    const options = {
      stack: true,
      showCurrentTime: true,
      orientation: {
        axis: 'top'
      },
      margin: { item: 10, axis: 20 },
      zoomKey: "ctrlKey",
      verticalScroll: true, // ✅ 修改：關閉內部滾輪
      editable: false,
      // ✅ 移除 height: '100%'，讓甘特圖自然撐開高度
    };

    const timeline = new Timeline(ref.current, items, groups, options);
    timelineRef.current = timeline;
    groupsRef.current = groups;

    setTimeout(() => setVisible(true), 50);
    return () => {
      if (timeline) {
        timeline.destroy();
      }
    };
  }, [rows, libraryLoaded]); // ✅ 將 libraryLoaded 加入依賴

  const toggleGroups = (expand) => {
    if (!groupsRef.current || !timelineRef.current) return;

    // 逐一更新每個 group
    const allGroups = groupsRef.current.get();

    for (const g of allGroups) {
        if (g.nestedGroups) {
        groupsRef.current.update({ id: g.id, showNested: expand });
        }
    }

    // 再呼叫一次刷新
    timelineRef.current.setGroups(groupsRef.current);
  };
  
  // ✅ 修改載入中訊息
  if (loading || !libraryLoaded) return <p>載入甘特圖資源中...</p>;

  // 使用新的版面配置結構
  return (
    <>
      <GanttStyles />
      <div className="gantt-page-container">
        <div 
            className="gantt-controls" 
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px' // (可選) 加上一些和下方內容的間距
            }}
        >
            <h2>專案甘特圖</h2>

            {/* ✅ 按鈕直接放在這裡，不需要外層 div */}
            <button onClick={() => toggleGroups(false)}>
                全部收合
            </button>
        </div>
        <div className="timeline-wrapper">
            <div
                ref={ref}
                className={`timeline-container ${visible ? "fade-in" : ""}`}
            />
        </div>
      </div>
    </>
  );
}

export default GanttChart;