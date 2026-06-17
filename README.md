# Country Chef – parduotuvė

Statinė parduotuvės svetainė (vienas failas), talpinama **Azure Static Web Apps**.

## Struktūra

| Kelias | Paskirtis | Ar publikuojama? |
|---|---|---|
| `public/index.html` | Pati parduotuvė (HTML + CSS + JS + nuotraukos viename faile) | ✅ taip |
| `public/staticwebapp.config.json` | Azure SWA nustatymai (maršrutai, antraštės) | ✅ taip |
| `google-apps-script.gs` | Kodas Google Sheets katalogui (žr. SETUP.md) | ❌ tik repozitorijoje |
| `catalog.csv` | Pradiniai 13 gaminių importui į Google Sheets | ❌ tik repozitorijoje |
| `SETUP.md` | Katalogo ir užsakymų instrukcijos | ❌ tik repozitorijoje |

**Publikuojamas tik `public/` aplankas** (Azure „app location" = `public`).

## Diegimas į Azure Static Web Apps

Žiūrėkite `DEPLOY-AZURE.md` – ten visi žingsniai.

Trumpai:
1. Įkelti šį projektą į GitHub repozitoriją.
2. Azure Portal → *Create a resource* → **Static Web App**.
3. Prijungti GitHub repo; *App location* = `public`, *Api location* tuščia, *Output location* tuščia.
4. Azure pats sukuria GitHub Actions ir publikuoja. Vėliau kiekvienas `git push` atnaujina svetainę.
