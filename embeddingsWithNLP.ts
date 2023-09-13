// this file is very outdated. maybe it's the 4th iteration or so.
import fs from 'fs';
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { WordNet } from 'natural';
const util = require('util');
// @ts-ignore
import { NlpManager } from 'node-nlp';  // Importing NLP.js
import {calculateBoost} from './util';

const entityType = {
    "i": "user",
    "me": "user",
    "my": "user",
    "mine": "user",
    "we": "user",
    "us": "user",
    "our": "user",
    "ours": "user",
    "x": "entity",
    "y": "entity",
    "z": "entity"
};

const manager = new NlpManager({ languages: ['en'] });

const replaceWithEntityType = async (text: string): Promise<string> => {
    const result = await manager.process('en', text);
    // @ts-ignore
    const entities = result.entities.map(e => e.entity);

    for (const entity of entities) {
              // @ts-ignore
            const replacement = entityType[entity.toLowerCase()] === "user" ? "{{user}}" : "{{entity}}";
            text = text.replace(entity, replacement);
    }

    for (const word in entityType) {
        if (text.includes(word)) {
            // @ts-ignore
            const replacement = `{{${entityType[word]}}}`;
            text = text.replace(new RegExp(`\\b${word}\\b`, "gi"), replacement);
        }
    }

    return text;
}

const openAIKey = "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";
const openAIEmbedding = new OpenAIEmbeddings({
    openAIApiKey: openAIKey,
    batchSize: 512,
});

const wordnet = new WordNet();
const lemmatizationCache: { [word: string]: string } = {};

const lemmatizeWord = (word: string): Promise<string> => {
    if (lemmatizationCache[word]) return Promise.resolve(lemmatizationCache[word]);

    return new Promise((resolve) => {
        wordnet.lookup(word, (results) => {
            if (results.length > 0) {
                lemmatizationCache[word] = results[0].lemma;
                resolve(results[0].lemma);
            } else {
                resolve(word);
            }
        });
    });
}

const preprocess = async (text: string): Promise<string> => {
    text = text.toLowerCase();
    text = await replaceWithEntityType(text);

    const words = text.split(' ');
    const lemmatizedWords = await Promise.all(words.map(word => lemmatizeWord(word)));
    text = lemmatizedWords.join(' ');

    return text;
}

const preprocessBatch = async (texts: string[]): Promise<string[]> => {
    return Promise.all(texts.map(async text => {
        text = text.toLowerCase();
        text = await replaceWithEntityType(text);

        const words = text.split(' ');
        const lemmatizedWords = await Promise.all(words.map(word => lemmatizeWord(word)));
        return lemmatizedWords.join(' ');
    }));
}

const readJSON = (filePath: string): string[] => {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(fileContent);
}

const main = async () => {
    const questions = readJSON('questions.json');
    const preprocessedQuestions = await preprocessBatch(questions);
    const metadata = preprocessedQuestions.map((_, index) => ({ index }));
    const vectorStore = await MemoryVectorStore.fromTexts(preprocessedQuestions, metadata, openAIEmbedding);
    const userInput = "What was the last interaction we have with Mike Smith?";
    const preprocessedInput = await preprocess(userInput);
    const results = await vectorStore.similaritySearchWithScore(preprocessedInput, 3);
    console.log({ preprocessedInput })
    console.log(util.inspect(results, { showHidden: false, depth: null, colors: true }))
}

main();
