# Public pages CSP - no unsafe-inline for scripts
add_header Content-Security-Policy "default-src 'self'; script-src 'self' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:; frame-src https://www.youtube.com https://youtube.com; connect-src 'self'; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self';" always;
