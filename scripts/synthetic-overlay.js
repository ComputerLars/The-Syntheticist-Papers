document.addEventListener('DOMContentLoaded', function () {
    const OVERLAY_MODES = new Set(['off', 'resonance', 'drift']);
    const TRAIL_KEY = 'syntheticism-trail-v1';
    const MODE_KEY = 'syntheticism-overlay-mode';
    const GLITCH_KEY = 'syntheticism-glitch-v1';
    const CONTROL_KEY = 'syntheticism-controls-v1';
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

    const state = {
        controlsPanel: null,
        controlsMode: null,
        controlsGlitch: null,
        controlsTerm: null,
        controlsHits: null,
        linksLayer: null,
        echoLayer: null,
        toastStack: null,
        mapModal: null,
        mapNodes: null,
        portalOverlay: null,
        activeHits: [],
        activeTerm: '',
        driftVector: null,
        redrawPending: false,
        controlsVisible: false,
        mapOpen: false,
        portalTimer: null
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

    function buildIndex() {
        blocks.forEach(function (block) {
            const unique = new Set(tokenize(block.textContent || ''));
            blockTokens.set(block, unique);
            unique.forEach(function (token) {
                if (!tokenToBlocks.has(token)) tokenToBlocks.set(token, new Set());
                tokenToBlocks.get(token).add(block);
            });
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

    function getControlsFromLocation() {
        const url = new URL(window.location.href);
        const queryControls = (url.searchParams.get('controls') || '').toLowerCase();
        if (['1', 'true', 'on'].includes(queryControls)) return true;
        if (['0', 'false', 'off'].includes(queryControls)) return false;
        const hashControlsMatch = (url.hash || '').match(/controls=(on|off|true|false|1|0)/i);
        if (hashControlsMatch) {
            return ['on', 'true', '1'].includes(hashControlsMatch[1].toLowerCase());
        }
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

        if (!state.activeHits.length && !state.driftVector) return;

        const sortedHits = state.activeHits.slice().sort(function (a, b) {
            return a.getBoundingClientRect().top - b.getBoundingClientRect().top;
        });

        for (let index = 0; index < sortedHits.length - 1; index += 1) {
            drawPath(layer, blockCenter(sortedHits[index]), blockCenter(sortedHits[index + 1]), 'synthetic-link');
        }

        if (state.driftVector && state.driftVector.origin && state.driftVector.target) {
            drawPath(layer, blockCenter(state.driftVector.origin), blockCenter(state.driftVector.target), 'synthetic-link-drift');
        }
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
            block.classList.remove('synthetic-hit', 'synthetic-origin', 'synthetic-drift-target');
            delete block.dataset.syntheticTerm;
        });
        delete document.body.dataset.syntheticTerm;

        state.activeHits = [];
        state.activeTerm = '';
        state.driftVector = null;

        clearLinkLayer();
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

    function setGlitch(enabled) {
        const active = Boolean(enabled);
        document.body.classList.toggle('synthetic-glitch', active);
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

    function resonate(term) {
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
        renderConnections();

        spawnEchoes(resolvedTerm, targets);
        showPulse('Resonance: ' + resolvedTerm + ' [' + targets.length + ']', 'resonate');
        flash('resonate');
        appendTrail('resonate', { term: resolvedTerm, hits: targets.length });
        updateControlsStatus();
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
        const targetCandidates = Array.from(tokenToBlocks.get(chosenTerm) || []).filter(function (candidate) {
            return candidate !== origin;
        });
        const target = randomItem(targetCandidates);
        if (!target) return null;

        resonate(chosenTerm);
        origin.classList.add('synthetic-origin');
        target.classList.add('synthetic-drift-target');
        state.driftVector = { origin: origin, target: target, term: chosenTerm };

        renderConnections();
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        showPulse('Drift vector: ' + chosenTerm, 'drift');
        flash('drift');
        appendTrail('drift', { term: chosenTerm });
        updateControlsStatus();
        return chosenTerm;
    }

    function currentMode() {
        return document.body.dataset.syntheticOverlay || 'off';
    }

    function controlsActive() {
        return state.controlsPanel && !state.controlsPanel.hidden;
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
        if (controlsActive()) targetUrl.searchParams.set('controls', 'on');
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
            if (controlsActive()) targetUrl.searchParams.set('controls', 'on');
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

    function setControlsVisible(enabled) {
        const panel = ensureControlsPanel();
        const active = Boolean(enabled);
        panel.hidden = !active;
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
        if (action === 'echo') {
            const term = state.activeTerm || resonate();
            if (term) spawnEchoes(term, state.activeHits);
        }
        if (action === 'glitch') {
            const enabled = setGlitch(!document.body.classList.contains('synthetic-glitch'));
            showPulse('Glitch -> ' + (enabled ? 'on' : 'off'), 'wormhole');
            flash('wormhole');
            appendTrail('glitch', { enabled: enabled });
        }
        if (action === 'clear') clearOverlayMarks({ message: true });
        if (action === 'hide') {
            setControlsVisible(false);
            showPulse('Controls hidden (Alt+Shift+C to reopen)', 'clear');
        }
        updateControlsStatus();
    }

    function ensureControlsPanel() {
        if (state.controlsPanel) return state.controlsPanel;

        const panel = document.createElement('aside');
        panel.className = 'synthetic-controls';
        panel.hidden = true;
        panel.innerHTML = [
            '<div class="synthetic-controls-head">Synthetic Controls</div>',
            '<div class="synthetic-controls-status">',
            '<span data-syn="mode"></span>',
            '<span data-syn="glitch"></span>',
            '<span data-syn="term"></span>',
            '<span data-syn="hits"></span>',
            '</div>',
            '<div class="synthetic-controls-grid">',
            '<button type="button" data-action="mode">Mode</button>',
            '<button type="button" data-action="resonate">Resonate</button>',
            '<button type="button" data-action="drift">Drift</button>',
            '<button type="button" data-action="wormhole">Wormhole</button>',
            '<button type="button" data-action="map">Map</button>',
            '<button type="button" data-action="echo">Echo</button>',
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

    const initialMode = setMode(getModeFromLocation());
    setGlitch(getGlitchFromLocation());
    touchVisit(canonicalPath(window.location.href));
    setControlsVisible(getControlsFromLocation());
    showArrivalEffect();

    if (initialMode === 'resonance') resonate();
    if (initialMode === 'drift') drift();
    updateControlsStatus();

    window.addEventListener('scroll', scheduleRedraw, { passive: true });
    window.addEventListener('resize', scheduleRedraw);

    document.addEventListener('keydown', function (event) {
        if (event.defaultPrevented || isEditableTarget(event.target)) return;

        if (event.key === 'Escape' && state.mapOpen) {
            event.preventDefault();
            closeMap();
            showPulse('Map closed', 'map');
            return;
        }

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
        if (key === 'p') {
            event.preventDefault();
            toggleMap();
        }
        if (key === 'e') {
            event.preventDefault();
            const term = state.activeTerm || resonate();
            if (term) spawnEchoes(term, state.activeHits);
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
        if (key === 'c') {
            event.preventDefault();
            const enabled = setControlsVisible(!state.controlsVisible);
            showPulse('Controls -> ' + (enabled ? 'visible' : 'hidden'), 'map');
            appendTrail('controls', { enabled: enabled });
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
        echo: function () {
            const term = state.activeTerm || resonate();
            if (!term) return null;
            spawnEchoes(term, state.activeHits);
            return term;
        },
        clear: function () {
            clearOverlayMarks({ message: true });
        },
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
                mode: currentMode(),
                shortcuts: [
                    'Alt+Shift+C: toggle on-screen control panel',
                    'Alt+Shift+M: cycle overlay mode (off -> resonance -> drift)',
                    'Alt+Shift+R: resonance highlight + relation lines',
                    'Alt+Shift+D: drift vector jump + target lock',
                    'Alt+Shift+W: least-visited page wormhole jump',
                    'Alt+Shift+P: multiversal map modal',
                    'Alt+Shift+E: echo popup cloud',
                    'Alt+Shift+G: toggle CRT glitch veil',
                    'Alt+Shift+X: clear overlays'
                ]
            };
        }
    };
});
