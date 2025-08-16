// =========================
// 從 API 獲取用戶熟悉度（GET）
// =========================
export async function getUserFamiliarityFromAPI() {
    try {
        const token = localStorage.getItem("token");
        if (!token) {
            console.error("找不到 token");
            return [];
        }

        const res = await fetch("http://127.0.0.1:8000/api/familiarity/", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        if (!res.ok) {
            console.error("獲取熟悉度數據失敗：", res.status, await res.text());
            return [];
        }

        const data = await res.json();

        // 調整資料格式
        const familiarityData = Array.isArray(data)
            ? data.map((item) => ({
            name: item.quiz_topic?.quiz_topic.length > 8  // 如果主題名稱超過8個字符，則截斷並添加省略號+
            
                ? item.quiz_topic.quiz_topic.slice(0, 8) + "..." 
                : item.quiz_topic?.quiz_topic || "未命名主題",
            familiarity: item.familiarity ?? 0, // 如果 API 未提供熟悉度則為 0
            quizId: item.quiz_topic?.id ?? null
            }))
            : [];

        return familiarityData;
    } catch (error) {
        console.error('獲取熟悉度數據失敗:', error);
        return [];
    }
}

// =========================
// 獲取用戶主題熟悉度（GET 包裝）
// =========================
export async function getUserTopics() {
    try {
        const apiData = await getUserFamiliarityFromAPI();
        return apiData;
    } catch (error) {
        console.error('獲取主題熟悉度失敗:', error);
        return [];
    }
}

// =========================
// 提交用戶答案並獲取熟悉度（POST）
// =========================
export async function submitUserAnswers(updates) {
    try {
        const token = localStorage.getItem("token");
        if (!token) {
            console.error("找不到 token");
            return null;
        }

        const res = await fetch("http://127.0.0.1:8000/api/submit_answer/", { // 更新 API URL
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ updates })
        });

        if (!res.ok) {
            console.error("提交答案失敗：", res.status, await res.text());
            return null;
        }

        const data = await res.json();

        return {
            familiarity: data.familiarity ?? 0,
            quizTopicId: data.quiz_topic_id ?? null,
            difficultyLevel: data.difficulty_level ?? null,
            difficultyCap: data.difficulty_cap ?? null,
            alreadyReachedCap: data.already_reached_cap ?? false,
            updated: data.updated ?? false
        };

    } catch (error) {
        console.error("提交答案或獲取熟悉度失敗:", error);
        return null;
    }
}


// 更改密碼（模擬）
export function changePassword(oldPassword, newPassword) {
    // 這裡應該連接到後端 API 進行密碼驗證和更改
    if (!oldPassword || !newPassword) {
        return { success: false, message: '請輸入舊密碼和新密碼！' };
    }
    
    if (newPassword.length < 6) {
        return { success: false, message: '新密碼長度至少需要6位！' };
    }
    
    if (oldPassword === newPassword) {
        return { success: false, message: '新密碼不能與舊密碼相同！' };
    }
    
    // 模擬成功
    return { success: true, message: '密碼更改成功！' };
}