export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const formData = await request.formData();

    // Honeypot check
    if (formData.get('botcheck')) {
      return Response.redirect('https://pedromarco.es/es/gracias', 303);
    }

    const nombre = formData.get('nombre') || '';
    const email = formData.get('email') || '';
    const telefono = formData.get('telefono') || '';
    const titulo = formData.get('titulo_obra') || '';
    const anio = formData.get('anio_obra') || '';
    const dimensiones = formData.get('dimensiones_obra') || '';
    const historia = formData.get('historia') || '';

    // Handle file attachment
    const file = formData.get('attachment');
    let attachments = [];
    if (file && file.size > 0) {
      const buffer = await file.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );
      attachments.push({
        filename: file.name || 'imagen.jpg',
        content: base64,
        type: file.type || 'image/jpeg',
      });
    }

    // Build email HTML
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #92400e;">🎨 Nueva colaboración — Obra de Pedro Marco</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px; font-weight: bold; color: #666;">Nombre</td><td style="padding: 8px;">${escapeHtml(nombre)}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold; color: #666;">Email</td><td style="padding: 8px;"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td></tr>
          ${telefono ? `<tr><td style="padding: 8px; font-weight: bold; color: #666;">Teléfono</td><td style="padding: 8px;">${escapeHtml(telefono)}</td></tr>` : ''}
          ${titulo ? `<tr><td style="padding: 8px; font-weight: bold; color: #666;">Título obra</td><td style="padding: 8px;">${escapeHtml(titulo)}</td></tr>` : ''}
          ${anio ? `<tr><td style="padding: 8px; font-weight: bold; color: #666;">Año</td><td style="padding: 8px;">${escapeHtml(anio)}</td></tr>` : ''}
          ${dimensiones ? `<tr><td style="padding: 8px; font-weight: bold; color: #666;">Dimensiones</td><td style="padding: 8px;">${escapeHtml(dimensiones)}</td></tr>` : ''}
        </table>
        ${historia ? `<div style="margin-top: 16px; padding: 12px; background: #fef3c7; border-radius: 8px;"><strong>Historia:</strong><br>${escapeHtml(historia)}</div>` : ''}
        ${file && file.size > 0 ? `<p style="margin-top: 16px; color: #666;">📎 Imagen adjunta: ${escapeHtml(file.name)} (${(file.size / 1024 / 1024).toFixed(1)} MB)</p>` : ''}
      </div>
    `;

    // Send via Resend API
    const resendPayload = {
      from: 'Pedro Marco Web <web@send.pedromarco.es>',
      to: ['pedromarco@pedromarco.es'],
      reply_to: email,
      subject: `🎨 Nueva colaboración — ${nombre}`,
      html: html,
    };

    if (attachments.length > 0) {
      resendPayload.attachments = attachments;
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(resendPayload),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Resend error:', err);
      return new Response('Error enviando el email', { status: 500 });
    }

    return Response.redirect('https://pedromarco.es/es/gracias', 303);
  } catch (e) {
    console.error('Contact form error:', e);
    return new Response('Error procesando el formulario', { status: 500 });
  }
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
