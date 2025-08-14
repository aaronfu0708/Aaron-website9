// 筆記系統工具函數

// 模擬資料庫（保留用於向後兼容）
let notes = [];
let subjects = [];

// 清理文字內容 - 保留換行符
export function cleanTextContent(text) {
  return text
    .replace(/\r\n/g, "\n") // 統一換行符
    .replace(/\r/g, "\n") // 統一換行符
    .replace(/\n\s*\n\s*\n+/g, "\n\n") // 多個連續換行符合併為兩個
    .trim(); // 移除首尾空白
}

// 本地Markdown解析函數
export function parseMarkdown(text) {
  return (
    text
      // 標題
      .replace(/^### (.*$)/gim, "<h3>$1</h3>")
      .replace(/^## (.*$)/gim, "<h2>$1</h2>")
      .replace(/^# (.*$)/gim, "<h1>$1</h1>")
      // 粗體
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      // 斜體
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      // 程式碼
      .replace(/`(.*?)`/g, "<code>$1</code>")
      // 列表
      .replace(/^- (.*$)/gim, "<li>$1</li>")
      // 分隔線
      .replace(/^---$/gim, "<hr>")
      // 換行
      .replace(/\n/g, "<br>")
  );
}

// 獲取筆記數據
export async function getNotes() {
  try {
    const res = await fetch("http://127.0.0.1:8000/api/user_quiz_and_notes/", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      },
    });

    if (!res.ok) {
      console.error("獲取筆記失敗：", res.status, await res.text());
      return [];
    }

    const data = await res.json();

    // 新增：建立 id -> 名稱 對照
    const topics = Array.isArray(data?.favorite_quiz_topics)
      ? data.favorite_quiz_topics
      : [];
    const topicMap = new Map(
      topics.map((t) => [Number(t?.id), String(t?.quiz_topic || "").trim()])
    );

    // 轉換 favorite_notes 為標準格式
    const apiNotes = Array.isArray(data?.favorite_notes)
      ? data.favorite_notes.map((n) => {
          // 決定標題：優先 title，其次 content 第一行，再不行給預設
          const rawTitle = n?.title ?? "";
          const fallbackFromContent = String(n?.content || "").split("\n")[0];
          const title =
            String(rawTitle).trim() || fallbackFromContent || "未命名筆記";

          // 嘗試解析 content - 新增的筆記是純文本，現有的可能是JSON格式
          let parsedContent = "";
          if (typeof n?.content === "string") {
            try {
              // 嘗試解析為JSON（現有筆記格式）
              const obj = JSON.parse(n.content.replace(/'/g, '"'));
              parsedContent = obj.explanation_text || n.content;
            } catch {
              // 解析失敗，直接使用原始內容（新增筆記格式）
              parsedContent = n.content;
            }
          } else if (typeof n?.content === "object" && n?.content !== null) {
            parsedContent = n.content.explanation_text || "";
          }

          // 獲取主題名稱
          const quizTopicId = n?.quiz_topic_id;
          const subject = topicMap.get(Number(quizTopicId)) || "";

          return {
            id: Number(n?.id),
            title,
            content: parsedContent,
            subject,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        })
      : [];

    return apiNotes;
  } catch (error) {
    console.error("獲取筆記失敗:", error);
    return [];
  }
}

// 獲取主題數據
export async function getSubjects() {
  try {
    const res = await fetch("http://127.0.0.1:8000/api/user_quiz_and_notes/", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      },
    });

    if (!res.ok) {
      console.error("獲取主題失敗：", res.status, await res.text());
      return [];
    }

    const data = await res.json();
    const apiSubjects = Array.isArray(data?.favorite_quiz_topics)
      ? data.favorite_quiz_topics.map((q) => q?.quiz_topic).filter(Boolean)
      : [];

    return apiSubjects;
  } catch (error) {
    console.error("獲取主題失敗:", error);
    return [];
  }
}

// 獲取主題數據（包含ID）
export async function getSubjectsWithIds() {
  try {
    const res = await fetch("http://127.0.0.1:8000/api/user_quiz_and_notes/", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      },
    });

    if (!res.ok) {
      console.error("獲取主題失敗：", res.status, await res.text());
      return [];
    }

    const data = await res.json();
    const apiSubjects = Array.isArray(data?.favorite_quiz_topics)
      ? data.favorite_quiz_topics.map((q) => ({
          id: q?.id,
          name: q?.quiz_topic
        })).filter(q => q.id && q.name)
      : [];

    return apiSubjects;
  } catch (error) {
    console.error("獲取主題失敗:", error);
    return [];
  }
}

