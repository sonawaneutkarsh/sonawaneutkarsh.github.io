// Every published project, in one place. The homepage's Selected projects
// and More experiments, and every card and detail panel on /explore/, render
// from these records, so a fact changed here changes everywhere. The text is
// copied unchanged from Portfolio V3 (index.html and explore/index.html at
// 36fe033); scripts/check_content_parity.py compares the built pages with it.
//
// Strings ending in `Html` are trusted, hand-written fragments (only <strong>
// and <a>), rendered with {@html}.

import { SITE } from './site.ts';

export interface ProjectLink {
	label: string;
	href: string;
	/** Rendered as a pill button, as on the V3 pages. */
	pill?: boolean;
}

export type Area = 'ai' | 'apps' | 'systems' | 'research' | 'other';

export interface Illustration {
	src: string;
	width: number;
	height: number;
}

export interface Figure extends Illustration {
	alt: string;
	caption: string;
}

export interface Project {
	id: string;
	name: string;
	/** Where the name links: the case study, or the repo when there is none. */
	href: string;
	areas: Area[];
	/** Line under the name on the homepage and the explorer (date · team · stack). */
	meta?: string;
	/** Main description. Plain text unless `summaryHtml` is set. */
	summary?: string;
	summaryHtml?: string;
	status?: { label: string; href: string };
	tech?: string;
	links: ProjectLink[];
	/** Featured on the homepage with an animated illustration. */
	featured?: {
		illustration: Illustration;
		drawing: 'nytr' | 'clage' | 'talks' | 'devvy';
		detail: string;
		metricStrong: string;
		metricRest: string;
	};
	bench: {
		pos: [number, number];
		note: string;
		tags: string;
		sketch: Illustration | { svg: 'pyopt' | 'medclarity' | 'scholarai' };
		/** Explorer-only additions that the homepage does not repeat. */
		figure?: Figure;
		caveat?: string;
		titleHtml?: string;
		researchStatus?: string;
		connections?: { to: string; label: string }[];
	};
}

const gh = (repo: string) => `${SITE.github}/${repo}`;
const SCHOLAR_REPO = 'https://github.com/faridabachir769-code/USAII_GlobalAI-Hackathon-2026_ScholarAI';

export const AREAS: { id: Area; label: string }[] = [
	{ id: 'ai', label: 'AI & machine learning' },
	{ id: 'apps', label: 'Applications' },
	{ id: 'systems', label: 'Systems & developer tools' },
	{ id: 'research', label: 'Research' },
	{ id: 'other', label: 'Other experiments' }
];

