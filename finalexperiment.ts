import fs from 'fs';
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { WordNet } from 'natural';
import nlp from 'compromise';
import util from 'util';

// OpenAI Configuration
const OPENAI_KEY = "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";
const openAIEmbedding = new OpenAIEmbeddings({
  openAIApiKey: OPENAI_KEY,
  batchSize: 512,
});
const wordnet = new WordNet();


const BOOST_FACTOR_PERSON = 1.2;  // experimenting with different boost factors for each pattern.
const BOOST_FACTOR_ENTITY = 1.15; // experimenting with different boost factors for each pattern.

// const calculateBoost = (text: string): number => {
//   let boost = 1;

//   if (text.includes('{{person}}')) {
//     boost *= BOOST_FACTOR_PERSON;
//   }

//   if (text.includes('{{entity}}')) {
//     boost *= BOOST_FACTOR_ENTITY;
//   }

//   return boost;
// };

// boost iteration #2
// note: Too simple. I don't think I understand boosting.
const calculateBoost = (text: string): number => {
  let boost = 1;
  const hasPerson = text.includes('{{person}}');
  const hasEntity = text.includes('{{entity}}');
  if (hasPerson && hasEntity) {
    boost *= (BOOST_FACTOR_PERSON + BOOST_FACTOR_ENTITY) / 2;
  } else if (hasPerson) {
    boost *= BOOST_FACTOR_PERSON;
  } else if (hasEntity) {
    boost *= BOOST_FACTOR_ENTITY;
  }

  return boost;
};


/**
 * Replace recognized entities with their generic placeholders.
 * @todo: we can also add support for numbers, percentages...etc. They should be very relevant to our use cases.
 */
const replaceEntities = (text: string): string => {
  const doc = nlp(text);
  doc.people().replaceWith('{{person}}');
  doc.organizations().replaceWith('{{entity}}');
  doc.pronouns().replaceWith('{{person}}');
  
  return doc.out('text');
}

/**
 * Lemmatize a word while avoiding common words and acronyms.
 */
const lemmatizeWord = (word: string): Promise<string> => {
  const COMMON_WORDS = new Set(["who", "why", "what", "where", "when", "how", "by", "being", "all"]);
  
  if (COMMON_WORDS.has(word.toLowerCase())) {
    return Promise.resolve(word);
  }
  // this lemmatizer has some issues. For example, we need to identify common words, otherwise "by" might be lemmatized to "aside". 
  // It can also create weird results like "meaning(a)" which is not an actual word. This is inconsequential now, but our data set is small and we might be biased.
  return new Promise((resolve) => {
    wordnet.lookup(word.toLowerCase(), (results) => {
      if (results.length > 0) {
        resolve(results[0].lemma);
      } else {
        resolve(word);
      }
    });
  });
}

/**
 * Triples the occurrence of common question words for emphasis. Might be better if we double it instead of trippling it.
 * This is an artificial boost of significance. It is not natural language and might end up creating more noise than signal.
 * @note This needs testing on larget sets of questions.
 */
const emphasizeWhQuestions = (text: string): string => {
  const WH_QUESTIONS = ["who", "whom", "whose", "what", "where", "when", "why", "which", "how"];
  
  for (const questionWord of WH_QUESTIONS) {
    const regex = new RegExp(`\\b${questionWord}\\b`, 'gi');
    if (regex.test(text)) {
      text = text.replace(regex, `${questionWord} ${questionWord} ${questionWord}`);
    }
  }
  return text;
}

/**
 * Preprocess the input text (applies all utilities NER, TF-IDF and lemmatization).
 */
export const preprocess = async (text: string): Promise<string> => {
  text = text.toLowerCase();
  text = replaceEntities(text);
  text = emphasizeWhQuestions(text);

  const words = text.split(' ');
  const lemmatizedWords = await Promise.all(words.map(word => lemmatizeWord(word)));
  return lemmatizedWords.join(' ');
}

/**
 * Preprocess a batch of text inputs. Maybe promises are not needed here. 
 * @todo: Clean this up later.
 */
const preprocessBatch = async (texts: string[]): Promise<string[]> => {
  return Promise.all(texts.map(preprocess));
}

/**
 * Retrieve the most similar questions to a given user input.
 */
const matchQuestions = async (questions: string[], userInput: string) => {
  const preprocessedInput = await preprocess(userInput);
  const preprocessedQuestions = await preprocessBatch(questions);
  const vectorStore = await MemoryVectorStore.fromTexts(preprocessedQuestions, questions.map((_, index) => ({ index })), openAIEmbedding);
  const results = await vectorStore.similaritySearchWithScore(preprocessedInput, 3); // return the top 3 questions
  console.log({preprocessedInput})
  console.log(util.inspect(results, { showHidden: false, depth: null, colors: true }));
  return results;
}

// attempting a boost factor actually reduced the accuracy of the results
// this is also not needed when changing the way we parametarize questions. 
// It could become useful in the future in more complex scenarios. However, we'd have to figure what's wrong with this primitive implementation.

// const matchQuestionsWithBoostFactor = async (questions: string[], userInput: string) => {
//   const preprocessedInput = await preprocess(userInput);
//   const preprocessedQuestions = await preprocessBatch(questions);

//   const vectorStore = await MemoryVectorStore.fromTexts(preprocessedQuestions, preprocessedQuestions.map((_, index) => ({ index })), openAIEmbedding);
//   let results = await vectorStore.similaritySearchWithScore(preprocessedInput, 3);

//   // Adjust scores with the boost factor
//   results = results.map(resultPair => {
//     const document = resultPair[0];
//     const originalScore = resultPair[1];
//     const boostFactor = calculateBoost(document.pageContent);
//     const adjustedScore = originalScore * boostFactor;

//     return [document, adjustedScore];
//   });

//   // Sort the results again after applying the boost factor
//   results.sort((a, b) => b[1] - a[1]);

//   console.log({ preprocessedInput });
//   console.log(util.inspect(results, { showHidden: false, depth: null, colors: true }));

//   return results;
// };

// Example usage:
const questionsFromFile = JSON.parse(fs.readFileSync('questions.json', 'utf-8'));
matchQuestions(questionsFromFile, "what are my best accounts"); // matches correctly, for every question in the file

export default matchQuestions;
