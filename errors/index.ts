export type ErrorCode =
  | "err.global.unknown"
  | "err.repo.hero.client"
  | "err.repo.hero.auth"
  | "err.repo.hero.unknown"
  | "err.repo.hero.notfound";

export const ErrorMessage: { [C in ErrorCode]: string } = {
  "err.global.unknown": "未知錯誤",
  "err.repo.hero.auth": "驗證失敗",
  "err.repo.hero.client": "無效請求",
  "err.repo.hero.notfound": "查無資料",
  "err.repo.hero.unknown": "未知錯誤",
} as const;

// TODO: 確認code和message是相對應的
type ErrorResponse = {
  code: ErrorCode;
  message: (typeof ErrorMessage)[ErrorCode];
};

export default ErrorResponse;
