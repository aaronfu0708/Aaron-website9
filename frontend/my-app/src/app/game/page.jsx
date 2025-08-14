"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import styles from "../styles/GamePage.module.css";
import Header from "../components/Header";
import Menu from "../components/Menu";
import { safeLogout } from "../utils/auth";

const Game = () => {
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showCompleteButton, setShowCompleteButton] = useState(false);
  const [totalQuestions, setTotalQuestions] = useState(1);
  const [quizData, setQuizData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isOptionDisabled, setIsOptionDisabled] = useState(false); // 防連點狀態
  const [isSubmitting, setIsSubmitting] = useState(false); // 防重複提交

  // 初始化資料
  useEffect(() => {
    const data = sessionStorage.getItem("quizData");
    if (data) {
      try {
        const parsed = JSON.parse(data);
        setQuizData(parsed.quiz || {});
        setQuestions(parsed.topics || []);
        setTotalQuestions(parsed.question_count || 1);
      } catch (err) {
        console.error("解析 quizData 失敗：", err);
      }
    } else {
      window.location.href = "/";
    }
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    document.body.style.overflow = !isMenuOpen ? "hidden" : "auto";
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
    document.body.style.overflow = "auto";
  };

  const handleOptionClick = (index) => {
    if (isOptionDisabled) return;

    const currentTopic = questions[currentQuestion - 1];
    if (!currentTopic) return;

    const optionLetter = ["A", "B", "C", "D"][index];

    setIsOptionDisabled(true);

    setUserAnswers((prev) => {
      const filtered = prev.filter((ans) => ans.topicId !== currentTopic.id);
      return [
        ...filtered,
        { topicId: currentTopic.id, selected: optionLetter },
      ];
    });

    setSelectedOption(index);

    if (currentQuestion === totalQuestions) {
      // 最後一題選完後才顯示完成按鈕，且不跳題
      setShowCompleteButton(true);
      setIsOptionDisabled(false);
      return;
    }

    setTimeout(() => {
      setCurrentQuestion((prev) => prev + 1);
      setSelectedOption(null);
      setIsOptionDisabled(false);
    }, 300);
  };

  const handleCompleteChallenge = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // 組成後端需要的資料格式
      const payload = {
        updates: userAnswers.map(({ topicId, selected }) => ({
          id: topicId,
          user_answer: selected,
        })),
      };

      const token = localStorage.getItem("token");

      // POST 到後端
      const res = await fetch("http://127.0.0.1:8000/api/submit_answer/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // 附上 token
        },
        body: JSON.stringify(payload),
      });

      // 簡單錯誤處理（不中斷原流程）
      if (!res.ok) {
        console.error("提交答案失敗：", res.status, await res.text());
      }
      // 成功後，獲取熟悉度
      const data = await res.json();
      // 這邊要改回傳的資料結構
      const Familiarity = data.familiarity || 0; 
      sessionStorage,setItem("familiarity", Familiarity);
    } catch (err) {
      console.error("提交答案發生錯誤：", err);
    } finally {
      // 寫入 sessionStorage 並導向 /gameover
      sessionStorage.setItem("userAnswers", JSON.stringify(userAnswers));
      window.location.href = "/gameover";
    }
  };

  const options = questions.length
    ? [
        `A ${questions[currentQuestion - 1]?.option_A}`,
        `B ${questions[currentQuestion - 1]?.option_B}`,
        `C ${questions[currentQuestion - 1]?.option_C}`,
        `D ${questions[currentQuestion - 1]?.option_D}`,
      ]
    : [];

  const progressPercent = (currentQuestion / totalQuestions) * 100;

  return (
    <>
      <Header
        showMenu={true}
        isMenuOpen={isMenuOpen}
        onToggleMenu={toggleMenu}
        enableNoteQLink={true}
      />
      <Menu isOpen={isMenuOpen} onClose={closeMenu} onLogout={safeLogout} />

      <main className={styles.gameMain}>
        <div className={styles.questionContainer}>
          <h2 className={styles.questionNumber}>
            第 {currentQuestion} 題 / {totalQuestions} 題
          </h2>

          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>

          <p className={styles.questionText}>
            {questions[currentQuestion - 1]?.title || "題目載入中..."}
          </p>

          <div className={styles.gameSection}>
            {currentQuestion > 1 && (
              <div
                className={styles.backButton}
                onClick={() => {
                  setCurrentQuestion((prev) => prev - 1);
                  setSelectedOption(null);
                }}
              >
                <Image
                  src="/img/Vector-9.png"
                  alt="Back"
                  width={14}
                  height={14}
                />
                <span className={styles.backText}>回上一題</span>
              </div>
            )}

            <div className={styles.answerGrid}>
              {options.map((option, index) => (
                <div
                  key={index}
                  className={`${styles.answerOption} ${
                    selectedOption === index ? styles.selected : ""
                  }`}
                  onClick={() => handleOptionClick(index)}
                  style={{ pointerEvents: isOptionDisabled ? "none" : "auto" }} // 點擊禁用
                >
                  {option}
                </div>
              ))}
            </div>

            {currentQuestion === totalQuestions && showCompleteButton && (
              <div className={styles.completeButtonContainer}>
                <button
                  className={styles.completeButton}
                  onClick={handleCompleteChallenge}
                >
                  完成挑戰
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
};

export default Game;
