Web page update check utility for Google Sheets
============
An utility to notify you of web page updates using Google Sheets with Google Apps Script.

Install
------------
1. Open a new sheet
2. Go to **Tools** -> **Script Editor**
3. Copy all `*.gs` files and `appsscript.json` into the editor
4. Save

It may require to authorize scripts to access your spreadsheet and do external URL requests.

Usage
------------
1. Open the sheet
2. Edit the sheet to fill web pages to check
3. Choose **Run** -> **Check sites now**

### Sheet format

| Title               | URI                                     | URI for checking (if any)    | Category  | HEAD | Start content | End content | Status | Last updated | Response | Last modified | Last checked | Hash |
|---------------------|-----------------------------------------|------------------------------|-----------|------|---------------|-------------|--------|--------------|----------|---------------|--------------|------|
| GitHub Blog         | https://github.com/blog                 | https://github.com/blog.atom | Blog      |      |               |             |        |              |          |               |              |      |
| A page of Wikipedia | https://en.wikipedia.org/wiki/Wikipedia |                              | Wikipedia | X    |               |             |        |              |          |               |              |      |
| ...                 | ...                                     | ...                          | ...       | ...  |               |             |        |              |          |               |              |      |

The first row must always be a header.

Cells on **"Title"** and **"Category"** columns are only for human.
You can use cells on these columns to identify the web page.

Cells on **"URI"** column are used for checking an update if the cell on **"URI for checking (if any)"** column is blank.
Otherwise a URI filled in the cell on "URI for checking (if any)" column is used.

It is useful if the URI for checking an update and the URI for browsing is different.
For instance, say there is a web page that retrieves its content by XHR.
In that case, you set a URI of web page into the cell on "URI" column and an XHR endpoint URI into the cell on "URI for checking (if any)" column.

If the cells on **"HEAD"** column are empty, this tool compares the whole contents of the page to find a change.
It sometimes interacts badly for dynamic pages (e.g. loading an advertisement tag, filling an actual server name into comment tag).

Instead of full content comparison, it can only check `Last-Modified` header value if the cell on "HEAD" column is `X`, or not blank.

If the cells on **"Start Content"** and/or **"End content"** column are set, this tool compares content from/to these strings.
It is useful for the dynamic pages which does not send `Last-Modified` header.

Cells on **"Status"**, **"Last updated"**, **"Last modified"**, **"Response"**, **"Last checked"** and **"Hash"** columns are automatically filled by the utility.
Once you run this utility, all cells on these columns will be filled.
Do not touch any cells on these columns.

"Last updated" column shows the date on which the page is updated.
"Last modified" column shows the date of `Last-modified` header (if any).
"Last checked" column shows the date on which the page is checked for update.

Tip
------------
Set a trigger to check an update automatically.

1. Open the sheet
2. Go to **Tools** -> **Script Editor**
3. Go to **Edit** -> **Current project's triggers**
4. Push **Add a new trigger** link
5. Fill `do_all` into the cell on "Run" column and set time-driven events as you like
6. A notification email will be sent to your email address if there are updates

