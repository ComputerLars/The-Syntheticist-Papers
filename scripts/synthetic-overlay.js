document.addEventListener('DOMContentLoaded', function () {
    const OVERLAY_MODES = new Set(['off', 'resonance', 'drift']);
    const TRAIL_KEY = 'syntheticism-trail-v1';
    const MODE_KEY = 'syntheticism-overlay-mode';
    const GLITCH_KEY = 'syntheticism-glitch-v1';
    const VISITS_KEY = 'syntheticism-visits-v1';
    const BLOCK_SELECTOR = '.content p, .content li, .content blockquote';
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

    const blocks = Array.from(document.querySelectorAll(BLOCK_SELECTOR)).filter(function (element) {
        return element.textContent && element.textContent.trim().length > 80;
    });
    const tokenToBlocks = new Map();
    const blockTokens = new WeakMap();

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

    function buildIndex() {
        blocks.forEach(function (block) {
            const unique = new Set(tokenize(block.textContent || ''));
            blockTokens.set(block, unique);
            unique.forEach(function (token) {
                if (!tokenToBlocks.has(token)) {
                    tokenToBlocks.set(token, new Set());
                }
                tokenToBlocks.get(token).add(block);
            });
        });
    }

    function clearOverlayMarks() {
        blocks.forEach(function (block) {
            block.classList.remove('synthetic-hit', 'synthetic-origin', 'synthetic-drift-target');
            delete block.dataset.syntheticTerm;
        });
        delete document.body.dataset.syntheticTerm;
    }

    function termPool() {
        return Array.from(tokenToBlocks.entries()).filter(function (entry) {
            const blockCount = entry[1].size;
            return blockCount > 1 && blockCount <= Math.max(2, Math.floor(blocks.length * 0.45));
        });
    }

    function setMode(nextMode) {
        const normalized = OVERLAY_MODES.has(nextMode) ? nextMode : 'off';
        document.body.dataset.syntheticOverlay = normalized;
        localStorage.setItem(MODE_KEY, normalized);
        return normalized;
    }

    function appendTrail(eventName, payload) {
        let trail = [];
        try {
            trail = JSON.parse(localStorage.getItem(TRAIL_KEY) || '[]');
        } catch (_error) {
            trail = [];
        }
        trail.push({
            event: eventName,
            at: new Date().toISOString(),
            page: window.location.pathname,
            payload: payload || {}
        });
        if (trail.length > 64) {
            trail = trail.slice(trail.length - 64);
        }
        localStorage.setItem(TRAIL_KEY, JSON.stringify(trail));
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

    function visitScore(pathname) {
        const visits = readVisits();
        return visits[pathname] || 0;
    }

    function touchVisit(pathname) {
        if (!pathname) return;
        const visits = readVisits();
        visits[pathname] = (visits[pathname] || 0) + 1;
        writeVisits(visits);
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

    function setGlitch(enabled) {
        const active = Boolean(enabled);
        document.body.classList.toggle('synthetic-glitch', active);
        localStorage.setItem(GLITCH_KEY, active ? '1' : '0');
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

    function resonate(term) {
        if (!blocks.length) return null;

        const pool = termPool();
        if (!pool.length) return null;

        const resolvedTerm = term && tokenToBlocks.has(term) ? term : pickTerm(pool);
        const targets = Array.from(tokenToBlocks.get(resolvedTerm) || []);
        if (!targets.length) return null;

        clearOverlayMarks();
        targets.forEach(function (block) {
            block.classList.add('synthetic-hit');
            block.dataset.syntheticTerm = resolvedTerm;
        });
        document.body.dataset.syntheticTerm = resolvedTerm;
        appendTrail('resonate', { term: resolvedTerm, hits: targets.length });
        return resolvedTerm;
    }

    function drift() {
        if (blocks.length < 2) return null;

        const origin = randomItem(blocks);
        const tokens = Array.from(blockTokens.get(origin) || []).filter(function (token) {
            return tokenToBlocks.has(token) && tokenToBlocks.get(token).size > 1;
        });

        if (!tokens.length) return null;

        const chosenTerm = randomItem(tokens);
        const candidateTargets = Array.from(tokenToBlocks.get(chosenTerm)).filter(function (candidate) {
            return candidate !== origin;
        });
        const target = randomItem(candidateTargets);

        if (!target) return null;

        resonate(chosenTerm);
        origin.classList.add('synthetic-origin');
        target.classList.add('synthetic-drift-target');
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        appendTrail('drift', { term: chosenTerm });
        return chosenTerm;
    }

    function wormhole() {
        const currentPath = canonicalPath(window.location.href);
        const links = Array.from(document.querySelectorAll('.fixed-menu a[href]')).filter(function (link) {
            if (!link.href) return false;
            if (link.origin !== window.location.origin) return false;
            const path = canonicalPath(link.href);
            return path && path !== currentPath;
        });

        const weighted = links.map(function (link) {
            const path = canonicalPath(link.href);
            return {
                link: link,
                path: path,
                visits: visitScore(path)
            };
        });
        if (!weighted.length) return null;

        const minVisits = Math.min.apply(null, weighted.map(function (item) {
            return item.visits;
        }));
        const leastVisited = weighted.filter(function (item) {
            return item.visits === minVisits;
        });
        const destination = randomItem(leastVisited);
        if (!destination) return null;

        const targetUrl = new URL(destination.link.href);
        const currentMode = document.body.dataset.syntheticOverlay || 'off';
        if (currentMode !== 'off' && !targetUrl.searchParams.has('overlay')) {
            targetUrl.searchParams.set('overlay', currentMode);
        }

        appendTrail('wormhole', { to: destination.path, visits: destination.visits });
        window.location.href = targetUrl.toString();
        return targetUrl.toString();
    }

    function cycleMode() {
        const current = document.body.dataset.syntheticOverlay || 'off';
        let nextMode = 'off';
        if (current === 'off') nextMode = 'resonance';
        if (current === 'resonance') nextMode = 'drift';
        if (current === 'drift') nextMode = 'off';
        setMode(nextMode);
        clearOverlayMarks();
        if (nextMode === 'resonance') resonate();
        if (nextMode === 'drift') drift();
        return nextMode;
    }

    buildIndex();
    const initialMode = setMode(getModeFromLocation());
    setGlitch(getGlitchFromLocation());
    touchVisit(canonicalPath(window.location.href));
    if (initialMode === 'resonance') resonate();
    if (initialMode === 'drift') drift();

    document.addEventListener('keydown', function (event) {
        if (event.defaultPrevented || isEditableTarget(event.target)) return;
        if (!event.altKey || !event.shiftKey || event.metaKey || event.ctrlKey) return;

        const key = event.key.toLowerCase();
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
        if (key === 'x') {
            event.preventDefault();
            clearOverlayMarks();
        }
        if (key === 'g') {
            event.preventDefault();
            const enabled = setGlitch(!document.body.classList.contains('synthetic-glitch'));
            appendTrail('glitch', { enabled: enabled });
        }
    });

    window.syntheticism = {
        mode: function () {
            return document.body.dataset.syntheticOverlay || 'off';
        },
        setMode: setMode,
        glitch: function () {
            return document.body.classList.contains('synthetic-glitch');
        },
        setGlitch: setGlitch,
        resonate: resonate,
        drift: drift,
        wormhole: wormhole,
        clear: clearOverlayMarks,
        visits: readVisits,
        trail: function () {
            try {
                return JSON.parse(localStorage.getItem(TRAIL_KEY) || '[]');
            } catch (_error) {
                return [];
            }
        },
        explain: function () {
            return {
                mode: document.body.dataset.syntheticOverlay || 'off',
                shortcuts: [
                    'Alt+Shift+M: cycle overlay mode (off -> resonance -> drift)',
                    'Alt+Shift+R: resonance highlight',
                    'Alt+Shift+D: drift jump',
                    'Alt+Shift+W: least-visited page wormhole',
                    'Alt+Shift+X: clear active overlays',
                    'Alt+Shift+G: toggle CRT glitch veil'
                ]
            };
        }
    };
});
