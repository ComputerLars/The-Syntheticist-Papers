/* SUMMA TRANSSCRIPTUS — the Codex.
   The dissertation cover stays pinned on screen at all times; one click opens a
   scrollable PDF reader of the full thesis so any concrete question can be
   chased into the source on the spot. */
(function(){
  var PDF = 'uploads/finalphd-compressed.pdf';
  var box = document.createElement('div'); box.id = 'codex';
  box.title = 'Open the dissertation (PDF) \u2014 scroll for any concrete question';
  box.innerHTML = '<img src="media/fig/image1.jpeg" alt="Syntheticism \u2014 dissertation cover">';
  document.body.appendChild(box);

  var view = document.createElement('div'); view.id = 'codexview';
  view.innerHTML = '<div class="cxhead"><span><span class="gild">CODEX ::</span> '
    + '<b>Syntheticism: How I Learned to Love Democracy</b> &mdash; finalphd-compressed.pdf</span>'
    + '<span class="x" role="button" tabindex="0">CLOSE \u00d7</span></div>';
  document.body.appendChild(view);

  var ifr = null;
  function open(){
    if(!ifr){ ifr = document.createElement('iframe'); ifr.src = PDF;
      ifr.setAttribute('title','Syntheticism — full dissertation'); view.appendChild(ifr); }
    view.classList.add('on');
  }
  function close(){ view.classList.remove('on'); }
  box.addEventListener('click', open);
  view.querySelector('.x').addEventListener('click', close);
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape' && view.classList.contains('on')) close();
  });
})();
