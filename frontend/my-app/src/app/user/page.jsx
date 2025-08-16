"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Header from "../components/Header";
import Menu from "../components/Menu";
import PlusPlanModal from "../components/PlusPlanModal";
import styles from "../styles/UserPage.module.css";
import { getUserTopics } from "../utils/userUtils";
import {
  safeAlert,
  safeConfirm,
  showPasswordChangeDialog,
} from "../utils/dialogs";
import { safeLogout } from "../utils/auth";

export default function UserPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");
  const [userData, setUserData] = useState({});
  const [topics, setTopics] = useState([]);

  // 訂閱狀態管理
  const [isPlusSubscribed, setIsPlusSubscribed] = useState(false);
  const [showPlusModal, setShowPlusModal] = useState(false);

  // 切換選單
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    if (!isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  };

  // 關閉選單
  const closeMenu = () => {
    setIsMenuOpen(false);
    document.body.style.overflow = "auto";
  };

  // 切換標籤頁
  const switchTab = (tabName) => {
    setActiveTab(tabName);
  };

  // 更改密碼
  const handleChangePassword = () => {
    showPasswordChangeDialog(async (oldPassword, newPassword) => {
      if (!oldPassword || !newPassword) return;

      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        safeAlert("尚未登入或找不到 token，請重新登入後再試一次。");
        return;
      }

      try {
        const res = await fetch("http://127.0.0.1:8000/reset-password/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            old_password: oldPassword,
            new_password: newPassword,
          }),
        });

        // 依照後端回傳格式彈窗提示
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          // 優先顯示後端錯誤訊息
          const msg =
            data?.message || data?.detail || "更改密碼失敗，請稍後重試。";
          safeAlert(msg);
          return;
        }

        safeAlert(data?.message || "密碼已更新成功！");
      } catch (err) {
        console.error("reset-password 發生錯誤：", err);
        safeAlert("網路或伺服器異常，請稍後再試。");
      }
    });
  };

  // 升級到Plus方案
  const handleUpgradeToPlus = () => {
    setIsPlusSubscribed(true);
    localStorage.setItem("isPlusSubscribed", "true");
    safeAlert("恭喜！您已成功升級到Plus方案");
  };

  // 取消Plus訂閱
  const handleCancelPlusSubscription = () => {
    safeConfirm("確定要取消Plus訂閱嗎？", () => {
      setIsPlusSubscribed(false);
      localStorage.setItem("isPlusSubscribed", "false");
      setShowPlusModal(false);
      safeAlert("已取消Plus訂閱，回到免費方案");
    });
  };

  // 查看目前方案詳情
  const handleViewCurrentPlan = () => {
    setShowPlusModal(true);
  };

  // 後端請求使用者資料(帶上token)
  const fetchUserDataFromAPI = async () => {
    // 時間格式化
    const formatDate = (isoString) => {
      const date = new Date(isoString);
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      const dd = String(date.getDate()).padStart(2, "0");
      const hh = String(date.getHours()).padStart(2, "0");
      const mi = String(date.getMinutes()).padStart(2, "0");
      return `${yyyy}/${mm}/${dd} ${hh}:${mi}`;
    };

    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (!token) {
      console.error("找不到 token");
      return;
    }

    try {
      const res = await fetch(`http://127.0.0.1:8000/users/${userId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("API 請求失敗");
      }

      const data = await res.json();
      // 根據 API 回應格式更新 userData
      setUserData({
        name: data.username || "未知",
        email: data.email || "未知",
        registerDate: formatDate(data.created_at || new Date()),
      });
    } catch (error) {
      console.error("取得使用者資料失敗:", error);
    }
  };

  // 初始化數據
  useEffect(() => {
    // 確保在客戶端渲染時才執行
    if (typeof window !== "undefined") {
      fetchUserDataFromAPI();
      fetchUserTopicsFromAPI();
      const subscriptionStatus = localStorage.getItem("isPlusSubscribed");
      setIsPlusSubscribed(subscriptionStatus === "true");
    }
  }, []);

  // 從API獲取用戶主題熟悉度
  const fetchUserTopicsFromAPI = async () => {
    try {
      const userTopics = await getUserTopics();
      setTopics(userTopics);
    } catch (error) {
      console.error("獲取用戶主題失敗:", error);
      // 如果API失敗，設置為空數組
      setTopics([]);
    }
  };

  // 鍵盤事件處理
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const name = userData.name || "";
  const isChinese = /[^\x00-\x7F]/.test(name);
  const fontSize = isChinese
    ? name.length > 5
      ? "1rem"
      : "1.5rem"
    : name.length > 6
    ? "1.3rem"
    : "2.3rem";
  return (
    <>
      {/* 頭部 */}
      <Header
        showMenu={true}
        isMenuOpen={isMenuOpen}
        onToggleMenu={toggleMenu}
        enableNoteQLink={true}
      />

      {/* 主要內容 */}
      <section className={styles.userDashboard}>
        <div className={styles.dashboardContainer}>
          {/* 個人資料欄 */}
          <div className={styles.profileColumn}>
            <div className={styles.profileCard}>
              <Image
                src="/img/Vector-20.png"
                alt="Background"
                className={styles.profileBg}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 450px"
                style={{ objectFit: "cover" }}
              />

              <header className={styles.profileHeader}>
                <Image
                  src="/img/userrr.gif"
                  alt="Chart Icon"
                  className={styles.profileIcon}
                  width={100}
                  height={80}
                  style={{
                    objectFit: "contain",
                    mixBlendMode: "difference",
                  }}
                />
                <h1
                  className={styles.profileName}
                  title={name}
                  style={{ fontSize }}
                >
                  {name}
                </h1>
              </header>

              {/* 標籤頁容器 */}
              <div className={styles.tabContainer}>
                <button
                  className={`${styles.tabButton} ${
                    activeTab === "personal" ? styles.active : ""
                  }`}
                  onClick={() => switchTab("personal")}
                >
                  個人資料
                </button>
                <button
                  className={`${styles.tabButton} ${
                    activeTab === "familiarity" ? styles.active : ""
                  }`}
                  onClick={() => switchTab("familiarity")}
                >
                  熟悉度
                </button>
              </div>

              {/* 個人資料標籤頁 */}
              <div
                className={`${styles.tabPanel} ${
                  activeTab === "personal" ? styles.active : ""
                }`}
              >
                <div className={styles.personalInfo}>
                  <div className={styles.infoItem}>
                    <h3 className={styles.infoTitle}>電子郵件</h3>
                    <p className={styles.infoContent}>{userData.email}</p>
                  </div>
                  <div className={styles.infoItem}>
                    <h3 className={styles.infoTitle}>註冊時間</h3>
                    <p className={styles.infoContent}>
                      {userData.registerDate}
                    </p>
                  </div>
                  <div className={styles.infoItem}>
                    <h3 className={styles.infoTitle}>目前方案</h3>
                    <p className={styles.infoContent}>
                      {isPlusSubscribed ? "Plus方案" : "免費方案"}
                    </p>
                  </div>
                  <button
                    className={styles.changePasswordBtn}
                    onClick={handleChangePassword}
                  >
                    更改密碼
                  </button>
                </div>
              </div>

              {/* 熟悉度標籤頁 */}
              <div
                className={`${styles.tabPanel} ${
                  activeTab === "familiarity" ? styles.active : ""
                }`}
              >
                <div className={styles.topicsList}>
                  {topics && topics.length > 0 ? (
                    topics.map((topic, index) => (
                      <div key={index} className={styles.topicItem}>
                        <div className={styles.topicHeader}>
                          <h2 className={styles.topicTitle}>{topic.name}</h2>
                        </div>
                        <div className={styles.progressContainer}>
                          <span className={styles.progressLabel}>熟悉度：</span>
                          <div className={styles.progressBar}>
                            <div
                              className={styles.progress}
                              style={{ width: `${topic.familiarity}%` }}
                            ></div>
                          </div>
                          <span className={styles.progressPercentage}>
                            {topic.familiarity}%
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className={styles.noTopicsMessage}>
                      <p>目前您還沒有任何主題熟悉度</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 訂閱方案欄 */}
          <div className={styles.subscriptionColumn}>
            <article className={styles.planCard}>
              <div
                className={`${styles.planHeader} ${
                  isPlusSubscribed ? styles.free : styles.current
                }`}
              >
                {isPlusSubscribed ? "免費方案" : "目前方案"}
              </div>
              <ul className={styles.featureList}>
                <li className={styles.featureItem}>
                  <Image
                    src="/img/Vector-22.png"
                    alt="Feature icon"
                    width={20}
                    height={20}
                    loading="lazy"
                  />
                  <span>熟悉度功能</span>
                </li>
                <li className={styles.featureItem}>
                  <Image
                    src="/img/Vector-22.png"
                    alt="Feature icon"
                    width={20}
                    height={20}
                    loading="lazy"
                  />
                  <span>免費生成三次主題</span>
                </li>
                <li className={styles.featureItem}>
                  <Image
                    src="/img/Vector-22.png"
                    alt="Feature icon"
                    width={20}
                    height={20}
                    loading="lazy"
                  />
                  <span>單次生成十題題目</span>
                </li>
                <li className={styles.featureItem}>
                  <Image
                    src="/img/Vector-22.png"
                    alt="Feature icon"
                    width={20}
                    height={20}
                    loading="lazy"
                  />
                  <span>訂閱即享更多功能</span>
                </li>
              </ul>
            </article>

            <article className={styles.planCard}>
              <button
                className={`${styles.planHeader} ${
                  isPlusSubscribed ? styles.current : styles.upgrade
                }`}
                onClick={!isPlusSubscribed ? handleUpgradeToPlus : undefined}
                disabled={isPlusSubscribed}
              >
                {isPlusSubscribed ? "目前方案" : "升級PLUS"}
              </button>
              <ul className={styles.featureList}>
                <li className={styles.featureItem}>
                  <Image
                    src="/img/Vector-22.png"
                    alt="Feature icon"
                    width={20}
                    height={20}
                    loading="lazy"
                  />
                  <span>筆記功能</span>
                </li>
                <li className={styles.featureItem}>
                  <Image
                    src="/img/Vector-22.png"
                    alt="Feature icon"
                    width={20}
                    height={20}
                    loading="lazy"
                  />
                  <span>收藏與AI解析功能</span>
                </li>
                <li className={styles.featureItem}>
                  <Image
                    src="/img/Vector-22.png"
                    alt="Feature icon"
                    width={20}
                    height={20}
                    loading="lazy"
                  />
                  <span>主題不限/單次題目生成三十題</span>
                </li>
                <li className={styles.featureItem}>
                  {isPlusSubscribed ? (
                    <button
                      className={styles.viewCurrentPlanBtn}
                      onClick={handleViewCurrentPlan}
                    >
                      查看目前方案
                    </button>
                  ) : (
                    <div className={styles.priceDisplay}>
                      <Image
                        src="/img/Vector-22.png"
                        alt="Feature icon"
                        width={20}
                        height={20}
                        loading="lazy"
                      />
                      <span>99NTD/月</span>
                    </div>
                  )}
                </li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      {/* Plus方案詳情模态框 */}
      <PlusPlanModal
        isOpen={showPlusModal}
        onClose={() => setShowPlusModal(false)}
        onCancelSubscription={handleCancelPlusSubscription}
      />

      {/* 選單 */}
      <Menu isOpen={isMenuOpen} onClose={closeMenu} onLogout={safeLogout} />
    </>
  );
}
