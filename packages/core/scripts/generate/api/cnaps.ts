import type { AxiosResponse } from 'axios'
import type { GansuDetailCity } from './city'
import type { GansuResponseModel, GansuRSP } from './gansu.api'
import type { GansuBank } from './gansuBank'
import async from 'async'
import { MAX_CONCURRENCY } from '../constants'
import logger from '../logger'
import { getCities } from './city'
import { getBanks } from './gansuBank'
import http from './http'

export interface GansuCnaps {
  LName: string
  BankCode: string
}

export interface GansuDetailCnaps
  extends GansuCnaps,
  GansuDetailCity,
  GansuBank {
}

export interface QueryAccBankParam {
  bankId: string
  bankName: string
  cityCode: string
}

/** 一个待查询的 (bank, city) 组合。 */
export interface Task {
  bank: GansuBank
  city: GansuDetailCity
}

/** 查询失败的组合及其错误信息。存完整 bank/city 以便后续增量重试。 */
export interface FailedTask extends Task {
  message: string
}

/** 爬取结果：成功数据 + 失败组合列表。 */
export interface CnapsResult {
  list: GansuDetailCnaps[]
  errors: FailedTask[]
}

async function queryAccBank(params: QueryAccBankParam): Promise<GansuCnaps[]> {
  // 注意：这里不再 catch 网络错误。axios-retry 重试 3 次后仍失败会抛出，
  // 由上层 runTasks 捕获并记录为真实错误；空 List 才算"该组合本就无网点"。
  const response: AxiosResponse<GansuResponseModel<GansuRSP<GansuCnaps[]>>>
          = await http.post(`/per/trans/queryAccBank.do?t=${Date.now()}`, {
            BankName: params.bankName,
            CityCode: params.cityCode,
            PayeeBankId: params.bankId,
          })

  return response.data.RSP?.List || []
}

async function queryReallyAccBank(
  bank: GansuBank,
  city: GansuDetailCity,
): Promise<GansuDetailCnaps[]> {
  const cnapsList = await queryAccBank({
    bankId: bank.BankId,
    cityCode: city.CityCode,
    bankName: bank.BankName,
  })

  logger.debug(
    `bank: ${bank.BankName}, city: ${city.CityName}, cnaps: ${cnapsList.length}`,
  )
  return cnapsList.map((cnaps) => {
    return Object.assign(cnaps, { LName: cnaps.LName.replace(',', '，') }, bank, city)
  })
}

/**
 * 并发执行一批 (bank, city) 查询任务，统一收集成功数据与失败组合。
 * 全量爬取与增量重试都走这个函数。
 */
async function runTasks(tasks: Task[]): Promise<CnapsResult> {
  const errors: FailedTask[] = []
  const total = tasks.length
  const startedAt = Date.now()
  let completed = 0

  // eslint-disable-next-line ts/no-unsafe-function-type
  const promiseFnList: Array<(callback: Function) => void> = tasks.map(
    task => (callback) => {
      queryReallyAccBank(task.bank, task.city)
        .then(value => callback(null, value))
        .catch((e: unknown) => {
          const message = e instanceof Error ? e.message : String(e)
          logger.error(`bank=${task.bank.BankName} city=${task.city.CityName}: ${message}`)
          errors.push({ ...task, message })
          callback(null, [])
        })
        .finally(() => {
          completed += 1
          if (completed % 500 === 0 || completed === total) {
            const elapsed = (Date.now() - startedAt) / 1000
            const rate = elapsed > 0 ? completed / elapsed : 0
            const etaSeconds = rate > 0 ? (total - completed) / rate : 0
            logger.info(
              `progress: ${completed}/${total} (${(completed / total * 100).toFixed(1)}%), `
              + `elapsed ${elapsed.toFixed(0)}s, rate ${rate.toFixed(1)}/s, `
              + `ETA ${etaSeconds.toFixed(0)}s, errors ${errors.length}`,
            )
          }
        })
    },
  )

  const cnapsMatrix = await async.parallelLimit<
    GansuDetailCnaps[],
    GansuDetailCnaps[][]
  >(promiseFnList, MAX_CONCURRENCY)

  return {
    list: cnapsMatrix
      .flatMap(cnaps => cnaps)
      .sort((a, b) => a.BankCode.localeCompare(b.BankCode)),
    errors,
  }
}

/** 全量爬取：所有 bank × city 组合。 */
export async function getCnapsList(): Promise<CnapsResult> {
  const banks = await getBanks()
  const cities = await getCities(true)

  const tasks: Task[] = []
  for (const bank of banks) {
    for (const city of cities)
      tasks.push({ bank, city })
  }

  logger.info('start query cnaps (full)')
  logger.info(`banks: ${banks.map(bank => bank.BankName)}`)
  logger.info(`cities: ${cities.map(city => city.CityName)}`)
  logger.info(`total tasks: ${tasks.length}`)

  const result = await runTasks(tasks)

  logger.info('query cnaps done')
  return result
}

/** 增量重试：只查询给定的失败组合。 */
export async function retryTasks(tasks: Task[]): Promise<CnapsResult> {
  logger.info(`start retry ${tasks.length} failed tasks (incremental)`)
  const result = await runTasks(tasks.map(({ bank, city }) => ({ bank, city })))
  logger.info('retry done')
  return result
}
