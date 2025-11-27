[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/1M59WghA)
[![Open in Visual Studio Code](https://classroom.github.com/assets/open-in-vscode-2e0aaae1b6195c2367325f4f02e2d04e9abb55f0b24a779b69b11b9e10269abc.svg)](https://classroom.github.com/online_ide?assignment_repo_id=21801936&assignment_repo_type=AssignmentRepo)

# 📱 EmoGo - 心情記錄 App

一款結合心情量表、GPS 定位、影片記錄的情緒追蹤應用程式，幫助使用者記錄每日情緒變化。

---

## 🔗 App 連結

| 項目 | 連結 |
|------|------|
| **Expo 專案頁面** | [https://expo.dev/@mikashih0911/my-app-1](https://expo.dev/@mikashih0911/my-app-1) |
| **專案 ID** | `684f33f2-f691-49c2-a0cf-aa12ded44b34` |
| **Development Build URI** | `exp+my-app-1://expo-development-client` |
| **Android APK 下載** | [EAS Build 頁面](https://expo.dev/accounts/mikashih0911/projects/my-app-1/builds) |

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
emogo-frontend-mikashih-main/
├── app/
│   ├── (tabs)/
│   │   ├── _layout.js      # Tab 導航配置
│   │   ├── index.js        # 首頁 (心情記錄)
│   │   └── settings.js     # 設定頁面
│   ├── components/
│   │   └── SurveyScreen.js # 問卷表單元件
│   ├── _layout.js          # 根 Layout
│   ├── details.js          # 詳情頁
│   └── index.js            # 入口頁
├── utils/
│   ├── storage.js          # 資料儲存工具
│   └── notifications.js    # 通知排程工具
├── app.json                # Expo 配置
├── eas.json                # EAS Build 配置
└── package.json            # 依賴套件
```

---

## 🚀 快速開始

### 環境需求
- Node.js 18+
- npm 或 yarn
- Expo CLI
- EAS CLI (用於雲端建置)

### 安裝步驟

```bash
# 1. Clone 專案
git clone https://github.com/ntu-info/emogo-frontend-mikashih.git
cd emogo-frontend-mikashih

# 2. 安裝依賴
npm install

# 3. 啟動開發伺服器
npx expo start

# 4. 在模擬器/實機上執行
# 按 a 開啟 Android
# 按 i 開啟 iOS
```

### 建置 APK

```bash
# 登入 EAS
eas login

# 建置 Android Preview 版本
eas build --platform android --profile preview

# 建置 Production 版本
eas build --platform android --profile production
```

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

---

## 📄 授權

此專案為 NTU 資訊相關課程作業專案。

---

## 👤 開發者

- **帳號**: mikashih0911
- **組織**: ntu-info

---

## 🔧 版本紀錄

| 版本 | 更新內容 |
|------|---------|
| 1.0.1 | 新增匯出全部功能、UI 美化 |
| 1.0.0 | 初始版本：心情記錄、GPS、錄影、通知 |
