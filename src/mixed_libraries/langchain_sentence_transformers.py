import spacy
import numpy as np
from langchain.embeddings import OpenAIEmbeddings
from sentence_transformers import SentenceTransformer, util

# CONSTANTS
API_KEY = ""
nlp = spacy.load("en_core_web_sm")  # load the english model for spacy
embeddings_model = OpenAIEmbeddings(openai_api_key=API_KEY)
sentence_model = SentenceTransformer('paraphrase-distilroberta-base-v2') # no thought was given to the model selection, just picked one from the other file and it just worked.

# questions generated via chatgpt so it might be funky.
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

# List of questions
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


def preprocess(text):
    tokens = [token.text for token in nlp(text)]
    return ' '.join(tokens)


def extract_named_entities(text):
    doc = nlp(text)
    return [(ent.text.lower(), ent.label_) for ent in doc.ents]


def named_entity_embeddings(text):
    named_entities = extract_named_entities(text)
    named_entity_tokens = [f"[{ent_type.upper()}_{ent_text}]" for ent_text, ent_type in named_entities]

    if not named_entity_tokens:
        named_entity_tokens = ["[NO_ENTITY]"]

    entity_embeddings = np.mean([embeddings_model.embed_query(token) for token in named_entity_tokens], axis=0)
    # Todo: move the following rant to the documentation of the project.
    # previous line explanation: using the mean here might be good or bad. The primary reason for using mean here is when user input has different embedding than our questions embedding.
    #  For example in the above line, if we have 2 different sentences that we are comparing, one with 200 dimensional entity, and another with 2 different 200 dimensional entities,
    # then the result will be 200 dimensions for the user input and 400 dimensions for the question input (when we concatenate them).
    # Although the concatenation doesn't care about dimensions, the method np.dot down in the match_questions_ensemble requires equal dimensions. Otherwise it will raise a ValueError.
    # There might be better ways to handle this that I am not aware of, but for the time being this does the trick. We might be diluting the importance of entities count here, but having
    # a strong understanding of people vs companies in terms of importance, how to weigh each, account for multiple entities of the same category...etc is a prerequisite to tackling this problem
    return entity_embeddings


def combine_embeddings(basic_embeddings, entity_embeddings):
    # the purpose of zip here is not the trimming. It's to pair the basic embedding with its proper entity embedding. Otherwise we get a long list of embeddings joined end to end.
    return [np.concatenate((basic, entity)) for basic, entity in zip(basic_embeddings, entity_embeddings)]


def get_embeddings(texts):
    preprocessed_texts = [preprocess(text) for text in texts]
    basic_embeddings = embeddings_model.embed_documents(preprocessed_texts)
    entity_embeddings_list = [named_entity_embeddings(text) for text in texts]
    return combine_embeddings(basic_embeddings, entity_embeddings_list)


def get_ensemble_embeddings(texts):
    # SentenceTransformer Embeddings
    st_embeddings = sentence_model.encode(texts, convert_to_numpy=True)

    # LangChain's OpenAI Embeddings
    preprocessed_texts = [preprocess(text) for text in texts]
    basic_embeddings = embeddings_model.embed_documents(preprocessed_texts)
    entity_embeddings_list = [named_entity_embeddings(text) for text in texts]
    combined_embeddings_openai = combine_embeddings(basic_embeddings, entity_embeddings_list)

    # Concatenate both embeddings
    ensemble_embeddings = [np.concatenate((st_emb, openai_emb)) for st_emb, openai_emb in
                           zip(st_embeddings, combined_embeddings_openai)]

    return ensemble_embeddings


def match_questions_ensemble(questions, user_input, top_n=3, threshold=0.65):
    # Get ensemble embeddings for user input and questions
    user_embedding = get_ensemble_embeddings([user_input])[0]
    all_question_embeddings = get_ensemble_embeddings(questions)

    # Calculate cosine similarities between user input and questions
    cosine_similarities = [
        np.dot(user_embedding, question_embedding) / (
                np.linalg.norm(user_embedding) * np.linalg.norm(question_embedding))
        for question_embedding in all_question_embeddings
    ]

    # Sort questions based on similarities
    sorted_indices = np.argsort(cosine_similarities)[::-1]
    sorted_questions_and_similarities = [
        (questions[i], cosine_similarities[i]) for i in sorted_indices[:top_n]
    ]

    # Debugging: Display top 3 matches
    print("Top 3 results for debugging:")
    for question, similarity in sorted_questions_and_similarities:
        print(f"{question} with similarity score: {similarity:.4f}")
    print("\n")

    # Filter matches above threshold
    matches_above_threshold = [
        (question, sim) for question, sim in sorted_questions_and_similarities if sim > threshold
    ]

    # Fallback if no questions meet the threshold
    if not matches_above_threshold:
        return sorted_questions_and_similarities

    return matches_above_threshold

# testing
# results = match_questions_ensemble(questions, "what are my best accounts")
# print(results)

# Uncomment for testing
# match_questions(questions, "what are my best accounts")
# match_questions_ensemble(questions, "what are my best accounts");
