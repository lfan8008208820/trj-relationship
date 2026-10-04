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
  try{
    const token=await getAccessToken();
    const response=await fetch(`${paypalBase()}/v2/checkout/orders`,{
      method:'POST',
      headers:{
        Authorization:`Bearer ${token}`,
        'Content-Type':'application/json',
        'PayPal-Request-Id':`trj-${Date.now()}-${Math.random().toString(36).slice(2,10)}`
      },
      body:JSON.stringify({
        intent:'CAPTURE',
        purchase_units:[{
          reference_id:'TRJ_RELATIONSHIP_REPORT',
          description:'The Relationship Journal — Full Relationship Report',
          amount:{currency_code:CURRENCY,value:PRICE}
        }],
        payment_source:undefined,
        application_context:{
          shipping_preference:'NO_SHIPPING',
          user_action:'PAY_NOW',
          brand_name:'The Relationship Journal'
        }
      })
    });
    const data=await response.json();
    if(!response.ok||!data.id){
      console.error('PayPal create order error',data);
      return res.status(response.status||500).json({error:'Unable to create PayPal order'});
    }
    return res.status(200).json({id:data.id});
  }catch(error){
    console.error('PayPal create order exception',error);
    return res.status(500).json({error:'Unable to create PayPal order'});
  }
}
