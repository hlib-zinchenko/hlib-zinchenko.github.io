# hzinchenko.com

Personal site, served by GitHub Pages from the root of `main`. Plain HTML and CSS, no build step.

- `/` — the 90s homepage, with a real visitor counter
- `/business/` — the same facts, minus the fun
- `img/` — photos, downscaled into 1998 digital-camera JPEGs
- `_infra/visitor-counter/` — the AWS Lambda behind the counter (Function URL + DynamoDB). Jekyll skips `_` folders, so it isn't published.

Preview locally:

```bash
python3 -m http.server 8000
```
