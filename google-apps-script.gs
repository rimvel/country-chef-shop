/**
 * Country Chef – katalogas + admin backend + nuotraukų įkėlimas (Google Sheets + Drive).
 *
 *  doGet :
 *     - (parduotuvė)  ?callback=..            -> aktyvūs gaminiai (JSON/JSONP)
 *     - (admin sąrašas) ?admin=1&token=..      -> visi gaminiai, įskaitant paslėptus
 *     - (įkėlimo rezultatas) ?uploadResult=ID&token=.. -> įkeltos nuotraukos URL
 *  doPost (su token):
 *     - action=add | update | delete | toggle  -> gaminių tvarkymas
 *     - action=upload                          -> nuotrauka į Drive, grąžina URL
 *
 * ĮDIEGIMAS / ATNAUJINIMAS:
 *  1. Įklijuokite šį kodą į Apps Script (Extensions -> Apps Script), išsaugokite.
 *  2. Nustatykite slaptažodį: Project Settings -> Script properties ->
 *     Property: ADMIN_TOKEN   Value: (jūsų slaptažodis)
 *  3. SVARBU (nuotraukoms): kartą paleiskite funkciją `authorize` (viršuje pasirinkite
 *     authorize -> Run) ir patvirtinkite Google Drive leidimą.
 *  4. Deploy -> Manage deployments -> Edit (pieštukas) -> Version: New version -> Deploy.
 *     (Web app URL nesikeičia.)  Execute as: Me   Who has access: Anyone
 */

var SHEET_NAME = 'Products';
var PHOTO_FOLDER = 'Country Chef nuotraukos';

/* ===================== READ ===================== */
function doGet(e) {
  var p = (e && e.parameter) || {};

  // Nuotraukos įkėlimo rezultatas (admin polina, kol Drive baigia)
  if (p.uploadResult) {
    if (!auth(p.token)) return reply(p, { ok: false, error: 'bad token' });
    var cached = CacheService.getScriptCache().get('up_' + p.uploadResult);
    return reply(p, cached ? JSON.parse(cached) : { ok: false, pending: true });
  }

  try {
    var rows = readProducts().rows;
    var isAdmin = p.admin === '1' && auth(p.token);
    if (isAdmin) return reply(p, { ok: true, admin: true, products: rows });
    var active = rows.filter(function (x) { return String(x.active).toLowerCase() !== 'false'; });
    return reply(p, active); // parduotuvė tikisi gryno masyvo
  } catch (err) {
    return reply(p, { error: String(err) });
  }
}

/* ===================== WRITE ===================== */
function doPost(e) {
  var p = (e && e.parameter) || {};
  if (!auth(p.token)) return json({ ok: false, error: 'bad token' });

  // ---- Nuotraukos įkėlimas į Drive ----
  if (p.action === 'upload') {
    try {
      var folder = getPhotoFolder();
      var bytes = Utilities.base64Decode(p.data);
      var blob = Utilities.newBlob(bytes, p.mime || 'image/jpeg', p.filename || ('img-' + Date.now() + '.jpg'));
      var file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      var url = 'https://drive.google.com/thumbnail?id=' + file.getId() + '&sz=w1000';
      var okRes = { ok: true, url: url, id: file.getId() };
      if (p.uploadId) CacheService.getScriptCache().put('up_' + p.uploadId, JSON.stringify(okRes), 600);
      return json(okRes);
    } catch (err) {
      var errRes = { ok: false, error: String(err) };
      if (p.uploadId) CacheService.getScriptCache().put('up_' + p.uploadId, JSON.stringify(errRes), 600);
      return json(errRes);
    }
  }

  // ---- Gaminių tvarkymas ----
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

/* ===================== helpers ===================== */
function readProducts() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  var values = sheet.getDataRange().getValues();
  var headers = values.shift().map(function (h) { return String(h).trim(); });
  var rows = values.map(function (row) {
    var o = {}; headers.forEach(function (h, i) { o[h] = row[i]; }); return o;
  }).filter(function (x) { return x.id; });
  return { headers: headers, rows: rows };
}
function getPhotoFolder() {
  var it = DriveApp.getFoldersByName(PHOTO_FOLDER);
  return it.hasNext() ? it.next() : DriveApp.createFolder(PHOTO_FOLDER);
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
function reply(p, obj) {
  var out = JSON.stringify(obj);
  if (p.callback) {
    return ContentService.createTextOutput(p.callback + '(' + out + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(out).setMimeType(ContentService.MimeType.JSON);
}
function json(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

/* Paleiskite VIENĄ KARTĄ – kad suteiktumėte Drive leidimą nuotraukoms. */
function authorize() {
  getPhotoFolder();
  Logger.log('Drive leidimas suteiktas. Folder OK.');
}

/* (Nebūtina) slaptažodį galima nustatyti ir čia, paleidus vieną kartą. */
function setAdminToken() {
  PropertiesService.getScriptProperties().setProperty('ADMIN_TOKEN', 'PAKEISKITE-SLAPTAZODI');
}
