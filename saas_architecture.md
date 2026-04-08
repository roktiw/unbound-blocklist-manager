# 🔵 Unbound Blocklist Generator — Zaawansowana Architektura SaaS (Firebase + GCP)

> **Korab:** `korab_filters_web`
> **Deck:** 🔵 Mono Blue (TypeScript Fullstack)
> **Status:** 📐 Architecture Complete
> **Data:** 2026-04-08

Dokument ten jest rozszerzeniem ("rozpisaniem") koncepcji Blocklist-as-a-Service, skupiającym się mocno na warstwie kompilacyjnej, modelu subskrypcji plików z perspektywy routera (OPNsense) oraz obsługi Universal Catalog (katalogów w YAML) i wyjątków telemetrii (Microsoft, Apple, P2P).

---

## 1. Flow Użytkownika i Struktura Web UI (Firebase Hosting + Next.js)

Aplikacja będzie serwowana globalnie przez Firebase Hosting (CDN). Front napisany z użyciem TypeScript i React z frameworkiem Next.js zapewnia świetne SEO (wiki) i natychmiastowe ładowanie (Static Site Generation dla Landing/Wiki).

### Podział Stron i widoków:
- `/` — **Landing Page.** Sprzedaż wizji "Odblokuj swój OPNsense i wyrzuć śmieciowe DNSBL".
- `/katalog` — **Publiczny Katalog.** Przeglądarka danych zawartych w `catalog.yaml`. Tłumaczy jakie listy są wybrane, jakie są oceny (GYR) danych list, ile mają domen, jaki jest format, kto je tworzy.
- `/wiki/...` — **Centrum Wiedzy**. Markdown files skompilowane w statyczne artykuły: jak dodać wpis do Unbounda, czym się różni Pi-hole od OPNsense DNSBL, statystyki false positive.
- `/dashboard` — **Główny panel dla usera (zabezpieczony kontem).** Tworzenie "Konfiguracji" (Workspaces). Każda z konfiguracji jest oddzielnym profilem, dla którego system wygeneruje unikalny link.
- `/konfigurator/:id` — **Serce aplikacji.**

### Flow Kreatora Konfiguracji (`/konfigurator/:id`):
1. **Wybór Źródeł (Katalog):** Przegląd podzielony na "Baza (Core)", "Polska", "Malware". User np. klika: OISD, CERT Polska, MajkiIT Polish Ads Filter.
2. **Kategoria "Telemetry & Custom Rules" (Wyjątki):**
   Tu użytkownik widzi Checkboxy (mapujące się na rekordy z `catalog.yaml`):
   - `[ ] Blokuj Telemetrię Apple (może uszkodzić AppStore, iCloud)`
   - `[ ] Blokuj Telemetrię Microsoft (może uszkodzić udostępnianie sieci)`
   - `[ ] Zezwalaj na Polskie Portale (WP, Onet, itp)` (Domyślnie zaznaczone).
3. **Konfiguracja Outputu:**
   - Platforma: Unbound, VyOS, Pi-Hole, BIND9.
   - Ile kategorii plików: Oddzielne pliki dla Ads i Malware, czy jeden duży plik `all_in_one.conf`.
4. **Zapis do bazy (Firestore).** Wymusza request w tle o rekompilację profilu. 

---

## 2. Universal Blocklist Catalog as Database (Źródło Prawdy)

Aby uniknąć harcoded linków, do systemu wprowadzamy "Unified Data Layer" jako plik `catalog.yaml` (zobacz obok w folderze wpis), który zostanie wciągnięty przez Backend załadowany jako obiekt TypeScript.

Dzięki temu, w YAML określamy "Format", z jakim trzeba czytać listę.
Rodzaje formatów parsujących (Adaptery w TS):
- `domains_wildcard` - np. `||example.com^`
- `domains_plain` - `example.com`
- `hosts` - `0.0.0.0 example.com` lub `127.0.0.1 example.com`

**Obsługa Wyjątków (Whitelist):**
`catalog.yaml` przechowuje gotowe słowniki wektorów obrony w zmiennej `exceptions_groups`. W UBG, "Exceptions" to ostateczna warstwa. Cokowiek jest na białej liście użytkownika (nawet jeśli OISD postanowi to zablokować) - zostanie wyjęte ze skompilowanego zestawienia.

---

## 3. Silnik Pipeline'u — "Blocklist Compiler Engine"

Ten mechanizm będzie opierał się o **GCP Cloud Run Jobs** odpalany cyklicznie z poziomu Cloud Scheduler'a, oraz po interakcji w Firebase (On-Demand z dashboardu). Czas odpalenia zadania nie blokuje Frontendu, odbywa się w tle (asynchronicznie).

Kompilator (Napisany w Node.JS / TypeScript) działa w 5 krokach:

