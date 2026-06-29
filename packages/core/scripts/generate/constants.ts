/** The maximum number of concurrent requests to make to the API. */
export const MAX_CONCURRENCY = 70

/**
 * 增量重试时间窗口（毫秒）。
 * 若距上次更新（status.json 的 lastUpdate）小于该窗口且上次存在失败组合，
 * 则只重跑失败的 (bank, city) 组合，而不做全量爬取。默认 2 小时。
 */
export const RETRY_WINDOW_MS = 2 * 60 * 60 * 1000
