import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import stringsEN from './assets/strings.en.json';
import stringsPT from './assets/strings.pt.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: stringsEN
      },
      pt: {
        translation: stringsPT
      }
    },
    lng: 'pt', // default language
    fallbackLng: 'pt',
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n; 