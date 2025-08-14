"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import Header from "./components/Header";
import styles from "./styles/HomePage.module.css";
import { Orb, orbConfig } from "./utils/orb";
import { Typewriter } from "./utils/typewriter";
import { usePageTransition } from "./components/PageTransition";

export default function HomePage() {
  const canvasRef = useRef(null);
  const typewriterRef = useRef(null);
  const orbRef = useRef(null);
  const typewriterInstanceRef = useRef(null);
  const { navigateWithTransition } = usePageTransition();

  useEffect(() => {
    // 檢測是否為移動設備
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );

    // 如果是移動設備，調整配置
    if (isMobile) {
      orbConfig.hoverIntensity = 0.6; // 降低移動端強度
    }

    // 初始化 Orb
    if (canvasRef.current) {
      orbRef.current = new Orb(canvasRef.current, orbConfig);
    }

    // 初始化打字機效果
    if (typewriterRef.current) {
      const fullText = "NoteQ智能學習平台\n學習更有效率，筆記更有條理";
      typewriterInstanceRef.current = new Typewriter(
        typewriterRef.current,
        fullText,
        {
          typeSpeed: 50,
          deleteSpeed: 50,
          waitTime: 1500,
          loop: true,
        }
      );
    }

    // 清理函數
    return () => {
      if (typewriterInstanceRef.current) {
        // 清理打字機實例
        typewriterInstanceRef.current = null;
      }
      if (orbRef.current) {
        // 清理 Orb 實例
        orbRef.current.destroy();
        orbRef.current = null;
      }
    };
  }, []);

  const handleStart = () => {
    const token = localStorage.getItem("token");
    if (token) {
      navigateWithTransition("/homegame", "right");
    } else {
      navigateWithTransition("/login", "right");
    }
  };

  return (
    <>
      <Header showAuthNav={true} />

      <section id="hero" className={styles.heroSection}>
        <div className={styles.orbContainer}>
          <canvas
            ref={canvasRef}
            id="orbCanvas"
            className={styles.orbCanvas}
          ></canvas>
        </div>
        <div className={`container ${styles.heroContainer}`}>
          <div className={styles.heroDescription}>
            <div
              ref={typewriterRef}
              className={styles.typewriterText}
              id="typewriterText"
            ></div>
          </div>
          <button onClick={handleStart} className={styles.ctaButton}>
            <span className={styles.ctaText}>START</span>
            <span className={styles.arrowIconWrapper}>
              <Image
                src="/img/Vector-8.png"
                alt="Arrow icon"
                width={15}
                height={15}
              />
            </span>
          </button>
        </div>
      </section>
    </>
  );
}
