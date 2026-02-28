### Wprowadzenie

Teraz "trzęsiemy" modelem Lovable: pivot w stronę własnych modeli i infrastruktury nie zmienia obietnicy "od pomysłu do działającej appki", ale radykalnie zmienia to, co firma musi umieć, zbudować i czym zarządzać, żeby tę obietnicę dalej dowozić przy akceptowalnym koszcie. Poniżej rozbijam to na: zmianę modelu biznesowego, nowe zdolności (z kompetencjami, automatyką i KPI), oraz wpływ na strumień wartości i wnioski architektoniczne.

---

### Założenia scenariusza 2027 - co się zmienia

- Publiczne API LLM (OpenAI, Anthropic itd.) stają się na tyle drogie, że przy skali Lovable bardziej opłaca się inwestować we własne/hostowane modele (open-source + fine-tuning) niż płacić rosnące opłaty per token.
- Lovable decyduje się na: własną infrastrukturę GPU (cloud / hybrid / on-prem) i rozwój/tuning modeli wyspecjalizowanych w "vibe-codingu" (codegen, agent, UI edits), przynajmniej dla najbardziej kosztownych ścieżek.
- Celem jest obniżenie średniego kosztu inference per request przy zachowaniu lub poprawie jakości generowanego kodu i UX dla builderów.

Czyli: z konsumenta cudzych modeli Lovable staje się operatorem własnej "AI-fabryki".

---

### Główne skutki dla modelu biznesowego 

- Źródło przewagi przesuwa się z "umiejętności sklejania vendorowych LLM" na własne know-how modelowe + dane + platformę (LLMOps), podobnie jak w klasycznym "build vs buy" przy LLM-ach. 
- Koszty przechodzą z czystego OPEX "per token" na miks CAPEX (sprzęt/infrastruktura) + OPEX (zespół ML/infra, energia, utrzymanie klastrów), więc kluczowe stają się KPI efektywności infrastruktury (GPU utilization, TCO per request itd.). 
- Lovable zyskuje nową ofertę dla enterprise: większa kontrola nad danymi, możliwość custom modeli per klient, gwarancje prywatności - ale płaci za to nową złożonością operacyjną i ryzykiem technicznym.

---

### Nowe zdolności biznesowe - co umieć, co zbudować, czym zarządzać (z KejPIajami)

1. **Zdolność: Własna platforma modelowa (LLM/LLMOps)**

- **Czego trzeba się douczyć (kompetencje)**
  - Deep learning / LLM-y (transformery, fine-tuning, RLHF/RLAIF, distillation) + praktyczny LLMOps (monitoring, retraining, rollout). 
  - Skalowalny training/inference (distributed training, quantization, pruning, model routing). 
- **Co zbudować / zautomatyzować**
  - Pipeline'y treningu / fine-tuningu: ingestion danych, wersjonowanie datasetów, automatyczne retrainingi na feedbacku użytkowników (code quality, success rate tasków). 
  - CI/CD dla modeli: automatyczna walidacja, testy regresji jakości, canary / A/B deployment modeli dla różnych części produktu (chat, agent, generator UI). 
- **Czym będziemy zarządzać**
  - Portfelem modeli (różne rozmiary/architektury do różnych zadań, np. małe szybkie modele do drobnych edycji, większe do generacji całych projektów). 
  - "Contractami jakości" między produktami Lovable a modelami (targety jakości w konkretnych use-case: np. "% wygenerowanych projektów przechodzi smoke-test bez błędów builda"). 
- **Przykładowe KPI**
  - Średni koszt inference per request (USD / 1k tokenów) vs. poprzedni koszt API vendorów. 
  - Task success rate: % promptów generujących działającą appkę bez krytycznego błędu builda. 
  - Model deployment lead time: czas od zaakceptowanej zmiany w modelu do produkcyjnego rollout'u.

---

2. **Zdolność: Platforma danych i feedbacku pod trening modeli**

- **Czego trzeba się douczyć (kompetencje)**
  - Data engineering pod LLM-y: budowa zbiorów dialogów, promptów, kodu, metadanych o sukcesie/porażkach; anonimizacja i compliance.
  - Metody oceny modeli: automatyczne benchmarki, human eval, syntetyczne testy QA dla kodu (statyczna analiza, testy jednostkowe).
