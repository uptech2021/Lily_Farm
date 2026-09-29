import { isAdmin } from '../newsletters/_email.mjs';
import { getDocument, getSettings } from './_firestore.mjs';
import { generateInvoicePdf } from './_invoice.mjs';

export default async function handler(request) {
  if (request.method !== 'GET') return new Response('Method not allowed', { status: 405 });
  try {
    const { searchParams } = new URL(request.url); const orderId=searchParams.get('orderId')||''; const token=searchParams.get('token')||'';
    const order=await getDocument('orders',orderId); if(!order) return new Response('Invoice not found',{status:404});
    if(!isAdmin(request)&&(!token||token!==order.invoiceAccessToken)) return new Response('Not authorized',{status:403});
    const {buffer,data}=generateInvoicePdf(order,await getSettings());
    return new Response(buffer,{status:200,headers:{'content-type':'application/pdf','content-disposition':`attachment; filename="Rishis-Lily-Farm-${data.orderNumber}.pdf"`,'cache-control':'private, no-store'}});
  } catch { return new Response('Invoice could not be generated',{status:500}); }
}
