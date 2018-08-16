function mail_send() {
  Logger.log('Start mail_send...');

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var value = sheet.getDataRange().getValues();

  var updated = '';
  var errors = '';
  for (var i = 1; i < value.length; i++) {
    switch(value[i][COL.STATUS]) {
      case STATUS.UP:
        updated += '* ' + value[i][COL.TITLE] + (value[i][COL.LASTMOD] ? ' (' + Utilities.formatDate(value[i][COL.LASTMOD], 'JST', 'yyyy/MM/dd HH:mm:ss') + ')' : '') + "\r\n";
        updated += value[i][COL.URI] + "\r\n\r\n";
        break;
      case STATUS.ERROR:
        errors  += '* [' + value[i][COL.RESPONSE] + '] ' + value[i][COL.TITLE] + "\r\n";
        errors  += value[i][COL.URI] + "\r\n\r\n";
        break;
    }
  }


  var body = 'Updated: ';
  body += (updated.length > 0) ? "\r\n" + updated : "n/a\r\n\r\n";

  if (errors.length > 0) {
    body += "Error:\r\n" + errors;
  }

  var mailto = Session.getActiveUser().getEmail();
  MailApp.sendEmail(mailto, 'Notification: ' + SpreadsheetApp.getActiveSpreadsheet().getName(), body.trim());
  Logger.log('Mail sent to: %s', mailto);

  Logger.log('Finish mail_send');
};
