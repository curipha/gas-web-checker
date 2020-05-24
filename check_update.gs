const retry = 3;

function check_update() {
  console.log('Start check_update()');

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const range = sheet.getDataRange();
  const value = range.getValues();

  for (let i = 1; i < value.length; i++) {
    let uri = value[i][COL.URICHK] || value[i][COL.URI];

    console.log('>> %s) %s', i.toString(), uri);

    if (! /^https?:/.test(uri)) {
      console.warn('Not a valid URI: %s', uri);
      continue;
    }


    let prev = value[i].concat([]); // Copy object

    value[i][COL.STATUS]   = STATUS.NOCHG;
    value[i][COL.LASTMOD]  = '';
    value[i][COL.RESPONSE] = 'null';
    value[i][COL.HASH]     = '';

    let response = null;
    let code = '';
    for (let j = 1;; j++) {
      console.info('Fetching (Try: %s) for %s', j.toString(), uri);

      try {
        response = UrlFetchApp.fetch(uri, { muteHttpExceptions: true });

        if (response) {
          code = response.getResponseCode().toString();
          console.info('Fetched with status code: %s', code);

          if (code === '200') {
            break;
          }
        }
        else {
          console.warn('Fetch failed with empty response');
        }
      }
      catch (e) {
        console.warn(e.message)
      }

      if (j >= retry) {
        break;
      }

      console.log('Waiting for retry...');
      Utilities.sleep(3*1000);
    }


    value[i][COL.LASTCHK] = new Date();

    if (!response) {
      console.error('Empty response from %s', uri);
      value[i][COL.STATUS] = STATUS.ERROR;
      continue;
    }


    value[i][COL.RESPONSE] = code;

    if (code !== '200') {
      value[i][COL.STATUS] = STATUS.ERROR;
      continue;
    }


    let lastmod = response.getHeaders()['Last-Modified'];
    if (lastmod) {
      lastmod = new Date(lastmod.trim());
      value[i][COL.LASTMOD] = lastmod;
    }


    let html = response.getContentText();

    if (value[i][COL.BODY_START] || value[i][COL.BODY_END]) {
      // Enable this logic if and only if these columns are set.
      // HTML source code will be manipulated in this logic, but there is no guarantee that the source text is
      // encoded correctly, i.e. there is a possibility that it attempts to parse a garbled (mojibake) text.
      // It has a check logic that the specified keyword is in the original source code. If the text is garbled,
      // it is very likely that it will raise an error.
      // Thanks to this logic, a user can find the failure due to the text encoding.

      let poshead = html.toLowerCase().indexOf('</head>');
      if (poshead > 0) {
        html = html.substring(poshead); // '</head>' tag will be removed in next replace
      }
      html = html
        .replace(/[\n\r]/g, ' ') // Remove newline (Google Apps Script does not accept 's' flag in RegExp)
        .replace(/<(script|style)\b.*?<\/\1>/gi, '') // Remove script|style tag and its text node
        .replace(/<.*?>/g, '')   // Remove tags
        .replace(/\s+/g, ' ');   // Remove extra whitespaces

      let posstart = 0;
      let posend   = 0;
      if (value[i][COL.BODY_START]) {
        posstart = html.indexOf(value[i][COL.BODY_START]);
        console.log('String "%s" found at index %s for starting position', value[i][COL.BODY_START], posstart.toString());
      }
      if (value[i][COL.BODY_END]) {
        posend = html.indexOf(value[i][COL.BODY_END], posstart);
        console.log('String "%s" found at index %s for ending position', value[i][COL.BODY_END], posend.toString());
      }

      if (posstart < 0 || posend < 0) {
        console.error('Start and/or end string is specified but it is not found in HTML body', uri);
        value[i][COL.STATUS] = STATUS.ERROR;
        continue;
      }
      if (posstart > 0 || posend > 0) {
        posstart += value[i][COL.BODY_START].length;
        html = (posend == 0) ? html.slice(posstart) : html.slice(posstart, posend);
      }
    }

    let hash = Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, html));
    value[i][COL.HASH] = hash;


    if (value[i][COL.HEAD_ONLY] && lastmod) {
      console.log('Check by HTTP Header (Last-Modified)');
      if (!prev[COL.LASTMOD] || (prev[COL.LASTMOD].getTime() !== lastmod.getTime())) {
        value[i][COL.STATUS] = STATUS.UP;
      }
      continue; // Skip check by content
    }

    console.log('Check by content');
    if (prev[COL.HASH] !== hash) {
      value[i][COL.STATUS] = STATUS.UP;
    }
  }

  range.setValues(value);

  console.log('Finish check_update()');
};
