import React, { useEffect, useRef, useState } from "react";
// import { DataSet, Timeline } from "vis-timeline/standalone"; 
// import "vis-timeline/styles/vis-timeline-graph2d.min.css"; 
// import "./index.css"; 

const GanttStyles = () => (
    <style>{`
    .gantt-page-container {
      display: flex;
      flex-direction: column;
      height: 100%; 
      width: 100%;
      position: relative; /* 為了 Modal 定位 */
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

    /* AI 分析結果樣式 (維持原樣) */
    .analysis-result-wrapper {
      flex-shrink: 0; 
      background: #f9f9f9;
      border-top: 2px solid #e0e0e0;
      padding: 20px;
      margin-top: 20px;
      border-radius: 4px;
      position: relative; 
    }
    .analysis-result-wrapper h3 {
      margin-top: 0;
      font-size: 20px;
      color: #333;
    }
    .analysis-result-wrapper p {
      white-space: pre-wrap;
      font-size: 14px;
      line-height: 1.6;
      color: #222;
    }
    .analysis-close-btn {
      position: absolute;
      top: 15px; 
      right: 15px; 
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

    /* 按鈕共用樣式 */
    .action-btn {
        color: white;
        border: none;
        padding: 4px 8px;
        font-size: 12px;
        border-radius: 4px;
        cursor: pointer;
        margin-left: 10px;
        transition: background-color 0.2s;
    }

    /* ✅ 修改：原本的分析按鈕樣式 */
    .analyze-btn {
        background: #61adffff;
    }
    .analyze-btn:hover {
        background: #0056b3;
    }
    .analyze-btn:disabled {
        background: #c0c0c0;
        cursor: not-allowed;
    }

    /* ✅ 新增：灰色編輯按鈕樣式 */
    .edit-btn {
        background: #888888; /* 灰色 */
    }
    .edit-btn:hover {
        background: #555555;
    }

    /* ✅ 新增：編輯 Modal 樣式 */
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }
    .modal-content {
        background: white;
        padding: 20px;
        border-radius: 8px;
        width: 80%;
        max-width: 900px;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 4px 10px rgba(0,0,0,0.2);
    }
    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        border-bottom: 1px solid #eee;
        padding-bottom: 10px;
    }
    .modal-footer {
        margin-top: 20px;
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        border-top: 1px solid #eee;
        padding-top: 10px;
    }
    
    /* 表格樣式 */
    .edit-table {
        width: 100%;
        border-collapse: collapse;
    }
    .edit-table th, .edit-table td {
        border: 1px solid #ddd;
        padding: 8px;
        text-align: left;
    }
    .edit-table th {
        background-color: #f2f2f2;
    }
    .edit-input {
        width: 100%;
        padding: 5px;
        box-sizing: border-box;
    }
    .delete-row-btn {
        background: #ff4d4d;
        color: white;
        border: none;
        padding: 5px 10px;
        border-radius: 4px;
        cursor: pointer;
    }
    .add-task-btn {
        background: #28a745;
        color: white;
        border: none;
        padding: 8px 15px;
        border-radius: 4px;
        cursor: pointer;
        margin-top: 10px;
    }
    .submit-btn {
        background: #007bff;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
    }
    .cancel-btn {
        background: #6c757d;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
    }
    `}</style>
);


