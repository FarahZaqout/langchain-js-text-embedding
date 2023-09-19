# Question Matching via Text Embedding:

## Section 1: documentation:

## To get started:

- Clone the repo
- pip install -r requirements.txt

## Running tests:

### The sentence transformers libraries (should not be used in actual production code):

```bash
python src/sentence_transformers/test_average.py
python src/sentence_transformers/test_concatenation.py
```

### Langchain alone:

```bash
python src/langchain/test_langchain.py
python src/langchain/test_mismatch.py # (for testing the list of tweaked questions resulting in a mismatch in the notebook implementation)
```

### Ensemble (langchain using openAI mixed with a model from sentence_transformers):

```bash
python src/mixed_libraries/test_mixed_approach.py
python src/mixed_libraries/test_tweaked_ensemble.py
```

To view test results, each test file will output mismatches to a csv file in the same directory (see test file for filename). Current examples also exist at the moment.

### Types of mismatches:

- complete mismatch, where the questions actually mismatch.
- A match that is below the acceptable similarity score threshold.

Each type of mismatch will be represented slightly differently.

- For a complete mismatch all 3 top results will be written into the csv file. This gives more context for debugging/looking for patterns.
- For a mismatch that is a match with low similarity score, only the top result will be written and the 2nd and 3rd results will be replaced with their respective similarity score.

## Text preprocessing:

- For the current implementation, only Tokenization and Named Entity Recognition (NER) are applied.
- Lemmatization was attempted but it actually reduced the accuracy of the models, so I reverted that.
- All preprocessing was done with the spacy library (tokenization and NER).

Tokenization and NER improved the confidence score by about 20% on average, and improved the matching accuracy significantly.

## Text Embedding:

The text embedding is done using `sentence_transformers` and `langchain`. The embedding is done standalone and as an ensemble.

The sentence transformers ensemble provide good insight on how different models can affect the accuracy and/or similarity score. The below snippit shows how each individual model ranks in terms of its similarity score. Adding combinations produce varying results, but the lower the similarity score of a newly added model the lower the overall similarity score produced by an ensemble.

```python
models = [
    # SentenceTransformer('roberta-large-nli-stsb-mean-tokens'), # this yields 63% similarity when used alone.
    # SentenceTransformer('paraphrase-distilroberta-base-v1'), # 59
    SentenceTransformer('paraphrase-MiniLM-L6-v2'), # 71 when used alone.
    # SentenceTransformer('stsb-bert-base'), # 56 when used alone. This is terrible.
    # SentenceTransformer('nli-roberta-base-v2'), # 56. Mismatched on question "what are my best accounts"
    SentenceTransformer('distiluse-base-multilingual-cased') ,# 66
    # SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2'), # 68
    SentenceTransformer('all-mpnet-base-v2') # 68
]
```

Tweaking and playing around with the above list will produce different results.

## Ensemble Approach:

In general, an ensemble approach has a much higher matching accuracy and has yet to produce a single mismatch. Data was tested in 3 different ways:
1- a list of question from the notebook project with more questions added to it
2- the list of tweaked questions that produced a mismatch in the notebook project.
3- 4 tweaked variations of the same list of questions cross examined (matching all combinations available for the 4 sets).

### Ensemble similarity score:

The similarity score of an ensemble model is significantly lower than a standalone implementation.

- Langchain standalone implementation produces similarity scores ranging from 70% to 90%. However, it mismatches quite a few questions.
- sentence_transformers produces similarity scores of around 50-60%, and is not very accurate either.
- An Ensemble of both langchain's openAI embeddings and one of sentence_transformers' models produces a similarity scores of 40-50%, however it has not mismatched a single question.
- The use of more models from langchain's integration (for example google's PALM...etc) instead of the sentence_transformers should boost the similarity score quite a bit assuming that they have better performance than sentence_transformers.

## Conclusion:

