import spacy
from sentence_transformers import SentenceTransformer, util
import numpy as np

# Load the spaCy model for English and stopwords.
nlp = spacy.load("en_core_web_sm")
stopwords = set(spacy.lang.en.stop_words.STOP_WORDS)

questions = [
    # Existing questions:
    "What is the intent score of Apple?",
    "When was the last time we interacted with Google?",
    "Who are all the leads associated with Microsoft?",
    "List my accounts with the most whitespace?",
    "What are the last Amazon leads?",
    "Where is my whitespace?",
    "What leads do John have?",
    "Which accounts will result in a win like account Facebook?",
    "What are the last Oracle company wins?",
    "Who are all the contacts associated with this account?",
    "What accounts should I work on next?",
    "How many deals do we have for account Netflix?",
    "What leads are being worked on by Alice?",
    "What contacts are being worked on by Bob?",
    "When is the renewal due for Spotify?",
    "What was the last deal at company Adobe?",
    "Do I have any leads in account Shopify?",
    "What was the last interaction with IBM?",
    "When was the last interaction with account Twitter, and by whom?",
    "What do previous wins look like in Samsung?",
    "How do George generate Facebook pipeline?",
    "What is the latest in Maria's accounts?",
    "Which contacts/leads attended meetings in the past 3 days?",
    "Who are all the channel partners associated with my accounts?",
    # New questions:
    "How did our last interaction with Apple go?",
    "Who is managing the account for Google?",
    "What potential opportunities do we have with Microsoft?",
    "Has John had any success with his leads?",
    "How does Tesla's intent score compare to last month?",
    "Are there any updates on Amazon's recent activity?",
    "Who is our primary contact at Spotify?",
    "How does Facebook's renewal process differ from others?",
    "Are there any upcoming events or webinars for Shopify customers?",
    "When did Emma last close a deal with Oracle?",
    "What feedback have we received from Netflix?",
    "Who were the last contacts from Google to engage with our content?",
    "How are we tracking against our Q4 goals with Samsung?",
    "What type of support does Twitter require?",
    "Is there any feedback from the last meeting with IBM's team?",
    "Which of George's accounts have the highest growth potential?",
    "How long has Maria been managing the Adobe account?",
    "Are there any unresolved issues with Facebook?",
    "Which team members have had the most interaction with Microsoft?",
    "What are the upcoming milestones for the Apple account?"
]

# Set up our libraries config.
# model = SentenceTransformer('paraphrase-distilroberta-base-v1')
# model = SentenceTransformer('bert-base-nli-mean-tokens') # this completely ruins the accuracy. all top 3 results are misses.
model = SentenceTransformer('roberta-large-nli-stsb-mean-tokens')

def preprocess(text: str) -> str:
    # Convert to lowercase
    text = text.lower()

    # Tokenize and lemmatize
    doc = nlp(text)
    lemmas = [token.lemma_ for token in doc]

    # Remove stopwords and return
    return ' '.join([lemma for lemma in lemmas if lemma not in stopwords])


def get_embeddings(texts: [str]) -> [list]:
    preprocessed_texts = [preprocess(text) for text in texts]
    return model.encode(preprocessed_texts)


def match_questions(questions: [str], user_input: str, top_n=3, threshold=0.80) -> list:  # Set threshold as 80%
    user_input_embed = model.encode([preprocess(user_input)])[0]

    question_embeddings = get_embeddings(questions)

    similarities = [util.pytorch_cos_sim(user_input_embed, question_embed).item() for question_embed in
                    question_embeddings]
    most_similar_idxs = np.argsort(similarities)[-top_n:][::-1]

    above_threshold_idxs = [idx for idx in most_similar_idxs if similarities[idx] >= threshold]

    results = [{"question": questions[idx], "similarity": similarities[idx]} for idx in most_similar_idxs]

    if not above_threshold_idxs:
        print("No matches found that meet the similarity threshold.")
    else:
        print("Matches above the threshold:")
        for idx in above_threshold_idxs:
            print(questions[idx], "with similarity score:", similarities[idx])

    print("\nTop 3 results for debugging:")
    for res in results:
        print(res["question"], "with similarity score:", res["similarity"])

    return results


match_questions(questions, "what are my best accounts")