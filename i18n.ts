import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import _ from "lodash";

// the translations
// (tip move them in a JSON file and import them,
// or even better, manage them separated from your code: https://react.i18next.com/guides/multiple-translation-files)

type LocaleTypes = "en" | "ja";
const localeCode: LocaleTypes = "en";
// prettier-ignore
const translationMap = {
  "Game Master": { ja: "ゲームマスター" },
  "MAP": { ja: "地図" },
  "Thief Status": { ja: "泥棒ステータス" },
  "Setting": { ja: "設定" },
  "Game Start": { ja: "ゲームスタート" },
};

const translate = (locale: string) => {
  const convertedTranslation: { [key: string]: string } = {};
  if (locale === "en") {
    _.forEach(translationMap, (_, key) => {
      convertedTranslation[key] = convertedTranslation[key];
    });
  } else {
    _.forEach(translationMap, (value, key) => {
      convertedTranslation[key] =
        value[localeCode as Exclude<"en", LocaleTypes>];
    });
  }
  return convertedTranslation;
};

const resources = {
  en: {
    translation: translate("en"),
  },
  ja: {
    translation: translate("ja"),
  },
};

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources,
    lng: localeCode, // language to use, more information here: https://www.i18next.com/overview/configuration-options#languages-namespaces-resources
    // you can use the i18n.changeLanguage function to change the language manually: https://www.i18next.com/overview/api#changelanguage
    // if you're using a language detector, do not define the lng option

    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });

export default i18n;
