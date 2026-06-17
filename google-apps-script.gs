/**
 * Country Chef – katalogo tiekėjas (Google Sheets -> JSON).
 *
 * Paskirtis: paskelbia lentelės „Products" eilutes kaip JSON,
 * kurį parduotuvės puslapis (index.html) užsikrauna per JSONP.
 *
 * ĮDIEGIMAS (vienkartinis):
 *  1. Google Sheets lentelėje: Extensions -> Apps Script.
 *  2. Ištrinkite viską ir įklijuokite ŠĮ failą.
 *  3. Deploy -> New deployment -> Type: Web app.
 *       - Execute as: Me
 *       - Who has access: Anyone
 *  4. Nukopijuokite „Web app URL" (…/exec) ir įklijuokite
 *     index.html faile į CATALOG_URL.
 *
 * Pakeitę lentelę – nieko iš naujo diegti NEREIKIA. Tiesiog
 * redaguojate eilutes; puslapis pamatys pakeitimus iškart.
 * (Jei keisite ŠĮ kodą – Deploy -> Manage deployments -> Edit -> New version.)
 */

var SHEET_NAME = 'Products';

function doGet(e) {
  var out;
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    var values = sheet.getDataRange().getValues();
    var headers = values.shift().map(function (h) { return String(h).trim(); });

    var products = values.map(function (row) {
      var obj = {};
      headers.forEach(function (h, i) { obj[h] = row[i]; });
      return obj;
    }).filter(function (p) {
      // Tik eilutės su id ir ne „active = FALSE"
      return p.id && String(p.active).toLowerCase() !== 'false';
    });

    out = JSON.stringify(products);
  } catch (err) {
    out = JSON.stringify({ error: String(err) });
  }

  // JSONP, jei perduotas ?callback=... (apeina CORS). Kitaip – grynas JSON.
  var cb = e && e.parameter && e.parameter.callback;
  if (cb) {
    return ContentService
      .createTextOutput(cb + '(' + out + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(out)
    .setMimeType(ContentService.MimeType.JSON);
}
