#!/usr/bin/env python3
"""Lokální server pro Musicbox: python3 serve.py [port]

Standardní `python3 -m http.server` má frontu spojení jen 5 a při načítání
desítek JS modulů najednou občas spojení odmítne (stránka pak zůstane prázdná).
"""

import http.server
import os
import sys


class Server(http.server.ThreadingHTTPServer):
    request_queue_size = 128
    daemon_threads = True


class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map, '.js': 'text/javascript'}

    def end_headers(self):
        # při vývoji vždy načíst čerstvé soubory
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

    def log_message(self, *args):
        pass


if __name__ == '__main__':
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    print(f'Musicbox běží na http://localhost:{port}  (Ctrl+C ukončí)')
    Server(('', port), Handler).serve_forever()
