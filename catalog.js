// Capability declarations are trusted configuration, never inferred from remote IDs.
export const SEED_MODELS = Object.freeze([
  { id: 'openai/gpt-6.1-terra', vision: true, image: false, source: 'user-confirmed' },
  { id: 'openai/gpt-image-2', vision: false, image: true, source: 'user-confirmed' },
  { id: 'openai/gpt-image-2.5-flash', vision: false, image: true, source: 'user-confirmed' },
].map(Object.freeze));

const LIMIT = 1000;
const FAILURE = 'Model catalog refresh failed.';
const validId = (id) => typeof id === 'string' && id.length > 0
  && id.length <= 200 && !/\s|[\u0000-\u001f\u007f]/u.test(id);

function remoteIds(response) {
  let candidates;
  if (Array.isArray(response?.data)) candidates = response.data.map((model) => model?.id);
  else if (response?.models && typeof response.models === 'object' && !Array.isArray(response.models)) {
    candidates = Object.keys(response.models);
  } else throw new Error(FAILURE);
  const ids = new Set();
  for (const id of candidates) {
    if (validId(id)) ids.add(id);
  }
  if (!ids.size) throw new Error(FAILURE);
  return ids;
}

export function createCatalog({ models = SEED_MODELS, fetchModels, refreshHours = 24, now = Date.now } = {}) {
  const configured = new Map();
  for (const model of Array.isArray(models) ? models : []) {
    if (!validId(model?.id) || configured.has(model.id)) continue;
    configured.set(model.id, {
      id: model.id, vision: model.vision === true, image: model.image === true,
      source: 'user-confirmed', availability: 'unknown',
    });
    if (configured.size === LIMIT) break;
  }
  let table = [...configured.values()];
  let lastSuccess = null;
  let lastAttempt = null;
  let lastError = null;
  let inFlight = null;
  const interval = Number.isFinite(refreshHours) && refreshHours > 0
    ? refreshHours * 60 * 60 * 1000 : 0;

  function snapshot() {
    return { models: table.map((model) => ({ ...model })), lastSuccess, lastAttempt, lastError };
  }

  function select(capability, requested, defaultId) {
    if (capability !== 'vision' && capability !== 'image') throw new Error('Unsupported model capability.');
    const id = requested == null || requested === '' ? defaultId : requested;
    const model = table.find((item) => item.id === id);
    if (!model || model[capability] !== true || model.availability === 'missing') {
      throw new Error('Requested model is unavailable or does not support this capability.');
    }
    return { ...model };
  }

  function refresh(signal) {
    if (inFlight) return inFlight;
    lastAttempt = now();
    // Defer the callback so synchronous failures are handled like rejected requests.
    inFlight = Promise.resolve().then(() => fetchModels(signal)).then((response) => {
      const ids = remoteIds(response);
      const next = [];
      // Always reserve room for every configured entry, including missing ones.
      for (const model of configured.values()) {
        next.push({ ...model, availability: ids.has(model.id) ? 'available' : 'missing' });
      }
      // Remote metadata cannot change local capability declarations.
      for (const id of ids) {
        if (next.length >= LIMIT) break;
        if (configured.has(id)) continue;
        next.push({ id, vision: false, image: false, source: 'discovered', availability: 'available' });
      }
      table = next;
      lastSuccess = now();
      lastError = null;
    }).catch(() => {
      // Do not expose upstream errors, URLs, credentials, or response bodies.
      lastError = FAILURE;
    }).then(() => snapshot()).finally(() => { inFlight = null; });
    return inFlight;
  }

  function ensureFresh(signal) {
    if (inFlight) return inFlight;
    if (interval > 0 && (lastAttempt === null || now() - lastAttempt >= interval)) return refresh(signal);
    return Promise.resolve(snapshot());
  }

  return { snapshot, select, refresh, ensureFresh };
}
