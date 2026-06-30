// Netlify Function: send-email
// Usa la API de Brevo (ex-Sendinblue) para enviar emails a pacientes.
// Configurar BREVO_API_KEY en Netlify → Site configuration → Environment variables.

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  if (!BREVO_API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'BREVO_API_KEY no configurada' }) };
  }

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Body inválido' }) };
  }

  const { to, paciente_nombre, tipo_informe, fecha, profesional_nombre } = payload;
  if (!to) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Falta email del paciente' }) };
  }

  const html = `
    <div style="font-family:Calibri,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#1C869E;padding:20px 28px;border-radius:8px 8px 0 0;">
        <h1 style="color:#fff;margin:0;font-size:22px;">RehabHome</h1>
        <p style="color:rgba(255,255,255,.8);margin:4px 0 0;font-size:14px;">Documento Clínico</p>
      </div>
      <div style="background:#f5f9fb;padding:24px 28px;border:1px solid #e6edf0;border-top:none;border-radius:0 0 8px 8px;">
        <p style="color:#1f2d3d;font-size:15px;">Estimado/a <strong>${paciente_nombre || 'paciente'}</strong>,</p>
        <p style="color:#1f2d3d;">Se ha generado el siguiente documento clínico para su registro:</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr><td style="padding:8px 12px;background:#e6edf0;color:#64748b;font-weight:700;font-size:12px;text-transform:uppercase;width:40%;">Tipo de informe</td><td style="padding:8px 12px;color:#1f2d3d;">${tipo_informe || '—'}</td></tr>
          <tr><td style="padding:8px 12px;background:#e6edf0;color:#64748b;font-weight:700;font-size:12px;text-transform:uppercase;">Fecha</td><td style="padding:8px 12px;color:#1f2d3d;">${fecha || '—'}</td></tr>
          <tr><td style="padding:8px 12px;background:#e6edf0;color:#64748b;font-weight:700;font-size:12px;text-transform:uppercase;">Profesional</td><td style="padding:8px 12px;color:#1f2d3d;">${profesional_nombre || '—'}</td></tr>
        </table>
        <p style="color:#64748b;font-size:13px;">Para consultas, responda este correo o comuníquese con nosotros.</p>
        <hr style="border:none;border-top:1px solid #e6edf0;margin:20px 0;">
        <p style="color:#64748b;font-size:12px;margin:0;">Equipo <strong>RehabHome</strong> · rehabhome.cl</p>
      </div>
    </div>`;

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'RehabHome', email: 'coordinacionrehabhome@gmail.com' },
        to: [{ email: to, name: paciente_nombre || '' }],
        subject: `Informe clínico — ${tipo_informe}`,
        htmlContent: html,
      }),
    });

    const data = await res.json();
    if (!res.ok) return { statusCode: res.status, body: JSON.stringify(data) };
    return { statusCode: 200, body: JSON.stringify({ ok: true, messageId: data.messageId }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
