# CNAPS

[![License][license-src]][license-href]

[English](./README.md) | [中文](./README.zh-CN.md)

**A tool for crawling and maintaining China's CNAPS (China National Advanced Payment System) codes dataset.**

> This is a maintained fork of [gweesin/CNAPS](https://github.com/gweesin/CNAPS). The original repository is no longer actively updated. This fork keeps the dataset current via daily GitHub Actions runs.

## Introduction | 简介

CNAPS (China National Advanced Payment System) is China's large-value payment system that handles interbank transfers. This project provides a crawler tool to obtain the latest CNAPS codes for Chinese financial institutions, along with a regularly updated dataset.

CNAPS（中国现代化支付系统）是中国大额支付系统，处理跨行转账业务。本项目提供爬虫工具，从甘肃银行网银接口自动采集最新联行号数据，并每日定时更新。

## Dataset Stats | 数据统计

| 项目 | 数值 |
|------|------|
| 总条数 | 152,868 条支行 |
| 省份覆盖 | 31 个（大陆全部） |
| 银行分类 | 33 类（含农商行、城商行、外资行） |
| 数据来源 | 甘肃银行网银接口（人民银行数据） |
| 最后统计 | 2026-06-29 |

## Fields | 字段说明

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

## Update Schedule | 更新频率

Runs automatically every day at **UTC 00:00 (Beijing 08:00)** via GitHub Actions, and can also be triggered manually.

每天北京时间 **08:00** 通过 GitHub Actions 自动运行，也支持手动触发。

## Motivation | 背景

Online resources for querying CNAPS codes often require login, paid access, or have CAPTCHA restrictions. This project provides a clean, open dataset without any such restrictions.

现有联行号查询网站普遍存在付费墙、登录限制或验证码问题。本项目通过爬取甘肃银行公开查询接口，提供免费、干净的全量数据集。

## Dataset Files | 数据文件

- [assets/cnaps.json](packages/core/assets/cnaps.json) — JSON 格式，适合程序调用
- [assets/cnaps.csv](packages/core/assets/cnaps.csv) — CSV 格式，适合直接查看或导入数据库

Also available on HuggingFace: https://huggingface.co/datasets/gweesin/CNAPS

## License

[MIT](./LICENSE) License © 2023-PRESENT [Gweesin](https://github.com/gweesin) / Fork maintained by [normalman743](https://github.com/normalman743)

[license-src]: https://img.shields.io/github/license/normalman743/CNAPS.svg
[license-href]: https://github.com/normalman743/CNAPS/blob/main/LICENSE
