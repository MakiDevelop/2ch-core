// Thread page: prefetch thread and reply data as early as possible
// This script must be loaded synchronously in <head>
(function() {
    var id = location.pathname.match(/\/posts\/(\d+)/);
    if (id) {
        var jsonHeaders = {headers:{'Accept':'application/json'}};
        window.__prefetchThread = fetch('/posts/' + id[1], jsonHeaders).then(function(r) { return r.json(); });
        window.__prefetchReplies = fetch('/posts/' + id[1] + '/replies', jsonHeaders).then(function(r) { return r.json(); });
    }
})();
