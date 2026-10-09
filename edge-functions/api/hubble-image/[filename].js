const NASA_IMAGE_BASE_URL =
  'https://science.nasa.gov/specials/apps/what-did-hubble-see-on-your-birthday/images/'

const IMAGE_FILENAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*\.jpg$/

function errorResponse(status, message) {
  return new Response(message, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'text/plain; charset=utf-8',
    },
  })
}

export async function onRequestGet({ request, params, waitUntil }) {
  const imageFile = params?.filename

  if (
    typeof imageFile !== 'string' ||
    !IMAGE_FILENAME_PATTERN.test(imageFile) ||
    imageFile.includes('..')
  ) {
    return errorResponse(404, 'Image not found')
  }

  const cache = caches.default
  const cacheKey = new Request(
    `${new URL(request.url).origin}/api/hubble-image/${encodeURIComponent(imageFile)}`,
  )

  try {
    const cachedResponse = await cache.match(cacheKey)

    if (cachedResponse) {
      return cachedResponse
    }
  } catch {
    // EdgeOne's Cache API can throw when an entry has expired. Remove it and
    // fetch a fresh copy from NASA below.
    await cache.delete(cacheKey).catch(() => false)
  }

  let nasaResponse

  try {
    nasaResponse = await fetch(`${NASA_IMAGE_BASE_URL}${encodeURIComponent(imageFile)}`)
  } catch {
    return errorResponse(502, 'Unable to reach NASA image server')
  }

  const contentType = nasaResponse.headers.get('content-type') ?? ''

  if (!nasaResponse.ok || !contentType.toLowerCase().startsWith('image/')) {
    return errorResponse(nasaResponse.status === 404 ? 404 : 502, 'Image unavailable')
  }

  // Keep NASA's response headers intact so EdgeOne can apply the origin or
  // default cache policy; no custom cache duration is added here.
  const cacheWrite = cache.put(cacheKey, nasaResponse.clone()).catch(() => undefined)

  if (typeof waitUntil === 'function') {
    waitUntil(cacheWrite)
  } else {
    await cacheWrite
  }

  return nasaResponse
}
