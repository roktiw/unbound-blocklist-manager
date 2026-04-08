# 🔵 UBG: Unbound Blocklist Generator

> **Witaj w erze inteligentnych kompilatorów DNSBL.** <br>
> UBG to bezserwerowy silnik Open-Source (Mono Blue TypeScript), który zamienia mordercze, setki zduplikowanych list M3U/Hosts w jeden wysoce zoptymalizowany plik konfiguracyjny dla Twojego routera (OPNsense / Pi-hole / pfSense).

![Licencja](https://img.shields.io/badge/License-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/Tech-TypeScript%20%7C%20NodeJS-3178c6)
![GitHub Actions](https://img.shields.io/badge/Platform-GitHub%20Actions-2088FF)

Zamiast pożerać RAM Twojego OPNsense przez wczytywanie 20 nakładających się list `adblock`, ten kompilator robi to w chmurze (via darmowe GitHub Actions) i udostępnia Ci **zawsze świeży plik `.conf`** wprost z GitHuba gotowy do wciągnięcia przez CRON routera.

## 🚀 Jak zacząć? (Dla Forkujących)

Chcesz własnych reguł blokowania i wyjątków dla Apple/Smart-Home?

1. **Zrób Fork tego repozytorium.**
2. Otwórz folder `profiles/`. To serce układu. Znajdziesz tam plik `default_unbound.yaml`.
3. Skonfiguruj pod siebie listę wyjątków (np. zostaw włączone telemetrie Apple, odrzuć reklamy). Wszystkie dostępne źródła i grupy whitelisting-ów znajdziesz w naszym rdzeniu prawdy: `catalog.yaml`.
4. Gotowe! **GitHub Actions codziennie o 3:00 nad ranem** zassie Twoje źródła (lub na żądanie w karcie Actions), przetworzy w pamięci, zdeduplikuje bazę i wypluje publiczny link na gałęzi `release`.
   Otrzymasz adres URL podobny do tego: 
   `https://raw.githubusercontent.com/twojlogin/UnboundBlocklistGenerator/release/default_unbound.conf`
5. Wrzuć wygenerowany link do Unbound Blocklist Plugin na Twoim OPNsense lub Pi-Hole!

## ⚙️ Dlaczego `UBG` to gamechanger?

- **Zero Duplikatów:** Klasyczne dodawanie StevenBlack, OISD, i MajkiIT skutkuje milionami dubli w RAM routera. UBG wciąga to do wewnętrznego `Set<>` V8 Engine'a przy pomocy TypeScript.
- **Odporność na formaty:** Pipeline automatycznie konwertuje składnie Hosts (`0.0.0.0 wp.pl`), AdBlock Wildcards (`||wp.pl^`) i format plain tekst na natywny output docelowy (`local-zone: always_nxdomain`).
- **Inteligentne Whitelisty:** Nasz Unwersalny `catalog.yaml` predefiniuje gotowe reguły unikające False Positives (np. uszkadzanie Apple TV lub Xbox Live).

## 🛠️ Architektura Local-First a wkrótce SaaS

Obecnie UBG jest "Local-First". Możesz uruchomić to również na własnym blaszaku:
```bash
npm install
npm run start
```
W folderze `dist_out/` pojawią się Twoje skompilowane, czyściutkie listy.

Głodny większej ilości wektorów zabezpieczeń? ⭐ **Zostaw gwiazdkę** – Pomoże to rozwijać zunifikowany `catalog.yaml` by zapewnić najlepszy Blocklist-as-a-Service!