/** Explorer order (Previous/Next follow it). */
export const projects: Project[] = [
	{
		id: 'clage',
		name: 'Clage',
		href: '/projects/clage/',
		areas: ['ai'],
		summary:
			'A from-scratch neuroevolution engine and local browser workbench for inspecting agents, experiments, and deterministic replay.',
		tech: 'Python, FastAPI, JavaScript, Canvas · pytest, Playwright, mypy, Ruff',
		links: [
			{ label: 'Case study', href: '/projects/clage/', pill: true },
			{ label: 'Code', href: gh('Clage'), pill: true },
			{ label: 'Demo', href: '/projects/clage/#demo' }
		],
		featured: {
			illustration: { src: '/images/illustrations/clage.webp', width: 386, height: 308 },
			drawing: 'clage',
			detail:
				'From-scratch NEAT engine evolving neural agents in a 2D ecosystem. Clage Studio 1.0 adds live browser visualization, neural-network inspection, evolutionary lineage, reproducible experiments, and deterministic replay.',
			metricStrong: '429 Python tests + 4 JavaScript tests + 21 browser workflows in CI',
			metricRest: 'OR/AND/XOR 5/5; sine 0/5 with minimal initialization'
		},
		bench: {
			pos: [60, 75],
			note: 'neuroevolution engine',
			tags: 'AI & machine learning',
			sketch: { src: '/images/illustrations/clage.webp', width: 386, height: 308 },
			figure: {
				src: '/images/previews/clage-studio-demo-poster-640.webp',
				width: 640,
				height: 319,
				alt: 'Frame from the Clage Studio demo: the live ecosystem view and population chart',
				caption: 'Poster frame from the Clage Studio demo video.'
			},
			connections: [{ to: 'pyopt', label: 'machine learning' }]
		}
	},
	{
		id: 'pyopt',
		name: 'PyOpt',
		href: gh('pyopt-slm-exp'),
		areas: ['ai'],
		meta: 'Sep 2026 · Qwen3-4B, LoRA, Unsloth',
		summaryHtml:
			'LoRA-tuned a 4B model to rewrite Python functions to run faster, scored by running the code. Published v1.1 run: correct 40/40 → 40/40, faster 29/40 → 36/40, median speedup 3.57× → 5.65×; out-of-distribution probe base 9/10, LoRA 8/10. <strong>Caveat:</strong> 13 of the 40 test prompts leaked from training, so this is not a clean held-out result. The split is fixed in v1.2; the model is not retrained yet.',
		links: [{ label: 'Code', href: gh('pyopt-slm-exp'), pill: true }],
		bench: {
			pos: [350, 245],
			note: 'LoRA code optimizer',
			tags: 'AI & machine learning',
			sketch: { svg: 'pyopt' },
			connections: [{ to: 'adr-research', label: 'language models' }]
		}
	},
	{
		id: 'nytr',
		name: 'Nytr',
		href: '/projects/nytr/',
		areas: ['apps'],
		summary:
			'A nutrition and training app built around Penn State dining data. Deterministic recommendations, a Python backend, and a native iOS client.',
		status: { label: 'lessons from building it', href: '/blog/why-i-stopped-working-on-nytr-problems-and-lessons/' },
		tech: 'Python, FastAPI, PostgreSQL (Supabase, row-level security) · Swift, SwiftUI, HealthKit',
		links: [
			{ label: 'Case study', href: '/projects/nytr/', pill: true },
			{ label: 'Code', href: gh('Nytr'), pill: true },
			{ label: 'Demo', href: '/projects/nytr/#demo' }
		],
		featured: {
			illustration: { src: '/images/illustrations/nytr-v2.webp', width: 645, height: 433 },
			drawing: 'nytr',
			detail:
				'A nutrition and training app built around the food my campus dining hall serves each day. A Python backend computes meal and training guidance with exact arithmetic and versioned, append-only records. A SwiftUI app reads HealthKit and shows the result.',
			metricStrong: '1,135 backend tests (1,124 passing in CI with Postgres)',
			metricRest: '251 iOS XCTest cases'
		},
		bench: {
			pos: [630, 75],
			note: 'nutrition & training',
			tags: 'Applications',
			sketch: { src: '/images/illustrations/nytr-v2.webp', width: 645, height: 433 },
			figure: {
				src: '/images/previews/nytr-demo-poster-640.webp',
				width: 640,
				height: 360,
				alt: 'Frame from the Nytr demo video: the Today screen on iPhone',
				caption: 'Poster frame from the Nytr demo video.'
			},
			connections: [{ to: 'talks', label: 'Swift · SwiftUI' }]
		}
	},
	{
		id: 'talks',
		name: 'Talks',
		href: '/projects/talks/',
		areas: ['apps'],
		summary:
			'Record on Apple Watch; transcribe and summarize on iPhone; save to Notion. Built around recoverable transfers and persistent jobs.',
		tech: 'Swift 6, SwiftUI, watchOS, iOS · WatchConnectivity · SpeechAnalyzer · Foundation Models · Notion API',
		links: [
			{ label: 'Case study', href: '/projects/talks/', pill: true },
			{ label: 'Code', href: gh('Talks'), pill: true }
		],
		featured: {
			illustration: { src: '/images/illustrations/talks-v2.webp', width: 486, height: 371 },
			drawing: 'talks',
			detail:
				'Record a meeting on Apple Watch. The audio moves to the iPhone in the background, is transcribed and summarized on device, and is saved to Notion. A persistent job queue and acknowledgement-gated deletion keep recordings safe through crashes and disconnects.',
			metricStrong: '57 XCTest cases passing in CI',
			metricRest: 'iOS and watchOS builds on macOS runners'
		},
		bench: {
			pos: [950, 75],
			note: 'watch → phone → Notion',
			tags: 'Applications',
			sketch: { src: '/images/illustrations/talks-v2.webp', width: 486, height: 371 },
			caveat:
				'CI tests the code on each side of the watch–phone boundary; end-to-end behavior needs a real iPhone and Apple Watch.'
		}
	},
	{
		id: 'medclarity',
		name: 'MedClarity',
		href: gh('MedClarity'),
		areas: ['apps', 'ai'],
		meta: '2026 · React, TypeScript, Express, Gemini API',
		summaryHtml:
			'Ask one question across several medical PDFs. One Gemini request returns an answer with page-level citations, and each citation is checked against the loaded documents. <strong>66 Vitest unit tests passing in CI.</strong>',
		links: [
			{ label: 'Code', href: gh('MedClarity'), pill: true },
			{ label: 'Live demo', href: 'https://medclarity-one.vercel.app', pill: true }
		],
		bench: {
			pos: [790, 255],
			note: 'cited answers from PDFs',
			tags: 'Applications · AI & machine learning',
			sketch: { svg: 'medclarity' },
			connections: [{ to: 'adr-research', label: 'evidence checks' }]
		}
	},
	{
		id: 'devvy',
		name: 'Devvy',
		href: '/projects/devvy/',
		areas: ['systems'],
		summary:
			'One local daemon coordinates Discord presence across coding tools while keeping prompts, code, and full paths private.',
		tech: 'JavaScript (Node.js), TypeScript integrations · Discord IPC · GitHub Actions',
		links: [
			{ label: 'Case study', href: '/projects/devvy/', pill: true },
			{ label: 'Code', href: gh('devvy'), pill: true }
		],
		featured: {
			illustration: { src: '/images/illustrations/devvy.webp', width: 464, height: 357 },
			drawing: 'devvy',
			detail:
				"A local daemon that owns one Discord connection and picks which coding tool to show. It speaks Discord's binary IPC protocol directly and never shows prompts, code, or paths.",
			metricStrong: '26 test scripts, all run in CI',
			metricRest: 'releases only after CI passes · macOS released'
		},
		bench: {
			pos: [125, 550],
			note: 'one daemon, one status',
			tags: 'Systems & developer tools',
			sketch: { src: '/images/illustrations/devvy.webp', width: 464, height: 357 },
			caveat: 'Windows support is on main but ships with the next release, v4.1.0.'
		}
	},
	{
		id: 'adr-research',
		name: 'ADR extraction',
		href: '/#research',
		areas: ['research'],
		meta: 'Undergraduate research · Penn State · 2026–present',
		summaryHtml: `With <a href="${SITE.advisor.href}">${SITE.advisor.name}</a>, I’m studying how language models can identify reported drug–reaction relationships in Reddit discussions. The work compares direct prompting, retrieval-augmented generation, and extraction with verification against human annotations.`,
		links: [
			{ label: 'Research summary', href: '/#research', pill: true },
			{ label: 'Research notebook', href: '/notebook/', pill: true },
			{ label: 'Illustrated workflow', href: '/notebook/adr-extraction-demo/', pill: true }
		],
		bench: {
			pos: [525, 550],
			note: 'in progress · undergraduate research',
			tags: 'Research',
			titleHtml: 'Extracting adverse drug reaction reports from Reddit',
			researchStatus: 'In progress',
			sketch: { src: '/images/illustrations/evidence.webp', width: 506, height: 525 }
		}
	},
	{
		id: 'scholarai',
		name: 'ScholarAI',
		href: '/projects/scholarai/',
		areas: ['other'],
		meta: 'Jun 2026 · 5-person team · Python, pgvector',
		summary:
			'Scheme-discovery platform from the USAII Global AI Hackathon 2026. Our team was a finalist among 6,081+ participants. My part was the data engineering: normalization, embeddings, and pgvector ingestion for 1,008 schemes.',
		links: [
			{ label: 'Case study', href: '/projects/scholarai/', pill: true },
			{ label: 'Team repo', href: SCHOLAR_REPO, pill: true },
			{ label: 'My code (data-engineering/)', href: `${SCHOLAR_REPO}/tree/main/data-engineering`, pill: true }
		],
		bench: {
			pos: [905, 550],
			note: 'hackathon · team project',
			tags: 'Other experiments',
			sketch: { svg: 'scholarai' }
		}
	}
];

/** Homepage order: the four featured rows, then More experiments. */
export const featuredProjects = ['nytr', 'clage', 'talks', 'devvy'].map((id) => byId(id));
export const moreExperiments = ['medclarity', 'pyopt', 'scholarai'].map((id) => byId(id));

export function byId(id: string): Project {
	const project = projects.find((p) => p.id === id);
	if (!project) throw new Error(`Unknown project ${id}`);
	return project;
}

/** External links open in place but tell the browser not to share the opener. */
export const isExternal = (href: string) => /^https?:\/\//.test(href);
