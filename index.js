const core = require('@actions/core');
const github = require('@actions/github');
const clg = require("crossword-layout-generator");
const sjcl = require("sjcl");
const fs = require('fs');

// private paths, answer/clue data source and 
const CRYPTOCROSS_SOURCE_JSON_PATH = "./data/cryptocross/cryptocross.json";
const CRYPTOCROSS_INDEX_JSON_PATH = "./_data/cryptocross/index.json";

// public path, where all the cryptocross json files reside
const CRYPTOCROSS_OUTPUT_FOLDER_PATH = "./data/cryptocross/";

try {
  const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const size = core.getInput("size");
  let answers = JSON.parse(fs.readFileSync(CRYPTOCROSS_SOURCE_JSON_PATH, "utf8"));
  let indices = fs.readFileSync(CRYPTOCROSS_INDEX_JSON_PATH , "utf8");
  
  console.log("indices: " + indices);  

  let selectedAnswers = selectRandomAnswers(answers, size);
  let layout = clg.generateLayout(selectedAnswers);
  let table = JSON.stringify(layout.table).toUpperCase();
  let hash = generateHash(table);
  let map = generateRandomMapping(ALPHABET);
  let ciphertable = applyMapToTable(ALPHABET, map, table);
  let cipherdefinition = encryptDefinitionAnswers(layout.result, ALPHABET, map);

  let output= new Object();
  // output.game = indices.length;
  output.hash = hash;
  output.ciphertext = Buffer.from(ciphertable).toString("base64");
  output.defintion = Buffer.from(JSON.stringify(cipherdefinition)).toString("base64");

  let contents = JSON.stringify(output);
  let filename = `${generateHash(contents)}.json`;
  let filepath = `${CRYPTOCROSS_OUTPUT_FOLDER_PATH }${filename}`;

  console.log(`contents length: ${contents.length}`);
  console.log(`filepath: ${filepath}`);


  // write the current puzzle into two locations, , and also overwrite /data/cryptocross/cryptocross.json
 
  // 1. the public cryptocross folder
  fs.writeFileSync(filepath, Buffer.from(contents).toString("utf8"));

  // 2. Replace the old cryptocross file with a new one
  fs.writeFileSync(CRYPTOCROSS_OUTPUT_FOLDER_PATH + "cryptocross.json", Buffer.from(contents).toString("utf8"));

  // 3. update the index array with the latest hash
  // indices.push(generateHash(contents));
  // fs.writeFileSync(CRYPTOCROSS_INDEX_JSON_PATH, Buffer.from(JSON.stringify(indices)).toString("utf8"));
  
  core.setOutput("contents", "contents");
  core.setOutput("filename", "filename");
  
  // const payload = JSON.stringify(github.context.payload, undefined, 2)
  // console.log(`The event payload: ${payload}`);
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