// 添加筆記
export async function addNote(note) {
  try {
    // 先獲取主題列表，找到對應的Quiz ID
    const subjectsData = await getSubjects();
    const res = await fetch("http://127.0.0.1:8000/api/user_quiz_and_notes/", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      },
    });

    if (!res.ok) {
      console.error("獲取主題數據失敗：", res.status, await res.text());
      return { success: false, message: "獲取主題數據失敗" };
    }

    const data = await res.json();
    const topics = Array.isArray(data?.favorite_quiz_topics) ? data.favorite_quiz_topics : [];
    
    // 根據主題名稱找到對應的Quiz ID
    const targetTopic = topics.find(t => t?.quiz_topic === note.subject);
    if (!targetTopic) {
      return { success: false, message: `找不到主題「${note.subject}」` };
    }

    // 構建API請求數據
    const apiData = {
      title: note.title, // 筆記標題
      quiz_topic: targetTopic.id, // 主題ID（數字）
      content: note.content, // 筆記內容
    };

    const noteRes = await fetch("http://127.0.0.1:8000/api/notes/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      },
      body: JSON.stringify(apiData),
    });

    if (!noteRes.ok) {
      const errorText = await noteRes.text();
      console.error("新增筆記失敗：", noteRes.status, errorText);
      return { success: false, message: `新增筆記失敗：${noteRes.status}` };
    }

    const result = await noteRes.json();
    return { success: true, message: "筆記添加成功！", data: result };
  } catch (error) {
    console.error("新增筆記失敗:", error);
    return { success: false, message: "保存失敗，請重試！" };
  }
}

// 刪除筆記
export async function deleteNote(noteId) {
  try {
    const res = await fetch(`http://127.0.0.1:8000/api/notes/${noteId}/`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("刪除筆記失敗：", res.status, errorText);
      return { success: false, message: `刪除筆記失敗：${res.status}` };
    }

    return { success: true, message: "筆記已刪除！" };
  } catch (error) {
    console.error("刪除筆記失敗:", error);
    return { success: false, message: "刪除失敗，請重試！" };
  }
}

// 編輯筆記
export async function updateNote(noteId, updatedNote) {
  try {
    // 構建API請求數據
    const apiData = {
      title: updatedNote.title,
      content: updatedNote.content,
    };

    const res = await fetch(`http://127.0.0.1:8000/api/notes/${noteId}/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      },
      body: JSON.stringify(apiData),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("編輯筆記失敗：", res.status, errorText);
      return { success: false, message: `編輯筆記失敗：${res.status}` };
    }

    const result = await res.json();
    return { success: true, message: "筆記更新成功！", data: result };
  } catch (error) {
    console.error("編輯筆記失敗:", error);
    return { success: false, message: "編輯失敗，請重試！" };
  }
}

// 搬移筆記
export async function moveNote(noteId, newSubject) {
  try {
    // 先獲取主題列表，找到對應的Quiz ID
    const subjectsWithIds = await getSubjectsWithIds();
    const targetSubject = subjectsWithIds.find(s => s.name === newSubject);
    
    if (!targetSubject) {
      return { success: false, message: `找不到主題「${newSubject}」` };
    }

    // 構建API請求數據
    const apiData = {
      quiz_topic_id: targetSubject.id,
    };

    const res = await fetch(`http://127.0.0.1:8000/api/notes/${noteId}/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      },
      body: JSON.stringify(apiData),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("搬移筆記失敗：", res.status, errorText);
      return { success: false, message: `搬移筆記失敗：${res.status}` };
    }

    const result = await res.json();
    return {
      success: true,
      message: `筆記已搬移到「${newSubject}」主題！`,
      data: result,
    };
  } catch (error) {
    console.error("搬移筆記失敗:", error);
    return { success: false, message: "搬移失敗，請重試！" };
  }
}

