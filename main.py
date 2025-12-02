from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import os
import uuid

app = FastAPI(
    title="EmoGo API",
    description="心情記錄 App 後端 API",
    version="1.0.0"
)

# CORS 設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 資料模型
class Location(BaseModel):
    latitude: float
    longitude: float

class SurveyData(BaseModel):
    id: Optional[str] = None
    mood: int  # 1-5
    location: Optional[Location] = None
    hasVideo: bool = False
    videoUri: Optional[str] = None
    timestamp: Optional[str] = None

class SurveyResponse(BaseModel):
    id: str
    mood: int
    location: Optional[Location]
    hasVideo: bool
    videoUri: Optional[str]
    timestamp: str

# 暫存資料（實際應用應使用資料庫）
surveys_db: List[dict] = []

# 確保上傳目錄存在
UPLOAD_DIR = "uploads/videos"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@app.get("/")
async def root():
    return {"message": "歡迎使用 EmoGo API", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}


# 問卷相關 API
@app.post("/api/surveys", response_model=SurveyResponse)
async def create_survey(survey: SurveyData):
    """建立新的心情記錄"""
    new_survey = {
        "id": str(uuid.uuid4()),
        "mood": survey.mood,
        "location": survey.location.dict() if survey.location else None,
        "hasVideo": survey.hasVideo,
        "videoUri": survey.videoUri,
        "timestamp": datetime.now().isoformat()
    }
    surveys_db.append(new_survey)
    return new_survey


@app.get("/api/surveys", response_model=List[SurveyResponse])
async def get_surveys():
    """取得所有心情記錄"""
    return surveys_db


@app.get("/api/surveys/{survey_id}", response_model=SurveyResponse)
async def get_survey(survey_id: str):
    """取得單筆心情記錄"""
    for survey in surveys_db:
        if survey["id"] == survey_id:
            return survey
    raise HTTPException(status_code=404, detail="找不到該記錄")


@app.delete("/api/surveys/{survey_id}")
async def delete_survey(survey_id: str):
    """刪除單筆心情記錄"""
    global surveys_db
    for i, survey in enumerate(surveys_db):
        if survey["id"] == survey_id:
            # 如果有影片，刪除影片檔案
            if survey.get("videoUri"):
                video_path = survey["videoUri"].replace("/uploads/", "uploads/")
                if os.path.exists(video_path):
                    os.remove(video_path)
            surveys_db.pop(i)
            return {"message": "記錄已刪除", "id": survey_id}
    raise HTTPException(status_code=404, detail="找不到該記錄")


@app.delete("/api/surveys")
async def clear_all_surveys():
    """清除所有心情記錄"""
    global surveys_db
    # 刪除所有影片檔案
    for survey in surveys_db:
        if survey.get("videoUri"):
            video_path = survey["videoUri"].replace("/uploads/", "uploads/")
            if os.path.exists(video_path):
                os.remove(video_path)
    surveys_db = []
    return {"message": "所有記錄已清除"}


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
    file_extension = file.filename.split(".")[-1] if "." in file.filename else "mp4"
    filename = f"video_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}.{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    # 儲存檔案
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    
    video_uri = f"/uploads/videos/{filename}"
    
    # 如果有提供 survey_id，更新對應的記錄
    if survey_id:
        for survey in surveys_db:
            if survey["id"] == survey_id:
                survey["videoUri"] = video_uri
                survey["hasVideo"] = True
                break
    
    return {
        "message": "影片上傳成功",
        "videoUri": video_uri,
        "filename": filename
    }


# 統計 API
@app.get("/api/stats")
async def get_stats():
    """取得統計資料"""
    if not surveys_db:
        return {
            "totalRecords": 0,
            "averageMood": 0,
            "videoCount": 0,
            "moodDistribution": {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        }
    
    total = len(surveys_db)
    mood_sum = sum(s["mood"] for s in surveys_db)
    video_count = sum(1 for s in surveys_db if s.get("hasVideo"))
    
    mood_distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for s in surveys_db:
        mood_distribution[s["mood"]] += 1
    
    return {
        "totalRecords": total,
        "averageMood": round(mood_sum / total, 2),
        "videoCount": video_count,
        "moodDistribution": mood_distribution
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
