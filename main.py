from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from urllib.parse import quote_plus
import os

# MongoDB 設定
# 從環境變數讀取，或使用預設值
MONGODB_USER = os.getenv("MONGODB_USER", "test_1")
MONGODB_PASSWORD = os.getenv("MONGODB_PASSWORD", "VOB40kadi5nyyMWR")
MONGODB_CLUSTER = os.getenv("MONGODB_CLUSTER", "cluster0.hq5term.mongodb.net")
DATABASE_NAME = os.getenv("DATABASE_NAME", "emogo")

# 建立連線字串（對密碼進行 URL 編碼）
MONGODB_URL = os.getenv(
    "MONGODB_URL",
    f"mongodb+srv://{quote_plus(MONGODB_USER)}:{quote_plus(MONGODB_PASSWORD)}@{MONGODB_CLUSTER}/?retryWrites=true&w=majority&appName=Cluster0"
)

# MongoDB 連線
client: AsyncIOMotorClient = None
db = None
db_connected = False


async def connect_to_mongo():
    """連接到 MongoDB"""
    global client, db, db_connected
    try:
        client = AsyncIOMotorClient(MONGODB_URL, serverSelectionTimeoutMS=5000)
        db = client[DATABASE_NAME]
        # 測試連線
        await client.admin.command('ping')
        db_connected = True
        print("✅ 成功連接到 MongoDB!")
        print(f"   資料庫: {DATABASE_NAME}")
    except Exception as e:
        db_connected = False
        print(f"❌ MongoDB 連線失敗: {e}")
        print(f"   連線字串: mongodb+srv://{MONGODB_USER}:****@{MONGODB_CLUSTER}/")
        print("   請檢查:")
        print("   1. MongoDB Atlas 用戶名/密碼是否正確")
        print("   2. IP 白名單是否已設定 (Network Access -> Add IP Address -> Allow Access from Anywhere)")
        print("   3. 資料庫用戶是否有讀寫權限")


async def close_mongo_connection():
    """關閉 MongoDB 連線"""
    global client
    if client:
        client.close()
        print("MongoDB 連線已關閉")


app = FastAPI(
    title="EmoGo API",
    description="心情記錄 App 後端 API - MongoDB 版本",
    version="2.0.0"
)


@app.on_event("startup")
async def startup_event():
    await connect_to_mongo()


@app.on_event("shutdown")
async def shutdown_event():
    await close_mongo_connection()


# CORS 設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# PyObjectId 用於處理 MongoDB ObjectId
class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v, handler):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, core_schema, handler):
        return {"type": "string"}


# 資料模型
class Location(BaseModel):
    latitude: float
    longitude: float


class SurveyData(BaseModel):
    mood: int = Field(..., ge=1, le=5, description="心情分數 1-5")
    location: Optional[Location] = None
    hasVideo: bool = False
    videoUri: Optional[str] = None


class SurveyResponse(BaseModel):
    id: str
    mood: int
    location: Optional[Location]
    hasVideo: bool
    videoUri: Optional[str]
    timestamp: str

    class Config:
        populate_by_name = True


# 確保上傳目錄存在
UPLOAD_DIR = "uploads/videos"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@app.get("/")
async def root():
    return {"message": "歡迎使用 EmoGo API", "version": "2.0.0", "database": "MongoDB"}


@app.get("/health")
async def health_check():
    """健康檢查"""
    try:
        await client.admin.command('ping')
        db_status = "connected"
    except Exception:
        db_status = "disconnected"
    
    return {
        "status": "healthy",
        "database": db_status,
        "timestamp": datetime.now().isoformat()
    }


# 問卷相關 API
@app.post("/api/surveys", response_model=SurveyResponse)
async def create_survey(survey: SurveyData):
    """建立新的心情記錄"""
    survey_dict = {
        "mood": survey.mood,
        "location": survey.location.dict() if survey.location else None,
        "hasVideo": survey.hasVideo,
        "videoUri": survey.videoUri,
        "timestamp": datetime.now().isoformat()
    }
    
    result = await db.surveys.insert_one(survey_dict)
    survey_dict["id"] = str(result.inserted_id)
    
    return survey_dict


@app.get("/api/surveys", response_model=List[SurveyResponse])
async def get_surveys():
    """取得所有心情記錄"""
    surveys = []
    cursor = db.surveys.find().sort("timestamp", -1)  # 按時間降序
    
    async for survey in cursor:
        survey["id"] = str(survey["_id"])
        del survey["_id"]
        surveys.append(survey)
    
    return surveys


