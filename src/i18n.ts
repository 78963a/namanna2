import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { ko } from './locales/ko';
import { ja } from './locales/ja';
import { en } from './locales/en';

// 다국어 번역 리소스 정의 (ko, en, ja)
const resources = {
  ko: { translation: ko },
  en: { translation: en },
  ja: { translation: ja }
};

i18n
  // 사용자 기기 언어 감지
  .use(LanguageDetector)
  // react-i18next 바인딩
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'ko', // 기본 언어
    debug: false,
    interpolation: {
      escapeValue: false // React는 이미 XSS 방어가 되어 있으므로 false 설정
    },
    detection: {
      order: ['navigator', 'querystring', 'cookie', 'localStorage', 'htmlTag'],
      caches: ['localStorage']
    }
  });

export default i18n;
