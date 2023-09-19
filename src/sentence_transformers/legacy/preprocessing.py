import spacy
from sklearn.feature_extraction.text import TfidfVectorizer
from sentence_transformers import SentenceTransformer, util
import numpy as np
import json
import re

# Set up our libraries config.
model = SentenceTransformer('paraphrase-MiniLM-L6-v2') # This is one of the smaller and faster models, we can look into other models later.
nlp = spacy.load("en_core_web_sm") # Load the spaCy model for English.
COMMON_WORDS = set(["who", "why", "what", "where", "when", "how", "by", "being", "all"])
WH_QUESTIONS = ["who", "whom", "whose", "what", "where", "when", "why", "which", "how"]


def replace_entities(text: str) -> str:
    doc = nlp(text)
    for ent in doc.ents:
        if ent.label_ == 'PERSON':
            text = text.replace(ent.text, '{{person}}')
        elif ent.label_ in ['ORG', 'GPE']:
            text = text.replace(ent.text, '{{entity}}')
    return text


def lemmatize_word(word: str) -> str:
    COMMON_WORDS = {"who", "why", "what", "where", "when", "how", "by", "being", "all"}
    if word.lower() in COMMON_WORDS:
        return word
    return nlp(word)[0].lemma_




def emphasize_wh_questions(text: str) -> str:
    WH_QUESTIONS = ["who", "whom", "whose", "what", "where", "when", "why", "which", "how"]

    for question_word in WH_QUESTIONS:
        text = re.sub(f'\\b{question_word}\\b', f'{question_word} {question_word} {question_word}', text,
                      flags=re.IGNORECASE)
    return text


def preprocess(text: str) -> str:
    text = text.lower()
    text = replace_entities(text)
    text = emphasize_wh_questions(text)
    words = text.split(' ')
    lemmatized_words = [lemmatize_word(word) for word in words]
    return ' '.join(lemmatized_words)

def get_embeddings(texts: [str]) -> [list]:
    preprocessed_texts = [preprocess(text) for text in texts]
    return model.encode(preprocessed_texts)


def match_questions(questions: [str], user_input: str, top_n=3) -> list:
    user_input_embed = model.encode([preprocess(user_input)])[0]
    question_embeddings = get_embeddings(questions)

    similarities = [util.pytorch_cos_sim(user_input_embed, question_embed) for question_embed in question_embeddings]
    most_similar_idxs = np.argsort(similarities)[-top_n:][::-1]
    print(most_similar_idxs)

    results = [{"question": questions[idx[0][0]], "similarity": similarities[idx[0][0]]} for idx in most_similar_idxs]

    for res in results:
        print(res["question"], "with similarity score:", res["similarity"])

    return results


with open('langchain/questions.json', 'r') as f:
    questions_from_file = json.load(f)

match_questions(questions_from_file, "what are my best accounts")
