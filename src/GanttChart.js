import React, { useEffect, useRef, useState } from "react";
// import { DataSet, Timeline } from "vis-timeline/standalone"; // Removed - Will be loaded from CDN
// import "vis-timeline/styles/vis-timeline-graph2d.min.css"; // Removed - Will be loaded from CDN
// import "./index.css"; // Removed - Styles are self-contained

// ... (GanttStyles 樣式元件 ... existing code ... )
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
      flex-shrink: 0; 
    }
    .gantt-controls h2 {
      font-size: 28px;
      margin-top: 0;
      margin-bottom: 0px;
    }
    .timeline-wrapper {
      flex: 1;
      overflow-y: auto; 
      border: 1px solid #ddd;
      border-radius: 4px;
      position: relative; 
    }
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
        height: 100%; 
    }

    /* ✅ 新增：AI 分析結果的樣式 */
    .analysis-result-wrapper {
      flex-shrink: 0; /* 固定高度，不被壓縮 */
      background: #f9f9f9;
      border-top: 2px solid #e0e0e0;
      padding: 20px;
      margin-top: 20px;
      border-radius: 4px;
      position: relative; /* 為了定位關閉按鈕 */
    }
    .analysis-result-wrapper h3 {
      margin-top: 0;
      font-size: 20px;
      color: #333;
    }
    /* 讓 LLM 的換行 (\n) 生效 */
    .analysis-result-wrapper p {
      white-space: pre-wrap;
      font-size: 14px;
      line-height: 1.6;
      color: #222;
    }

    /* ✅ 新增：分析按鈕的樣式 */
    .analyze-btn {
        background: #007bff;
        color: white;
        border: none;
        padding: 4px 8px;
        font-size: 12px;
        border-radius: 4px;
        cursor: pointer;
        margin-left: 10px;
        transition: background-color 0.2s;
    }
    .analyze-btn:hover {
        background: #0056b3;
    }
    .analyze-btn:disabled {
        background: #c0c0c0;
        cursor: not-allowed;
    }

    /* ✅ 新增：關閉按鈕的樣式 */
    .analysis-close-btn {
      position: absolute;
      top: 15px; /* 調整位置 */
      right: 15px; /* 調整位置 */
      background: none;
      border: none;
      font-size: 24px;
      font-weight: bold;
      color: #999;
      cursor: pointer;
      line-height: 1;
      padding: 0;
    }
    .analysis-close-btn:hover {
      color: #333;
    }
    `}</style>
);


function GanttChart() {
  const ref = useRef(null);
  // ... (useState definitions ... existing code ... )
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [libraryLoaded, setLibraryLoaded] = useState(false); 
  const [visible, setVisible] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState("");
  const [analysisError, setAnalysisError] = useState("");

  const groupsRef = useRef(null);
  const timelineRef = useRef(null);

  // ... (useEffect for CDN loading ... existing code ... )
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

  // ... (useEffect for data fetching ... existing code ... )
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

  // ... (handleAnalysis function ... existing code ... )
  const handleAnalysis = async (projectName) => {
    if (isAnalyzing) return; // 防止重複點擊

    console.log("開始分析專案:", projectName);
    setIsAnalyzing(true);
    setAnalysisResult(`分析中，請稍候... (正在分析: ${projectName})`);
    setAnalysisError(""); // 清除上次的錯誤

    try {
      // ⚠️ 注意：請在 n8n 建立一個新的 Webhook，並將 URL 替換成你的
      const response = await fetch("https://wuca-n8n.zeabur.app/webhook/analysis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectName: projectName }), // 將專案名稱傳送給 n8n
      });

      if (!response.ok) {
        throw new Error(`伺服器錯誤: ${response.status}`);
      }

      const data = await response.json();

      // 假設 n8n 回傳的 JSON 結構為 { "analysis_text": "..." }
      if (data.analysis_text) {
        setAnalysisResult(data.analysis_text);
      } else {
        throw new Error("回傳資料格式錯誤，找不到 analysis_text 欄位");
      }

    } catch (err) {
      console.error("分析失敗:", err);
      setAnalysisError(`分析失敗: ${err.message}`);
      setAnalysisResult(""); // 清除分析中訊息
    } finally {
      setIsAnalyzing(false); // 解除鎖定
    }
  };

  // ✅ 新增：關閉分析視窗的函數
  const closeAnalysisBox = () => {
    setIsAnalyzing(false);
    setAnalysisResult("");
    setAnalysisError("");
  };

  useEffect(() => {
    if (!libraryLoaded || !rows.length || !ref.current) return;

    // ... (vis library loading ... existing code ... )
    const { DataSet, Timeline } = window.vis;
    const groups = new DataSet();
    const items = new DataSet();
    const projects = {};
    const today = new Date();

    // ... (validRows filtering ... existing code ... )
    const validRows = rows.filter(row => 
      row.專案ID && 
      row.專案名稱 && 
      row.任務名稱 &&
      row['開始日期'] && 
      row['預計完成日期']
    );

    // ... (data grouping by '專案名稱' ... existing code ... )
    validRows.forEach((row) => {
      const groupKey = row.專案名稱; 
      if (!projects[groupKey]) {
        projects[groupKey] = { tasks: [] };
      }
      projects[groupKey].tasks.push(row);
    });

    Object.entries(projects).forEach(([projKey, proj]) => {
      // ... (empty project check ... existing code ... )
      if (proj.tasks.length === 0) {
        return; 
      }

      const taskGroupIds = proj.tasks.map((_, i) => `${projKey}-taskgroup-${i}`);

      // ✅【修改 1】: 建立按鈕的 DOM 元素
      const buttonElement = document.createElement('button');
      buttonElement.className = 'analyze-btn';
      // ✅【修改 2】: 使用 dataset 傳遞專案名稱，不需要編碼
      buttonElement.dataset.project = projKey; 
      buttonElement.innerText = 'AI 分析';

      // 建立群組標題的 DOM 元素
      const textElement = document.createElement('div');
      textElement.style.textAlign = 'left';
      textElement.style.fontWeight = 'bold';
      textElement.innerText = projKey;

      // 建立最外層的容器 (用 Flex)
      const groupElement = document.createElement('div');
      groupElement.style.display = 'flex';
      groupElement.style.justifyContent = 'space-between';
      groupElement.style.alignItems = 'center';
      groupElement.style.paddingRight = '10px';
      
      groupElement.appendChild(textElement);
      groupElement.appendChild(buttonElement);


      // ✅【修改 3】: 父專案 group，content 直接傳入 DOM 元素
      groups.add({
        id: projKey, 
        content: groupElement, // ⬅️ 關鍵修改！
        nestedGroups: taskGroupIds,
        showNested: false, 
      });

      // ... (總進度 ... 程式碼無變動)
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
        id: `${projKey}-summary`, 
        group: projKey, 
        content: `<div style="text-align:center;">${projKey} (${totalPercent}%)</div>`, 
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

      // ... (子任務 ... 程式碼無變動)
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

        groups.add({
          id: `${projKey}-taskgroup-${idx}`, 
          content: `<div style="text-align:left;">${task["任務名稱"]}</div>`,
          style: "border:1px solid #666;font-size:14px; "
        });

        items.add({
          id: `${projKey}-task-${idx}`, 
          group: `${projKey}-taskgroup-${idx}`, 
          content: `<div style="text-align:center;">${task["任務名稱"]} (${progressPercent}%)</div>`,
          start: start,
          end: end,
          type: "range",
          style: gradientStyle + "border:1px solid #666;font-size:11px;"
        });
      });
    });

    // ... (options 和 timeline 建立 ... 程式碼無變動)
    const options = {
      stack: true,
      showCurrentTime: true,
      orientation: { axis: 'top' },
      margin: { item: 10, axis: 20 },
      zoomKey: "ctrlKey",
      verticalScroll: true, 
      editable: false,
    };

    const timeline = new Timeline(ref.current, items, groups, options);
    timelineRef.current = timeline;
    groupsRef.current = groups;

    // ✅【修改 4】: 事件委派監聽器
    const onTimelineClick = (event) => {
        const target = event.target;
        // 檢查是否點擊到 'analyze-btn'
        if (target.classList.contains('analyze-btn')) {
            // 禁用按鈕防止重複點擊
            target.disabled = true;
            target.innerText = "分析中...";

            // ✅【修改 5】: 直接從 dataset 讀取，不需解碼
            const projectName = target.dataset.project;
            if (projectName) {
                handleAnalysis(projectName).finally(() => {
                    // 分析完成後，無論成功失敗都恢復按鈕
                    target.disabled = false;
                    target.innerText = "AI 分析";
                });
            }
        }
    };

    // 將監聽器綁定在 timeline 的根元素上
    const timelineContainer = ref.current;
    timelineContainer.addEventListener('click', onTimelineClick);


    setTimeout(() => setVisible(true), 50);
    
    // ✅ 清理監聽器
    return () => {
      if (timeline) {
        timeline.destroy();
      }
      if (timelineContainer) {
        timelineContainer.removeEventListener('click', onTimelineClick);
      }
    };
  }, [rows, libraryLoaded]); // 移除了 isAnalyzing

  // ... (toggleGroups function ... 程式碼無變動 ... )
  const toggleGroups = (expand) => {
    if (!groupsRef.current || !timelineRef.current) return;

    const allGroups = groupsRef.current.get();
    for (const g of allGroups) {
        if (g.nestedGroups) {
          groupsRef.current.update({ id: g.id, showNested: expand });
        }
    }
    timelineRef.current.setGroups(groupsRef.current);
  };
  
  // ... (loading state ... 程式碼無變動 ... )
  if (loading || !libraryLoaded) return <p>載入甘特圖資源中...</p>;

  // ... (return JSX ... 程式碼無變動 ... )
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
                marginBottom: '20px' 
            }}
        >
            <h2>專案甘特圖</h2>
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

        {/* ✅【修改 4】: 新增的分析結果顯示區域 */}
        {(isAnalyzing || analysisResult || analysisError) && (
          <div className="analysis-result-wrapper">
            {/* ✅ 新增：關閉按鈕 */}
            <button className="analysis-close-btn" onClick={closeAnalysisBox}>
              &times;
            </button>

            <h3>專案 AI 分析</h3>
            
            {isAnalyzing && <p>分析中，請稍候... (AI 正在讀取並總結專案數據)</p>}
            
            {/* 顯示 LLM 回傳的分析結果 (字體已在 CSS 縮小) */}
            {analysisResult && <p>{analysisResult}</p>}

            {/* 顯示錯誤訊息 */}
            {analysisError && <p style={{ color: 'red' }}>{analysisError}</p>}
          </div>
        )}

      </div>
    </>
  );
}

export default GanttChart;