import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

const SURVEY_DATA_KEY = '@survey_data';
const NOTIFICATION_SETTINGS_KEY = '@notification_settings';
const VIDEO_DIRECTORY = `${FileSystem.documentDirectory}videos/`;

// ========== Video Storage Functions ==========

// 確保影片目錄存在
async function ensureVideoDirectory() {
  const dirInfo = await FileSystem.getInfoAsync(VIDEO_DIRECTORY);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(VIDEO_DIRECTORY, { intermediates: true });
  }
}

// 將影片從暫存目錄複製到持久化目錄
export async function saveVideoToPermanentStorage(tempVideoUri) {
  try {
    await ensureVideoDirectory();
    
    const fileName = `video_${Date.now()}.mp4`;
    const permanentPath = `${VIDEO_DIRECTORY}${fileName}`;
    
    await FileSystem.copyAsync({
      from: tempVideoUri,
      to: permanentPath,
    });
    
    console.log('影片已儲存到:', permanentPath);
    return permanentPath;
  } catch (error) {
    console.error('儲存影片失敗:', error);
    // 如果複製失敗，返回原始路徑
    return tempVideoUri;
  }
}

// 刪除影片檔案
export async function deleteVideoFile(videoUri) {
  try {
    if (videoUri && videoUri.startsWith(VIDEO_DIRECTORY)) {
      const fileInfo = await FileSystem.getInfoAsync(videoUri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(videoUri);
        console.log('影片已刪除:', videoUri);
      }
    }
  } catch (error) {
    console.error('刪除影片失敗:', error);
  }
}

// ========== Survey Data Functions ==========

// 儲存一筆問卷資料
export async function saveSurveyData(data) {
  try {
    const existingData = await getSurveyData();
    const newEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ...data,
    };
    const updatedData = [...existingData, newEntry];
    await AsyncStorage.setItem(SURVEY_DATA_KEY, JSON.stringify(updatedData));
    return newEntry;
  } catch (error) {
    console.error('Error saving survey data:', error);
    throw error;
  }
}

