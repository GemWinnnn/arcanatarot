#!/usr/bin/env python3
"""Static dev server for the tarot room.

Identical to `python3 -m http.server` except that it refuses to let the
browser cache anything. Plain http.server sends only Last-Modified, which
lets Chrome apply heuristic freshness and quietly serve a stale app.js
after an edit — the resulting "impossible" errors point at line numbers
that no longer exist in the file.

Port comes from argv[1], else $PORT, else 4322.
"""

import os
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def log_message(self, fmt, *args):
        # keep the preview log to warnings and errors
        if not args or str(args[1] if len(args) > 1 else "").startswith(("4", "5")):
            super().log_message(fmt, *args)


def main():
    port = int(sys.argv[1] if len(sys.argv) > 1 else os.environ.get("PORT", 4322))
    root = os.path.dirname(os.path.abspath(__file__))
    handler = partial(NoCacheHandler, directory=root)
    with ThreadingHTTPServer(("127.0.0.1", port), handler) as httpd:
        print(f"tarot room on http://127.0.0.1:{port} (no-store)", flush=True)
        httpd.serve_forever()


if __name__ == "__main__":
    main()
