# Admin portalas – gaminių tvarkymas per naršyklę

`public/admin.html` – slaptažodžiu apsaugotas puslapis, kuriame galite pridėti,
redaguoti, paslėpti ar ištrinti gaminius iš bet kurios naršyklės (ir telefono).
Pakeitimai įrašomi į tą pačią Google Sheets lentelę, iš kurios skaito parduotuvė.

> Reikalavimas: pirmiausia turi būti paruoštas Google Sheets katalogas
> (žr. `SETUP.md`) su nauja `google-apps-script.gs` versija.

---

## Vienkartinis paruošimas

### 1. Atnaujinkite Apps Script
1. Google Sheets → **Extensions → Apps Script**.
2. Įklijuokite naują `google-apps-script.gs` turinį (jame jau yra admin + nuotraukų įkėlimo funkcijos).
3. Nustatykite **slaptažodį**:
   - **Project Settings** (krumpliaratis kairėje) → **Script properties** → **Add script property**
   - **Property:** `ADMIN_TOKEN`  **Value:** *(sugalvokite stiprų slaptažodį)*
   - Išsaugokite.
4. **Suteikite Drive leidimą nuotraukoms (vienkartinis):**
   - Redaktoriaus viršuje funkcijų sąraše pasirinkite **`authorize`** → **Run**.
   - Patvirtinkite leidimus (jei rodo „Google hasn't verified this app" → **Advanced → Go to … → Allow**).
   - Tai sukuria Drive aplanką **„Country Chef nuotraukos"**, kur saugomos įkeltos nuotraukos.
5. **Deploy → Manage deployments → Edit (pieštukas) → Version: New version → Deploy.**
   (Web app URL nesikeičia.)

### 2. Atidarykite admin puslapį
- Gyvai (po Azure publikavimo): `https://JUSU-SVETAINE.azurestaticapps.net/admin.html`
- Arba lokaliai: atidarykite `public/admin.html` naršyklėje.

### 3. Prisijunkite
- **API nuoroda:** ta pati Apps Script „Web app" nuoroda (`…/exec`).
- **Slaptažodis:** `ADMIN_TOKEN` reikšmė.
- Nuoroda įsimenama; slaptažodis galioja tik tą sesiją (saugumui).

---

## Ką galima daryti

| Veiksmas | Kaip |
|---|---|
| **Pridėti gaminį** | „＋ Naujas gaminys" → užpildyti laukus → Išsaugoti. |
| **Redaguoti** | Prie gaminio „Keisti" → pakeisti → Išsaugoti. (ID nekeičiamas.) |
| **Paslėpti / rodyti** | „Slėpti" / „Rodyti" – parduotuvėje gaminys dingsta/atsiranda. |
| **Ištrinti** | „Trinti" (su patvirtinimu). |
| **Nuotrauka (įkelti)** | „Įkelti nuotrauką" → pasirinkti failą. Sumažinama ir įkeliama į jūsų Google Drive; URL užsipildo automatiškai. Veikia ir iš telefono. |
| **Nuotrauka (URL)** | Arba įklijuoti nuotraukos URL ranka (matysite peržiūrą). |

Po kiekvieno veiksmo sąrašas automatiškai atsinaujina ir parodo realią lentelės būseną.

---

## Saugumas (svarbu)

- Slaptažodis tikrinamas **serveryje** (Apps Script), todėl jo nėra puslapio kode.
- Bet kas, žinantis admin URL **ir** slaptažodį, gali keisti gaminius –
  todėl naudokite **stiprų** `ADMIN_TOKEN` ir nedalinkite nuorodos viešai.
- Norint papildomo sluoksnio, `admin.html` galima apsaugoti Azure prisijungimu
  (Static Web Apps autentifikacija) – parašykite, jei norite tai įjungti.
- Puslapyje yra `noindex`, kad jo neindeksuotų Google paieška.

---

## Kaip tai veikia (trumpai)

- **Skaitymas** (sąrašas, įskaitant paslėptus): `GET …?admin=1&token=…` per JSONP.
- **Rašymas** (add/update/delete/toggle): `POST` su slaptažodžiu. Dėl naršyklės
  saugumo (CORS) atsako perskaityti negalima, todėl po įrašymo puslapis iš naujo
  nuskaito lentelę ir parodo rezultatą – taip matote, ar pakeitimas pavyko.
