---
layout: default
title: Video Essays
description: Multimedia production around The Synthetic Summit 2025.
---

<!-- Navigation Menu -->
{% if page.show_nav != false %}
<nav class="navbar">
  {% include nav.html %}
</nav>
{% endif %}

<!-- Header -->
<header class="header">
  <h1>{{ page.title }}</h1>
</header>

<!-- Main Content -->
<main class="content">
  <section class="video-gallery">
    <!-- Video 1 -->
    <div class="video-item">
      <iframe width="560" height="315" src="https://www.youtube.com/embed/JzSHkM_8ZQg" frameborder="0" allowfullscreen></iframe>
      <p>Video Title 1: Description of the video.</p>
    </div>
    <!-- Video 2 -->
    <div class="video-item">
      <iframe width="560" height="315" src="https://www.youtube.com/embed/63L5joPvmck" frameborder="0" allowfullscreen></iframe>
      <p>Video Title 2: Description of the video.</p>
    </div>
    <!-- Video 3 -->
    <div class="video-item">
      <iframe width="560" height="315" src="https://www.youtube.com/embed/F4Euejr5cWU" frameborder="0" allowfullscreen></iframe>
      <p>Video Title 3: Description of the video.</p>
    </div>
    <!-- Video 4 -->
    <div class="video-item">
      <iframe width="560" height="315" src="https://www.youtube.com/embed/lCgjkJRhOrk" frameborder="0" allowfullscreen></iframe>
      <p>Video Title 4: Description of the video.</p>
    </div>
    <!-- Video 5 -->
    <div class="video-item">
      <iframe width="560" height="315" src="https://www.youtube.com/embed/iPZ9mgDWAu8" frameborder="0" allowfullscreen></iframe>
      <p>Video Title 5: Description of the video.</p>
    </div>
    <!-- Video 6 -->
    <div class="video-item">
      <iframe width="560" height="315" src="https://www.youtube.com/embed/EVY-uRDPDeE" frameborder="0" allowfullscreen></iframe>
      <p>Video Title 6: Description of the video.</p>
    </div>
    <!-- Video 7 -->
    <div class="video-item">
      <iframe width="560" height="315" src="https://www.youtube.com/embed/hd5gOZeVIRA" frameborder="0" allowfullscreen></iframe>
      <p>Video Title 7: Description of the video.</p>
    </div>
    <!-- Video 8 -->
    <div class="video-item">
      <iframe width="560" height="315" src="https://www.youtube.com/embed/g02Qan5-qeo" frameborder="0" allowfullscreen></iframe>
      <p>Video Title 8: Description of the video.</p>
    </div>
  </section>

  <!-- Navigation Links -->
  <nav class="nav-links">
    <a href="{{ '/' | relative_url }}">&laquo; Back to Table of Contents</a>
  </nav>
</main>

<!-- Footer -->
{% if page.show_footer != false %}
<footer class="footer">
  {% include footer.html %}
</footer>
{% endif %}