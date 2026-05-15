# 네이티브 앱 전환 시 오디오 설정 가이드 (iOS & Android)

이 문서는 루틴 앱이 네이티브 앱(iOS 및 Android)으로 전환되었을 때, 다른 앱(유튜브, 음악 등)의 소리와 섞이면서도 안내 음성이 나올 때 배경음을 자동으로 줄여주는(Ducking) 설정을 위한 가이드입니다.

---

## 1. iOS (Swift) 설정
iOS에서는 `AVAudioSession`을 사용하여 오디오 동작을 제어합니다.

### 구현 위치: `AppDelegate.swift` 또는 전용 AudioService 클래스

```swift
import AVAudioSession

func configureAudioSession() {
    let audioSession = AVAudioSession.sharedInstance()
    do {
        // 1. 카테고리 설정: .playback (백그라운드 재생 지원)
        // 2. 옵션 설정: .mixWithOthers (다른 앱과 소리 섞임), .duckOthers (안내 시 다른 앱 소리 줄임)
        try audioSession.setCategory(
            .playback, 
            mode: .voicePrompt, 
            options: [.mixWithOthers, .duckOthers]
        )
        
        // 오디오 세션 활성화
        try audioSession.setActive(true)
        print("iOS 오디오 세션 설정 완료: MixWithOthers & DuckOthers")
    } catch {
        print("AVAudioSession 설정 실패: \(error)")
    }
}
```

---

## 2. Android (Kotlin) 설정
안드로이드에서는 `AudioAttributes`와 `AudioFocusRequest`를 사용하여 구현합니다.

### 구현 위치: `MainActivity.kt` 또는 TTS 엔진 초기화 섹션

```kotlin
import android.content.Context
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager

fun requestAudioFocusForSpeech(context: Context) {
    val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
    
    // 1. 오디오 속성 정의: 안내 음성(USAGE_ASSISTANCE_NAVIGATION_GUIDANCE)
    val audioAttributes = AudioAttributes.Builder()
        .setUsage(AudioAttributes.USAGE_ASSISTANCE_NAVIGATION_GUIDANCE)
        .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
        .build()

    // 2. 오디오 포커스 요청: AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK (일시적으로 획득하며 배경음은 덕킹)
    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_INT.O) {
        val focusRequest = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK)
            .setAudioAttributes(audioAttributes)
            .setAcceptsDelayedFocusGain(true)
            .setOnAudioFocusChangeListener { focusChange ->
                // 포커스 변경 핸들링 (필요 시)
            }
            .build()
            
        audioManager.requestAudioFocus(focusRequest)
    } else {
        // 구버전 대응
        @Suppress("DEPRECATION")
        audioManager.requestAudioFocus(
            { /* Listener */ },
            AudioManager.STREAM_MUSIC,
            AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK
        )
    }
}
```

---

## 3. 구현 팁 (Capacitor/Cordova 사용 시)

웹 코드에서 네이티브 API에 직접 접근할 수 없으므로, 위 설정을 포함한 커스텀 플러그인을 사용하거나, 이미 구현된 플러그인의 초기화 코드에 위 설정을 삽입해야 합니다.

*   **iOS**: `AppDelegate.swift`의 `didFinishLaunchingWithOptions` 함수 내에서 `configureAudioSession()`을 호출합니다.
*   **Android**: TTS(Text-to-Speech)를 실행하기 직전에 `requestAudioFocusForSpeech()`를 호출하거나, 앱 초기화 시점에 설정합니다.

---

## 4. 웹 버전 현재 적용 사항 (PWA/Browser)

현재 본 앱의 `voiceService.ts`와 `soundService.ts`에는 **Web Media Session API**가 적용되어 있습니다. 
비록 브라우저 환경에서는 위 네이티브 API만큼 정밀한 제어는 어렵지만, 모바일 브라우저(Safari/Chrome)에서 시스템 미디어 플레이어로 인식되게 함으로써 다음과 같은 효과를 기대할 수 있습니다:
*   안내 음성 출력 시 일부 모바일 브라우저에서 배경음이 자동으로 덕킹됨
*   제어 센터에서 앱의 안내 상태 확인 가능
