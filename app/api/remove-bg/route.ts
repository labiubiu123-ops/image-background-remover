import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const imageFile = formData.get('image') as File | null

    if (!imageFile) {
      return NextResponse.json({ error: 'No image provided', code: 'NO_IMAGE' }, { status: 400 })
    }

    if (imageFile.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10MB)', code: 'FILE_TOO_LARGE' }, { status: 413 })
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(imageFile.type)) {
      return NextResponse.json({ error: 'Invalid format. Only JPG, PNG, WebP allowed', code: 'INVALID_FORMAT' }, { status: 415 })
    }

    const apiKey = process.env.REMOVEBG_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured', code: 'CONFIG_ERROR' }, { status: 500 })
    }

    const removeBgForm = new FormData()
    removeBgForm.append('image_file', imageFile, imageFile.name)
    removeBgForm.append('size', 'auto')

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: { 'X-Api-Key': apiKey },
      body: removeBgForm,
    })

    if (!response.ok) {
      if (response.status === 402) {
        return NextResponse.json({ error: 'API quota exceeded', code: 'API_QUOTA_EXCEEDED' }, { status: 402 })
      }
      if (response.status === 403) {
        return NextResponse.json({ error: 'Invalid API key', code: 'INVALID_API_KEY' }, { status: 403 })
      }
      return NextResponse.json({ error: 'Remove.bg API error', code: 'API_ERROR' }, { status: 502 })
    }

    const resultBuffer = await response.arrayBuffer()
    
    return new NextResponse(resultBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