// 添加主題
export async function addSubject(subjectName) {
  const name = String(subjectName || "").trim();
  if (!name) {
    return { success: false, message: "請輸入有效的主題名稱！" };
  }
  try {
    const res = await fetch("http://127.0.0.1:8000/api/create_quiz/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      },
      body: JSON.stringify({ quiz_topic: name }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return {
        success: false,
        message: `新增主題失敗，主題已存在`,
      };
    }
    // 後端成功 -> 同步本地暫存（保持舊行為，不影響前端現有流程）
    if (!subjects.includes(name)) subjects.push(name);
    return { success: true, message: `主題「${name}」新增成功！` };
  } catch (err) {
    console.error("新增主題發生錯誤：", err);
    return { success: false, message: "新增失敗，請稍後再試。" };
  }
}

// 刪除主題
export async function deleteSubject(subjectName) {
  try {
    // 先向後端查詢主題清單，找出要刪除的主題 id
    const lookupRes = await fetch(
      "http://127.0.0.1:8000/api/user_quiz_and_notes/",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      }
    );
    if (!lookupRes.ok) {
      const text = await lookupRes.text().catch(() => "");
      console.error("查詢主題清單失敗：", lookupRes.status, text);
      return {
        success: false,
        message: `查詢主題清單失敗（${lookupRes.status}）`,
      };
    }
    const data = await lookupRes.json();
    const topics = Array.isArray(data?.favorite_quiz_topics)
      ? data.favorite_quiz_topics
      : [];
    const target = topics.find(
      (t) => String(t?.quiz_topic || "").trim() === String(subjectName).trim()
    );
    const topicId = Number(target?.id);
    if (!Number.isFinite(topicId)) {
      return { success: false, message: "找不到對應的主題 ID，無法刪除！" };
    }

    // 呼叫後端軟刪除 API
    const delRes = await fetch(
      `http://127.0.0.1:8000/api/quiz/${topicId}/soft-delete/`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      }
    );
    if (!delRes.ok) {
      const text = await delRes.text().catch(() => "");
      console.error("刪除主題失敗：", delRes.status, text);
      return {
        success: false,
        message: `刪除失敗（${delRes.status}）${text ? "：" + text : ""}`,
      };
    }

    // 後端刪除成功 -> 同步本地暫存
    notes = notes.filter((note) => note.subject !== subjectName);
    subjects = subjects.filter((subject) => subject !== subjectName);
    return { success: true, message: `主題「${subjectName}」已刪除！` };
  } catch (error) {
    console.error("刪除主題發生錯誤：", error);
    return { success: false, message: "刪除失敗，請稍後再試。" };
  }
}

// 根據主題篩選筆記
export async function getNotesBySubject(subject) {
  const allNotes = await getNotes();
  return allNotes.filter((note) => note.subject === subject);
}

// 從後端載入使用者的主題與收藏筆記，並同步到本地 notes/subjects
export async function loadUserQuizAndNotes() {
  try {
    const res = await fetch("http://127.0.0.1:8000/api/user_quiz_and_notes/", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("載入主題/筆記失敗：", res.status, text);
      return { success: false, message: `載入失敗（${res.status}）` };
    }
    const data = await res.json();

    // 1) 建立 topicMap: quiz_topic_id -> quiz_topic
    const topics = Array.isArray(data?.favorite_quiz_topics)
      ? data.favorite_quiz_topics
      : [];
    const topicMap = new Map(
      topics.map((t) => [Number(t?.id), String(t?.quiz_topic || "").trim()])
    );

    // 2) 建立 subjects（字串陣列）
    subjects = [...topicMap.values()].filter(Boolean);

    // 3) 轉成本地 notes：用 quiz_topic_id 對應成 subject 名稱；content 取 explanation_text
    const rawNotes = Array.isArray(data?.favorite_notes)
      ? data.favorite_notes
      : [];
    notes = rawNotes.map((n) => {
      // title：優先 n.title；否則取 content 的第一行；再不行給預設
      const rawTitle = n?.title ?? "";
      const fallbackFromContent = String(n?.content || "").split("\n")[0];
      const title =
        String(rawTitle).trim() || fallbackFromContent || "未命名筆記";

      // content：優先解析 explanation_text；解析失敗就用原字串
      let parsedContent = "";
      if (typeof n?.content === "string") {
        try {
          // 你的後端 content 可能是單引號的物件字串，先轉雙引號再 parse
          const obj = JSON.parse(n.content.replace(/'/g, '"'));
          parsedContent = obj.explanation_text || n.content;
        } catch {
          parsedContent = n.content;
        }
      } else if (typeof n?.content === "object" && n?.content !== null) {
        parsedContent = n.content.explanation_text || "";
      }

      // subject：用 quiz_topic_id 對應主題文字
      const subject = topicMap.get(Number(n?.quiz_topic_id)) || "";

      return {
        id: Number(n?.id) || Date.now() + Math.random(),
        title,
        content: parsedContent,
        subject,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });

    return {
      success: true,
      message: "載入完成",
      subjectsCount: subjects.length,
      notesCount: notes.length,
    };
  } catch (err) {
    console.error("載入主題/筆記發生錯誤：", err);
    return { success: false, message: "載入失敗" };
  }
}

// 生成題目
export function generateQuestions(noteId) {
  // 這個功能暫時保留本地邏輯
  const note = notes.find((n) => n.id === noteId);
  if (note) {
    return {
      success: true,
      message: `正在根據筆記「${note.title}」生成題目...\n\n題目已生成完成！\n\n題目：基於${note.subject}的相關練習題\n\n請前往遊戲頁面查看新生成的題目。`,
    };
  }
  return { success: false, message: "找不到要生成題目的筆記！" };
}
