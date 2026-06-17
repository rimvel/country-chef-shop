# Diegimas į Azure Static Web Apps

Du būdai. **A variantas (GitHub)** – rekomenduojamas: nemokamas, su HTTPS ir
automatiniu atnaujinimu kiekvieną kartą, kai pakeičiate failą.
**B variantas (SWA CLI)** – be GitHub, įkeliama tiesiai iš kompiuterio.

Publikuojamas tik aplankas **`public/`** (jame `index.html`).

---

## A variantas — GitHub + Azure Portal (rekomenduojama)

### 1. Įkelkite projektą į GitHub
Šis aplankas jau paruoštas kaip git repozitorija (žr. žemiau „Git paruošimas").
Lieka įkelti į GitHub:

1. Susikurkite tuščią repozitoriją github.com (pvz. `country-chef-shop`), **be** README.
2. Terminale, šiame aplanke:
   ```bash
   git remote add origin https://github.com/JUSU-VARDAS/country-chef-shop.git
   git branch -M main
   git push -u origin main
   ```
   (Jei GitHub paprašys prisijungti – naudokite Personal Access Token vietoj slaptažodžio.)

### 2. Sukurkite Static Web App
1. Eikite į **portal.azure.com** → *Create a resource* → ieškokite **Static Web App** → *Create*.
2. Užpildykite:
   - **Subscription / Resource group:** pasirinkite arba sukurkite naują (pvz. `rg-country-chef`).
   - **Name:** `country-chef-shop`
   - **Plan type:** **Free**
   - **Region:** artimiausias (pvz. *West Europe*).
   - **Source:** **GitHub** → prisijunkite → pasirinkite savo *Organization / Repository / Branch (`main`)*.
3. **Build Details:**
   - **Build Presets:** *Custom*
   - **App location:** `public`
   - **Api location:** *(palikite tuščią)*
   - **Output location:** *(palikite tuščią)*
4. *Review + create* → *Create*.

Azure automatiškai įdės GitHub Actions failą į jūsų repo ir po ~1–2 min svetainė bus gyva.

### 3. Atidarykite svetainę
Static Web App resurse rasite **URL** pavidalo
`https://NAME.azurestaticapps.net`. Tai jūsų parduotuvė (HTTPS jau įjungtas).

### 4. Atnaujinimai vėliau
Bet koks pakeitimas → `git commit` → `git push` → Azure perpublikuoja automatiškai.

---

## B variantas — SWA CLI (be GitHub)

Reikia Node.js (nodejs.org). Tada:

```bash
# Įdiegti įrankį (vienkartinai)
npm install -g @azure/static-web-apps-cli

# Prisijungti ir publikuoti tiesiai iš šio aplanko
swa login
swa deploy ./public --env production
```

`swa deploy` paprašys pasirinkti/ sukurti Static Web App resursą jūsų Azure paskyroje
ir įkels `public/` turinį. Atnaujinant – pakartokite `swa deploy`.

---

## Po publikavimo — patikrinkite

1. **Užsakymas:** atidarykite gyvą URL, pateikite vieną bandomąjį užsakymą ir
   patikrinkite, ar jis atsirado Google Form atsakymuose. (Per HTTPS veikia patikimai.)
2. **Katalogas iš Google Sheets** (jei naudosite): į `public/index.html` įrašykite
   `CATALOG_URL`, padarykite `git push` (A variantas) arba `swa deploy` (B). Žr. `SETUP.md`.

## Custom domenas (nebūtina)
Static Web App → **Custom domains** → *Add* → sekite nurodymus (CNAME pas jūsų
domeno tiekėją). HTTPS sertifikatą Azure išduoda automatiškai, nemokamai.
