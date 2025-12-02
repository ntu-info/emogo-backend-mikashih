import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Button, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { saveSurveyData, saveVideoToPermanentStorage } from '../../utils/storage';

export default function SurveyScreen() {
  const [mood, setMood] = useState(null);
  const [location, setLocation] = useState(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [isRecording, setIsRecording] = useState(false);
  const [videoUri, setVideoUri] = useState(null);
  const cameraRef = useRef(null);
  const [step, setStep] = useState(1); // 1: Mood, 2: Camera
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [facing, setFacing] = useState('front'); // 'front' or 'back'

  useEffect(() => {
    (async () => {
      // Request location permission
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission to access location was denied');
        setLoadingLocation(false);
        return;
      }

      try {
        let currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        console.log('取得位置:', currentLocation);
        setLocation(currentLocation);
      } catch (error) {
        console.error('取得位置失敗:', error);
        Alert.alert('無法取得位置', '請確認 GPS 已開啟');
      }
      setLoadingLocation(false);

      // Request microphone permission for video recording
      if (!micPermission?.granted) {
        await requestMicPermission();
      }
    })();
  }, []);

  if (!permission || !micPermission) {
    // Camera/Mic permissions are still loading.
    return <View />;
  }

  if (!permission.granted || !micPermission.granted) {
    // Camera or Microphone permissions are not granted yet.
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center', marginBottom: 10 }}>
          需要相機和麥克風權限才能錄影
        </Text>
        {!permission.granted && (
          <Button onPress={requestPermission} title="允許相機權限" />
        )}
        {!micPermission.granted && (
          <Button onPress={requestMicPermission} title="允許麥克風權限" />
        )}
      </View>
    );
  }

  const handleMoodSelect = (selectedMood) => {
    setMood(selectedMood);
  };

  const handleNextStep = () => {
    if (!mood) {
      Alert.alert('請選擇心情', '請先選擇一個心情指數');
      return;
    }
    setStep(2);
  };

  const startRecording = async () => {
    if (cameraRef.current) {
      setIsRecording(true);
      try {
        const video = await cameraRef.current.recordAsync({
          maxDuration: 1, // Record for 1 second
        });
        const recordedUri = video.uri;
        setVideoUri(recordedUri);
        setIsRecording(false);
        
        // 直接儲存，不等 state 更新
        await saveRecordedData(recordedUri);
      } catch (error) {
        console.error(error);
        setIsRecording(false);
        Alert.alert('錯誤', '錄影失敗');
      }
    }
  };
  
  // Manual stop is not needed if maxDuration is set, but kept for robustness
  const stopRecording = () => {
      if (cameraRef.current && isRecording) {
          cameraRef.current.stopRecording();
          setIsRecording(false);
      }
  }

  // 切換前後鏡頭
  const toggleCameraFacing = () => {
    setFacing(current => (current === 'front' ? 'back' : 'front'));
  };

  // 跳過錄影
  const handleSkipRecording = () => {
    Alert.alert(
      '跳過錄影',
      '確定要跳過錄影嗎？',
      [
        { text: '取消', style: 'cancel' },
        { 
          text: '確定跳過', 
          onPress: () => {
            setVideoUri(null);
            handleFinishWithoutVideo();
          }
        }
      ]
    );
  };

  const handleFinishWithoutVideo = async () => {
    console.log('Mood:', mood);
    console.log('Location:', location);
    console.log('Video: 已跳過');
    
    // 儲存資料到本地
    try {
      await saveSurveyData({
        mood,
        location: location ? {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          timestamp: location.timestamp,
        } : null,
        hasVideo: false,
        videoUri: null,
      });
      Alert.alert('已完成', '您的心情已記錄（無影片）');
    } catch (error) {
      console.error('儲存資料失敗:', error);
      Alert.alert('錯誤', '儲存資料失敗');
    }
    
    // Reset for next time
    setStep(1);
    setMood(null);
    setVideoUri(null);
  };

  // 儲存錄影資料（帶有 video uri 參數）
  const saveRecordedData = async (recordedVideoUri) => {
    console.log('Mood:', mood);
    console.log('Location:', location);
    console.log('Video URI (temp):', recordedVideoUri);

    // 儲存資料到本地
    try {
      // 先將影片從暫存目錄複製到持久化目錄
      const permanentVideoUri = await saveVideoToPermanentStorage(recordedVideoUri);
      console.log('Video URI (permanent):', permanentVideoUri);
      
      await saveSurveyData({
        mood,
        location: location ? {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          timestamp: location.timestamp,
        } : null,
        hasVideo: true,
        videoUri: permanentVideoUri,
      });
      
      Alert.alert('完成', '您的心情與影像已記錄！');
    } catch (error) {
      console.error('儲存資料失敗:', error);
      Alert.alert('錯誤', '儲存資料失敗');
    }
    
    // Reset for next time
    setStep(1);
    setMood(null);
    setVideoUri(null);
  };

  // 心情 emoji 對應
  const moodEmojis = ['😢', '😞', '😐', '😊', '😄'];

  return (
    <View style={styles.container}>
      {step === 1 && (
        <>
          <Text style={{ fontSize: 48, marginBottom: 20 }}>📝</Text>
          <Text style={styles.question}>今天的心情如何？</Text>
          <Text style={styles.subTitle}>選擇最符合您目前狀態的心情</Text>

          <View style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.ratingButton,
                  mood === item && styles.selectedButton,
                ]}
                onPress={() => handleMoodSelect(item)}
              >
                <Text style={{ fontSize: mood === item ? 28 : 24 }}>
                  {moodEmojis[item - 1]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          {loadingLocation && <ActivityIndicator size="small" color="#0000ff" />}
          {loadingLocation && <Text style={styles.locationLoadingText}>正在取得位置...</Text>}
          {location && (
            <Text style={styles.locationText}>
              📍 已取得位置 ({location.coords.latitude.toFixed(4)}, {location.coords.longitude.toFixed(4)})
            </Text>
          )}
          {!loadingLocation && !location && (
            <Text style={styles.locationErrorText}>⚠️ 無法取得位置</Text>
          )}

          <TouchableOpacity style={styles.nextButton} onPress={handleNextStep}>
            <Text style={styles.nextButtonText}>下一步</Text>
          </TouchableOpacity>
        </>
      )}

      {step === 2 && (
        <View style={styles.cameraContainer}>
          <Text style={styles.cameraTitle}>請錄製 1 秒鐘的影片</Text>
          <CameraView
            style={styles.camera}
            facing={facing}
            mode="video"
            ref={cameraRef}
          >
            {/* 切換鏡頭按鈕 */}
            <View style={styles.flipButtonContainer}>
              <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing}>
                <Text style={styles.flipButtonText}>🔄 切換鏡頭</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.buttonContainer}>
              {!isRecording ? (
                <TouchableOpacity style={styles.recordButton} onPress={startRecording}>
                  <Text style={styles.recordButtonText}>開始錄影 (1秒)</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.recordingText}>錄影中...</Text>
              )}
            </View>
          </CameraView>
          
          <View style={styles.bottomButtonsContainer}>
            <TouchableOpacity style={styles.backButton} onPress={() => setStep(1)}>
              <Text style={styles.backButtonText}>回上一步</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.skipButton} onPress={handleSkipRecording}>
              <Text style={styles.skipButtonText}>跳過錄影</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#F8FAFC',
  },
  question: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1E293B',
    textAlign: 'center',
  },
  subTitle: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 40,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  ratingButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    shadowColor: '#6366F1',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  selectedButton: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
    transform: [{ scale: 1.1 }],
    shadowOpacity: 0.3,
  },
  ratingText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#64748B',
  },
  selectedText: {
    color: '#FFFFFF',
  },
  locationText: {
    marginBottom: 24,
    color: '#10B981',
    fontSize: 14,
    fontWeight: '500',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  locationLoadingText: {
    marginBottom: 12,
    color: '#64748B',
    fontSize: 14,
  },
  locationErrorText: {
    marginBottom: 24,
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '500',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  nextButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 30,
    shadowColor: '#6366F1',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  cameraContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
  },
  cameraTitle: {
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
    color: '#1E293B',
  },
  camera: {
    flex: 1,
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 20,
  },
  buttonContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'center',
    margin: 20,
    alignItems: 'flex-end',
  },
  recordButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 32,
    paddingVertical: 18,
    borderRadius: 50,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  recordButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  recordingText: {
    color: '#EF4444',
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
    textShadowColor: 'rgba(239, 68, 68, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  flipButtonContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
  },
  flipButton: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  flipButtonText: {
    color: '#1E293B',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginBottom: 100,
  },
  backButton: {
    backgroundColor: '#64748B',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  backButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  skipButton: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
    flex: 1,
    marginLeft: 10,
    alignItems: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  skipButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