### Krok 1. Ingest Fetcher (Smart Caching)
Kompilator nie pobiera plików na nowo za każdym razem, gdy przetwarza kolejnego "usera".
- Kompilator sprawdza bazę, jakich źródeł globalnie użyto (z np. 10 000 userów).
- Pobiera zbiory *raz do systemu* przy każdym biegu cyklu, wrzucając je do RAM/Redis pod hash mapą, np. `List_Majki = Array(5040 strings)`, `List_OISD = Array(1.2mln strings)`.

### Krok 2. User Loop
Uruchamia się Loop dla każdego elementu (Profilu Użytkownika) w Firestore, który żąda kompilacji. Następuje budowanie `Set<string>`.
- Dodaj do wektora domen wyciągniętych dla Usera Y filtry: OISD + MajkiIT.
- `Set` sam od razu wykluczy unikalne duble (np. domena reklamowa WP obecna u obu providerów).

### Krok 3. Exception & Whitelist Application
W Firebase Config usera czytamy aktywne `exceptions_groups`:
- User zaznaczył "Dopuść ruch Microsoft telemetry".
- Kompilator wyciąga domenowe "Microsoft" z `catalog.yaml`.
- Iterując przez listę, robimy `UserSet.delete("telemetry.microsoft.com")`.

W tym momencie mamy "Clean Set" dla tego konta. Oszczędziliśmy tym sposobem userowi FP.

### Krok 4. Format Output Render
Budujemy docelowy format wyjściowy (String).
**Jeżeli Router = OPNsense (Unbound)**: 
Kompilator tworzy plik wyjściowy `.conf`:
```text
server:
local-zone: "zlosliwyserwer.pl" always_nxdomain
local-zone: "telemetry.bad.pl" always_nxdomain
```
**Jeżeli Router = Pi-hole**:
```text
0.0.0.0 zlosliwyserwer.pl
0.0.0.0 telemetry.bad.pl
```

### Krok 5. Publikacja i Wersjonowanie na Cloud Storage i CDN
Skrypt generuje plik `unbound_all.conf` i pushuje pod adres GCS Firebase (Google Cloud Storage) powiązany z ID użytkownika. Zwracany w backendzie jest bezpieczny obiekt do serwowania przy użyciu CDN Firebase:

`https://ubg.twojadomena.pl/c/usr_1aA9F23/unbound_all.conf` (Link to udostępniasz). Z upływem czasu link ani ścieżka się u nas NIE zmieni (więc OPNsense raz skonfigurowany zawsze pobierze to w cronie), ale sam zasób w chmurze zawsze jest "Hot".

---

## 4. Architektura Uruchomieniowo/Systemowa w OPNsense

### Dlaczego ta integracja ułatwi wdrożenie MVP:
OPNsense korzysta z Unbound DNS'a natywnie. ONSense z pobieranym plikiem radzi sobie za pomocą standardowych narzędzi w systemie:

**Wdrożenie u Użytkownika (Manualne / z Wiki API):**
Loguje się do SSH OPNsense lub w Cron Configuration nakazuje:
```bash
# Pobranie wygenerowanego UBG.conf do configu Unbound
fetch -o /var/unbound/etc/ubg_custom.conf "https://ubg.twojadomena.pl/c/123/unbound_all.conf"
# Przeładowanie dns/cache
pluginctl -s unbound restart
```
Lub z wbudowanej zakładki Blocklists. Zależy jaki format użytkownik wybierze na Frontendzie. UBG wspiera zarówno gotowe includy jako pliki .conf jak i formaty PiHolowe (płaski tekst), na które systemy reagują najlepiej (Unbound Blocklist Plugin wymaga czystego tekstu bez `local-zone` syntax w przypadku korzystania z GUI Pluginu w OPNsense).

To zdejmuje z ramion UBG przymusu bycia agentem trwale komunikujacym sie z routerem – Unbound robi fetching.

---

## 5. Przesłanki Techniczne Mono Blue TS (Reasumpcja)

1. **V8 Engine dla milionów wierszy:** Czysty String Parser w Typescript oparty o event loop (`readline` lub `stream`) przerobi w sekundę miliardy wierszy bez zajmowania RAM podczas wypluwania pliku configu (w przeciwieństwie do operacji numpy w Pythonie dla tekstu, V8 Engine jest niezwykle czuły i optymalizowany przez Chrome dla manipulacji długich ciągów tekstu String/Arrays).
2. Twarda struktura Modeli, od Interfejsu React i Checkboxa, po wyciągany Cloud Function i GCS URL. Każdy krok w Data Pipeline jest objęty kontraktem (np. typ z `Zod`).
3. Koniec końców tworzyna "Compiler". Językami kompilatorów dla tekstu jest wysoce-optymalizowany ekosystem Web (TS) a nie wcale skrypty bash/awk. Wynikiem pracy nie jest skrypt – jest usługa (SaaS).

Ta architektura w pełni wyczerpuje wizję docelową, pozwalając na start minimalnym kosztem i płynną i bezpieczną operację z GCP Firestore + Cloud Functions w tle.
