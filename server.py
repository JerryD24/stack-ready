#!/usr/bin/env python3
"""
Local dev server for Interview Prep Hub.
Serves website assets from website/ and markdown from parent Interview_Prep/.

Usage:
    python server.py
    python server.py 3000

Then open: http://localhost:8080
"""

import http.server
import mimetypes
import os
import sys
from functools import partial

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8080

WEBSITE_DIR = os.path.dirname(os.path.abspath(__file__))
PREP_DIR = os.path.dirname(WEBSITE_DIR)

# Markdown/text study files live in Interview_Prep root
PREP_EXTENSIONS = {'.md', '.txt'}


class InterviewPrepHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=WEBSITE_DIR, **kwargs)

    def _resolve_prep_file(self, path):
        """If path is a prep guide filename, return absolute path in PREP_DIR."""
        name = os.path.basename(path)
        if not name or name.startswith('.'):
            return None
        ext = os.path.splitext(name)[1].lower()
        if ext not in PREP_EXTENSIONS:
            return None
        full = os.path.join(PREP_DIR, name)
        if os.path.isfile(full):
            return full
        return None

    def do_GET(self):
        clean = self.path.split('?', 1)[0].split('#', 1)[0]
        prep_file = self._resolve_prep_file(clean)
        if prep_file:
            return self._serve_file(prep_file)
        return super().do_GET()

    def _serve_file(self, filepath):
        try:
            with open(filepath, 'rb') as f:
                content = f.read()
            ext = os.path.splitext(filepath)[1].lower()
            ctype = mimetypes.guess_type(filepath)[0] or 'text/plain; charset=utf-8'
            if ext == '.md':
                ctype = 'text/plain; charset=utf-8'
            self.send_response(200)
            self.send_header('Content-Type', ctype)
            self.send_header('Content-Length', str(len(content)))
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
            self.end_headers()
            self.wfile.write(content)
        except OSError as e:
            self.send_error(404, f'File not found: {e}')

    def log_message(self, format, *args):
        print(f"[{self.log_date_time_string()}] {args[0]}")


def main():
    os.chdir(WEBSITE_DIR)
    with http.server.HTTPServer(('', PORT), InterviewPrepHandler) as httpd:
        print('=' * 60)
        print('  Interview Prep Hub — Local Server')
        print('=' * 60)
        print(f'  Website:  http://localhost:{PORT}')
        print(f'  Prep dir: {PREP_DIR}')
        print('  Press Ctrl+C to stop')
        print('=' * 60)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print('\nServer stopped.')


if __name__ == '__main__':
    main()
