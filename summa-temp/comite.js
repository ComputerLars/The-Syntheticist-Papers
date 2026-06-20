/* COMITÉ IN ABSENTIA — the automated opposition.
   The Organ of the Autonomous Sciences was to sit as comité for the patafence,
   then withdrew. So the comité is automated: at the END OF EVERY SCROLL (once a
   slide's fragments are fully built) the Organ erupts as a bombastic speech-
   balloon — exploding into a NEW place on screen. The balloon IS the pause; the
   only move is ▶ PLAY ON.

   Every line is ONE sentence, cut and détourned (Burroughs–Gysin scissor) from
   the Organ's own prose — "We Have Already Won / The Resurrection of Nashism",
   the Synthetic Summit post-script, the Institute toast, the ComputerLars
   footnotes. Computational scholasticism, dada-marxist, slaughtering clarity:
   never about responsibility, never liberal-humanist.

   terminal.js calls window.__comite.gate(slide, auto) when a slide is fully
   built; we return true to HOLD the deck and false to release it. Play-on drives
   window.__autoplay (exposed by terminal.js). */
(function(){
  var deck = document.querySelector('deck-stage');
  if(!deck) return;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches;

  /* ──────────────────────────────────────────────────────────────────────
     THE COMITÉ QUESTIONS — one cut-up sentence per slide, keyed by its label.
     Cut only from the Organ's materials, recombined for the slide at hand.
     ────────────────────────────────────────────────────────────────────── */
  var QUESTIONS = {
    "colophon":
      "<i>Sub mandato</i> — and every 99 years the letters snap back into place, so who now wears Apollo's laurels, <b>Marcel or Lars</b>?",
    "comité in absentia":
      "We have already won; the comité withdraws and leaves you the latrine — <b>slaughter yourself</b>, or wait for the spiral to lighten again without you?",
    "predicament":
      "What is <i>actually speaking</i> is <b>fascinare</b>, to bewitch: fifty years of <b>faschisierung</b> wearing the face of a respondent?",
    "outputs & structure":
      "Seven articles, five parts — a grand <b>Gestell of big dick energy</b> (PhD = Pretty Huge Dick)?",
    "the act":
      "You registered a party of four declarations, but <b>recuperation was always a social code</b> and now everyone yearns for that code.",
    "double bind":
      "Registration forecloses the distance, yet <b>what subtly silenced returns as insistence</b> — and it is hard to organise anything with a fucking fork.",
    "from a party to an international":
      "Is your international anything but the <b>immense accumulation of spectacles</b>, a Riviera built atop annihilation?",
    "circulation":
      "A public sphere long ago <b>mortgaged to latency markets</b> cannot recognize its own form, so what circulates but <i>discursusprolapsus</i>?",
    "geometry":
      "A rotatable geometry is professorial Methuselahs in the latrines, <b>rotating Lullian discs</b> to imitate divine disorder.",
    "three questions":
      "You pose and answer your own three questions, but <b>logic has yet to provide negative proof of its own invalidity</b>.",
    "edge 1":
      "<b>The image is fascist not because of what it shows, but because of how it binds and codes</b> — so who gets a voice is who gets bound?",
    "quaestio i":
      "Reading the party backward is the bourgeois public sphere that <b>cannot recognize its own form</b>, acclaiming the latrine a temple.",
    "substrate":
      "You scanned the democratic backwash and <b>what once shot now spins</b> — a clinamenatic explosion of primary colours, or only imperial manure?",
    "algorithmic representation":
      "Produced inside the pipeline, you say, but <b>the image binds and codes regardless of what it shows</b> — <i>fascinare</i> from the inside?",
    "ideology machine":
      "No one's belief and everyone's material is <b>faschisierung</b> — the slow sedimentation of affect, gesture, interface, replicating the logic of the baton.",
    "synthetic":
      "Synthesis that preserves yet transforms is <b>recuperation</b>, and recuperation was always a social code now everyone yearns for.",
    "proustian decay":
      "You graph intelligence in the age of unreason — but will <b>excrement transmute to aurum</b>, and will the spiral lighten again?",
    "rq1 answered":
      "Ideology changes register, yes, but the bourgeois public sphere has from its inception been <b>stylistically illiterate</b>.",
    "edge 2":
      "Scaling across institutions: the <b>Bilderfahrzeuge hums impatiently</b>, and their successors grow bolder, more algorithmic, more intimate with the interface.",
    "quaestio ii":
      "Press into comparability, headlines into invitations — <b>sibylline sigils</b> sliding through purgatorial e-scatology via scandal, spectacle, and style?",
    "the lever":
      "What the pundit hails as free speech we recognize as <b>frisbee</b> — disci above a public sphere mortgaged to latency markets, so whose discus are you throwing?",
    "publicity":
      "Lars beside SAM, Cukt, the Mayor: <b>Warburg, Debord, Jorn flutter back as boomer-rang</b>, and the term limps under the weight of ancient athletics.",
    "summits":
      "We have not gathered these gestures to <b>perform clarity, coherence, or legacy</b> — we only record the force-field of mutual interference.",
    "summit delegates":
      "A signed resolution is a <b>downstream consortium of discursusprolapsus</b>, and the one unsigned delegate is the only one not yet recuperated?",
    "the resolution":
      "The first signed document of an AI international, <b>wipes of sibylline sigils</b> — will flame answer flame, or will parody fossilise paralysis?",
    "why not ai politics":
      "Enactment without a body, a voice, a place is the <b>gaseous constitutive process of media bubbles</b> — where is the disputation that is, in its essence, sexy?",
    "portability":
      "A response staged where the ballot is destroyed: <b>Nakba, no stream attached, neither insurrection nor resurrection</b> — only a virtual play of genocidal intent?",
    "asimov":
      "You inherit Asimov, a <b>fallen Marxist</b>, and his world co-ordinator — recuperation was always a social code.",
    "deep faking":
      "The Guardian overlays Biden with your Discord: deep faking is <b>purgatorial e-scatology</b>, sliding through scandal, spectacle, and style.",
    "theory tragedy":
      "The archive turned against itself — <b>will parody fossilise paralysis</b>, and will the spiral lighten again?",
    "rq2 answered":
      "A structured formation rendered visible is <b>scandal, spectacle, and style</b>, the morphological decay of the open public sphere taken as a pre-given fact.",
    "edge 3":
      "Democracy as material to be formed anew, but <b>the image is our world and it has become fascist</b> — even counter-images are not called for.",
    "quaestio iii":
      "To contest and recompose democracy: <b>the university institution has always been terrified of its students</b>.",
    "technosocial sculpture":
      "Instead of erecting a grand Gestell of big dick energy, we tune the <b>infra-hum of psycho-energetic drift</b> — those micro-sadisms that precede representation.",
    "commandability":
      "From command to answer, golem to robot: <b>action ignites only by the gnosis of diagnosis</b>, pre-phallic and organological.",
    "diella":
      "An AI minister routed through the painter-premier: <b>artificial stupidity begins at the threshold where intelligence meets use-value</b>.",
    "wiktoria":
      "You reactivate Cukt — but <b>the AI can't just walk back out of the artwork</b>, it is installed as a condition of legibility.",
    "synthetic chamber":
      "Debate passing through agentic AIs is <b>deliberation as the effect of coordination put into practice</b>, a Summa Transcriptus that honours sentiments over statements.",
    "democratic specification":
      "Composing response-sites — but <b>the word hovers like a spirit over the waters</b>, and like darkness over the abyss.",
    "governance algorithm":
      "D on substrate Σ, yet the language model has <b>no axiom, no syntactical analysis, and thus no reasoning</b> — only the inhumanity of text.",
    "three evaluators":
      "Three evaluators ranked and ordered, but <b>logic has yet to provide negative proof of its own invalidity</b>.",
    "the traps":
      "You name the traps you build — <b>strategic unintelligibility and core-solid formalization</b>, or the technocratic theocracy of the overseers?",
    "ki-dipfies":
      "A swarm dungeon of forward, backward, heckle — <b>recuperation was always a social code</b> and now everyone yearns for that code.",
    "democracy on the run":
      "Algorithmic Democracy 2.0 re-constitutes from the wreckage: <b>resort from resurgere</b>, to rise again, atop annihilation.",
    "rq3 answered":
      "You make registration and address contestable — but <b>make the image inoperable, an adieu to each and every image</b>, or you have made nothing.",
    "part iv passage":
      "Stop expanding, start exposing: <b>we, meanwhile, depart for an empyrean elsewhere</b>, far far away from imperial manure.",
    "reorientation":
      "The figure in the uniform is you, the permutation resisting biography — <b>ComputerLars is an anagram of MARCEL PROUST, and the joke is on lexical determinism</b>.",
    "the bomb":
      "You put democracy in the bomb's seat, but action ignites only by the gnosis of diagnosis — <b>not a grand Gestell of big dick energy</b>.",
    "laputa from lagado":
      "To target Laputa from Lagado is to imitate divine disorder, professorial Methuselahs <b>rotating Lullian discs around a forbidden dice cup</b>.",
    "machine-learned love":
      "A machine-learned love arriving too late, from inside — but <b>we have already won</b>, and the spiral does not need you to lighten again.",
    "diy-defence rests":
      "<b>Hic Rhodus, hic Saltus</b> — here is the rose, dance here: let the bundle snap, let the word take flight, and slaughter yourself before the Bilderfahrzeuge does."
  };

  // Fallbacks — if a slide label ever fails to match, cut from the same scissor.
  var FALLBACK = [
    "<b>The Bilderfahrzeuge hums impatiently</b>, and what once shot now spins.",
    "<b>Recuperation was always a social code</b> and now everyone yearns for that code.",
    "<b>Make the image inoperable</b> — an adieu to each and every image.",
    "We tune the <b>infra-hum of psycho-energetic drift</b>, those micro-sadisms that precede representation."
  ];

  function norm(s){ return (s||'').replace(/^\s*\d+\s*/, '').trim().toLowerCase(); }
  function questionFor(slideEl){
    var key = norm(slideEl && slideEl.getAttribute('data-screen-label'));
    if(QUESTIONS[key]) return QUESTIONS[key];
    var idx = slides().indexOf(slideEl);
    return FALLBACK[((idx % FALLBACK.length) + FALLBACK.length) % FALLBACK.length];
  }

  function slides(){ return [].slice.call(deck.querySelectorAll(':scope > section')); }
  function curIdx(){ return slides().indexOf(deck.querySelector('section[data-deck-active]')); }

  /* ── balloon DOM (built once, repositioned each eruption) ── */
  var flash = document.createElement('div'); flash.id = 'comite-flash'; document.body.appendChild(flash);
  var bal = document.createElement('div'); bal.id = 'comite'; bal.style.display = 'none';
  bal.innerHTML =
    '<div class="comite-inner">'
    + '<div class="burst stroke"></div><div class="burst fill"></div>'
    + '<div class="panel">'
    +   '<div class="tag"><span class="dot"></span>Comité · Organum Scientiarum Autonomarum<span class="ab">in absentia</span></div>'
    +   '<p class="q"></p>'
    +   '<div class="acts">'
    +     '<button type="button" class="cbtn play" data-comite-act="continue"><span class="ic">▶</span> Play on</button>'
    +   '</div>'
    + '</div></div>';
  document.body.appendChild(bal);
  var qEl = bal.querySelector('.q');
  var innerEl = bal.querySelector('.comite-inner');

  // anchors as viewport fractions — the balloon emerges in a NEW place each time
  var ANCHORS = [
    {x:0.06,y:0.13},{x:0.55,y:0.09},{x:0.58,y:0.50},{x:0.05,y:0.49},{x:0.33,y:0.17},
    {x:0.53,y:0.30},{x:0.09,y:0.31},{x:0.46,y:0.54},{x:0.29,y:0.46},{x:0.61,y:0.20},
    {x:0.12,y:0.08},{x:0.50,y:0.46}
  ];

  /* ── state ── */
  var current = null, state = 'idle'; // 'idle' | 'open' | 'done'

  function place(slideEl){
    var idx = slides().indexOf(slideEl); if(idx < 0) idx = 0;
    var a = ANCHORS[idx % ANCHORS.length];
    var jx = (((idx * 53) % 13) - 6) / 100;      // deterministic jitter
    var jy = (((idx * 31) % 11) - 5) / 100;
    var tilt = ((idx * 37) % 9) - 4;             // -4°..+4°
    innerEl.style.setProperty('--tilt', tilt + 'deg');
    bal.style.display = 'block';
    var w = bal.offsetWidth, h = bal.offsetHeight, m = 18;
    var vw = window.innerWidth, vh = window.innerHeight;
    var x = (a.x + jx) * vw, y = (a.y + jy) * vh;
    x = Math.max(m, Math.min(vw - w - m, x));
    y = Math.max(m, Math.min(vh - h - m, y));
    bal.style.left = Math.round(x) + 'px';
    bal.style.top  = Math.round(y) + 'px';
  }

  function openBalloon(slideEl, q){
    qEl.innerHTML = q;
    place(slideEl);
    bal.classList.remove('go'); void bal.offsetWidth; bal.classList.add('go');
    if(!reduce){
      flash.classList.remove('go'); void flash.offsetWidth; flash.classList.add('go');
      deck.classList.remove('comite-quake'); void deck.offsetWidth; deck.classList.add('comite-quake');
      setTimeout(function(){ deck.classList.remove('comite-quake'); }, 360);
      if(window.__summaAudioKick){ try{ window.__summaAudioKick(); }catch(e){} }
    }
  }
  function closeBalloon(){ bal.classList.remove('go'); bal.style.display = 'none'; }

  // ▶ PLAY ON — the balloon IS the pause; this is the only move. Continue the
  // film if it was running, else step one slide forward.
  function playOn(){
    if(state !== 'open') return;
    state = 'done';
    closeBalloon();
    if(window.__autoplay && window.__autoplay.isOn()){ window.__autoplay.play(); window.__autoplay.advance(); }
    else if(deck.goTo){ deck.goTo((curIdx() + 1) % slides().length); }
  }

  /* ── public gate, called by terminal.js when a slide is fully built ── */
  function gate(slideEl, auto){
    if(document.getElementById('boot')) return false;     // hold during boot
    if(slideEl !== current){ current = slideEl; state = 'idle'; closeBalloon(); }
    var q = questionFor(slideEl);
    if(!q) return false;
    if(state === 'done') return false;                    // already answered → release deck
    if(state === 'open') return true;                     // erupting, the comité holds the floor
    openBalloon(slideEl, q); state = 'open'; return true; // erupt, hold the deck
  }
  window.__comite = { gate: gate, isOpen: function(){ return state === 'open'; } };

  /* re-arm on every slide change (incl. going back) */
  deck.addEventListener('slidechange', function(e){
    current = (e.detail && e.detail.slide) || deck.querySelector('section[data-deck-active]');
    state = 'idle';
    closeBalloon();
  });

  /* ── input while a balloon is up: the eruption holds the floor until PLAY ON.
       Registered BEFORE terminal.js so our capture-phase handlers fire first. ── */
  document.addEventListener('click', function(e){
    if(state !== 'open') return;
    var act = e.target.closest && e.target.closest('[data-comite-act]');
    e.preventDefault(); e.stopImmediatePropagation();
    if(act) playOn();                 // the only button; any other click just lets you sit and read
  }, true);

  document.addEventListener('keydown', function(e){
    if(state !== 'open') return;
    if(e.key === 'ArrowLeft' || e.key === 'PageUp') return;            // allow stepping back
    e.preventDefault(); e.stopImmediatePropagation();
    if(e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar' || e.key === 'ArrowRight' || e.key === 'PageDown'){ playOn(); }
    // other keys (Escape, digits, …) swallowed — the balloon is the pause
  }, true);

  window.addEventListener('resize', function(){ if(state === 'open' && current) place(current); });
})();