Standalone models can achieve relatively high similarity scores, but the real breakthrough in accuracy comes from the ensemble approach. Combining the strengths of multiple embeddings significantly enhances the accuracy, albeit with a trade-off in similarity score. I am unable yet to find a balance between similarity score and matching accuracy. I believe that an ensemble approach, especially with the potential integration of more advanced models from langchain, could pave the way for more reliable and robust question matching.

## Future Directions:

**Optimization:** We could experiment with different weights for each model in the ensemble to find an optimal combination of accuracy/confidence.

**Scalability:** This implementation does not take in consideration performance (timespace complexity...etc) in any meaningful capacity. As the dataset grows, it's essential to assess the scalability of the matching process and address any performance bottlenecks.

## Section 2: Essential concepts:

This section can be viewed after playing with the files and also potentially after reading section 3 and getting confused. I will go over the concepts I understood over the past couple of weeks and explain them here.

- What is a tensor?
- What is cosine similarity and how does it work?
- What is embedding
- What is embeddings concatenation and why use it?

### Text Embedding:

Although depending on other topics, it's best to start here and explain more details later. One thing to note, Vector means a list of numbers.

In embedding, we convert text to vectors of numbers that are fixed in size. The main idea behind text embeddings is to capture the semantic meaning or context of words, phrases, sentences, or entire documents in **dense vector representations**. Then we apply the cosine similarity equation and get an estimate of how similar in meaning the two texts are.

### Dense Vector Representation:

This is a technique that analyzes the words in specific context, rather than in a vaccum. To understand it, we first need to understand `sparse vector representation`:
Let's pretend the English language has 4 words.
Apple, Banana, Chair, Orange.

the sparse vector representation of "Apple" here would be [1, 0, 0, 0]. A one dimensional vector with size 4 (the total of vocabulary in English). The word apple has a vector of [1, 0, 0, 0], Orange has a vector of [0, 0, 0, 1], while chair has [0, 0, 1, 0].

This representation does not deal with any context, the directionality of these 4 words would suggest that they are probably equally dissimilar to each other. We know that Apple and Orange are much more similar than Orange and Chair.

Enter `Dense Vector Representation`:
To add more context, let's say we are analyzing similarity with more context. For this example, we'll use two dimensions:

- Organic vs. Inorganic.
- Round vs not round.

Fully organic items like fruits will have a value close to 1.
Inorganic items will have a value closer to -1.

Roundness Dimension:
Round items will have a value close to 1.
Less round or flat items will have values closer to -1.

#### Representations:

**Apple:**

- Organic: 1 (Fully organic)
- Roundness: 0.9 (Mostly round but not a perfect sphere)
- Representation: (1, 0.9)

**Orange**:

