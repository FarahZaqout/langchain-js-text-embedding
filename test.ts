// @ts-ignore
import tape from 'tape';
import matchQuestions, {preprocess} from './finalexperiment';
import * as fs from 'fs';
import * as fastcsv from 'fast-csv';

// const originalQuestions = [
//   "What was the last interaction with X?",
//   "When was the last time we interacted with X?",
//   "When was the last interaction with account X, and by whom?",
//   "What do previous wins look like in account X?",
//   "What leads are being worked on by SDR Y?",
//   "What contacts are being worked on by SDR Y?",
//   ]
//   // original question ran through the preprocessbatch in embedding.ts
//   const preprocessedQuestions = [
//     "what was the last interaction with {{person}}?",
//     "when was the last time {{person}} interacted with {{person}}?",
//     "when was the last interaction with account {{entity}}, and by whom?",
//     "what do previous win look like in account {{entity}}?",
//     "what lead are being worked on by sdr {{person}}?",
//     "what contact are being worked on by sdr {{person}}?",
//   ];

  // it should be more effective if our stored data is real questions that are preprocessed as well.
  const realisticQuestions = [
    "What was the last interaction with Oscar Mitchell?",
    "When was the last time we interacted with Ella Thompson?",
    "When was the last interaction with {{entity}}, and by whom?", // todo: figure out why the original (mobisystems) did not register as an entity. This will pass but restoring {{entity}} to the original name mobisystems will fail. In a future iteration if we crack proper identification of entities, we should reach 100% accuracy.
    "What do previous wins look like in BeanBrew?",
    "What leads are being worked on by SDR Lucas Warren?",
    "What contacts are being worked on by SDR Lily Turner?",
]

  // const tweakedQuestions = [
  //   "what was the last interaction we have with Mike Smith?",
  //   "when was the most recent interaction with Mike Smith?",
  //   "who was the last one interacted with Uber?",
  //   "descirbe the previous win for Nike?",
  //   "on what leads Mike Smith do work?",
  //   "on what contacts Mike Smith do work?",
  // ];
  const tweakedQuestionsWithGrammerMistakes = [
    "what was the last interaction we had with Mike Smith?", // "have" changed to "had"
    "when was the most recent interaction with Mike Smith?",
    "who was the last one interacted with Uber?",
    "descirbe the previous wins for Nike?", // Misspelled "describe" and made "win" plural
    "on what leads does Mike Smith working?", // Added "does" and changed "do work" to "working"
    "on what contact's Mike Smith do work?", // Added unnecessary apostrophe in "contact's"
];

const csvStream = fastcsv.format({ headers: true });
const writeStream = fs.createWriteStream('noMatchResults.csv');

tape('Question Matching Tests', async (t: any) => {
  let fullMatch = 0;
  let noMatch = 0;

  csvStream.pipe(writeStream).on('end', () => process.exit());
  const simulatedUserInput = tweakedQuestionsWithGrammerMistakes;
  const simulatedPreparedQuestions = realisticQuestions;

  if (simulatedUserInput.length !== simulatedPreparedQuestions.length) {
    t.end('Length of simulated user input and prepared questions must be the same.');
  }

  for (const tweaked of simulatedUserInput) {
      const result = await matchQuestions(simulatedPreparedQuestions, tweaked);
      const matchedIndex = result[0][0].metadata.index;
      const expectedIndex = simulatedUserInput.indexOf(tweaked);
      if (matchedIndex === expectedIndex) {
          fullMatch++;
          t.pass(`FULL MATCH for "${tweaked}"`);
      } else {
			csvStream.write({
			UserInput: tweaked,
			MismatchedQuestion1: result[0][0].pageContent,
			MismatchedQuestion2: result[1][0].pageContent,
			MismatchedQuestion3: result[2][0].pageContent,
			});
          noMatch++;
          t.fail(`NO MATCH for "${tweaked}"`);
      }
  }

  const total = simulatedPreparedQuestions.length;
  t.comment(`Full Matches: ${fullMatch}/${total} (${(fullMatch / total * 100).toFixed(2)}%)`);
  t.comment(`No Matches: ${noMatch}/${total} (${(noMatch / total * 100).toFixed(2)}%)`);

  t.end();
});
