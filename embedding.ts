// outdated
import fs from 'fs';
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { WordNet } from 'natural';
import nlp from 'compromise';
const util = require('util');

// @todo: we should probably update the list of question in the json file. 

// pronouns are of type user, entity.
const entityType = {
  "i": "person",
  "me": "person",
  "my": "person",
  "mine": "person",
  "we": "person",
  "us": "person",
  "our": "person",
  "ours": "person",
  "x": "entity",
  "y": "entity",
  "z": "entity"
};


// // Named Entity Recognition (replace real world names with {{entity}})
// const replaceWithEntityType = (text: string): string => {
//     const doc = nlp(text);

//     doc.people().out('array').forEach((entity: string) => {
//         // @ts-ignore
//         const replacement = entityType[entity.toLowerCase()] === "user" ? "{{user}}" : "{{entity}}";
//         text = text.replace(entity, replacement);
//     });

//     // For pronouns and other identified words in entity type at line 10
//     for (const word in entityType) {
//         if (text.includes(word)) {
//             // @ts-ignore
//             const replacement = `{{${entityType[word]}}}`;
//             text = text.replace(new RegExp(`\\b${word}\\b`, "gi"), replacement);
//         }
//     }

//     return text;
// }


const openAIKey = "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";
const openAIEmbedding = new OpenAIEmbeddings({
  openAIApiKey: openAIKey,
  batchSize: 512,
});

const wordnet = new WordNet();

// todo: we should replace people with person and entities with entities, also pronouns with person.
// right now we rely on entity type for pronouns which is not a good approach. We don't distinguish between perons and entities, which creates some inconsistencies.
const replaceEntities = (text: string): string => {
  const doc = nlp(text);

  // Replace people's names with {{person}}
  doc.people().replaceWith('{{person}}');
  doc.organizations().replaceWith('{{entity}}');
  doc.pronouns().replaceWith('{{person}}');
  
  let newText = doc.out('text');
  
  // Todo: remove the parametarized "X, Y ...etc" and replace with real examples (3 accounts, Walmart...etc). It will help adjust to more tweaked questions and will eliminate the need to use entityType altogether. 
  for (const word in entityType) {
      if (newText.includes(word)) {
        // @ts-ignore
          const replacement = `{{${entityType[word]}}}`;
          newText = newText.replace(new RegExp(`\\b${word}\\b`, "gi"), replacement); // \b is for word boundary. The more you know.
      }
  }

  return newText;
}

const lemmatizationCache: { [word: string]: string } = {};

// whitelist to avoid acronyms and other limmatization problems.
const pronouns = [
  "i", "me", "you", "he", "him", "she", "her", "it",
  "we", "us", "they", "them", "my", "mine", "your",
  "yours", "his", "hers", "its", "our", "ours", "their", "theirs", "am", "is", "are"
];

const prepositions = [
  "above", "across", "after", "against", "along", "among",
  "around", "as", "at", "before", "behind", "below",
  "beneath", "beside", "between", "by", "down", "during",
  "except", "for", "from", "in", "inside", "into", "like",
  "near", "of", "off", "on", "over", "past", "since", "through",
  "to", "toward", "under", "until", "up", "upon", "with", "within"
];

const commonWords = [
  "who", "why", "what", "where", "when", "how", "by", "being", "all"
];

const whitelist = new Set([...pronouns, ...prepositions, ...commonWords]);

const lemmatizeWord = (word: string): Promise<string> => {
  const lowerCaseWord = word.toLowerCase();
  if (word.toLowerCase() === "who") {
    console.log({hasLowerCaseWord: whitelist.has(lowerCaseWord), lowerCaseWord})
  }
  // ignore acronyms altogether.
  if (whitelist.has(lowerCaseWord) || lemmatizationCache[lowerCaseWord]) {
    return Promise.resolve(lowerCaseWord);
  }

  return new Promise((resolve) => {
    wordnet.lookup(lowerCaseWord, (results) => {
      if (results.length > 0) {
        lemmatizationCache[lowerCaseWord] = results[0].lemma;
        resolve(results[0].lemma);
      } else {
        resolve(lowerCaseWord);
      }
    });
  });
}

