[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/e7FBMwSa)
[![Open in Visual Studio Code](https://classroom.github.com/assets/open-in-vscode-2e0aaae1b6195c2367325f4f02e2d04e9abb55f0b24a779b69b11b9e10269abc.svg)](https://classroom.github.com/online_ide?assignment_repo_id=21880357&assignment_repo_type=AssignmentRepo)

# 📱 EmoGo - 心情記錄 App

一款結合心情量表、GPS 定位、影片記錄的情緒追蹤應用程式，幫助使用者記錄每日情緒變化。

---

## 🔗 重要連結

| 項目 | 連結 |
|------|------|
| **Backend API (Render)** | https://emogo-backend-mikashih.onrender.com |
| **API 文件 (Swagger UI)** | https://emogo-backend-mikashih.onrender.com/docs |
| **Expo 專案頁面** | https://expo.dev/@mikashih0911/my-app-1 |
| **Android APK 下載** | [EAS Build](https://expo.dev/accounts/mikashih0911/projects/my-app-1/builds/21918372-42a3-499a-b221-57127087f467) |

---

## 📥 資料下載 / Data Export (For TAs & Tren)

### 🔗 快速存取連結

| 資料類型 | API 端點 | 說明 |
|----------|----------|------|
| **📊 所有記錄 (JSON)** | [GET /api/surveys](ㄎ) | 包含心情、GPS、影片狀態 |
| **📈 統計資料** | [GET /api/stats](https://emogo-backend-mikashih.onrender.com/api/stats) | 心情分布、記錄總數 |
| **📄 API 文件** | [Swagger UI](https://emogo-backend-mikashih.onrender.com/docs) | 互動式 API 測試介面 |

### 📹 下載影片 (Vlogs)

每筆記錄若有影片，可透過以下 URL 直接下載 `.mp4` 檔案：

```
https://emogo-backend-mikashih.onrender.com/api/surveys/{id}/video/download
```

**目前可下載的影片：**
| 記錄 ID | 心情 | GPS 座標 | 下載連結 |
|---------|------|----------|----------|
| `692edeae45f9d981f0700b2e` | 😞 (2) | 37.4220, -122.0840 | [下載影片](https://emogo-backend-mikashih.onrender.com/api/surveys/692edeae45f9d981f0700b2e/video/download) |
| `692ed851550905157408d15e` | 😊 (4) | 37.4220, -122.0840 | [下載影片](https://emogo-backend-mikashih.onrender.com/api/surveys/692ed851550905157408d15e/video/download) |

### 📊 資料格式範例

**GET /api/surveys 回傳格式：**
```json
[
  {
    "id": "692ed851550905157408d15e",
    "mood": 4,                                              // 心情分數 1-5 (Sentiment)
    "location": {                                           // GPS 座標
      "latitude": 37.4219983,
      "longitude": -122.084
    },
    "hasVideo": true,                                       // 是否有影片 (Vlog)
    "videoUrl": "/api/surveys/692ed851.../video/download",  // 影片下載網址
    "timestamp": "2025-12-02T20:15:13"                      // 記錄時間
  }
]
```

### 🛠 使用 cURL 下載資料

```bash
# 1. 取得所有記錄 (心情 + GPS + 影片狀態)
curl https://emogo-backend-mikashih.onrender.com/api/surveys

# 2. 取得統計資料
curl https://emogo-backend-mikashih.onrender.com/api/stats

# 3. 下載特定影片
curl -o video.mp4 https://emogo-backend-mikashih.onrender.com/api/surveys/{id}/video/download

# 4. 取得影片的 Base64 資料
curl https://emogo-backend-mikashih.onrender.com/api/surveys/{id}/video
```

---

## ✨ 收集的三種資料類型

| 資料類型 | 欄位名稱 | 說明 | 儲存位置 |
|----------|----------|------|----------|
| **🎭 Sentiments (心情)** | `mood` | 1-5 級情緒量表 | MongoDB |
| **📍 GPS Coordinates** | `location.latitude`, `location.longitude` | 經緯度座標 | MongoDB |
| **📹 Vlogs (影片)** | `videoUrl` | 影片下載網址 | MongoDB |

---

## ✨ 功能特色

### 🎭 心情記錄 (Sentiments)
- 5 級情緒量表 (😢 😕 😐 🙂 😄)
- 視覺化表情符號選擇
- 一鍵快速記錄

### 📍 GPS 定位 (Coordinates)
- 自動記錄當下位置座標
- 支援位置資訊顯示

### 📹 影片錄製 (Vlogs)
- 自動錄製 1 秒短影片
- 支援前/後鏡頭切換
- 可選擇跳過錄製
- 影片自動上傳到 MongoDB

### 🔔 提醒通知
- 可自訂每日提醒次數
- 自由設定提醒時間
- 個別開關每個提醒

### 📊 資料管理
- 查看所有歷史記錄
- 匯出 JSON + 影片
- 單筆/全部資料刪除

---

## 🛠 技術架構

### Backend (Python / FastAPI)

| 技術 | 說明 |
|------|------|
| **FastAPI** | 現代化 Python Web 框架 |
| **Motor** | MongoDB 非同步驅動 |
| **MongoDB Atlas** | 雲端資料庫 (儲存影片 Base64) |
| **Render** | 雲端部署平台 |

### Frontend (React Native / Expo)

| 技術 | 說明 |
|------|------|
| **Expo SDK 54** | React Native 開發框架 |
| **expo-router** | 檔案式路由導航 |
| **expo-camera** | 相機錄影功能 |
| **expo-location** | GPS 定位服務 |
| **expo-notifications** | 推播通知 |
| **expo-file-system** | 檔案儲存管理 |
| **AsyncStorage** | 本地資料儲存 |

---

## 📁 專案結構

```
emogo-backend-mikashih/
├── main.py                      # Backend API 主程式
├── requirements.txt             # Python 依賴
├── render.yaml                  # Render 部署設定
│
├── frontend/                    # 前端 App (React Native)
│   ├── app/
│   │   ├── (tabs)/
│   │   │   ├── _layout.js      # Tab 導航配置
│   │   │   ├── index.js        # 首頁 (心情記錄)
│   │   │   └── settings.js     # 設定頁面
│   │   ├── components/
│   │   │   └── SurveyScreen.js # 問卷表單元件
│   │   └── _layout.js          # 根 Layout
│   ├── utils/
│   │   ├── storage.js          # 資料儲存工具
│   │   └── notifications.js    # 通知排程工具
│   ├── android/                # Android 原生專案
│   ├── app.json                # Expo 配置
│   ├── eas.json                # EAS Build 配置
│   └── package.json            # 依賴套件
│
└── README.md                   # 專案說明文件
```

---

## 📡 API 端點

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/` | API 首頁 |
| GET | `/health` | 健康檢查 |
| GET | `/docs` | Swagger UI API 文件 |
| POST | `/api/surveys` | 建立心情記錄 |
| GET | `/api/surveys` | 取得所有記錄 (含心情、GPS) |
| GET | `/api/surveys/{id}` | 取得單筆記錄 |
| GET | `/api/surveys/{id}/video` | 取得影片 Base64 |
| GET | `/api/surveys/{id}/video/download` | **直接下載影片 .mp4** |
| DELETE | `/api/surveys/{id}` | 刪除單筆記錄 |
| DELETE | `/api/surveys` | 清除所有記錄 |
| GET | `/api/stats` | 取得統計資料 |

---

## 🚀 快速開始

### Backend 啟動 (本地開發)

```bash
# 1. Clone 專案
git clone https://github.com/ntu-info/emogo-backend-mikashih.git
cd emogo-backend-mikashih

# 2. 安裝 Python 依賴
pip install -r requirements.txt

# 3. 啟動 API 伺服器
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# 4. 查看 API 文件
open http://localhost:8000/docs
```

### Frontend 啟動

```bash
# 1. 進入 frontend 目錄
cd frontend

# 2. 安裝依賴
npm install

# 3. 啟動開發伺服器
npx expo start

# 4. 在模擬器/實機上執行
# 按 a 開啟 Android
# 按 i 開啟 iOS
```

---

## 📝 使用說明

### 記錄心情
1. 開啟 App，點擊首頁 🏠
2. 選擇當前心情 (1-5 分)
3. 自動取得 GPS 位置
4. 選擇是否錄製影片
5. 完成記錄！資料自動上傳到雲端

### 管理設定
1. 點擊設定 ⚙️
2. 設定提醒時間與開關
3. 查看/刪除歷史記錄
4. 匯出資料 (JSON + 影片)
