var STATUS = {
  ERROR: 'Error',
  UP:    'Updated',
  NOCHG: 'No change'
};

var COL = {
  TITLE:     0, // Title of the site
  URI:       1, // URI
  URICHK:    2, // URI to be check (if any)
  CATEGORY:  3, // Category
  HEAD_ONLY: 4, // Skip the check by content hash

  STATUS:    5, // Status
  LASTMOD:   6, // Last modified
  RESPONSE:  7, // Response code
  LASTCHK:   8, // Last checked

  HASH:      9  // Last hash for page content
};


function do_all() {
  check_update();
  mail_send();
}
