import { fromHeader, json, transporter } from '../newsletters/_email.mjs';
import { createDocument, getSettings } from '../orders/_firestore.mjs';

const attempts = new Map();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const clean = value => String(value || '').trim().replace(/[<>]/g, '');
const html = value => String(value || '').replace(/[&<>"']/g, ch => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[ch]));

export default { async fetch(request) {
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);
  const key = request.headers.get('x-forwarded-for') || 'visitor', now = Date.now();
  const recent = (attempts.get(key) || []).filter(time => now - time < 10 * 60 * 1000);
  if (recent.length >= 3) return json({ error: 'Please wait before sending another message.' }, 429);
  let body; try { body = await request.json(); } catch { return json({ error: 'Invalid request.' }, 400); }
  if (body.website) return json({ ok: true, confirmationSent: false });
  const name=clean(body.name), email=clean(body.email).toLowerCase(), phone=clean(body.phone), subject=clean(body.subject), message=clean(body.message);
  if (name.length<2||name.length>100||!emailPattern.test(email)||email.length>160||phone.length>40||subject.length>120||message.length<10||message.length>3000) return json({ error: 'Please check the form and try again.' }, 400);
  attempts.set(key, [...recent, now]);
  const settings = await getSettings();
  const recipient = settings.notificationRecipients?.contact || settings.contactRecipient || settings.email || 'darren.kowlessar6@gmail.com';
  const phoneText = settings.phone || '+1 (868) 710-4296';
  let record;
  try { record = await createDocument('contactMessages',{name,email,phone,subject,message,status:'new',createdAt:new Date().toISOString()}); } catch (error) { console.error('Contact backup storage failed:', error.message); }
  const transport=transporter(), brand=`<div style="font-family:Arial,sans-serif;color:#183b2a;max-width:640px;margin:auto"><div style="padding:24px;background:#174d35;color:white"><b style="font-size:20px">Rishi's Lily Farm</b><div style="color:#d9eadf;margin-top:4px">Rare blooms, grown in Trinidad</div></div>`;
  try {
    if(settings.notificationToggles?.contactAdmin===false) throw new Error('Contact notifications are disabled in Admin Settings.');
    await transport.sendMail({from:fromHeader(),to:recipient,replyTo:{name,email},subject:`New Website Enquiry — Rishi's Lily Farm${subject?' · '+subject:''}`,html:`${brand}<div style="padding:28px;background:#fffdf7"><h1 style="font:28px Georgia;color:#174d35">New Customer Enquiry</h1><p><b>Customer</b><br>${html(name)}<br>${html(email)}<br>${html(phone||'No phone supplied')}</p><p><b>Message</b></p><div style="padding:18px;background:#f2f8f3;border-left:4px solid #3aaa68;white-space:pre-wrap">${html(message)}</div><p style="color:#68786e;font-size:13px">Submitted ${new Date().toLocaleString('en-TT')}</p></div></div>`});
  } catch (error) { console.error('Contact notification failed:', error.message); return json({ error:'We could not send your message right now. Please try again.' },503); }
  let confirmationSent=settings.notificationToggles?.contactConfirmation!==false;
  try {
    if(!confirmationSent) throw new Error('Customer confirmations are disabled.');
    await transport.sendMail({from:fromHeader(),to:email,subject:'We received your message 🌱 | Rishi\'s Lily Farm',html:`${brand}<div style="padding:28px;background:#fffdf7"><h1 style="font:30px Georgia;color:#174d35">Thanks for reaching out!</h1><p>Hi ${html(name.split(/\s+/)[0])},</p><p>We've received your message and a member of our team will get back to you as soon as possible.</p><div style="padding:18px;background:#f2f8f3;border-radius:10px"><b>Your message</b><p style="white-space:pre-wrap">“${html(message)}”</p></div><p>Need help in the meantime? <a href="${new URL('/products.html',request.url)}" style="color:#247b4d">Browse our plants</a> or <a href="${new URL('/faq.html',request.url)}" style="color:#247b4d">visit our FAQ</a>.</p><p>Rishi's Lily Farm<br>${html(phoneText)}<br>${html(recipient)}</p></div></div>`});
  } catch (error) { confirmationSent=false; console.error('Contact confirmation failed:', error.message); }
  return json({ok:true,confirmationSent,contactId:record?.id||null,recipient});
} };
