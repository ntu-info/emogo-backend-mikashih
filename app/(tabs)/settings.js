import { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  Switch,
  FlatList,
  Modal,
  Platform
} from "react-native";
import { useFocusEffect } from "expo-router";
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Sharing from 'expo-sharing';
import { 
  getSurveyData, 
  deleteSurveyData, 
  clearAllSurveyData, 
  exportAllData,
  getNotificationSettings,
  saveNotificationSettings
} from '../../utils/storage';
import { scheduleDailyNotifications } from '../../utils/notifications';

export default function SettingsScreen() {
  const [surveyData, setSurveyData] = useState([]);
  const [notificationSettings, setNotificationSettings] = useState({
    enabled: true,
    times: [],
  });
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [editingTimeIndex, setEditingTimeIndex] = useState(null);
  const [tempTime, setTempTime] = useState(new Date());

  // 載入資料
  const loadData = async () => {
    const data = await getSurveyData();
    setSurveyData(data);
    
    const settings = await getNotificationSettings();
    setNotificationSettings(settings);
  };

  // 每次進入此頁面時重新載入
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  // 刪除單筆資料
  const handleDeleteItem = (id, timestamp) => {
    Alert.alert(
      '刪除資料',
      `確定要刪除 ${new Date(timestamp).toLocaleString('zh-TW')} 的記錄嗎？`,
      [
        { text: '取消', style: 'cancel' },
        { 
          text: '刪除', 
          style: 'destructive',
          onPress: async () => {
            await deleteSurveyData(id);
            loadData();
          }
        }
      ]
    );
  };

  // 刪除所有資料
  const handleClearAll = () => {
    if (surveyData.length === 0) {
      Alert.alert('提示', '目前沒有任何資料');
      return;
    }
    Alert.alert(
      '清除所有資料',
      '確定要刪除所有記錄嗎？此操作無法復原。',
      [
        { text: '取消', style: 'cancel' },
        { 
          text: '全部刪除', 
          style: 'destructive',
          onPress: async () => {
            await clearAllSurveyData();
            loadData();
            Alert.alert('完成', '所有資料已刪除');
          }
        }
      ]
    );
  };

  // 匯出所有資料（JSON + 影片）
  const handleExportAll = async () => {
    if (surveyData.length === 0) {
      Alert.alert('提示', '目前沒有任何資料可匯出');
      return;
    }
    
    try {
      Alert.alert('準備匯出', '正在準備檔案...');
      
      const result = await exportAllData((progress) => {
        console.log(progress);
      });
      
      // 逐一分享檔案（JSON 和所有影片）
      const totalFiles = result.files.length;
      
      for (let i = 0; i < result.files.length; i++) {
        const file = result.files[i];
        const isJson = file.endsWith('.json');
        
        await Sharing.shareAsync(file, {
          mimeType: isJson ? 'application/json' : 'video/mp4',
          dialogTitle: `匯出檔案 (${i + 1}/${totalFiles}): ${isJson ? 'JSON 資料' : `影片 ${i}`}`,
        });
      }
      
      Alert.alert(
        '匯出完成',
        `已匯出 ${result.totalRecords} 筆記錄 + ${result.videoCount} 部影片`,
        [{ text: '太好了！' }]
      );
    } catch (error) {
      Alert.alert('錯誤', error.message);
    }
  };

  // 切換通知開關
  const toggleNotifications = async (value) => {
    const newSettings = { ...notificationSettings, enabled: value };
    setNotificationSettings(newSettings);
    await saveNotificationSettings(newSettings);
    await scheduleDailyNotifications();
  };

  // 切換單一時間開關
  const toggleTimeEnabled = async (index) => {
    const newTimes = [...notificationSettings.times];
    newTimes[index].enabled = !newTimes[index].enabled;
    const newSettings = { ...notificationSettings, times: newTimes };
    setNotificationSettings(newSettings);
    await saveNotificationSettings(newSettings);
    await scheduleDailyNotifications();
  };

  // 新增提醒時間
  const handleAddTime = () => {
    setEditingTimeIndex(null);
    setTempTime(new Date());
    setShowTimePicker(true);
  };

  // 編輯提醒時間
  const handleEditTime = (index) => {
    setEditingTimeIndex(index);
    const time = notificationSettings.times[index];
    const date = new Date();
    date.setHours(time.hour, time.minute, 0, 0);
    setTempTime(date);
    setShowTimePicker(true);
  };

  // 刪除提醒時間
  const handleDeleteTime = async (index) => {
    const newTimes = notificationSettings.times.filter((_, i) => i !== index);
    const newSettings = { ...notificationSettings, times: newTimes };
    setNotificationSettings(newSettings);
    await saveNotificationSettings(newSettings);
    await scheduleDailyNotifications();
  };

  // 時間選擇器變更
  const onTimeChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    
    if (event.type === 'dismissed') {
      return;
    }
    
    if (selectedDate) {
      setTempTime(selectedDate);
      if (Platform.OS === 'android') {
        saveTimeSelection(selectedDate);
      }
    }
  };

  // 儲存時間選擇
  const saveTimeSelection = async (date = tempTime) => {
    const hour = date.getHours();
    const minute = date.getMinutes();
    
    let newTimes = [...notificationSettings.times];
    
    if (editingTimeIndex !== null) {
      newTimes[editingTimeIndex] = { ...newTimes[editingTimeIndex], hour, minute };
    } else {
      newTimes.push({ hour, minute, enabled: true });
    }
    
    // 按時間排序
    newTimes.sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute));
    
    const newSettings = { ...notificationSettings, times: newTimes };
    setNotificationSettings(newSettings);
    await saveNotificationSettings(newSettings);
    await scheduleDailyNotifications();
    setShowTimePicker(false);
  };

  // 格式化時間顯示
  const formatTime = (hour, minute) => {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  // 格式化心情
  const getMoodEmoji = (mood) => {
    const emojis = ['😢', '😕', '😐', '🙂', '😄'];
    return emojis[mood - 1] || '❓';
  };

  const renderSurveyItem = ({ item }) => {
    // 處理不同格式的 location 資料（相容舊資料和新資料）
    const getLocationDisplay = () => {
      if (!item.location) return null;
      // 新格式：直接存 latitude/longitude
      if (item.location.latitude !== undefined) {
        return `📍 ${item.location.latitude.toFixed(4)}, ${item.location.longitude.toFixed(4)}`;
      }
      // 舊格式：coords 物件
      if (item.location.coords) {
        return `📍 ${item.location.coords.latitude.toFixed(4)}, ${item.location.coords.longitude.toFixed(4)}`;
      }
      return null;
    };
    
    const locationDisplay = getLocationDisplay();
    
    // 分享單一影片
    const handleShareVideo = async () => {
      if (item.videoUri && await Sharing.isAvailableAsync()) {
        try {
          await Sharing.shareAsync(item.videoUri);
        } catch (error) {
          Alert.alert('錯誤', '無法分享影片，檔案可能已被刪除');
        }
      }
    };
    
    return (
      <View style={styles.surveyItem}>
        <View style={styles.surveyInfo}>
          <Text style={styles.surveyDate}>
            {new Date(item.timestamp).toLocaleString('zh-TW')}
          </Text>
          <Text style={styles.surveyMood}>
            心情: {getMoodEmoji(item.mood)} ({item.mood}/5)
          </Text>
          {locationDisplay && (
            <Text style={styles.surveyLocation} numberOfLines={1}>
              {locationDisplay}
            </Text>
          )}
          {item.hasVideo && item.videoUri && (
            <TouchableOpacity onPress={handleShareVideo}>
              <Text style={styles.surveyVideoLink}>
                🎥 有影片 (點擊分享)
              </Text>
            </TouchableOpacity>
          )}
          {item.hasVideo && !item.videoUri && (
            <Text style={styles.surveyVideo}>🎥 有影片</Text>
          )}
          {!item.hasVideo && (
            <Text style={styles.surveyVideo}>📷 無影片</Text>
          )}
        </View>
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => handleDeleteItem(item.id, item.timestamp)}
        >
          <Text style={styles.deleteButtonText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={{ fontSize: 40 }}>⚙️</Text>
        <Text style={styles.title}>設定</Text>
        <Text style={styles.subtitle}>管理您的提醒與資料</Text>
      </View>

      {/* 通知設定區塊 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔔 提醒設定</Text>
        
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>啟用每日提醒</Text>
          <Switch
            value={notificationSettings.enabled}
            onValueChange={toggleNotifications}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={notificationSettings.enabled ? '#007AFF' : '#f4f3f4'}
          />
        </View>

        {notificationSettings.enabled && (
          <>
            <Text style={styles.subLabel}>提醒時間 ({notificationSettings.times.length} 次/天)</Text>
            
            {notificationSettings.times.map((time, index) => (
              <View key={index} style={styles.timeRow}>
                <Switch
                  value={time.enabled}
                  onValueChange={() => toggleTimeEnabled(index)}
                  trackColor={{ false: '#767577', true: '#81b0ff' }}
                  thumbColor={time.enabled ? '#007AFF' : '#f4f3f4'}
                />
                <TouchableOpacity 
                  style={styles.timeButton}
                  onPress={() => handleEditTime(index)}
                >
                  <Text style={[styles.timeText, !time.enabled && styles.disabledText]}>
                    {formatTime(time.hour, time.minute)}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.removeTimeButton}
                  onPress={() => handleDeleteTime(index)}
                >
                  <Text style={styles.removeTimeText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity style={styles.addTimeButton} onPress={handleAddTime}>
              <Text style={styles.addTimeText}>+ 新增提醒時間</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* 資料管理區塊 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 資料管理</Text>
        <Text style={styles.dataCount}>
          共 {surveyData.length} 筆記錄，{surveyData.filter(item => item.hasVideo && item.videoUri).length} 部影片
        </Text>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.exportAllButton} onPress={handleExportAll}>
            <Text style={styles.exportAllButtonText}>📦 匯出全部 (JSON + 影片)</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity style={styles.clearButton} onPress={handleClearAll}>
          <Text style={styles.clearButtonText}>🗑️ 清除所有資料</Text>
        </TouchableOpacity>

        {surveyData.length > 0 ? (
          <FlatList
            data={surveyData.slice().reverse()}
            renderItem={renderSurveyItem}
            keyExtractor={item => item.id}
            scrollEnabled={false}
            style={styles.surveyList}
          />
        ) : (
          <Text style={styles.noDataText}>目前沒有任何記錄</Text>
        )}
      </View>

      {/* 時間選擇器 Modal */}
      {showTimePicker && (
        <Modal
          transparent={true}
          animationType="slide"
          visible={showTimePicker}
          onRequestClose={() => setShowTimePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {editingTimeIndex !== null ? '編輯提醒時間' : '新增提醒時間'}
              </Text>
              <DateTimePicker
                value={tempTime}
                mode="time"
                is24Hour={true}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onTimeChange}
                style={styles.timePicker}
              />
              {Platform.OS === 'ios' && (
                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={styles.modalCancelButton}
                    onPress={() => setShowTimePicker(false)}
                  >
                    <Text style={styles.modalCancelText}>取消</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.modalConfirmButton}
                    onPress={() => saveTimeSelection()}
                  >
                    <Text style={styles.modalConfirmText}>確定</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </Modal>
      )}

      {/* 底部空間給 Tab Bar */}
      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F8FAFC',
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 12,
    color: '#1E293B',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1E293B',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  settingLabel: {
    fontSize: 16,
    color: '#334155',
    fontWeight: '500',
  },
  subLabel: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 16,
    marginBottom: 12,
    fontWeight: '500',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FAFAFA',
    marginHorizontal: -8,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginBottom: 8,
  },
  timeButton: {
    flex: 1,
    marginLeft: 12,
  },
  timeText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#6366F1',
  },
  disabledText: {
    color: '#CBD5E1',
  },
  removeTimeButton: {
    padding: 10,
    backgroundColor: '#FEF2F2',
    borderRadius: 20,
  },
  removeTimeText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: 'bold',
  },
  addTimeButton: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#EEF2FF',
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#C7D2FE',
    borderStyle: 'dashed',
  },
  addTimeText: {
    color: '#6366F1',
    fontSize: 16,
    fontWeight: '700',
  },
  dataCount: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  exportAllButton: {
    flex: 1,
    backgroundColor: '#6366F1',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  exportAllButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  exportVideosButton: {
    backgroundColor: '#10B981',
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  exportVideosButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  exportButton: {
    flex: 1,
    backgroundColor: '#6366F1',
    padding: 14,
    borderRadius: 14,
    marginRight: 8,
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  exportButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  clearButton: {
    backgroundColor: '#FEF2F2',
    padding: 14,
    borderRadius: 14,
    marginTop: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  clearButtonText: {
    color: '#EF4444',
    fontWeight: 'bold',
    fontSize: 15,
  },
  surveyList: {
    maxHeight: 400,
  },
  surveyItem: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 14,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  surveyInfo: {
    flex: 1,
  },
  surveyDate: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
  },
  surveyMood: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  surveyLocation: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  surveyVideo: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  surveyVideoLink: {
    fontSize: 12,
    color: '#6366F1',
    marginTop: 4,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 10,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
  },
  deleteButtonText: {
    fontSize: 18,
  },
  noDataText: {
    textAlign: 'center',
    color: '#94A3B8',
    paddingVertical: 40,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '85%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#1E293B',
  },
  timePicker: {
    width: '100%',
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 20,
    width: '100%',
  },
  modalCancelButton: {
    flex: 1,
    padding: 14,
    marginRight: 8,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#64748B',
    fontWeight: '700',
    fontSize: 16,
  },
  modalConfirmButton: {
    flex: 1,
    padding: 14,
    marginLeft: 8,
    borderRadius: 12,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalConfirmText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
});
