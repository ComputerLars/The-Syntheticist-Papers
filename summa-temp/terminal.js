/* SLOPAGANDA.SYS — live machine layer (v3)
   · boot sequence (streaming self-test, once per session, skippable)
   · click-to-BUILD: points appear one at a time on advance (space / → / click)
   · each point TYPES IN one letter at a time, slowly, with a block cursor
   · terminal⇄feed graphic channel-switch + live circulation counter
   · click any image / post to enlarge; data-video plays a drop-in .mp4
   Nothing here hides text from print/PDF (see @media print in the CSS). */
(function(){
  // ░░ TUNE TYPING SPEED HERE ░░ — milliseconds per letter (higher = slower)
  var TYPE_CHAR_MS = 34;
  var CMD_CHAR_MS  = 22;   // the command line types a touch faster

  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches;
  var deck = document.querySelector('deck-stage');
  if(!deck) return;
  function slidesArr(){ return [].slice.call(deck.querySelectorAll(':scope > section')); }

  /* ---------- overlays ---------- */
  var sweep = document.createElement('div'); sweep.className = 'crt-sweep'; document.body.appendChild(sweep);
  function doSweep(){ if(reduce) return; sweep.classList.remove('go'); void sweep.offsetWidth; sweep.classList.add('go'); }

  var fx = document.createElement('div'); fx.id = 'switchfx'; fx.innerHTML = '<div class="snow"></div>'; document.body.appendChild(fx);
  function doSwitch(){
    if(reduce) return;
    fx.classList.remove('go'); void fx.offsetWidth; fx.classList.add('go');
    deck.classList.remove('switching'); void deck.offsetWidth; deck.classList.add('switching');
    setTimeout(function(){ deck.classList.remove('switching'); }, 440);
  }

  /* ---------- live readout HUD — a clickable link into the dissertation ---------- */
  var hud = document.createElement('a'); hud.id = 'circhud'; hud.target = '_blank'; hud.rel = 'noopener';
  hud.innerHTML = '<span class="lbl">RESPONSE-STREAM</span> <span class="num"></span> <span class="go">\u2197</span>';
  document.body.appendChild(hud);
  var circ = 145002118, hudNum = hud.querySelector('.num'), hudLbl = hud.querySelector('.lbl'), hudTimer = null, hudRAF = null;
  function fmtN(n){ return n.toLocaleString('da-DK'); }
  // the readout MORPHS as the disputation proceeds — each carries a link to a place in the work
  var READOUTS = [
    {lbl:'RESPONSE-STREAM', base:145002118, inc:[40,940], href:'https://syntheticism.org'},
    {lbl:'CIRCULATION',     base:268904411, inc:[120,2600], href:'https://syntheticism.org'},
    {lbl:'ANSWERABILITY',   base:0.418,     rate:true,  href:'https://doi.org/10.7146/aprja.v13i1.151235'},
    {lbl:'DELEGATIONS',     base:8,         inc:[0,0], hold:true, href:'https://computerlars.github.io/KI-DIPFIES/'},
    {lbl:'CONTESTABILITY',  base:0.42,      rate:true, href:'https://doi.org/10.54337/aau.add.scai.2026'},
    {lbl:'RESPONSE-SITES',  base:3169,      inc:[1,14], href:'https://doi.org/10.1007/s00146-026-03110-w'},
    {lbl:'BLAST-RADIUS',    base:21000,     inc:[200,5200], href:'https://computerlars.github.io/KI-DIPFIES/'},
    {lbl:'MACHINE-LEARNED LOVE', base:0.972, rate:true, href:'https://doi.org/10.7146/nja.v33i67.148465'}
  ];
  var roi = 0;
  function renderReadout(){
    var r = READOUTS[roi];
    hudLbl.textContent = r.lbl;
    hud.href = r.href || 'https://syntheticism.org';
    if(r.rate){ hudNum.textContent = (r.base).toFixed(3); }
    else { hudNum.textContent = fmtN(Math.floor(circ)); }
  }
  function setReadout(i){ roi = ((i % READOUTS.length) + READOUTS.length) % READOUTS.length;
    circ = READOUTS[roi].base; renderReadout(); }

  /* place the HUD only where it overlaps NO text; returns false if nowhere is clear */
  function rectsOverlap(a, b){ return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom); }
  function placeHud(){
    var slide = deck.querySelector('section[data-deck-active]'); if(!slide) return false;
    var w = hud.offsetWidth || 240, h = hud.offsetHeight || 40, m = 26;
    var vw = window.innerWidth, vh = window.innerHeight;
    // candidate top-left points (viewport px)
    var cands = [
      {x: vw - w - m, y: 96},            // top-right
      {x: m,          y: 96},            // top-left
      {x: vw - w - m, y: vh*0.5 - h/2},  // mid-right
      {x: m,          y: vh*0.5 - h/2},  // mid-left
      {x: vw - w - m, y: vh - h - 150},  // lower-right (above cite)
      {x: vw*0.5 - w/2, y: 96}           // top-center
    ];
    // text/content rects to avoid on the active slide
    var sel = '.txt, .center, .quaestio, .respondeo-head, .makers, .figbox, .spec, .mgrid, .rqstack, .colo, .cmd, .cite, .lead, blockquote';
    var avoid = [].slice.call(slide.querySelectorAll(sel)).map(function(el){ return el.getBoundingClientRect(); })
      .filter(function(r){ return r.width > 4 && r.height > 4; });
    // also keep clear of the codex (top-right) and autoplay (bottom-left)
    ['codex','autoplay'].forEach(function(id){ var e=document.getElementById(id); if(e) avoid.push(e.getBoundingClientRect()); });
    for(var i=0;i<cands.length;i++){
      var c = cands[i]; var pad = 12;
      var rect = {left:c.x-pad, top:c.y-pad, right:c.x+w+pad, bottom:c.y+h+pad};
      var clash = avoid.some(function(a){ return rectsOverlap(rect, a); });
      if(!clash){ hud.style.left = c.x+'px'; hud.style.top = c.y+'px'; hud.style.right='auto'; hud.style.bottom='auto'; return true; }
    }
    return false;   // nowhere clear — stay hidden on this slide
  }
  /* the HUD lives in the extreme right-edge strip (inside the slide's 64px padding,
     so it never crosses centred text) and DRIFTS continuously via CSS; the number
     ticker runs on its own interval so it never freezes regardless of position. */
  function startHud(){ stopHud();
    var idx = slidesArr().indexOf(deck.querySelector('section[data-deck-active]'));
    if(idx < 1){ hud.classList.remove('on'); return; }          // never on the title slide
    if(idx % 3 !== 1){ hud.classList.remove('on'); return; }     // only once in a while (~every third slide)
    renderReadout(); hud.classList.remove('drift','driftlow');
    hud.classList.add('on');
    // JS-driven travel around the frame edges — never freezes, never centred over text
    if(!reduce){
      var t0 = performance.now();
      var period = 26000;                       // full loop time
      var phase = (idx % 6) === 1 ? 0 : 0.5;    // alternate starting edge so it roams differently
      (function move(now){
        if(!hud.classList.contains('on')) { hudRAF = null; return; }
        var w = hud.offsetWidth, h = hud.offsetHeight, m = 8;
        var vw = window.innerWidth, vh = window.innerHeight;
        var maxX = vw - w - m, maxY = vh - h - m;
        var p = (((now - t0) / period) + phase) % 1;        // 0..1 around a rounded-rect path
        var x, y;
        if(p < 0.25){ x = m + (maxX - m) * (p/0.25); y = m; }            // top edge L→R
        else if(p < 0.5){ x = maxX; y = m + (maxY - m) * ((p-0.25)/0.25); } // right edge ↓
        else if(p < 0.75){ x = maxX - (maxX - m) * ((p-0.5)/0.25); y = maxY; } // bottom edge R→L
        else { x = m; y = maxY - (maxY - m) * ((p-0.75)/0.25); }         // left edge ↑
        hud.style.left = Math.round(x) + 'px'; hud.style.top = Math.round(y) + 'px';
        hudRAF = requestAnimationFrame(move);
      })(t0);
    }
    if(reduce) return;
    hudTimer = setInterval(function(){ var r = READOUTS[roi];
      if(r.hold){ return; }
      if(r.rate){ r.base = Math.min(0.999, r.base + (Math.random()*0.004 - 0.0012)); hudNum.textContent = r.base.toFixed(3);
        if(Math.random()<0.04){ hudNum.classList.add('gli'); setTimeout(function(){hudNum.classList.remove('gli');},120);} }
      else { circ += Math.floor(Math.random()*(r.inc[1]-r.inc[0])) + r.inc[0]; hudNum.textContent = fmtN(circ);
        if(Math.random()<0.03){ hudNum.classList.add('gli'); setTimeout(function(){hudNum.classList.remove('gli');},120);} }
    }, 120);
  }
  function stopHud(){ if(hudTimer){ clearInterval(hudTimer); hudTimer = null; } if(hudRAF){ cancelAnimationFrame(hudRAF); hudRAF = null; } }

  /* ---------- lightbox (enlarge image / play video) ---------- */
  var lb = document.createElement('div'); lb.id = 'lightbox';
  lb.innerHTML = '<div class="lbhint">ESC \u00b7 klik for at lukke</div><div class="lbbody"></div>';
  document.body.appendChild(lb);
  var lbBody = lb.querySelector('.lbbody');
  function lbVideo(vsrc, posterSrc){
    var v = document.createElement('video'); v.src = vsrc; v.controls = true; v.autoplay = true; v.loop = true; v.playsInline = true;
    if(posterSrc) v.poster = posterSrc;
    v.addEventListener('error', function(){
      if(!v._normTried){
        try{ var h=''; var s=v.src; var hi=s.indexOf('#'); if(hi>=0){h=s.slice(hi);s=s.slice(0,hi);}
          var nm=decodeURIComponent(s.replace(/^.*uploads\//,'')); var alt=(nm.normalize('NFC')===nm)?nm.normalize('NFD'):nm.normalize('NFC');
          if(alt!==nm){ v._normTried=true; v.src='uploads/'+encodeURIComponent(alt)+h; v.load(); return; } }catch(_){}
      }
      if(posterSrc){ lbBody.innerHTML=''; var i=new Image(); i.src=posterSrc; lbBody.appendChild(i); }
    });
    return v;
  }
  function openLB(box){
    var img = box.querySelector('img'); var vsrc = box.getAttribute('data-video');
    var inlineVid = box.querySelector('video');
    var embed = box.getAttribute('data-embed');
    var gallery = box.getAttribute('data-gallery');
    var videos = box.getAttribute('data-videos');
    lbBody.innerHTML = '';

    if(embed){   // YouTube / live site in an iframe
      var wrap = document.createElement('div'); wrap.className = 'lbembed';
      var ifr = document.createElement('iframe'); ifr.src = embed; ifr.allow = 'autoplay; fullscreen; encrypted-media';
      ifr.setAttribute('allowfullscreen',''); ifr.setAttribute('frameborder','0');
      wrap.appendChild(ifr); lbBody.appendChild(wrap); lb.classList.add('on'); return;
    }
    if(gallery){   // image slideshow with prev/next
      var imgs = gallery.split('|').map(function(s){return s.trim();}).filter(Boolean);
      var gi = 0;
      var stage = document.createElement('div'); stage.className='lbgal';
      var gim = new Image(); stage.appendChild(gim);
      var prev = document.createElement('button'); prev.className='lbnav prev'; prev.type='button'; prev.innerHTML='\u2039';
      var next = document.createElement('button'); next.className='lbnav next'; next.type='button'; next.innerHTML='\u203A';
      var dots = document.createElement('div'); dots.className='lbdots';
      function render(){ gim.src=imgs[gi]; dots.textContent=(gi+1)+' / '+imgs.length; }
      function go(n,e){ if(e){e.stopPropagation();} gi=(n+imgs.length)%imgs.length; render(); }
      prev.addEventListener('click', function(e){ go(gi-1,e); });
      next.addEventListener('click', function(e){ go(gi+1,e); });
      stage.appendChild(prev); stage.appendChild(next); stage.appendChild(dots);
      lbBody.appendChild(stage); render(); lb.classList.add('on');
      lbBody._galleryNav = function(d){ go(gi+d); };
      return;
    }
    if(videos){   // several clips, played in sequence then looped
      var list = videos.split('|').map(function(s){return s.trim();}).filter(Boolean);
      var vi = 0;
      var cur = lbVideo(list[0], img && img.src); cur.loop = false;
      cur.addEventListener('ended', function(){ vi=(vi+1)%list.length; var nx=lbVideo(list[vi], null); nx.loop=false; nx.addEventListener('ended', arguments.callee); lbBody.innerHTML=''; lbBody.appendChild(nx); });
      lbBody.appendChild(cur); lb.classList.add('on'); return;
    }
    if(vsrc){ lbBody.appendChild(lbVideo(vsrc, img && img.src)); }
    else if(inlineVid){ var v2 = document.createElement('video'); v2.src = inlineVid.currentSrc || inlineVid.src; v2.controls = true; v2.autoplay = true; v2.loop = true; v2.playsInline = true; lbBody.appendChild(v2);
    } else if(img){ var im = new Image(); im.src = img.src; lbBody.appendChild(im); } else { return; }
    lb.classList.add('on');
  }
  function closeLB(){ lb.classList.remove('on'); lbBody.innerHTML = ''; }
  lb.addEventListener('click', closeLB);
  // arrow keys drive the gallery when the lightbox shows one
  document.addEventListener('keydown', function(e){
    if(!lb.classList.contains('on') || !lbBody._galleryNav) return;
    if(e.key==='ArrowRight'){ e.stopImmediatePropagation(); e.preventDefault(); lbBody._galleryNav(1); }
    else if(e.key==='ArrowLeft'){ e.stopImmediatePropagation(); e.preventDefault(); lbBody._galleryNav(-1); }
  }, true);

  /* ---------- command-line typewriter ---------- */
  function typeCmd(slide){
    var c = slide && slide.querySelector('.cmd .c'); if(!c) return;
    if(c.dataset.full === undefined) c.dataset.full = c.textContent;
    var full = c.dataset.full; clearInterval(c._t);
    if(reduce){ c.textContent = full; return; }
    c.textContent = ''; var i = 0;
    c._t = setInterval(function(){ i++; c.textContent = full.slice(0, i); if(i >= full.length) clearInterval(c._t); }, CMD_CHAR_MS);
  }

  /* ---------- autoplay inline videos on the active slide ---------- */
  function manageVideos(slide){
    deck.querySelectorAll('video.av').forEach(function(v){ try{ v.pause(); }catch(e){} });
    if(slide) slide.querySelectorAll('video.av').forEach(function(v){ v.muted = true; var p = v.play(); if(p && p.catch) p.catch(function(){}); });
  }

  /* ---------- BUILD ENGINE: reveal .frag one per advance, typed letter-by-letter ---------- */
  function wrapChars(el){
    var out = [];
    (function walk(node){
      [].slice.call(node.childNodes).forEach(function(k){
        if(k.nodeType === 3){
          var t = k.textContent; if(!t) return;
          var frag = document.createDocumentFragment();
          for(var c=0;c<t.length;c++){ var ch = t[c];
            if(ch===' '||ch==='\n'||ch==='\t'){ frag.appendChild(document.createTextNode(ch)); continue; }
            var s = document.createElement('span'); s.className='tch'; s.textContent=ch; s.style.visibility='hidden'; out.push(s); frag.appendChild(s);
          }
          node.replaceChild(frag, k);
        } else if(k.nodeType===1 && k.tagName!=='BR' && !k.classList.contains('tcur')){ walk(k); }
      });
    })(el);
    return out;
  }
  function setupBuild(slide, mode){
    var frags = [].slice.call(slide.querySelectorAll('.frag'));
    frags.forEach(function(f){ if(f.dataset.h === undefined) f.dataset.h = f.innerHTML; f.innerHTML = f.dataset.h; });
    var b = { frags: frags, idx: -1, typing: false, finishNow: null };
    b.show = function(i){
      var f = frags[i]; if(!f) return;
      f.style.visibility = 'visible';
      var chars = wrapChars(f);
      if(reduce || !chars.length){ chars.forEach(function(c){ c.style.visibility=''; }); return; }
      var cur = document.createElement('span'); cur.className = 'tcur';
      var j = 0; b.typing = true;
      var iv = setInterval(step, TYPE_CHAR_MS);
      b.finishNow = function(){ clearInterval(iv); chars.forEach(function(c){ c.style.visibility=''; }); if(cur.parentNode) cur.remove(); b.typing = false; b.finishNow = null; };
      function step(){
        if(j >= chars.length){ clearInterval(iv); if(cur.parentNode) cur.remove(); b.typing = false; b.finishNow = null; return; }
        chars[j].style.visibility = '';
        var nxt = chars[j+1];
        if(nxt) nxt.parentNode.insertBefore(cur, nxt); else chars[j].parentNode.insertBefore(cur, chars[j].nextSibling);
        j++;
      }
    };
    slide._build = b;
    if(mode === 'all' || reduce){ frags.forEach(function(f){ f.style.visibility = 'visible'; }); b.idx = frags.length - 1; }
    else { frags.forEach(function(f){ f.style.visibility = 'hidden'; }); if(frags.length){ b.idx = 0; b.show(0); } }
  }
  function revealNext(){
    var slide = deck.querySelector('section[data-deck-active]');
    if(!slide || !slide._build) return false;
    var b = slide._build;
    if(b.typing){ if(b.finishNow) b.finishNow(); fitSlide(slide); return true; }   // manual press finishes the line instantly
    if(b.idx < b.frags.length - 1){ b.idx++; b.show(b.idx); fitSlide(slide); setTimeout(function(){ if(slide.hasAttribute('data-deck-active')) fitSlide(slide); }, 60); return true; }
    if(window.__comite && window.__comite.gate(slide, false)) return true;   // end of scroll → the comité erupts
    return false;                                                  // exhausted → let the deck advance
  }
  // autoplay variant: let the current line FINISH typing on its own (don't snap it), so the
  // character-by-character build stays visible; only step to the next line once typing is done.
  function autoStep(){
    var slide = deck.querySelector('section[data-deck-active]');
    if(!slide || !slide._build) return false;
    var b = slide._build;
    if(b.typing) return true;                                      // still typing — wait, don't snap
    if(b.idx < b.frags.length - 1){ b.idx++; b.show(b.idx); fitSlide(slide); setTimeout(function(){ if(slide.hasAttribute('data-deck-active')) fitSlide(slide); }, 60); return true; }
    if(window.__comite && window.__comite.gate(slide, true)) return true;   // end of scroll → the comité erupts (autoplay waits)
    return false;                                                  // slide fully built
  }

  /* ---------- input interception (capture phase, before deck-stage) ---------- */
  document.addEventListener('click', function(e){
    if(e.target.closest && e.target.closest('#autoplay, #circhud, #sndhud')) return; // chrome controls own their clicks
    if(e.target.closest && e.target.closest('#codex, #codexview, #lightbox .lbbody')) return; // codex/PDF own their clicks
    var media = e.target.closest && e.target.closest('.win .v, .post .pmedia, .mk[data-video] .mv');
    if(media){
      var box = media.closest('.win, .post, .mk');
      if(box && (box.querySelector('img') || box.getAttribute('data-video') || box.getAttribute('data-videos') || box.getAttribute('data-embed') || box.getAttribute('data-gallery') || box.querySelector('video'))){
        e.preventDefault(); e.stopImmediatePropagation(); openLB(box); return;
      }
    }
    if(e.target.closest('#lightbox')) return;        // clicks inside the lightbox just close it
    if(document.getElementById('boot')) return;      // boot eats its own clicks
    if(revealNext()){ e.preventDefault(); e.stopImmediatePropagation(); }
  }, true);

  document.addEventListener('keydown', function(e){
    if(document.getElementById('boot')) return;
    if(document.getElementById('codexview') && document.getElementById('codexview').classList.contains('on')){
      if(e.key === 'Escape'){ document.getElementById('codexview').classList.remove('on'); }
      return;   // while reading the thesis, keys don't drive the deck
    }
    if(e.key === 'Escape'){ if(lb.classList.contains('on')) closeLB(); return; }
    if(lb.classList.contains('on')) return;
    if(e.key===' ' || e.key==='ArrowRight' || e.key==='PageDown' || e.key==='Enter'){
      if(revealNext()){ e.preventDefault(); e.stopImmediatePropagation(); }
    }
  }, true);

  /* ---------- auto-fit: scale a slide's body down if its content overflows 1080 ---------- */
  function fitSlide(slide){
    if(!slide) return;
    var main = slide.querySelector('.main'); if(!main) return;
    main.style.zoom = '1';
    var avail = main.clientHeight;            // height the main region is actually given
    if(!avail) return;
    // .cite is a SIBLING of .main, not inside it — reserve its height so content never collides with it
    var cite = slide.querySelector('.cite');
    if(cite){ avail -= (cite.offsetHeight + 14); }
    if(avail < 120) return;
    var ratio = 1;
    function chk(el){ if(el && el.scrollHeight > el.clientHeight + 2) ratio = Math.max(ratio, el.scrollHeight / el.clientHeight); }
    chk(main);
    main.querySelectorAll('.txt, .vis, .split, .center, .makers, .tenses, .lawlist, .mgrid, .quaestio, .rqstack, .colo, ul.gloss').forEach(chk);
    // does the column content exceed the height available once the citation is reserved?
    var col = main.querySelector('.txt'); if(col){ var need = col.scrollHeight; if(need > avail + 2) ratio = Math.max(ratio, need / avail); }
    // gentle floor: never shrink so far that body text turns tiny — better a hair of overflow than 60% type
    if(ratio > 1.012){ main.style.zoom = (Math.max(0.86, (1/ratio) * 0.985)).toFixed(3); }
  }

  /* ---------- navigation reactions ---------- */
  var prevMode = null, prevIndex = -1;
  function onChange(slide){
    if(!slide) return;
    var idx = slidesArr().indexOf(slide);
    var mode = (prevIndex === idx - 1) ? 'build' : 'all';   // step forward → build; back/jump → show all
    prevIndex = idx;
    typeCmd(slide); doSweep(); manageVideos(slide);
    var m = slide.getAttribute('data-mode') || 'terminal';
    if(prevMode !== null && m !== prevMode) doSwitch();
    setReadout(idx);          // the readout morphs as the deck proceeds
    startHud();               // always on, floating clear of the references
    prevMode = m;
    setupBuild(slide, mode);
    fitSlide(slide);
    setTimeout(function(){ if(slide.hasAttribute('data-deck-active')) fitSlide(slide); }, 120);
    setTimeout(function(){ if(slide.hasAttribute('data-deck-active')) fitSlide(slide); }, 520);
  }
  deck.addEventListener('slidechange', function(e){ onChange(e.detail && e.detail.slide ? e.detail.slide : deck.querySelector('section[data-deck-active]')); });
  window.addEventListener('resize', function(){ fitSlide(deck.querySelector('section[data-deck-active]')); });

  /* ---------- autoplay / loop — run the whole deck like a film ---------- */
  (function(){
    var btn = document.createElement('div'); btn.id = 'autoplay';
    btn.innerHTML = '<button type="button" class="apyes"><span class="ico">\u25B6</span> Play</button>'
      + '<button type="button" class="apno">\u00D7</button>';
    document.body.appendChild(btn);
    var yes = btn.querySelector('.apyes'), no = btn.querySelector('.apno');
    var timer = null, on = false, dismissed = false, sinceAdvance = 0;
    function curIdx(){ return slidesArr().indexOf(deck.querySelector('section[data-deck-active]')); }
    function syncBtn(){ btn.classList.toggle('show', !on && !dismissed && curIdx() === 0 && !document.getElementById('boot')); }
    function beat(){
      if(!on) return;
      if(document.getElementById('boot')) return;        // wait through the boot screen
      if(lb && lb.classList.contains('on')) return;       // pause while a lightbox is open
      try{
        if(autoStep()){ sinceAdvance = 0; return; }       // still revealing this slide (or mid-typing)
        sinceAdvance++;
        var slide = deck.querySelector('section[data-deck-active]');
        var dwell = (slide && slide.classList.contains('collage-slide')) ? 7 : 9;   // ~4.5–5.5s extra to read once built
        if(sinceAdvance >= dwell){ sinceAdvance = 0; var arr = slidesArr(); if(deck.goTo) deck.goTo((curIdx() + 1) % arr.length); }
      }catch(err){ /* never let one hiccup kill the loop */ }
    }
    yes.addEventListener('click', function(e){ e.stopPropagation(); e.stopImmediatePropagation();
      on = true; dismissed = true; btn.classList.remove('show');           // button disappears once playing
      if(window.__summaAudioKick) window.__summaAudioKick(); sinceAdvance = 0;
      if(!timer) timer = setInterval(beat, 600); }, true);
    no.addEventListener('click', function(e){ e.stopPropagation(); e.stopImmediatePropagation();
      dismissed = true; btn.classList.remove('show'); }, true);            // dismiss; manual nav from here
    deck.addEventListener('slidechange', syncBtn);
    setTimeout(syncBtn, 50);
    var apPoll = setInterval(function(){ syncBtn(); if(on || dismissed) clearInterval(apPoll); }, 600);  // re-show once boot clears
    // expose autoplay controls so the automated comité can pause/continue the film
    window.__autoplay = {
      isOn: function(){ return on; },
      play: function(){ on = true; dismissed = true; btn.classList.remove('show'); sinceAdvance = 0;
        if(window.__summaAudioKick) window.__summaAudioKick(); if(!timer) timer = setInterval(beat, 600); },
      pause: function(){ on = false; },
      advance: function(){ var arr = slidesArr(); if(deck.goTo) deck.goTo((curIdx() + 1) % arr.length); }
    };
  })();


  /* ---------- boot sequence (once per browser session, skippable) ---------- */
  function startDeck(){ prevIndex = -1; onChange(deck.querySelector('section[data-deck-active]') || deck.querySelector(':scope > section')); }
  function boot(){
    if(reduce || sessionStorage.getItem('summa_booted')){ startDeck(); return; }
    var lines = [
      ['SUMMA TRANSSCRIPTUS', 'hi2'],
      ['  patafence v2026   Computer Lars // sub mandato', ''],
      ['', ''],
      ['> mount /synthesis ......... ', '', 'N\u2013IV loaded', 'hi2'],
      ['> mount /articles .......... ', '', '7 outputs', 'hi2'],
      ['> convene /summits ......... ', '', 'Aarhus \u00b7 Warszawa \u00b7 Linz', ''],
      ['> index response-stream .... ', '', '145,000,000 addresses', 'hi2'],
      ['> respondent ............... ', '', 'LEADER LARS [answers]', 'ok2'],
      ['> answerability ............ ', '', '[disproportionate]', 'al2'],
      ['> opposition ............... ', '', 'ORGANUM SCIENTIARUM AUTONOMARUM', 'al2'],
      ['', ''],
      ['WARN: the party already took shape in reception.', 'al2'],
      ['> begin disputation_', 'ok2']
    ];
    var ov = document.createElement('div'); ov.id = 'boot';
    ov.innerHTML = '<pre></pre><div class="skip">tryk / klik for at springe over</div>';
    document.body.appendChild(ov);
    var pre = ov.querySelector('pre');
    var done = false;
    function finish(){
      if(done) return; done = true;
      sessionStorage.setItem('summa_booted', '1');
      ov.style.transition = 'opacity .4s ease'; ov.style.opacity = '0';
      setTimeout(function(){ if(ov.parentNode) ov.remove(); }, 420);
      startDeck();
    }
    ov.addEventListener('click', finish);
    document.addEventListener('keydown', function k(e){ finish(); document.removeEventListener('keydown', k); });
    var li = 0;
    (function nextLine(){
      if(done) return;
      if(li >= lines.length){ setTimeout(finish, 700); return; }
      var parts = lines[li]; li++;
      var t1 = document.createElement('span'); if(parts[1]) t1.className = parts[1]; pre.appendChild(t1);
      var full = parts[0], j = 0;
      var iv = setInterval(function(){
        if(done){ clearInterval(iv); return; }
        j++; t1.textContent = full.slice(0, j);
        if(j >= full.length){
          clearInterval(iv);
          if(parts[2] !== undefined){ var t2 = document.createElement('span'); if(parts[3]) t2.className = parts[3]; t2.textContent = parts[2]; pre.appendChild(t2); }
          pre.appendChild(document.createTextNode('\n'));
          setTimeout(nextLine, 80);
        }
      }, 12);
    })();
  }
  boot();
})();