// const lemmatizeWord = async (word: string): Promise<string> => {
//   if (whitelist.has(word) || lemmatizationCache[word]) {
//     return word;
//   }

//   // Check for named entity using compromise
//   const doc = nlp(word);
//   const people = doc.people().out('array');
//   const organizations = doc.organizations().out('array');
//   const places = doc.places().out('array');

//   if (people.length > 0) {
//     return '{{person}}';
//   } else if (organizations.length > 0) {
//     return '{{entity}}';
//   }

//   return new Promise((resolve) => {
//     wordnet.lookup(word, (results) => {
//       if (results.length > 0) {
//         lemmatizationCache[word] = results[0].lemma;
//         resolve(results[0].lemma);
//       } else {
//         resolve(word);
//       }
//     });
//   });
// }


// this may not be necessary.
const whQuestions = [
  "who", "whom", "whose", "what", "where",
  "when", "why", "which", "how"
];

const emphasizeWhQuestions = (text: string) => {
  for (const wh of whQuestions) {
    const regex = new RegExp(`\\b${wh}\\b`, 'gi');
    if (regex.test(text)) {
      text = text.replace(regex, `${wh} ${wh}`);
    }
  }
  return text;
}

export const preprocess = async (text: string): Promise<string> => {
  // Convert to lowercase
  text = text.toLowerCase();
  text = replaceEntities(text);
  text = emphasizeWhQuestions(text);

  // // Remove stopwords
  // these reduced the accuracy in early iterations. Might be worth reactivating later..
  // const stopwords = ["is", "the", "and", "a", "an"];
  // text = text.split(' ').filter(word => !stopwords.includes(word)).join(' ');

  // Lemmatization
  const words = text.split(' ');
  const lemmatizedWords = await Promise.all(words.map(word => lemmatizeWord(word)));
  text = lemmatizedWords.join(' ');

  return text;
}

// this is better than the loop over preprocess I initially implemented. I have outputed its results in the json file instead of preprocessing our questions every run.
// it's faster but we should keep in mind that changes to the preprocessing would require a new write. I've done it as a copy paste from a console because I'm lazy.
// we should have a script that does it automatically.
// if we need to preprocess a batch of questions, from the user in a future iteration, larger lists of questions might be memory heavy, maybe the loop is better.
// note to self: look into this.
const preprocessBatch = async (texts: string[]): Promise<string[]> => {
  return Promise.all(texts.map(async text => {
      text = text.toLowerCase();
      text = replaceEntities(text);
      text = emphasizeWhQuestions(text);

      const words = text.split(' ');
      const lemmatizedWords = await Promise.all(words.map(word => lemmatizeWord(word)));
      return lemmatizedWords.join(' ');
  }));
}

// Read from the JSON file
const readJSON = (filePath: string): string[] => {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(fileContent);
}

const questions = readJSON('questions.json');

const matchQuestions = async (questions: string[], userInput: string) => {
  // const preprocessedQuestions = await preprocessBatch(questions); // disabled to avoid reprocessing the questions every time
	const metadata = questions.map((_, index) => ({ index }));
	const vectorStore = await MemoryVectorStore.fromTexts(questions, metadata, openAIEmbedding);
	const preprocessedInput = await preprocess(userInput);
	const results = await vectorStore.similaritySearchWithScore(preprocessedInput, 3);
	console.log({ preprocessedInput })
	console.log(util.inspect(results, { showHidden: false, depth: null, colors: true }))

  return results;
}

export default matchQuestions;

matchQuestions(questions, "am I working on any leads");

