"use client";
// 題目收藏模態框組件 - 允許用戶將題目收藏到指定的筆記本中

import { useState, useEffect } from "react";
import Image from "next/image";
import SubjectSelector from "./SubjectSelector";
import NoteSelector from "./NoteSelector";
import ContentEditor from "./ContentEditor";

export default function FavoriteModal({
  isOpen,
  onClose,
  questionData,
  subjects,
  notes,
  onShowCustomAlert,
  onShowCustomPrompt,
  styles,
}) {
  const [currentSubject, setCurrentSubject] = useState("新增主題");
  const [currentNoteId, setCurrentNoteId] = useState(null);
  const [noteTitle, setNoteTitle] = useState("");
  const [questionContent, setQuestionContent] = useState("");
  const [isPreviewMode, setIsPreviewMode] = useState(true);

  useEffect(() => {
    if (isOpen && questionData) {
      // 選項映射
      const options = questionData.options ?? {
        A: questionData.option_A,
        B: questionData.option_B,
        C: questionData.option_C,
        D: questionData.option_D,
      };

      // 正確答案代號
      const correctCode =
        questionData.correctAnswer ?? questionData.aiAnswer ?? "";
      const correctAnsText = options[correctCode] ?? correctCode;

      // 從 sessionStorage 取得 quizData
      const quizData = JSON.parse(sessionStorage.getItem("quizData") || "{}");
      let explanation = "";

      if (quizData?.topics && Array.isArray(quizData.topics)) {
        const matchedTopic = quizData.topics.find(
          (t) => t.id === questionData.id
        );
        explanation = matchedTopic?.explanation_text || "";
      }

      // 組合內容：正確答案 + 解析
      const content = `## 題目解析\n${explanation}\n\n**正確答案：** ${correctAnsText}`;
      // 從 sessionStorage 取得 quiz_topic
      const title = quizData?.quiz?.quiz_topic || "題目收藏";
      // 取得題目標題
      const questionTitle =
        questionData.title || `收藏題目 - 第${questionData.number}題`;

      setQuestionContent(content);
      setNoteTitle(questionTitle);

      // 重置選擇器
      setCurrentSubject(title);
      setCurrentNoteId(null);
    }
  }, [isOpen, questionData]);

  // 新增：組裝並送出收藏資料
  const sendFavoriteToBackend = async () => {
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");

    if (!userId) {
      throw new Error("找不到 userId，請確認已登入。");
    }

    const quizData = JSON.parse(sessionStorage.getItem("quizData") || "{}");

    // 選項映射
    const options = questionData.options ?? {
      A: questionData.option_A,
      B: questionData.option_B,
      C: questionData.option_C,
      D: questionData.option_D,
    };

    // 使用者答案與正確答案轉成文字
    const userAnsText = questionData.userSelected
      ? options[questionData.userSelected] ?? questionData.userSelected
      : "";
    const aiAnsText = questionData.aiAnswer
      ? options[questionData.aiAnswer] ?? questionData.aiAnswer
      : "";

    // 解析文字
    let explanation = "";
    if (quizData?.topics && Array.isArray(quizData.topics)) {
      const matched = quizData.topics.find((t) => t.id === questionData.id);
      explanation = matched?.explanation_text || "";
    }

    // 獲取主題ID - 根據當前選擇的主題名稱找到對應的ID
    let topicId = null;
    try {
      const subjectsRes = await fetch("http://127.0.0.1:8000/api/user_quiz_and_notes/", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (subjectsRes.ok) {
        const subjectsData = await subjectsRes.json();
        const topics = Array.isArray(subjectsData?.favorite_quiz_topics) ? subjectsData.favorite_quiz_topics : [];
        const targetTopic = topics.find(t => t?.quiz_topic === currentSubject);
        if (targetTopic) {
          topicId = targetTopic.id;
        }
      }
    } catch (error) {
      console.warn("獲取主題ID失敗:", error);
    }

    // 如果找不到主題ID，使用題目ID作為備用
    if (!topicId) {
      topicId = questionData.id;
    }

    const payload = {
      user_id: Number(userId),
      topic_id: topicId,
      title: questionData.title || `收藏題目 - 第${questionData.number}題`,
      content: {
        explanation_text: explanation,
        user_answer: userAnsText,
        Ai_answer: aiAnsText,
      },
    };

    const res = await fetch("http://127.0.0.1:8000/api/add-favorite/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : undefined,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const msg = await res.text();
      throw new Error(msg || `收藏失敗 (${res.status})`);
    }

    return await res.json().catch(() => ({}));
  };

  const handleConfirm = async () => {
    if (!questionData) {
      onShowCustomAlert("沒有要收藏的題目數據！");
      return;
    }

    try {
      // 先標記題目為收藏狀態（後端收藏系統）
      try {
        const result = await sendFavoriteToBackend();
        if (result?.message) {
          console.log("收藏狀態更新成功:", result.message);
        }
      } catch (err) {
        console.warn("收藏狀態更新失敗:", err.message);
        // 不阻擋筆記創建流程
      }

      if (currentNoteId === "add_note" || currentNoteId === null) {
        // 新增筆記
        const userTitle = noteTitle.trim();
        const finalTitle = userTitle || `收藏題目 - 第${questionData.number}題`;

        const newNote = {
          id: Date.now(),
          title: finalTitle,
          content: questionContent,
          subject: currentSubject,
        };

        if (window.addNoteToSystem) {
          await window.addNoteToSystem(newNote);
          onShowCustomAlert(`題目已收藏到「${currentSubject}」主題！`);
        }
      } else {
        // 添加到現有筆記
        const targetNote = Array.isArray(notes) ? notes.find((note) => note.id === currentNoteId) : null;

        if (targetNote) {
          // 確保 targetNote.content 存在，避免 undefined 問題
          const existingContent = targetNote.content || "";
          const updatedContent = `${existingContent}
---
## 新增題目
${questionContent}`;

          // 構建更新後的筆記對象
          const updatedNote = {
            ...targetNote,
            content: updatedContent,
          };

          try {
            // 調用後端 API 更新筆記
            const token = localStorage.getItem("token");
            const res = await fetch(`http://127.0.0.1:8000/api/notes/${currentNoteId}/`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Authorization: token ? `Bearer ${token}` : "",
              },
              body: JSON.stringify({
                title: updatedNote.title,
                content: updatedNote.content,
              }),
            });

            if (!res.ok) {
              const errorText = await res.text();
              throw new Error(`更新筆記失敗：${res.status} - ${errorText}`);
            }

            // 更新成功後，更新本地狀態
            targetNote.content = updatedContent;
            
            onShowCustomAlert(`題目已添加到筆記「${targetNote.title}」中！`);
          } catch (error) {
            console.error("更新筆記失敗:", error);
            onShowCustomAlert(`更新筆記失敗：${error.message}`);
            return;
          }
        } else {
          onShowCustomAlert("找不到選中的筆記！");
          return;
        }
      }

      onClose();
    } catch (error) {
      console.error("收藏失敗:", error);
      onShowCustomAlert("收藏失敗，請重試！");
    }
  };

  const filteredNotes = Array.isArray(notes) ? notes.filter((note) => note.subject === currentSubject) : [];

  return (
    <div
      className={`${styles["favorite-modal"]} ${isOpen ? styles.active : ""}`}
    >
      <div className={styles["favorite-modal-content"]}>
        <div className={styles["favorite-modal-header"]}>
          <h2 className={styles["favorite-modal-title"]}>收藏題目</h2>
          <button className={styles["favorite-modal-close"]} onClick={onClose}>
            ×
          </button>
        </div>

        <div className={styles["favorite-modal-body"]}>
          <div className={styles["favorite-question-info"]}>
            <h3>題目內容</h3>
            <ContentEditor
              content={questionContent}
              onChange={setQuestionContent}
              isPreviewMode={isPreviewMode}
              onTogglePreview={() => setIsPreviewMode(!isPreviewMode)}
              styles={styles}
            />
          </div>

          <SubjectSelector
            subjects={subjects}
            currentSubject={currentSubject}
            onSubjectChange={setCurrentSubject}
            onShowCustomPrompt={onShowCustomPrompt}
            onShowCustomAlert={onShowCustomAlert}
            styles={styles}
          />

          <NoteSelector
            notes={filteredNotes}
            currentNoteId={currentNoteId}
            onNoteChange={setCurrentNoteId}
            styles={styles}
            currentSubject={currentSubject}
          />

          {(currentNoteId === "add_note" || currentNoteId === null) && (
            <div className={styles["favorite-note-title-input"]}>
              <label
                htmlFor="favorite-note-title"
                className={styles["favorite-filter-label"]}
              >
                筆記標題
              </label>
              <input
                type="text"
                id="favorite-note-title"
                className={styles["favorite-note-title-field"]}
                placeholder="請輸入筆記標題..."
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className={styles["favorite-modal-footer"]}>
          <button
            className={`${styles["favorite-modal-btn"]} ${styles["favorite-modal-btn-secondary"]}`}
            onClick={onClose}
          >
            取消
          </button>
          <button
            className={`${styles["favorite-modal-btn"]} ${styles["favorite-modal-btn-primary"]}`}
            onClick={handleConfirm}
          >
            收藏
          </button>
        </div>
      </div>
    </div>
  );
}