- **Co zbudować / zautomatyzować**
  - System zbierania feedbacku z Lovable (np. "ta zmiana zadziałała/nie zadziałała", raporty bugów, rollbacki) --> feature store / data lake dla treningu modeli.
  - Automatyczne generowanie i uruchamianie testów (kod + UX flows) dla wygenerowanych app --> wyniki wracają jako sygnał treningowy do modeli.
- **Czym będziemy zarządzać**
  - Jakością danych treningowych (coverage różnych domen i typów app, poziom szumu, biasy).
  - Zgodnością z regulacjami (GDPR, retention, consent użytkowników na użycie danych do treningu).
- **Przykładowe KPI**
  - Udział sesji z jawnie udzielonym feedbackiem (thumbs up/down, zgłoszenie błędu) w ogólnej liczbie sesji.
  - Poprawa jakości modelu między wersjami (np. wzrost pass rate testów E2E wygenerowanych app o X p.p.).
  - Odsetek danych treningowych z pełnymi metadanymi (kontekst, wynik, typ appki).

---

3. **Zdolność: Zarządzanie infrastrukturą GPU (AI factory)**

- **Czego trzeba się douczyć (kompetencje)**
  - GPU cluster management, schedulery, autoscaling, monitoring (GPU utilization, latency, throughput).
  - Planowanie pojemności (capacity planning), TCO analizy (energia, chłodzenie, amortyzacja sprzętu).
- **Co zbudować / zautomatyzować**
  - Klastrową infrastrukturę inference/training (Kubernetes lub podobny), z autoscalingiem pod obciążenie Lovable (szczyty generacji app vs. spokojne okresy).
  - Monitoring i auto-remediację: wykrywanie spadków GPU utilization, throttlingu, awarii; automatyczne reagowanie (rescheduling, scale-up/down).
- **Czym będziemy zarządzać**
  - Mixem cloud / on-prem / bare-metal (co gdzie się bardziej opłaca przy danym obciążeniu i SLA).
  - Politykami priorytetów: inference dla klientów vs. batch trening modeli, eksperymenty R&D, workloady enterprise klientów.
- **Przykładowe KPI**
  - Średnia GPU utilization (target np. 80-90% bez degradacji SLA).
  - Średnie i p95 latency inference dla kluczowych ścieżek (generacja appki, agent fix bug).
  - Cost per generated project / per active builder (łączny koszt infra / liczba użyć).

---

4. **Zdolność: LLM Gateway / inteligentny routing modeli**

- **Czego trzeba się douczyć (kompetencje)**
  - Projektowanie LLM gateway: routing, fallbacki, polityki użycia modeli (własne vs vendorowe), obserwowalność i limity kosztów.
  - Strategie multi-model: kiedy użyć małego specjalistycznego modelu, kiedy dużego ogólnego, kiedy nadal wywołać zewnętrzny API (np. do rzadkich zadań).
- **Co zbudować / zautomatyzować**
  - Warstwę gateway między produktami Lovable a modelami: jedno API wewnętrzne dla wszystkich komponentów (Chat, Agent, Visual Edits, Generator Code), które samo decyduje, jaki model i gdzie odpalić.
  - Reguły routingu i cost-aware policies (np. "domyślnie własny model, fallback do vendora tylko jeśli confidence < threshold" + automatyczne A/B eksperymenty).
- **Czym będziemy zarządzać**
  - Politykami wykorzystania vendorów (limity kosztów, przypadki użycia, w których nadal mają przewagę jakościową).
  - Regułami risk management (np. zakaz wysyłania określonych kategorii danych do zewnętrznych API).
- **Przykładowe KPI**
  - Udział żądań obsługiwanych przez własne modele vs. vendorowe (docelowo rosnący % własnych).
  - Oszczędność kosztów per miesiąc vs. "all-vendor" baseline przy tym samym usage.
  - Liczba incydentów SLA (przekroczenia latency / błędy) przypisanych do routingu modeli.

---

5. **Zdolność: Risk, compliance i jakość generacji (AI Governance)**

