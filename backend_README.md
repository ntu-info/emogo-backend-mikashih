# EmoGo Backend

心情記錄 App 的後端 API 服務。

## 技術架構

- **FastAPI** - 現代化 Python Web 框架
- **Uvicorn** - ASGI 伺服器
- **Pydantic** - 資料驗證

## 快速開始

### 安裝依賴

```bash
cd backend
pip install -r requirements.txt
```

### 啟動伺服器

```bash
# 開發模式（自動重載）
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# 或直接執行
python main.py
```

### API 文件

啟動伺服器後，訪問：
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API 端點

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

## 資料格式

### 心情記錄 (Survey)

```json
{
  "id": "uuid",
  "mood": 1-5,
  "location": {
    "latitude": 25.0330,
    "longitude": 121.5654
  },
  "hasVideo": true,
  "videoUri": "/uploads/videos/video_xxx.mp4",
  "timestamp": "2024-01-01T12:00:00"
}
```
