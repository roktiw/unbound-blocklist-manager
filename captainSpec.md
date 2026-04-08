docelowo che aby aplikacja byla hostowana na firebase i byla dostepna dla uzytkownikow pod unikalnie tworzonymi url z konfiguracjami

strona glowna landing
strona wiki ze spisem wiedzy i linkow do zrodel
generator i kompilator blocklist dla unbound 
strona z unikalnym url wygenerowanymi skompilowanymi zrodlami dla unound a z niej linki do URL gotowych do wklejenia do opnsense

Zbuduj pipeline, który będzie działał tak: Użytkownikowi wyświetlamy listę znanych nam źródeł filtrów, jak CERT Polska, MajkiIT, Filtershorsers, KAD, abuse.ch, etc. Użytkownik zaznacza źródła. Może też dodać własne. Potem zaznacza różne checkboxy i ustawienia, jak np. format pod Unbound, ile kategorii, np. sec, ads, abuse, asd, etc. (1 kategoria to jeden URL, który wypluje). Potem skrypt bierze źródła, kompiluje, mieli, deduplikuje, wypluwa do składni Unbound, Pi-hole czy jakiej user chce i wystawia na stronie danej kompilacji i URL kategorii tej kompilacji. Jest też cron czy coś, co raz na jakiś czas pobierze źródła i skompiluje.

Zastanów się, jak ten pipeline najlepiej zrobić. Może GitHub Actions? Lub coś na GCP? Zostawiam to tobie, Security Specjalisto i Architekcie!

lista ma tez miec obsluge wyjatkow: np. chce lub nie che miec telemetrie od apple, microsoft, etc.

zbuduj tez uniwersalny katalog blocklist w formie yaml parsowanego do json aby latwo mozna bylo zarzadzac zrodlami

