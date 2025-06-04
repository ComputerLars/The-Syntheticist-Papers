document.addEventListener('DOMContentLoaded', function () {
  // Fetch the search index JSON file
  // The JavaScript files in the `scripts` directory are not processed by Jekyll,
  // so Liquid tags like `{{ "/search.json" | relative_url }}` will be served
  // literally to the browser and break the fetch call. Use a normal relative
  // path instead.
  fetch('/search.json')
    .then(response => response.json())
    .then(pages => {
      // Initialize Lunr.js
      const idx = lunr(function () {
        this.ref('url');
        this.field('title');
        this.field('content');

        pages.forEach(function (page) {
          this.add(page);
        }, this);
      });

      // Get references to the search input and results container
      const searchInput = document.getElementById('search-input');
      const resultsContainer = document.getElementById('results-container');

      // Listen for input events
      searchInput.addEventListener('input', function () {
        const query = this.value;
        const results = idx.search(query);
        displayResults(results, pages);
      });

      // Function to display search results
      function displayResults(results, pages) {
        resultsContainer.innerHTML = '';
        if (results.length > 0) {
          results.forEach(function (result) {
            const page = pages.find(p => p.url === result.ref);
            const resultDiv = document.createElement('div');
            const link = document.createElement('a');
            link.href = page.url;
            link.textContent = page.title;
            resultDiv.appendChild(link);
            resultsContainer.appendChild(resultDiv);
          });
        } else {
          resultsContainer.innerHTML = '<div>No results found</div>';
        }
      }
    })
    .catch(error => {
      console.error('Error loading search index:', error);
    });
});