// first iteration: no modifications:
// am i working on any leads
// [
//   [
//     Document {
//       pageContent: 'Do I have any leads in account X?',
//       metadata: { index: 16 }
//     },
//     0.811072905541734
//   ],
//   [
//     Document {
//       pageContent: 'Who are all the leads associated with this account?',
//       metadata: { index: 2 }
//     },
//     0.8003443467306276
//   ],
//   [
//     Document {
//       pageContent: 'What leads are being worked on by Y?',
//       metadata: { index: 12 }
//     },
//     0.7988339160887511
//   ]
// ]

// ====================================================================================
// first attempt at preprocessing: (lemmatization alone)

// am I workin on any leads
// [
//   [
//     Document {
//       pageContent: 'what leads do one have?',
//       metadata: { index: 6 }
//     },
//     0.8067232437808427
//   ],
//   [
//     Document {
//       pageContent: 'do one take any leads in account x?',
//       metadata: { index: 16 }
//     },
//     0.8024503459400335
//   ],
//   [
//     Document {
//       pageContent: 'what leads are organism worked on aside y?',
//       metadata: { index: 12 }
//     },
//     0.7981156199532377
//   ]
// ]

// adding 2 more questions::

// "what leads do I currently work on",
// "which leads do I have that are active right now",

// ================================================================================

// am I workin on any leads
// [
//   [
//     Document {
//       pageContent: 'what leads do one presently work on',
//       metadata: { index: 7 }
//     },
//     0.8205120308406023
//   ],
//   [
//     Document {
//       pageContent: 'what leads do one have?',
//       metadata: { index: 6 }
//     },
//     0.8065876025059027
//   ],
//   [
//     Document {
//       pageContent: 'do one take any leads in account x?',
//       metadata: { index: 18 }
//     },
//     0.8024824652875033
//   ]
// ]

// am I workin on any leads
// [
//   [
//     Document {
//       pageContent: 'what leads do one have?',
//       metadata: { index: 6 }
//     },
//     0.8066184728783315
//   ],
//   [
//     Document {
//       pageContent: 'do one take any leads in account x?',
//       metadata: { index: 16 }
//     },
//     0.8025377990139396
//   ],
//   [
//     Document {
//       pageContent: 'what leads are organism worked on aside y?',
//       metadata: { index: 12 }
//     },
//     0.7982052487019787
//   ]
// ]

// =================================================================================================

// including references like me, I, you, etc. in the question and treating it as parameters
// am I workin on any leads
// do x work on any leads

// am I workin on any leads
// [
//   [
//     Document {
//       pageContent: 'what leads do {{user}} presently work on',
//       metadata: { index: 7 }
//     },
//     0.8329428247941606
//   ],
//   [
//     Document {
//       pageContent: 'what leads do {{user}} have?',
//       metadata: { index: 6 }
//     },
//     0.8258404597532534
//   ],
//   [
//     Document {
//       pageContent: 'do {{user}} take any leads in account x?',
//       metadata: { index: 18 }
//     },
//     0.8065310810872142
//   ]
// ]

// Testing for Original Question: Who are all the contacts associated with this account?
// User Input: I need all contacts for this account. Can you fetch?
// {
//   preprocessedInput: '{{user}} need all contacts for this account. can you fetch?'
// }
// [
//   [
//     Document {
//       pageContent: 'who are all the contacts associated with this account?',
//       metadata: { index: 9 }
//     },
//     0.8673706846819224
//   ],
//   [
//     Document {
//       pageContent: 'do {{user}} have any leads in account {{entity}}?',
//       metadata: { index: 16 }
//     },
//     0.8332322334572052
//   ],
//   [
//     Document {
//       pageContent: 'what contacts are being worked on by {{entity}}?',
//       metadata: { index: 13 }
//     },
//     0.8273774100406251
//   ]
// ]

