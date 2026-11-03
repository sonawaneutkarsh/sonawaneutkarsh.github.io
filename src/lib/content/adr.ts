// The illustrated ADR extraction walkthrough: three invented posts, their
// hand-fixed annotations, and the six stages. Copied unchanged from the V3
// page (notebook/adr-extraction-demo/index.html at 36fe033). Nothing here is
// model output, real data or a research result.

export type Verdict = 'supported' | 'rejected' | 'flagged' | 'uncertain';

export interface Mark {
	id: string;
	kind: 'drug' | 'reaction';
	text: string;
	/** Standard term a reaction mention is mapped to. */
	norm?: string;
}

export type Segment = string | Mark;

export interface Pair {
	from: string;
	to: string;
	verdict: Verdict;
	drug: string;
	reaction: string;
	verdictLabel: string;
	reason: string;
}

export interface Example {
	button: string;
	caption: string;
	text: Segment[];
	pairs: Pair[];
}

export const STEPS = [
	'Original text',
	'Drug mentions',
	'Reaction mentions',
	'Candidate pairs',
	'Review',
	'Not causation'
] as const;

export const EXAMPLES: Example[] = [
	{
		button: '1 · Clear report',
		caption: 'Example 1: a clear first-person report',
		text: [
			'I started taking ',
			{ id: 'd1', kind: 'drug', text: 'Drug A' },
			' last month and noticed ',
			{ id: 'r1', kind: 'reaction', text: 'headaches', norm: 'headache' },
			' afterward.'
		],
		pairs: [
			{
				from: 'd1',
				to: 'r1',
				verdict: 'supported',
				drug: 'Drug A',
				reaction: 'headache',
				verdictLabel: 'Supported by the text',
				reason: 'The writer reports taking the drug and the symptom, in that order (“afterward”).'
			}
		]
	},
	{
		button: '2 · Two drugs',
		caption: 'Example 2: two drugs, one reaction that went away',
		text: [
			'Switched from ',
			{ id: 'd1', kind: 'drug', text: 'Drug B' },
			' to ',
			{ id: 'd2', kind: 'drug', text: 'Drug C' },
			'. The ',
			{ id: 'r1', kind: 'reaction', text: 'nausea', norm: 'nausea' },
			' I had on Drug B is gone, but now ',
			{ id: 'r2', kind: 'reaction', text: 'I can’t sleep', norm: 'insomnia' },
			'.'
		],
		pairs: [
			{
				from: 'd1',
				to: 'r1',
				verdict: 'supported',
				drug: 'Drug B',
				reaction: 'nausea',
				verdictLabel: 'Supported by the text',
				reason: '“The nausea I had on Drug B” ties the symptom to that drug.'
			},
			{
				from: 'd2',
				to: 'r2',
				verdict: 'supported',
				drug: 'Drug C',
				reaction: 'insomnia',
				verdictLabel: 'Supported by the text',
				reason: 'Sleep trouble is reported “now”, after the switch to Drug C.'
			},
			{
				from: 'd2',
				to: 'r1',
				verdict: 'rejected',
				drug: 'Drug C',
				reaction: 'nausea',
				verdictLabel: 'Contradicted',
				reason: 'The text says the nausea is gone on Drug C. Pairing every drug with every symptom would get this wrong.'
			}
		]
	},
	{
		button: '3 · Hedged report',
		caption: 'Example 3: someone else’s symptom and a hedged one',
		text: [
			'My sister gets ',
			{ id: 'r1', kind: 'reaction', text: 'dizzy', norm: 'dizziness' },
			' on ',
			{ id: 'd1', kind: 'drug', text: 'Drug D' },
			'. I’ve been on it a week and feel fine, just a bit ',
			{ id: 'r2', kind: 'reaction', text: 'tired', norm: 'fatigue' },
			', probably from finals though.'
		],
		pairs: [
			{
				from: 'd1',
				to: 'r1',
				verdict: 'flagged',
				drug: 'Drug D',
				reaction: 'dizziness',
				verdictLabel: 'Reported about another person',
				reason:
					'The writer describes their sister. Whether that counts depends on the annotation guidelines, so it is flagged rather than accepted.'
			},
			{
				from: 'd1',
				to: 'r2',
				verdict: 'uncertain',
				drug: 'Drug D',
				reaction: 'fatigue',
				verdictLabel: 'Uncertain: abstain',
				reason: 'The writer offers another cause (“probably from finals”). A careful system can decline to assert a pair.'
			}
		]
	}
];

/** One explanation per stage; `html` fragments are trusted, hand-written text. */
export const EXPLANATIONS: { title: string; html: string }[] = [
	{
		title: '1. Original text',
		html: 'The input is informal writing. People use brand names, slang, typos, and hedges, and they describe other people’s experiences as well as their own.'
	},
	{
		title: '2. Drug mentions',
		html: 'The first pass marks spans that name a medication. In the real setting this means handling spelling variants and mapping names to a standard vocabulary.'
	},
	{
		title: '3. Reaction mentions',
		html: 'The next pass marks spans that describe a symptom or side effect. Casual phrases are mapped to a standard term, shown in small type, so “I can’t sleep” and “insomnia” can be compared.'
	},
	{
		title: '4. Candidate pairs',
		html: 'Drug and reaction mentions in the same post are joined into candidate pairs. A candidate is only a hypothesis to check; at this point nothing has been decided.'
	},
	{
		title: '5. Review against the text',
		html: 'Each candidate is checked against the words that support or contradict it. Pairs can be supported, contradicted, flagged for a human decision, or left out when the evidence is too weak. The research plan compares direct prompting, retrieval-augmented generation, and extraction with verification against human annotations.'
	},
	{
		title: '6. A report is not proof of causation',
		html: 'Even a well-supported pair only says that someone <em>reported</em> a reaction while taking a drug. It does not show the drug caused it: the timing could be coincidence, other medications or conditions could be involved, and online posts are not a representative sample. Extracted pairs are signals for further study, not medical findings, and nothing on this page is medical advice.'
	}
];

export const CAUTION_SUFFIX = ' Reported together, not shown to be caused.';
