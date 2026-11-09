const retry = 3;
const timeout = 6;

// Trailing underscore makes this function private in Apps Script
function fetch_all_with_retry_(targets) {
  // targets: [{ i, uri }]  -> responses: { [i]: HTTPResponse|null }
  const responses = {};
  let pending = targets;

  for (let j = 1; pending.length > 0; j++) {
    console.info('Fetching (Try: %d) for %d URL(s)', j, pending.length);

    const requests = pending.map(t => ({ url: t.uri, muteHttpExceptions: true, timeoutSeconds: timeout }));
    let results;
    try {
      results = UrlFetchApp.fetchAll(requests);
    }
    catch (e) {
      // fetchAll throws for the whole batch if any single request is invalid
      console.warn('fetchAll failed; falling back to fetch(): %s', e.message);
      results = requests.map(r => {
        try {
          console.log('fetch(): %s', r.url);
          return UrlFetchApp.fetch(r.url, r);
        }
        catch (e2) {
          console.warn('%s: %s', r.url, e2.message);
          return null;
        }
      });
    }

    const failed = [];
    pending.forEach((t, k) => {
      const res = results[k];
      responses[t.i] = res;

      if (res) {
        console.log('Fetched with status code %s: %s', res.getResponseCode(), t.uri);
        if (res.getResponseCode() === 200) return;
      }
      else {
        console.warn('Fetch failed with empty response: %s', t.uri);
      }
      failed.push(t);
    });

    if (failed.length === 0 || j >= retry) break;

    console.log('Waiting for retry...');
    Utilities.sleep(3*1000);
    pending = failed;
  }

  return responses;
}

function check_update() {
  console.info('Start check_update()');

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const range = sheet.getDataRange();
  const value = range.getValues();

  const prevs = {};
  const targets = [];

  for (let i = 1; i < value.length; i++) {
    const uri = value[i][COL.URICHK] || value[i][COL.URI];
    if (!/^https?:/.test(uri)) {
      console.warn('Invalid URI on line %d: %s (%s)', i, value[i][COL.TITLE], uri);
      value[i][COL.STATUS] = STATUS.ERROR;
      continue;
    }

    prevs[i] = value[i].concat([]); // Copy the row

    value[i][COL.STATUS]   = STATUS.NOCHG;
    value[i][COL.RESPONSE] = 'null';

    targets.push({ i: i, uri: uri });
  }

  const responses = fetch_all_with_retry_(targets);

  for (const { i, uri } of targets) {
    const prev = prevs[i];
    const response = responses[i];

    console.log('>> %d) %s', i, value[i][COL.TITLE]);
    value[i][COL.LASTCHK] = new Date();

    if (!response) {
      console.error('Empty response from %s', uri);
      value[i][COL.STATUS] = STATUS.ERROR;
      continue;
    }

    const code = response.getResponseCode().toString();
    value[i][COL.RESPONSE] = code;

    if (code !== '200') {
      value[i][COL.STATUS] = STATUS.ERROR;
      continue;
    }

    let lastmod = response.getHeaders()['Last-Modified'];
    if (lastmod) {
      lastmod = new Date(lastmod.trim());
      if (isNaN(lastmod.getTime())) {
        console.warn('Invalid Last-Modified header "%s": %s', lastmod, uri);
        lastmod = null;
      }
      else {
        value[i][COL.LASTMOD] = lastmod;
      }
    }

    let html = response.getContentText();
    if (value[i][COL.BODY_START] || value[i][COL.BODY_END]) {
      // Enable this logic if and only if BODY_START and BODY_END columns are set.
      // HTML source code will be manipulated in this logic, but there is no guarantee that the source text is
      // encoded correctly, i.e. there is a possibility of parsing garbled (mojibake) text.
      // However, it has a check to confirm that the specified keyword is present in the original source code.
      // It will raise an error if the text is garbled, and the user can identify the cause as text encoding.

      let poshead = html.toLowerCase().indexOf('</head>');
      if (poshead > 0) {
        html = html.substring(poshead); // '</head>' tag will be removed in the next replace step
      }

      // All contents will be replaced with " " (whitespace) to avoid merging adjacent words
      html = html
        .replace(/<(script|style)\b.*?<\/\1>/gis, ' ') // Remove script/style tags and their contents
        .replace(/<.*?>/gs, ' ');  // Remove tags

      let posstart = 0;
      let posend   = 0;
      if (value[i][COL.BODY_START]) {
        posstart = html.indexOf(value[i][COL.BODY_START]);
        console.log('String "%s" found at index %d for starting position', value[i][COL.BODY_START], posstart);
      }
      if (value[i][COL.BODY_END]) {
        posend = html.indexOf(value[i][COL.BODY_END], posstart);
        console.log('String "%s" found at index %d for ending position', value[i][COL.BODY_END], posend);
      }

      if (posstart < 0 || posend < 0) {
        console.error('Start and/or end string is specified but it is not found in HTML body: %s', uri);
        console.log(html);

        value[i][COL.STATUS] = STATUS.ERROR;
        continue;
      }
      if (posstart > 0 || posend > 0) {
        posstart += value[i][COL.BODY_START].length;
        html = (posend === 0) ? html.slice(posstart) : html.slice(posstart, posend);
        html = html.replace(/\s+/g, ''); // Remove all whitespace for canonicalization

        console.log(html);
      }
    }

    const hash = Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, html));
    value[i][COL.HASH] = hash;

    if (value[i][COL.HEAD_ONLY] && lastmod) {
      console.log('Check by HTTP Header (Last-Modified)');
      if (!(prev[COL.LASTMOD] instanceof Date) || (prev[COL.LASTMOD].getTime() !== lastmod.getTime())) {
        value[i][COL.STATUS]  = STATUS.UP;
        value[i][COL.LASTUPD] = value[i][COL.LASTCHK];
      }
      continue; // Skip check by content
    }

    console.log('Check by content');
    if (prev[COL.HASH] !== hash) {
      value[i][COL.STATUS]  = STATUS.UP;
      value[i][COL.LASTUPD] = value[i][COL.LASTCHK];
    }
  }

  range.setValues(value);

  console.info('Finished check_update()');
}
