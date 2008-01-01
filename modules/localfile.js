
//////////// Stolen from venkman

const PERM_IWOTH = 00002;  /* write permission, others */
const PERM_IWGRP = 00020;  /* write permission, group */

const MODE_RDONLY   = 0x01;
const MODE_WRONLY   = 0x02;
const MODE_RDWR     = 0x04;
const MODE_CREATE   = 0x08;
const MODE_APPEND   = 0x10;
const MODE_TRUNCATE = 0x20;
const MODE_SYNC     = 0x40;
const MODE_EXCL     = 0x80;


// XXX: is is necessary to fully qualify fopen as conkeror.fopen?
//
function fopen(path, mode, perms, tmp)
{
    return new LocalFile(path, mode, perms, tmp);
}

function LocalFile(file, mode, perms, tmp)
{
    const classes = Components.classes;
    const interfaces = Components.interfaces;

    const LOCALFILE_CTRID = "@mozilla.org/file/local;1";
    const FILEIN_CTRID = "@mozilla.org/network/file-input-stream;1";
    const FILEOUT_CTRID = "@mozilla.org/network/file-output-stream;1";
    const SCRIPTSTREAM_CTRID = "@mozilla.org/scriptableinputstream;1";

    const nsIFile = interfaces.nsIFile;
    const nsILocalFile = interfaces.nsILocalFile;
    const nsIFileOutputStream = interfaces.nsIFileOutputStream;
    const nsIFileInputStream = interfaces.nsIFileInputStream;
    const nsIScriptableInputStream = interfaces.nsIScriptableInputStream;

    if (typeof perms == "undefined")
        perms = 0666 & ~(PERM_IWOTH | PERM_IWGRP);

    if (typeof mode == "string")
    {
        switch (mode)
        {
            case ">":
                mode = MODE_WRONLY | MODE_CREATE | MODE_TRUNCATE;
                break;
            case ">>":
                mode = MODE_WRONLY | MODE_CREATE | MODE_APPEND;
                break;
            case "<":
                mode = MODE_RDONLY;
                break;
            default:
                throw "Invalid mode ``" + mode + "''";
        }
    }

    if (typeof file == "string")
    {
        this.localFile = classes[LOCALFILE_CTRID].createInstance(nsILocalFile);
        this.localFile.initWithPath(file);
    }
    else if (file instanceof nsILocalFile)
    {
        this.localFile = file;
    }
    else
    {
        throw "bad type for argument |file|.";
    }

    this.path = this.localFile.path;

    if (mode & (MODE_WRONLY | MODE_RDWR))
    {
        this.outputStream =
            classes[FILEOUT_CTRID].createInstance(nsIFileOutputStream);
        this.outputStream.init(this.localFile, mode, perms, 0);
    }

    if (mode & (MODE_RDONLY | MODE_RDWR))
    {
        var is = classes[FILEIN_CTRID].createInstance(nsIFileInputStream);
        is.init(this.localFile, mode, perms, tmp);
        this.inputStream =
            classes[SCRIPTSTREAM_CTRID].createInstance(nsIScriptableInputStream);
        this.inputStream.init(is);
    }
}


LocalFile.prototype.write = function(buf)
{
    if (!("outputStream" in this))
        throw "file not open for writing.";

    return this.outputStream.write(buf, buf.length);
}

LocalFile.prototype.read = function(max)
{
    if (!("inputStream" in this))
        throw "file not open for reading.";

    var av = this.inputStream.available();
    if (typeof max == "undefined")
        max = av;

    if (!av)
        return null;

    var rv = this.inputStream.read(max);
    return rv;
}

LocalFile.prototype.close = function()
{
    if ("outputStream" in this)
        this.outputStream.close();
    if ("inputStream" in this)
        this.inputStream.close();
}

LocalFile.prototype.flush = function()
{
    return this.outputStream.flush();
}



// file is either a full pathname or an instance of file instanceof nsILocalFile
// reads a file in "text" mode and returns the string
function read_text_file(file, charset)
{
    var ifstream = Cc["@mozilla.org/network/file-input-stream;1"].createInstance(Ci.nsIFileInputStream);
    var icstream = Cc["@mozilla.org/intl/converter-input-stream;1"].createInstance(Ci.nsIConverterInputStream);

    charset = charset || "UTF-8";
/*
    if (typeof file == "string")
        file = this.getFile(file);
    else if (!(file instanceof Components.interfaces.nsILocalFile))
        throw Components.results.NS_ERROR_INVALID_ARG; // FIXME: does not work as expected, just shows undefined: undefined
*/

    ifstream.init(file, -1, 0, 0);
    const replacementChar = Ci.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER;
    icstream.init(ifstream, charset, 4096, replacementChar); // 4096 bytes buffering

    var buffer = "";
    var str = {};
    while (icstream.readString(4096, str) != 0)
        buffer += str.value;

    icstream.close();
    ifstream.close();

    return buffer;
}

// file is either a full pathname or an instance of file instanceof nsILocalFile
// default permission = 0644, only used when creating a new file, does not change permissions if the file exists
// mode can be ">" or ">>" in addition to the normal MODE_* flags
define_keywords("$mode", "$perms", "$charset");
function write_text_file(file, buf)
{
    keywords(arguments, $charset = "UTF-8", $perms = 0644);

    var ofstream = Cc["@mozilla.org/network/file-output-stream;1"].createInstance(Ci.nsIFileOutputStream);
    var ocstream = Cc["@mozilla.org/intl/converter-output-stream;1"].createInstance(Ci.nsIConverterOutputStream);

/*
    if (typeof file == "string")
        file = this.getFile(file);
    else if (!(file instanceof Components.interfaces.nsILocalFile))
        throw Components.results.NS_ERROR_INVALID_ARG; // FIXME: does not work as expected, just shows undefined: undefined
*/

    var mode = arguments.$mode;

    if (mode == ">>")
        mode = MODE_WRONLY | MODE_CREATE | MODE_APPEND;
    else if (!mode || mode == ">")
        mode = MODE_WRONLY | MODE_CREATE | MODE_TRUNCATE;

    ofstream.init(file, mode, arguments.$perms, 0);
    ocstream.init(ofstream, arguments.$charset, 0, 0x0000);
    ocstream.writeString(buf);

    ocstream.close();
    ofstream.close();
}
