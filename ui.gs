// Add menu to Spreadsheet UI
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Run')
    .addItem('Check sites now', 'check_update')
    .addItem('Send mail now', 'mail_send')
    .addToUi();
}
