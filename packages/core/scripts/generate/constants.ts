/** The maximum number of concurrent requests to make to the API. */
export const MAX_CONCURRENCY = 70

/**
 * 增量重试时间窗口（毫秒）。
 * 若距上次更新（status.json 的 lastUpdate）小于该窗口且上次存在失败组合，
 * 则只重跑失败的 (bank, city) 组合，而不做全量爬取。默认 2 小时。
 */
export const RETRY_WINDOW_MS = 2 * 60 * 60 * 1000

/**
 * 全量爬取的数据下限比例。
 * 若全量结果条数低于「现有数据条数 × 该比例」（默认 90%），视为本次爬取异常
 * （如隧道中断导致大量任务失败），拒绝覆盖现有 cnaps.json/csv 并以非 0 退出，
 * 避免一次残缺的运行清空好数据。
 */
export const DATA_FLOOR_RATIO = 0.9
