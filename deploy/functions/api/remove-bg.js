export async function onRequest(context) {
  if (context.request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    const formData = await context.request.formData()
    const imageFile = formData.get('image')

    if (!imageFile) {
      return new Response(JSON.stringify({ error: 'No image provided', code: 'NO_IMAGE' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    if (imageFile.size > 10 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: 'File too large', code: 'FILE_TOO_LARGE' }), {
        status: 413,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 使用硬编码的 API key（临时测试）
    const apiKey = 'kseoc3yMCQqrc9dLQZUWBupD'

    const removeBgForm = new FormData()
    removeBgForm.append('image_file', imageFile)
    removeBgForm.append('size', 'auto')

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: { 'X-Api-Key': apiKey },
      body: removeBgForm,
    })

    if (!response.ok) {
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'API quota exceeded', code: 'API_QUOTA_EXCEEDED' }), {
          status: 402,
          headers: { 'Content-Type': 'application/json' }
        })
      }
      if (response.status === 403) {
        return new Response(JSON.stringify({ error: 'Invalid API key', code: 'INVALID_API_KEY' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        })
      }
      return new Response(JSON.stringify({ error: 'Remove.bg API error', code: 'API_ERROR' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const resultBuffer = await response.arrayBuffer()
    
    return new Response(resultBuffer, {
      status: 200,
      headers: { 'Content-Type': 'image/png' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || 'Internal server error', code: 'INTERNAL_ERROR' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
