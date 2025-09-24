import i18n from 'i18next';
import { initReactI18next, useTranslation } from 'react-i18next';
import stringsEN from './assets/strings.en.json';
import stringsPT from './assets/strings.pt.json';

// Initialize i18n
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

// Function to change language
export const changeLanguage = (language: 'en' | 'pt') => {
  return i18n.changeLanguage(language);
};

// Hook to use translations
export const useAppTranslation = () => {
  const { t, i18n: i18nInstance } = useTranslation();
  return { t, i18n: i18nInstance };
};

export default i18n; 