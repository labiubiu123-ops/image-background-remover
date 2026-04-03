const fs = require('fs');

// 创建一个测试图片（1x1 PNG）
const testImage = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');

const formData = new FormData();
formData.append('image_file', new Blob([testImage], { type: 'image/png' }), 'test.png');
formData.append('size', 'full');

fetch('https://api.remove.bg/v1.0/removebg', {
  method: 'POST',
  headers: { 'X-Api-Key': process.env.REMOVEBG_API_KEY },
  body: formData,
})
.then(r => {
  console.log('Status:', r.status);
  console.log('Headers:', Object.fromEntries(r.headers.entries()));
  return r.arrayBuffer();
})
.then(buf => {
  console.log('Response size:', buf.byteLength, 'bytes');
})
.catch(e => console.error('Error:', e.message));
