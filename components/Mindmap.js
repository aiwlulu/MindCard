import React, { useEffect, useRef } from "react";
import MindElixir from "mind-elixir";

const Mindmap = () => {
  const mapRef = useRef(null);
  const ME = useRef(null);

  useEffect(() => {
    const defaultData = {
      nodeData: {
        id: "root",
        topic: "MindCard Demo\nby 育如 (2023/11/6)",
        root: true,
        children: [
          {
            topic: "已完成",
            id: "node1",
            children: [
              {
                topic: "首頁 & 基本會員系統",
                id: "sub11",
              },
              {
                topic: "開源心智圖基本功能",
                id: "sub12",
              },
            ],
          },
          {
            topic: "待完成",
            id: "node2",
            children: [
              {
                topic: "主要",
                id: "sub21",
                children: [
                  {
                    topic: "資料串接 Firebase",
                    id: "subsub211",
                  },
                  {
                    topic: "心智圖卡片整合",
                    id: "subsub212",
                    children: [
                      { topic: "卡片視窗", id: "subsub2121" },
                      { topic: "拖曳 & 節點資料整合", id: "subsub2122" },
                    ],
                  },
                  {
                    topic: "重新開發心智圖功能",
                    id: "subsub213",
                    children: [{ topic: "快捷鍵顯示", id: "subsub2131" }],
                  },
                ],
              },
              {
                topic: "次要",
                id: "sub22",
                children: [
                  {
                    topic: "心智圖卡片連結資訊",
                    id: "subsub221",
                  },
                  {
                    topic: "心智圖檔案匯出",
                    id: "subsub222",
                  },
                  {
                    topic: "公開分享心智圖",
                    id: "subsub223",
                  },
                ],
              },
            ],
          },
          {
            topic: "預計使用技術",
            id: "node3",
            children: [
              {
                topic: "React",
                id: "sub31",
              },
              {
                topic: "Next.js",
                id: "sub32",
              },
              {
                topic: "Tailwind",
                id: "sub33",
              },
              {
                topic: "Firebase",
                id: "sub34",
              },
              {
                topic: "SVG",
                id: "sub35",
              },
              {
                topic: "Drag & Drop",
                id: "sub36",
              },
            ],
          },
        ],
      },
    };

    ME.current = new MindElixir({
      el: mapRef.current,
      direction: MindElixir.RIGHT,
      contextMenu: false,
      nodeMenu: false,
      allowUndo: false,
      newTopicName: "New Topic",
    });
    ME.current.init(defaultData);
  }, []);

  return (
    <div className="showcase">
      <div className="block">
        <div ref={mapRef} style={{ height: "90vh", width: "100%" }}></div>
      </div>
    </div>
  );
};

export default Mindmap;
