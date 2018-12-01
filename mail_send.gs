function mail_send() {
  console.log('Start mail_send()');

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var value = sheet.getDataRange().getValues();

  var updated = '';
  var errors = '';
  for (var i = 1; i < value.length; i++) {
    switch(value[i][COL.STATUS]) {
      case STATUS.UP:
        updated += Utilities.formatString('* %s', value[i][COL.TITLE]) + (value[i][COL.LASTMOD] ? Utilities.formatDate(value[i][COL.LASTMOD], 'JST', ' (yyyy.M.d H:mm)') : '') + "\r\n";
        updated += value[i][COL.URI] + "\r\n\r\n";
        break;
      case STATUS.ERROR:
        errors  += Utilities.formatString('* [%s] %s', value[i][COL.RESPONSE], value[i][COL.TITLE]) + "\r\n";
        errors  += value[i][COL.URI] + "\r\n\r\n";
        break;
    }
  }


  var body = '';
  if (updated.length > 0) {
    body += "<< Updated >>\r\n\r\n" + updated;
  }
  if (errors.length > 0) {
    body += "<< Error >>\r\n\r\n" + errors;
  }

  if (body.length > 0) {
    var mailto = Session.getActiveUser().getEmail();
    console.log('Sending mail to: %s', mailto);
    MailApp.sendEmail(mailto, Utilities.formatString('Notification: %s (%s)', SpreadsheetApp.getActiveSpreadsheet().getName(), Utilities.formatDate(new Date(), 'JST', 'yyyy.M.d')), body.trim());
  }

  console.log('Finish mail_send()');
};
