import type { CnapsResult, FailedTask, GansuDetailCnaps } from './api/cnaps'
import fse from 'fs-extra'
import { getCnapsList, retryTasks } from './api/cnaps'
import { RETRY_WINDOW_MS } from './constants'
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
}

async function readStatus(): Promise<Status | null> {
  try {
    return await fse.readJSON(STATUS_JSON) as Status
  }
  catch {
    return null
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
  }

  await writeOutputs(list, {
    lastUpdate: new Date().toISOString(),
    mode: incremental ? 'incremental' : 'full',
    total: list.length,
    errorCount: result.errors.length,
    errors: result.errors,
  })
})()
