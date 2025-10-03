import React, { useEffect, useRef, useState } from "react";
import { DataSet, Timeline } from "vis-timeline/standalone";
import "vis-timeline/styles/vis-timeline-graph2d.min.css";
import "./index.css";

function GanttChart() {
  const ref = useRef();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);

  const groupsRef = useRef(null);
  const timelineRef = useRef(null);

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
    if (!rows.length || !ref.current) return;

    const groups = new DataSet();
    const items = new DataSet();
    const projects = {};
    const today = new Date();

    rows.forEach((row) => {
      if (!projects[row.專案ID]) {
        projects[row.專案ID] = {
          專案名稱: row.專案名稱,
          tasks: [],
        };
      }
      projects[row.專案ID].tasks.push(row);
    });

    Object.entries(projects).forEach(([projId, proj]) => {
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
      orientation: "top",
      margin: { item: 10, axis: 20 },
      zoomKey: "ctrlKey",
      verticalScroll: true,
      maxHeight: "600px",
      editable: false,
    };

    const timeline = new Timeline(ref.current, items, groups, options);
    timelineRef.current = timeline;
    groupsRef.current = groups;

    setTimeout(() => setVisible(true), 50);
    return () => timeline.destroy();
  }, [rows]);

  if (loading) return <p>載入甘特圖...</p>;

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


  return (
    <div>
      <h2>專案甘特圖</h2>
      <button onClick={() => toggleGroups(true)}>展開全部</button>
      <button onClick={() => toggleGroups(false)}>收合全部</button>
      <div
        ref={ref}
        className={`timeline-container ${visible ? "fade-in" : ""}`}
        style={{ height: "600px", border: "1px solid #ccc", overflow: "auto" }}
      />
    </div>
  );
}

export default GanttChart;
