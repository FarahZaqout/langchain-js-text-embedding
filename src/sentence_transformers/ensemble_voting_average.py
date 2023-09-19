import spacy
from sentence_transformers import SentenceTransformer, util
import numpy as np

# Load the spaCy model for English.
nlp = spacy.load("en_core_web_sm")

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

user_inputs = [
    # Existing questions:
    "Can you tell me Nokia's current intent score?",
    "The last interaction we had with Yahoo was when?",
    "Identify all the leads linked to Dell.",
    "Which of my accounts have significant whitespace?",
    "Show me the most recent leads from Alibaba.",
    "Where can I find my whitespace data?",
    "What type of leads does Michael possess?",
    "Are there accounts that might have similar victories to Instagram?",
    "Provide the recent successes of HP.",
    "Can you identify every contact related to this account?",
    "Which accounts are next on my list to work on?",
    "How many business agreements are set with Hulu?",
    "Who are the leads Jennifer is currently handling?",
    "Identify the contacts Mike is overseeing.",
    "What's the renewal date for Tidal?",
    "Can you provide details on LG's most recent deal?",
    "Any leads linked to WooCommerce in my list?",
    "Describe the latest event we had with Cisco.",
    "Who was the last to engage with Pinterest on our behalf?",
    "How do Sony's earlier successes appear?",
    "Describe the methodology Kevin uses to boost Instagram engagement.",
    "Provide the newest updates from Jessica's account list.",
    "Who from our leads or contacts attended meetings in the last three days?",
    "Identify every channel partner linked with my portfolio.",
    # New questions:
    "Describe our most recent engagement with Nokia.",
    "Who oversees Yahoo's account on our end?",
    "Are there any prospective deals in the pipeline with Dell?",
    "Has Michael seen success with his current leads?",
    "Compared to the previous month, how is BlackBerry's intent score?",
    "Any notable activities from Alibaba recently?",
    "Identify our main liaison at Tidal.",
    "In what way does Instagram differ in its renewal protocols?",
    "Any upcoming WooCommerce events or webinars we should be aware of?",
    "The last deal Jennifer finalized with HP was when?",
    "Have we gotten any reviews or feedback from Hulu?",
    "Which of Yahoo's contacts recently engaged with our materials?",
    "How are we progressing towards our Q4 objectives with Sony?",
    "What kind of assistance does Pinterest often request?",
    "Did the Cisco team provide comments from our last engagement?",
    "Which accounts managed by Kevin have a promising future?",
    "How many months has Jessica been overseeing LG's account?",
    "Any pending issues or concerns regarding Instagram?",
    "Members of which team frequently engage with Dell?",
    "Outline the next key events or goals for the Nokia account."
]


# List of models for the ensemble. Should all be focused on semantic similarity rather than lexical or syntactic or whatever.
# just add/remove from the list and the voting still works fine. Python stonks!
models = [
    SentenceTransformer('roberta-large-nli-stsb-mean-tokens'),
    SentenceTransformer('paraphrase-distilroberta-base-v1'),
    SentenceTransformer('paraphrase-MiniLM-L6-v2'),
    SentenceTransformer('stsb-bert-base'),
    SentenceTransformer('nli-roberta-base-v2'),
    # SentenceTransformer('distiluse-base-multilingual-cased') # Let's stop at 5 for now. I don't wanna look at a 7th, which is a requirement for a voting thing.
]


def preprocess(text: str) -> str:
    # Convert to lowercase and tokenize without lemmatization.
    text = text.lower()
    tokens = [token.text for token in nlp(text)]

    return ' '.join(tokens)


def get_embeddings(model, texts: [str]) -> [list]:
    preprocessed_texts = [preprocess(text) for text in texts]
    return model.encode(preprocessed_texts)


def match_questions(questions: [str], user_input: str, top_n=3, threshold=0.80) -> list:
    combined_scores = np.zeros(len(questions))

    for model in models:
        user_input_embed = model.encode([preprocess(user_input)])[0]
        question_embeddings = get_embeddings(model, questions)

        similarities = [util.pytorch_cos_sim(user_input_embed, question_embed).item() for question_embed in
                        question_embeddings]

        combined_scores += np.array(similarities)

    # average the scores
    combined_scores /= len(models)

    # rank the questions
    most_similar_idxs = np.argsort(combined_scores)[-top_n:][::-1]
    above_threshold_idxs = [idx for idx in most_similar_idxs if combined_scores[idx] >= threshold]

    results = [{"question": questions[idx], "similarity": combined_scores[idx]} for idx in most_similar_idxs]

    if not above_threshold_idxs:
        print("No matches found that meet the similarity threshold.")
    else:
        print("Matches above the threshold:")
        for idx in above_threshold_idxs:
            print(questions[idx], "with similarity score:", combined_scores[idx])

    print("\nTop 3 results for debugging:")
    for res in results:
        print(res["question"], "with similarity score:", res["similarity"])

    return results


match_questions(questions, "what are my best accounts")