// ================================================================================
// this is still an issue
// am I workin on any leads
// [
//   [
//     Document {
//       pageContent: 'what leads do {{user}} have?',
//       metadata: { index: 6 }
//     },
//     0.825807247771061
//   ],
//   [
//     Document {
//       pageContent: 'do {{user}} take any leads in account x?',
//       metadata: { index: 16 }
//     },
//     0.8064942463416946
//   ],
//   [
//     Document {
//       pageContent: 'what leads are organism worked on aside y?',
//       metadata: { index: 12 }
//     },
//     0.7851904796330319
//   ]
// ]

//  ==========================================================================================
// after attemting named entity recognition
// it got worse for some reason.
// {
//   preprocessedInput: 'amplitude_modulation {{entity}} workin on any leads'
// }
// [
//   [
//     Document {
//       pageContent: 'what leads do {{entity}} have?',
//       metadata: { index: 6 }
//     },
//     0.8464352734262363
//   ],
//   [
//     Document {
//       pageContent: 'what leads are organism worked on aside {{entity}}?',
//       metadata: { index: 12 }
//     },
//     0.8461211336999386
//   ],
//   [
//     Document {
//       pageContent: 'do {{entity}} take any leads in account {{entity}}?',
//       metadata: { index: 16 }
//     },
//     0.8447643897369529
//   ]
// ]

// ======================================================================================
// { preprocessedInput: 'is {{entity}} working on any leads?' }
// [
//   [
//     Document {
//       pageContent: 'do {{user}} take any leads in account {{entity}}?',
//       metadata: { index: 16 }
//     },
//     0.9155190672639674
//   ],
//   [
//     Document {
//       pageContent: 'what leads are organism worked on aside {{entity}}?',
//       metadata: { index: 12 }
//     },
//     0.9069947746699941
//   ],
//   [
//     Document {
//       pageContent: 'what are the last {{entity}} leads?',
//       metadata: { index: 4 }
//     },
//     0.9068228980761701
//   ]
// ]


// what leads does farah work on
// { preprocessedInput: 'what leads does {{entity}} work on?' }
// [
//   [
//     Document {
//       pageContent: 'what leads are organism worked on aside {{entity}}?',
//       metadata: { index: 12 }
//     },
//     0.941812821515534
//   ],
//   [
//     Document {
//       pageContent: 'do {{user}} take any leads in account {{entity}}?',
//       metadata: { index: 16 }
//     },
//     0.9162851412272226
//   ],
//   [
//     Document {
//       pageContent: 'what are the last {{entity}} leads?',
//       metadata: { index: 4 }
//     },
//     0.9090065672019523
//   ]
// ]

// ======================================================================================
// More questions with the latest results:
// what accounts should I focus on
// { preprocessedInput: 'what accounts should {{user}} focus on' }
// [
//   [
//     Document {
//       pageContent: 'what account should {{user}} work on next?',
//       metadata: { index: 10 }
//     },
//     0.9076956406062301
//   ],
//   [
//     Document {
//       pageContent: 'what is the latest in {{user}} accounts?',
//       metadata: { index: 21 }
//     },
//     0.8735089308586302
//   ],
//   [
//     Document {
//       pageContent: 'do {{user}} take any leads in account {{entity}}?',
//       metadata: { index: 16 }
//     },
//     0.8366380654912463
//   ]
// ]

// what are my best accounts. confidence score is super close.
// { preprocessedInput: 'what are {{user}} better accounts' }
// [
//   [
//     Document {
//       pageContent: 'what is the latest in {{user}} accounts?',
//       metadata: { index: 21 }
//     },
//     0.9036596745632921
//   ],
//   [
//     Document {
//       pageContent: 'what account should {{user}} work on next?',
//       metadata: { index: 10 }
//     },
//     0.9036589841708839
//   ],
//   [
//     Document {
//       pageContent: 'do {{user}} take any leads in account {{entity}}?',
//       metadata: { index: 16 }
//     },
//     0.8632219380306807
//   ]
// ]

// ======================================================================================

