const STATUS = {
  ERROR: 'Error',
  UP:    'Updated',
  NOCHG: 'No change'
};

const COL = {
  TITLE:      0, // Title of the site
  URI:        1, // URI
  URICHK:     2, // URI to be check (if any)
  CATEGORY:   3, // Category
  HEAD_ONLY:  4, // Skip the check by content hash
  BODY_START: 5, // Content area starts with this string
  BODY_END:   6, // Content area ends with this string

  STATUS:     7, // Status
  LASTMOD:    8, // Last modified
  RESPONSE:   9, // Response code
  LASTCHK:   10, // Last checked

  HASH:      11  // Last hash for page content
};


function do_all() {
  check_update();
  mail_send();
}
