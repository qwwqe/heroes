import { ErrorCode } from "@errors";

export type RepoErrorCode = Extract<ErrorCode, `err.repo.${string}`>;