// { preprocessedInput: 'what are {{user}} better accounts' }
// [
//   [
//     Document {
//       pageContent: 'what account should {{user}} work on next?',
//       metadata: { index: 10 }
//     },
//     0.9036589841708839
//   ],
//   [
//     Document {
//       pageContent: 'what is the latest in {{user}} accounts?',
//       metadata: { index: 21 }
//     },
//     0.9036463261868335
//   ],
//   [
//     Document {
//       pageContent: 'do {{user}} take any leads in account {{entity}}?',
//       metadata: { index: 16 }
//     },
//     0.8623027831504313
//   ]
// ]



// problems:
// by may become aside. Needs some tweaking.

// how messy it can get
// Can you tell me the intent score for Amazon's account?
// note: amazon was missed in the named entity recognition
// {
//   preprocessedInput: "displace you distinguish {{user}} the captive grade for amazon's account?"
// }
// [
//   [
//     Document {
//       pageContent: 'what is the captive grade of account {{entity}}?',
//       metadata: { index: 0 }
//     },
//     0.8537289237912273
//   ],
//   [
//     Document {
//       pageContent: 'what account should {{user}} work on next?',
//       metadata: { index: 10 }
//     },
//     0.8187649915082715
//   ],
//   [
//     Document {
//       pageContent: 'what is the latest in {{user}} accounts?',
//       metadata: { index: 21 }
//     },
//     0.814825218054296
//   ]
// ]



// ======================================================================================
// current version:
// { preprocessedInput: 'am {{user}} working on any leads' }
// [
//   [
//     Document {
//       pageContent: 'what leads do {{user}} have?',
//       metadata: { index: 6 }
//     },
//     0.8632957570221257
//   ],
//   [
//     Document {
//       pageContent: 'do {{user}} take any leads in account {{entity}}?',
//       metadata: { index: 16 }
//     },
//     0.855686084472249
//   ],
//   [
//     Document {
//       pageContent: 'what leads are being worked on by {{entity}}?',
//       metadata: { index: 12 }
//     },
//     0.8535214265009619
//   ]
// ]

// --------------------------------------------------------- list of questions before preprocessing ---------------------------------------------------------
// [
//   "What is the intent score of account X?",
//   "When was the last time we interacted with X?",
//   "Who are all the leads associated with this account?",
//   "List my accounts with the most whitespace?",
//   "What are the last X leads?",
//   "Where is my whitespace?",
//   "What leads do I have?",
//   "Which account will result in a win like account X?",
//   "What are the last X company wins?",
//   "Who are all the contacts associated with this account?",
//   "What account should I work on next?",
//   "How many deals do we have for account X?",
//   "What leads are being worked on by {{person}}?",
//   "What contacts are being worked on by {{person}}?",
//   "When is the renewal due for Z?",
//   "What was the last deal at company Y?",
//   "Do I have any leads in account X?",
//   "What was the last interaction with X?",
//   "When was the last interaction with account X, and by whom?",
//   "What do previous wins look like in account X?",
//   "How do I generate X pipeline?",
//   "What is the latest in my accounts?",
//   "Which contacts/leads attended meetings in the past X days?",
//   "Who are all the channel partners associated with my accounts?"
// ]


//  ======================================================================================

// final iteration: the elusive "am i working on any leads" is cracked.
// { preprocessedInput: 'am {{person}} working on any leads' }
// [
//   [
//     Document {
//       pageContent: 'What leads are being worked on by {{person}}?',
//       metadata: { index: 12 }
//     },
//     0.8897343816046596
//   ],
//   [
//     Document {
//       pageContent: 'What contacts are being worked on by {{person}}?',
//       metadata: { index: 13 }
//     },
//     0.86985621898406
//   ],
//   [
//     Document {
//       pageContent: 'What leads do {{person}} have?',
//       metadata: { index: 6 }
//     },
//     0.8566717319292989
//   ]
// ]

