"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Header from "../components/Header";
import styles from "../styles/LoginPage.module.css";
import { initSplineViewer, optimizeSplineLoading } from "../utils/spline";
import { safeAlert } from "../utils/dialogs";
import { usePageTransition } from "../components/PageTransition";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const [isLoginForm, setIsLoginForm] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [isSubmittingForgotPassword, setIsSubmittingForgotPassword] = useState(false);
  const splineViewerRef = useRef(null);
  const { navigateWithTransition } = usePageTransition();

  //註冊欄位綁定狀態
  const [signupUsername, setSignupUsername] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupMessage, setSignupMessage] = useState("");

  // 登入欄位綁定狀態
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  // 忘記密碼
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    
    if (!forgotPasswordEmail.trim()) {
      safeAlert("請輸入電子郵件地址");
      return;
    }

    setIsSubmittingForgotPassword(true);
    
    try {
      const res = await fetch("http://127.0.0.1:8000/forgot-password/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: forgotPasswordEmail }),
      });

      if (!res.ok) {
        throw new Error("發送失敗");
      }

      safeAlert("重設密碼連結已發送到您的電子郵件，請查看信箱");
      setShowForgotPasswordModal(false);
      setForgotPasswordEmail("");
    } catch (err) {
      safeAlert("發送失敗，請確認電子郵件地址是否正確");
    } finally {
      setIsSubmittingForgotPassword(false);
    }
  };

  // 關閉忘記密碼模態框
  const closeForgotPasswordModal = () => {
    setShowForgotPasswordModal(false);
    setForgotPasswordEmail("");
  };

  // 登入功能
  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://127.0.0.1:8000/login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        throw new Error("登入失敗");
      }

      const data = await res.json();
      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", data.user_id);
      
      // 登入成功後才開始頁面過渡動畫
      navigateWithTransition('/homegame', 'right');
      
    } catch (err) {
      // 如果登入失敗，顯示錯誤訊息
      safeAlert("登入失敗，請確認帳號密碼");
    }
  };

  // 註冊功能
  const handleSignup = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://127.0.0.1:8000/register/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: signupUsername,
          email: signupEmail,
          password: signupPassword,
        }),
      });

      if (!res.ok) {
        throw new Error("註冊失敗");
      }

      const data = await res.json();
      safeAlert("註冊成功，請登入");
      setIsLoginForm(true);
    } catch (err) {
      safeAlert("註冊失敗，請確認資料是否正確或已被註冊");
    }
  };

  // 根據 URL 參數決定顯示登入還是註冊表單
  useEffect(() => {
    const signupParam = searchParams.get("signup");
    if (signupParam === "1") {
      setIsLoginForm(false);
    } else {
      setIsLoginForm(true);
    }
  }, [searchParams]);

  // 初始化 Spline viewer
  useEffect(() => {
    initSplineViewer();
  }, []);

  // 優化 Spline 模型載入
  useEffect(() => {
    if (splineViewerRef.current) {
      optimizeSplineLoading(splineViewerRef.current);
    }
  }, []);

  const showLoginForm = () => {
    setIsLoginForm(true);
  };

  const showSignupForm = () => {
    setIsLoginForm(false);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleSignupPasswordVisibility = () => {
    setShowSignupPassword(!showSignupPassword);
  };

  return (
    <>
      <Header showAuthNav={true} />

      <main className={styles.authMain}>
        <div className={styles.authContainer}>
          {/* 登入表單區塊 */}
          <div
            className={`${styles.formSection} ${
              isLoginForm ? "" : styles.hidden
            }`}
            id="loginSection"
          >
            <h1 className={styles.authTitle}>LOGIN</h1>

            <form className={styles.authForm} onSubmit={handleLogin}>
              <div className={styles.inputGroup}>
                <div className={styles.inputHeader}>
                  <div className={styles.inputIcon}>
                    <Image
                      src="/img/Vector-6.png"
                      alt="Email icon"
                      className={styles.icon}
                      width={24}
                      height={24}
                    />
                  </div>
                  <label className={styles.inputLabel}>EMAIL</label>
                </div>
                <input
                  type="email"
                  className={styles.inputField}
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <div className={styles.inputUnderline}></div>
              </div>

              <div className={styles.inputGroup}>
                <div className={styles.inputHeader}>
                  <div className={styles.inputIcon}>
                    <Image
                      src="/img/Vector-7.png"
                      alt="Password icon"
                      className={styles.icon}
                      width={24}
                      height={24}
                    />
                  </div>
                  <label className={styles.inputLabel}>PASSWORD</label>
                </div>
                <div className={styles.passwordInputContainer}>
                  <input
                    type={showPassword ? "text" : "password"}
                    className={styles.inputField}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className={styles.passwordToggle}
                    onClick={togglePasswordVisibility}
                  >
                    <Image
                      src="/img/Vector-39.png"
                      alt="Show password"
                      className={`${styles.icon} ${
                        showPassword ? styles.hidden : ""
                      }`}
                      width={20}
                      height={20}
                    />
                    <Image
                      src="/img/Vector-38.png"
                      alt="Hide password"
                      className={`${styles.icon} ${
                        showPassword ? "" : styles.hidden
                      }`}
                      width={20}
                      height={20}
                    />
                  </button>
                </div>
                <div className={styles.inputUnderline}></div>
              </div>

              <div className={styles.forgotPassword}>
                <a href="#" className={styles.linkText} onClick={() => setShowForgotPasswordModal(true)}>
                  忘記密碼？
                </a>
              </div>

              <button type="submit" className={styles.authButton}>
                LOGIN
              </button>
              {message && (
                <p style={{ marginTop: "10px", color: "red" }}>{message}</p>
              )}
            </form>

            <div className={styles.switchLink}>
              <a href="#" className={styles.linkText} onClick={showSignupForm}>
                還沒有帳號？註冊
              </a>
            </div>
          </div>

          {/* 註冊表單區塊 */}
          <div
            className={`${styles.formSection} ${
              !isLoginForm ? "" : styles.hidden
            }`}
            id="signupSection"
          >
            <h1 className={styles.authTitle}>SIGN UP</h1>

            <form className={styles.authForm} onSubmit={handleSignup}>
              <div className={styles.inputGroup}>
                <div className={styles.inputHeader}>
                  <div className={styles.inputIcon}>
                    <Image
                      src="/img/Vector-36.png"
                      alt="Username icon"
                      className={styles.icon}
                      width={24}
                      height={24}
                    />
                  </div>
                  <label className={styles.inputLabel}>USERNAME</label>
                </div>
                <input
                  type="text"
                  className={styles.inputField}
                  value={signupUsername}
                  onChange={(e) => setSignupUsername(e.target.value)}
                  required
                />
                <div className={styles.inputUnderline}></div>
              </div>

              <div className={styles.inputGroup}>
                <div className={styles.inputHeader}>
                  <div className={styles.inputIcon}>
                    <Image
                      src="/img/Vector-6.png"
                      alt="Email icon"
                      className={styles.icon}
                      width={24}
                      height={24}
                    />
                  </div>
                  <label className={styles.inputLabel}>EMAIL</label>
                </div>
                <input
                  type="email"
                  className={styles.inputField}
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  required
                />
                <div className={styles.inputUnderline}></div>
              </div>

              <div className={styles.inputGroup}>
                <div className={styles.inputHeader}>
                  <div className={styles.inputIcon}>
                    <Image
                      src="/img/Vector-7.png"
                      alt="Password icon"
                      className={styles.icon}
                      width={24}
                      height={24}
                    />
                  </div>
                  <label className={styles.inputLabel}>PASSWORD</label>
                </div>
                <div className={styles.passwordInputContainer}>
                  <input
                    type={showSignupPassword ? "text" : "password"}
                    className={styles.inputField}
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className={styles.passwordToggle}
                    onClick={toggleSignupPasswordVisibility}
                  >
                    <Image
                      src="/img/Vector-39.png"
                      alt="Show password"
                      className={`${styles.icon} ${
                        showSignupPassword ? styles.hidden : ""
                      }`}
                      width={20}
                      height={20}
                    />
                    <Image
                      src="/img/Vector-38.png"
                      alt="Hide password"
                      className={`${styles.icon} ${
                        showSignupPassword ? "" : styles.hidden
                      }`}
                      width={20}
                      height={20}
                    />
                  </button>
                </div>
                <div className={styles.inputUnderline}></div>
              </div>

              <button type="submit" className={styles.authButton}>
                SIGN UP
              </button>
              {signupMessage && (
                <p style={{ marginTop: "10px", color: "red" }}>
                  {signupMessage}
                </p>
              )}
            </form>

            <div className={styles.switchLink}>
              <a href="#" className={styles.linkText} onClick={showLoginForm}>
                已經有帳號了？登入
              </a>
            </div>
          </div>
        </div>

        <div className={styles.splineContainer}>
          <spline-viewer
            ref={splineViewerRef}
            loading-anim-type="none"
            loading-anim-duration="0"
            url="https://prod.spline.design/WZMDq8J83oGNSegR/scene.splinecode"
            style={{
              width: "100%",
              height: "100%",
              minWidth: "400px",
              minHeight: "600px",
            }}
          />
        </div>
      </main>

      {/* 忘記密碼模態框 */}
      {showForgotPasswordModal && (
        <div className={styles.modalOverlay} onClick={closeForgotPasswordModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>忘記密碼</h2>
              <button 
                className={styles.closeButton}
                onClick={closeForgotPasswordModal}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleForgotPassword} className={styles.modalForm}>
              <div className={styles.modalInputGroup}>
                <label className={styles.modalLabel}>
                  請輸入先前註冊的電子郵件
                </label>
                <input
                  type="email"
                  className={styles.modalInput}
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  placeholder="請輸入您的電子郵件"
                  required
                />
              </div>
              
              <div className={styles.modalButtons}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={closeForgotPasswordModal}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={isSubmittingForgotPassword}
                >
                  {isSubmittingForgotPassword ? "發送中..." : "發送重設連結"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
