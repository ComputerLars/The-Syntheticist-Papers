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

    const blocks = Array.from(document.querySelectorAll(BLOCK_SELECTOR)).filter(function (element) {
        return element.textContent && element.textContent.trim().length > 80;
    });

    const tokenToBlocks = new Map();
    const blockTokens = new WeakMap();
    const blockOrder = new WeakMap();
    const tokenTransitions = new Map();
    const blockAxisScores = new WeakMap();

    const state = {
        controlsPanel: null,
        controlsMode: null,
        controlsGlitch: null,
        controlsTerm: null,
        controlsHits: null,
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
        activeTerm: '',
        driftVector: null,
        driftVectors: [],
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

    function buildIndex() {
        blocks.forEach(function (block, index) {
            const tokens = tokenize(block.textContent || '');
            const unique = new Set(tokens);
            blockTokens.set(block, unique);
            blockOrder.set(block, index);
            blockAxisScores.set(block, axisVectorFromTokens(tokens));
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
        return Array.from(tokenToBlocks.entries()).filter(function (entry) {
            const blockCount = entry[1].size;
            return blockCount > 1 && blockCount <= Math.max(2, Math.floor(blocks.length * 0.45));
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
        if (!term || !tokenToBlocks.has(term)) return false;
        return tokenToBlocks.get(term).size > 1;
    }

    function nextMarkovTerm(term, visitedTerms) {
        const transitions = tokenTransitions.get(term);
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
        state.activeTerm = resolvedTerm;
        state.driftVector = null;
        state.driftVectors = [];
        renderConnections();

        spawnEchoes(resolvedTerm, targets);
        showPulse('Resonance: ' + resolvedTerm + ' [' + targets.length + ']', 'resonate');
        flash('resonate');
        appendTrail('resonate', { term: resolvedTerm, hits: targets.length });
        updateControlsStatus();
        return resolvedTerm;
    }

    function drift() {
        if (!terminalActive()) return null;
        if (blocks.length < 2) return null;

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

    function sharedTokens(leftBlock, rightBlock, limit) {
        const left = Array.from(blockTokens.get(leftBlock) || []);
        const right = new Set(Array.from(blockTokens.get(rightBlock) || []));
        const overlap = left.filter(function (token) {
            return right.has(token);
        });
        return overlap.slice(0, limit || 5);
    }

    function blockAxisProfile(block) {
        return blockAxisScores.get(block) || axisVectorFromTokens(Array.from(blockTokens.get(block) || []));
    }

    function axisDistance(leftVector, rightVector) {
        let total = 0;
        THEORY_AXES.forEach(function (axis) {
            total += Math.abs((leftVector[axis.id] || 0) - (rightVector[axis.id] || 0));
        });
        return total;
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

    function relationKind(overlap, leftText, rightText, leftVector, rightVector) {
        const conflictPattern = /\b(not|never|without|against|fail|fails|failed|failing|fracture|collapse|refuse|refused|refusal|denial|contradiction)\b/i;
        const contradiction = conflictPattern.test(leftText || '') || conflictPattern.test(rightText || '');
        const distance = axisDistance(leftVector || {}, rightVector || {});
        if (distance >= 6 && overlap.length <= 2) return 'aporia';
        if (contradiction && overlap.length <= 2) return 'friction';
        if (overlap.length >= 4) return 'convergence';
        if (overlap.length >= 2) return 'mutation';
        if (contradiction) return 'friction';
        return 'aporia';
    }

    function relationNarrative(term, kind, overlap, shiftLabel) {
        const meta = relationMeta(kind);
        const bridge = overlap.length ? overlap.join(', ') : 'no stable bridge';
        const shift = shiftLabel ? (' Axis shift: ' + shiftLabel + '.') : '';
        return meta.label + ': "' + term + '" routes through [' + bridge + '] and ' + meta.cue + '.' + shift;
    }

    function pairKey(a, b) {
        const leftIndex = blockOrder.get(a);
        const rightIndex = blockOrder.get(b);
        if (typeof leftIndex !== 'number' || typeof rightIndex !== 'number') return '';
        return leftIndex < rightIndex ? (leftIndex + ':' + rightIndex) : (rightIndex + ':' + leftIndex);
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

        const pairs = [];
        const seen = new Set();
        const addPair = function (leftBlock, rightBlock) {
            if (!leftBlock || !rightBlock || leftBlock === rightBlock) return;
            const key = pairKey(leftBlock, rightBlock);
            if (!key || seen.has(key)) return;
            seen.add(key);

            const overlap = sharedTokens(leftBlock, rightBlock, 4);
            const fromAxis = blockAxisProfile(leftBlock);
            const toAxis = blockAxisProfile(rightBlock);
            const shiftLabel = axisShiftLabel(fromAxis, toAxis);
            const kind = relationKind(overlap, leftBlock.textContent || '', rightBlock.textContent || '', fromAxis, toAxis);
            pairs.push({
                kind: kind,
                from: leftBlock,
                to: rightBlock,
                overlap: overlap,
                label: relationMeta(kind).label,
                shift: shiftLabel,
                fromAxis: dominantAxes(fromAxis, 2),
                toAxis: dominantAxes(toAxis, 2),
                fromText: excerpt(leftBlock.textContent || '', 20),
                toText: excerpt(rightBlock.textContent || '', 20),
                narrative: relationNarrative(term, kind, overlap, shiftLabel)
            });
        };

        for (let index = 0; index < sourceHits.length - 1; index += 1) {
            addPair(sourceHits[index], sourceHits[index + 1]);
            if (pairs.length >= 6) break;
        }

        let attempts = 0;
        while (pairs.length < Math.min(8, sourceHits.length + 2) && attempts < 30) {
            attempts += 1;
            const left = randomItem(sourceHits);
            const right = randomItem(sourceHits);
            addPair(left, right);
        }

        return pairs;
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

    function detournementCutup(term, hits) {
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
            fragmentCount: remixed.length
        };
    }

    function aggregateAxisForHits(hits) {
        const vectors = (hits || []).map(function (block) {
            return blockAxisProfile(block);
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
        pairs.forEach(function (pair, index) {
            const item = document.createElement('article');
            item.className = 'synthetic-herm-item synthetic-herm-item-' + pair.kind;
            const fromAxis = pair.fromAxis.map(function (entry) {
                return entry.label + ' (' + entry.score + ')';
            }).join(' | ') || 'none';
            const toAxis = pair.toAxis.map(function (entry) {
                return entry.label + ' (' + entry.score + ')';
            }).join(' | ') || 'none';
            item.innerHTML = [
                '<div class="synthetic-herm-item-head">#', String(index + 1).padStart(2, '0'), ' ', escapeHtml(pair.label), '</div>',
                '<div class="synthetic-herm-item-body">',
                '<div class="synthetic-herm-item-from"><span>FROM</span> ', escapeHtml(pair.fromText), '</div>',
                '<div class="synthetic-herm-item-to"><span>TO</span> ', escapeHtml(pair.toText), '</div>',
                '<div class="synthetic-herm-item-bridge"><span>BRIDGE</span> ', escapeHtml(pair.overlap.join(', ') || 'none'), '</div>',
                '<div class="synthetic-herm-item-shift"><span>SHIFT</span> ', escapeHtml(pair.shift || 'undetermined'), '</div>',
                '<div class="synthetic-herm-item-axis"><span>AXIS-FROM</span> ', escapeHtml(fromAxis), '</div>',
                '<div class="synthetic-herm-item-axis"><span>AXIS-TO</span> ', escapeHtml(toAxis), '</div>',
                '<div class="synthetic-herm-item-note">', escapeHtml(pair.narrative), '</div>',
                '</div>'
            ].join('');
            state.hermList.appendChild(item);
        });

        const summary = state.hermModal.querySelector('[data-herm-summary]');
        if (summary) {
            summary.textContent = 'TERM=' + (term || 'none') + ' | RELATIONS=' + pairs.length + ' | READING=qualitative';
        }

        if (state.hermAxis) {
            const axisVector = aggregateAxisForHits(hits || []);
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
            const montage = detournementCutup(term, hits || []);
            if (!montage) {
                state.hermCutup.innerHTML = '<strong>Detournement</strong><p>Not enough fragments for cut-up synthesis.</p>';
            } else {
                state.hermCutup.innerHTML = [
                    '<strong>Detournement Cut-Up</strong>',
                    '<p>sources=', String(montage.sourceCount), ' fragments=', String(montage.fragmentCount), '</p>',
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
        const pairs = buildHermeneuticPairs(term, hits);
        if (!pairs.length) {
            showPulse('No relation pairs found', 'map');
            return null;
        }

        state.hermPairs = pairs;
        pairs.forEach(function (pair) {
            pair.from.classList.add('synthetic-herm-source');
            pair.to.classList.add('synthetic-herm-target');
        });
        scheduleRedraw();

        renderHermeneuticCards(term, pairs, hits);
        modal.classList.add('active');
        state.hermOpen = true;
        showPulse('Hermeneutic web composed: ' + pairs.length + ' links + detournement', 'resonate');
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
