---
layout: default
description: Multimedia production around The Synthetic Summit 2025.
show_nav: false
show_footer: false
show_translate_widget: false
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
      <p>Concerning specters within syntheticism.</p>
    </div>
    <!-- Video 2 -->
    <div class="video-item">
      <iframe width="560" height="315" src="https://www.youtube.com/embed/63L5joPvmck" frameborder="0" allowfullscreen></iframe>
      <p>Scroll-down of synthetic statecraft with voice of neo-scholastic disputation.</p>
    </div>
    <!-- Video 3 -->
    <div class="video-item">
      <iframe width="560" height="315" src="https://www.youtube.com/embed/F4Euejr5cWU" frameborder="0" allowfullscreen></iframe>
      <p>Synthetic imagery for scholastic computation.</p>
    </div>
    <!-- Video 4 -->
    <div class="video-item">
      <iframe width="560" height="315" src="https://www.youtube.com/embed/lCgjkJRhOrk" frameborder="0" allowfullscreen></iframe>
      <p>Synthetic propaganda in a revisit of Bob Brown's flat reading machine.</p>
    </div>
    <!-- Video 5 -->
    <div class="video-item">
      <iframe width="560" height="315" src="https://www.youtube.com/embed/iPZ9mgDWAu8" frameborder="0" allowfullscreen></iframe>
      <p>Synthetic parties as organisms</p>
    </div>
    <!-- Video 6 -->
    <div class="video-item">
      <iframe width="560" height="315" src="https://www.youtube.com/embed/EVY-uRDPDeE" frameborder="0" allowfullscreen></iframe>
      <p>Between hypothesis and mission.</p>
    </div>
    <!-- Video 7 -->
    <div class="video-item">
      <iframe width="560" height="315" src="https://www.youtube.com/embed/hd5gOZeVIRA" frameborder="0" allowfullscreen></iframe>
      <p>Summits as social sculpture.</p>
    </div>
    <!-- Video 8 -->
    <div class="video-item">
      <iframe width="560" height="315" src="https://www.youtube.com/embed/g02Qan5-qeo" frameborder="0" allowfullscreen></iframe>
      <p>Performance-lecture.</p>
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