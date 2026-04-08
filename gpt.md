Cel: jedno źródło prawdy dla domen/IP → drzewo filtrów → eksport do wielu backendów (najpierw Unbound DNS, potem Pi-hole, firewall, API).

⸻

TL;DR arch

Core = Python + kontrakty + pipeline

sources → parsers → canonical model → tree (filters) → policies → exporters → targets

	•	jeden model kanoniczny
	•	wszystko inne = adaptery (input/output)

⸻

1) Główne komponenty

1. Ingest (źródła)

Pobiera i wersjonuje listy:
	•	HTTP (GitHub, URLHaus, OISD)
	•	lokalne pliki
	•	przyszłościowo API

Output: raw blobs + metadata

⸻

2. Parsers (multi-format)

Wykrywa i parsuje:
	•	hosts (0.0.0.0 domain)
	•	plain (domain)
	•	adblock (||domain^)
	•	(później) CIDR / IP

Output: lista rekordów:

{ "value": "example.com", "type": "domain", "source": "oisd" }


⸻

3. Canonical Model (najważniejsze)

Jedna struktura dla wszystkiego:

class Entry:
    id: str
    value: str          # domain / ip / cidr
    kind: "domain|ip|cidr"
    category: "ads|tracking|malware|custom"
    source: list[str]
    tags: list[str]
    confidence: float

👉 tu robisz dedupe, normalizację, enrichment

⸻

4. Filter Tree (Twoje “drzewo filtrów”)

Struktura:

filters/
  ads/
    global/
    polish/
  malware/
    urlhaus/
  tracking/
  custom/

Każdy node:
	•	ma dzieci
	•	ma przypisane Entry
	•	ma policy (allow/deny)

class FilterNode:
    name: str
    entries: list[Entry]
    children: list[FilterNode]
    policy: "block|allow"

👉 to jest Twój semantic layer (OSaC compatible)

⸻

5. Policy Engine

Łączy:
	•	tree
	•	override (whitelist)
	•	priorytety

Zasady:
	1.	allow > block
	2.	custom > external
	3.	leaf > parent

Output: finalny zestaw rekordów

⸻

6. Exporters (adaptery output)

Każdy exporter:
	•	bierze canonical entries
	•	renderuje format targetu

Unbound

local-zone: "example.com" always_nxdomain

Pi-hole

0.0.0.0 example.com

Firewall (np. OPNsense / ipset)
	•	IP/CIDR → alias / table

API
	•	JSON / NDJSON

⸻

7. Runtime / CLI / API

CLI:

filters sync
filters build
filters export unbound

API (później):
	•	GET /filters
	•	POST /override
	•	GET /export/unbound

⸻

2) Pipeline (konkretnie)

fetch
 → parse
 → normalize
 → dedupe
 → classify
 → attach to tree
 → apply policies
 → export


⸻

3) Struktura repo

app/
  src/
    core/
      models.py
      tree.py
      policy.py
    ingest/
      fetcher.py
    parsers/
      hosts.py
      adblock.py
      plain.py
    pipeline/
      normalize.py
      dedupe.py
    exporters/
      unbound.py
      pihole.py
      firewall.py
    cli/
      main.py
  data/
    sources.yaml
    tree.yaml
  state/
    cache/
    outputs/
  tests/


⸻

4) Konfiguracja (YAML-first)

sources.yaml

sources:
  - name: oisd
    url: https://big.oisd.nl/
    type: hosts
    category: ads

tree.yaml

filters:
  ads:
    policy: block
  malware:
    policy: block
  custom:
    policy: allow


⸻

5) Kluczowe decyzje (gdzie się wywrócisz)

🔴 1. Brak canonical model

→ chaos formatów

🔴 2. Brak dedupe

→ 10x większe listy

🔴 3. Brak override layer

→ false positives zabiją UX

🔴 4. Eksport bez tree/policy

→ brak kontroli

⸻

6) Minimalny MVP (zrób tylko to)
	1.	fetch 2 źródła (np. StevenBlack + URLHaus)
	2.	parser hosts
	3.	dedupe
	4.	export do Unbound

CLI:

filters build
filters export unbound > block.conf


⸻

7) Rozszerzenia (Twoja przyszłość)

v2
	•	drzewo filtrów editable
	•	whitelist
	•	kategorie

v3
	•	API + UI (TS)
	•	profile (home / strict)

v4
	•	multi-target deploy (Unbound + Pi-hole + firewall)

⸻

8) Dopasowanie do Twojego OSaC

To pasuje idealnie:
	•	Entry = contract
	•	FilterNode = cell
	•	exporters = adapters
	•	pipeline = workers

👉 możesz to wpiąć jako moduł do Aye Captain

⸻

9) Finalny werdykt

👉 Nie buduj “generatora plików”
👉 Buduj system transformacji danych z jednym modelem kanonicznym

⸻

1-liner

Źródła są chaosem — Twoja aplikacja ma być kompilatorem: input (dowolny format) → canonical model → policy → output (Unbound/Pi-hole/firewall).

⸻

Jeśli chcesz następny krok:
👉 dam Ci gotowy skeleton Python (Typer + modele + parser hosts + exporter Unbound)
albo
👉 GYR tabelę: Unbound vs Pi-hole vs firewall jako targety (co się opłaca wspierać najpierw)