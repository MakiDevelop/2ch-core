// Board page: prefetch thread data as early as possible
// This script must be loaded synchronously in <head>
(function() {
    var slug = location.pathname.match(/\/boards\/([^\/]+)/);
    var sort = localStorage.getItem('threadSort') || 'latest';
    var jsonHeaders = {headers:{'Accept':'application/json'}};
    if (slug) {
        window.__prefetchSort = sort;
        window.__prefetchData = fetch('/boards/' + slug[1] + '/threads?sort=' + sort, jsonHeaders).then(function(r) { return r.json(); });
    }
})();
