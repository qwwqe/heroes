import { RepoErrorCode } from "./errors";

/**
 * Repository的通用運算結果類型。
 *
 * 凡是{@link BaseRepo}所繼承的類別方法或物件方法，
 * 無論運算有無錯誤，都應該避免主動拋出exception，
 * 而盡可能地把「所能預期的」運算結果包成*RepoResult*來回傳。
 */
export type RepoResult<T> = Promise<RepoSuccess<T> | RepoFailure>;

/**
 * @todo 補充說明
 */
export interface RepoSuccess<T> {
  ok: true;
  data: T;
}

/**
 * @todo 補充說明
 */
export interface RepoFailure {
  ok: false;
  code: RepoErrorCode;
  message: string;
}

/**
 * 資料存取的抽象化介面。此介面定義各格repository的共同方法。
 *
 * 有關於此介面的例外處理，請參考{@link RepoResult}。
 */
interface BaseRepo {
  /**
   * 啟動repository，如連線到資料庫或驗證外部的API伺服器。
   *
   * 有些repository的實作並不會有什麼特別的啟動步驟，在這種
   * 情況此方法可能會是stub。
   */
  open(): RepoResult<void>;

  /**
   * 關閉repository，如關閉資料庫的連線或釋放外部API的資源。
   */
  close(): RepoResult<void>;
}

export default BaseRepo;
