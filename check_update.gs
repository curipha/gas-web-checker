function check_update() {
  Logger.log('Start check_update...');

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var range = sheet.getDataRange();
  var value = range.getValues();

  for (var i = 1; i < value.length; i++) {
    var uri = value[i][COL.URICHK] || value[i][COL.URI];

    Logger.log('>> Row %s : %s', i.toString(), uri);

    if (! /^https?:/.test(uri)) {
      Logger.log('[SKIP] Not a valid URI');
      continue;
    }


    var prev = value[i].concat([]); // Copy object

    value[i][COL.STATUS]   = STATUS.NOCHG;
    value[i][COL.LASTMOD]  = '';
    value[i][COL.RESPONSE] = 'null';
    value[i][COL.LASTCHK]  = new Date();
    value[i][COL.HASH]     = '';


    var response = UrlFetchApp.fetch(uri, { muteHttpExceptions: true });
    if (!response) {
      Logger.log('[ERROR] URI fetch failed');
      value[i][COL.STATUS] = STATUS.ERROR;
      continue;
    }

    var code = response.getResponseCode().toString();
    Logger.log('[INFO] HTTP responce with code: %s', code);
    value[i][COL.RESPONSE] = code;

    if (code !== '200') {
      value[i][COL.STATUS] = STATUS.ERROR;
      continue;
    }


    var lastmod = response.getHeaders()['Last-Modified'];
    if (lastmod) {
      lastmod = new Date(lastmod.trim());
      value[i][COL.LASTMOD] = lastmod;
    }

    var hash = Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, response.getContentText()));
    value[i][COL.HASH] = hash;


    if (value[i][COL.HEAD_ONLY] && lastmod) {
      Logger.log('[INFO] Check by HTTP Header (Last-Modified)');
      if (!prev[COL.LASTMOD] || (prev[COL.LASTMOD].getTime() !== lastmod.getTime())) {
        value[i][COL.STATUS] = STATUS.UP;
      }
      continue; // Skip check by content
    }

    Logger.log('[INFO] Check by content');
    if (prev[COL.HASH] !== hash) {
      value[i][COL.STATUS] = STATUS.UP;
    }
  }

  range.setValues(value);

  Logger.log('Finish check_update');
};

