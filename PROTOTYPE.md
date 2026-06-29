# VLP Prototype — State Summary (for design mapping)

## What it is
**VLP ("Voice Landing Pages")** turns a spoken instruction into a **schema-validated, component-based landing page** that is persisted and rendered. The **orchestrator** is the single user-facing gateway for *generation*; it drives the model services, validates every result against a Pydantic schema, persists only valid pages, and returns the page for rendering. Page *retrieval* does not go through the orchestrator (the frontend reads published pages from Mongo directly).

## Repo layout & services
- `orchestrator/` — **FastAPI** (port 8000). The brain + validation pipeline. STT runs **inside** it via `faster-whisper` (the `stt-service/` folder is empty/unused).
- `frontend/` — **Next.js 16** (App Router, TS, Tailwind v4). Builder UI + renderer.
- **MongoDB** local: db `vlp-local`, collection `pages`.
- Files: `main.py` (HTTP), `pipeline.py` (the validated flow), `schema.py` (Pydantic = source of truth), `llm.py` (`LanguageService` stub), `image_selector.py` (`ImageService` stub), `mock_page.py` (canned copy templates + clarifications/versions).

## End-to-end flow
1. **Builder** (`/`, push-to-talk): tap mic → record → tap again → POST audio to `/command`.
2. **Orchestrator** transcribes (real STT) → runs the **createPage pipeline** (4 gates) → persists the validated page as an **unpublished draft** (`publish:false`) → returns the page + metadata.
3. **Builder** renders the page in a live canvas (same components that ship), allows inline edits, shows brief/clarifications/version-history.
4. **Publish** → `POST /publish` upserts the (edited) sections with `publish:true`.
5. **Render**: visiting the page's URL (`/[...slug]`) reads Mongo directly for `{url, publish:true}` and renders it; 404 otherwise.

## The orchestrator pipeline (`pipeline.run_create_page`)
Stages and gates, in order:
- **Gate 0 — command quality** (`_check_command`): rejects empty/too-short (`< 6 chars` or `< 2 words`) and known Whisper silence-hallucinations (`HALLUCINATIONS` set: "thank you", "thanks for watching", "you", …).
- **STEP 1 + Gate 1 — intent (HLA)** (`_classify_hla` → `lang.classify_intent`): classifies a High-Level Action; valid only if in `ALLOWED_ACTIONS = {"createPage"}`. (Stub maps edit-verbs → `editContent` → rejected, to demo the gate.)
- **STEP 2 — brief** (`lang.extract_brief`): `{business, audience, goal, tone}`. `business` is naively parsed from the transcript (this is what makes the page reflect what was said and drives `name`/`url`).
- **STEP 3 — schema generation** (`lang.generate_schema`): the LLM-stub returns an **ordered list of section types**. It includes only sections the user **named** (keywords/synonyms: hero/header, benefits/features, testimonials/reviews, promotion/offer/sale, faq/questions); if none named → full default `[hero, benefits, testimonials, promotion, faq]`; "break/invalid/corrupt" → `[]` (forces a Gate-2 failure for the demo).
- **STEP 4 — planner → OAO** (`_plan_operations`): fixed template per section — `generate_copy`, `select_image`, `assemble_section` — plus a final `assemble_page`. (OAO count = sections×3 + 1. Not section-type-aware; `select_image` is a no-op for non-image sections.)
- **Execute OAO** (`_execute_operations`):
  - `generate_copy` → `lang.generate_copy` fills templated copy (hero headline injected with business name).
  - `select_image` → `images.select` attaches local images (hero photo; 3 benefit SVG icons). No-op for testimonials/promotion/faq.
  - `assemble_section` → **Gate 3 (per-op)**: validate the section against its Pydantic model; on failure substitute a guaranteed-valid default (silent; sets `operations:"defaulted"`).
  - `assemble_page` → **Gate 2 (schema)**: build & validate the whole `Page`; on failure raise `SchemaInvalid`.

**Escalation rule:** content failures (Gate 3) default silently; structural failures (Gate 0/1/2) raise `PipelineError` → surfaced to the user.

## API contract
**`POST /command`** — multipart `file` (audio).

Success `200`:
```json
{
  "recognizedCommand": "<transcript>",
  "language": "en",
  "message": "Okay, understood — I've drafted a N-section page for <business>.",
  "summary": "Building a landing page for <business> to <goal>.",
  "brief": { "business": "...", "audience": "...", "goal": "...", "tone": null },
  "clarifications": ["...", "..."],
  "versions": [{ "id": "v1", "label": "Initial draft", "when": "now" }],
  "page": { "version": 1, "name": "...", "url": "/slug", "sections": [ ... ] },
  "plan": {
    "action": "createPage",
    "schema": ["hero", "..."],
    "operations": ["generate_copy:hero", "select_image:hero", "assemble_section:hero", "...", "assemble_page"]
  },
  "validation": { "valid": true, "gates": { "intent": "ok", "schema": "ok", "operations": "ok|defaulted" } }
}
```

Rejection `422` (Gate 0/1/2):
```json
{
  "recognizedCommand": "...",
  "error": { "stage": "command|intent|schema", "message": "..." },
  "validation": { "valid": false }
}
```

**`POST /publish`** — JSON `{url, sections?}` → upserts `{publish:true, sections}` into `vlp-local.pages` by `url`.
**`GET /health`** → `{"status":"ok"}`.

