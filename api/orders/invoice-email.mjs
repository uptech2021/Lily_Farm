import { fromHeader, isAdmin, json, transporter } from '../newsletters/_email.mjs';
import { getDocument, getSettings, updateDocument } from './_firestore.mjs';
import { generateInvoicePdf, invoiceEmailHtml, orderNotificationEmailHtml } from './_invoice.mjs';

export default {
  async fetch(request) {
    if (request.method !== 'POST') return json({error:'Method not allowed'},405);
    let orderId='';
    try {
      const body=await request.json(); orderId=String(body.orderId||''); const token=String(body.token||''); const resend=body.resend===true; const admin=isAdmin(request);
      const order=await getDocument('orders',orderId); if(!order) return json({error:'Order not found'},404);
      if(!admin&&(!token||token!==order.invoiceAccessToken)) return json({error:'Not authorized'},403);
      if(!admin&&order.invoiceEmail&&order.invoiceEmail.status==='sent') return json({status:'sent',alreadySent:true,recipient:order.customerEmail,ownerNotification:order.ownerNotification&&order.ownerNotification.status});
      if(!admin&&order.invoiceEmail&&order.invoiceEmail.status==='sending') return json({status:'pending',alreadySending:true,recipient:order.customerEmail},202);
      if(resend&&!admin) return json({error:'Admin authorization required'},403);
      const recipient=order.customerEmail||(order.customer&&order.customer.email);if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient||'')) return json({error:'Order has no valid customer email'},400);
      await updateDocument('orders',orderId,{'invoiceEmail.status':'sending','invoiceEmail.recipient':recipient,'invoiceEmail.errorCode':null});
      const settings=order.settingsSnapshot || await getSettings();const {buffer,data}=generateInvoicePdf(order,settings);const from=fromHeader();const mailer=transporter();
      const attachment={filename:`Rishis-Lily-Farm-${data.orderNumber}.pdf`,content:buffer,contentType:'application/pdf'};
      await mailer.sendMail({from,to:recipient,subject:`Order Confirmation — Rishi's Lily Farm #${data.orderNumber}`,html:invoiceEmailHtml(data),attachments:[attachment]});
      await updateDocument('orders',orderId,{'invoiceEmail.status':'sent','invoiceEmail.recipient':recipient,'invoiceEmail.sentAt':new Date().toISOString(),'invoiceEmail.errorCode':null});

      const ownerRecipient=String(process.env.ORDER_NOTIFICATION_EMAIL||settings.orderNotificationEmail||settings.email||process.env.ADMIN_EMAIL||from.address||'').trim();
      let ownerNotification='skipped';
      if(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerRecipient)&&ownerRecipient.toLowerCase()!==recipient.toLowerCase()){
        try{
          await mailer.sendMail({from,to:ownerRecipient,replyTo:recipient,subject:`New Order Placed — #${data.orderNumber} — ${data.customer.name}`,html:orderNotificationEmailHtml(data),attachments:[attachment]});
          ownerNotification='sent';
          await updateDocument('orders',orderId,{'ownerNotification.status':'sent','ownerNotification.recipient':ownerRecipient,'ownerNotification.sentAt':new Date().toISOString(),'ownerNotification.errorCode':null});
        }catch{
          ownerNotification='failed';
          try{await updateDocument('orders',orderId,{'ownerNotification.status':'failed','ownerNotification.recipient':ownerRecipient,'ownerNotification.errorCode':'DELIVERY_FAILED'})}catch{}
        }
      }
      return json({status:'sent',recipient,ownerNotification});
    } catch(error) {
      if(orderId){try{await updateDocument('orders',orderId,{'invoiceEmail.status':'failed','invoiceEmail.errorCode':error&&error.message&&error.message.startsWith('Email is not configured')?'EMAIL_NOT_CONFIGURED':'DELIVERY_FAILED'})}catch{}}
      return json({error:'Invoice email could not be sent',code:error&&error.message&&error.message.startsWith('Email is not configured')?'EMAIL_NOT_CONFIGURED':'DELIVERY_FAILED'},503);
    }
  }
};
