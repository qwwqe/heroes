import { ErrorCode } from "@errors";

export type HeroRepoErrorCode = Extract<ErrorCode, `err.repo.hero.${string}`>;
