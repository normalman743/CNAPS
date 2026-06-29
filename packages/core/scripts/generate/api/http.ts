import crypto from 'node:crypto'
import https from 'node:https'
import axios from 'axios'
import axiosRetry from 'axios-retry'
import { MAX_CONCURRENCY } from '../constants'

axiosRetry(axios, {
  retries: 3,
  retryDelay: (retryCount) => {
    return retryCount * 1000
  },
})

axios.defaults.baseURL = 'https://per.gsbankchina.com'
axios.defaults.httpsAgent = new https.Agent({
  // for self-signed you could also add
  // rejectUnauthorized: false,
  // allow legacy server
  secureOptions: crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT,
  // 复用连接：甘肃用老式 TLS，握手很吃 CPU。开 keep-alive 让连接在大量请求间
  // 复用，避免每个请求都重做一次昂贵握手，弱 CPU 的 VPS 上提速明显。
  keepAlive: true,
  maxSockets: MAX_CONCURRENCY,
})

export default axios
