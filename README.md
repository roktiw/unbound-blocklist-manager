# 🔵 UBG: Unbound Blocklist Generator

> **Welcome to the era of intelligent DNSBL compilers.** <br>
> UBG is a serverless, Open-Source engine (TypeScript Node environment) that converts thousands of overlapping, bloated blocklists into one highly optimized configuration file for your router (OPNsense / pfSense / Pi-hole).

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/Tech-TypeScript%20%7C%20NodeJS-3178c6)
![GitHub Actions](https://img.shields.io/badge/Platform-GitHub%20Actions-2088FF)

Instead of exhausting your OPNsense RAM by loading dozens of overlapping lists natively, this compiler processes them in the cloud (via free GitHub Actions) and provides you with an **always-fresh `.conf` file** directly from GitHub, ready to be ingested by your router's CRON jobs.

## 🚀 How to Start? (For Users)

Want your own blocking rules and exceptions for Smart-Home or Telemetry networking?

1. **Fork this repository.**
2. Open the `profiles/` folder. This is the heart of the system. You will find `default_unbound.yaml` there.
3. Configure your exception groups (e.g., allow Apple telemetry, block ads). All available data sources and whitelist categories are found in our unified source of truth: `catalog.yaml`.
4. Done! **GitHub Actions will pull your sources daily at 3:00 AM UTC** (or on-demand), process them in-memory, powerfully deduplicate the arrays, and output a public link to the `release` branch.
   You will receive a URL similar to:
   `https://raw.githubusercontent.com/[your_login]/unbound-blocklist-manager/release/default_unbound.conf`
5. Paste the generated link into the Unbound Blocklist Plugin on your OPNsense or pfSense router.

## ⚙️ Why is `UBG` a gamechanger?

- **Zero Duplicates:** Classical appending of StevenBlack, OISD, and AdGuard lists results in millions of duplicates occupying memory. UBG funnels global resources into an internal `Set<>` within the V8 engine using TypeScript.
- **Resilient Parsing:** The pipeline automatically strips and sanitizes complex `Hosts` formats (`0.0.0.0 example.com`) and sophisticated `AdBlock Wildcards` (`||example.com^$third-party`) into pure, router-native zone arrays (`local-zone: always_nxdomain`).
- **Intelligent Whitelisting:** The universal `catalog.yaml` integrates protective predefined rules to dodge standard False Positives (e.g., breaking Apple TV network verifications or Windows Updater logic).

## 🛠️ Local Engine Testing

UBG is fully functional on your local machine for iterative development:
```bash
npm install
npm run start
```
Your compiled outputs will be safely flushed to the `dist_out/` directory.

Hungry for more unified security vectors? ⭐ **Leave a star** – It helps improve our collaborative `catalog.yaml` logic!
