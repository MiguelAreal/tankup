import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Ficheiros de tradução
import en from '../assets/strings.en.json';
import pt from '../assets/strings.pt.json';

const resources = {
  en: { translation: en },
  pt: { translation: pt },
};

// Deteta a língua do dispositivo para ser o default
const getDeviceLanguage = () => {
  const locale = Localization.getLocales()[0]?.languageCode;
  return locale === 'pt' ? 'pt' : 'en'; // Fallback para inglês se não for PT
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getDeviceLanguage(), // Língua inicial
    fallbackLng: 'pt', // Se a tradução falhar, usa português
    interpolation: {
      escapeValue: false,
    },
    compatibilityJSON: 'v3' as any, 
    react: {
      useSuspense: false,
    },
  });

export default i18n;