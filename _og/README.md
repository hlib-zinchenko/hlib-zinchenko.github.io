# Social preview cards

The `og:image` pictures in `/img/og-*.png` are screenshots of the cards in this folder, 1200×630.
Jekyll skips `_` folders, so the cards themselves aren't published.

To re-render them after a change, start the local server (`python3 -m http.server 8765` in the repo root), then:

```bash
C="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
shot() { "$C" --headless=new --hide-scrollbars --force-device-scale-factor=1 --window-size=1200,630 --virtual-time-budget=3000 --screenshot="$PWD/$2" "$1"; }
shot "http://localhost:8765/_og/card-90s.html" img/og-90s-en.png
shot "http://localhost:8765/_og/card-90s.html?lang=uk" img/og-90s-uk.png
shot "http://localhost:8765/_og/card-business.html" img/og-business.png
```
