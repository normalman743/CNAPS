import type { CnapsResult, FailedTask, GansuDetailCnaps } from './api/cnaps'
import process from 'node:process'
import fse from 'fs-extra'
import { getCnapsList, retryTasks } from './api/cnaps'
import { DATA_FLOOR_RATIO, RETRY_WINDOW_MS } from './constants'
import logger from './logger'

const CNAPS_JSON = 'assets/cnaps.json'
const CNAPS_CSV = 'assets/cnaps.csv'
const STATUS_JSON = 'assets/status.json'

/** status.json 的结构：记录每次爬取的时间、模式与失败组合。 */
interface Status {
  /** 本次更新完成时间（ISO 8601）。 */
  lastUpdate: string
  /** 本次运行模式。 */
  mode: 'full' | 'incremental'
  /** 当前数据总条数。 */
  total: number
  /** 本次仍失败的组合数量。 */
  errorCount: number
  /** 本次仍失败的组合详情（含完整 bank/city，供下次增量重试）。 */
  errors: FailedTask[]
  /** 全量结果触发下限保护被中止时为 true（此时 cnaps.json/csv 未被覆盖）。 */
  aborted?: boolean
}

async function readStatus(): Promise<Status | null> {
  try {
    return await fse.readJSON(STATUS_JSON) as Status
  }
  catch {
    return null
  }
}

/** 读取现有 cnaps.json 的条数；文件不存在或损坏时返回 0。 */
async function countExisting(): Promise<number> {
  try {
    const existing = await fse.readJSON(CNAPS_JSON) as GansuDetailCnaps[]
    return existing.length
  }
  catch {
    return 0
  }
}

/**
 * 按 BankCode 合并：以现有数据为基底，用新查到的数据覆盖/追加同 BankCode 条目。
 * 增量重试时，失败组合上次没有任何数据，这里相当于把新查到的网点补进去。
 */
function mergeByBankCode(
  existing: GansuDetailCnaps[],
  fresh: GansuDetailCnaps[],
): GansuDetailCnaps[] {
  const map = new Map<string, GansuDetailCnaps>()
  for (const item of existing)
    map.set(item.BankCode, item)
  for (const item of fresh)
    map.set(item.BankCode, item)
  return [...map.values()].sort((a, b) => a.BankCode.localeCompare(b.BankCode))
}

function toCsv(data: GansuDetailCnaps[]): string {
  if (data.length === 0)
    return ''
  const headerRow = `${Object.keys(data[0]).join(',')}\n`
  const bodyRows = data.map(item => Object.values(item).join(',')).join('\n')
  return headerRow + bodyRows
}

async function writeOutputs(list: GansuDetailCnaps[], status: Status): Promise<void> {
  await fse.writeJSON(CNAPS_JSON, list, { spaces: 2 })
  await fse.writeFile(CNAPS_CSV, toCsv(list))
  await fse.writeJSON(STATUS_JSON, status, { spaces: 2 })
  logger.info(
    `done: mode=${status.mode}, total=${status.total}, errors=${status.errorCount}`,
  )
}

(async function iife() {
  const startedAt = Date.now()
  const prev = await readStatus()
  const withinWindow
    = prev !== null
      && Date.now() - new Date(prev.lastUpdate).getTime() < RETRY_WINDOW_MS
  const incremental = withinWindow && (prev?.errors.length ?? 0) > 0

  let list: GansuDetailCnaps[]
  let result: CnapsResult

  if (incremental && prev) {
    logger.info(
      `incremental mode: last update ${prev.lastUpdate}, retry ${prev.errors.length} failed tasks`,
    )
    const existing = await fse.readJSON(CNAPS_JSON) as GansuDetailCnaps[]
    result = await retryTasks(prev.errors)
    list = mergeByBankCode(existing, result.list)
  }
  else {
    if (withinWindow)
      logger.info('within retry window but no previous errors, run full anyway')
    logger.info('full mode')
    result = await getCnapsList()
    list = result.list

    // 下限保护：全量结果异常（如隧道中断致大量失败）时，拒绝覆盖现有好数据。
    // 基线取现有 cnaps.json 实际条数；首次运行（无现有数据）则仅拦截空结果。
    const existingCount = await countExisting()
    const floor = Math.max(Math.floor(existingCount * DATA_FLOOR_RATIO), 1)
    if (list.length < floor) {
      logger.error(
        `full crawl produced ${list.length} records, below floor ${floor} `
        + `(existing ${existingCount}, ratio ${DATA_FLOOR_RATIO}); `
        + `refusing to overwrite cnaps.json/csv`,
      )
      // 记一份带 aborted 标记的状态用于排查，但不动 cnaps.json/csv。
      await fse.writeJSON(STATUS_JSON, {
        lastUpdate: new Date().toISOString(),
        mode: 'full',
        total: list.length,
        errorCount: result.errors.length,
        errors: result.errors,
        aborted: true,
      }, { spaces: 2 })
      process.exitCode = 1
      return
    }
  }

  await writeOutputs(list, {
    lastUpdate: new Date().toISOString(),
    mode: incremental ? 'incremental' : 'full',
    total: list.length,
    errorCount: result.errors.length,
    errors: result.errors,
  })

  logger.info(`total elapsed: ${((Date.now() - startedAt) / 1000).toFixed(1)}s`)
})()
