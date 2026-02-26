# Deliveroo Logistics — ekspansja na transport morski

## Analiza architektoniczna domeny biznesowej

---

## 1. Kontekst zmiany i eksploracja domeny

Zamrożenie relacji ze Wschodem oznacza odcięcie lądowych korytarzy tranzytowych (np. kolejowy „jedwabny szlak" przez Rosję do Chin, trasy drogowe przez Białoruś/Rosję). Klienci B2B Deliveroo, którzy dotąd korzystali z transportu drogowego i intermodalnego kolejowo-drogowego do Azji i Bliskiego Wschodu, tracą te opcje. Deliveroo musi zaoferować alternatywę morską — trasy takie jak Europa–Azja (30–45 dni przez Suez) czy Europa–Bliski Wschód.

To nie jest kosmetyczny dodatek. Transport morski to **fundamentalnie inna subdomena** z własnym prawem (konwencje haskie, Hague-Visby Rules zamiast CMR), własną dokumentacją (konosament/Bill of Lading jako papier wartościowy), własnymi jednostkami ładunkowymi (kontenery TEU/FEU zamiast palet i naczep), własnymi cyklami czasowymi (tygodnie zamiast godzin) i własnym ekosystemem interesariuszy.

---

## 2. Interesariusze — kto dochodzi, kto się zmienia

### 2.1 Zupełnie nowi interesariusze

| Interesariusz | Rola | Dlaczego nie istniał w świecie drogowym |
|---|---|---|
| **Linie oceaniczne** (Maersk, MSC, CMA CGM, Hapag-Lloyd…) | Przewoźnicy morscy — właściciele statków i operatorzy regularnych serwisów liniowych | W transporcie drogowym odpowiednikiem jest przewoźnik drogowy, ale model kontraktowania jest zupełnie inny (slot booking na statek vs. zlecenie na konkretną ciężarówkę) |
| **Operatorzy terminali portowych** | Obsługa przeładunku kontenerów w portach (załadunek/rozładunek ze statku, składowanie na placu kontenerowym) | Nie ma odpowiednika — w transporcie drogowym nie istnieje „terminal przeładunkowy" o tej skali i złożoności |
| **Władze portowe** (Port Authority) | Zarządzanie infrastrukturą portową, regulacje wjazdu/wyjazdu statków, opłaty portowe | Brak odpowiednika w transporcie drogowym |
| **Firmy kontenerowe / lessors kontenerów** | Wynajem kontenerów (dry, reefer, open-top, flat-rack) jeśli nie używamy kontenerów należących do linii | Jednostka ładunkowa „kontener" nie istnieje w transporcie drogowym w tym sensie |
| **Spedytorzy morscy (freight forwarders)** | Jeśli Deliveroo nie staje się samo spedytorem morskim — pośrednicy organizujący fracht morski | Deliveroo mogło wcześniej samo pełnić rolę spedytora drogowego; morski wymaga dodatkowych licencji i kompetencji |
| **Agenci portowi / ship agents** | Reprezentacja interesów na miejscu w porcie (zwłaszcza w portach zagranicznych, gdzie Deliveroo nie ma biura) | W transporcie drogowym rolę „lokalnego agenta" pełni oddział lub partner drogowy |
| **Ubezpieczyciele cargo morskiego / kluby P&I** | Ubezpieczenie ładunku na morzu — inne polisy, inne ryzyka (sztormy, piractwo, general average) niż w transporcie drogowym | Ubezpieczenie drogowe (OC przewoźnika, cargo) działa na zupełnie innych zasadach i kwotach |
| **Banki trade-finance / instytucje akredytywowe** | Obsługa akredytyw (Letters of Credit) — w handlu międzynarodowym morskim akredytywy są powszechne | W transporcie drogowym wewnątrz-europejskim akredytywy praktycznie nie występują |
| **Surveyorzy / inspektorzy ładunkowi** | Inspekcja stanu ładunku przy załadunku i rozładunku w porcie | W transporcie drogowym inspekcja jest prostsza (kierowca potwierdza stan przy odbiorze) |
| **Organy celne portowe** | Administracja celna w portach morskich — inne procedury niż na przejściach drogowych (manifest morski, AIS, etc.) | Cło drogowe istniało, ale procedury morskie są znacząco bardziej rozbudowane |
| **Operatorzy depotów kontenerowych** | Miejsca odbioru/zwrotu pustych kontenerów | Brak odpowiednika |
| **Regulatory morskie** (IMO, administracje morskie państw bandery) | Regulacje bezpieczeństwa, emisji (IMO 2020 — limity siarki), ISPS Code | Transport drogowy podlega innym regulacjom (AETR, tachografy, ADR) |

### 2.2 Interesariusze, którzy się transformują

| Interesariusz | Jak się zmienia |
|---|---|
| **Klienci B2B Deliveroo** | Dotąd zlecali transport drogowy z ETA liczoną w godzinach/dniach. Teraz muszą planować z wyprzedzeniem tygodni, rozumieć Incotermy morskie (FOB, CIF, CFR), akceptować inny profil ryzyka. Ich oczekiwania wobec trackingu też się zmieniają — nie GPS co minutę, lecz zdarzenia (załadunek, wypłynięcie, transshipment, przypłynięcie). |
| **Dział customs Deliveroo** | Dotychczas obsługiwał odprawy na przejściach drogowych (T1, T2, EUR.1). Teraz musi obsłużyć Import Entry / Export Declaration w portach morskich, manifesty, potencjalnie ISF (dla USA), inne kody procedur celnych. |
| **Przewoźnicy drogowi (dotychczasowi)** | Nie znikają — stają się wykonawcami „first mile" (fabryka → port załadunku) i „last mile" (port rozładunku → magazyn odbiorcy). Ich rola się kurczy do odcinka lądowego. |
| **Dział planowania transportu** | Musi nauczyć się myśleć intermodalnie: droga + morze + droga. Horyzont planowania wydłuża się z dni na tygodnie. |

---

## 3. Zdolności (Capabilities) — co nowe, co zmienione

### 3.1 Kluczowe pytanie: własna flota morska?

**Odpowiedź: zdecydowanie nie.** Zakup lub czarter statku oceanicznego to setki milionów euro inwestycji, konieczność utrzymania załóg, certyfikatów, suchodoków, zarządzania bunkerami (paliwem). Maersk operuje flotą wartą dziesiątki miliardów USD. Deliveroo jako operator logistyczny drogowy nie ma ani kapitału, ani kompetencji, ani skali, żeby to uzasadnić.

**Model, który Deliveroo powinno przyjąć: NVOCC (Non-Vessel Operating Common Carrier) lub freight forwarder morski.** Deliveroo kupuje miejsce (sloty) na statkach linii oceanicznych i odsprzedaje je swoim klientom B2B jako część kompleksowej usługi. Analogia: linia lotnicza vs. biuro podróży kupujące miejsca.

### 3.2 Nowe zdolności

```
CAPABILITY MAP — NOWE (morskie)
═══════════════════════════════════════════════════════════════

1. OCEAN FREIGHT PROCUREMENT
   ├── Negocjowanie kontraktów z liniami oceanicznymi
   │   (annual contracts, spot rates, FAK rates)
   ├── Zarządzanie taryfami morskimi
   │   (base rate + BAF + CAF + THC + PSS + GRI + peak season surcharge...)
   └── Monitoring available capacity na trade lane'ach

2. CONTAINER MANAGEMENT
   ├── Booking kontenerów (typ: 20'DC, 40'DC, 40'HC, 20'RF, 40'RF, 
   │   flat-rack, open-top)
   ├── Tracking cyklu życia kontenera
   │   (empty pickup → stuffing → gate-in → loading → sailing → 
   │    discharge → gate-out → unstuffing → empty return)
   ├── Zarządzanie demurrage & detention
   │   (śledzenie free-time, eskalacja kosztów)
   └── Container repositioning (zarządzanie pustymi kontenerami)

3. VESSEL SCHEDULE MANAGEMENT
   ├── Integracja z rozkładami linii oceanicznych
   ├── Monitoring opóźnień / zmian ETA
   ├── Zarządzanie transshipment (przesiadkami kontenerów między statkami)
   └── Cut-off management (deadline na dostarczenie kontenera do portu)

4. MARITIME BOOKING MANAGEMENT
   ├── Slot booking na konkretny rejs
   ├── Booking confirmation / amendment / cancellation
   ├── Rollover management (gdy linia "zrzuca" kontener na następny statek)
   └── Koordynacja z vessel schedule

5. BILL OF LADING (B/L) MANAGEMENT
   ├── Wystawianie i zarządzanie konosamentami
   │   (Master B/L vs. House B/L)
   ├── B/L jako papier wartościowy — kontrola oryginałów
   ├── Surrender / Telex release / Sea Waybill workflow
   └── Integracja z trade finance (akredytywy wymagają B/L)

6. PORT OPERATIONS COORDINATION
   ├── Koordynacja gate-in / gate-out w terminalu
   ├── Zarządzanie dokumentacją portową
   ├── VGM (Verified Gross Mass) compliance — obowiązkowe od SOLAS 2016
   └── Koordynacja z agentami portowymi

7. INTERMODAL ORCHESTRATION
   ├── Planowanie multi-leg (road → port → ocean → port → road)
   ├── Synchronizacja między legami
   │   (ciężarówka musi dowieźć kontener PRZED cut-off portu)
   ├── Handoff management między modami transportu
   └── End-to-end visibility across modes

8. MARITIME CUSTOMS & TRADE COMPLIANCE
   ├── Export/Import declarations morskie
   ├── Manifest filing
   ├── Dangerous goods declarations (IMDG Code)
   ├── Sanctions screening (istotne przy zamrożeniu relacji)
   └── Rules of origin / preferencje taryfowe

9. MARINE CARGO INSURANCE
   ├── Polisy cargo (Institute Cargo Clauses A/B/C)
   ├── General average — procedura i udział
   └── Claims morskie (inny reżim niż CMR)

10. TRADE FINANCE FACILITATION
    ├── Wsparcie akredytyw (Letter of Credit)
    ├── Koordynacja dokumentów wymaganych przez bank
    └── Document compliance checking
```

### 3.3 Zdolności istniejące, które muszą się rozszerzyć

| Istniejąca zdolność | Jak musi się rozszerzyć |
|---|---|
| **Zarządzanie kontrahentami** | Nowe typy kontrahentów (linia oceaniczna ≠ przewoźnik drogowy). Inne warunki kontraktów, inne SLA, inne modele rozliczeń. Ale **rdzeń** (dane kontrahenta, scoring, onboarding) może pozostać wspólny. |
| **Wycena / Quoting** | Zupełnie inna struktura cenowa. Stawka drogowa: EUR/km lub EUR/paleta. Stawka morska: USD/TEU + kilkanaście surcharges. Wymaga nowego silnika kalkulacji, ale interfejs „klient prosi o wycenę, dostaje cenę" może pozostać stabilny. |
| **Tracking & Visibility** | Nowe źródła danych (AIS, API linii oceanicznych, EDI COPARN/BAPLIE/IFTMIN). Inna granularność — eventy zamiast ciągłego GPS. Ale **model publikowania zdarzeń** (milestone-based tracking) może być wspólny. |
| **Customs** | Rozszerzenie o procedury morskie. Rdzeń (compliance check, document generation, submission to authority) może być reużywalny, ale specyfika morska wymaga nowych modułów. |
| **Cold chain** | Reefer container ≠ chłodnia na ciężarówce. Monitoring temperatury w kontenerze reeferowym (pre-trip inspection, genset power at port, reefer plugs on vessel) to nowe procesy. Ale cel jest ten sam: utrzymanie temperatury. |

---

## 4. Procesy biznesowe — co się zmienia

### 4.1 Proces: Planowanie transportu

**Stan obecny (drogowy):**
```
Zlecenie klienta → Wyznaczenie trasy drogowej → 
→ Przypisanie przewoźnika/pojazdu → Ustalenie ETA (godziny/dni) → 
→ Dispatch
```

**Stan po rozszerzeniu (morski):**
```
Zlecenie klienta 
  → Określenie trade lane (skąd → dokąd)
  → Wybór portu załadunku i portu rozładunku
  → Wyszukanie dostępnych rejsów (vessel schedules)
  → Sprawdzenie cut-off dates
  → Planowanie first-mile (road: fabryka → port)
      - musi zsynchronizować się z cut-off!
  → Booking slotu na statek
  → Booking kontenera (typ, ilość)
  → Planowanie last-mile (road: port docelowy → odbiorca)
      - planowany po potwierdzeniu ETA statku, ale ETA zmienia się w trakcie rejsu
  → Koordynacja customs na obu końcach
```

**Kluczowe różnice:**
- **Horyzont planowania**: godziny/dni → tygodnie. Booking na statek trzeba robić z 2–4 tygodniowym wyprzedzeniem
- **Synchronizacja między legami**: first-mile musi trafić przed cut-off, last-mile musi się dostosować do aktualnego ETA statku (który się zmienia)
- **Niepewność**: statki się opóźniają regularnie (port congestion, pogoda, kanał Sueski). Planowanie musi być bardziej elastyczne
- **Transshipment**: kontener może zmieniać statek w porcie pośrednim — dodatkowe ryzyko opóźnień

### 4.2 Proces: Realizacja transportu (Execution)

**Drogowy:**
```
Załadunek u nadawcy → Jazda (tracking GPS ciągły) → 
→ Ewentualne przejście graniczne (customs) → 
→ Dostawa do odbiorcy → POD (Proof of Delivery) → Rozliczenie
```

**Morski (wieloetapowy):**
```
FAZA 1 — FIRST MILE (road)
  Empty container pickup z depot → Transport do nadawcy → 
  → Stuffing (załadunek kontenera) → VGM (zważenie) →
  → Transport do portu załadunku → Gate-in do terminalu

FAZA 2 — PORT ZAŁADUNKU
  Customs export clearance → Terminal handling → 
  → Załadunek na statek → Bill of Lading issued → Vessel departure

FAZA 3 — OCEAN LEG
  Sailing (tracking: AIS + carrier milestones) →
  → Ewentualny transshipment w porcie pośrednim →
  → Arrival at destination port

FAZA 4 — PORT ROZŁADUNKU  
  Discharge from vessel → Customs import clearance →
  → Terminal storage (uwaga: free time tyka — demurrage!) →
  → Gate-out z terminalu

FAZA 5 — LAST MILE (road)
  Transport do odbiorcy końcowego → Unstuffing (rozładunek kontenera) →
  → POD → Empty container return do depot → Rozliczenie
```

To jest **fundamentalna zmiana w procesie realizacji** — z jednego ciągłego procesu na pięć odrębnych faz z handoffami między różnymi wykonawcami i różnymi jurysdykcjami.

### 4.3 Proces: Płatności i rozliczenia

**Zmienia się znacząco:**

| Aspekt | Transport drogowy | Transport morski |
|---|---|---|
| **Struktura kosztowa** | Prosta: stawka za km/trasę, opłaty drogowe, ewentualnie cło | Złożona: ocean freight + BAF + CAF + THC origin + THC destination + documentation fee + B/L fee + ISPS + customs + inland haulage origin + inland haulage dest + demurrage (jeśli) + detention (jeśli) |
| **Waluta** | Zazwyczaj EUR | Ocean freight w USD, opłaty portowe w lokalnej walucie, inland w EUR — multi-currency na jednym zleceniu |
| **Kontrahenci do zapłaty** | 1–2 (przewoźnik, ewentualnie celnik) | 5+ (linia oceaniczna, terminal załadunku, terminal rozładunku, agent portowy x2, celnik x2, hauler x2, depot kontenerowy...) |
| **Timing** | Faktura po dostawie, standard 14–30 dni | Linie oceaniczne często wymagają prepayment. Demurrage/detention to koszty naliczane ex post, czasem tygodnie po dostawie |
| **Trade finance** | Brak | Akredytywy (L/C) — bank płaci po prezentacji dokumentów (w tym B/L) |

**Wniosek**: moduł rozliczeń wymaga rozszerzenia, ale nie wyrzucenia. Jeśli rozliczenia są modelowane generycznie (zlecenie → zestaw pozycji kosztowych → faktura), to dodanie nowych typów pozycji kosztowych jest rozszerzeniem. Jeśli natomiast pozycje kosztowe są hardcodowane (stawka_za_km, opłata_drogowa, cło), to trzeba przebudowywać.

### 4.4 Proces: Reklamacje / Claims

**Zmienia się fundamentalnie z perspektywy prawnej:**

| Aspekt | Transport drogowy (CMR) | Transport morski (Hague-Visby) |
|---|---|---|
| **Reżim prawny** | Konwencja CMR | Reguły Haskie/Hague-Visby (lub Hamburg/Rotterdam) |
| **Limit odpowiedzialności** | 8,33 SDR/kg | 666,67 SDR/paczka LUB 2 SDR/kg (wyższa kwota) |
| **Termin reklamacji** | 7 dni (widoczne) / 14 dni (ukryte) od dostawy | 3 dni od dostawy (widoczne uszkodzenia: natychmiast) |
| **Przedawnienie** | 1 rok | 1 rok |
| **General average** | Nie istnieje | Istnieje — wszyscy właściciele ładunku na statku proporcjonalnie pokrywają stratę poniesioną dla ratowania statku |

**Wniosek**: proces claims musi obsługiwać różne reżimy prawne. Workflow (klient zgłasza → ocena → decyzja → wypłata) może być wspólny, ale reguły biznesowe (terminy, limity, procedury) są zupełnie inne.

### 4.5 Proces: Rezerwacja zasobów (pracownicy, urządzenia)

**Tak, jest inna:**
- Transport drogowy: rezerwacja kierowcy i pojazdu na konkretną datę/trasę. Granularność: godziny.
- Transport morski (model NVOCC): nie rezerwujemy kierowcy ani statku — rezerwujemy **slot na rejsie** (u linii oceanicznej) i **kontener** (u linii lub lessora). Granularność: dni/tygodnie.
- Na odcinkach first/last mile: nadal rezerwacja kierowcy i pojazdu — ale musi być zsynchronizowana z cut-offem portowym (first mile) lub ETA statku (last mile, co się dynamicznie zmienia).
- **Nowi „pracownicy" do zaplanowania**: agent portowy, broker celny morski, koordynator dokumentów.

---

## 5. Strumienie wartości — jak się przebudowują

### 5.1 Główny strumień wartości: Order-to-Delivery

**Przed (tylko droga):**
```
Klient składa     Deliveroo      Przewoźnik     Odbiorca
zlecenie ------→ planuje ------→ jedzie ------→ odbiera
                 trasę           (1-3 dni)       (POD)
                 
Wartość: szybkość, niezawodność, pełna widoczność w czasie rzeczywistym
```

**Po (droga + morze):**
```
Klient           Deliveroo          Multi-modal              Odbiorca
składa --------→ planuje --------→  execution  -----------→  odbiera
zlecenie         intermodalnie      (first mile + port +     (POD)
                 (5+ partnerów)      ocean + port + last mile)
                                    (25-45 dni)
                 
Wartość: dostęp do rynków odciętych lądowo, optymalizacja kosztów 
         (morze = tańsze per unit niż droga na dłuższych dystansach),
         end-to-end orchestration mimo złożoności,
         single point of contact dla klienta
```

**Z perspektywy odbiorcy zamorskiego**, strumień wartości zmienia się tak:

**Było (odbiorca europejski, transport drogowy):**
- Zamówił → dostał tracking link → widział ciężarówkę na mapie co minutę → odebrał następnego dnia → zapłacił fakturę

**Jest (odbiorca zamorski, transport morski):**
- Zamówienie złożone tygodnie wcześniej
- Tracking: milestone'y (załadowano na statek, statek wypłynął, statek w porcie pośrednim, statek w drodze, statek przybył, kontener rozładowany, odprawa celna, kontener w drodze ciężarówką)
- Musi zapewnić gotowość celną na swoim końcu (import documentation)
- Musi odebrać kontener w ramach free-time, bo inaczej demurrage
- Musi zwrócić pusty kontener do depot
- Potencjalnie musi dostarczyć dokumenty do banku (jeśli L/C)

**Nowa propozycja wartości Deliveroo dla odbiorcy zamorskiego:**
- „Ty się skupiasz na swoim biznesie, my zajmiemy się całą złożonością multimodalną"
- Jeden tracking dashboard zamiast śledzenia osobno: ciężarówki → portu → statku → portu → ciężarówki
- Deliveroo zarządza demurrage/detention proaktywnie — minimalizuje koszty klienta
- Deliveroo koordynuje customs na obu końcach
- Jedna faktura skonsolidowana zamiast 8 faktur od różnych podmiotów

### 5.2 Strumień wartości: Quote-to-Cash

**Przed:**
```
Zapytanie → Wycena (prosta) → Akceptacja → Realizacja → Faktura → Płatność
                                                         (1 pozycja)
```

**Po:**
```
Zapytanie → Wycena (złożona: multi-leg,    → Akceptacja → Realizacja     → Faktura           → Płatność
             multi-currency, surcharges)                   (tygodnie)       (wiele pozycji,     (multi-currency,
                                                                             multi-currency)     ewentualnie L/C)
             ↓
             Validity period ważny!
             (stawki morskie zmieniają się 
             co tydzień — GRI, PSS)
```

### 5.3 Strumień wartości: Issue-to-Resolution

**Nowe typy „issues":**
- Rollover (linia zrzuciła kontener na następny statek — opóźnienie 1 tydzień)
- Port congestion (statek czeka na wejście do portu — opóźnienie nieokreślone)
- Demurrage charge (klient nie odebrał kontenera w terminie — naliczane koszty)
- Container damage (uszkodzenie kontenera — kto odpowiada?)
- General average declaration (statek w niebezpieczeństwie — wszyscy płacą proporcjonalnie)
- Short shipment (mniej towaru w kontenerze niż deklarowano)
- Customs hold (ładunek zatrzymany przez celników w porcie)

---

## 6. Wpływ na kod i architekturę — co minimalizuje rewolucję

To jest kluczowa sekcja z perspektywy DDD i architektury oprogramowania.

### 6.1 Identyfikacja bounded contexts

**Obecny system (drogowy) prawdopodobnie ma konteksty:**

```
┌─────────────────────────────────────────────────────────┐
│                    DELIVEROO TMS                         │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │    Order      │  │  Transport   │  │   Carrier    │  │
│  │  Management   │  │  Planning    │  │  Management  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Tracking    │  │   Customs    │  │   Billing    │  │
│  │  & Visibility │  │              │  │              │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │    Claims     │  │  Warehouse   │  │  Cold Chain  │  │
│  │              │  │  Management  │  │              │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                         │
│  ┌──────────────┐                                       │
│  │   Customer   │                                       │
│  │  Management  │                                       │
│  └──────────────┘                                       │
└─────────────────────────────────────────────────────────┘
```

### 6.2 Analiza: co jest „tykającą bombą" (usztywnienia, które wymuszą przeoranie)

#### 🔴 KRYTYCZNE USZTYWNIENIE #1: „Transport = Transport Drogowy"

**Jeśli** w kontekście Transport Planning / Execution agregat `Transport` (lub `Shipment`, `Order` — jak go nie nazwiemy) wygląda tak:

```
class Transport {
    truckId: TruckId
    driverId: DriverId
    route: List<RoadSegment>        // sekwencja odcinków drogowych
    origin: Address
    destination: Address
    estimatedDepartureTime: DateTime
    estimatedArrivalTime: DateTime  // = departure + driving time
    tollCosts: Money
    fuelSurcharge: Percentage
}
```

…to wejście w transport morski **wymusza przeoranie tego agregatu i wszystkiego, co od niego zależy** — a zależy od niego prawdopodobnie wszystko: tracking, billing, planning, claims.

**Dlaczego to bomba?** Bo model zakłada, że transport to jedna ciągła podróż jednym pojazdem z jednym kierowcą po drodze. Transport morski to **5 faz, 3+ tryby transportu, 5+ wykonawców, tygodnie zamiast godzin**. Nie da się tego wcisnąć w powyższą strukturę.

**Jak to powinno wyglądać, żeby zmiana była łagodna:**

```
// Abstrakcja: Shipment jako sekwencja Legs
class Shipment {
    shipmentId: ShipmentId
    clientId: ClientId
    origin: Location           // nie Address — bo port to też Location
    destination: Location
    legs: List<TransportLeg>   // sekwencja odcinków różnych typów
    status: ShipmentStatus
    incoterm: Incoterm         // FOB, CIF, DDP...
}

// Polimorficzne nogi transportowe
abstract class TransportLeg {
    legId: LegId
    sequence: Int
    origin: Location
    destination: Location
    plannedDeparture: DateTime
    plannedArrival: DateTime
    actualDeparture: DateTime?
    actualArrival: DateTime?
    status: LegStatus
    carrierId: CarrierId
}

class RoadLeg extends TransportLeg {
    truckId: TruckId?
    driverId: DriverId?
    route: List<RoadWaypoint>
    tollCosts: Money
}

class OceanLeg extends TransportLeg {
    vesselName: String
    voyage: VoyageNumber
    bookingNumber: BookingNumber
    containerId: ContainerId
    portOfLoading: PortCode
    portOfDischarge: PortCode
    billOfLadingNumber: BLNumber?
    transshipments: List<Transshipment>
}

// W przyszłości — gdyby pojawiło się np. lotnicze:
class AirLeg extends TransportLeg {
    flightNumber: FlightNumber
    airWaybillNumber: AWBNumber
    // ...
}
```

**Kluczowa zasada**: Shipment nie wie, jakim modem jedzie każdy leg. Wie tylko, że ma sekwencję legów z ETA. Dzięki temu **Order Management, Tracking, Billing** mogą operować na poziomie Shipment i Leg bez wiedzy o szczegółach modalnych.

---

#### 🔴 KRYTYCZNE USZTYWNIENIE #2: „Carrier = Firma z ciężarówkami"

**Jeśli** kontekst Carrier Management modeluje kontrahenta tak:

```
class Carrier {
    carrierId: CarrierId
    name: String
    fleetSize: Int              // ile ciężarówek
    trucks: List<Truck>
    drivers: List<Driver>
    operatingRegions: List<Country>
    ratePerKm: Money
    transitTimeCalculation: (origin, dest) → Hours
}
```

…to linia oceaniczna (Maersk) nie pasuje do tego modelu w żadnym wymiarze. Maersk nie ma `ratePerKm`, nie ma `trucks`, jej `transitTimeCalculation` to lookup w rozkładzie rejsów, nie kalkulacja po drogach.

**Jak powinno być:**

```
// Carrier jako generyczna zdolność dostarczenia z A do B
class Carrier {
    carrierId: CarrierId
    name: String
    type: CarrierType           // ROAD, OCEAN, AIR, RAIL
    supportedTradeLines: List<TradeLane>
    contracts: List<CarrierContract>
    // brak fleet details — to jest wewnętrzna sprawa carrieru
}

// Rate card per carrier type
interface RateCard {
    fun quote(origin: Location, dest: Location, cargo: CargoSpec): QuoteResult
}

class RoadRateCard implements RateCard { /* per km/per paleta */ }
class OceanRateCard implements RateCard { /* per TEU + surcharges */ }
```

---

#### 🔴 KRYTYCZNE USZTYWNIENIE #3: „Tracking = ciągły strumień GPS"

**Jeśli** system trackingowy jest zbudowany tak, że oczekuje pozycji GPS co N minut i cały UI/UX oraz downstream (ETA prediction, alerting, SLA monitoring) opiera się na ciągłym strumieniu lokalizacji — to morze łamie ten model. Na morzu:
- AIS daje pozycję statku, ale z opóźnieniem i nie zawsze
- Kontener na statku nie ma własnego GPS (chyba że smart container)
- Główne źródło danych to milestone'y od linii oceanicznej: „załadowano", „statek odpłynął", „transshipment", „statek przybył", „rozładowano"

**Jak powinno być:**

```
// Event-based tracking — działa dla obu modów
class TrackingEvent {
    eventId: EventId
    shipmentId: ShipmentId
    legId: LegId
    timestamp: DateTime
    eventType: TrackingEventType     // DEPARTED, ARRIVED, IN_TRANSIT, 
                                     // LOADED_ON_VESSEL, CUSTOMS_CLEARED, etc.
    location: Location?              // opcjonalne — nie zawsze znamy
    coordinates: GeoCoordinates?     // opcjonalne — nie zawsze dostępne
    source: DataSource               // GPS_TRACKER, CARRIER_API, AIS, 
                                     // MANUAL_UPDATE, PORT_SYSTEM
    metadata: Map<String, Any>       // extensible — mode-specific details
}
```

Z poziomu klienta: „Gdzie jest moja przesyłka?" → system pokazuje **ostatni znany event** i **prognozowany ETA** — niezależnie od tego, czy źródłem jest GPS ciężarówki, AIS statku, czy event z API Maerska.

---

#### 🔴 KRYTYCZNE USZTYWNIENIE #4: „Cena = jedna liczba w EUR"

**Jeśli** wycena i billing są zbudowane tak:

```
class Invoice {
    shipmentId: ShipmentId
    amount: BigDecimal      // jedna kwota
    currency: "EUR"         // hardcoded
    lineItems: none         // brak szczegółowych pozycji
}
```

…to morze to wysadza. Jedna przesyłka morska ma 10–20 pozycji kosztowych w 2–3 walutach, z czego niektóre są znane z góry (ocean freight), a inne naliczane ex post (demurrage).

**Jak powinno być:**

```
class Invoice {
    invoiceId: InvoiceId
    shipmentId: ShipmentId
    lineItems: List<InvoiceLineItem>
    totalsByCurrency: Map<Currency, Money>
}

class InvoiceLineItem {
    chargeType: ChargeType      // OCEAN_FREIGHT, BAF, THC_ORIGIN, 
                                // CUSTOMS_FEE, INLAND_HAULAGE, DEMURRAGE, etc.
    description: String
    amount: Money
    currency: Currency
    legId: LegId?               // do którego odcinka się odnosi
    taxRate: Percentage
    settlementStatus: SettlementStatus
}
```

**Rdzeń procesu fakturowania** (generuj fakturę → wyślij → śledź płatność → uzgodnij) **nie zmienia się**. Zmienia się **input** (więcej pozycji, więcej walut) i **reguły** (kiedy można wystawić fakturę — po B/L? Po dostawie? Prepaid?).

---

#### 🟡 UMIARKOWANE USZTYWNIENIE #5: „Customs = procedura na przejściu drogowym"

Customs jest już subdomeną w istniejącym systemie. Jeśli jest zaprojektowany jako:
```
class CustomsDeclaration {
    borderCrossing: BorderCrossingPoint  // przejście drogowe
    truckRegistration: String
    driverPassport: String
    // ...
}
```
…to trzeba przebudować. Ale jeśli jest bardziej generyczny:
```
class CustomsDeclaration {
    declarationType: DeclarationType   // EXPORT, IMPORT, TRANSIT
    transportMode: TransportMode
    entryPoint: Location               // port lub przejście drogowe
    documents: List<CustomsDocument>
    // ...
}
```
…to dodanie morskiego cła to rozszerzenie, nie rewolucja.

---

#### 🟢 CO SIĘ NIE ZMIENIA (lub zmienia się minimalnie)

| Moduł | Dlaczego stabilny |
|---|---|
| **Customer Management / CRM** | Klient to klient — niezależnie od modu transportu. Onboarding, dane kontaktowe, historia — bez zmian. |
| **User Authentication & Authorization** | Logowanie, role, uprawnienia — agnostyczne wobec modu transportu. |
| **Warehouse Management** | Magazyn to magazyn. Towar wpływa i wypływa — nieważne, czy przyjechał ciężarówką, czy kontenerem z portu. |
| **Reporting / Analytics infrastructure** | Infrastruktura raportowa (pipeline, storage, dashboards) się nie zmienia — zmieniają się **metryki** i **wymiary** (dodajemy wymiar „transport mode", nowe KPI jak demurrage cost). |
| **Notification / Communication framework** | Mechanizm wysyłania maili/SMS/webhooków się nie zmienia — zmieniają się **szablony** i **triggery**. |
| **Core financials / General Ledger** | Księga główna księguje przychody i koszty — niezależnie od tego, czy koszt to „diesel" czy „ocean freight". |

---

### 6.3 Podsumowanie — macierz wpływu zmiany

```
                        WPŁYW NA KOD
                 ┌──────────────────────────────────────────┐
                 │  🟢 Minimalny    🟡 Umiarkowany    🔴 Duży │
 ┌───────────────┼──────────────────────────────────────────┤
 │ Customer Mgmt │  🟢                                       │
 │ Auth/AuthZ    │  🟢                                       │
 │ Warehouse     │  🟢                                       │
 │ Reporting     │  🟢 (nowe metryki, nie nowy silnik)       │
 │ Notifications │  🟢 (nowe szablony)                       │
 │ General Ledger│  🟢                                       │
 │               │                                          │
 │ Customs       │            🟡 (rozszerzenie procedur)     │
 │ Cold Chain    │            🟡 (reefer containers)         │
 │ Carrier Mgmt  │            🟡─🔴 (zależy od abstrakcji)   │
 │ Claims        │            🟡─🔴 (nowy reżim prawny)      │
 │               │                                          │
 │ Transport     │                                    🔴    │
 │  Planning     │                          (nowy paradygmat │
 │               │                           planowania)     │
 │ Execution/    │                                    🔴    │
 │  Orchestration│                          (multi-leg,      │
 │               │                           multi-mode)     │
 │ Tracking      │                                    🔴    │
 │               │                     (jeśli oparty na GPS) │
 │ Billing/      │                                    🔴    │
 │  Pricing      │                     (jeśli single-amount) │
 │               │                                          │
 │ === ZUPEŁNIE NOWE MODUŁY ===                             │
 │ Container Mgmt│  N/A — nowy bounded context              │
 │ Vessel Sched. │  N/A — nowy bounded context              │
 │ B/L Mgmt      │  N/A — nowy bounded context              │
 │ Port Ops      │  N/A — nowy bounded context              │
 │ Intermodal    │  N/A — nowy bounded context              │
 │  Orchestration│       (lub rozszerzenie Execution)       │
 │ Trade Finance │  N/A — nowy bounded context              │
 └───────────────┴──────────────────────────────────────────┘
```

### 6.4 Architektoniczne zasady, które minimalizują rewolucję

Na podstawie tej analizy — oto **konkretne zasady projektowe**, które gdyby były stosowane od początku, uchroniłyby system przed przeoraniem:

---

**Zasada 1: Transport Mode jako wymiar, nie jako założenie.**

Nigdzie w systemie „tryb transportu" nie powinien być hardcodowany. Powinien być explicite modelowany jako parametr:

```
enum TransportMode { ROAD, OCEAN, RAIL, AIR }
```

Każdy moduł, który zachowuje się inaczej w zależności od modu, powinien to robić przez **Strategy Pattern** lub **polimorfizm**, nie przez `if/else` rozlewające się po całym kodzie.

---

**Zasada 2: Shipment jako kompozycja Legs, nie monolityczny obiekt.**

Shipment powinien być agnostyczny wobec modu — to sekwencja odcinków. Każdy odcinek ma swojego wykonawcę, swój czas, swoje eventy. Dzięki temu dodanie nowego typu odcinka (OceanLeg) nie zmienia modelu Shipmentu.

---

**Zasada 3: Tracking oparty na eventach (milestones), nie na ciągłym strumieniu.**

Model event-based jest nadrzędny wobec GPS. GPS to jedno ze **źródeł** eventów trackingowych. AIS to drugie. API carrieru to trzecie. Tracking powinien operować na eventach, a ciągły GPS powinien być tłumaczony na eventy na warstwie integracyjnej.

---

**Zasada 4: Billing oparty na line items, nie na single-amount.**

Faktura powinna być od początku zaprojektowana jako lista pozycji kosztowych z walutami — nawet jeśli na początku jest tylko jedna pozycja w EUR. To kosztuje prawie nic więcej w implementacji, a chroni przed przebudową.

---

**Zasada 5: Carrier jako interfejs zdolności, nie jako model floty.**

System nie powinien modelować wewnętrznej struktury carrieru (jego ciężarówki, jego kierowcy). Powinien modelować **zdolność carrieru do dostarczenia ładunku** — jako interfejs. Wtedy linia oceaniczna i firma ciężarówkowa implementują ten sam interfejs, choć wewnętrznie są zupełnie inne.

---

**Zasada 6: Customs i Claims sparametryzowane reżimem prawnym.**

Reguły celne i reklamacyjne powinny być wydzielone do osobnych „rule engines" lub „policy objects" parametryzowanych kontekstem (tryb transportu, jurysdykcja, konwencja prawna). Workflow (zgłoszenie → ocena → decyzja) jest wspólny; reguły (terminy, limity, dokumenty) są wymienialne.

---

**Zasada 7: Loose coupling między bounded contexts przez eventy domenowe.**

Jeśli Transport Planning publikuje event `ShipmentPlanned`, a Tracking subskrybuje ten event i zakłada sobie śledzenie — to zmiana w Transport Planning (dodanie morskiego planowania) nie wymusza zmian w Tracking. Tracking dostaje event, widzi legi, zaczyna śledzić. Jeśli natomiast Tracking bezpośrednio wywołuje API Transport Planning i parsuje struktury drogowe — coupling jest tight i zmiana się propaguje.

```
// Event-driven — loose coupling
Event: ShipmentPlanned {
    shipmentId: "SHP-12345"
    legs: [
        { legId: "L1", type: ROAD, origin: "Stuttgart Factory", dest: "Hamburg Port", carrier: "SpedX" },
        { legId: "L2", type: OCEAN, origin: "Hamburg Port", dest: "Shanghai Port", carrier: "Maersk" },
        { legId: "L3", type: ROAD, origin: "Shanghai Port", dest: "Suzhou Warehouse", carrier: "SinoTruck" }
    ]
}

// Tracking Service odbiera event i dla każdego legu uruchamia 
// odpowiedni adapter trackingowy (GPS adapter dla ROAD, AIS/API adapter dla OCEAN)
```

---

### 6.5 Odpowiedź na pytanie: „ile modułów pod młotek?"

Przy **dobrze zaprojektowanej architekturze** (powyższe zasady):

| Kategoria | Moduły | Szacowany wysiłek |
|---|---|---|
| **Bez zmian** | Customer Mgmt, Auth, Warehouse, GL, Notifications, Reporting infra | 0% kodu do zmiany |
| **Konfiguracja / rozszerzenie** | Customs (nowe procedury), Cold Chain (reefer), Carrier Mgmt (nowy typ), Claims (nowe reguły), Billing (nowe charge types) | 10–20% kodu tych modułów — głównie dodanie nowych implementacji istniejących interfejsów |
| **Znaczące rozszerzenie** | Transport Planning (intermodal), Execution (multi-leg orchestration), Tracking (nowe źródła danych) | 30–40% kodu tych modułów — nowa logika, ale w ramach istniejących abstrakcji |
| **Nowe moduły (od zera)** | Container Mgmt, Vessel Schedule, B/L Mgmt, Port Ops, Trade Finance | 100% nowy kod, ale **izolowany** — nie przeoruje istniejącego |

Przy **źle zaprojektowanej architekturze** (usztywnienia #1–#4):

| Kategoria | Moduły | Szacowany wysiłek |
|---|---|---|
| **Efekt domina** | Transport → Tracking → Billing → Claims → Carrier → Planning → Execution → API klienckie → UI | 60–80% kodu CAŁEGO systemu do przebudowy, bo zmiana modelu Transportu propaguje się wszędzie |

---

## 7. Wnioski końcowe

### Zmiana biznesowa

Rozszerzenie o transport morski to **nie** dodanie nowego feature'a. To **otwarcie nowej subdomeny** z własnymi interesariuszami (linie oceaniczne, porty, agenci), własnymi konceptami domenowymi (kontener, konosament, demurrage, transshipment), własnym prawem (Hague-Visby) i własną dynamiką czasową (tygodnie zamiast godzin).

### Zmiana architektoniczna

Skala rewolucji w kodzie zależy **niemal wyłącznie** od jednej decyzji podjętej na początku projektu: **czy system modeluje „transport" generycznie (jako sekwencję legów różnych typów) czy konkretnie (jako jazdę ciężarówką)**. Ta jedna decyzja, podjęta lata wcześniej, determinuje, czy wejście w morze to 3 miesiące pracy nad nowymi modułami, czy 18 miesięcy przebudowy całego systemu.

### Pięć kluczowych abstrakcji chroniących przed rewolucją

1. **Shipment = ordered list of Legs** (nie: Shipment = Truck Trip)
2. **Carrier = capability to move cargo** (nie: Carrier = fleet of trucks)
3. **Tracking = stream of events** (nie: Tracking = GPS coordinates)
4. **Price = list of line items in multiple currencies** (nie: Price = single EUR amount)
5. **Legal regime = pluggable policy** (nie: Legal regime = hardcoded CMR rules)

Przy tych pięciu abstrakcjach, wejście Deliveroo w transport morski oznacza: **dodanie nowych bounded contexts (Container, Vessel, B/L, Port Ops) i nowych implementacji istniejących interfejsów — bez przeorywania fundamentów.**