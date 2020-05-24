function mail_send() {
  console.log('Start mail_send()');

  const nl = "\r\n";

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const value = sheet.getDataRange().getValues();
  const tz = Session.getScriptTimeZone();

  let updated = [];
  let errors = [];
  for (let i = 1; i < value.length; i++) {
    let title = '';
    switch(value[i][COL.STATUS]) {
      case STATUS.UP:
        title = Utilities.formatString(
          '* %s %s',
          value[i][COL.TITLE],
          value[i][COL.LASTMOD] ? Utilities.formatDate(value[i][COL.LASTMOD], tz, ' (yyyy.M.d H:mm)') : ''
        );

        updated.push([title, value[i][COL.URI]].join(nl));
        break;
      case STATUS.ERROR:
        title = Utilities.formatString(
          '* [%s] %s',
          value[i][COL.RESPONSE],
          value[i][COL.TITLE]
        );

        errors.push([title, value[i][COL.URI]].join(nl));
        break;
    }
  }


  let body = [];
  if (updated.length > 0) {
    body = [...body, '<< Updated >>', ...updated];
  }
  if (errors.length > 0) {
    body = [...body, '<< Error >>', ...errors];
  }

  if (body.length > 0) {
    let mailto = Session.getActiveUser().getEmail();
    console.log('Sending a mail to: %s', mailto);

    MailApp.sendEmail(
      mailto,
      Utilities.formatString(
        'Notification: %s (%s)',
        SpreadsheetApp.getActiveSpreadsheet().getName(),
        Utilities.formatDate(new Date(), tz, 'yyyy.M.d')
      ),
      body.join(nl.repeat(2))
    );
  }

  console.log('Finish mail_send()');
};
