const PRICE='6.99';
const CURRENCY='USD';

function paypalBase(){
  return process.env.PAYPAL_ENV==='live'?'https://api-m.paypal.com':'https://api-m.sandbox.paypal.com';
}

async function getAccessToken(){
  const clientId=process.env.PAYPAL_CLIENT_ID;
  const secret=process.env.PAYPAL_CLIENT_SECRET;
  if(!clientId||!secret) throw new Error('PayPal credentials are not configured');
  const auth=Buffer.from(`${clientId}:${secret}`).toString('base64');
  const response=await fetch(`${paypalBase()}/v1/oauth2/token`,{
    method:'POST',
    headers:{
      Authorization:`Basic ${auth}`,
      'Content-Type':'application/x-www-form-urlencoded'
    },
    body:'grant_type=client_credentials'
  });
  const data=await response.json();
  if(!response.ok||!data.access_token) throw new Error(data.error_description||'Unable to authenticate with PayPal');
  return data.access_token;
}

export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  const orderID=req.body?.orderID;
  if(!orderID||typeof orderID!=='string') return res.status(400).json({error:'Missing order ID'});

  try{
    const token=await getAccessToken();
    const response=await fetch(`${paypalBase()}/v2/checkout/orders/${encodeURIComponent(orderID)}/capture`,{
      method:'POST',
      headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'}
    });
    const data=await response.json();
    if(!response.ok){
      console.error('PayPal capture error',data);
      return res.status(response.status||500).json({error:'Unable to capture PayPal order'});
    }

    const capture=data.purchase_units?.[0]?.payments?.captures?.[0];
    const verified=data.status==='COMPLETED'&&capture?.status==='COMPLETED'&&capture?.amount?.currency_code===CURRENCY&&capture?.amount?.value===PRICE;
    if(!verified){
      console.error('PayPal capture verification failed',{orderID,status:data.status,captureStatus:capture?.status,amount:capture?.amount});
      return res.status(400).json({error:'Payment could not be verified'});
    }

    return res.status(200).json({verified:true,orderID:data.id,captureID:capture.id,status:'COMPLETED',value:PRICE,currency:CURRENCY});
  }catch(error){
    console.error('PayPal capture exception',error);
    return res.status(500).json({error:'Unable to verify PayPal payment'});
  }
}
