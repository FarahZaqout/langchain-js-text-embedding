
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
