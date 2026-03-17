### 1. Proponowane *user stories* (z perspektywy pracownika logistyki / wyceny, korzystającego z systemu DELIVEROO) 

1.  *Weryfikacja ładunku i dopasowanie naczepy*  
    Jako planer logistyki chcę widzieć typ ładunku oraz jego podstawowe parametry (rodzaj, wymiary, masa), aby system podpowiedział właściwy typ naczepy i zasygnalizował niedopasowanie. 

2.  *Kontrola limitów wymiarów i masy*  
    Jako analityk / planer chcę, aby system automatycznie sprawdzał zadeklarowane wymiary i masę ładunku względem dopuszczalnych limitów, aby zidentyfikować zlecenia ryzykowne (ponadnormatywne / przekroczone DMC). 

3.  *Weryfikacja dostępności kierowcy*  
    Jako kierownik floty chcę, aby system pokazywał dostępność kierowców (grafik + czas pracy z tachografu + uprawnienia ADR), aby przydzielić tylko kierowcę wypoczętego i odpowiednio przeszkolonego. 

4.  *Weryfikacja dostępności pojazdu*  
    Jako kierownik floty chcę widzieć, czy pojazd jest wolny (nieprzypisany do innego zlecenia, poza serwisem), aby nie zaoferować transportu bez realnej dostępności. 

5.  *Obsługa pilnych zleceń („ekspresów”)*  
    Jako planer chcę, aby system rozpoznawał zlecenia pilne (np. załadunek ≤ X godzin) i stosował uproszczoną ścieżkę akceptacji plus dopłatę (np. +20%), aby szybko podjąć decyzję i właściwie wycenić „ekspres”. 

6.  *Weryfikacja dokumentów dla materiałów niebezpiecznych (ADR)*  
    Jako planer chcę, aby system wymuszał kompletny zestaw dokumentów ADR dla niebezpiecznych ładunków oraz blokował zlecenie przy brakach, aby nie dopuścić do niezgodnych z prawem transportów. 

7.  *Weryfikacja dokumentów do odprawy celnej*  
    Jako analityk / planer chcę, aby system weryfikował komplet dokumentów celnych (faktura, list przewozowy, świadectwo pochodzenia itd.) i ustawił zlecenie w status „zawieszone” do czasu uzupełnienia, aby nie potwierdzać zleceń bez pełnej dokumentacji. 

8.  *Planowanie i rezerwacja składowania tymczasowego*  
    Jako planer chcę, aby system pozwalał sprawdzić dostępność magazynu (suche, wrażliwe, chłodnie, mrożonki), zarezerwować miejsce oraz naliczyć koszty po 2. dniu składowania, aby obsłużyć sytuacje, gdy towar musi zostać czasowo odłożony. 

9.  *Proaktywne sygnalizowanie opcji magazynowania klientowi*  
    Jako pracownik obsługi klienta chcę, aby system podpowiadał możliwość magazynowania w scenariuszach typowych (np. dostawa w piątek, odbiór w poniedziałek; przepełniony magazyn klienta), aby móc zaproponować klientowi elastyczne rozwiązanie. 

10. *Automatyczne naliczanie kosztów magazynowania*  
    Jako analityk ds. wycen chcę, aby system naliczał koszt składowania po przekroczeniu 2 darmowych dni, z różnymi stawkami dla typu magazynu, aby wycena od razu odzwierciedlała koszty przechowywania. 

*

### 2. *Example Mapping* – wybrane kluczowe user stories

Poniżej:

*   *Reguły (Rules)* 🟨 – żółte karteczki
*   *Przykłady (Examples)* 🟩 🟩 – zielone karteczki
*   *Pytania / niejasności (Questions)* – czerwone, wypisane w osobnej sekcji

*

#### 2.1. Story 1 – Weryfikacja ładunku i dopasowanie naczepy 

*Story*  
„Jako planer logistyki chcę widzieć typ ładunku oraz jego podstawowe parametry (rodzaj, wymiary, masa), aby system podpowiedział właściwy typ naczepy i zasygnalizował niedopasowanie.”

*Reguły (Rules)* 🟨

*   R1: Elektronika i palety → domyślny typ naczepy: firanka.
*   R2: Żywność wymagająca temperatury kontrolowanej → naczepa: chłodnia.
*   R3: Ładunek ponadgabarytowy (ponad dopuszczalne wymiary standardowe) → naczepa: platforma / ponadgabaryt.
*   R4: Brak dokładnych wymiarów / masy → system blokuje przyjęcie zlecenia („Bez nich nie podejmujemy się tematu”). 

