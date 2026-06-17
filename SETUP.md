# Country Chef parduotuvė – gaminių tvarkymas per Google Sheets

Tikslas: pavadinimus, kainas, aprašymus ir nuotraukas redaguoti **lentelėje**,
o ne kode. Puslapis (`index.html`) gaminius užsikrauna iš lentelės atidarymo metu.

---

## Failai

| Failas | Kam |
|---|---|
| `index.html` | Pati parduotuvė (vienas failas, veikia ir offline). |
| `google-apps-script.gs` | Kodas, kurį įklijuojate į Google Sheets (paskelbia lentelę kaip JSON). |
| `catalog.csv` | Paruošti 13 gaminių – importuojate į lentelę, kad nereiktų vesti ranka. |

---

## Vienkartinis paleidimas (~10 min)

### 1. Sukurkite lentelę
1. Naujas Google Sheets dokumentas.
2. Lapą (apačioje) pervadinkite į **`Products`** (svarbu – tikslus pavadinimas).
3. **File → Import → Upload → `catalog.csv`** → *Replace current sheet*.
   Gausite stulpelius: `id, name, short, description, price, unit, max, ustep, tag, tagClass, icon, image, active`.

### 2. Paskelbkite kaip JSON
1. **Extensions → Apps Script**.
2. Viską ištrinkite, įklijuokite `google-apps-script.gs` turinį, išsaugokite.
3. **Deploy → New deployment → Type: Web app**
   - *Execute as:* **Me**
   - *Who has access:* **Anyone**
4. Patvirtinkite leidimus. Nukopijuokite **Web app URL** (baigiasi `…/exec`).

### 3. Prijunkite puslapį
`index.html` faile suraskite eilutę:
```js
const CATALOG_URL = '';
```
ir įklijuokite savo nuorodą:
```js
const CATALOG_URL = 'https://script.google.com/macros/s/AKfyc..../exec';
```
Viskas. Atidarius puslapį gaminiai bus paimti iš lentelės.

---

## Kasdienis naudojimas

| Noriu… | Lentelėje… |
|---|---|
| Pakeisti kainą | Pakeičiu skaičių stulpelyje `price` (pvz. `12.50`). |
| Pataisyti aprašymą | Redaguoju `description` (ilgas, „Sudėtis…") arba `short` (trumpas po pavadinimu). |
| Pridėti gaminį | Nauja eilutė su unikaliu `id` ir užpildytais stulpeliais. |
| Laikinai paslėpti | `active` stulpelyje rašau `FALSE`. |
| Pakeisti nuotrauką | Įrašau nuotraukos URL į `image`. |

Pakeitimai matomi iškart perkrovus puslapį – **nieko iš naujo diegti nereikia**
(iš naujo „Deploy" reikia tik jei keičiate patį `.gs` kodą).

### Stulpelių reikšmės
- **id** – unikalus raktas (be tarpų, pvz. `sonine-pj`). Nekeiskite be reikalo.
- **price** – skaičius; kableliai arba taškai veikia (`12,50` arba `12.50`).
- **unit** – rodoma prie kainos: `/kg`, `/vnt.`, `/pak.`
- **max** – didžiausias kiekis, kurį galima pridėti.
- **ustep** – matas krepšelyje: `vnt.`, `pak.`, `juostos`.
- **tag** – spalvotas ženkliukas ant nuotraukos (pvz. `Karštai rūkyta`). Tuščia = be ženkliuko.
- **tagClass** – ženkliuko spalva: `hot` (raudona), `gift` (auksinė), tuščia (žalia).
- **icon** – atsarginis simbolis, jei nėra nuotraukos (pvz. 🍖).
- **image** – nuotraukos URL (žr. žemiau). Tuščia = rodoma `icon`.

---

## Nuotraukos

`image` stulpelyje reikia **tiesioginio** nuotraukos URL. Variantai:

- **Paprasčiausia:** nuotraukas laikyti `images/` aplanke šalia `index.html`
  ir `image` rašyti `images/sonine.jpg`. (Reikia, kad puslapis būtų talpinamas,
  ne tik atidaromas iš disko.)
- **Hostingas:** bet koks viešas paveikslėlio URL (jūsų svetainė, CDN, FB puslapio
  nuotraukos nuoroda ir pan.).
- Palikus `image` tuščią, kortelėje rodoma `icon` piktograma – parduotuvė vis tiek veikia.

> Pastaba: tiesiai iš Google Forms paimtos nuotraukos turi laikiną (pasibaigiančią)
> nuorodą, todėl nuolatiniam katalogui jos netinka – įkelkite nuotraukas į pastovią vietą.

---

## Kaip tai veikia (trumpai)

1. Atidarius `index.html`, jis kreipiasi į `CATALOG_URL` (JSONP – todėl veikia ir
   iš `file://`, ir iš hostingo, be CORS problemų).
2. Apps Script grąžina lentelės `Products` eilutes kaip JSON.
3. Puslapis sugeneruoja korteles iš tų duomenų.
4. Jei `CATALOG_URL` tuščias **arba** lentelė nepasiekiama (offline, klaida) –
   naudojamas į failą įrašytas atsarginis 13 gaminių sąrašas (`FALLBACK_PRODUCTS`).
   Todėl parduotuvė niekada „nenukrinta".

---

## Užsakymų priėmimas (jau veikia)

Užsakymo mygtukas **siunčia užsakymą tiesiai į jūsų esamą Google Form**, todėl
užsakymai patenka į tą pačią atsakymų lentelę kaip ir anksčiau.

Kaip veikia:
- Užpildomi kontaktai (el. paštas, vardas, telefonas, adresas), kiekvienas
  gaminys įrašomas į savo formos stulpelį, o **„Pastabos" laukelyje visada
  būna pilnas užsakymo sąrašas su suma** (atsarginė kopija).
- Siunčiama per paslėptą `iframe`, todėl veikia ir atidarius iš disko, ir iš hostingo.

**Svarbu patikrinti vieną kartą:**
1. Pateikite vieną bandomąjį užsakymą.
2. Patikrinkite, ar jis atsirado Google Form atsakymuose / lentelėje.
3. Jei užsakymo nematote – greičiausiai formoje el. pašto rinkimas nustatytas
   į „Verified / patvirtintas" (reikalauja Google prisijungimo). Tada formos
   nustatymuose pakeiskite el. pašto rinkimą į **„Responder input"** ir
   pakartokite testą. (El. paštas vis tiek dubliuojamas „Pastabose".)

> Pastaba: naršyklė dėl saugumo (CORS) negali perskaityti Google atsakymo, todėl
> puslapis sėkmę rodo optimistiškai. Dėl to ir svarbu vienąkart pasitikrinti.

Jei vėliau pakeisite gaminius formoje (pavadinimus ar kiekių variantus), gali
reikėti atnaujinti laukų ID `index.html` faile (`PRODUCT_ENTRY`) – parašykite ir
sutvarkysiu.
