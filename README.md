# hzinchenko.com

Personal site, served by GitHub Pages from the root of `main`. Plain HTML and CSS, no build step.

- `/` — the 90s homepage, with a real visitor counter
- `/ua/` — the same 90s homepage in Ukrainian. Both pages share `90s.css` and `90s.js`, so only the text is duplicated
- `/business/` — the same facts, minus the fun
- `img/` — photos, downscaled into 1998 digital-camera JPEGs
- `_og/` — the social preview cards behind `/img/og-*.png`, with the command that renders them
- `_infra/visitor-counter/` — the AWS Lambda behind the counter (Function URL + DynamoDB). Jekyll skips `_` folders, so it isn't published.

Preview locally:

```bash
python3 -m http.server 8000
```