*Przykłady (Examples)* 🟩

*   E1: Ładunek: elektronika na paletach, 2,2 m szerokości, 10 t → system proponuje firankę, status OK.
*   E2: Ładunek: mrożonki, wymagane -18°C → system proponuje chłodnię, status OK.
*   E3: Ładunek: elementy konstrukcji stalowej, 2,63 m szerokości → system kwalifikuje jako ponadgabaryt, proponuje platformę, ostrzeżenie o konieczności zezwoleń. 

*

#### 2.2. Story 2 – Kontrola limitów wymiarów i masy 

*Story*  
„Jako analityk / planer chcę, aby system automatycznie sprawdzał zadeklarowane wymiary i masę ładunku względem dopuszczalnych limitów, aby zidentyfikować zlecenia ryzykowne (ponadnormatywne / przekroczone DMC).”

*Reguły (Rules)* 🟨

*   R1: Jeśli zadeklarowana masa lub wymiary przekraczają dopuszczalne limity dla wybranego zestawu → system oznacza zlecenie jako „ryzykowne / wymagające zezwoleń”. 
*   R2: Jeśli realne dane (po ważeniu/pomiarze) różnią się istotnie od deklarowanych → system generuje alert o podwyższonym ryzyku kar i kosztów (mandaty, przeładunek, opóźnienia). 

*Przykłady (Examples)* 🟩

*   E1: Deklaracja 2,45 m szerokości i 18 t, realnie 2,63 m i 20,2 t → system oznacza jako przekroczone, sugeruje ponadgabaryt + dopuszczenia, informuje o ryzyku kar. 
*   E2: Deklaracja 22 t, realnie 25 t → system oznacza przekroczenie DMC zestawu, blokuje start zlecenia, wymaga korekty (np. rozładunek części). 

*

#### 2.3. Story 3 – Weryfikacja dostępności kierowcy 

*Story*  
„Jako kierownik floty chcę, aby system pokazywał dostępność kierowców (grafik + czas pracy z tachografu + uprawnienia ADR), aby przydzielić tylko kierowcę wypoczętego i odpowiednio przeszkolonego.”

*Reguły (Rules)* 🟨

*   R1: Kierowca, który wrócił z długiej trasy, musi mieć zapewniony minimalny czas odpoczynku – jeśli nie, nie może zostać przydzielony. 
*   R2: Dla materiałów niebezpiecznych (ADR) kierowca musi mieć ważne uprawnienia ADR – brak = blokada przydziału. 

*Przykłady (Examples)* 🟩

*   E1: Kierowca A – zakończył trasę dziś rano, licznik odpoczynku < wymaganego minimum → system oznacza jako „niedostępny” do nowego zlecenia.
*   E2: Kierowca B – odpoczynek OK, ale brak ADR → dostępny tylko do standardowych ładunków, zablokowany dla zleceń ADR. 

*

#### 2.4. Story 5 – Obsługa pilnych zleceń („ekspresów”) 

*Story*  
„Jako planer chcę, aby system rozpoznawał zlecenia pilne (np. załadunek ≤ X godzin) i stosował uproszczoną ścieżkę akceptacji plus dopłatę (np. +20%), aby szybko podjąć decyzję i właściwie wycenić ‘ekspres’.”

*Reguły (Rules)* 🟨

*   R1: Jeśli klient wymaga załadunku w ciągu 12 godzin → klasyfikacja jako zlecenie pilne. 
*   R2: Zlecenia pilne otrzymują dopłatę standardowo +20% do ceny; w przeciwnym razie nie są realizowane (jeśli klient nie akceptuje dopłaty). 

*Przykłady (Examples)* 🟩

*   E1: Zlecenie: załadunek za 8 godzin → system nadaje status „pilne”, automatycznie dodaje +20% do stawki.
*   E2: Zlecenie: załadunek za 24 godziny → system traktuje jako standardowe, brak dopłaty, pełna standardowa ścieżka weryfikacji. 

*

#### 2.5. Story 7 – Weryfikacja dokumentów do odprawy celnej 

*Story*  
„Jako analityk / planer chcę, aby system weryfikował komplet dokumentów celnych i ustawił zlecenie w status ‘zawieszone’ do czasu uzupełnienia, aby nie potwierdzać zleceń bez pełnej dokumentacji.”

*Reguły (Rules)* 🟨

*   R1: Zlecenie międzynarodowe wymaga kompletu dokumentów: faktura handlowa, list przewozowy, świadectwo pochodzenia (plus ewentualne inne wymagane). 
*   R2: Jeśli dokumentacja jest niepełna → zlecenie ma status „w zawieszeniu” i blokuje ostateczną weryfikację / potwierdzenie. 

