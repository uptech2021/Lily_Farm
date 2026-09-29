import { createDocument, getDocument, queryCollection } from '../orders/_firestore.mjs';
import { json } from '../newsletters/_email.mjs';

const attempts=new Map(), emailPattern=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const clean=value=>String(value||'').trim().replace(/[<>]/g,'');

export default { async fetch(request) {
  if(request.method!=='POST')return json({error:'Method not allowed.'},405);
  const key=request.headers.get('x-forwarded-for')||'visitor',now=Date.now(),recent=(attempts.get(key)||[]).filter(t=>now-t<10*60*1000);
  if(recent.length>=3)return json({error:'Please wait before submitting another review.'},429);
  let body;try{body=await request.json()}catch{return json({error:'Invalid request.'},400)}
  if(body.website)return json({ok:true});
  const type=body.reviewType==='general'?'general':'product',name=clean(body.customerName),email=clean(body.customerEmail).toLowerCase(),text=clean(body.reviewText),rating=Number(body.rating),productId=clean(body.productId),productName=clean(body.productName);
  if(name.length<2||name.length>80||!emailPattern.test(email)||text.length<10||text.length>1500||!Number.isInteger(rating)||rating<1||rating>5)return json({error:'Please check your review and try again.'},400);
  let product=null;if(type==='product'){if(!productId)return json({error:'Please choose a product.'},400);product=await getDocument('products',productId);if(!product)return json({error:'That product is no longer available.'},400)}
  attempts.set(key,[...recent,now]);
  let verifiedPurchase=false,orderId=null,orderNumber=null,orderDate=null,paymentStatus=null,fulfilmentStatus=null,quantityPurchased=null;
  try{
    const orders=await queryCollection('orders',[['customerEmail','EQUAL',email]]);
    const match=orders.find(order=>order.status==='fulfilled'&&(order.items||[]).some(item=>item.productId===productId||item.productRef===`products/${productId}`));
    if(match){verifiedPurchase=true;orderId=match.orderId||match.id;orderNumber=match.orderNumber;orderDate=match.createdAt;paymentStatus=match.paymentStatus||(match.payment||{}).status;fulfilmentStatus=match.status;quantityPurchased=(match.items||[]).find(item=>item.productId===productId||item.productRef===`products/${productId}`)?.quantity||1}
  }catch(error){console.error('Review purchase verification unavailable:',error.message)}
  try{
    if(orderId){const duplicates=await queryCollection('reviews',[['orderId','EQUAL',orderId],['productId','EQUAL',productId]]);if(duplicates.length)return json({error:'A review for this product and order has already been submitted.'},409)}
    const review=await createDocument('reviews',{reviewType:type,customerName:name,customerEmail:email,productId:type==='product'?productId:null,productSlug:type==='product'?(product?.slug||''):null,productName:type==='product'?(product?.name||productName):null,productImage:type==='product'?(product?.image||''):null,orderId,orderNumber,orderDate,paymentStatus,fulfilmentStatus,quantityPurchased,rating,reviewText:text,status:'pending',featured:false,verifiedPurchase,adminReply:null,adminReplyAt:null,photos:[],createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});
    return json({ok:true,reviewId:review.id,status:'pending'});
  }catch(error){console.error('Review submission failed:',error.message);return json({error:'We could not submit your review right now. Please try again.'},503)}
} };