@app.get("/api/surveys/{survey_id}", response_model=SurveyResponse)
async def get_survey(survey_id: str):
    """取得單筆心情記錄"""
    if not ObjectId.is_valid(survey_id):
        raise HTTPException(status_code=400, detail="無效的記錄 ID")
    
    survey = await db.surveys.find_one({"_id": ObjectId(survey_id)})
    
    if not survey:
        raise HTTPException(status_code=404, detail="找不到該記錄")
    
    survey["id"] = str(survey["_id"])
    del survey["_id"]
    return survey


@app.delete("/api/surveys/{survey_id}")
async def delete_survey(survey_id: str):
    """刪除單筆心情記錄"""
    if not ObjectId.is_valid(survey_id):
        raise HTTPException(status_code=400, detail="無效的記錄 ID")
    
    # 先查詢記錄
    survey = await db.surveys.find_one({"_id": ObjectId(survey_id)})
    
    if not survey:
        raise HTTPException(status_code=404, detail="找不到該記錄")
    
    # 如果有影片，刪除影片檔案
    if survey.get("videoUri"):
        video_path = survey["videoUri"].replace("/uploads/", "uploads/")
        if os.path.exists(video_path):
            os.remove(video_path)
    
    # 刪除資料庫記錄
    await db.surveys.delete_one({"_id": ObjectId(survey_id)})
    
    return {"message": "記錄已刪除", "id": survey_id}


@app.delete("/api/surveys")
async def clear_all_surveys():
    """清除所有心情記錄"""
    # 先取得所有記錄的影片路徑
    cursor = db.surveys.find({"hasVideo": True})
    async for survey in cursor:
        if survey.get("videoUri"):
            video_path = survey["videoUri"].replace("/uploads/", "uploads/")
            if os.path.exists(video_path):
                os.remove(video_path)
    
    # 刪除所有資料庫記錄
    result = await db.surveys.delete_many({})
    
    return {"message": "所有記錄已清除", "deletedCount": result.deleted_count}


# 影片上傳 API
@app.post("/api/upload/video")
async def upload_video(
    file: UploadFile = File(...),
    survey_id: Optional[str] = Form(None)
):
    """上傳影片檔案"""
    if not file.content_type.startswith("video/"):
        raise HTTPException(status_code=400, detail="只接受影片檔案")
    
    # 產生唯一檔名
    import uuid
    file_extension = file.filename.split(".")[-1] if "." in file.filename else "mp4"
    filename = f"video_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}.{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    # 儲存檔案
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    
    video_uri = f"/uploads/videos/{filename}"
    
    # 如果有提供 survey_id，更新對應的記錄
    if survey_id and ObjectId.is_valid(survey_id):
        await db.surveys.update_one(
            {"_id": ObjectId(survey_id)},
            {"$set": {"videoUri": video_uri, "hasVideo": True}}
        )
    
    return {
        "message": "影片上傳成功",
        "videoUri": video_uri,
        "filename": filename
    }


# 統計 API
@app.get("/api/stats")
async def get_stats():
    """取得統計資料"""
    # 計算總記錄數
    total = await db.surveys.count_documents({})
    
    if total == 0:
        return {
            "totalRecords": 0,
            "averageMood": 0,
            "videoCount": 0,
            "moodDistribution": {"1": 0, "2": 0, "3": 0, "4": 0, "5": 0}
        }
    
    # 使用聚合查詢計算統計資料
    pipeline = [
        {
            "$group": {
                "_id": None,
                "totalMood": {"$sum": "$mood"},
                "videoCount": {
                    "$sum": {"$cond": [{"$eq": ["$hasVideo", True]}, 1, 0]}
                }
            }
        }
    ]
    
    stats_cursor = db.surveys.aggregate(pipeline)
    stats = await stats_cursor.to_list(length=1)
    
    mood_sum = stats[0]["totalMood"] if stats else 0
    video_count = stats[0]["videoCount"] if stats else 0
    
    # 計算心情分布
    mood_pipeline = [
        {"$group": {"_id": "$mood", "count": {"$sum": 1}}}
    ]
    mood_cursor = db.surveys.aggregate(mood_pipeline)
    mood_stats = await mood_cursor.to_list(length=5)
    
    mood_distribution = {"1": 0, "2": 0, "3": 0, "4": 0, "5": 0}
    for item in mood_stats:
        mood_distribution[str(item["_id"])] = item["count"]
    
    return {
        "totalRecords": total,
        "averageMood": round(mood_sum / total, 2),
        "videoCount": video_count,
        "moodDistribution": mood_distribution
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
