document.addEventListener('DOMContentLoaded', function () {
    const OVERLAY_MODES = new Set(['off', 'resonance', 'drift']);
    const TRAIL_KEY = 'syntheticism-trail-v1';
    const MODE_KEY = 'syntheticism-overlay-mode';
    const GLITCH_KEY = 'syntheticism-glitch-v1';
    const CONTROL_KEY = 'syntheticism-controls-v1';
    const VISITS_KEY = 'syntheticism-visits-v1';
    const NOTES_KEY = 'syntheticism-notes-v1';
    const BLOCK_SELECTOR = '.content p, .content li, .content blockquote';
    const GITHUB_ISSUE_BASE = 'https://github.com/ComputerLars/The-Syntheticist-Papers/issues/new';
    const HOT_TERMS = [
        'summit', 'manifesto', 'protocol', 'synthetic', 'party', 'algorithm',
        'idiotext', 'tragedy', 'spectacle', 'archive', 'drift', 'wormhole'
    ];
    const STOP_WORDS = new Set([
        'about', 'after', 'again', 'against', 'along', 'among', 'around',
        'being', 'between', 'could', 'every', 'first', 'from', 'into',
        'itself', 'might', 'other', 'shall', 'since', 'still', 'their',
        'there', 'these', 'those', 'through', 'toward', 'under', 'until',
        'where', 'which', 'while', 'would', 'yours', 'ours', 'with'
    ]);
    const THEORY_AXES = [
        {
            id: 'immanence',
            label: 'Plane of Immanence',
            keywords: ['immanence', 'plane', 'flight', 'line', 'becoming', 'assemblage', 'deterritorialization']
        },
        {
            id: 'sovereignty',
            label: 'Sovereignty Contestation',
            keywords: ['sovereignty', 'state', 'governance', 'authority', 'legitimacy', 'federation', 'constitution']
        },
        {
            id: 'infrastructure',
            label: 'Infrastructural Struggle',
            keywords: ['infrastructure', 'platform', 'protocol', 'network', 'stack', 'interface', 'repository']
        },
        {
            id: 'algorithmic',
            label: 'Algorithmic Agency',
            keywords: ['algorithm', 'model', 'machine', 'learning', 'compute', 'automation', 'agentic']
        },
        {
            id: 'aesthetic',
            label: 'Aesthetic Detournement',
            keywords: ['spectacle', 'detournement', 'cutup', 'glitch', 'theater', 'staging', 'performance']
        },
        {
            id: 'hermeneutic',
            label: 'Hermeneutic Density',
            keywords: ['interpretation', 'annotation', 'reading', 'archive', 'genealogy', 'trace', 'commentary']
        }
    ];
    const STANCE_AXES = [
        {
            id: 'normative',
            label: 'Normative',
            terms: ['must', 'should', 'need', 'ought', 'demand', 'require', 'imperative']
        },
        {
            id: 'speculative',
            label: 'Speculative',
            terms: ['perhaps', 'maybe', 'might', 'could', 'possible', 'virtual', 'imaginary', 'speculative']
        },
        {
            id: 'agonistic',
            label: 'Agonistic',
            terms: ['against', 'conflict', 'struggle', 'fracture', 'collapse', 'refuse', 'contest', 'contradiction']
        },
        {
            id: 'infrastructural',
            label: 'Infrastructural',
            terms: ['protocol', 'platform', 'infrastructure', 'network', 'stack', 'interface', 'repository']
        },
        {
            id: 'collective',
            label: 'Collective',
            terms: ['collective', 'coalition', 'federation', 'democracy', 'public', 'community', 'movement']
        },
        {
            id: 'mythic',
            label: 'Mythic',
            terms: ['spectacle', 'oracle', 'ghost', 'ritual', 'myth', 'portal', 'theater', 'symbol']
        }
    ];

    const blocks = Array.from(document.querySelectorAll(BLOCK_SELECTOR)).filter(function (element) {
        return element.textContent && element.textContent.trim().length > 80;
    });

    const tokenToBlocks = new Map();
    const blockTokens = new WeakMap();
    const blockOrder = new WeakMap();
    const tokenTransitions = new Map();
    const blockAxisScores = new WeakMap();
    const blockStanceScores = new WeakMap();

    const state = {
        controlsPanel: null,
        controlsMode: null,
        controlsGlitch: null,
        controlsTerm: null,
        controlsHits: null,
        controlsRemote: null,
        controlsRisk: null,
        controlsBadge: null,
        linksLayer: null,
        echoLayer: null,
        toastStack: null,
        mapModal: null,
        mapNodes: null,
        hermModal: null,
        hermList: null,
        hermOpen: false,
        hermPairs: [],
        questModal: null,
        questPrompt: null,
        questChoices: null,
        questStatus: null,
        questOpen: false,
        questStep: 0,
        questRisk: 0,
        questTrace: [],
        logModal: null,
        logPre: null,
        logComment: null,
        logOpen: false,
        portalOverlay: null,
        activeHits: [],
        remoteHits: [],
        activeTerm: '',
        driftVector: null,
        driftVectors: [],
        globalReady: false,
        globalPromise: null,
        globalPassages: [],
        globalTokenToPassages: new Map(),
        globalTokenCounts: new Map(),
        globalTokenTransitions: new Map(),
        redrawPending: false,
        controlsVisible: false,
        mapOpen: false,
        portalTimer: null,
        glitchTimer: null,
        hermCutup: null,
        hermAxis: null,
        questStatsNode: null,
        questRollNode: null,
        questStats: {
            hermeneutics: 2,
            hermetics: 1,
            contestation: 1
        }
    };

    function isEditableTarget(target) {
        if (!target) return false;
        if (target.isContentEditable) return true;
        const tagName = target.tagName ? target.tagName.toUpperCase() : '';
        return /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(tagName);
    }

    function randomItem(array) {
        if (!array.length) return null;
        return array[Math.floor(Math.random() * array.length)];
    }

    function tokenize(text) {
        const matches = text.toLowerCase().match(/[a-zA-Z\u00C0-\u017F]{5,}/g) || [];
        return matches.filter(function (token) {
            return !STOP_WORDS.has(token);
        });
    }

    function extractWords(text) {
        return (text || '').split(/\s+/).filter(Boolean);
    }

    function excerpt(text, maxWords) {
        const words = extractWords((text || '').replace(/\s+/g, ' ').trim());
        if (words.length <= maxWords) return words.join(' ');
        return words.slice(0, maxWords).join(' ') + '...';
    }

    function shorten(text, maxLength) {
        const value = (text || '').trim();
        if (value.length <= maxLength) return value;
        return value.slice(0, Math.max(0, maxLength - 1)).trim() + '...';
    }

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    function escapeHtml(text) {
        return String(text || '').replace(/[&<>"']/g, function (character) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                '\'': '&#39;'
            }[character] || character;
        });
    }

    function readTrail() {
        try {
            const parsed = JSON.parse(localStorage.getItem(TRAIL_KEY) || '[]');
            return Array.isArray(parsed) ? parsed : [];
        } catch (_error) {
            return [];
        }
    }

    function readNotes() {
        try {
            const parsed = JSON.parse(localStorage.getItem(NOTES_KEY) || '[]');
            return Array.isArray(parsed) ? parsed : [];
        } catch (_error) {
            return [];
        }
    }

    function writeNotes(notes) {
        localStorage.setItem(NOTES_KEY, JSON.stringify((notes || []).slice(-64)));
    }

    function menuNodesFromDocument(doc, baseHref) {
        return Array.from(doc.querySelectorAll('.fixed-menu a[href]')).map(function (link, index) {
            const href = new URL(link.getAttribute('href') || '', baseHref || window.location.href).toString();
            const path = canonicalPath(href);
            return {
                href: href,
                path: path,
                label: (link.textContent || '').replace(/\s+/g, ' ').trim() || ('Node ' + (index + 1))
            };
        }).filter(function (node) {
            return Boolean(node.path);
        });
    }

    function passagesFromDocument(doc, path, label) {
        return Array.from(doc.querySelectorAll(BLOCK_SELECTOR)).filter(function (element) {
            return element.textContent && element.textContent.trim().length > 80;
        }).map(function (element, index) {
            const text = (element.textContent || '').replace(/\s+/g, ' ').trim();
            const tokens = tokenize(text);
            return {
                id: path + '#p' + String(index + 1),
                path: path,
                label: label || path,
                text: text,
                excerpt: excerpt(text, 22),
                tokens: tokens,
                tokenSet: new Set(tokens),
                axis: axisVectorFromTokens(tokens),
                stance: stanceVectorFromText(text)
            };
        });
    }

    function addGlobalPassage(passage) {
        if (!passage || !passage.text) return;
        state.globalPassages.push(passage);

        const unique = new Set(passage.tokens || []);
        unique.forEach(function (token) {
            if (!state.globalTokenToPassages.has(token)) state.globalTokenToPassages.set(token, []);
            state.globalTokenToPassages.get(token).push(passage);
            state.globalTokenCounts.set(token, (state.globalTokenCounts.get(token) || 0) + 1);
        });

        const tokens = passage.tokens || [];
        for (let index = 0; index < tokens.length - 1; index += 1) {
            const left = tokens[index];
            const right = tokens[index + 1];
            if (!left || !right || left === right) continue;
            incrementNested(state.globalTokenTransitions, left, right, 1);
        }
    }

    async function fetchHtmlDocument(url) {
        try {
            const response = await fetch(url, { credentials: 'same-origin' });
            if (!response.ok) return null;
            const html = await response.text();
            return new DOMParser().parseFromString(html, 'text/html');
        } catch (_error) {
            return null;
        }
    }

    function ensureGlobalCorpus() {
        if (state.globalReady) return Promise.resolve(state.globalPassages);
        if (state.globalPromise) return state.globalPromise;

        state.globalPromise = (async function () {
            const currentPath = canonicalPath(window.location.href);
            const queue = menuNodes().map(function (node) {
                return {
                    href: node.href,
                    path: node.path,
                    label: node.label
                };
            }).filter(function (node) {
                return node.path !== currentPath;
            });

            const visited = new Set([currentPath]);
            const queued = new Set(queue.map(function (node) { return node.path; }));
            const maxPages = 72;
            let pagesIndexed = 0;

            while (queue.length && pagesIndexed < maxPages) {
                const node = queue.shift();
                if (!node || !node.path || visited.has(node.path)) continue;
                queued.delete(node.path);
                visited.add(node.path);

                const doc = await fetchHtmlDocument(node.href);
                if (!doc) continue;

                pagesIndexed += 1;
                passagesFromDocument(doc, node.path, node.label).forEach(addGlobalPassage);

                menuNodesFromDocument(doc, node.href).forEach(function (discovered) {
                    if (!discovered.path || visited.has(discovered.path) || queued.has(discovered.path)) return;
                    queue.push(discovered);
                    queued.add(discovered.path);
                });
            }

            state.globalReady = true;
            state.globalPromise = null;
            appendTrail('global-index', {
                pages: pagesIndexed,
                passages: state.globalPassages.length
            });
            updateControlsStatus();
            return state.globalPassages;
        })();

        return state.globalPromise;
    }

    function incrementNested(map, left, right, amount) {
        if (!map.has(left)) map.set(left, new Map());
        const inner = map.get(left);
        inner.set(right, (inner.get(right) || 0) + (amount || 1));
    }

    function axisVectorFromTokens(tokens) {
        const vector = {};
        THEORY_AXES.forEach(function (axis) {
            vector[axis.id] = 0;
        });
        (tokens || []).forEach(function (token) {
            THEORY_AXES.forEach(function (axis) {
                if (axis.keywords.includes(token)) vector[axis.id] += 1;
            });
        });
        return vector;
    }

    function dominantAxes(vector, limit) {
        return THEORY_AXES
            .map(function (axis) {
                return { id: axis.id, label: axis.label, score: vector[axis.id] || 0 };
            })
            .filter(function (entry) {
                return entry.score > 0;
            })
            .sort(function (a, b) {
                return b.score - a.score;
            })
            .slice(0, limit || 2);
    }

    function mergeAxisVectors(vectors) {
        const output = {};
        THEORY_AXES.forEach(function (axis) {
            output[axis.id] = 0;
        });
        (vectors || []).forEach(function (vector) {
            THEORY_AXES.forEach(function (axis) {
                output[axis.id] += (vector && vector[axis.id]) || 0;
            });
        });
        return output;
    }

    function vectorDistanceForAxes(leftVector, rightVector, axes) {
        let total = 0;
        (axes || []).forEach(function (axis) {
            total += Math.abs((leftVector[axis.id] || 0) - (rightVector[axis.id] || 0));
        });
        return total;
    }

    function vectorTotal(vector, axes) {
        return (axes || []).reduce(function (sum, axis) {
            return sum + ((vector && vector[axis.id]) || 0);
        }, 0);
    }

    function coherenceScore(leftVector, rightVector, axes) {
        const distance = vectorDistanceForAxes(leftVector || {}, rightVector || {}, axes || []);
        const scale = Math.max(1, vectorTotal(leftVector || {}, axes || []) + vectorTotal(rightVector || {}, axes || []));
        return clamp(1 - (distance / scale), 0, 1);
    }

    function stanceVectorFromText(text) {
        const normalized = (text || '').toLowerCase();
        const vector = {};
        STANCE_AXES.forEach(function (axis) {
            let count = 0;
            axis.terms.forEach(function (term) {
                const matches = normalized.match(new RegExp('\\b' + term + '\\b', 'gi'));
                if (matches) count += matches.length;
            });
            vector[axis.id] = count;
        });
        return vector;
    }

    function dominantStances(vector, limit) {
        return STANCE_AXES
            .map(function (axis) {
                return { id: axis.id, label: axis.label, score: vector[axis.id] || 0 };
            })
            .filter(function (entry) {
                return entry.score > 0;
            })
            .sort(function (a, b) {
                return b.score - a.score;
            })
            .slice(0, limit || 2);
    }

    function tokenDocumentFrequency(token) {
        const localCount = tokenToBlocks.has(token) ? tokenToBlocks.get(token).size : 0;
        const globalCount = state.globalReady ? (state.globalTokenCounts.get(token) || 0) : 0;
        return localCount + globalCount;
    }

    function tokenIdf(token) {
        const docs = blocks.length + (state.globalReady ? state.globalPassages.length : 0);
        const df = tokenDocumentFrequency(token);
        return Math.log((docs + 1) / (df + 1)) + 1;
    }

    function overlapDiagnostics(leftTokens, rightTokens, limit) {
        const rightSet = new Set(rightTokens || []);
        const rawOverlap = Array.from(new Set((leftTokens || []).filter(function (token) {
            return rightSet.has(token);
        })));
        const weighted = rawOverlap.map(function (token) {
            return {
                token: token,
                weight: tokenIdf(token)
            };
        }).sort(function (a, b) {
            return b.weight - a.weight;
        });
        const overlap = weighted.slice(0, limit || 6).map(function (entry) {
            return entry.token;
        });
        const bridgeScore = weighted.reduce(function (sum, entry) {
            return sum + entry.weight;
        }, 0);
        const bridgeNorm = bridgeScore <= 0 ? 0 : clamp(bridgeScore / (bridgeScore + 6), 0, 1);
        return {
            overlap: overlap,
            rawOverlap: rawOverlap,
            bridgeScore: bridgeScore,
            bridgeNorm: bridgeNorm
        };
    }

    function sentenceEvidence(leftText, rightText) {
        const leftSentences = sentenceFragments(leftText || '').slice(0, 10);
        const rightSentences = sentenceFragments(rightText || '').slice(0, 10);
        if (!leftSentences.length || !rightSentences.length) return null;

        let best = null;
        leftSentences.forEach(function (leftSentence) {
            const leftTokens = tokenize(leftSentence);
            rightSentences.forEach(function (rightSentence) {
                const rightTokens = tokenize(rightSentence);
                const overlap = overlapDiagnostics(leftTokens, rightTokens, 5);
                const score = overlap.bridgeScore + overlap.rawOverlap.length * 0.8;
                if (!best || score > best.score) {
                    best = {
                        score: score,
                        overlap: overlap.overlap,
                        left: leftSentence,
                        right: rightSentence
                    };
                }
            });
        });

        return best;
    }

    function interpretiveFacets(leftStance, rightStance, overlapData, contradiction, axisCoherence, stanceCoherence) {
        const facets = [];
        if (contradiction) facets.push('negation');
        if ((leftStance.normative || 0) + (rightStance.normative || 0) >= 3) facets.push('normative pressure');
        if ((leftStance.speculative || 0) + (rightStance.speculative || 0) >= 3) facets.push('speculative drift');
        if (Math.abs((leftStance.infrastructural || 0) - (rightStance.infrastructural || 0)) >= 2) facets.push('infrastructure shift');
        if (axisCoherence <= 0.35) facets.push('axis rupture');
        if (stanceCoherence <= 0.3) facets.push('rhetorical divergence');
        if (overlapData.bridgeNorm >= 0.45) facets.push('dense bridge');
        if (!facets.length) facets.push('weak coupling');
        return facets.slice(0, 4);
    }

    function inferRelationKind(overlapData, contradiction, axisCoherence, stanceCoherence) {
        if (contradiction && overlapData.bridgeNorm >= 0.18) return 'friction';
        if (overlapData.bridgeNorm >= 0.45 && axisCoherence >= 0.5) return 'convergence';
        if (overlapData.bridgeNorm >= 0.26 && axisCoherence < 0.5) return 'mutation';
        if (stanceCoherence < 0.35 || axisCoherence < 0.25) return 'aporia';
        if (overlapData.bridgeNorm >= 0.22) return 'mutation';
        return 'aporia';
    }

    function relationConfidence(overlapData, axisCoherence, stanceCoherence, evidenceScore, contradiction) {
        const evidenceNorm = clamp((evidenceScore || 0) / ((evidenceScore || 0) + 4), 0, 1);
        const penalty = contradiction ? 0.06 : 0;
        const score = (overlapData.bridgeNorm * 0.42)
            + (axisCoherence * 0.28)
            + (stanceCoherence * 0.2)
            + (evidenceNorm * 0.16)
            - penalty;
        return Math.round(clamp(score, 0, 1) * 100);
    }

    function buildIndex() {
        blocks.forEach(function (block, index) {
            const tokens = tokenize(block.textContent || '');
            const unique = new Set(tokens);
            blockTokens.set(block, unique);
            blockOrder.set(block, index);
            blockAxisScores.set(block, axisVectorFromTokens(tokens));
            blockStanceScores.set(block, stanceVectorFromText(block.textContent || ''));
            unique.forEach(function (token) {
                if (!tokenToBlocks.has(token)) tokenToBlocks.set(token, new Set());
                tokenToBlocks.get(token).add(block);
            });

            for (let pointer = 0; pointer < tokens.length - 1; pointer += 1) {
                const left = tokens[pointer];
                const right = tokens[pointer + 1];
                if (!left || !right || left === right) continue;
                incrementNested(tokenTransitions, left, right, 1);
            }
        });
    }

    function termPool() {
        const tokens = new Set(tokenToBlocks.keys());
        if (state.globalReady) {
            state.globalTokenCounts.forEach(function (_count, token) {
                tokens.add(token);
            });
        }

        const corpusSize = blocks.length + (state.globalPassages ? state.globalPassages.length : 0);
        const upper = Math.max(2, Math.floor(corpusSize * 0.45));

        return Array.from(tokens).map(function (token) {
            const localCount = tokenToBlocks.has(token) ? tokenToBlocks.get(token).size : 0;
            const globalCount = state.globalReady ? (state.globalTokenCounts.get(token) || 0) : 0;
            return [token, localCount + globalCount];
        }).filter(function (entry) {
            return entry[1] > 1 && entry[1] <= upper;
        });
    }

    function canonicalPath(href) {
        try {
            const url = new URL(href, window.location.origin);
            const trimmed = url.pathname.replace(/\/+$/, '');
            return trimmed || '/';
        } catch (_error) {
            return '';
        }
    }

    function appendTrail(eventName, payload) {
        let trail = readTrail();
        trail.push({
            event: eventName,
            at: new Date().toISOString(),
            page: window.location.pathname,
            payload: payload || {}
        });
        if (trail.length > 64) trail = trail.slice(trail.length - 64);
        localStorage.setItem(TRAIL_KEY, JSON.stringify(trail));
    }

    function readVisits() {
        try {
            const parsed = JSON.parse(localStorage.getItem(VISITS_KEY) || '{}');
            return parsed && typeof parsed === 'object' ? parsed : {};
        } catch (_error) {
            return {};
        }
    }

    function writeVisits(visits) {
        const entries = Object.entries(visits || {});
        if (entries.length > 256) {
            entries.sort(function (a, b) {
                return b[1] - a[1];
            });
            localStorage.setItem(VISITS_KEY, JSON.stringify(Object.fromEntries(entries.slice(0, 256))));
            return;
        }
        localStorage.setItem(VISITS_KEY, JSON.stringify(visits || {}));
    }

    function touchVisit(pathname) {
        if (!pathname) return;
        const visits = readVisits();
        visits[pathname] = (visits[pathname] || 0) + 1;
        writeVisits(visits);
    }

    function visitScore(pathname) {
        const visits = readVisits();
        return visits[pathname] || 0;
    }

    function getModeFromLocation() {
        const url = new URL(window.location.href);
        const queryMode = (url.searchParams.get('overlay') || '').toLowerCase();
        if (OVERLAY_MODES.has(queryMode)) return queryMode;
        const hashModeMatch = (url.hash || '').match(/overlay=(off|resonance|drift)/i);
        if (hashModeMatch) return hashModeMatch[1].toLowerCase();
        const savedMode = (localStorage.getItem(MODE_KEY) || '').toLowerCase();
        if (OVERLAY_MODES.has(savedMode)) return savedMode;
        return 'off';
    }

    function getGlitchFromLocation() {
        const url = new URL(window.location.href);
        const queryGlitch = (url.searchParams.get('glitch') || '').toLowerCase();
        if (['1', 'true', 'on'].includes(queryGlitch)) return true;
        if (['0', 'false', 'off'].includes(queryGlitch)) return false;
        return localStorage.getItem(GLITCH_KEY) === '1';
    }

    function getControlsFromStorage() {
        return localStorage.getItem(CONTROL_KEY) === '1';
    }

    function getArrivalFromLocation() {
        const url = new URL(window.location.href);
        const arrival = (url.searchParams.get('arrival') || '').toLowerCase();
        if (!arrival) return null;
        const from = url.searchParams.get('from') || '';
        url.searchParams.delete('arrival');
        url.searchParams.delete('from');
        window.history.replaceState({}, '', url.toString());
        return { arrival: arrival, from: from };
    }

    function ensureToastStack() {
        if (state.toastStack) return state.toastStack;
        const stack = document.createElement('div');
        stack.className = 'synthetic-toast-stack';
        document.body.appendChild(stack);
        state.toastStack = stack;
        return stack;
    }

    function showPulse(message, kind) {
        const stack = ensureToastStack();
        const toast = document.createElement('div');
        toast.className = 'synthetic-toast synthetic-toast-' + (kind || 'info');
        toast.textContent = message;
        stack.appendChild(toast);
        window.setTimeout(function () {
            toast.classList.add('synthetic-toast-out');
            window.setTimeout(function () {
                toast.remove();
            }, 220);
        }, 1700);
    }

    function flash(kind) {
        const classes = [
            'synthetic-flash',
            'synthetic-flash-resonate',
            'synthetic-flash-drift',
            'synthetic-flash-clear',
            'synthetic-flash-wormhole',
            'synthetic-flash-map',
            'synthetic-flash-echo'
        ];
        classes.forEach(function (className) {
            document.body.classList.remove(className);
        });
        document.body.classList.add('synthetic-flash', 'synthetic-flash-' + (kind || 'resonate'));
        window.setTimeout(function () {
            classes.forEach(function (className) {
                document.body.classList.remove(className);
            });
        }, 260);
    }

    function ensureLinkLayer() {
        if (state.linksLayer) return state.linksLayer;
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'synthetic-links-layer');
        svg.setAttribute('viewBox', '0 0 ' + window.innerWidth + ' ' + window.innerHeight);
        svg.setAttribute('width', window.innerWidth);
        svg.setAttribute('height', window.innerHeight);
        document.body.appendChild(svg);
        state.linksLayer = svg;
        return svg;
    }

    function clearLinkLayer() {
        const layer = ensureLinkLayer();
        while (layer.firstChild) layer.removeChild(layer.firstChild);
    }

    function blockCenter(block) {
        if (!block) return null;
        const rect = block.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) return null;
        return {
            x: Math.max(8, Math.min(window.innerWidth - 8, rect.left + rect.width * 0.5)),
            y: Math.max(8, Math.min(window.innerHeight - 8, rect.top + rect.height * 0.5))
        };
    }

    function drawPath(layer, start, end, className) {
        if (!start || !end) return;
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const direction = end.y >= start.y ? 1 : -1;
        const bend = Math.max(36, Math.abs(end.y - start.y) * 0.34) * direction;
        const midX = (start.x + end.x) * 0.5;
        const d = [
            'M', start.x, start.y,
            'C', midX, start.y + bend,
            midX, end.y - bend,
            end.x, end.y
        ].join(' ');
        path.setAttribute('d', d);
        path.setAttribute('class', className);
        layer.appendChild(path);
    }

    function renderConnections() {
        const layer = ensureLinkLayer();
        layer.setAttribute('viewBox', '0 0 ' + window.innerWidth + ' ' + window.innerHeight);
        layer.setAttribute('width', window.innerWidth);
        layer.setAttribute('height', window.innerHeight);
        clearLinkLayer();

        if (!state.activeHits.length && !state.driftVectors.length && !state.hermPairs.length) return;

        const sortedHits = state.activeHits.slice().sort(function (a, b) {
            return a.getBoundingClientRect().top - b.getBoundingClientRect().top;
        });

        for (let index = 0; index < sortedHits.length - 1; index += 1) {
            drawPath(layer, blockCenter(sortedHits[index]), blockCenter(sortedHits[index + 1]), 'synthetic-link');
        }

        state.driftVectors.forEach(function (vector, index) {
            if (!vector || !vector.origin || !vector.target) return;
            drawPath(layer, blockCenter(vector.origin), blockCenter(vector.target), 'synthetic-link-drift synthetic-link-drift-' + String(index + 1));
        });

        state.hermPairs.forEach(function (pair) {
            if (pair && pair.remote) return;
            drawPath(layer, blockCenter(pair.from), blockCenter(pair.to), 'synthetic-link-herm synthetic-link-herm-' + pair.kind);
        });
    }

    function scheduleRedraw() {
        if (state.redrawPending) return;
        state.redrawPending = true;
        window.requestAnimationFrame(function () {
            state.redrawPending = false;
            renderConnections();
        });
    }

    function ensureEchoLayer() {
        if (state.echoLayer) return state.echoLayer;
        const layer = document.createElement('div');
        layer.className = 'synthetic-echo-layer';
        document.body.appendChild(layer);
        state.echoLayer = layer;
        return layer;
    }

    function clearEchoes() {
        const layer = ensureEchoLayer();
        layer.innerHTML = '';
    }

    function spawnEchoes(term, sourceBlocks) {
        const layer = ensureEchoLayer();
        const fallbackTerm = term || state.activeTerm || 'signal';
        const pool = (sourceBlocks && sourceBlocks.length) ? sourceBlocks : (state.activeHits.length ? state.activeHits : blocks);
        if (!pool.length) return;

        clearEchoes();

        const amount = Math.min(4, pool.length);
        const chosen = pool.slice().sort(function () {
            return Math.random() - 0.5;
        }).slice(0, amount);

        const viewportWidth = Math.max(320, window.innerWidth);
        const viewportHeight = Math.max(320, window.innerHeight);

        chosen.forEach(function (block, index) {
            const card = document.createElement('article');
            card.className = 'synthetic-echo';
            card.style.left = Math.round(viewportWidth * (0.06 + Math.random() * 0.7)) + 'px';
            card.style.top = Math.round(viewportHeight * (0.12 + Math.random() * 0.66)) + 'px';
            card.style.animationDelay = (index * 70) + 'ms';
            card.innerHTML = [
                '<div class="synthetic-echo-term">', fallbackTerm, '</div>',
                '<div class="synthetic-echo-text">', excerpt(block.textContent || '', 22), '</div>'
            ].join('');
            layer.appendChild(card);
            window.setTimeout(function () {
                card.classList.add('synthetic-echo-out');
                window.setTimeout(function () {
                    card.remove();
                }, 260);
            }, 3000 + index * 250);
        });

        showPulse('Echo cloud: ' + fallbackTerm, 'echo');
        flash('echo');
        appendTrail('echo', { term: fallbackTerm, count: chosen.length });
    }

    function clearOverlayMarks(options) {
        const config = options || {};
        blocks.forEach(function (block) {
            block.classList.remove(
                'synthetic-hit',
                'synthetic-origin',
                'synthetic-drift-target',
                'synthetic-drift-hop',
                'synthetic-herm-source',
                'synthetic-herm-target'
            );
            delete block.dataset.syntheticTerm;
        });
        delete document.body.dataset.syntheticTerm;

        state.activeHits = [];
        state.remoteHits = [];
        state.activeTerm = '';
        state.driftVector = null;
        state.driftVectors = [];
        state.hermPairs = [];

        clearLinkLayer();
        if (state.hermOpen) closeHermeneutic();
        if (!config.keepEchoes) clearEchoes();
        if (config.message) {
            showPulse('Overlay cleared', 'clear');
            flash('clear');
            appendTrail('clear', {});
        }
        updateControlsStatus();
    }

    function updateControlsStatus() {
        if (!state.controlsPanel || state.controlsPanel.hidden) return;
        if (state.controlsMode) state.controlsMode.textContent = 'mode: ' + (document.body.dataset.syntheticOverlay || 'off');
        if (state.controlsGlitch) state.controlsGlitch.textContent = 'glitch: ' + (document.body.classList.contains('synthetic-glitch') ? 'on' : 'off');
        if (state.controlsTerm) state.controlsTerm.textContent = 'term: ' + (state.activeTerm || 'none');
        if (state.controlsHits) state.controlsHits.textContent = 'hits: ' + state.activeHits.length;
        if (state.controlsRemote) {
            const status = state.globalReady ? 'ready' : (state.globalPromise ? 'indexing' : 'idle');
            state.controlsRemote.textContent = 'site: ' + state.remoteHits.length + ' (' + status + ')';
        }
        if (state.controlsRisk) state.controlsRisk.textContent = 'risk: ' + Math.round(state.questRisk);
    }

    function setMode(nextMode) {
        const normalized = OVERLAY_MODES.has(nextMode) ? nextMode : 'off';
        document.body.dataset.syntheticOverlay = normalized;
        document.body.classList.toggle('synthetic-mode-resonance', normalized === 'resonance');
        document.body.classList.toggle('synthetic-mode-drift', normalized === 'drift');
        localStorage.setItem(MODE_KEY, normalized);
        updateControlsStatus();
        return normalized;
    }

    function updateRiskVisual() {
        const rounded = Math.round(state.questRisk);
        document.body.classList.toggle('synthetic-risk-mid', rounded >= 35 && rounded < 70);
        document.body.classList.toggle('synthetic-risk-high', rounded >= 70);
        updateControlsStatus();
    }

    function clearGlitchTimer() {
        if (!state.glitchTimer) return;
        window.clearTimeout(state.glitchTimer);
        state.glitchTimer = null;
    }

    function scheduleGlitchPulse() {
        clearGlitchTimer();
        if (!document.body.classList.contains('synthetic-glitch')) return;

        const wait = 420 + Math.floor(Math.random() * 860);
        state.glitchTimer = window.setTimeout(function () {
            if (!document.body.classList.contains('synthetic-glitch')) return;
            document.body.classList.add('synthetic-glitch-spike');
            window.setTimeout(function () {
                document.body.classList.remove('synthetic-glitch-spike');
            }, 140 + Math.floor(Math.random() * 180));
            scheduleGlitchPulse();
        }, wait);
    }

    function setGlitch(enabled) {
        const active = Boolean(enabled);
        document.body.classList.toggle('synthetic-glitch', active);
        if (!active) {
            document.body.classList.remove('synthetic-glitch-spike');
            clearGlitchTimer();
        } else {
            scheduleGlitchPulse();
        }
        localStorage.setItem(GLITCH_KEY, active ? '1' : '0');
        updateControlsStatus();
        return active;
    }

    function pickTerm(pool) {
        const available = new Set(pool.map(function (entry) {
            return entry[0];
        }));
        const seeded = HOT_TERMS.filter(function (term) {
            return available.has(term);
        });
        if (seeded.length) return randomItem(seeded);
        return randomItem(Array.from(available));
    }

    function weightedRandomKey(weightsMap) {
        if (!weightsMap || !weightsMap.size) return null;
        let total = 0;
        weightsMap.forEach(function (weight) {
            total += Math.max(0, weight);
        });
        if (total <= 0) return null;
        let cursor = Math.random() * total;
        let selected = null;
        weightsMap.forEach(function (weight, key) {
            if (selected !== null) return;
            cursor -= Math.max(0, weight);
            if (cursor <= 0) selected = key;
        });
        return selected;
    }

    function canUseMarkovTerm(term) {
        if (!term) return false;
        const localCount = tokenToBlocks.has(term) ? tokenToBlocks.get(term).size : 0;
        const globalCount = state.globalReady ? (state.globalTokenCounts.get(term) || 0) : 0;
        return (localCount + globalCount) > 1;
    }

    function mergedTransitionsForTerm(term) {
        const merged = new Map();
        const localTransitions = tokenTransitions.get(term) || new Map();
        localTransitions.forEach(function (weight, key) {
            merged.set(key, (merged.get(key) || 0) + weight);
        });
        if (state.globalReady) {
            const globalTransitions = state.globalTokenTransitions.get(term) || new Map();
            globalTransitions.forEach(function (weight, key) {
                merged.set(key, (merged.get(key) || 0) + weight);
            });
        }
        return merged;
    }

    function nextMarkovTerm(term, visitedTerms) {
        const transitions = mergedTransitionsForTerm(term);
        if (!transitions || !transitions.size) return null;
        const filtered = new Map();
        transitions.forEach(function (weight, nextTerm) {
            if (!canUseMarkovTerm(nextTerm)) return;
            if (visitedTerms && visitedTerms.has(nextTerm) && Math.random() > 0.22) return;
            filtered.set(nextTerm, weight);
        });
        return weightedRandomKey(filtered);
    }

    function markovTermChain(seedTerm, length) {
        const steps = clamp(length || 4, 2, 7);
        const seed = canUseMarkovTerm(seedTerm) ? seedTerm : null;
        let current = seed;
        if (!current) {
            const pool = termPool();
            current = pickTerm(pool);
        }
        if (!current) return [];

        const chain = [current];
        const visited = new Set([current]);
        for (let index = 0; index < steps - 1; index += 1) {
            const nextTerm = nextMarkovTerm(current, visited);
            if (!nextTerm) break;
            chain.push(nextTerm);
            visited.add(nextTerm);
            current = nextTerm;
        }
        return chain;
    }

    function chooseBlockForTerm(term, previousBlock, usedBlocks) {
        const candidates = Array.from(tokenToBlocks.get(term) || []).filter(function (candidate) {
            return !usedBlocks.has(candidate);
        });
        if (!candidates.length) return null;
        if (!previousBlock) return randomItem(candidates);

        const previousIndex = blockOrder.get(previousBlock) || 0;
        const sorted = candidates.slice().sort(function (left, right) {
            const leftDistance = Math.abs((blockOrder.get(left) || 0) - previousIndex);
            const rightDistance = Math.abs((blockOrder.get(right) || 0) - previousIndex);
            return leftDistance - rightDistance;
        });
        return sorted[0] || randomItem(candidates);
    }

    function resonate(term) {
        if (!terminalActive()) return null;
        if (!blocks.length) return null;

        ensureGlobalCorpus();

        const pool = termPool();
        if (!pool.length) return null;

        const resolvedTerm = (term && tokenToBlocks.has(term)) ? term : pickTerm(pool);
        const targets = Array.from(tokenToBlocks.get(resolvedTerm) || []);
        if (!targets.length) return null;

        clearOverlayMarks({ keepEchoes: true });
        targets.forEach(function (block) {
            block.classList.add('synthetic-hit');
            block.dataset.syntheticTerm = resolvedTerm;
        });

        document.body.dataset.syntheticTerm = resolvedTerm;
        state.activeHits = targets;
        state.remoteHits = state.globalReady ? (state.globalTokenToPassages.get(resolvedTerm) || []).slice(0, 24) : [];
        state.activeTerm = resolvedTerm;
        state.driftVector = null;
        state.driftVectors = [];
        renderConnections();

        spawnEchoes(resolvedTerm, targets);
        showPulse(
            'Resonance: ' + resolvedTerm + ' [local ' + targets.length + ' | site ' + state.remoteHits.length + ']',
            'resonate'
        );
        flash('resonate');
        appendTrail('resonate', {
            term: resolvedTerm,
            localHits: targets.length,
            siteHits: state.remoteHits.length
        });
        updateControlsStatus();
        return resolvedTerm;
    }

    function drift() {
        if (!terminalActive()) return null;
        if (blocks.length < 2) return null;
        ensureGlobalCorpus();

        const chain = markovTermChain(state.activeTerm || null, 5);
        if (chain.length < 2) return null;

        const rootTerm = chain[0];
        resonate(rootTerm);

        const usedBlocks = new Set();
        const hopBlocks = [];
        chain.forEach(function (term, index) {
            const previous = index > 0 ? hopBlocks[index - 1] : randomItem(Array.from(tokenToBlocks.get(term) || []));
            let block = chooseBlockForTerm(term, previous, usedBlocks);
            if (!block && previous && tokenToBlocks.get(term) && tokenToBlocks.get(term).has(previous)) {
                block = previous;
            }
            if (!block) block = previous || randomItem(Array.from(tokenToBlocks.get(term) || []));
            if (!block) return;
            hopBlocks.push(block);
            usedBlocks.add(block);
        });

        if (hopBlocks.length < 2) return null;

        const vectors = [];
        for (let step = 0; step < hopBlocks.length - 1; step += 1) {
            const origin = hopBlocks[step];
            const target = hopBlocks[step + 1];
            if (!origin || !target || origin === target) continue;
            vectors.push({
                origin: origin,
                target: target,
                term: chain[step + 1],
                step: step + 1
            });
        }
        if (!vectors.length) return null;

        vectors[0].origin.classList.add('synthetic-origin', 'synthetic-drift-hop');
        vectors.forEach(function (vector) {
            vector.origin.classList.add('synthetic-drift-hop');
            vector.target.classList.add('synthetic-drift-target', 'synthetic-drift-hop');
        });

        state.driftVector = vectors[0];
        state.driftVectors = vectors;

        renderConnections();
        const finalTarget = vectors[vectors.length - 1].target;
        finalTarget.scrollIntoView({ behavior: 'smooth', block: 'center' });

        const chainLabel = chain.slice(0, Math.min(chain.length, 4)).join(' -> ');
        showPulse('Markov drift: ' + chainLabel, 'drift');
        flash('drift');
        appendTrail('drift', {
            chain: chain,
            hops: vectors.length
        });
        updateControlsStatus();
        return chain[chain.length - 1];
    }

    function currentMode() {
        return document.body.dataset.syntheticOverlay || 'off';
    }

    function terminalActive() {
        return Boolean(state.controlsVisible);
    }

    function menuNodes() {
        const currentPath = canonicalPath(window.location.href);
        return Array.from(document.querySelectorAll('.fixed-menu a[href]')).map(function (link, index) {
            const path = canonicalPath(link.href);
            return {
                href: link.href,
                path: path,
                label: (link.textContent || '').replace(/\s+/g, ' ').trim() || ('Node ' + (index + 1)),
                visits: visitScore(path),
                current: path === currentPath
            };
        }).filter(function (node) {
            return Boolean(node.path);
        });
    }

    function ensurePortal() {
        if (state.portalOverlay) return state.portalOverlay;

        const overlay = document.createElement('div');
        overlay.className = 'synthetic-portal';
        overlay.innerHTML = [
            '<div class="synthetic-portal-ring"></div>',
            '<div class="synthetic-portal-text" data-portal-text></div>'
        ].join('');
        document.body.appendChild(overlay);
        state.portalOverlay = overlay;
        return overlay;
    }

    function showPortal(destinationLabel, onDone) {
        const overlay = ensurePortal();
        const textNode = overlay.querySelector('[data-portal-text]');
        textNode.textContent = destinationLabel;

        overlay.classList.add('active');
        flash('wormhole');

        if (state.portalTimer) {
            window.clearTimeout(state.portalTimer);
            state.portalTimer = null;
        }

        state.portalTimer = window.setTimeout(function () {
            overlay.classList.remove('active');
            state.portalTimer = null;
            if (typeof onDone === 'function') onDone();
        }, 920);
    }

    function wormhole() {
        if (!terminalActive()) return null;
        const currentPath = canonicalPath(window.location.href);
        const links = menuNodes().filter(function (node) {
            return node.path !== currentPath;
        });
        if (!links.length) return null;

        const minVisits = Math.min.apply(null, links.map(function (node) {
            return node.visits;
        }));
        const candidates = links.filter(function (node) {
            return node.visits === minVisits;
        });
        const destination = randomItem(candidates);
        if (!destination) return null;

        const targetUrl = new URL(destination.href, window.location.origin);
        const mode = currentMode();

        if (mode !== 'off') targetUrl.searchParams.set('overlay', mode);
        if (document.body.classList.contains('synthetic-glitch')) targetUrl.searchParams.set('glitch', 'on');
        targetUrl.searchParams.set('arrival', 'wormhole');
        targetUrl.searchParams.set('from', currentPath);

        appendTrail('wormhole', { to: destination.path, visits: destination.visits });
        showPulse('Wormhole -> ' + shorten(destination.label, 42), 'wormhole');
        showPortal('Wormhole -> ' + shorten(destination.label, 54), function () {
            window.location.href = targetUrl.toString();
        });
        return targetUrl.toString();
    }

    function ensureMapModal() {
        if (state.mapModal) return state.mapModal;

        const modal = document.createElement('div');
        modal.className = 'synthetic-map-modal';
        modal.innerHTML = [
            '<div class="synthetic-map-card">',
            '<div class="synthetic-map-head">',
            '<strong>Multiversal Map</strong>',
            '<button type="button" data-map-action="close">Close</button>',
            '</div>',
            '<div class="synthetic-map-sub">Overlap routes. Lower visit counts surface first.</div>',
            '<div class="synthetic-map-nodes" data-map-nodes></div>',
            '</div>'
        ].join('');

        modal.addEventListener('click', function (event) {
            if (event.target === modal) {
                closeMap();
                return;
            }
            const actionButton = event.target.closest('[data-map-action]');
            if (actionButton && actionButton.dataset.mapAction === 'close') {
                closeMap();
                return;
            }

            const nodeButton = event.target.closest('[data-map-href]');
            if (!nodeButton) return;

            const href = nodeButton.getAttribute('data-map-href');
            if (!href) return;

            const targetUrl = new URL(href, window.location.origin);
            const mode = currentMode();

            if (mode !== 'off') targetUrl.searchParams.set('overlay', mode);
            if (document.body.classList.contains('synthetic-glitch')) targetUrl.searchParams.set('glitch', 'on');
            targetUrl.searchParams.set('arrival', 'map');
            targetUrl.searchParams.set('from', canonicalPath(window.location.href));

            showPulse('Map jump -> ' + (nodeButton.getAttribute('data-map-label') || 'node'), 'map');
            flash('map');
            window.location.href = targetUrl.toString();
        });

        document.body.appendChild(modal);
        state.mapModal = modal;
        state.mapNodes = modal.querySelector('[data-map-nodes]');
        return modal;
    }

    function openMap() {
        if (!terminalActive()) return;
        const modal = ensureMapModal();
        const nodes = menuNodes().slice().sort(function (a, b) {
            if (a.current && !b.current) return -1;
            if (!a.current && b.current) return 1;
            if (a.visits !== b.visits) return a.visits - b.visits;
            return a.label.localeCompare(b.label);
        });

        state.mapNodes.innerHTML = '';
        nodes.forEach(function (node) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'synthetic-map-node' + (node.current ? ' is-current' : '');
            button.setAttribute('data-map-href', node.href);
            button.setAttribute('data-map-label', node.label);
            button.innerHTML = [
                '<span class="synthetic-map-node-label">', shorten(node.label, 58), '</span>',
                '<span class="synthetic-map-node-visits">v', node.visits, '</span>'
            ].join('');
            state.mapNodes.appendChild(button);
        });

        modal.classList.add('active');
        state.mapOpen = true;
        showPulse('Multiversal map opened', 'map');
        flash('map');
        appendTrail('map-open', { nodes: nodes.length });
    }

    function closeMap() {
        if (!state.mapModal) return;
        state.mapModal.classList.remove('active');
        state.mapOpen = false;
    }

    function toggleMap() {
        if (state.mapOpen) {
            closeMap();
            showPulse('Map closed', 'map');
            return;
        }
        openMap();
    }

    function relationMeta(kind) {
        if (kind === 'convergence') {
            return {
                label: 'Convergence',
                cue: 'passages reinforce each other as a temporary doctrine'
            };
        }
        if (kind === 'friction') {
            return {
                label: 'Friction',
                cue: 'the archive disputes itself and generates strategic conflict'
            };
        }
        if (kind === 'mutation') {
            return {
                label: 'Mutation',
                cue: 'the term mutates into a neighboring proposition'
            };
        }
        return {
            label: 'Aporia',
            cue: 'a productive gap where meaning refuses closure'
        };
    }

    function blockAxisProfile(block) {
        return blockAxisScores.get(block) || axisVectorFromTokens(Array.from(blockTokens.get(block) || []));
    }

    function blockStanceProfile(block) {
        return blockStanceScores.get(block) || stanceVectorFromText(block.textContent || '');
    }

    function axisShiftLabel(leftVector, rightVector) {
        const leftTop = dominantAxes(leftVector, 1)[0];
        const rightTop = dominantAxes(rightVector, 1)[0];
        if (!leftTop && !rightTop) return 'undetermined';
        if (!leftTop) return 'toward ' + rightTop.label;
        if (!rightTop) return 'away from ' + leftTop.label;
        if (leftTop.id === rightTop.id) return 'within ' + leftTop.label;
        return leftTop.label + ' -> ' + rightTop.label;
    }

    function pairAnalysis(leftPayload, rightPayload) {
        const leftText = leftPayload.text || '';
        const rightText = rightPayload.text || '';
        const leftTokens = leftPayload.tokens || tokenize(leftText);
        const rightTokens = rightPayload.tokens || tokenize(rightText);
        const overlapData = overlapDiagnostics(leftTokens, rightTokens, 6);

        const leftAxis = leftPayload.axis || axisVectorFromTokens(leftTokens);
        const rightAxis = rightPayload.axis || axisVectorFromTokens(rightTokens);
        const leftStance = leftPayload.stance || stanceVectorFromText(leftText);
        const rightStance = rightPayload.stance || stanceVectorFromText(rightText);

        const conflictPattern = /\b(not|never|without|against|fail|fails|failed|failing|fracture|collapse|refuse|refused|refusal|denial|contradiction)\b/i;
        const contradiction = conflictPattern.test(leftText) || conflictPattern.test(rightText);
        const axisCoherence = coherenceScore(leftAxis, rightAxis, THEORY_AXES);
        const stanceCoherence = coherenceScore(leftStance, rightStance, STANCE_AXES);
        const evidence = sentenceEvidence(leftText, rightText);
        const kind = inferRelationKind(overlapData, contradiction, axisCoherence, stanceCoherence);
        const facets = interpretiveFacets(leftStance, rightStance, overlapData, contradiction, axisCoherence, stanceCoherence);
        const confidence = relationConfidence(overlapData, axisCoherence, stanceCoherence, evidence ? evidence.score : 0, contradiction);

        return {
            kind: kind,
            overlap: overlapData.overlap,
            bridgeScore: overlapData.bridgeScore,
            bridgeNorm: overlapData.bridgeNorm,
            contradiction: contradiction,
            axis: {
                shift: axisShiftLabel(leftAxis, rightAxis),
                coherence: axisCoherence,
                left: dominantAxes(leftAxis, 3),
                right: dominantAxes(rightAxis, 3)
            },
            stance: {
                coherence: stanceCoherence,
                left: dominantStances(leftStance, 3),
                right: dominantStances(rightStance, 3)
            },
            confidence: confidence,
            facets: facets,
            evidence: evidence
        };
    }

    function relationNarrative(term, kind, analysis) {
        const meta = relationMeta(kind);
        const bridge = (analysis.overlap && analysis.overlap.length) ? analysis.overlap.join(', ') : 'no stable bridge';
        const shift = analysis.axis && analysis.axis.shift ? (' Axis shift: ' + analysis.axis.shift + '.') : '';
        const facets = analysis.facets && analysis.facets.length ? (' Facets: ' + analysis.facets.join(', ') + '.') : '';
        const confidence = typeof analysis.confidence === 'number' ? (' Confidence=' + String(analysis.confidence) + '%.') : '';
        return meta.label + ': "' + term + '" routes through [' + bridge + '] and ' + meta.cue + '.' + shift + facets + confidence;
    }

    function clearHermeneuticMarks() {
        blocks.forEach(function (block) {
            block.classList.remove('synthetic-herm-source', 'synthetic-herm-target');
        });
        state.hermPairs = [];
        scheduleRedraw();
    }

    function buildHermeneuticPairs(term, hits) {
        const sourceHits = (hits || []).slice().sort(function (a, b) {
            return (blockOrder.get(a) || 0) - (blockOrder.get(b) || 0);
        });
        if (sourceHits.length < 2) return [];

        const limitedHits = sourceHits.slice(0, 24);
        const currentPath = canonicalPath(window.location.href);
        const candidates = [];

        for (let leftIndex = 0; leftIndex < limitedHits.length - 1; leftIndex += 1) {
            for (let rightIndex = leftIndex + 1; rightIndex < limitedHits.length; rightIndex += 1) {
                const leftBlock = limitedHits[leftIndex];
                const rightBlock = limitedHits[rightIndex];
                const analysis = pairAnalysis({
                    text: leftBlock.textContent || '',
                    tokens: Array.from(blockTokens.get(leftBlock) || []),
                    axis: blockAxisProfile(leftBlock),
                    stance: blockStanceProfile(leftBlock)
                }, {
                    text: rightBlock.textContent || '',
                    tokens: Array.from(blockTokens.get(rightBlock) || []),
                    axis: blockAxisProfile(rightBlock),
                    stance: blockStanceProfile(rightBlock)
                });

                if (!analysis.overlap.length && analysis.confidence < 34) continue;
                candidates.push({
                    kind: analysis.kind,
                    from: leftBlock,
                    to: rightBlock,
                    overlap: analysis.overlap,
                    label: relationMeta(analysis.kind).label,
                    shift: analysis.axis.shift,
                    fromAxis: analysis.axis.left,
                    toAxis: analysis.axis.right,
                    fromStance: analysis.stance.left,
                    toStance: analysis.stance.right,
                    confidence: analysis.confidence,
                    facets: analysis.facets,
                    bridgeScore: analysis.bridgeScore,
                    fromText: excerpt(leftBlock.textContent || '', 20),
                    toText: excerpt(rightBlock.textContent || '', 20),
                    evidence: analysis.evidence,
                    path: currentPath,
                    narrative: relationNarrative(term, analysis.kind, analysis)
                });
            }
        }

        candidates.sort(function (a, b) {
            if (b.confidence !== a.confidence) return b.confidence - a.confidence;
            return b.bridgeScore - a.bridgeScore;
        });

        const chosen = [];
        const byKind = new Map();
        for (let index = 0; index < candidates.length; index += 1) {
            if (chosen.length >= Math.min(9, sourceHits.length + 2)) break;
            const candidate = candidates[index];
            const kindCount = byKind.get(candidate.kind) || 0;
            if (kindCount >= 3 && chosen.length < 6) continue;
            chosen.push(candidate);
            byKind.set(candidate.kind, kindCount + 1);
        }

        if (!chosen.length && sourceHits.length >= 2) {
            const first = sourceHits[0];
            const second = sourceHits[1];
            const fallback = pairAnalysis({
                text: first.textContent || '',
                tokens: Array.from(blockTokens.get(first) || []),
                axis: blockAxisProfile(first),
                stance: blockStanceProfile(first)
            }, {
                text: second.textContent || '',
                tokens: Array.from(blockTokens.get(second) || []),
                axis: blockAxisProfile(second),
                stance: blockStanceProfile(second)
            });
            chosen.push({
                kind: fallback.kind,
                from: first,
                to: second,
                overlap: fallback.overlap,
                label: relationMeta(fallback.kind).label,
                shift: fallback.axis.shift,
                fromAxis: fallback.axis.left,
                toAxis: fallback.axis.right,
                fromStance: fallback.stance.left,
                toStance: fallback.stance.right,
                confidence: fallback.confidence,
                facets: fallback.facets,
                bridgeScore: fallback.bridgeScore,
                fromText: excerpt(first.textContent || '', 20),
                toText: excerpt(second.textContent || '', 20),
                evidence: fallback.evidence,
                path: currentPath,
                narrative: relationNarrative(term, fallback.kind, fallback)
            });
        }

        return chosen;
    }

    function buildCrossSitePairs(term, localHits, remoteHits) {
        if (!localHits.length || !remoteHits.length) return [];
        const localSample = localHits.slice(0, 12);
        const remoteSample = remoteHits.slice(0, 24);
        const candidates = [];

        remoteSample.forEach(function (remotePassage) {
            localSample.forEach(function (localBlock) {
                const analysis = pairAnalysis({
                    text: localBlock.textContent || '',
                    tokens: Array.from(blockTokens.get(localBlock) || []),
                    axis: blockAxisProfile(localBlock),
                    stance: blockStanceProfile(localBlock)
                }, {
                    text: remotePassage.text || '',
                    tokens: remotePassage.tokens || tokenize(remotePassage.text || ''),
                    axis: remotePassage.axis || axisVectorFromTokens(remotePassage.tokens || []),
                    stance: remotePassage.stance || stanceVectorFromText(remotePassage.text || '')
                });

                if (!analysis.overlap.length && analysis.confidence < 32) return;
                candidates.push({
                    remote: true,
                    kind: analysis.kind,
                    from: localBlock,
                    to: null,
                    overlap: analysis.overlap,
                    label: relationMeta(analysis.kind).label + ' (cross-site)',
                    shift: analysis.axis.shift,
                    fromAxis: analysis.axis.left,
                    toAxis: analysis.axis.right,
                    fromStance: analysis.stance.left,
                    toStance: analysis.stance.right,
                    confidence: analysis.confidence,
                    facets: analysis.facets,
                    bridgeScore: analysis.bridgeScore,
                    fromText: excerpt(localBlock.textContent || '', 20),
                    toText: excerpt(remotePassage.text || '', 20),
                    evidence: analysis.evidence,
                    path: remotePassage.path,
                    pageLabel: remotePassage.label || remotePassage.path,
                    narrative: relationNarrative(term, analysis.kind, analysis)
                });
            });
        });

        candidates.sort(function (a, b) {
            if (b.confidence !== a.confidence) return b.confidence - a.confidence;
            return b.bridgeScore - a.bridgeScore;
        });

        const selected = [];
        const usedPages = new Set();
        for (let index = 0; index < candidates.length; index += 1) {
            if (selected.length >= 6) break;
            const candidate = candidates[index];
            const pageKey = candidate.path || '';
            if (pageKey && usedPages.has(pageKey) && selected.length < 4) continue;
            selected.push(candidate);
            if (pageKey) usedPages.add(pageKey);
        }
        return selected;
    }

    function sentenceFragments(text) {
        return (text || '')
            .replace(/\s+/g, ' ')
            .split(/(?<=[.!?;:])\s+/)
            .map(function (sentence) {
                return sentence.trim();
            })
            .filter(function (sentence) {
                return sentence.length > 24;
            });
    }

    function detournementCutup(term, hits, remotePassages) {
        const sourceHits = (hits || []).slice().sort(function (a, b) {
            return (blockOrder.get(a) || 0) - (blockOrder.get(b) || 0);
        });
        const fragments = [];
        sourceHits.forEach(function (block, index) {
            const sentences = sentenceFragments(block.textContent || '');
            const picks = sentences.slice(0, 4).map(function (sentence) {
                return {
                    from: 'B' + String(index + 1).padStart(2, '0'),
                    text: sentence
                };
            });
            fragments.push.apply(fragments, picks);
        });
        (remotePassages || []).slice(0, 5).forEach(function (passage, index) {
            const sentences = sentenceFragments((passage && passage.text) || '');
            const picks = sentences.slice(0, 2).map(function (sentence) {
                return {
                    from: 'R' + String(index + 1).padStart(2, '0'),
                    text: sentence
                };
            });
            fragments.push.apply(fragments, picks);
        });
        if (!fragments.length) return null;

        const remixed = [];
        const local = fragments.slice();
        while (local.length && remixed.length < 8) {
            const position = Math.floor(Math.random() * local.length);
            remixed.push(local.splice(position, 1)[0]);
        }

        const lead = term ? ('[[' + term.toUpperCase() + ']] ') : '';
        const lines = remixed.map(function (fragment, index) {
            const text = fragment.text.replace(/\s+/g, ' ').trim();
            const clipped = text.length > 148 ? (text.slice(0, 145).trim() + '...') : text;
            const prefix = index === 0 ? lead : '';
            return prefix + clipped + ' <' + fragment.from + '>';
        });
        return {
            lines: lines,
            sourceCount: sourceHits.length,
            remoteCount: Math.min((remotePassages || []).length, 5),
            fragmentCount: remixed.length
        };
    }

    function aggregateAxisForHits(hits, remotePassages) {
        const vectors = (hits || []).map(function (block) {
            return blockAxisProfile(block);
        });
        (remotePassages || []).slice(0, 16).forEach(function (passage) {
            if (passage && passage.axis) vectors.push(passage.axis);
        });
        return mergeAxisVectors(vectors);
    }

    function ensureHermModal() {
        if (state.hermModal) return state.hermModal;

        const modal = document.createElement('div');
        modal.className = 'synthetic-herm-modal';
        modal.innerHTML = [
            '<div class="synthetic-herm-card">',
            '<div class="synthetic-herm-head">',
            '<strong>Hermeneutic Web</strong>',
            '<div class="synthetic-herm-actions">',
            '<button type="button" data-herm-action="reroll">Recompose</button>',
            '<button type="button" data-herm-action="close">Close</button>',
            '</div>',
            '</div>',
            '<div class="synthetic-herm-sub" data-herm-summary></div>',
            '<div class="synthetic-herm-axis" data-herm-axis></div>',
            '<div class="synthetic-herm-cutup" data-herm-cutup></div>',
            '<div class="synthetic-herm-list" data-herm-list></div>',
            '</div>'
        ].join('');

        modal.addEventListener('click', function (event) {
            if (event.target === modal) {
                closeHermeneutic();
                return;
            }

            const jumpButton = event.target.closest('[data-herm-jump]');
            if (jumpButton) {
                const rawPath = jumpButton.getAttribute('data-herm-jump') || '';
                if (!rawPath) return;

                const targetUrl = new URL(rawPath, window.location.origin);
                const mode = currentMode();
                if (mode !== 'off') targetUrl.searchParams.set('overlay', mode);
                if (document.body.classList.contains('synthetic-glitch')) targetUrl.searchParams.set('glitch', 'on');
                targetUrl.searchParams.set('arrival', 'herm');
                targetUrl.searchParams.set('from', canonicalPath(window.location.href));
                window.location.href = targetUrl.toString();
                return;
            }

            const button = event.target.closest('[data-herm-action]');
            if (!button) return;
            const action = button.getAttribute('data-herm-action');
            if (action === 'close') closeHermeneutic();
            if (action === 'reroll') openHermeneutic(true);
        });

        document.body.appendChild(modal);
        state.hermModal = modal;
        state.hermList = modal.querySelector('[data-herm-list]');
        state.hermAxis = modal.querySelector('[data-herm-axis]');
        state.hermCutup = modal.querySelector('[data-herm-cutup]');
        return modal;
    }

    function closeHermeneutic() {
        if (!state.hermModal) return;
        state.hermModal.classList.remove('active');
        state.hermOpen = false;
        clearHermeneuticMarks();
    }

    function renderHermeneuticCards(term, pairs, hits) {
        if (!state.hermList) return;
        state.hermList.innerHTML = '';
        const confidenceValues = [];
        pairs.forEach(function (pair, index) {
            const item = document.createElement('article');
            item.className = 'synthetic-herm-item synthetic-herm-item-' + pair.kind;
            const fromAxis = pair.fromAxis.map(function (entry) {
                return entry.label + ' (' + entry.score + ')';
            }).join(' | ') || 'none';
            const toAxis = pair.toAxis.map(function (entry) {
                return entry.label + ' (' + entry.score + ')';
            }).join(' | ') || 'none';
            const fromStance = (pair.fromStance || []).map(function (entry) {
                return entry.label + ' (' + entry.score + ')';
            }).join(' | ') || 'none';
            const toStance = (pair.toStance || []).map(function (entry) {
                return entry.label + ' (' + entry.score + ')';
            }).join(' | ') || 'none';
            const facets = (pair.facets || []).join(', ') || 'none';
            const confidence = typeof pair.confidence === 'number' ? pair.confidence : 0;
            confidenceValues.push(confidence);
            const targetLine = pair.remote
                ? '<div class="synthetic-herm-item-page"><span>TO-PAGE</span> '
                    + escapeHtml(pair.pageLabel || pair.path || 'unknown')
                    + ' <button type="button" data-herm-jump="'
                    + escapeHtml(pair.path || '')
                    + '">Jump</button></div>'
                : '<div class="synthetic-herm-item-to"><span>TO</span> ' + escapeHtml(pair.toText) + '</div>';
            const evidenceLine = pair.evidence
                ? '<div class="synthetic-herm-item-evidence"><span>EVIDENCE</span> '
                    + escapeHtml(shorten(pair.evidence.left, 120))
                    + ' // '
                    + escapeHtml(shorten(pair.evidence.right, 120))
                    + '</div>'
                : '<div class="synthetic-herm-item-evidence"><span>EVIDENCE</span> insufficient sentence alignment</div>';
            item.innerHTML = [
                '<div class="synthetic-herm-item-head">#', String(index + 1).padStart(2, '0'), ' ', escapeHtml(pair.label), '</div>',
                '<div class="synthetic-herm-item-body">',
                '<div class="synthetic-herm-item-from"><span>FROM</span> ', escapeHtml(pair.fromText), '</div>',
                targetLine,
                '<div class="synthetic-herm-item-bridge"><span>BRIDGE</span> ', escapeHtml(pair.overlap.join(', ') || 'none'), '</div>',
                '<div class="synthetic-herm-item-score"><span>SCORE</span> confidence=', String(confidence), '% bridge=', String(Math.round(pair.bridgeScore || 0)), '</div>',
                '<div class="synthetic-herm-item-shift"><span>SHIFT</span> ', escapeHtml(pair.shift || 'undetermined'), '</div>',
                '<div class="synthetic-herm-item-axis"><span>AXIS-FROM</span> ', escapeHtml(fromAxis), '</div>',
                '<div class="synthetic-herm-item-axis"><span>AXIS-TO</span> ', escapeHtml(toAxis), '</div>',
                '<div class="synthetic-herm-item-stance"><span>STANCE-FROM</span> ', escapeHtml(fromStance), '</div>',
                '<div class="synthetic-herm-item-stance"><span>STANCE-TO</span> ', escapeHtml(toStance), '</div>',
                '<div class="synthetic-herm-item-facets"><span>FACETS</span> ', escapeHtml(facets), '</div>',
                evidenceLine,
                '<div class="synthetic-herm-item-note">', escapeHtml(pair.narrative), '</div>',
                '</div>'
            ].join('');
            state.hermList.appendChild(item);
        });

        const summary = state.hermModal.querySelector('[data-herm-summary]');
        if (summary) {
            const avgConfidence = confidenceValues.length
                ? Math.round(confidenceValues.reduce(function (sum, value) { return sum + value; }, 0) / confidenceValues.length)
                : 0;
            summary.textContent = 'TERM=' + (term || 'none') + ' | RELATIONS=' + pairs.length + ' | AVG-CONFIDENCE=' + avgConfidence + '%';
        }

        if (state.hermAxis) {
            const axisVector = aggregateAxisForHits(hits || [], state.remoteHits || []);
            const topAxes = dominantAxes(axisVector, 4);
            if (topAxes.length) {
                state.hermAxis.innerHTML = topAxes.map(function (entry) {
                    return '<span>' + escapeHtml(entry.label) + ': ' + String(entry.score) + '</span>';
                }).join('');
            } else {
                state.hermAxis.innerHTML = '<span>No axis signal found.</span>';
            }
        }

        if (state.hermCutup) {
            const montage = detournementCutup(term, hits || [], state.remoteHits || []);
            if (!montage) {
                state.hermCutup.innerHTML = '<strong>Detournement</strong><p>Not enough fragments for cut-up synthesis.</p>';
            } else {
                state.hermCutup.innerHTML = [
                    '<strong>Detournement Cut-Up</strong>',
                    '<p>local=', String(montage.sourceCount), ' remote=', String(montage.remoteCount), ' fragments=', String(montage.fragmentCount), '</p>',
                    '<pre>', escapeHtml(montage.lines.join('\n')), '</pre>'
                ].join('');
                appendTrail('detournement', {
                    term: term,
                    fragments: montage.fragmentCount
                });
            }
        }
    }

    function openHermeneutic(forceReroll) {
        if (!terminalActive()) return null;
        if (!state.globalReady) {
            ensureGlobalCorpus().then(function () {
                if (!terminalActive() || !state.hermOpen) return;
                openHermeneutic(true);
            });
        }

        const term = state.activeTerm || resonate();
        if (!term) return null;
        const hits = state.activeHits.length ? state.activeHits : [];
        if (hits.length < 2) {
            showPulse('Hermeneutic web needs >=2 linked passages', 'map');
            return null;
        }

        const modal = ensureHermModal();
        if (!forceReroll && state.hermOpen) {
            closeHermeneutic();
            showPulse('Hermeneutic web closed', 'map');
            return null;
        }

        clearHermeneuticMarks();
        const localPairs = buildHermeneuticPairs(term, hits);
        const remoteHits = state.globalReady ? (state.globalTokenToPassages.get(term) || []).slice(0, 10) : [];
        const crossPairs = buildCrossSitePairs(term, hits, remoteHits);
        const pairs = localPairs.concat(crossPairs).slice(0, 12);
        if (!pairs.length) {
            showPulse('No relation pairs found', 'map');
            return null;
        }

        state.hermPairs = pairs;
        pairs.forEach(function (pair) {
            if (pair.remote) return;
            pair.from.classList.add('synthetic-herm-source');
            pair.to.classList.add('synthetic-herm-target');
        });
        scheduleRedraw();

        renderHermeneuticCards(term, pairs, hits);
        modal.classList.add('active');
        state.hermOpen = true;
        showPulse(
            'Hermeneutic web: ' + localPairs.length + ' local + ' + crossPairs.length + ' cross-site links',
            'resonate'
        );
        flash('resonate');
        appendTrail('hermeneutic', {
            term: term,
            relations: pairs.map(function (pair) {
                return pair.kind;
            }),
            shifts: pairs.map(function (pair) {
                return pair.shift;
            })
        });
        return pairs;
    }

    function questBonus(stat) {
        return state.questStats[stat] || 0;
    }

    function questRoll(stat, dc) {
        const roll = 1 + Math.floor(Math.random() * 20);
        const bonus = questBonus(stat);
        const total = roll + bonus;
        const success = total >= dc;
        return {
            roll: roll,
            bonus: bonus,
            total: total,
            dc: dc,
            success: success,
            critical: roll === 20,
            fumble: roll === 1
        };
    }

    function tuneQuestStat(stat, delta) {
        const next = clamp((state.questStats[stat] || 0) + delta, 0, 8);
        state.questStats[stat] = next;
    }

    function renderQuestStats() {
        if (!state.questStatsNode) return;
        const rows = Object.keys(state.questStats).map(function (name) {
            return name + '=' + String(state.questStats[name]);
        });
        state.questStatsNode.textContent = 'stats: ' + rows.join(' | ');
    }

    const QUEST_SCENES = [
        {
            prompt: '>> CHAMBER I // LINES OF FLIGHT: how do you move the plane?',
            choices: [
                {
                    id: 'flight',
                    label: 'Ride Line of Flight',
                    check: 'hermeneutics',
                    dc: 13,
                    risk: { success: 7, fail: 18 },
                    onSuccess: function () { setMode('drift'); drift(); tuneQuestStat('hermeneutics', 1); },
                    onFail: function () { setGlitch(true); flash('wormhole'); tuneQuestStat('contestation', 1); }
                },
                {
                    id: 'anchor',
                    label: 'Anchor a Protocol',
                    check: 'contestation',
                    dc: 14,
                    risk: { success: 5, fail: 14 },
                    onSuccess: function () { setMode('resonance'); resonate(); setGlitch(false); tuneQuestStat('contestation', 1); },
                    onFail: function () { drift(); tuneQuestStat('hermetics', 1); }
                },
                {
                    id: 'smuggle',
                    label: 'Smuggle Through Wormhole',
                    check: 'hermetics',
                    dc: 12,
                    risk: { success: 10, fail: 20 },
                    onSuccess: function () { wormhole(); tuneQuestStat('hermetics', 1); },
                    onFail: function () { setGlitch(true); openMap(); }
                }
            ]
        },
        {
            prompt: '>> CHAMBER II // INTERPRETIVE ENGINE: what reading regime do you impose?',
            choices: [
                {
                    id: 'diagram',
                    label: 'Diagram Hermeneutic Web',
                    check: 'hermeneutics',
                    dc: 15,
                    risk: { success: 6, fail: 15 },
                    onSuccess: function () { openHermeneutic(true); tuneQuestStat('hermeneutics', 1); },
                    onFail: function () { openHermeneutic(true); setGlitch(true); }
                },
                {
                    id: 'detour',
                    label: 'Detournement Recompose',
                    check: 'hermetics',
                    dc: 14,
                    risk: { success: 8, fail: 17 },
                    onSuccess: function () { openHermeneutic(true); tuneQuestStat('hermetics', 1); },
                    onFail: function () { drift(); tuneQuestStat('contestation', 1); }
                },
                {
                    id: 'siege',
                    label: 'Contest the Infrastructure',
                    check: 'contestation',
                    dc: 16,
                    risk: { success: 9, fail: 21 },
                    onSuccess: function () { openLogbook(); tuneQuestStat('contestation', 1); },
                    onFail: function () { setGlitch(true); wormhole(); }
                }
            ]
        },
        {
            prompt: '>> CHAMBER III // LATENT DUNGEON: choose consequence branch',
            choices: [
                {
                    id: 'publish',
                    label: 'Commit Trace to Logbook',
                    check: 'contestation',
                    dc: 12,
                    risk: { success: 4, fail: 13 },
                    onSuccess: function () { openLogbook(); },
                    onFail: function () { openLogbook(); setGlitch(true); }
                },
                {
                    id: 'loop',
                    label: 'Recursive Markov Loop',
                    check: 'hermeneutics',
                    dc: 15,
                    risk: { success: 11, fail: 23 },
                    onSuccess: function () { drift(); openHermeneutic(true); },
                    onFail: function () { setMode('drift'); drift(); drift(); setGlitch(true); }
                },
                {
                    id: 'portal',
                    label: 'Escape to KI-DIPFIES',
                    check: 'hermetics',
                    dc: 13,
                    risk: { success: 9, fail: 18 },
                    onSuccess: function () { openKiDipfiesPortal(); },
                    onFail: function () { openKiDipfiesPortal(); setGlitch(true); }
                }
            ]
        }
    ];

    function ensureQuestModal() {
        if (state.questModal) return state.questModal;

        const modal = document.createElement('div');
        modal.className = 'synthetic-quest-modal';
        modal.innerHTML = [
            '<div class="synthetic-quest-card">',
            '<div class="synthetic-quest-head">',
            '<strong>Adventure Kernel</strong>',
            '<button type="button" data-quest-action="close">Close</button>',
            '</div>',
            '<div class="synthetic-quest-status" data-quest-status></div>',
            '<div class="synthetic-quest-stats" data-quest-stats></div>',
            '<div class="synthetic-quest-roll" data-quest-roll></div>',
            '<div class="synthetic-quest-prompt" data-quest-prompt></div>',
            '<div class="synthetic-quest-choices" data-quest-choices></div>',
            '</div>'
        ].join('');

        modal.addEventListener('click', function (event) {
            if (event.target === modal) {
                closeQuest();
                return;
            }
            const actionButton = event.target.closest('[data-quest-action]');
            if (actionButton) {
                if (actionButton.getAttribute('data-quest-action') === 'close') closeQuest();
                return;
            }

            const choiceButton = event.target.closest('[data-quest-choice]');
            if (!choiceButton) return;
            applyQuestChoice(choiceButton.getAttribute('data-quest-choice') || '');
        });

        document.body.appendChild(modal);
        state.questModal = modal;
        state.questPrompt = modal.querySelector('[data-quest-prompt]');
        state.questChoices = modal.querySelector('[data-quest-choices]');
        state.questStatus = modal.querySelector('[data-quest-status]');
        state.questStatsNode = modal.querySelector('[data-quest-stats]');
        state.questRollNode = modal.querySelector('[data-quest-roll]');
        return modal;
    }

    function questOutcomeLabel() {
        if (state.questRisk >= 70) return 'critical';
        if (state.questRisk >= 35) return 'unstable';
        return 'contained';
    }

    function renderQuestScene() {
        if (!state.questModal || !state.questPrompt || !state.questChoices || !state.questStatus) return;
        renderQuestStats();

        const scene = QUEST_SCENES[state.questStep];
        if (!scene) {
            const trace = state.questTrace.join(' -> ') || 'none';
            state.questPrompt.textContent = '>> QUEST COMPLETE. TRACE=' + trace;
            state.questChoices.innerHTML = [
                '<button type="button" data-quest-action="restart">Restart Cycle</button>',
                '<button type="button" data-quest-action="new-run">New Run</button>',
                '<button type="button" data-quest-action="close">Close</button>'
            ].join('');
            state.questChoices.querySelector('[data-quest-action="restart"]').addEventListener('click', function () {
                state.questStep = 0;
                state.questTrace = [];
                if (state.questRollNode) state.questRollNode.textContent = '';
                renderQuestScene();
            });
            state.questChoices.querySelector('[data-quest-action="new-run"]').addEventListener('click', function () {
                state.questStep = 0;
                state.questTrace = [];
                state.questRisk = 0;
                state.questStats = {
                    hermeneutics: 2,
                    hermetics: 1,
                    contestation: 1
                };
                updateRiskVisual();
                renderQuestScene();
            });
            state.questStatus.textContent = 'risk=' + Math.round(state.questRisk) + ' | state=' + questOutcomeLabel();
            if (state.questRollNode) state.questRollNode.textContent = 'campaign terminal reached';
            return;
        }

        state.questStatus.textContent = 'scene=' + String(state.questStep + 1) + '/' + String(QUEST_SCENES.length)
            + ' | risk=' + Math.round(state.questRisk)
            + ' | state=' + questOutcomeLabel();
        state.questPrompt.textContent = scene.prompt;

        state.questChoices.innerHTML = '';
        scene.choices.forEach(function (choice) {
            const button = document.createElement('button');
            button.type = 'button';
            button.setAttribute('data-quest-choice', choice.id);
            button.textContent = '> ' + choice.label + ' [' + choice.check + ' DC' + String(choice.dc) + ']';
            state.questChoices.appendChild(button);
        });
    }

    function applyQuestChoice(choiceId) {
        const scene = QUEST_SCENES[state.questStep];
        if (!scene) return;
        const choice = scene.choices.find(function (item) {
            return item.id === choiceId;
        });
        if (!choice) return;

        const check = questRoll(choice.check, choice.dc);
        const riskShift = check.success ? choice.risk.success : choice.risk.fail;
        state.questRisk = clamp(state.questRisk + riskShift, 0, 100);
        state.questTrace.push(choice.id);
        updateRiskVisual();

        if (check.success && typeof choice.onSuccess === 'function') choice.onSuccess();
        if (!check.success && typeof choice.onFail === 'function') choice.onFail();
        if (check.critical) tuneQuestStat(choice.check, 1);
        if (check.fumble) tuneQuestStat(choice.check, -1);

        if (state.questRollNode) {
            const quality = check.critical ? 'CRITICAL' : (check.fumble ? 'FUMBLE' : (check.success ? 'SUCCESS' : 'FAIL'));
            state.questRollNode.textContent = 'roll=' + String(check.roll)
                + ' + ' + String(check.bonus)
                + ' => ' + String(check.total)
                + ' vs DC' + String(check.dc)
                + ' :: ' + quality;
        }
        appendTrail('quest-choice', {
            scene: state.questStep + 1,
            choice: choice.id,
            risk: state.questRisk,
            check: check
        });

        state.questStep += 1;
        renderQuestScene();
        showPulse(
            'Quest -> ' + choice.label + ' :: ' + (check.success ? 'success' : 'fail') + ' (risk ' + Math.round(state.questRisk) + ')',
            check.success ? 'resonate' : 'wormhole'
        );
    }

    function openQuest() {
        if (!terminalActive()) return;
        const modal = ensureQuestModal();
        if (state.questOpen) {
            closeQuest();
            showPulse('Quest closed', 'map');
            return;
        }

        modal.classList.add('active');
        state.questOpen = true;
        renderQuestScene();
        showPulse('Quest started', 'map');
        flash('map');
        appendTrail('quest-open', { risk: state.questRisk });
    }

    function closeQuest() {
        if (!state.questModal) return;
        state.questModal.classList.remove('active');
        state.questOpen = false;
    }

    function trailSummaryMarkdown() {
        const trail = readTrail().slice(-18);
        const lines = trail.map(function (entry) {
            const iso = (entry.at || '').replace('T', ' ').replace('Z', ' UTC');
            return '- `' + iso + '` ' + entry.event + ' @ `' + (entry.page || '?') + '`';
        });
        return [
            '# SYNTHETICISM.ORG trace',
            '',
            '- page: `' + window.location.pathname + '`',
            '- mode: `' + currentMode() + '`',
            '- term: `' + (state.activeTerm || 'none') + '`',
            '- quest-risk: `' + Math.round(state.questRisk) + '`',
            '- quest-trace: `' + (state.questTrace.join(' > ') || 'none') + '`',
            '- quest-stats: `hermeneutics=' + String(state.questStats.hermeneutics)
                + ', hermetics=' + String(state.questStats.hermetics)
                + ', contestation=' + String(state.questStats.contestation) + '`',
            '',
            '## Recent events',
            lines.length ? lines.join('\n') : '- (empty)',
            '',
            '## Interpretation',
            '> Add your qualitative reading here.'
        ].join('\n');
    }

    function issueDraftUrl(bodyText) {
        const params = new URLSearchParams();
        params.set('title', 'Syntheticism trace: ' + new Date().toISOString().slice(0, 10));
        params.set('body', bodyText || '');
        return GITHUB_ISSUE_BASE + '?' + params.toString();
    }

    function ensureLogModal() {
        if (state.logModal) return state.logModal;

        const modal = document.createElement('div');
        modal.className = 'synthetic-log-modal';
        modal.innerHTML = [
            '<div class="synthetic-log-card">',
            '<div class="synthetic-log-head">',
            '<strong>Trace Logbook</strong>',
            '<div class="synthetic-log-actions">',
            '<button type="button" data-log-action="copy">Copy Markdown</button>',
            '<button type="button" data-log-action="issue">GitHub Draft</button>',
            '<button type="button" data-log-action="close">Close</button>',
            '</div>',
            '</div>',
            '<pre data-log-pre></pre>',
            '<label class="synthetic-log-label" for="synthetic-log-comment">Comment</label>',
            '<textarea id="synthetic-log-comment" data-log-comment placeholder="Write a synthetic note..."></textarea>',
            '<div class="synthetic-log-foot">',
            '<button type="button" data-log-action="save-note">Save Note</button>',
            '<span data-log-status></span>',
            '</div>',
            '</div>'
        ].join('');

        modal.addEventListener('click', function (event) {
            if (event.target === modal) {
                closeLogbook();
                return;
            }
            const button = event.target.closest('[data-log-action]');
            if (!button) return;
            const action = button.getAttribute('data-log-action');
            if (action === 'close') {
                closeLogbook();
                return;
            }
            if (action === 'copy') {
                const content = trailSummaryMarkdown();
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(content).then(function () {
                        showPulse('Trace copied to clipboard', 'map');
                    }).catch(function () {
                        showPulse('Clipboard unavailable', 'clear');
                    });
                } else {
                    showPulse('Clipboard unavailable', 'clear');
                }
                return;
            }
            if (action === 'issue') {
                window.open(issueDraftUrl(trailSummaryMarkdown()), '_blank', 'noopener');
                appendTrail('log-issue-draft', { page: window.location.pathname });
                showPulse('Opened GitHub issue draft', 'wormhole');
                return;
            }
            if (action === 'save-note') {
                const input = state.logComment;
                const text = input ? input.value.trim() : '';
                if (!text) {
                    showPulse('Write a comment first', 'clear');
                    return;
                }
                const notes = readNotes();
                notes.push({
                    at: new Date().toISOString(),
                    page: window.location.pathname,
                    text: text
                });
                writeNotes(notes);
                appendTrail('log-note', { length: text.length });
                input.value = '';
                renderLogbookContent();
                showPulse('Comment saved in local logbook', 'resonate');
            }
        });

        document.body.appendChild(modal);
        state.logModal = modal;
        state.logPre = modal.querySelector('[data-log-pre]');
        state.logComment = modal.querySelector('[data-log-comment]');
        return modal;
    }

    function renderLogbookContent() {
        if (!state.logPre) return;
        const notes = readNotes().slice(-4).map(function (note) {
            const stamp = (note.at || '').replace('T', ' ').replace('Z', ' UTC');
            return '- ' + stamp + ' [' + (note.page || '?') + '] ' + note.text;
        });
        state.logPre.textContent = trailSummaryMarkdown()
            + '\n\n## Saved notes\n'
            + (notes.length ? notes.join('\n') : '- (none)');
    }

    function openLogbook() {
        if (!terminalActive()) return;
        const modal = ensureLogModal();
        if (state.logOpen) {
            closeLogbook();
            showPulse('Logbook closed', 'map');
            return;
        }

        renderLogbookContent();
        modal.classList.add('active');
        state.logOpen = true;
        appendTrail('log-open', { page: window.location.pathname });
        showPulse('Trace logbook opened', 'map');
    }

    function closeLogbook() {
        if (!state.logModal) return;
        state.logModal.classList.remove('active');
        state.logOpen = false;
    }

    function openKiDipfiesPortal() {
        if (!terminalActive()) return;
        appendTrail('portal-link', { to: 'https://computerlars.github.io/KI-DIPFIES/' });
        showPulse('Portal -> KI-DIPFIES', 'wormhole');
        flash('wormhole');
        window.open('https://computerlars.github.io/KI-DIPFIES/', '_blank', 'noopener');
    }

    function ensureControlsBadge() {
        if (state.controlsBadge) return state.controlsBadge;

        const badge = document.createElement('button');
        badge.type = 'button';
        badge.className = 'synthetic-controls-badge';
        badge.hidden = true;
        badge.setAttribute('aria-label', 'Open SYNTHETICISM.ORG terminal');
        badge.innerHTML = [
            '<span class=\"synthetic-controls-badge-dot\">▣</span>',
            '<span class=\"synthetic-controls-badge-text\">synth-terminal</span>'
        ].join('');

        badge.addEventListener('click', function () {
            const enabled = setControlsVisible(true);
            if (enabled && !document.body.classList.contains('synthetic-glitch')) {
                setGlitch(true);
                appendTrail('glitch', { enabled: true, via: 'terminal-click' });
            }
            showPulse('Controls -> ' + (enabled ? 'visible' : 'hidden'), 'map');
            appendTrail('controls', { enabled: enabled, via: 'badge' });
        });

        document.body.appendChild(badge);
        state.controlsBadge = badge;
        return badge;
    }

    function shutdownTerminalRuntime() {
        closeMap();
        closeHermeneutic();
        closeQuest();
        closeLogbook();
        clearOverlayMarks({ keepEchoes: false });
        state.questRisk = 0;
        state.questTrace = [];
        state.questStats = {
            hermeneutics: 2,
            hermetics: 1,
            contestation: 1
        };
        if (state.questRollNode) state.questRollNode.textContent = '';
        setMode('off');
        setGlitch(false);
        updateRiskVisual();
    }

    function setControlsVisible(enabled) {
        const panel = ensureControlsPanel();
        const badge = ensureControlsBadge();
        const active = Boolean(enabled);
        if (!active) shutdownTerminalRuntime();
        if (active) ensureGlobalCorpus();
        panel.hidden = !active;
        badge.hidden = active;
        state.controlsVisible = active;
        localStorage.setItem(CONTROL_KEY, active ? '1' : '0');
        updateControlsStatus();
        return active;
    }

    function cycleMode() {
        const mode = currentMode();
        let nextMode = 'off';
        if (mode === 'off') nextMode = 'resonance';
        if (mode === 'resonance') nextMode = 'drift';
        if (mode === 'drift') nextMode = 'off';

        setMode(nextMode);

        if (nextMode === 'off') {
            clearOverlayMarks({ keepEchoes: false });
            showPulse('Mode -> off', 'clear');
            flash('clear');
            appendTrail('mode', { mode: 'off' });
            return nextMode;
        }

        if (nextMode === 'resonance') resonate();
        if (nextMode === 'drift') drift();

        showPulse('Mode -> ' + nextMode, 'resonate');
        appendTrail('mode', { mode: nextMode });
        return nextMode;
    }

    function handleControlAction(action) {
        if (action === 'mode') cycleMode();
        if (action === 'resonate') resonate();
        if (action === 'drift') drift();
        if (action === 'wormhole') wormhole();
        if (action === 'map') toggleMap();
        if (action === 'hermeneutic') openHermeneutic();
        if (action === 'quest') openQuest();
        if (action === 'log') openLogbook();
        if (action === 'portal') openKiDipfiesPortal();
        if (action === 'glitch') {
            const enabled = setGlitch(!document.body.classList.contains('synthetic-glitch'));
            showPulse('Glitch -> ' + (enabled ? 'on' : 'off'), 'wormhole');
            flash('wormhole');
            appendTrail('glitch', { enabled: enabled });
        }
        if (action === 'clear') clearOverlayMarks({ message: true });
        if (action === 'hide') {
            setControlsVisible(false);
            showPulse('Controls hidden (badge or Alt+Shift+C)', 'clear');
        }
        updateControlsStatus();
    }

    function ensureControlsPanel() {
        if (state.controlsPanel) return state.controlsPanel;

        const panel = document.createElement('aside');
        panel.className = 'synthetic-controls';
        panel.hidden = true;
        panel.innerHTML = [
            '<div class="synthetic-controls-head">SYNTHETICISM.ORG</div>',
            '<div class="synthetic-controls-status">',
            '<span data-syn="mode"></span>',
            '<span data-syn="glitch"></span>',
            '<span data-syn="term"></span>',
            '<span data-syn="hits"></span>',
            '<span data-syn="remote"></span>',
            '<span data-syn="risk"></span>',
            '</div>',
            '<div class="synthetic-controls-grid">',
            '<button type="button" data-action="mode">Mode</button>',
            '<button type="button" data-action="resonate">Resonate</button>',
            '<button type="button" data-action="drift">Drift</button>',
            '<button type="button" data-action="wormhole">Wormhole</button>',
            '<button type="button" data-action="map">Map</button>',
            '<button type="button" data-action="hermeneutic">Hermeneutic</button>',
            '<button type="button" data-action="quest">Quest</button>',
            '<button type="button" data-action="log">Logbook</button>',
            '<button type="button" data-action="portal">KI-DIPFIES</button>',
            '<button type="button" data-action="glitch">Glitch</button>',
            '<button type="button" data-action="clear">Clear</button>',
            '<button type="button" data-action="hide" class="synthetic-controls-hide">Hide</button>',
            '</div>'
        ].join('');

        panel.addEventListener('click', function (event) {
            const button = event.target.closest('button[data-action]');
            if (!button) return;
            handleControlAction(button.dataset.action);
        });

        document.body.appendChild(panel);

        state.controlsPanel = panel;
        state.controlsMode = panel.querySelector('[data-syn="mode"]');
        state.controlsGlitch = panel.querySelector('[data-syn="glitch"]');
        state.controlsTerm = panel.querySelector('[data-syn="term"]');
        state.controlsHits = panel.querySelector('[data-syn="hits"]');
        state.controlsRemote = panel.querySelector('[data-syn="remote"]');
        state.controlsRisk = panel.querySelector('[data-syn="risk"]');

        return panel;
    }

    function showArrivalEffect() {
        const arrival = getArrivalFromLocation();
        if (!arrival) return;

        const source = arrival.from ? (' from ' + arrival.from) : '';
        if (arrival.arrival === 'wormhole') {
            showPulse('Arrived via wormhole' + source, 'wormhole');
            flash('wormhole');
        } else if (arrival.arrival === 'map') {
            showPulse('Arrived via map jump' + source, 'map');
            flash('map');
        } else if (arrival.arrival === 'herm') {
            showPulse('Arrived via hermeneutic jump' + source, 'resonate');
            flash('resonate');
        } else {
            showPulse('Arrival event: ' + arrival.arrival + source, 'map');
        }
    }

    buildIndex();

    touchVisit(canonicalPath(window.location.href));
    const controlsBoot = getControlsFromStorage();
    if (controlsBoot) {
        setControlsVisible(true);
        const initialMode = setMode(getModeFromLocation());
        setGlitch(getGlitchFromLocation());
        if (initialMode === 'resonance') resonate();
        if (initialMode === 'drift') drift();
        showArrivalEffect();
    } else {
        setControlsVisible(false);
    }

    updateRiskVisual();
    updateControlsStatus();

    window.addEventListener('scroll', scheduleRedraw, { passive: true });
    window.addEventListener('resize', scheduleRedraw);

    document.addEventListener('keydown', function (event) {
        if (event.defaultPrevented || isEditableTarget(event.target)) return;

        if (event.key === 'Escape') {
            if (state.mapOpen) {
                event.preventDefault();
                closeMap();
                showPulse('Map closed', 'map');
                return;
            }
            if (state.hermOpen) {
                event.preventDefault();
                closeHermeneutic();
                showPulse('Hermeneutic web closed', 'map');
                return;
            }
            if (state.questOpen) {
                event.preventDefault();
                closeQuest();
                showPulse('Quest closed', 'map');
                return;
            }
            if (state.logOpen) {
                event.preventDefault();
                closeLogbook();
                showPulse('Logbook closed', 'map');
                return;
            }
        }

        if (!event.altKey || !event.shiftKey || event.metaKey || event.ctrlKey) return;

        const key = event.key.toLowerCase();
        if (key === 'c') {
            event.preventDefault();
            const enabled = setControlsVisible(!state.controlsVisible);
            showPulse('Controls -> ' + (enabled ? 'visible' : 'hidden'), 'map');
            appendTrail('controls', { enabled: enabled });
            return;
        }

        if (!terminalActive()) return;

        if (key === 'm') {
            event.preventDefault();
            cycleMode();
        }
        if (key === 'r') {
            event.preventDefault();
            resonate();
        }
        if (key === 'd') {
            event.preventDefault();
            drift();
        }
        if (key === 'w') {
            event.preventDefault();
            wormhole();
        }
        if (key === 'p') {
            event.preventDefault();
            toggleMap();
        }
        if (key === 'e') {
            event.preventDefault();
            openHermeneutic();
        }
        if (key === 'q') {
            event.preventDefault();
            openQuest();
        }
        if (key === 'l') {
            event.preventDefault();
            openLogbook();
        }
        if (key === 'k') {
            event.preventDefault();
            openKiDipfiesPortal();
        }
        if (key === 'x') {
            event.preventDefault();
            clearOverlayMarks({ message: true });
        }
        if (key === 'g') {
            event.preventDefault();
            const enabled = setGlitch(!document.body.classList.contains('synthetic-glitch'));
            showPulse('Glitch -> ' + (enabled ? 'on' : 'off'), 'wormhole');
            flash('wormhole');
            appendTrail('glitch', { enabled: enabled });
        }
    });

    window.syntheticism = {
        mode: function () {
            return currentMode();
        },
        setMode: setMode,
        glitch: function () {
            return document.body.classList.contains('synthetic-glitch');
        },
        setGlitch: setGlitch,
        controlsVisible: function () {
            return state.controlsVisible;
        },
        setControlsVisible: setControlsVisible,
        resonate: resonate,
        drift: drift,
        wormhole: wormhole,
        openMap: openMap,
        closeMap: closeMap,
        hermeneutic: openHermeneutic,
        quest: openQuest,
        logbook: openLogbook,
        portal: openKiDipfiesPortal,
        echo: function () {
            return resonate();
        },
        clear: function () {
            clearOverlayMarks({ message: true });
        },
        visits: readVisits,
        trail: readTrail,
        explain: function () {
            return {
                mode: currentMode(),
                shortcuts: [
                    'Alt+Shift+C: toggle on-screen control panel',
                    'Alt+Shift+M: cycle overlay mode (off -> resonance -> drift)',
                    'Alt+Shift+R: resonance highlight + relation lines',
                    'Alt+Shift+D: drift vector jump + target lock',
                    'Alt+Shift+W: least-visited page wormhole jump',
                    'Alt+Shift+P: multiversal map modal',
                    'Alt+Shift+E: hermeneutic relation web',
                    'Alt+Shift+Q: quest scenes + consequence',
                    'Alt+Shift+L: open trace logbook',
                    'Alt+Shift+K: portal to KI-DIPFIES',
                    'Alt+Shift+G: toggle CRT glitch veil',
                    'Alt+Shift+X: clear overlays'
                ]
            };
        }
    };
});
