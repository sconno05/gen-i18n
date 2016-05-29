#! /usr/bin/env node

var fs = require('fs');
var slug = require('slug');
var argv = require('yargs').argv;
var i18nStringsFiles = require('i18n-strings-files');

var sourceFile = argv._[0];
var destinationFile = argv._[1];
var destinationFileFormat = destinationFile.substring(destinationFile.lastIndexOf('.') + 1);
var append = argv.append;

console.log("Reading from " + sourceFile);

var strings = fs.readFileSync(sourceFile).toString().split("\n");

var existingStrings;
if(append && fs.existsSync(destinationFile)) {
  console.log("Existing file will be appended to")
  existingStrings = _readStrings(destinationFile);
}

console.log("Generating keys for " + strings.length + " strings");

var keyedStrings = {};

strings.forEach(function(str) {
  if(!str.length) return;
  if(existingStrings && existingStrings.indexOf(str) >= 0) return; // String already exists, skip it

  keyedStrings[slug(str, {lower: true, replacement: '_'}).substring(0, 100)] = str;
});

var writableKeys = _formatKeys(keyedStrings);
if(writableKeys) {
  if(append) {
    var comment = "\n\n// Autogenerated strings\n\n";
    fs.appendFile(destinationFile, comment + writableKeys, 'utf8');
  } else {
    fs.writeFileSync(destinationFile, writableKeys, 'utf8');  
  }
  console.log("Written to " + destinationFile);
} else{
  console.log("No new keys found, file has not been updated");
}

function _formatKeys(keyedStrings) {
  switch(destinationFileFormat) {
    case 'json':
      return _formatJson(keyedStrings);
      break;
    case 'strings':
      return _formatiOSStrings(keyedStrings);
      break;
    default:
      throw new Error("Unrecognized destination file format: " + destinationFileFormat);
  }
}

function _formatJson(keyedStrings) {
  return JSON.stringify(keyedStrings, null, 2);
}

function _formatiOSStrings(keyedStrings) {
  var keys = Object.keys(keyedStrings);
  if(!keys.length) return null;

  return keys.reduce(function(prev, curr, i) {
    if (i === 1) {
      prev = _formatLine(prev, keyedStrings[prev]);
    }

    return `${prev}\n${_formatLine(curr, keyedStrings[curr])}`;
  });

  function _formatLine(key, val) {
    return `"${key}" = "${val}";`;
  }
}

function _readStrings(destinationFile) {
  switch(destinationFileFormat) {
    case 'strings':
      return _readiOSStrings(destinationFile)
      break;
    default:
      throw new Error("Unrecognized destination file format: " + destinationFileFormat);
  }
}

function _readiOSStrings(destinationFile) {
  var stringsObj = i18nStringsFiles.readFileSync(destinationFile, 'utf8');
  var strings = [];
  for(var o in stringsObj) {
    strings.push(stringsObj[o]);
  }
  return strings;
}