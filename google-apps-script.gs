/**
 * Country Chef – katalogo tiekėjas IR admin backend (Google Sheets).
 *
 *  doGet  -> paskelbia lentelę „Products" kaip JSON (parduotuvei, per JSONP).
 *  doPost -> prideda / redaguoja / trina / paslepia gaminius (admin puslapiui).
 *            Apsaugota slaptažodžiu (ADMIN_TOKEN), saugomu serveryje.
 *
 * ĮDIEGIMAS (vienkartinis):
 *  1. Google Sheets: Extensions -> Apps Script. Ištrinkite viską, įklijuokite ŠĮ failą.
 *  2. Nustatykite admin slaptažodį:
 *       Project Settings (krumpliaratis) -> Script properties -> Add script property
 *       Property: ADMIN_TOKEN   Value: (sugalvokite stiprų slaptažodį)
 *     ARBA vieną kartą paleiskite funkciją setAdminToken() (žr. apačioje).
 *  3. Deploy -> New deployment -> Web app:
 *       Execute as: Me      Who has access: Anyone
 *  4. „Web app URL" (…/exec) įklijuokite į index.html (CATALOG_URL)
 *     ir į admin.html (nustatymuose arba API laukelyje).
 *
 * Pakeitę ŠĮ kodą: Deploy -> Manage deployments -> Edit -> Version: New version.
 */

var SHEET_NAME = 'Products';

/* ----------------------- READ (parduotuvė) ----------------------- */
function doGet(e) {
  var p = (e && e.parameter) || {};
  var out;
  try {
    var rows = readProducts().rows;
    // admin režimu (su teisingu token) grąžiname VISUS, įskaitant paslėptus (active=FALSE)
    var isAdmin = p.admin === '1' && auth(p.token);
    var products = isAdmin ? rows : rows.filter(function (x) {
      return String(x.active).toLowerCase() !== 'false';
    });
    out = JSON.stringify(isAdmin ? { ok: true, admin: true, products: products } : products);
  } catch (err) {
    out = JSON.stringify({ error: String(err) });
  }
  if (p.callback) {
    return ContentService.createTextOutput(p.callback + '(' + out + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(out)
    .setMimeType(ContentService.MimeType.JSON);
}

/* ----------------------- WRITE (admin) ----------------------- */
function doPost(e) {
  var p = (e && e.parameter) || {};
  if (!auth(p.token)) return json({ ok: false, error: 'bad token' });

  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    var values = sheet.getDataRange().getValues();
    var headers = values[0].map(function (h) { return String(h).trim(); });
    var idCol = headers.indexOf('id');

    if (p.action === 'add') {
      if (!p.id) return json({ ok: false, error: 'id required' });
      if (findRow(values, idCol, p.id) > -1) return json({ ok: false, error: 'id exists' });
      var row = headers.map(function (h) { return p[h] !== undefined ? p[h] : (h === 'active' ? 'TRUE' : ''); });
      sheet.appendRow(row);
      return json({ ok: true, action: 'add', id: p.id });

    } else if (p.action === 'update') {
      var r = findRow(values, idCol, p.id);
      if (r < 0) return json({ ok: false, error: 'not found' });
      headers.forEach(function (h, i) {
        if (h !== 'id' && p[h] !== undefined) sheet.getRange(r + 1, i + 1).setValue(p[h]);
      });
      return json({ ok: true, action: 'update', id: p.id });

    } else if (p.action === 'delete') {
      var rd = findRow(values, idCol, p.id);
      if (rd < 0) return json({ ok: false, error: 'not found' });
      sheet.deleteRow(rd + 1);
      return json({ ok: true, action: 'delete', id: p.id });

    } else if (p.action === 'toggle') {
      var rt = findRow(values, idCol, p.id);
      if (rt < 0) return json({ ok: false, error: 'not found' });
      var ac = headers.indexOf('active');
      var on = String(values[rt][ac]).toLowerCase() !== 'false';
      sheet.getRange(rt + 1, ac + 1).setValue(on ? 'FALSE' : 'TRUE');
      return json({ ok: true, action: 'toggle', id: p.id, active: !on });
    }
    return json({ ok: false, error: 'unknown action' });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

/* ----------------------- helpers ----------------------- */
function readProducts() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  var values = sheet.getDataRange().getValues();
  var headers = values.shift().map(function (h) { return String(h).trim(); });
  var rows = values.map(function (row) {
    var o = {}; headers.forEach(function (h, i) { o[h] = row[i]; }); return o;
  }).filter(function (p) { return p.id; });
  return { headers: headers, rows: rows };
}
function findRow(values, idCol, id) {
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][idCol]).trim() === String(id).trim()) return i;
  }
  return -1;
}
function auth(token) {
  var real = PropertiesService.getScriptProperties().getProperty('ADMIN_TOKEN') || '';
  return real !== '' && String(token) === real;
}
function json(o) {
  return ContentService.createTextOutput(JSON.stringify(o))
    .setMimeType(ContentService.MimeType.JSON);
}

/* Paleiskite vieną kartą, kad nustatytumėte slaptažodį (arba naudokite Script properties). */
function setAdminToken() {
  PropertiesService.getScriptProperties().setProperty('ADMIN_TOKEN', 'PAKEISKITE-SLAPTAZODI');
}
