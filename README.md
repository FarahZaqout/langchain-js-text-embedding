# Question Matching via Text Embedding:

This document will outline the current state of GPT, track its improvements and outline the way moving forward.

## To test and get started:

- **install dependencies:** `npm i`
- **run the main file finalexperiment.ts**: `npm start`
- **run the tests (primarily focused on the mismatched questions):** `npm test`.

## Initial Approach

- Deployed a list of predetermined questions for matching user input.
- Utilized OpenAI's textEmbeddings without preprocessing user input.

## Challenges encountered:

- Phrasing variations.
- Grammar and punctuation inaccuracies.
- Difficulty in distinguishing entities such as people, objects, etc.
- Inability to differentiate "wh" questions, leading to misinterpretations.

## Current State & Improvements

Implemented preprocessing for both pre-set questions and user input.
**Applied techniques such as:**

- Lemmatization
- Term Frequency-Inverse Document Frequency (TF-IDF)
- Emphasis on "wh" questions since they change the context/primary focus of our query
- Whitelisting common words to circumvent lemmatization inaccuracies.
- Named entity recognition

## Stored Question Parametarization:

The initial technique used arbitrary parametarization to indicate named entity input from the user.
For example:

- "**When** was the last interaction with X?"

This techniques had a few flaws that can throw off the models. For example, "X" here is completely without context. It can be a person, an object, an account...etc. Even for a human, it can be "Walmart" or "Farah".

We are trying to identify things that an be identified by a human, the above technique makes it near impossible to truly identify the nature of X by a human. X, Y, Z...etc do not sufficiently preserve the context.

### First attempt:

By replacing the X with {{person}} or {{entity}} in the list of question, we can then use Named Entity Recognition (NER) to figure out if the qustion is within the same context.

Applying NER to the user input will transform something like "when did we last interact with Farah" to "when did we last interact with {{person}}". Making it easier to match. Since we have the original name, it's easy to map back the value when we send the query to our database.

**The issue with this** is that it requires us to manually replace X with person, or have some arbitrary rule that is very prone to user error and oversights. This becomes unmaintainable if we increase the list of question significantly.

### Second attempt:

To overcome the drawback of the first attempt (which is also a drawback of the initial technique), it is best to just use a realistic name, then apply the same preprocessing to it that we apply to the user input.

- Stored question: When was the last interaction with Adam Smith?
- user input: when did we last interact with Farah Zaqout?

**By preprocessing both quetsions we achieve two things:**
1- We validate the consistency of our preprocessing technique (limmatization works consistently, NER...etc)
2- Once we are certain our preprocessing is consistent, we can have any list of questions, and automate the parametarization (instead of manually writing X, {{person}})...etc, we just get the questions as is and pass them to the preprocessing function. One less human step, one less chance to make errors.

## Outcomes:

This attempt at standardizing the texts has led to a significant improvement in the accuracy of matching.

- For the list of mismatched questions that can be found in the test file, they all match correctly. Instead of them being the 2nd matched result, the are all the first matched result.
- Enhanced precision in question interpretation. While still in a PoC status, we are able to judge if a named entity is a person or a company. This extends to pronouns.

## Caveats:

- I am yet unable to determine how to measure the right balance of context interpretation via NER and other techniques.
  - Does the analysis of sentence structure, breaking it down to chunks and categorizing verbs, adjectives...etc improve or undermine the accuracy?
  - The repetition of words to artificially boost their importance is not a natural language technique and while it improves things for now, this might lead to worse results in case of significantly different phrasing. This is yet to be tested and validated, and actual boosting techniques are not supported out of the box in javascript libraries and have to be implemented directly. This is a non-trivial task and should be low on the priorities as there is no certainty of its cost/benefit.

## Limitations

- Current improvements serve as a proof of concept and may not fully cater to real-world scenarios with a broader user base.
- We will have to move to a python based project sooner than later as the NLP capabilities and sophistication of the javascript ML ecosystem are dwarfed by its python counterpart.
  - For example, techniques such as augmented TF-IDF are almost impossibly difficult as they have to be implemented manually. This might not be the case in a python environment, though I haven't verified this.

Most of these next steps are known at this point. Long term changes might still be ambiguous. For example, **moving from a rule-based text preprocessing to a machine learning approach** is a long term, and ~~daunting~~ exciting endeavor.

## Next steps:

1- Moving to python (I am very skeptical of the JavaScript ecosystem's capacity to support a sophisticated project).
2- Significantly increasing the sample size for testing (30ish questions are nowhere near good enough)
3- Applying Ensemble techniques.
4- Attempting a combination of a LLM/Embedding approach.
