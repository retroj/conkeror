// customizable behavior
var shortName = "conkeror";
var longName = "Conkeror 0.14";
var installMessage = "You will need to restart you browser to use Conkeror.";
var gVersion = "0.14";
var srDest = 3;

// this function verifies disk space in kilobytes
function verifyDiskSpace(dirPath, spaceRequired)
{
  var spaceAvailable;

  // Get the available disk space on the given path
  spaceAvailable = fileGetDiskSpaceAvailable(dirPath);

  // Convert the available disk space into kilobytes
  spaceAvailable = parseInt(spaceAvailable / 1024);

  // do the verification
  if (spaceAvailable < spaceRequired)
  {
    logComment("Insufficient disk space: " + dirPath);
    logComment("  required : " + spaceRequired + " K");
    logComment("  available: " + spaceAvailable + " K");
    return false;
  }

  return true;
}

// main code block
var err = initInstall(longName, shortName, gVersion);
logComment("initInstall: " + err);

var fProgram = getFolder("Program");
var fChrome = getFolder("Chrome");

if (verifyDiskSpace(fProgram, srDest))
{
  err = addDirectory("", gVersion, shortName, fChrome, shortName, true);
  logComment("addDirectory: " + err);

  registerChrome(CONTENT | DELAYED_CHROME, getFolder(fChrome, shortName), "content/");

  if (getLastError() == SUCCESS)
  {
    err = performInstall(); 
    logComment("performInstall: " + err);
    alert(installMessage);
  }
  else
  {
    cancelInstall(err);
  }
}
// end main