// 取得所有問卷資料
export async function getSurveyData() {
  try {
    const data = await AsyncStorage.getItem(SURVEY_DATA_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting survey data:', error);
    return [];
  }
}

// 刪除單筆問卷資料（同時刪除相關影片）
export async function deleteSurveyData(id) {
  try {
    const existingData = await getSurveyData();
    const itemToDelete = existingData.find(item => item.id === id);
    
    // 如果有影片，先刪除影片檔案
    if (itemToDelete && itemToDelete.videoUri) {
      await deleteVideoFile(itemToDelete.videoUri);
    }
    
    const updatedData = existingData.filter(item => item.id !== id);
    await AsyncStorage.setItem(SURVEY_DATA_KEY, JSON.stringify(updatedData));
    return true;
  } catch (error) {
    console.error('Error deleting survey data:', error);
    throw error;
  }
}

// 刪除所有問卷資料（同時刪除所有影片）
export async function clearAllSurveyData() {
  try {
    // 先取得所有資料，刪除所有影片
    const existingData = await getSurveyData();
    for (const item of existingData) {
      if (item.videoUri) {
        await deleteVideoFile(item.videoUri);
      }
    }
    
    await AsyncStorage.removeItem(SURVEY_DATA_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing survey data:', error);
    throw error;
  }
}

// 匯出所有資料（JSON + 影片打包成一個資料夾）
export async function exportAllData(onProgress) {
  try {
    const data = await getSurveyData();
    if (data.length === 0) {
      throw new Error('沒有資料可匯出');
    }

    const dateStr = new Date().toISOString().split('T')[0];
    const exportDir = `${FileSystem.cacheDirectory}export_${dateStr}/`;
    
    // 確保匯出目錄存在
    const dirInfo = await FileSystem.getInfoAsync(exportDir);
    if (dirInfo.exists) {
      await FileSystem.deleteAsync(exportDir, { idempotent: true });
    }
    await FileSystem.makeDirectoryAsync(exportDir, { intermediates: true });
    
    // 收集所有要匯出的檔案
    const exportedFiles = [];
    let videoIndex = 0;
    
    // 複製所有影片到匯出目錄，並更新 JSON 中的路徑
    const exportData = await Promise.all(data.map(async (item, index) => {
      const newItem = { ...item };
      
      if (item.videoUri) {
        const fileInfo = await FileSystem.getInfoAsync(item.videoUri);
        if (fileInfo.exists) {
          videoIndex++;
          const videoFileName = `video_${videoIndex}.mp4`;
          const exportVideoPath = `${exportDir}${videoFileName}`;
          
          await FileSystem.copyAsync({
            from: item.videoUri,
            to: exportVideoPath,
          });
          
          exportedFiles.push(exportVideoPath);
          newItem.videoFileName = videoFileName; // 在 JSON 中記錄影片檔名
          
          if (onProgress) {
            onProgress(`複製影片 ${videoIndex}...`);
          }
        }
      }
      return newItem;
    }));
    
    // 建立 JSON 檔案
    const jsonFileName = `survey_data.json`;
    const jsonFilePath = `${exportDir}${jsonFileName}`;
    await FileSystem.writeAsStringAsync(jsonFilePath, JSON.stringify(exportData, null, 2));
    exportedFiles.unshift(jsonFilePath);
    
    return {
      exportDir,
      files: exportedFiles,
      jsonPath: jsonFilePath,
      videoCount: videoIndex,
      totalRecords: data.length,
    };
  } catch (error) {
    console.error('Error exporting all data:', error);
    throw error;
  }
}

// 匯出資料為 JSON 檔案並分享
export async function exportSurveyData() {
  try {
    const data = await getSurveyData();
    if (data.length === 0) {
      throw new Error('沒有資料可匯出');
    }

    const dateStr = new Date().toISOString().split('T')[0];
    const jsonFileName = `survey_data_${dateStr}.json`;
    const jsonFilePath = `${FileSystem.documentDirectory}${jsonFileName}`;
    await FileSystem.writeAsStringAsync(jsonFilePath, JSON.stringify(data, null, 2));
    
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(jsonFilePath, {
        mimeType: 'application/json',
        dialogTitle: '匯出心情記錄資料',
      });
    }
    
    const videoCount = data.filter(item => item.videoUri).length;
    return { jsonPath: jsonFilePath, videoCount };
  } catch (error) {
    console.error('Error exporting survey data:', error);
    throw error;
  }
}

// 取得所有影片清單
export async function getAllVideos() {
  try {
    const data = await getSurveyData();
    const videos = [];
    
    for (const item of data) {
      if (item.videoUri) {
        const fileInfo = await FileSystem.getInfoAsync(item.videoUri);
        if (fileInfo.exists) {
          videos.push({
            uri: item.videoUri,
            timestamp: item.timestamp,
            id: item.id,
          });
        }
      }
    }
    
    return videos;
  } catch (error) {
    console.error('Error getting videos:', error);
    throw error;
  }
}

// ========== Notification Settings Functions ==========

// 預設通知設定
const DEFAULT_NOTIFICATION_SETTINGS = {
  enabled: true,
  times: [
    { hour: 9, minute: 0, enabled: true },
    { hour: 16, minute: 0, enabled: true },
    { hour: 22, minute: 0, enabled: true },
  ],
};

// 取得通知設定
export async function getNotificationSettings() {
  try {
    const settings = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    return settings ? JSON.parse(settings) : DEFAULT_NOTIFICATION_SETTINGS;
  } catch (error) {
    console.error('Error getting notification settings:', error);
    return DEFAULT_NOTIFICATION_SETTINGS;
  }
}

// 儲存通知設定
export async function saveNotificationSettings(settings) {
  try {
    await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
    return true;
  } catch (error) {
    console.error('Error saving notification settings:', error);
    throw error;
  }
}