Note: `plan`/`validation`/`clarifications`/`versions`/`summary` are returned but **not all rendered** in the UI (`clarifications`, brief, versions, the rejection badge are; `plan` is logged-only now).

## Data contracts (`schema.py` — the Pydantic source of truth)
- `Image { src: non-empty, alt: str="" }`, `Button { label: non-empty, href?: str }`
- `Brief { business, audience, goal: non-empty; tone?: str }`
- `Section` = discriminated union on `type`:
  - `hero { type, headline: non-empty, subhead?, image: Image, button: Button }`
  - `benefits { type, heading: non-empty, items: BenefitItem[3..6] }`, `BenefitItem { icon: Image, title, caption }`
  - `testimonials { type, heading?, items: TestimonialItem[1..*] }`, `TestimonialItem { name, rating: int 1–5, content }`
  - `promotion { type, title, description, button: Button }`
  - `faq { type, heading?, items: FAQItem[1..*] }`, `FAQItem { question, answer }`
- `Page { version: int=1, name: non-empty, url: non-empty, sections: Section[1..*] }`
- **Mongo `pages` doc** = `Page` fields + `publish: bool` (+ `_id`).
- Frontend mirrors these as hand-authored TS in `frontend/src/types/sections.ts` and `frontend/src/lib/orchestrator.ts` (no codegen yet).

## Logs produced (each step → `vlp.pipeline` and `vlp.orchestrator` loggers, INFO)
Per successful `/command`, in order:
```
[orchestrator] /command transcribed (lang=en): '<transcript>'
[pipeline] ──────── createPage pipeline start ────────
[pipeline] transcript: '<transcript>' (lang=en)
[pipeline] GATE 0 (command) ok: <n> words
[pipeline] STEP 1/4 classify intent → HLA='createPage'
[pipeline] GATE 1 (intent) ok: 'createPage' is allowed
[pipeline] STEP 2/4 brief extracted: business='...' audience='...' goal='...'
[pipeline] STEP 3/4 schema generated: <n> sections [...]
[pipeline] STEP 4/4 planner produced <m> atomic operations:
[pipeline]     OAO 01/<m>  generate_copy:hero
[pipeline]     OAO 02/<m>  select_image:hero
[pipeline]     ...                              (3 per section + assemble_page)
[pipeline] exec 01/<m> generate_copy:hero → copy fields: [...]
[pipeline] exec 02/<m> select_image:hero → images attached
[pipeline] exec 03/<m> assemble_section:hero → GATE 3 ok
[pipeline] ...
[pipeline] exec <m>/<m> assemble_page → GATE 2 ok
[pipeline] gates: intent=ok operations=ok schema=ok → page /slug (<n> sections)
[pipeline] ──────── pipeline done: VALID ────────
[orchestrator] /command persisted draft /slug (publish=false)
```

Rejections log a WARNING and stop:
- `GATE 0 (command) REJECTED: transcript too short/unclear: '...'` or `... likely silence/hallucination: '...'`
- `GATE 1 (intent) REJECTED: 'editContent' not in allowed actions ['createPage']`
- `GATE 2 (schema) REJECTED: <n> schema error(s); first at '<loc>': <msg>`
- Gate 3 (non-fatal): `exec NN/MM assemble_section:X → GATE 3 failed (k error(s)) → applied default`
- Boundary: `/command rejected at <stage> gate: <message>`

## What's REAL vs STUB vs not built
- **REAL:** STT (faster-whisper, `vad_filter=True`), the full `createPage` flow, **Gate 2 schema validation (Pydantic)**, Gate 0 & Gate 3, persistence of only-valid pages, render-from-data, publish, Mongo read by URL.
- **STUB (behind stable interfaces, swappable):** intent classification, brief extraction (naive business-name parse), schema/section selection (keyword/named-section), copy generation (canned templates), image selection (fixed local assets). The planner→OAO split is a fixed template.
- **NOT built (designed only):** real LLM (Ollama)/CLIP, editing actions (`editContent`/`replaceImage`/`addSection`/`removeSection`), multi-turn clarification dialogue, retry loops (>1), auth, multi-page, Docker, OpenAPI→TS codegen.

## Key limitations / honesty notes
- Copy is **canned** regardless of business type — only the page *structure* varies with the command; injected business name is the main dynamic content.
- Business-name parsing is weak (e.g. "summer sale page" → odd name); two different inputs can slug to the **same URL** and overwrite in Mongo.
- The `plan`/`schema` are returned and logged but the dedicated UI panel was removed (logs only).
- Writes go through the orchestrator (Python); reads go straight from Next.js → both assume the same `pages` shape.
- Editing actions (`editContent` etc.) are rejected at Gate 1 by design.

## Run
```bash
# orchestrator (first run downloads Whisper + Silero VAD)
cd orchestrator && venv/bin/uvicorn main:app --reload --port 8000
# frontend
cd frontend && npm run dev   # http://localhost:3000
# mongo: vlp-local.pages on mongodb://localhost:27017
```

**Demo triggers:**
- "a landing page for a bakery with a hero and an FAQ" — named sections → `[hero, faq]`
- "edit the headline" — Gate 1 intent rejection
- "break the page" — Gate 2 schema rejection
- silence → Gate 0 rejection
