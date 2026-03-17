import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from '@/locales/en/translation.json'
import ko from '@/locales/ko/translation.json'
import ja from '@/locales/ja/translation.json'
import zh from '@/locales/zh/translation.json'
import es from '@/locales/es/translation.json'

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ko: { translation: ko },
    ja: { translation: ja },
    zh: { translation: zh },
    es: { translation: es },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export default i18n
