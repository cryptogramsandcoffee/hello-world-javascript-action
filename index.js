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
  answers = JSON.parse(fs.readFileSync(CRYPTOCROSS_SOURCE_JSON_PATH, "utf8")); 
  let selectedAnswers = selectRandomAnswers(answers, size);
  console.log("selected answers: " + selectedAnswers.length);

  // let layout = clg.generateLayout(selectedAnswers);
  // let table = JSON.stringify(layout.table).toUpperCase();
  // let hash = generateHash(table);
  // let map = generateRandomMapping(ALPHABET);
  // let ciphertable = applyMapToTable(ALPHABET, map, table);

  // let cipherdefinition = encryptDefinitionAnswers(layout.result);
  // console.log("cipherdefinition: " + cipherdefinition);

  // let output= new Object();
  // output.hash = hash;
  // output.ciphertext = Buffer.from(ciphertable).toString("base64");
  // output.defintion = Buffer.from(JSON.stringify(output.definition)).toString("base64");

  // let contents = JSON.stringify(output);
  // let filename = `${generateHash(contents)}.json`;
  // contents = Buffer.from(contents).toString("base64");

  // console.log(`contents length: ${contents.length}`);
  // console.log(`filepath: ${CRYPTOCROSS_OUTPUT_FOLDER_PATH }${filename}`);


  // write the current puzzle into two locations, , and also overwrite /data/cryptocross/cryptocross.json
 
  // 1. the public cryptocross folder
  // fs.writeFile(`${CRYPTOCROSS_OUTPUT_FOLDER_PATH }${filename}`, contents);

  // 2. Replace the old cryptocross file with a new one
  // fs.unlink(CRYPTOCROSS_OUTPUT_FOLDER_PATH + "cryptocross.json", (error) => {
  //   if (error) {
  //       throw error;
  //   }
  //   fs.writeFile(CRYPTOCROSS_OUTPUT_FOLDER_PATH + "cryptocross.json", contents);
  // });

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