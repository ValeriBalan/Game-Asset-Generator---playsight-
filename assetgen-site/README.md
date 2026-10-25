# Asset Generator — local prototype

This is a clickable, functional prototype of the asset generator tool, built to match
the layout and flow we worked through together. It's plain HTML/CSS/JS — no build
step, no server, no real AI calls. "Generation" is simulated (a short delay, then a
colored placeholder swatch), and Scenario isn't actually wired up yet — this is for
testing the *workflow*, not the output quality.

## Running it

**Easiest:** just double-click `index.html` to open it in your browser.

**More reliable** (some browsers restrict local-file scripts slightly): run a tiny
local server from this folder and open the printed address:

```
python3 -m http.server 8000
# then open http://localhost:8000 in your browser
```

(If you don't have Python, `npx serve .` works the same way if you have Node installed.)

## What's real vs. simulated

- **Real:** navigation between all screens, the game switcher, library filtering and
  search, the full generate → submit for review → approve/reject loop, library and
  review counts updating live, the naming convention (`{game}_{type}_{subject}_{variant}[_source].ext`),
  and the screenshot upload — it actually reads the image you pick and shows it with
  the detected-region overlay.
- **Simulated:** the detection boxes on an uploaded screenshot are always the same
  three positions (there's no real object detection), and every "generated" result is
  a colored placeholder rather than an actual image, since Scenario isn't connected.
- **Data:** everything (library assets, review queue, any games you add) is saved to
  this browser's local storage, so it persists across reloads but only on this
  computer, in this browser. There's a "Reset to the sample data" link on the home
  page if you want to start over.

## Games included

Nova Raiders ships pre-seeded with a sample library and three pending review items, so
you can see a populated workspace right away. The other four games start empty, so you
can see the actual empty-state screens we designed ("Good things are on the way") just
by clicking into them.

## Next step

Once you've clicked around and flagged anything that feels off, the real next step is
wiring up Scenario for actual generation and (if you want it to be used by more than
one person on one computer) moving the data from local storage into a real backend.
