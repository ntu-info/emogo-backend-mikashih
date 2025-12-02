[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/e7FBMwSa)
[![Open in Visual Studio Code](https://classroom.github.com/assets/open-in-vscode-2e0aaae1b6195c2367325f4f02e2d04e9abb55f0b24a779b69b11b9e10269abc.svg)](https://classroom.github.com/online_ide?assignment_repo_id=21880357&assignment_repo_type=AssignmentRepo)

# 📱 EmoGo - 心情記錄 App

一款結合心情量表、GPS 定位、影片記錄的情緒追蹤應用程式，幫助使用者記錄每日情緒變化。

---

## 🔗 連結

| 項目 | 連結 |
|------|------|
| **Expo 專案頁面** | [https://expo.dev/@mikashih0911/my-app-1](https://expo.dev/@mikashih0911/my-app-1) |
| **Android APK 下載** | [EAS Build 頁面](https://expo.dev/accounts/mikashih0911/projects/my-app-1/builds/21918372-42a3-499a-b221-57127087f467) |
| **Backend API 文件** | 部署後訪問 `/docs` |

---

## ✨ 功能特色

### 🎭 心情記錄
- 5 級情緒量表 (😢 😕 😐 🙂 😄)
- 視覺化表情符號選擇
- 一鍵快速記錄

### 📍 GPS 定位
- 自動記錄當下位置座標
- 支援位置資訊顯示

### 📹 影片錄製
- 自動錄製 1 秒短影片
- 支援前/後鏡頭切換
- 可選擇跳過錄製

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

### Backend (Python / FastAPI) - 本 Repo

| 技術 | 說明 |
|------|------|
| **FastAPI** | 現代化 Python Web 框架 |
| **Uvicorn** | ASGI 伺服器 |
| **Pydantic** | 資料驗證 |
| **Render** | 雲端部署平台 |

### Frontend (React Native / Expo) - frontend/ 目錄

| 技術 | 說明 |
|------|------|
| **Expo SDK 54** | React Native 開發框架 |
| **expo-router** | 檔案式路由導航 |
| **expo-camera** | 相機錄影功能 |
| **expo-location** | GPS 定位服務 |
| **expo-notifications** | 推播通知 |
| **expo-file-system** | 檔案儲存管理 |
| **expo-sharing** | 檔案分享功能 |
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
│   ├── ios/                    # iOS 原生專案
│   ├── app.json                # Expo 配置
│   ├── eas.json                # EAS Build 配置
│   └── package.json            # 依賴套件
│
└── README.md                   # 專案說明文件
```

---

## 🚀 快速開始

### 環境需求
- Python 3.9+
- Node.js 18+ (前端)
- Expo CLI (前端)

### Backend 啟動

```bash
# 1. Clone 專案
git clone https://github.com/ntu-info/emogo-backend-mikashih.git
cd emogo-backend-mikashih

# 2. 安裝 Python 依賴
pip install -r requirements.txt

# 3. 啟動 API 伺服器
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# 4. 查看 API 文件
# 開啟瀏覽器訪問 http://localhost:8000/docs
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

### 部署到 Render

1. Fork 此 repo 或連接 GitHub
2. 在 Render 建立新的 Web Service
3. 選擇此 repo
4. Render 會自動偵測 `render.yaml` 設定
5. 點擊 Deploy

或點擊下方按鈕一鍵部署：

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

---

## 📡 API 端點

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/` | API 首頁 |
| GET | `/health` | 健康檢查 |
| POST | `/api/surveys` | 建立心情記錄 |
| GET | `/api/surveys` | 取得所有記錄 |
| GET | `/api/surveys/{id}` | 取得單筆記錄 |
| DELETE | `/api/surveys/{id}` | 刪除單筆記錄 |
| DELETE | `/api/surveys` | 清除所有記錄 |
| POST | `/api/upload/video` | 上傳影片 |
| GET | `/api/stats` | 取得統計資料 |

---

## 📝 使用說明

### 記錄心情
1. 開啟 App，點擊首頁 🏠
2. 選擇當前心情 (1-5 分)
3. 自動取得 GPS 位置
4. 選擇是否錄製影片
5. 完成記錄！

### 管理設定
1. 點擊設定 ⚙️
2. 設定提醒時間與開關
3. 查看/刪除歷史記錄
4. 匯出資料 (JSON + 影片)
