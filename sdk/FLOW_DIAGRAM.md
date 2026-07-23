# SEP-10 Authentication Flow Diagram

## State Machine Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    SEP-10 AUTHENTICATION FLOW                    │
└─────────────────────────────────────────────────────────────────┘

                              START
                                │
                                ▼
                          ┌──────────────┐
                          │   IDLE       │
                          │              │
                          │  User clicks │
                          │    "Start"   │
                          └──────┬───────┘
                                 │
                                 ▼
                        ┌────────────────────┐
                        │    REQUESTING      │
                        │                    │
                        │  GET /auth endpoint│
                        │  Challenge TX      │
                        └────────┬───────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                    ▼ (SUCCESS)           ▼ (FAIL)
            ┌──────────────────┐      ┌──────────────┐
            │ AWAITING_SIGNATURE│      │    ERROR     │
            │                  │      │              │
            │ User's wallet    │      │ Network fail │
            │ signs TX         │      │ Retry button │
            └────────┬─────────┘      └──────────────┘
                     │
                     ▼ (USER SIGNS)
            ┌────────────────────┐
            │   VERIFYING        │
            │                    │
            │ POST /auth endpoint│
            │ Verify signature   │
            └────────┬───────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
         ▼ (SUCCESS)         ▼ (FAIL)
    ┌────────────┐        ┌──────────────┐
    │    DONE    │        │    ERROR     │
    │            │        │              │
    │ Token rx   │        │ Sig invalid  │
    │ Green ✓    │        │ Retry button │
    │            │        └──────────────┘
    └────────────┘

         Any error state can:
    ┌─────────────────────────┐
    │  "Try Again" → IDLE     │
    │  "New Session" → IDLE   │
    │  Manual retry from same │
    │  error state            │
    └─────────────────────────┘
```

## Component Communication Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    COMPONENT ARCHITECTURE                        │
└─────────────────────────────────────────────────────────────────┘

    ┌──────────────────────────────────┐
    │      PARENT APPLICATION          │
    │                                  │
    │  onAuthenticated(token)          │
    │  onError(error)                  │
    │  onStageChange(stage)            │
    └───────────────┬──────────────────┘
                    │ Props + Callbacks
                    ▼
    ┌──────────────────────────────────┐
    │     SEP10FLOW COMPONENT          │
    │                                  │
    │  State:                          │
    │  - stage                         │
    │  - challenge                     │
    │  - sessionToken                  │
    │  - error                         │
    │  - expiresAt                     │
    │                                  │
    │  Functions:                      │
    │  - requestChallenge()            │
    │  - submitSignedChallenge()       │
    │  - retry()                       │
    └───────────────┬──────────────────┘
                    │
                    ├────────────────────────┐
                    │                        │
                    ▼                        ▼
        ┌─────────────────────┐  ┌─────────────────────┐
        │   SEP10SERVICE      │  │   STYLING (CSS)     │
        │                     │  │                     │
        │ requestChallenge()  │  │ statusIndicator     │
        │ submitSignedChall() │  │ statusCard          │
        │ getTokenValidity()  │  │ flowSteps           │
        │ maskToken()         │  │ errorBox            │
        └──────────┬──────────┘  │ challengeBox        │
                   │             │ successBox          │
            ┌──────┴──────┐      │ buttons             │
            │             │      └─────────────────────┘
            ▼             ▼
        ┌────────────────────────────────┐
        │    ANCHOR SERVER API           │
        │                                │
        │ GET /auth  ← requestChallenge  │
        │ Response: {transaction, ...}   │
        │                                │
        │ POST /auth ← submitSignedChall │
        │ Request: {transaction: "..."}  │
        │ Response: {token, expiresIn}   │
        └────────────────────────────────┘
```

## User Interaction Sequence Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│         USER INTERACTION SEQUENCE (HAPPY PATH)                   │
└─────────────────────────────────────────────────────────────────┘

TIME    USER              COMPONENT           ANCHOR SERVER
│
│       1. Opens app
│       ──────────────→   Sep10Flow rendered
│                        (IDLE state)
│
│       2. Clicks
│       "Start Auth"
│       ──────────────→   setState(requesting)
│                        ──────────────────────→ GET /auth
│                                               ↓ (process)
│                        ←─────────────────────  Challenge TX
│                        setState(awaiting_sig)
│
│       3. Wallet popup
│       displays         (User sees challenge)
│
│       4. User signs
│       with wallet
│       ──────────────→   setState(verifying)
│       (confirms)        ──────────────────────→ POST /auth
│                                               ↓ (verify sig)
│                        ←─────────────────────  JWT Token
│                        setState(done)
│                        onAuthenticated(token)
│
│       5. Token stored  ← callback received
│       (parent app)

════════════════════════════════════════════════════════════════════

USER INTERACTION SEQUENCE (ERROR PATH)

TIME    USER              COMPONENT           ANCHOR SERVER
│
│       1. Clicks "Start"
│       ──────────────→   setState(requesting)
│                        ──────────────────────→ GET /auth
│                        (timeout/error)       ✗ (no response)
│                        setState(error)
│
│       2. Sees error    "CHALLENGE_REQUEST_FAILED"
│
│       3. Clicks
│       "Try Again"
│       ──────────────→   setState(idle)
│                        (flow resets)
│
│       4. Retry...
│       (cycle repeats)
```

## Data Flow Through Component

```
┌─────────────────────────────────────────────────────────────────┐
│              DATA FLOW DIAGRAM (COMPONENT STATE)                 │
└─────────────────────────────────────────────────────────────────┘

