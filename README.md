# NEXUS COMPLY

NEXUS COMPLY audits YouTube videos for brand and policy compliance. GitHub Pages hosts a frontend preview; the audit API is not deployed yet.

## Live deployments

- GitHub Pages frontend: deployment pending
- Audit API: not deployed; GitHub Pages currently serves a frontend preview only

Audits require the configured Azure Video Indexer, Azure OpenAI, and Azure AI Search resources. Keep credentials out of Git; never commit `.env`.

## Local development

- Backend: `uv run uvicorn backend.src.api.main:app --reload`
- Frontend: `cd frontend` then `npm run dev`
- Backend health and API docs: `/health` and `/docs`