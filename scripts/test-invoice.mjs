import assert from 'node:assert/strict';
import { generateInvoicePdf, invoiceData, invoiceEmailHtml, orderNotificationEmailHtml } from '../api/orders/_invoice.mjs';

const order={id:'test-order',orderNumber:'TT-2026-TEST',createdAt:'2026-09-28T14:30:00.000Z',customerName:'Aaliyah Mohammed-Williams',customerEmail:'customer@example.com',customerPhone:'(868) 555-0199',items:[{productName:'Dark Purple Day Bloomer - Premium Mature Plant',category:'Lily',quantity:2,baseUnitPrice:150,discountRate:12,unitPrice:132,lineTotal:264},{productName:'Amaryllis',category:'Exotic',quantity:1,baseUnitPrice:300,discountRate:0,unitPrice:300,lineTotal:300}],subtotalBeforeDiscount:600,subtotal:564,discount:36,deliveryFee:60,total:624,deliveryOption:'delivery',delivery:{method:'delivery',address:'123 A Very Long Botanical Garden Drive, Apartment 12B',city:'Tunapuna',region:'Central Trinidad'},paymentMethod:'bank_transfer',paymentStatus:'awaiting_payment'};
const settings={storeName:"Rishi's Lily Farm",phone:'(868) 710-4296',email:'darren.kowlessar6@gmail.com',paymentInstructions:'Use the order number as your transfer reference.',paymentProofEmail:'darren.kowlessar6@gmail.com'};
const data=invoiceData(order,settings);const generated=generateInvoicePdf(order,settings);const html=invoiceEmailHtml(data);
const ownerHtml=orderNotificationEmailHtml(data);
assert.equal(data.total,624);assert.equal(data.savings,36);assert.ok(generated.buffer.subarray(0,8).toString().startsWith('%PDF-1.4'));assert.ok(generated.buffer.length>2500);assert.match(html,/customer@example\.com|Thank you for your order/);assert.match(html,/TTD \$624\.00/);
assert.match(html,/Awaiting bank transfer/);assert.match(html,/TT-2026-TEST/);assert.match(generated.buffer.toString('latin1'),/Order Invoice #TT-2026-TEST/);
assert.match(ownerHtml,/New order placed/);assert.match(ownerHtml,/Aaliyah Mohammed-Williams/);assert.match(ownerHtml,/TTD \$624\.00/);
const largeOrder={...order,orderNumber:'TT-2026-MULTIPAGE',items:Array.from({length:25},(_,index)=>({...order.items[0],productName:`Botanical Plant ${index+1}`,quantity:1,lineTotal:132})),subtotalBeforeDiscount:3750,subtotal:3300,discount:450,deliveryFee:0,total:3300};
const largePdf=generateInvoicePdf(largeOrder,settings).buffer.toString('latin1');assert.match(largePdf,/\/Count 3/);assert.match(largePdf,/Page 3 of 3/);
if(process.argv[2]){const{writeFile}=await import('node:fs/promises');await writeFile(process.argv[2],generated.buffer)}
console.log(`Invoice checks passed (${generated.buffer.length} bytes)`);
