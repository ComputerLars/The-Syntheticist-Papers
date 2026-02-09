document.addEventListener('DOMContentLoaded', function () {
    const OVERLAY_MODES = new Set(['off', 'resonance', 'drift']);
    const TRAIL_KEY = 'syntheticism-trail-v1';
    const MODE_KEY = 'syntheticism-overlay-mode';
    const BLOCK_SELECTOR = '.content p, .content li, .content blockquote';
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

    function resonate(term) {
        if (!blocks.length) return null;

        const pool = termPool();
        if (!pool.length) return null;

        const resolvedTerm = term && tokenToBlocks.has(term) ? term : randomItem(pool)[0];
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
        const links = Array.from(document.querySelectorAll('.fixed-menu a[href]')).filter(function (link) {
            if (!link.href) return false;
            if (link.href === window.location.href) return false;
            return link.origin === window.location.origin;
        });

        const destination = randomItem(links);
        if (!destination) return null;

        appendTrail('wormhole', { to: destination.href });
        window.location.href = destination.href;
        return destination.href;
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
    });

    window.syntheticism = {
        mode: function () {
            return document.body.dataset.syntheticOverlay || 'off';
        },
        setMode: setMode,
        resonate: resonate,
        drift: drift,
        wormhole: wormhole,
        clear: clearOverlayMarks,
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
                    'Alt+Shift+W: random page wormhole',
                    'Alt+Shift+X: clear active overlays'
                ]
            };
        }
    };
});
