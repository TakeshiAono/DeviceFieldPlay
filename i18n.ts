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
  // TeamEditScreen translations
  "Participation QR": { ja: "参加QR" },
  "Have friends scan to join the game": { ja: "友達にスキャンしてもらい\nゲームに参加してもらいましょう" },
  "To display game group QR, please start the game": { ja: "ゲームグループQRを表示するためには\nゲームをスタートしてください" },
  "Close": { ja: "閉じる" },
  "Thief (Alive)": { ja: "泥棒(生存)" },
  "Thief (Arrested)": { ja: "泥棒(逮捕)" },
  "Change to Thief (Alive)": { ja: "泥棒(生存)に変更" },
  "Change to Thief (Arrested)": { ja: "泥棒(逮捕)に変更" },
  "At least one thief (alive) and one police officer are required.": { ja: "泥棒(生)と警察が各1人以上必要です。" },
  // SettingScreen translations
  "Team Settings": { ja: "チーム設定" },
  "Time Limit Settings": { ja: "タイムリミット設定" },
  "Cancel Game": { ja: "ゲーム中止" },
  "Leave Game": { ja: "ゲームから抜ける" },
  "Error": { ja: "エラー" },
  "Failed to leave game": { ja: "ゲームから抜ける処理に失敗しました" },
  "Let's scan QR and join the game group!!": { ja: "QRを読み込ませてもらって\nゲームグループに参加しましょう!!" },
  // PrisonAreaScreen translations
  "Prison Area Selection": { ja: "監獄エリア選択" },
  "Like valid area, you can set the area by tapping 3 points on the map. Press 'Register Area' to confirm": { ja: "有効エリアと同じく地図上の好きな箇所を3点、タップすればエリアを設定できます。「エリア登録」を押して確定させてください" },
  "Delete Area": { ja: "エリア削除" },
  "Please set 3 or more points for prison area.": { ja: "監獄エリアは3点以上設定してください。" },
  "Update Area": { ja: "エリア更新" },
  "Register Area": { ja: "エリア登録" },
  // _layout.tsx translations
  "Skip": { ja: "スキップ" },
  "Previous": { ja: "前に戻る" },
  "Next": { ja: "次へ" },
  "Finish": { ja: "完了" },
  "Name Registration": { ja: "名前登録" },
  "View app instructions": { ja: "アプリの使い方をみる" },
  "Please enter the name to use in the game": { ja: "ゲームで使用する名前を入力してください" },
  "Please write your name": { ja: "お名前を記入してください" },
  "Please select your role in the game": { ja: "あなたのゲーム内での役職を選んでください" },
  "Member": { ja: "メンバー" },
  "Register": { ja: "登録" },
  "Inherit settings to next game": { ja: "次ゲームへ設定を引き継ぐ" },
  // Additional SettingScreen translations
  "Join Game": { ja: "ゲームに参加" },
  "You can join the game hosted by the game master by reading the game master's QR code.": { ja: "ゲームマスターのQRコードを読み取ることで、ゲームマスターが主催しているゲームに参加することができます。" },
  // GameTimeScreen translations
  "Game End Time Setting Method": { ja: "終了時間設定方法" },
  "Please set the end time for the game": { ja: "ゲームの終了時間を設定しください" },
  "Game Time Setting": { ja: "ゲーム時間設定" },
  "Game End Time": { ja: "ゲーム終了時間" },
  "Set": { ja: "設定" },
  "Cancel": { ja: "キャンセル" },
  "Confirm": { ja: "確認" },
  "Really leave the game?": { ja: "本当にゲームから抜けますか？" },
  "Leave": { ja: "抜ける" },
  // ValidAreaScreen translations
  "Area Setting Method": { ja: "エリア設定方法" },
  "You can set the area by tapping 3 points on the map. Press 'Register Area' to confirm": { ja: "地図上の好きな箇所を3点、タップすればエリアを設定できます。「エリア登録」を押して確定させてください" },
  "Please set 3 or more points for valid area.": { ja: "有効エリアは3点以上設定してください。" },
};

const translate = (locale: string) => {
  const convertedTranslation: { [key: string]: string } = {};
  if (locale === "en") {
    _.forEach(translationMap, (_, key) => {
      convertedTranslation[key] = key;
    });
  } else {
    _.forEach(translationMap, (value, key) => {
      convertedTranslation[key] =
        value[locale as Exclude<"en", LocaleTypes>];
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