- **Czego trzeba się douczyć (kompetencje)**
  - AI governance, risk management, odpowiedzialne AI (kontrola halucynacji, bezpieczeństwo kodu, kwestie IP, licencje OSS).
  - Audytowalność modeli: wersjonowanie, reproducible training, dokumentowanie zmian wpływających na użytkowników (model cards, change logs).
- **Co zbudować / zautomatyzować**
  - System oceny ryzyka zmian modelu: automatyczne "red team" testy (prompt injection, insecure code patterns), compliance checks przed rolloutem.
  - Audit logi dla inference (co zostało wygenerowane, przez jaki model, z jakimi parametrami) + powiązanie z incydentami u klientów.
- **Czym będziemy zarządzać**
  - Politykami bezpieczeństwa kodu (np. zakazy generowania określonych konstrukcji, wymagane testy przy modyfikacji auth/payment flows).
  - Oczekiwaniami enterprise klientów (dodatkowe wymagania compliance, certyfikacje, audyty).
- **Przykładowe KPI**
  - Liczba/odsetek incydentów bezpieczeństwa powiązanych z wygenerowanym kodem.
  - Odsetek zmian modeli, które przeszły pełny zestaw testów governance przed rolloutem.
  - Czas reakcji na wykryty regres jakości / ryzyka (mean time to mitigation).

---

### Wpływ na strumień wartości Lovable

Patrząc na wcześniejszy strumień "od pomysłu do działającej appki", pivot zmienia "silnik pod maską", ale niekoniecznie samą obietnicę:

- Ideation → pierwsza generacja appki: zamiast jednego vendorowego modelu mamy orkiestrację własnych modeli (np. model "rozumiejący" wymagania + model kodujący). Dla klienta krok wygląda tak samo, ale wewnątrz dochodzi routing, monitoring i koszty GPU zamiast "prostej" faktury API.
- Iteracja (chat, agent, visual edits): te ścieżki są bardzo "token-intensive", więc najbardziej zyskują na własnych modelach - ale wymagają najlepszej telemetrii jakości (żeby nie popsuć DX builderów) i szybkiej pętli treningu na feedbacku.
- Eksport kodu, deployment, runtime: tutaj rośnie znaczenie wewnętrznych benchmarków - czy nowa wersja modelu nadal generuje kod łatwy do utrzymania poza Lovable (np. w GitHubie) i kompatybilny z docelową architekturą (Next.js, Supabase itd.).

**Ważne:** zewnętrzny value stream może pozostać stabilny, podczas gdy wewnętrznie powstaje "AI factory" z dodatkowymi bounded contexts i procesami. To jest sedno, które chcesz pokazać - biznesowo zmieniamy "jak" dostarczamy wartość, a niekoniecznie "co".

---

### Wnioski architektoniczne

- Oddzielenie "AI Platform / LLMOps" jako osobnego bounded contextu - już dziś warto mieć w Lovable abstrakcje typu AppGenerationService, AgentService, VisualEditService, które nie wiedzą, czy pod spodem jest OpenAI, Anthropic, czy własny model. To ogranicza blast radius przy zmianach.
- Kontrakty i KPI jako część modelu domenowego - np. "czas od promptu do działającej appki", "odsetek sukcesów generacji", "średni koszt generacji appki" traktować jako inwarianty strumienia wartości, które nowy AI-stack musi spełnić. Wtedy każdą zmianę LLM/infra możesz oceniać względem tych samych metryk, zamiast "czy vendor jest fajny".
- Przygotowanie na multi-model / multi-vendor już dziś (LLM gateway, abstrakcje) minimalizuje koszt późniejszego pivotu w stronę własnych modeli - zmienia się implementacja, nie kontrakty.

**W efekcie:** myślenie kategoriami modelu biznesowego i strumienia wartości pozwala zobaczyć, które części systemu muszą być elastyczne na pivoty (AI platform, routing, koszty), a które powinny być stabilne (doświadczenie buildera, podstawowy flow od idei do appki). To bezpośrednio przekłada się na projektowanie architektury w DDD: granice kontekstów, kontrakty, metryki i governance projektujesz właśnie pod to, żeby "shaking the model" bolało jak najmniej.