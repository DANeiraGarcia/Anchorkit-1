# Anchor status-monitor dashboard

A small, self-contained dashboard that polls the discovery/health-score module
and visualises anchor health **over time**. It mirrors the original repo's
`status-monitor.html`: a single HTML file, no build step, no external assets.

Open [`status-monitor.html`](./status-monitor.html) directly in a browser, or
serve it from the same origin as the health-score module.

```sh
# Serve it next to the module and open http://localhost:8080/status-monitor.html
python3 -m http.server 8080 --directory observability
```

Click **Demo data** to preview the dashboard with locally-generated synthetic
data — no module or network required.

## What it shows

- **Health-score trend** — a line chart of every tracked anchor's score
  (0–100) over the observed window, so you see *movement*, not just a current
  snapshot. Each anchor also gets a per-card sparkline.
- **Fleet summary** — anchors tracked, average health, and a breakdown of
  healthy / degraded / unhealthy / unreachable.
- **Per-anchor cards** — current score, a status badge (icon **and** label, so
  status never depends on colour alone), the individual sub-checks, and how
  long ago the anchor was last checked.
- **Table view** — a colour-independent, screen-reader-friendly view of the same
  data plus the recorded trend samples.

## Health-score JSON contract

The dashboard polls a single endpoint (set in the **Endpoint** field, or
`localStorage["anchorkit.monitor.endpoint"]`) that returns JSON in the shape
below. This is the contract the discovery/health-score module is expected to
serve; the dashboard is tolerant of missing optional fields.

```jsonc
{
  "generated_at": "2026-07-23T12:00:00Z",   // optional, informational
  "anchors": [
    {
      "id": "kyc.anchor.example",            // stable key; falls back to home_domain
      "home_domain": "kyc.anchor.example",   // shown as the anchor label
      "reachable": true,                     // false => rendered as "unreachable"
      "health_score": 92,                    // integer 0–100 (null when unreachable)
      "status": "healthy",                   // healthy | degraded | unhealthy | unreachable
      "last_checked": "2026-07-23T12:00:00Z",
      "error": null,                         // optional human-readable reason when unreachable
      "checks": {                            // optional sub-checks (bool | "pass"/"warn"/"fail" | number)
        "stellar_toml": "pass",
        "sep10_auth": "pass",
        "sep24_transfer": "warn",
        "response_time_ms": 142
      },
      "history": [                           // optional server-side trend used to seed the chart
        { "at": "2026-07-23T11:30:00Z", "score": 90 },
        { "at": "2026-07-23T11:45:00Z", "score": 91 }
      ]
    }
  ]
}
```

Notes:

- A bare top-level array of anchor objects is also accepted.
- `status` is derived from `reachable` + `health_score` when omitted
  (`>=90` healthy, `>=70` degraded, otherwise unhealthy; not reachable →
  unreachable).
- The dashboard **accumulates its own trend** from successive polls (persisted
  in `localStorage`, capped at 240 points per anchor), so a module that only
  ever returns a snapshot still produces a trend. Any server-provided `history`
  is used to seed the line on first load.

## Graceful degradation

The dashboard is built to keep working when an anchor — or the whole module — is
unreachable:

- Fetch failures (network error, non-2xx, or a 10s timeout) never blank the
  view. The **last-known** scores and trend stay on screen, the connection pill
  turns amber → red, and a non-blocking banner explains what happened.
- An unreachable poll does **not** record a `0` sample — that would draw a
  misleading cliff on the trend. The last real value is held and the card is
  flagged `stale`.
- A single anchor reporting `reachable: false` is rendered as an
  "Unreachable" card (with its optional `error`) while the rest of the fleet
  continues to update.
- Polling backs off gracefully: overlapping requests are suppressed, and the
  interval is configurable (2–600s).

## No secrets client-side

This is a hard requirement of the issue and is enforced in two ways:

1. **Nothing secret is embedded or requested.** The dashboard never contains,
   prompts for, or stores an API key, JWT, or bearer token. Requests are sent
   with `credentials: "same-origin"`, so if the health endpoint needs
   authentication it is expected to rely on the browser session cookie —
   managed by the server, never by this page.
2. **Defence-in-depth redaction.** Before any response reaches the DOM, the
   dashboard recursively strips fields whose key looks credential-shaped
   (`api_key`, `token`, `jwt`, `bearer`, `authorization`, `secret`, `password`,
   `private_key`, `session`, …). Even a module that accidentally includes such a
   field cannot cause it to render.

Because the file is fully self-contained (no external scripts, styles, fonts, or
analytics), it also satisfies a strict `Content-Security-Policy` and leaks
nothing to third parties.

Closes #65.
