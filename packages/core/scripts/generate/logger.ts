import process from 'node:process'
import pino from 'pino'

let lastTimestamp = Date.now()

export default pino({
  // 默认 info；设 LOG_LEVEL=debug 可打印每个 (银行,城市) 查询明细用于分析
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    bindings() {
      return {}
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  mixin() {
    const nowTimestamp = Date.now()
    const diffTimestamp = nowTimestamp - lastTimestamp
    lastTimestamp = nowTimestamp

    return {
      // convert diff timestamp to seconds
      diffSeconds: `${diffTimestamp / 1000}s`,
    }
  },
})