function GanttChart() {
  const ref = useRef(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [libraryLoaded, setLibraryLoaded] = useState(false); 
  const [visible, setVisible] = useState(false);
  
  // AI 分析相關 State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState("");
  const [analysisError, setAnalysisError] = useState("");

  // ✅ 新增：編輯功能相關 State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProjectName, setEditingProjectName] = useState("");
  const [editingTasks, setEditingTasks] = useState([]); // 存放目前正在編輯的任務列表

  const groupsRef = useRef(null);
  const timelineRef = useRef(null);

  // 1. 載入 CDN (維持原樣)
  useEffect(() => {
    if (window.vis) {
      setLibraryLoaded(true);
      return;
    }
    const cssLink = document.createElement("link");
    cssLink.rel = "stylesheet";
    cssLink.href = "https://unpkg.com/vis-timeline@latest/styles/vis-timeline-graph2d.min.css";
    document.head.appendChild(cssLink);
    
    const script = document.createElement("script");
    script.src = "https://unpkg.com/vis-timeline@latest/standalone/umd/vis-timeline-graph2d.min.js";
    script.onload = () => setLibraryLoaded(true);
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

  // 2. 讀取資料 API (抽離成函數以便 reload)
  const fetchTableData = () => {
    setLoading(true);
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
  };

  useEffect(() => {
    fetchTableData();
  }, []);

  // AI 分析功能 (維持原樣)
  const handleAnalysis = async (projectName) => {
    if (isAnalyzing) return; 
    setIsAnalyzing(true);
    setAnalysisResult(`分析中，請稍候... (正在分析: ${projectName})`);
    setAnalysisError(""); 
    try {
      const response = await fetch("https://wuca-n8n.zeabur.app/webhook/analysis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectName: projectName }), 
      });
      if (!response.ok) throw new Error(`伺服器錯誤: ${response.status}`);
      const data = await response.json();
      if (data.analysis_text) {
        setAnalysisResult(data.analysis_text);
      } else {
        throw new Error("回傳資料格式錯誤");
      }
    } catch (err) {
      setAnalysisError(`分析失敗: ${err.message}`);
      setAnalysisResult(""); 
    } finally {
      setIsAnalyzing(false); 
    }
  };
  const closeAnalysisBox = () => {
    setIsAnalyzing(false);
    setAnalysisResult("");
    setAnalysisError("");
  };

  // ✅ 新增：處理點擊「編輯」按鈕
  const handleEditClick = (projectName) => {
    // 1. 找出屬於該專案的所有任務
    const projectTasks = rows.filter(r => r.專案名稱 === projectName);
    
    // 2. 深拷貝一份資料到 State，避免直接修改 rows 影響顯示
    setEditingTasks(JSON.parse(JSON.stringify(projectTasks)));
    setEditingProjectName(projectName);
    setShowEditModal(true);
  };

  // ✅ 新增：處理表單欄位變更
  const handleTaskChange = (index, field, value) => {
    const newTasks = [...editingTasks];
    newTasks[index][field] = value;
    setEditingTasks(newTasks);
  };

  // ✅ 新增：處理刪除任務
  const handleDeleteTask = (index) => {
    if (window.confirm("確定要刪除此任務嗎？")) {
        const newTasks = [...editingTasks];
        newTasks.splice(index, 1);
        setEditingTasks(newTasks);
    }
  };

  // ✅ 新增：處理新增任務
  const handleAddTask = () => {
    const newTask = {
        "專案ID": editingTasks.length > 0 ? editingTasks[0]["專案ID"] : "", // 沿用專案ID
        "專案名稱": editingProjectName,
        "任務名稱": "新任務",
        "任務狀態": "進行中",
        "進度百分比": "0%",
        "開始日期": new Date().toISOString().split('T')[0],
        "預計完成日期": new Date().toISOString().split('T')[0],
        "部門": editingTasks.length > 0 ? editingTasks[0]["部門"] : "",
        "成員姓名": ""
    };
    setEditingTasks([...editingTasks, newTask]);
  };

  // ✅ 新增：提交編輯 (Submit)
  const handleSubmitEdit = async () => {
    if (!confirm("確定要更新專案資料嗎？")) return;

    try {
        // 這裡假設你的 n8n 有一個用來更新資料的 webhook
        // 你需要將此 URL 替換成你實際處理 "Update" 的 Webhook URL
        const updateUrl = "https://wuca-n8n.zeabur.app/webhook/update-project"; 

        const response = await fetch(updateUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                projectName: editingProjectName,
                tasks: editingTasks // 傳送修改後的完整任務列表
            })
        });

        if (response.ok) {
            alert("更新成功！");
            setShowEditModal(false);
            fetchTableData(); // 重新讀取後台資料以更新畫面
        } else {
            alert("更新失敗，請檢查後台。");
        }
    } catch (error) {
        console.error("Update error:", error);
        alert("連線錯誤");
    }
  };


  // 渲染 Vis-timeline
  useEffect(() => {
    if (!libraryLoaded || !rows.length || !ref.current) return;

    const { DataSet, Timeline } = window.vis;
    const groups = new DataSet();
    const items = new DataSet();
    const projects = {};
    const today = new Date();

    const validRows = rows.filter(row => 
      row.專案ID && row.專案名稱 && row.任務名稱 && row['開始日期'] && row['預計完成日期']
    );

    validRows.forEach((row) => {
      const groupKey = row.專案名稱; 
      if (!projects[groupKey]) {
        projects[groupKey] = { tasks: [] };
      }
      projects[groupKey].tasks.push(row);
    });

    Object.entries(projects).forEach(([projKey, proj]) => {
      if (proj.tasks.length === 0) return; 

      const taskGroupIds = proj.tasks.map((_, i) => `${projKey}-taskgroup-${i}`);

      // 建立 "AI 分析" 按鈕
      const aiBtn = document.createElement('button');
      aiBtn.className = 'action-btn analyze-btn';
      aiBtn.dataset.project = projKey; 
      aiBtn.innerText = 'AI 分析';

      // ✅【修改】建立 "編輯" 灰色按鈕
      const editBtn = document.createElement('button');
      editBtn.className = 'action-btn edit-btn';
      editBtn.dataset.project = projKey;
      editBtn.innerText = '編輯專案';

      // 標題
      const textElement = document.createElement('span');
      textElement.style.fontWeight = 'bold';
      textElement.innerText = projKey;

      // 按鈕容器
      const btnContainer = document.createElement('div');
      btnContainer.appendChild(aiBtn);
      btnContainer.appendChild(editBtn); // 加入編輯按鈕

      // 群組容器
      const groupElement = document.createElement('div');
      groupElement.style.display = 'flex';
      groupElement.style.justifyContent = 'space-between';
      groupElement.style.alignItems = 'center';
      groupElement.style.paddingRight = '10px';
      
      groupElement.appendChild(textElement);
      groupElement.appendChild(btnContainer);

      groups.add({
        id: projKey, 
        content: groupElement, 
        nestedGroups: taskGroupIds,
        showNested: false, 
      });

      // 計算進度 (維持原樣)
      const totalProgress = proj.tasks.reduce((sum, t) => {
          // 處理 "50%" 字串轉數字
          let val = t["進度百分比"];
          if (typeof val === 'string') val = parseFloat(val.replace('%', ''));
          return sum + (Number(val) || 0);
      }, 0) / proj.tasks.length;

      const minStart = new Date(Math.min(...proj.tasks.map((t) => new Date(t["開始日期"]))));
      const maxEnd = new Date(Math.max(...proj.tasks.map((t) => new Date(t["預計完成日期"]))));
      const totalPercent = Math.round(totalProgress); // 這裡假設 input 是 0-100

      items.add({
        id: `${projKey}-summary`, 
        group: projKey, 
        content: `<div style="text-align:center;">${projKey} (${totalPercent}%)</div>`, 
        start: minStart,
        end: maxEnd,
        type: "range",
        style: `
          background: linear-gradient(to right, rgba(200,198,198,0.9) ${totalPercent}%, rgba(200,198,198,0.4) ${totalPercent}%);
          border:1px solid #666; font-size:14px; font-weight:bold; width: 0 !important;
        `,
      });

      // 子任務 (維持原樣)
      proj.tasks.forEach((task, idx) => {
        const start = new Date(task["開始日期"]);
        const end = new Date(task["預計完成日期"]);
        let pVal = task["進度百分比"];
        if (typeof pVal === 'string') pVal = parseFloat(pVal.replace('%', ''));
        const progressPercent = Math.round(Number(pVal) || 0);

        let gradientStyle;
        if (progressPercent === 100) {
            gradientStyle = `background: linear-gradient(to right, rgba(0,200,0,0.7) ${progressPercent}%, rgba(144,238,144,0.3) ${progressPercent}%);`;
        } else if (end < today && progressPercent < 100) {
            gradientStyle = `background: linear-gradient(to right, rgba(255,99,71,0.6) ${progressPercent}%, rgba(255,182,193,0.2) ${progressPercent}%);`;
        } else {
            gradientStyle = `background: linear-gradient(to right, rgba(91,170,255,0.6) ${progressPercent}%, rgba(0,123,255,0.15) ${progressPercent}%);`;
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

    // ✅【修改】: 事件監聽器，處理 AI 分析與編輯按鈕
    const onTimelineClick = (event) => {
        const target = event.target;
        const projectName = target.dataset.project;

        // 1. AI 分析按鈕
        if (target.classList.contains('analyze-btn')) {
            target.disabled = true;
            target.innerText = "分析中...";
            if (projectName) {
                handleAnalysis(projectName).finally(() => {
                    target.disabled = false;
                    target.innerText = "AI 分析";
                });
            }
        }
        
        // 2. ✅ 編輯按鈕
        if (target.classList.contains('edit-btn')) {
            if (projectName) {
                handleEditClick(projectName);
            }
        }
    };

    const timelineContainer = ref.current;
    timelineContainer.addEventListener('click', onTimelineClick);

    setTimeout(() => setVisible(true), 50);
    
    return () => {
      if (timeline) timeline.destroy();
      if (timelineContainer) timelineContainer.removeEventListener('click', onTimelineClick);
    };
  }, [rows, libraryLoaded]); 

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
  
  if (loading || !libraryLoaded) return <p>載入甘特圖資源中...</p>;

  return (
    <>
      <GanttStyles />
      <div className="gantt-page-container">
        <div className="gantt-controls" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
            <h2>專案甘特圖</h2>
            <button onClick={() => toggleGroups(false)}>全部收合</button>
        </div>
        <div className="timeline-wrapper">
            <div ref={ref} className={`timeline-container ${visible ? "fade-in" : ""}`} />
        </div>

        {(isAnalyzing || analysisResult || analysisError) && (
          <div className="analysis-result-wrapper">
            <button className="analysis-close-btn" onClick={closeAnalysisBox}>&times;</button>
            <h3>專案 AI 分析</h3>
            {isAnalyzing && <p>分析中，請稍候...</p>}
            {analysisResult && <p>{analysisResult}</p>}
            {analysisError && <p style={{ color: 'red' }}>{analysisError}</p>}
          </div>
        )}

        {/* ✅ 新增：編輯彈窗 (Modal) */}
        {showEditModal && (
            <div className="modal-overlay">
                <div className="modal-content">
                    <div className="modal-header">
                        <h3>編輯專案：{editingProjectName}</h3>
                        <button onClick={() => setShowEditModal(false)} className="analysis-close-btn">&times;</button>
                    </div>
                    
                    <div style={{ overflowX: 'auto' }}>
                        <table className="edit-table">
                            <thead>
                                <tr>
                                    <th style={{width: '150px'}}>任務名稱</th>
                                    <th style={{width: '80px'}}>成員</th>
                                    <th style={{width: '130px'}}>開始日期</th>
                                    <th style={{width: '130px'}}>結束日期</th>
                                    <th style={{width: '70px'}}>進度</th>
                                    <th style={{width: '90px'}}>狀態</th>
                                    <th style={{width: '50px'}}>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {editingTasks.map((task, idx) => (
                                    <tr key={idx}>
                                        <td>
                                            <input 
                                                className="edit-input" 
                                                value={task.任務名稱 || ""} 
                                                onChange={(e) => handleTaskChange(idx, "任務名稱", e.target.value)}
                                            />
                                        </td>
                                        <td>
                                            <input 
                                                className="edit-input" 
                                                value={task.成員姓名 || ""} 
                                                onChange={(e) => handleTaskChange(idx, "成員姓名", e.target.value)}
                                            />
                                        </td>
                                        <td>
                                            <input 
                                                type="date"
                                                className="edit-input" 
                                                value={task.開始日期 || ""} 
                                                onChange={(e) => handleTaskChange(idx, "開始日期", e.target.value)}
                                            />
                                        </td>
                                        <td>
                                            <input 
                                                type="date"
                                                className="edit-input" 
                                                value={task.預計完成日期 || ""} 
                                                onChange={(e) => handleTaskChange(idx, "預計完成日期", e.target.value)}
                                            />
                                        </td>
                                        <td>
                                            <input 
                                                className="edit-input" 
                                                placeholder="50%"
                                                value={task.進度百分比 || ""} 
                                                onChange={(e) => handleTaskChange(idx, "進度百分比", e.target.value)}
                                            />
                                        </td>
                                        <td>
                                            <select 
                                                className="edit-input"
                                                value={task.任務狀態 || "進行中"}
                                                onChange={(e) => handleTaskChange(idx, "任務狀態", e.target.value)}
                                            >
                                                <option value="未開始">未開始</option>
                                                <option value="進行中">進行中</option>
                                                <option value="延遲">延遲</option>
                                                <option value="完成">完成</option>
                                            </select>
                                        </td>
                                        <td>
                                            <button className="delete-row-btn" onClick={() => handleDeleteTask(idx)}>刪除</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    <button className="add-task-btn" onClick={handleAddTask}>+ 新增任務</button>

                    <div className="modal-footer">
                        <button className="cancel-btn" onClick={() => setShowEditModal(false)}>取消</button>
                        <button className="submit-btn" onClick={handleSubmitEdit}>Submit (儲存)</button>
                    </div>
                </div>
            </div>
        )}
      </div>
    </>
  );
}

export default GanttChart;