# CNAPS

[![License][license-src]][license-href]

[English](./README.md) | [中文](./README.zh-CN.md)

**A tool for crawling and maintaining China's CNAPS (China National Advanced Payment System) codes dataset.**

> ⚠️ **Maintenance Period: 2026-06-29 ～ 2026-07-29** (routed through a CN relay server)
>
> This is a maintained fork of [gweesin/CNAPS](https://github.com/gweesin/CNAPS). The original repository is no longer actively updated. This fork keeps the dataset current via daily GitHub Actions runs.

## Introduction

CNAPS (China National Advanced Payment System) is China's large-value payment system that handles interbank transfers. This project provides a crawler tool to obtain the latest CNAPS codes for Chinese financial institutions, along with a regularly updated dataset.

## Dataset Stats

| Item | Value |
|------|-------|
| Total records | 152,868 branches |
| Province coverage | 31 (all mainland provinces) |
| Bank categories | 33 (incl. rural/city commercial banks, foreign banks) |
| Source | Bank of Gansu online-banking API (PBoC data) |
| Last counted | 2026-06-29 |

## Fields

| Field | Description |
|-------|-------------|
| `LName` | Full branch name |
| `BankCode` | 12-digit CNAPS code |
| `BankName` | Head bank name |
| `BankId` | Head bank code |
| `CityCode` | City code |
| `CityName` | City name |
| `ProvinceName` | Province name |
| `ProvinceCode` | Province code |

## Download

The latest data can be downloaded directly without cloning the whole repository:

**CSV:**
```bash
curl -L "https://raw.githubusercontent.com/normalman743/CNAPS/main/packages/core/assets/cnaps.csv" -o cnaps.csv
```

**JSON:**
```bash
curl -L "https://raw.githubusercontent.com/normalman743/CNAPS/main/packages/core/assets/cnaps.json" -o cnaps.json
```

Or open directly in browser:
- https://raw.githubusercontent.com/normalman743/CNAPS/main/packages/core/assets/cnaps.csv
- https://raw.githubusercontent.com/normalman743/CNAPS/main/packages/core/assets/cnaps.json

**status.json (run status / failure report):**
```bash
curl -L "https://raw.githubusercontent.com/normalman743/CNAPS/main/packages/core/assets/status.json" -o status.json
```
Records each run's completion time `lastUpdate`, run `mode` (`full` / `incremental` retry), total record count `total`, and the combinations that still failed this run `errors` (with full bank/city info, used for the next incremental retry).

## Update Schedule

Runs automatically every day at **UTC 20:00 (Beijing 04:00)** via GitHub Actions, and can also be triggered manually.

Because the Bank of Gansu API blocks non-mainland IPs, the GitHub-hosted runner reaches the API through an SSH dynamic forward (SOCKS5) relayed via a CN server. The server only forwards traffic — it does not run Node or perform any computation.

## Motivation

Online resources for querying CNAPS codes often require login, paid access, or have CAPTCHA restrictions. This project provides a clean, open dataset without any such restrictions.

## Changelog

Changes in this fork compared to the upstream [gweesin/CNAPS](https://github.com/gweesin/CNAPS):

| Date | Change |
|------|--------|
| 2026-06-29 | Forked and reactivated; upstream stopped updating on 2026-04-19 |
| 2026-06-29 | Fixed `update.yml`: added `working-directory: packages/core` to resolve the missing `start` script under the monorepo |
| 2026-06-29 | Fixed `update.yml`: changed data submission from opening a PR to a direct push with a dated commit message |
| 2026-06-29 | Switched to SSH dynamic forwarding (SOCKS5) + proxychains so the GitHub-hosted runner reaches the Bank of Gansu API via a CN relay server (server only forwards, no Node, no computation) |
| 2026-06-29 | Updated README: added dataset stats, field descriptions, direct download links, maintenance period, changelog |
| 2026-06-29 | Error tracking: `queryAccBank` no longer swallows network errors; added `assets/status.json` recording each run's time, mode, and failed combinations |
| 2026-06-29 | Incremental retry: when the last update was under 2 hours ago (`RETRY_WINDOW_MS`) and had failures, only the failed combinations are re-run and merged by `BankCode`, avoiding a full re-crawl |
| 2026-06-29 | Data floor guard (`DATA_FLOOR_RATIO`, 90%): a full crawl whose result collapses below 90% of existing records refuses to overwrite `cnaps.json/csv` and exits non-zero, so a broken run (e.g. dead tunnel) can't wipe good data |
| 2026-06-29 | Workflow hardening: `permissions: contents: write`; verify step now asserts the tunnel egress IP differs from the runner (fails the job otherwise); proxychains `quiet_mode` to silence per-request logs; tear-down step for the SSH tunnel |
| 2026-06-29 | Schedule moved to Beijing 04:00 (UTC 20:00) |

## Dataset Files

- [assets/cnaps.json](packages/core/assets/cnaps.json) — JSON format, for programmatic use
- [assets/cnaps.csv](packages/core/assets/cnaps.csv) — CSV format, for viewing or importing into a database
- [assets/status.json](packages/core/assets/status.json) — run status and failure report for each crawl

Also available on HuggingFace: https://huggingface.co/datasets/gweesin/CNAPS

## License

[MIT](./LICENSE) License © 2023-PRESENT [Gweesin](https://github.com/gweesin) / Fork maintained by [normalman743](https://github.com/normalman743)

[license-src]: https://img.shields.io/github/license/normalman743/CNAPS.svg
[license-href]: https://github.com/normalman743/CNAPS/blob/main/LICENSE