- Organic: 1
- Roundness: 1 (It's pretty round/spherical)
- Representation: (1, 1)

**Banana**:

- Organic: 1
- Roundness: -0.7 (Not round, but not chair)
- Representation: (1, -0.7)

**Chair**:

- Organic: -1 (It's inorganic)
- Roundness: -1 (Not even close to round)
- Representation: (-1, -1)

In this 2D space, vectors that are closer together represent items with more shared characteristics. For example:
Apple and Orange are close because they're both fully organic and round.
Banana, though organic like Apple and Orange, is not round.
Chair is distinct from all fruits not just because it's inorganic but also due to its typical shape (I know some chairs are kinda round don't @me).

Now we can add more context (dimensions) to get better results, for example, how much calcium or pottasium is in said item...etc, and we will get more and more specific results. Notice here that dimensions correlate with the size of a vector. A 2 dimensional embedding of chair is [-1, -1]. If we add a 3rd dimensions it becomes [-1, -1, -0.2]. Dimension here refer to the size (length) of the tensor. In python you will see it referred to as "Shape".

This representation provides a basic idea of how dense embeddings might capture semantic similarities and differences among entities across multiple dimensions.

### Vectors and Tensors

#### Vectors:

A vector can be though of as a list of numbers, more or less. For example, [1,2,3,4,8] is a vector.

#### Tensors:

A tensor is a more broad term that encapsulates vectors, matrices, matrices of vectors...etc. The deeper a tensor is the more dimension it has. The documentation of tensorflow helps with understanding this quite a bit.

Before explaining what a tensor is, we need to know why it's important. Text embedding will convert the text we have to a vector (a type of tensors), and we use these numbers we get to figure out how similar texts are.

- A zero dimensional tensor is called a `scalar` tensor and consists of a single number.
  - For example, 3 is a 0-D tensor.
- A one dimensional tensor is a `vector`.
  - [1,2,3,4,5] is a 1-D tensor.
- A 2D tensors is a matrix, which can be thought of as a list of vectors.

  - `[[1,2,3], [1,2,3], [1,2,3], [1,2,3]]` is a 2 dimensional tensor.
  - Note: `[[1,2,3,4], [2,3,1],[1]]` is not a valid matrix (2d tensor) because each of its rows (the number of lists) has different columns (the length of each list).

- a 3D tensor is a list of matrixes.
  - `[[[1,2,3], [1,2,3], [1,2,3], [1,2,3]], [[1,2,3], [1,2,3], [1,2,3], [1,2,3]], [[1,2,3], [1,2,3], [1,2,3], [1,2,3]]]`. **(this is just a list of the above matrix)**

The dimensions go up indefinitely. This gets more and more difficult to visualize, so we'll stop there. **We only care about vectors** for now, but the nature of tensors is quite interesting.

### Cosine Similarity

Cosine similarity is a metric used to determine the cosine of the angle between two non-zero vectors. Here, we measure how close two vectors are in terms of orientation, regardless of their magnitude.
The way it works is that in vectors `[1,2,3,4,5]` and `2,4,6,8,10]`, each individual number is a representation of directionality. While the length is a representation of magnitude. In cosine similarity, we focus mostly on directionality rather than magnitude. The factors that go in directional similarity are the numbers and the ratios between them. For example, the 2 vectors above should have a similarity of 1, because the 2nd is just the first vectors doubled (each number inside).

The equation can be found on Wikipedia. It boils down to the following:
for vectors A and B, cosine similarity is: `CosineSimilarity = A.B / ||A|| ||B||`

#### Example:

if A = [1, 2], and B = [3, 4]

- **The dot product of A.B** = 1*3 + 2*4 = 3 + 8 = 11
- **The magnitude of A (||A||)** = squareRoot(a[0]^2 + a[1]^2) = squareRoot(1 + 4) = squareRoot(5).
- **The Magnitude of B (||B||)** = squareRoot(b[0]^2 + b[1]^2) = squareRoot(9 + 16) = squareRoot(25) = 5.
- **The cosine similarity** = dot product / (magnitude A \* magintude B).
- Magnitude A _ magintude B = 5 _ squareRoot(5) = 11.1803398875

similarity = 11/11.18... = 0.98 and some change. These two are extremely similar.

If we do the same calculation for the vectors above (1-5 and 2-10) the result will be 1.

#### Here's how it works

- A.B can be viewed as the direction
- ||A|| ||B|| can be viewed as the magnitude.

in the equation, ||A||\*||B|| is used to make sure that the result of the equation is always between -1 and 1. Thus the magnitude is used for normalization and has negligible influence on similarity. The Dividend here is A.B and is what really moves the needle. `[2, 3] and [-2, -3]` have the same magnitude (length) but are in opposing directions, so running the above equation should result a -1.

Here's a good resource to tie things up with
[dimensions and cosine similarity](https://www.pinecone.io/learn/series/nlp/dense-vector-embeddings-nlp/)

### Concatenation

Concatenation of embeddings is basically taking [0.1,0.2,0.3,0.4] and [0.5,0.6,0.7,0.8] and returning [0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8]. These numbers for embeddings will always be between -1 and 1.

Why use concatenation?
The reason we use concatenation is to increase the dimensions of a text embedding, which is to say we get to have more context (in the apple, orange example, each dimension was a different property such as shape and being organic). This will improve the accuracy of our models.

In text embedding, we are dealing with vectors, which are strictly 1 dimensional tensors, so when we say more dimension we mean the size (length) of 1 dimensional tensor. So a list of 900 number is a 1 dimensional tensor of size 900. In python, this is usually referenced with shape(900,). The coma has to do with batch processing. I won't be talking about it here because it's not as relevant to concatenation.

Concatenation will

Given that, what happens if we concatenate [1,2,3,4] and [5,6,7,8] and try to calculate the cosine similarity to [2,4,6,8]?
A = [1, 2, 3, 4, 5, 6, 7, 8]
B = [2, 4, 6, 8]

the dimensions of A and B don't match. We cannot directly compute the cosine similarity between vectors of different lengths. For vectors to be compared using cosine similarity, they need to be of the same dimension for the equation to work. `np.dot` is a python implementation that will throw a `ValueError` error in this case.

To calculate the cosine similarity of different shapes there are multiple ways to do it such as padding, projecting...etc. We won't concern ourselves with that for the time being.

## Section 3: Implementation highlights:

This section will dive a little bit into the technical details of the implementation, and why certain decision were made. I will be explaining the final version of the experiment (Ensemble with langchain/senetence_transformers).

The main file (src/mixed_libraries/langchain_sentence_transformers.py) can be broken down into the following functions:

- `preprocess(text)`: Tokenizes the given text using spaCy.
- `extract_named_entities(text)`: Extracts named entities from text using spaCy.
- `named_entity_embeddings(text)`: Converts named entities to embeddings.
- `combine_embeddings(basic_embeddings, entity_embeddings)`: Combines standard embeddings with named entity embeddings.
- `get_ensemble_embeddings(texts)`: Produces ensemble embeddings by combining embeddings from SentenceTransformer and OpenAIEmbeddings.

### Extracting Named Entities:

The extraction and separate embedding of named entities is done to give more significance to the unique semantic meaning of named entities, as they can significantly alter the intended matching result.

```python
def named_entity_embeddings(text):
    named_entities = extract_named_entities(text)
    named_entity_tokens = [f"[{ent_type.upper()}_{ent_text}]" for ent_text, ent_type in named_entities]

    if not named_entity_tokens:
        named_entity_tokens = ["[NO_ENTITY]"]

    entity_embeddings = np.mean([embeddings_model.embed_query(token) for token in named_entity_tokens], axis=0)
    return entity_embeddings
```

The above code is responsible for embedding the entities such as people and company names. The main nuance here is that we are using the `np.mean` calculate the average of all extracted entities. It's oddly named mean, but it calculates the `average`.

### Averaging the embeddings of named entities:

Averaging the embedding means that the dimensionality of entities remain consistent. This is significant despite us using concatenation (more on that later). When trying to calculate similarities, we are essentially multiplying matrices/tensors. Making sure we have consistent dimensions avoids `ValueErros` that result from multiplying tensors with incompatible shapes (more on tensor shapes later).

### The use of python's `zip`:

The function is used in multiple places in the code, for good reason.
Roughly speaking, we can think of the zip function as a combiner of tuples. The below code from w3 schools explains how it works:

```python
a = ("John", "Charles", "Mike")
b = ("Jenny", "Christy", "Monica", "Vicky")
c = ("Jenny", "Christy", "Monica", "Vicky")
x = zip(a, b, c)
# output: (('John', 'Jenny', 'Jenny'), ('Charles', 'Christy', 'Christy'), ('Mike', 'Monica', 'Monica'))
```

another example:

```python
a = [1, 2, 3]
b = ['a', 'b', 'c']
c = ['x', 'y', 'z']

zipped = list(zip(a, b, c))
# Result: [(1, 'a', 'x'), (2, 'b', 'y'), (3, 'c', 'z')]
```

In the first example, although `b` and `c` each have 4 items, the output tuples were of 3 items. It will always return the shortest full length among the tuples, in this case 3.

This is useful because in our code, as we extract the Named Entity embeddings, we can pair them with the original text embeddings to create tuples that ensure consistent pairing.

### Concatenation of embeddings:

In our `combine_embeddings` and `get_ensemble_embeddings` we are using the `np.concatenate` method.

## Todo: complete the document.