INPUT (Props)
    │
    ├─→ config: Sep10Config
    │   ├─ anchorUrl
    │   ├─ publicKey
    │   ├─ domain
    │   └─ timeout
    │
    ├─→ onAuthenticated?: callback
    ├─→ onError?: callback
    └─→ onStageChange?: callback

STATE MANAGEMENT
    │
    ├─→ Sep10State
    │   ├─ stage: Sep10Stage
    │   ├─ challenge: string | null
    │   ├─ error: string | null
    │   ├─ isAuthenticated: boolean
    │   ├─ sessionToken: string | null
    │   └─ expiresAt: number | null
    │
    └─→ updateState(partial) helper
        └─ Batches updates & triggers callbacks

RENDERING
    │
    ├─→ Conditional UI based on stage
    │   ├─ statusIndicator (color by stage)
    │   ├─ statusTitle (text by stage)
    │   ├─ flowSteps (progress 1-2-3)
    │   ├─ errorBox (if error)
    │   ├─ challengeBox (if awaiting_sig)
    │   ├─ successBox (if done)
    │   └─ actions (buttons by stage)
    │
    └─→ CSS modules apply styles

OUTPUT (Callbacks)
    │
    ├─→ onStageChange(stage) ← on stage change
    ├─→ onAuthenticated(token) ← on done
    └─→ onError(error) ← on error
```

## Token Masking Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      TOKEN MASKING FLOW                         │
└─────────────────────────────────────────────────────────────────┘

Raw Token (from server):
┌─────────────────────────────────────────────────────────────────┐
│ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwI│
│ nwianRpIjoiand0LWlkIiwiZXhwIjoxNjg0MjM2NDAwfQ.UL9Pz5K3UeQwn4M│
│ EBB6iQwRw5rq4VKvNZ2mL8kI                                        │
└─────────────────────────────────────────────────────────────────┘

Masking Service:
    │
    ├─ Calculate: visible = ceil(length / 4)
    │            ≈ ceil(200 / 4) = 50 chars
    │
    ├─ Extract: first 50 chars + "..." + last 50 chars
    │
    └─ Result:

Masked Display:
┌─────────────────────────────────────────────────────────────────┐
│ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3...  │
│ wRw5rq4VKvNZ2mL8kI                                              │
└─────────────────────────────────────────────────────────────────┘

Screenshot Safe? ✓ YES
- First 50 chars visible (identifies token type)
- Last 50 chars visible (verifies token exists)
- Middle 100 chars hidden (prevents full token recovery)
```

## Stage Lifecycle Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    STAGE LIFECYCLE                               │
└─────────────────────────────────────────────────────────────────┘

IDLE
    Duration: User action pending
    Visual: Gray dot, "Ready to authenticate"
    Actions: "Start Authentication" button
    Next: requesting (on click)

           ↓

REQUESTING
    Duration: Challenge fetch (~500ms-5s)
    Visual: Amber dot + pulse, loading animation
    Actions: None (disabled)
    Next: awaiting_signature (success) or error (fail)

           ↓

AWAITING_SIGNATURE
    Duration: User signs (~5s-5min)
    Visual: Amber dot + pulse, challenge display
    Actions: "Submit Signed Challenge", "Cancel"
    Next: verifying (on submit) or idle (on cancel)

           ↓

VERIFYING
    Duration: Signature verify (~500ms-5s)
    Visual: Amber dot + pulse, loading animation
    Actions: None (disabled)
    Next: done (success) or error (fail)

           ↓

DONE
    Duration: Permanent (until refresh)
    Visual: Green dot, masked token display
    Actions: "Start New Session" button
    Next: idle (on click) or auto-logout

           ↓

ERROR (can occur from: requesting, verifying, or manual error)
    Duration: Until user retries
    Visual: Red dot, error message box
    Actions: "Try Again" button
    Next: idle (on click)

TOTAL FLOW: 30-60 seconds typical (user dependent)
```

## Storybook Story Map

```
┌─────────────────────────────────────────────────────────────────┐
│                    STORYBOOK STORIES                             │
└─────────────────────────────────────────────────────────────────┘

Authentication
    └─ Sep10Flow
        │
        ├─ Idle
        │   └─ User sees initial "Start Authentication" button
        │
        ├─ RequestingChallenge
        │   └─ Shows loading state while fetching from server
        │
        ├─ AwaitingSignature
        │   └─ Displays challenge transaction awaiting wallet sign
        │
        ├─ VerifyingSignature
        │   └─ Shows loading state while verifying signature
        │
        ├─ Success
        │   └─ Green success with masked JWT token
        │       └─ Example: eyJ...bG1u (token masked)
        │
        ├─ ChallengeRequestError
        │   └─ Network error during challenge request
        │       └─ Shows "CHALLENGE_REQUEST_FAILED" error
        │       └─ "Try Again" button
        │
        └─ SignatureVerificationError
            └─ Server rejected the signature
                └─ Shows "SIGNATURE_VERIFICATION_FAILED" error
                └─ "Try Again" button

Total: 7 stories covering happy path + 2 failure scenarios
```

---

## Quick Reference

| Stage | Duration | Visual | User Action | Next State |
|-------|----------|--------|-------------|-----------|
| **idle** | Pending | Gray dot | Click button | requesting |
| **requesting** | ~2s | Amber pulse | Wait | awaiting_signature / error |
| **awaiting_signature** | ~5-300s | Amber pulse | Sign in wallet | verifying / idle |
| **verifying** | ~2s | Amber pulse | Wait | done / error |
| **done** | Permanent | Green dot | Click new session | idle |
| **error** | Pending | Red dot | Click retry | idle |

---

This visual reference helps understand the component's behavior and state transitions.
