const core = require('@actions/core');
const github = require('@actions/github');
const clg = require("crossword-layout-generator");
const sjcl = require("sjcl");
const fs = require('fs');

try {
  const size = core.getInput("size");
  const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  answers = JSON.parse(fs.readFileSync("./data/cryptocross.json", "utf8")); 
  let selectedAnswers = selectRandomAnswers(answers, size);
  let layout = clg.generateLayout(selectedAnswers);
  let table = JSON.stringify(layout.table).toUpperCase();
  let hash = generateHash(table);
  let map = generateRandomMapping(ALPHABET);
  let ciphertext = applyMapToTable(ALPHABET, map, table);

  let output= new Object();
  output.hash = hash;
  output.ciphertext = Buffer.from(ciphertext).toString("base64");
  output.defintion = Buffer.from(JSON.stringify(layout.result)).toString("base64");

  let contents = JSON.stringify(output);
  let filename = generateHash(contents);
  contents = Buffer.from(contents).toString("base64");

  console.log(`contents length: ${contents.length}`);
  console.log(`filename: ${filename}`);

  core.setOutput("filename", filename);
  core.setOutput("contents", contents);

  const payload = JSON.stringify(github.context.payload, undefined, 2)
  console.log(`The event payload: ${payload}`);
} catch (error) {
  core.setFailed(error.message);
}


function generateRandomMapping (alphabet) {
  // uses Sattolo's algorithm to shuffle the array, where no element remains in the initial position
  let array = alphabet.split("");
  const len = array.length;
  for (let i = 0; i < len - 1; i++) { // 0 to n -1, exclusive because the last item doesn't need swapping
      let j = Math.floor(Math.random() *  (len-(i+1)))+(i+1); // i+1 to len, exclusive
      const temp = array[i];
      array[i] = array[j];
      array[j] = temp;
  }
  return array.join("");
}

function generateHash (message) {
  let bits = sjcl.hash.sha256.hash(message);
  return sjcl.codec.hex.fromBits(bits);
}

function selectRandomAnswers(answers, size) {
  if (size >= answers.length) return answers;

  let clone = JSON.parse(JSON.stringify(answers));
  let selections = new Array();
  while(selections.length < size) 
  {
      let index = Math.floor(Math.random() * clone.length);
      selections.push(clone[index]);
      clone.splice(index, 1);
  }
  return selections;
}


function encryptDefinitionAnswers (result, alphabet, map) {
  Object.values(result).forEach(function(value) {
      value.answer = applyMap(alphabet, map, value.answer);
  });
  return result;       
}

function applyMap(alphabet, map, answer) {
  let a = alphabet.split("");
  let m = map.split("");
  let e = answer.toUpperCase().split("");

  for (let i = 0; i < e.length; i++) {
      let alphaIndex = alphabet.indexOf(e[i]);
      if (alphaIndex > -1) {
          e[i] = m[alphaIndex];
      }
  }
  return e.join("");        
}

function applyMapToTable(alphabet, map, table) {
  let a = alphabet.split("");
  let m = map.split("");
  let t = JSON.parse(table);

  for (let i = 0; i < t.length; i++) {
      let row = t[i];
      for (let j = 0; j < row.length; j++) {
          let alphaIndex = alphabet.indexOf(row[j]);
          if (alphaIndex > -1) {
              row[j] = m[alphaIndex];
          }
      } 
  }
  return JSON.stringify(t);
}