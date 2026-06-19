/* SUMMA TRANSSCRIPTUS — cabaret layer
   · a drifting, mutating media wall that fills any <section data-collage> when it
     becomes the active slide (and idles when it is not, to spare the CPU);
   · a quiet scrolling backdrop band for <section data-band> dividers;
   · an ambient "mumble" track stitched from the corpus video audio, low volume,
     started on first interaction, with a click-to-mute indicator;
   · click any wall cell to enlarge it in the shared #lightbox.
   Respects prefers-reduced-motion. Nothing here hides slide text. */
(async function(){
  "use strict";
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches;

  // ---- the corpus ---------------------------------------------------------
  var FIG = function(n){ return 'media/fig/' + n; };
  var VID = function(n){ return 'uploads/' + encodeURIComponent(n); };

  // Some uploads are saved with decomposed (NFD) diacritics, others precomposed (NFC).
  // Given an encoded uploads/ URL that 404'd, return the same name in the OTHER form.
  function altNorm(src){
    try{
      var hash=''; var h=src.indexOf('#'); if(h>=0){ hash=src.slice(h); src=src.slice(0,h); }
      var name=decodeURIComponent(src.replace(/^.*uploads\//,''));
      var alt=(name.normalize('NFC')===name) ? name.normalize('NFD') : name.normalize('NFC');
      if(alt===name) return null;
      return 'uploads/'+encodeURIComponent(alt)+hash;
    }catch(_){ return null; }
  }
  // any media element that fails to load gets one retry in the alternate normalization
  document.addEventListener('error', function(e){
    var el=e.target; if(!el||!el.tagName||!/^(IMG|VIDEO|AUDIO|SOURCE)$/.test(el.tagName)) return;
    if(el.classList && el.classList.contains('mumble-layer')) return; // mumble handles its own
    if(el.dataset && el.dataset.normTried) return;
    var src=el.getAttribute('src'); if(!src || src.indexOf('uploads/')<0) return;
    var alt=altNorm(src); if(!alt) return;
    el.dataset.normTried='1'; el.setAttribute('src', alt); if(el.load) el.load();
  }, true);

  // visual pool for the walls (figures + clips)
  var IMAGES = ['image1.jpeg','image2.jpg','image7.png','image8.jpg','image9.jpg','image11.jpg',
    'image12.jpg','image13.jpg','image14.jpg','image15.png','image16.jpg','image17.jpg','image18.png',
    'image20.jpg','image22.png','image28.jpg','image29.png','image30.png','image31.png','image32.png',
    'image33.png','image34.png','image35.png','image36.png','image37.jpg','image41.jpg','image42.jpg',
    'image43.png','image44.jpg','image45.png','image46.jpg','image47.png','image49.png','image50.png',
    'image51.png','image52.png','image53.png','image54.png','image55.png','image59.png','image60.jpg',
    'image64.jpg','image65.jpg','image66.png','image67.jpg'].map(FIG);

  // raw names (resolved to the correct NFC/NFD encoding at startup)
  var VIDEO_NAMES = ['Eden_creation_computerlars698399549eec657261bfc0fd.mp4','dipfies_spawn.mp4','videopresent.mp4',
    'Synthetic Summit_ AI World Congress.mp4','Can_AI_Be_the_Future_of_Politics_.mp4','Is_AI_Politics_the_Disruptive_Force_We_Need_.mp4',
    'This is a video of Computer Lars - party secretary of The Synthetic Party.mp4',
    "Denmark's new AI-driven party eyes parliament-a0145a9d.mp4",'AI robot runs a political party, explains its intelligence.mp4',
    'This AI Wants To Be President \ud83e\udd16\ud83d\ude32.mp4',
    'Joseph Beuys \u00fcber seine Theorie der Plastik.mp4','Joseph Beuys - K\u00fcnstler und Gesellschaft.mp4',
    'y2mate.com - Joseph Beuys  Kunst f\u00fcr den Menschen_360p.mp4',
    'derrida teleloop.mp4','Gen-2 2991755647, singing man, prustpng, M 5.mp4',
    'Staun\u00e6sAskerfilm.mp4','Performativ forel\u00e6sning Det Syntetiske Parti (1).mp4','A Synthetic Readie.mp4',
    'Eine KI ersetzt Politiker Leader Lars sagt ja! shorts.mp4','Meeting with Professor Slurk-20231024_112853-Meeting Recording.mp4',
    'snaptik_7509927318693924118_v3.mp4','Intelig\u00eancia artificial lidera partido pol\u00edtico na Europa.mp4',
    'Partido pol\u00edtico liderado por una inteligencia artificial busca llegar al gobierno.mp4',
    'yt5s.io-Dialog \u00eentre Nicolae Ciuc\u0103 \u0219i robotul Ion_ "Rolul meu este s\u0103 v\u0103 reprezint".mp4',
    'PARTIDO Sintético Dinamarquês é PRIMEIRO PARTIDO liderado por uma INTELIGÊNCIA ARTIFICIAL.mp4',
    'DINAMARCA LEADER LARS, la INTELIGENCIA ARTIFICIAL que se presenta a las ELECCIONES I RTVE Noticias.mp4',
    'Candidato robô controlado por IA é proposta de partido dinamarquês.mp4',
    'AI Political Party, Dr. Frankenstein, Scientists Revive Pigs After 1 Hour Death.mp4',
    'Leader Lars, El Primer Pol\u00edtico De Inteligencia Artificial shorts.mp4',
    'videoplayback.mp4','2024-04-16 21-01-00.mp4','b8d44740-da3e-4289-a150-7d67970738d2.mp4',
    'Sample Media Clip 10.mp4','Sample Media Clip 11.mp4'];
  var UIMG_NAMES = ['22_Photo_Kunsthal Aarhus.JPG'];
  // audio pool for the mumble bed — dedicated sound files
  var SOUND_NAMES = ['2_Radio Palme_New Feudalism Unveiled.mp3','3_Radio Palme_From the Vault.mp3',
    '4_Radio Palme_Massmedia Orchestration.mp3','5_Radio Palme_Palme ny partiledare.mp3',
    '7_Radio Palme_FirstWeekSummary (1).mp3','9_Radio Palme_ Prist p\u00e5 mj\u00f6lk.mp3',
    'Dance of the Rose 1.mp3','Deactivation of Hal 9000 [TubeRipper.com].mp3','Det Syntetiske Manifest.mp3',
    'IBM Selectric Typewriter Sound Test.mp3','LarsSoundSnippet.mp3','lars11labs.mp3',
    'Olof Palme - D\u00e4rf\u00f6r \u00e4r jag demokratisk socialist - Martin Tunstr\u00f6m (youtube).mp3',
    'Olof Palme - Hanoi Speech 1972 (eng) - pachamadresita (youtube).mp3',
    'nazywam sie.wav','osb wirtual.wav','osw.wav','partia.wav','preyzdent-2001_z1gwLg8F.wav','sam info.wav',
    'Performativ forel\u00e6sning Det Syntetiske Parti (1).mp4','Synthetic Summit_ AI World Congress.mp4',
    'AI robot runs a political party, explains its intelligence.mp4',
    'Can_AI_Be_the_Future_of_Politics_.mp4','Is_AI_Politics_the_Disruptive_Force_We_Need_.mp4',
    'This is a video of Computer Lars - party secretary of The Synthetic Party.mp4',
    'Joseph Beuys \u00fcber seine Theorie der Plastik.mp4','videopresent.mp4',
    'Eine KI ersetzt Politiker Leader Lars sagt ja! shorts.mp4',
    'yt5s.io-Dialog \u00eentre Nicolae Ciuc\u0103 \u0219i robotul Ion_ "Rolul meu este s\u0103 v\u0103 reprezint".mp4'];

  // resolve NFC vs NFD per file (media elements don't fire 'error' reliably here, so test up front)
  var normCache={};
  function isAscii(s){ return /^[\x00-\x7F]*$/.test(s); }
  async function resolveURL(name){
    if(normCache[name]) return normCache[name];
    var nfc='uploads/'+encodeURIComponent(name.normalize('NFC'));
    if(isAscii(name)){ normCache[name]=nfc; return nfc; }
    try{ var c=new AbortController(); var to=setTimeout(function(){c.abort();},2500);
      var r=await fetch(nfc,{headers:{Range:'bytes=0-1'},signal:c.signal}); clearTimeout(to);
      if(r.status<400){ normCache[name]=nfc; return nfc; } }catch(e){}
    var nfd='uploads/'+encodeURIComponent(name.normalize('NFD')); normCache[name]=nfd; return nfd;
  }
  var VIDEOS = await Promise.all(VIDEO_NAMES.map(resolveURL));
  var SOUND  = await Promise.all(SOUND_NAMES.map(resolveURL));
  var UIMG   = await Promise.all(UIMG_NAMES.map(resolveURL));
  var POOL = IMAGES.concat(UIMG, VIDEOS);

  function isVid(s){ return /\.(mp4|webm|mov|m4v)$/i.test(s); }
  function rnd(a,b){ return a + Math.random()*(b-a); }
  function pick(a){ return a[(Math.random()*a.length)|0]; }
  function shuffle(a){ a=a.slice(); for(var i=a.length-1;i>0;i--){var j=(Math.random()*(i+1))|0,t=a[i];a[i]=a[j];a[j]=t;} return a; }

  // ---- the drifting wall --------------------------------------------------
  function spanClass(big){ big = big||0.36; var r=Math.random();
    return r<big*0.14?' x': r<big*0.45?' l': r<big?' w': r<big+0.18?' t':''; }
  function cellInner(src){
    if(isVid(src)) return '<video muted loop playsinline preload="none" data-vsrc="'+src+'"></video><span class="vm"></span>';
    return '<img loading="lazy" alt="" src="'+src+'">';
  }
  function buildWall(wall){
    var sec = wall.closest('section');
    var mode = (sec && sec.getAttribute('data-cmode')) || '1';
    wall.classList.add('cmode-'+mode);
    var order = shuffle(POOL);
    // each collage site feels different: density, tile-bias and motion vary by mode
    var cfg = ({
      '1': {count:84, big:0.20, vids:4},   // Edge 1 — dense mosaic
      '2': {count:54, big:0.42, vids:4},   // Edge 2 — fewer, larger panels
      '3': {count:96, big:0.10, vids:3},   // Edge 3 — fine tight grid
      '4': {count:40, big:0.55, vids:5}    // Part IV — big slow plates
    })[mode] || {count:84, big:0.20, vids:4};
    var count = cfg.count, html = '', vids = 0, VIDCAP = cfg.vids;
    for(var k=0;k<count;k++){
      var src = order[k % order.length];
      if(isVid(src)){ if(vids >= VIDCAP){ src = pick(IMAGES); } else { vids++; } }   // few autoplaying videos, mostly stills
      var dx=rnd(-16,16).toFixed(1)+'px', dy=rnd(-16,16).toFixed(1)+'px';
      var dur=rnd(7,14).toFixed(1)+'s', dly=rnd(-12,0).toFixed(1)+'s';
      html += '<button class="cc'+spanClass(cfg.big)+'" type="button" tabindex="-1" data-src="'+src+'"'
            + ' style="--dx:'+dx+';--dy:'+dy+';--dur:'+dur+';--dly:'+dly+'">'+cellInner(src)+'</button>';
    }
    wall.innerHTML = html;
    wall._cells = [].slice.call(wall.querySelectorAll('.cc'));
    wall._cells.forEach(function(c){ var im=c.querySelector('img');
      if(im) im.addEventListener('error', function(){ var n=pick(IMAGES); c.dataset.src=n; im.src=n; }); });
  }

  // mutate one active wall at a time
  var mutA=null, mutB=null;
  function startMutate(wall){
    stopMutate();
    if(reduce) return;
    mutA = setInterval(function(){
      if(!wall._cells || !wall._cells.length) return;
      var c = pick(wall._cells); if(c.querySelector('video')) return;
      var im = c.querySelector('img'); if(!im) return;
      var n = pick(IMAGES);
      c.classList.add('swap');
      setTimeout(function(){ im.src=n; c.dataset.src=n; c.classList.remove('swap'); }, 440);
    }, 700);
    mutB = setInterval(function(){
      if(!wall._cells || !wall._cells.length) return;
      var b = 4 + (Math.random()*5|0);
      for(var i=0;i<b;i++){ var c=pick(wall._cells);
        c.className = 'cc' + spanClass();
        c.style.setProperty('--dx', rnd(-16,16).toFixed(1)+'px');
        c.style.setProperty('--dy', rnd(-16,16).toFixed(1)+'px'); }
    }, 1600);
  }
  function stopMutate(){ if(mutA){clearInterval(mutA);mutA=null;} if(mutB){clearInterval(mutB);mutB=null;} }
  function playWallVideos(wall){ if(!wall) return;
    var vs=[].slice.call(wall.querySelectorAll('video'));
    vs.forEach(function(v,i){ setTimeout(function(){           // stagger so the server isn't hit by all at once
      if(!v.isConnected) return;
      if(!v.src){ var s=v.getAttribute('data-vsrc'); if(s){ v.src=s; v.load(); } }
      v.muted=true; var p=v.play(); if(p&&p.catch)p.catch(function(){});
    }, 300*i); });
  }
  function pauseWallVideos(wall){ if(!wall) return; wall.querySelectorAll('video').forEach(function(v){ try{v.pause();}catch(e){} }); }

  // ---- quiet backdrop band (dividers) ------------------------------------
  function buildBand(band){
    var rows = band.querySelectorAll('.row');
    rows.forEach(function(row){
      var imgs = shuffle(IMAGES).slice(0,14), html='';
      // duplicate the set so the -50% scroll loops seamlessly
      for(var dup=0;dup<2;dup++) imgs.forEach(function(s){ html += '<img loading="lazy" alt="" src="'+s+'">'; });
      row.innerHTML = html;
    });
  }

  // ---- click to enlarge (reuse terminal.js's #lightbox) ------------------
  document.addEventListener('click', function(e){
    var cell = e.target.closest && e.target.closest('.cwall .cc');
    if(!cell) return;
    var lb = document.getElementById('lightbox'); if(!lb) return;
    var body = lb.querySelector('.lbbody'); if(!body) return;
    e.preventDefault(); e.stopImmediatePropagation();
    body.innerHTML = '';
    var src = cell.dataset.src;
    if(isVid(src)){ var v=document.createElement('video'); v.src=src; v.controls=true; v.autoplay=true; v.loop=true; v.playsInline=true; body.appendChild(v); }
    else { var im=new Image(); im.src=src; body.appendChild(im); }
    lb.classList.add('on');
  }, true);

  // ---- activate walls/bands on the active slide --------------------------
  var deck = document.querySelector('deck-stage');
  var builtWalls = [];
  function onSlide(slide){
    stopMutate();
    var activeWall = slide ? slide.querySelector('.cwall') : null;
    builtWalls.forEach(function(w){ if(w !== activeWall) pauseWallVideos(w); });
    if(!slide) return;
    if(activeWall){ if(!activeWall._cells){ buildWall(activeWall); builtWalls.push(activeWall); } startMutate(activeWall); playWallVideos(activeWall); }
    var band = slide.querySelector('.cband');
    if(band && !band._built){ buildBand(band); band._built = true; }
  }
  if(deck){
    deck.addEventListener('slidechange', function(e){
      onSlide(e.detail && e.detail.slide ? e.detail.slide : deck.querySelector('section[data-deck-active]'));
    });
    // catch the slide that is already active at load (after boot)
    setTimeout(function(){ onSlide(deck.querySelector('section[data-deck-active]')); }, 50);
  }

  // ---- ambient mumble bed: louder, overlapping, re-shuffles on every slide move ----
  (function(){
    var queue = shuffle(SOUND), qi = 0;
    var BASE = 0.6;
    // ONE voice at a time — no overlap. A single element plus a brief crossfade element.
    function makeEl(){ var a=document.createElement('audio'); a.preload='auto'; a.setAttribute('aria-hidden','true');
      a.className='mumble-layer'; a.style.display='none'; a.volume=0; document.body.appendChild(a); return a; }
    var live = makeEl(), spare = makeEl();   // spare only used to fade the old one out cleanly
    var fadeTimers = new WeakMap();
    var started = false, lastChange = 0;
    function nextSrc(){ var s = queue[qi % queue.length]; qi++; if(qi % queue.length === 0) queue = shuffle(SOUND);
      // ensure video voices surface regularly: every 3rd pick, force a video clip
      if(qi % 3 === 0){ var vids = SOUND.filter(function(x){ return /\.(mp4|webm|mov)$/i.test(x); }); if(vids.length) return vids[(Math.random()*vids.length)|0]; }
      return s; }
    function startOffset(src){
      // Radio Palme clips open with a long intro jingle — skip ~15s; others start a few seconds in
      var name = decodeURIComponent(src);
      if(/Radio Palme/i.test(name)) return 15;
      if(/Olof Palme|Manifest|Hanoi|socialist/i.test(name)) return 8;
      return 3 + Math.random()*4;
    }
    function fade(a, target, ms, done){
      var prev = fadeTimers.get(a); if(prev) clearInterval(prev);
      var from=a.volume, t0=Date.now();
      var iv=setInterval(function(){ var k=Math.min(1,(Date.now()-t0)/ms); a.volume=Math.max(0,Math.min(1,from+(target-from)*k));
        if(k>=1){ clearInterval(iv); fadeTimers.delete(a); if(target===0){ try{a.pause();}catch(_){}} if(done) done(); } },40);
      fadeTimers.set(a, iv);
    }
    function playNext(){
      lastChange = Date.now();
      // swap roles so the outgoing clip fades on `spare`, the new clip rises on `live`
      var old = live; live = spare; spare = old;
      if(!spare.paused) fade(spare, 0, 600);
      var a = live; a.volume = 0; a._normTried = false;
      var rawSrc = nextSrc();
      var off = Math.round(startOffset(rawSrc));
      var src = rawSrc + (rawSrc.indexOf('#')<0 ? '#t='+off : '');
      var played = false;
      function go(){ if(played) return; played = true; var p=a.play(); if(p&&p.catch)p.catch(function(){}); fade(a, BASE, 900); }
      // seek FIRST; only start playback once the seek lands (otherwise the browser snaps back to 0)
      a.onloadedmetadata=function(){
        var d=a.duration; var o=off; if(!isFinite(d)||d<=4){ go(); return; } if(o>d-6) o=Math.max(0, d*0.15);
        if(Math.abs(a.currentTime - o) < 0.5){ go(); return; }
        try{ a.currentTime = o; }catch(_){ go(); return; }
        setTimeout(go, 1400);                       // fallback if 'seeked' never fires
      };
      a.onseeked=function(){ go(); };
      a.onended=function(){ playNext(); };
      a.onerror=function(){ if(!a._normTried){ var alt=altNorm(a.src); if(alt){ a._normTried=true; a.src=alt + (alt.indexOf('#')<0?'#t='+off:''); a.load(); return; } } playNext(); };
      a.src = src; a.load();
    }
    function kick(){ if(started) return; started=true; playNext(); }
    window.__summaAudioKick = kick;   // autoplay button starts the bed immediately
    // change voice on slide move — but only if the current clip has already played a good while,
    // so a quick run of slides doesn't chop the audio; otherwise let it keep progressing
    if(deck) deck.addEventListener('slidechange', function(){ if(!started){ kick(); return; }
      if(Date.now() - lastChange > 30000) playNext(); });   // let each clip run ~30s before changing
    window.__summaDuck=function(on){ if(!fadeTimers.get(live)) live.volume = on ? BASE*0.28 : BASE; };
    ['pointerdown','keydown','touchstart'].forEach(function(ev){ window.addEventListener(ev, kick, {passive:true}); });
    setTimeout(kick, 400);
    document.addEventListener('play', function(e){ if(e.target.tagName==='VIDEO' && e.target.classList.contains('av')) window.__summaDuck(true); }, true);
    document.addEventListener('pause', function(e){ if(e.target.tagName==='VIDEO' && e.target.classList.contains('av')) window.__summaDuck(false); }, true);
  })();
})();
