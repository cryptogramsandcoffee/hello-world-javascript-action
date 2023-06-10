const core = require('@actions/core');
const github = require('@actions/github');
const clg = require("crossword-layout-generator");
const fs = require('fs');

try {
  // `who-to-greet` input defined in action metadata file
  const nameToGreet = core.getInput('who-to-greet');
  console.log(`Hello ${nameToGreet}!`);
  const time = (new Date()).toTimeString();
  core.setOutput("time", time);
  // Get the JSON webhook payload for the event that triggered the workflow
  const payload = JSON.stringify(github.context.payload, undefined, 2)
  console.log(`The event payload: ${payload}`);

  answerJson = JSON.parse(fs.readFileSync('./data/cryptocross.json', 'utf8')); 
  console.log(`There are ${answerJson.length} answers in the answers file.`);

  let selectedAnswers = selectRandomAnswers(answerJson, 20);

  console.log(`Randomly selected ${selectedAnswers.length} answers.`);
  // let layout = clg.generateLayout(selectedAnswers);

} catch (error) {
  core.setFailed(error.message);
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