const core = require('@actions/core');
const github = require('@actions/github');
const clg = require("crossword-layout-generator");
const sjcl = require("sjcl");
const fs = require('fs');

try {
  const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  answerJson = JSON.parse(fs.readFileSync('./data/cryptocross.json', 'utf8')); 
  let selectedAnswers = selectRandomAnswers(answerJson, 20);
  let layout = clg.generateLayout(selectedAnswers);
  console.log(`typeof layout: ${typeof(layout)}`);
  // let table = JSON.stringify(layout.table).toUpperCase();
  var hash = generateHash("table");
  let map = generateRandomMapping(ALPHABET);


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
