// Translation dictionary for localizing English text to Japanese
export const translations = {
  // Error messages
  "FCM API Error:": "FCM API エラー:",
  "Failed to send FCM message": "FCMメッセージの送信に失敗しました",
  "fetchTagGames:": "タグゲーム取得:",
  "putTagGames:": "タグゲーム更新:",
  "joinUser:": "ユーザー参加:",
  "fetchCurrentGameUsersInfo:": "現在のゲームユーザー情報取得:",
  "putUser:": "ユーザー更新:",
  "rejectUsers:": "ユーザー逮捕:",
  "reviveUser:": "ユーザー復活:",
  "putDevice:": "デバイス更新:",
  
  // Alert buttons
  "Cancel": "キャンセル",
  "OK": "OK",
  
  // Notification data
  "gameEnd": "ゲーム終了",
  "joinUser": "ユーザー参加",
  "kickOutUsers": "ユーザー退出",
  "reviveUser": "ユーザー復活",
  "rejectUser": "ユーザー逮捕",
  "policeUser": "警察ユーザー",
  "changePrisonArea": "監獄エリア変更",
  "changeValidArea": "有効エリア変更",
  "gameStart": "ゲーム開始",
  
  // Common status codes
  "success": "成功",
  "error": "エラー"
};

// Translation function
export function t(key: string): string {
  return translations[key as keyof typeof translations] || key;
}