*Przykłady (Examples)* 🟩

*   E1: Klient dostarczył fakturę i list przewozowy, brak świadectwa pochodzenia → system oznacza „brak dokumentu X”, status „zawieszone”. 
*   E2: Wszystkie wymagane dokumenty załadowane → status „dokumenty kompletne”, możliwe potwierdzenie przyjęcia zlecenia. 

*

#### 2.6. Story 8/10 – Planowanie i koszty składowania tymczasowego 

*Story (połączone)*  
„Jako planer chcę sprawdzić i zarezerwować odpowiedni typ magazynu (suchy / wrażliwy / chłodnia / mroźnia) oraz automatycznie naliczać koszty po 2 darmowych dniach, aby poprawnie zaplanować przechowanie i skalkulować cenę.”

*Reguły (Rules)* 🟨

*   R1: System musi rozróżniać typy magazynu: towary suche, wrażliwe, chłodnie, mrożonki – każda kategoria ma inną dostępność i stawkę. 
*   R2: Standardowo dwa dni składowania są w cenie; każdy kolejny dzień powoduje naliczenie dodatkowej opłaty zgodnie ze stawką dla danego typu magazynu. 
*   R3: Składowanie nie jest domyślną usługą – pojawia się w sytuacjach: (a) łańcuch dostaw się rozjeżdża (np. dostawa w piątek, odbiór w poniedziałek), (b) klient nie ma miejsca, (c) klient planuje kampanię i celowe „przetrzymanie” dostawy. 

*Przykłady (Examples)* 🟩

*   E1: Transport z Niemiec przyjeżdża w piątek, odbiór w poniedziałek → system rezerwuje magazyn dla towaru na 3 dni; 2 dni w cenie, 1 dzień płatny ekstra. 
*   E2: Klient prosi o przechowanie części dostawy z powodu przepełnionego magazynu → system proponuje dostępne strefy suche/wrażliwe i nalicza koszty zgodnie ze stawką. 

*

### 3. *Czerwone karteczki – pytania / niejasności wymagające doprecyzowania*

1.  *Progi wymiarów i masy* 🟥
    *   Jakie dokładnie limity wymiarów i masy definiują przejście z „standardu” do „ponadgabarytu” i kiedy jest wymagana platforma + dodatkowe zezwolenia? 

2.  *Tolerancje między danymi deklarowanymi a rzeczywistymi* 🟥
    *   Jaki jest dopuszczalny margines błędu (cm / kg / %) zanim system oznaczy zlecenie jako „niebezpieczne / do ponownej wyceny”? 

3.  *Definicja zlecenia „pilnego”* 🟥
    *   Czy próg 12 godzin na załadunek jest stały, czy zależny od relacji / dystansu / typu ładunku?
    *   Czy dopłata +20% jest zawsze taka sama, czy powinna być parametryzowalna (np. 10–30% w zależności od stopnia pilności)? 

4.  *Dokładne wymagania dokumentów ADR i celnych* 🟥
    *   Dla jakich konkretnie klas ładunków niebezpiecznych i relacji wymagane są które dokumenty (szczegółowa tabela wymagań)?
    *   Czy system ma różne zestawy dokumentów w zależności od kierunku (np. UE→UE vs UE→poza UE)? 

5.  *Status „zawieszone” – zachowanie systemu* 🟥
    *   Czy przy statusie „zawieszone” można rezerwować flotę / magazyn, czy wszystko jest blokowane do czasu kompletnej dokumentacji?
    *   Po jakim czasie zlecenia w „zawieszeniu” są automatycznie anulowane (jeśli w ogóle)? 

6.  *Kiedy proaktywnie proponować magazynowanie?* 🟥
    *   Czy system ma automatycznie wykrywać scenariusze typu „piątek–poniedziałek” / „brak gotowości klienta” i sugerować magazyn, czy to tylko informacja dla użytkownika? 

7.  *Polityka rezerwacji magazynu* 🟥
    *   Jak długo można blokować miejsce „na przyszłość” bez dodatkowych opłat / zadatku?
    *   Co się dzieje przy anulacji zlecenia po dokonanej rezerwacji – czy naliczane są opłaty? 

8.  *Stawki magazynowe dla różnych typów towarów* 🟥
    *   Jak dokładnie różnią się stawki dla: suchy / wrażliwy / chłodnia / mroźnia i czy system ma brać pod uwagę jeszcze inne parametry (np. wartość towaru, ubezpieczenie)? 
