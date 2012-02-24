# Chronicle API #

## Prerequisites ##

*    [cradle](https://github.com/cloudhead/cradle)
*    [nimble](http://caolan.github.com/nimble/)
*    [CouchDB](http://couchdb.apache.org/)

## Managing Documents ##

### Adding a Document ###

    api.add_document(fields, title, callback);
    
*    `object` *fields*: fields to add
    *    `string` type: (article, blogpost, etc.)
    *    `array` path: taxonomy path (`["articles", "sports", "basketball"]`)
    *    `string` body
    *    `array` authors
    *    etc...
*    `string` *title* is required to make the URL which is automagically created
*    *callback* is called with three parameters, error, response from CouchDB, and the URL that was created.

### Editing a Document ###

    api.edit_document(docid, fields, callback);
    
*    `string` *id*: id of the desired document
*    `object` *fields*: fields you want to modify. Fields you don't include won't be changed
*    *callback* is called with three parameters, error, response from CouchDB, and the URL.

Note: if you edit the title, a new URL will be added. Each document has an array of URLs in the `urls` field. The most recent one is at the end of the array.

Also, if you include a bins property in *fields*, the ultra-complicated bins architecture will be updated correctly.

### Getting a Document ###

    api.get_document_by_id(id, callback);
    
*    `string` *id*: id of the desired document
*    *callback* is called with two parameters, error and response (response from CouchDB)

### Getting Documents by an Author ###

    api.get_documents_by_author(author, callback);

*    `string` *author*: author to query
*    *callback* is called with two parameters, error and response from CouchDB with the IDs of the documents

### Getting All Documents by Date ###
    
    api.all_docs_by_date(callback);

*    *callback* is called with two parameters, error and an array of documents

## Taxonomy ##

### Adding a Node ###

    api.add_node(parent_path, name, callback);
    
*    `array` *parent_path*: path of the desired parent
*    `string` *name*: name of the new node
*    *callback* is called with two parameters, error and response (response from CouchDB)

### Getting the Taxonomy Tree ###

    api.get_taxonomy_tree(callback)

*    *callback* is called with two paramesters, error and a tree of objects representing the taxonomy

### Getting Documents Under a Node ###

    api.taxonomy.docs(taxonomyPath, limit, startkey_docid, callback);
    
*   `array` *taxonomyPath*: fetch docs under given taxonomy path ex. `["News"] or ["Sports"]`
*    `int` *limit*: limit number of documents to return
*    `string` *starkey_docid*: first document to return (pagination purposes).
*    *callback* is called with two parameters, error and response (response from CouchDB)

Note: this recursively walks the tree so passing `"Sports"` will also return documents from `["Sports", "Basketball"]`

## Bins ##

### Creating Bins ###

    api.bin.create(bin, callback);

*    `string` *bin*: name of the bin to add
*    *callback* is called with two parameters, error and response (response from CouchDB)

### Getting the List of All Bins ###

    api.bin.list(callback);

*    *callback* is called with two parameters, error and an array of strings representing the bins

### Adding a Document to Bins ###

    api.bin.add(docid, bins, callback);

*    `string` *docid*: id of the desired document
*    `array` *bins*: array of bin names to add this document to
*    *callback* is called with two parameters, error and response (response from CouchDB)

Note: this function will send an error if the document is already in that bin.

### Removing a Document from Bins ###

    api.bin.remove(docid, bins, callback);

*    `string` *docid*: id of the desired document
*    `array` *bins*: array of bin names
*    *callback* is called with two parameters, error and response (response from CouchDB)

Note: this function will send an error if the document is not in this bin

### Getting Documents in Bins ###

    api.bin.get_documents(bins, callback);

*    `array` *bins*: array of bins to search in
*    *callback* is called with two parameters, error and response of form: `{bin1: [{title: ...}, ...], bin2: [...]}`

## URLs ##

### Getting the Map of URLs ###

    api.list_urls(callback);

*    *callback* is called with two parameters, error and an array with mappings from URLs to document IDs

### Getting a Document by URL ###

    api.doc_for_url(url, callback);

*    `string` *url* the URL to query
*    *callback* is called with two parameters, error and the document
    
