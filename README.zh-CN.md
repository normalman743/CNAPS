# CNAPS (中国现代化支付系统)

[![License][license-src]][license-href]

[English](./README.md) | [中文](./README.zh-CN.md)

**一个用于爬取并维护中国现代化支付系统(CNAPS)代码数据集的工具。**

> ⚠️ **维护周期：2026-06-29 ～ 2026-07-29**（经国内服务器中转）
>
> 本仓库是 [gweesin/CNAPS](https://github.com/gweesin/CNAPS) 的维护 fork。原项目已停止更新，本 fork 通过 GitHub Actions 每日运行保持数据最新。

## 简介

CNAPS (China National Advanced Payment System，中国现代化支付系统) 是中国的大额支付系统，用于处理银行间转账。本项目提供爬虫工具，从甘肃银行网银接口自动采集最新联行号数据，并每日定时更新。

金融应用程序通常需要有效的银行标识代码来处理交易。随着银行的合并、关闭或新设立，CNAPS代码会随时间变化。本项目旨在为开发人员提供一个最新的、易于访问的CNAPS代码数据集，方便在中国金融系统中使用。

## 数据统计

| 项目 | 数值 |
|------|------|
| 总条数 | 152,868 条支行 |
| 省份覆盖 | 31 个（大陆全部） |
| 银行分类 | 33 类（含农商行、城商行、外资行） |
| 数据来源 | 甘肃银行网银接口（人民银行数据） |
| 最后统计 | 2026-06-29 |

## 字段说明

| 字段 | 说明 |
|------|------|
| `LName` | 支行全称 |
| `BankCode` | 12 位联行号 |
| `BankName` | 所属银行总行名 |
| `BankId` | 银行总行代码 |
| `CityCode` | 城市代码 |
| `CityName` | 城市名 |
| `ProvinceName` | 省份名 |
| `ProvinceCode` | 省份代码 |

> **注意**：CNAPS 代码是 12 位数字，用于唯一标识中国的银行和分支机构，类似于国际上使用的 SWIFT 代码。

## 直接下载

最新数据可通过以下链接直接下载，无需克隆整个仓库：

**CSV：**
```bash
curl -L "https://raw.githubusercontent.com/normalman743/CNAPS/main/packages/core/assets/cnaps.csv" -o cnaps.csv
```

**JSON：**
```bash
curl -L "https://raw.githubusercontent.com/normalman743/CNAPS/main/packages/core/assets/cnaps.json" -o cnaps.json
```

也可在浏览器中直接打开：
- https://raw.githubusercontent.com/normalman743/CNAPS/main/packages/core/assets/cnaps.csv
- https://raw.githubusercontent.com/normalman743/CNAPS/main/packages/core/assets/cnaps.json

**status.json（运行状态/失败汇报）：**
```bash
curl -L "https://raw.githubusercontent.com/normalman743/CNAPS/main/packages/core/assets/status.json" -o status.json
```
记录每次爬取的完成时间 `lastUpdate`、运行模式 `mode`（`full` 全量 / `incremental` 增量重试）、数据总条数 `total`，以及当次仍失败的组合 `errors`（含完整 bank/city，供下次增量重试使用）。

## 更新频率

每天北京时间 **08:00**（UTC 00:00）通过 GitHub Actions 自动运行，也支持手动触发。

由于甘肃银行接口封禁境外 IP，GitHub 官方 Runner 通过 SSH 动态转发（SOCKS5）经国内服务器中转访问接口，服务器仅做网络转发、不参与计算。

## 项目动机

在线的联行号查询页面如 [联行号查询](https://www.lianhanghao.com/)、[联行号查询API接口](https://www.cwjyz.com.cn/bank/api_intro.html)、[浙商银行联行号查询](https://corbank.czbank.com/CORPORBANK/query_unionBank_index.jsp)等，要么需要关注公众号，要么需要登录付费使用，要么有频繁的验证码限制，导致使用不便。

苦于以上烦恼，于是有了这个项目，不需要登录、验证码等限制，本项目数据每日同步，保证时效性。

## 本 Fork 改动记录

相较于原项目 [gweesin/CNAPS](https://github.com/gweesin/CNAPS)，本 fork 做了以下改动：

| 日期 | 改动 |
|------|------|
| 2026-06-29 | Fork 并重新激活，原项目自 2026-04-19 起停止更新 |
| 2026-06-29 | 修复 `update.yml`：补充 `working-directory: packages/core`，解决 monorepo 下找不到 `start` 脚本的问题 |
| 2026-06-29 | 修复 `update.yml`：将数据提交方式从创建 PR 改为直接 push，并带日期 commit message |
| 2026-06-29 | 改用 SSH 动态转发（SOCKS5）+ proxychains，让 GitHub 官方 Runner 经国内服务器中转访问甘肃银行接口（服务器仅做转发，不装 Node、不参与计算） |
| 2026-06-29 | 更新 README：添加数据统计、字段说明、直接下载链接、维护周期、Changelog |
| 2026-06-29 | 错误记录：`queryAccBank` 不再吞掉网络错误，新增 `assets/status.json` 记录每次爬取时间、模式与失败组合 |
| 2026-06-29 | 增量重试：距上次更新小于 2 小时（`RETRY_WINDOW_MS`）且上次有失败组合时，只重跑失败部分并按 `BankCode` 合并，避免重复全量爬取 |

## 数据文件

- [assets/cnaps.json](packages/core/assets/cnaps.json) — JSON 格式，适合程序调用
- [assets/cnaps.csv](packages/core/assets/cnaps.csv) — CSV 格式，适合直接查看或导入数据库
- [assets/status.json](packages/core/assets/status.json) — 每次爬取的运行状态与失败汇报

也可通过 HuggingFace 使用：https://huggingface.co/datasets/gweesin/CNAPS

## 许可证

[MIT](./LICENSE) License © 2023-PRESENT [Gweesin](https://github.com/gweesin) / 由 [normalman743](https://github.com/normalman743) 维护的 Fork

[license-src]: https://img.shields.io/github/license/normalman743/CNAPS.svg
[license-href]: https://github.com/normalman743/CNAPS/blob/main/LICENSE
