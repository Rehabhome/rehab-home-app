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
    return { statusCode: 400, body: JSON.stringify({ error: 'Body invalido' }) };
  }

  const { to, paciente_nombre, tipo_informe, fecha, hora, profesional_nombre, campos, pdfBase64, pdfName, subject: subjectOverride } = payload;
  if (!to) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Falta email del paciente' }) };
  }

  const camposHtml = Array.isArray(campos) && campos.length
    ? campos
        .filter(c => c.value !== undefined && c.value !== null && String(c.value).trim() !== '')
        .map(c => `
          <tr>
            <td style="padding:8px 12px;background:#e6edf0;color:#64748b;font-weight:700;font-size:11px;text-transform:uppercase;width:38%;vertical-align:top;">${c.label}</td>
            <td style="padding:8px 12px;color:#1f2d3d;font-size:13px;white-space:pre-wrap;">${String(c.value).replace(/\n/g,'<br>')}</td>
          </tr>`).join('')
    : `<tr><td colspan="2" style="padding:8px 12px;color:#64748b;font-style:italic;">Sin contenido adicional</td></tr>`;

  const html = `
    <div style="font-family:Calibri,'Segoe UI',sans-serif;max-width:640px;margin:0 auto;">
      <div style="background:#1C869E;padding:20px 28px;border-radius:8px 8px 0 0;">
        <h1 style="color:#fff;margin:0;font-size:22px;">RehabHome</h1>
        <p style="color:rgba(255,255,255,.8);margin:4px 0 0;font-size:14px;">Documento Clinico</p>
      </div>
      <div style="background:#f5f9fb;padding:24px 28px;border:1px solid #e6edf0;border-top:none;border-radius:0 0 8px 8px;">
        <p style="color:#1f2d3d;font-size:15px;">Estimado/a <strong>${paciente_nombre || 'paciente'}</strong>,</p>
        <p style="color:#1f2d3d;margin-bottom:4px;">Se ha generado el siguiente documento clinico. El informe completo esta adjunto en PDF.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0 8px;">
          <tr><td style="padding:8px 12px;background:#1C869E;color:#fff;font-weight:700;font-size:12px;text-transform:uppercase;width:38%;">Tipo de informe</td><td style="padding:8px 12px;background:#1C869E;color:#fff;font-size:13px;">${tipo_informe || '-'}</td></tr>
          <tr><td style="padding:8px 12px;background:#e6edf0;color:#64748b;font-weight:700;font-size:11px;text-transform:uppercase;">Fecha</td><td style="padding:8px 12px;color:#1f2d3d;font-size:13px;">${fecha || '-'}</td></tr>
          <tr><td style="padding:8px 12px;background:#e6edf0;color:#64748b;font-weight:700;font-size:11px;text-transform:uppercase;">Profesional</td><td style="padding:8px 12px;color:#1f2d3d;font-size:13px;">${profesional_nombre || '-'}</td></tr>
        </table>
        <p style="color:#1C869E;font-weight:700;font-size:13px;margin:16px 0 4px;text-transform:uppercase;letter-spacing:.5px;">Contenido del informe</p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
          ${camposHtml}
        </table>
        <hr style="border:none;border-top:1px solid #e6edf0;margin:20px 0;">
        <p style="color:#64748b;font-size:12px;margin:0;">Para consultas, responda este correo.<br>Equipo <strong>RehabHome</strong> · rehabhome.cl</p>
      </div>
    </div>`;

  const brevoPayload = {
    sender: { name: 'RehabHome', email: 'coordinacionrehabhome@gmail.com' },
    to: [{ email: to, name: paciente_nombre || '' }],
    subject: subjectOverride || `atencion-${paciente_nombre}-${fecha || ''}${hora ? ' '+hora : ''}`.trim(),
    htmlContent: html,
  };
  if (pdfBase64) {
    brevoPayload.attachment = [{
      content: pdfBase64,
      name: pdfName || `informe-${tipo_informe}.pdf`,
    }];
  }

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': BREVO_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify(brevoPayload),
    });
    const data = await res.json();
    if (!res.ok) return { statusCode: res.status, body: JSON.stringify(data) };
    return { statusCode: 200, body: JSON.stringify({ ok: true, messageId: data.messageId }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
