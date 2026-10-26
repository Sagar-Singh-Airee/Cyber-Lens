# CyberLens AI — No-compromise launch guide

## Protect the core experience

1. A complete flow wins over a large feature list: paste content, inspect it, explain the evidence, and give the user a safe next move.
2. Avoid absolute language. CyberLens highlights indicators; it cannot certify content as safe or malicious.
3. Keep the demo reliable. The bundled guided-demo analyzer is intentional and works without an API key or network connection.

## Protect user trust

1. Add `OPENAI_API_KEY` only to the server environment. Never use a `VITE_` key or commit `.env` files.
2. Do not log submitted emails, URLs, credentials, or raw logs. This implementation does not persist raw submissions.
3. Keep production CORS origins specific. Replace local development origins with the deployed frontend address.
4. Make the model provider a refinement, not a single point of failure. CyberLens falls back safely if the provider fails.

## Make the demo memorable

1. Start with the problem: people see suspicious content every day but do not know which signal matters.
2. Paste the included email example and point to the evidence, not merely the risk color.
3. Show one log example to demonstrate that CyberLens handles more than phishing.
4. Explain the boundary: React interface → FastAPI privacy/rate-limit boundary → optional model assistance.
5. End on impact: calm, actionable security education instead of fear.

The project’s full guide in `docs/NO_COMPROMISE_GUIDE.md` adds deployment, verification, presentation, and future-scope detail.
