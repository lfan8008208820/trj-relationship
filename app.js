const dimensions=['Emotional Safety','Trust','Reciprocity','Future Alignment','Autonomy'];
const questions=[
['Emotional Safety','When something is bothering you, what usually happens?',['We talk and usually understand each other','I choose my words carefully','I often keep it to myself','I have mostly stopped trying']],
['Trust','When your partner explains something that worried you, how do you usually feel afterward?',['Reassured','Mostly reassured, with some doubt','Still uncertain','More suspicious than before']],
['Reciprocity','When life gets busy, how balanced does the relationship feel?',['We both adjust','Usually balanced, but one of us carries more sometimes','I often carry more','I feel responsible for keeping everything together']],
['Future Alignment','When you imagine the next few years, how similar are your plans?',['Very similar','Mostly similar','Important differences are unresolved','I avoid thinking about it because our futures feel incompatible']],
['Autonomy','How free do you feel to make choices for yourself?',['Very free','Mostly free','I often consider their reaction first','I regularly shrink my choices to protect the relationship']],
['Emotional Safety','When you disagree, do you feel emotionally safe being fully honest?',['Yes','Usually','Not always','No']],
['Trust','Have you found yourself checking, testing, or looking for reassurance more than you used to?',['Rarely or never','Occasionally','Often','Constantly']],
['Reciprocity','Who usually initiates difficult conversations or repairs after conflict?',['Both of us','It varies','Usually me','Almost always me']],
['Future Alignment','Are you building toward the same kind of life?',['Yes','Mostly','I am not sure anymore','No']],
['Autonomy','Do you still recognize yourself inside this relationship?',['Yes, clearly','Mostly','Less than I used to','Not really']],
['Emotional Safety','What happens when you express a need?',['It is taken seriously','They try, even if imperfectly','I often have to repeat myself','I feel dismissed, guilty, or unreasonable']],
['Trust','If nothing changed for a year, how confident would you feel staying?',['Very confident','Mostly confident','Uncertain','I would feel trapped']],
['Reciprocity','Does your partner notice what needs doing without being managed?',['Usually','Sometimes','Rarely','Almost never']],
['Future Alignment','If you met your partner exactly as they are today, would you still choose this relationship?',['Yes','Probably','I honestly do not know','Probably not']],
['Autonomy','How often do you silence a preference to avoid tension?',['Rarely','Sometimes','Often','Very often']],
['Emotional Safety','Which sentence feels closest to the truth right now?',['We can face hard things together','We are disconnected but still reachable','I am tired of being the one who tries','I love them, but I no longer feel safe being fully myself']]
];
const weights=[0,1,2,3];
const PAYPAL_CLIENT_ID='BAAVm8_kFvgu_Fuc_XxQkqHFr_0ySwdmJGOQIVYxJ9nUuDH4ALV8KiCvkYyW8bw0zoynM-IHRLEjs_hdoA';
let answers=Array(questions.length).fill(null);let idx=0;let paypalRendered=false;
const $=id=>document.getElementById(id);
const screens=['landing','quiz','calculating','preview','report'];

function metaTrack(type,eventName,params={}){
  if(typeof window.fbq!=='function') return;
  const key=`trj_meta_${eventName}`;
  if(sessionStorage.getItem(key)==='1') return;
  window.fbq(type,eventName,params);
  sessionStorage.setItem(key,'1');
}
function trackStartQuiz(){metaTrack('trackCustom','StartQuiz',{content_name:'TRJ Relationship Check-In'});}
function trackCompleteQuiz(){metaTrack('trackCustom','CompleteQuiz',{content_name:'TRJ Relationship Check-In'});}
function trackInitiateCheckout(){metaTrack('track','InitiateCheckout',{value:6.99,currency:'USD',content_name:'TRJ Full Relationship Report',content_type:'product'});}
window.TRJTrackPurchase=function(orderId){
  if(typeof window.fbq!=='function') return;
  const key=orderId?`trj_purchase_${orderId}`:'trj_purchase_verified';
  if(localStorage.getItem(key)==='1') return;
  window.fbq('track','Purchase',{value:6.99,currency:'USD',content_name:'TRJ Full Relationship Report',content_type:'product',order_id:orderId||undefined});
  localStorage.setItem(key,'1');
};

function show(id){screens.forEach(s=>$(s).classList.toggle('active',s===id));window.scrollTo({top:0,behavior:'smooth'})}
function renderQ(){const q=questions[idx];$('questionCounter').textContent=`Question ${idx+1} of ${questions.length}`;$('progressPercent').textContent=`${Math.round(((idx+1)/questions.length)*100)}%`;$('progressBar').style.width=`${((idx+1)/questions.length)*100}%`;$('dimensionTag').textContent=q[0];$('questionText').textContent=q[1];$('answerList').innerHTML='';q[2].forEach((a,i)=>{const b=document.createElement('button');b.className='answer';b.textContent=a;b.onclick=()=>{answers[idx]=i;if(idx<questions.length-1){idx++;renderQ()}else finish()};$('answerList').appendChild(b)});$('backBtn').disabled=idx===0}
function score(){const raw=Object.fromEntries(dimensions.map(d=>[d,[]]));questions.forEach((q,i)=>raw[q[0]].push(weights[answers[i]??0]));const result={};dimensions.forEach(d=>{const arr=raw[d];const avg=arr.reduce((a,b)=>a+b,0)/(arr.length*3);result[d]=Math.round(avg*100)});return result}
function pattern(s){const sorted=Object.entries(s).sort((a,b)=>b[1]-a[1]);const [top,val]=sorted[0];if(val<30)return['Stable, With Room to Reconnect','Your answers suggest a relationship with a relatively solid base. The main opportunity may be deeper connection, clearer communication, or protecting what is already working.'];if(top==='Reciprocity')return['Carrying More Than Your Share','Your answers suggest the relationship may feel most difficult where responsibility, emotional labor, or repair has become uneven.'];if(top==='Autonomy')return['Staying Smaller Than Yourself','Your answers suggest that protecting the relationship may sometimes come at the cost of your own preferences, identity, or freedom.'];if(top==='Trust')return['Trust Under Strain','Your answers suggest uncertainty has started to compete with reassurance. The issue may be less about one event and more about whether reassurance still has the power to reassure you.'];if(top==='Future Alignment')return['Loving Each Other, Wanting Different Futures','Your answers suggest affection may still exist while confidence in the future is becoming harder to maintain.'];return['Emotionally Uncertain','Your answers suggest you may still care deeply about your partner while feeling less emotionally secure, less heard, or less certain about what staying is costing you.']}
function finish(){show('calculating');setTimeout(()=>{const s=score();const p=pattern(s);localStorage.setItem('trj_scores',JSON.stringify(s));localStorage.setItem('trj_pattern',JSON.stringify(p));renderPreview(s,p);show('preview');trackCompleteQuiz();window.dispatchEvent(new CustomEvent('TRJ_COMPLETE_QUIZ'))},700)}
function renderPreview(s,p){$('resultTitle').textContent=p[0];$('resultSummary').textContent=p[1];$('freeInsight').textContent='Your results point to where the relationship currently feels most strained. The full report looks at your strongest two patterns together, rather than treating one score as the whole story.';$('scoreGrid').innerHTML=dimensions.map(d=>`<div class="score-card"><div class="score-label">${d}</div><div class="score-value">${100-s[d]}</div></div>`).join('')}
function dimensionCopy(d){return {"Emotional Safety":"Your answers suggest that honesty may sometimes feel costly. Notice whether you edit yourself because you are being considerate—or because you are protecting yourself from the reaction.","Trust":"The central question may not be whether you can prove something is wrong. It may be whether reassurance still has the power to reassure you.","Reciprocity":"You may be doing more than your share of noticing, initiating, repairing, or carrying the emotional load. Look for whether your partner responds without needing to be managed.","Future Alignment":"Love can coexist with incompatible futures. The useful question is not only whether you love each other, but whether the life you are building still makes sense to both of you.","Autonomy":"Your relationship should influence your life without erasing your authorship of it. Pay attention to the decisions you would make differently if you were not anticipating someone else's disappointment."}[d]||''}
function fullReport(){const s=JSON.parse(localStorage.getItem('trj_scores')||'{}');const p=JSON.parse(localStorage.getItem('trj_pattern')||'[]');const sorted=Object.entries(s).sort((a,b)=>b[1]-a[1]);const secondary=sorted[1]?.[0]||'Another area';$('fullTitle').textContent=p[0]||'Your Relationship Pattern';$('fullIntro').textContent=p[1]||'';$('secondaryPattern').textContent=`Your secondary pattern appears in ${secondary}. When your top two areas show up together, they can reinforce each other and make the relationship feel more confusing than a single issue would.`;$('riskSignal').textContent=dimensionCopy(sorted[0]?.[0]);$('whatItMeans').textContent='This does not tell you whether to stay or leave. It shows where your answers contain the most tension, and where observable change would matter more than promises or intentions.';$('reflectionList').innerHTML=['If nothing changed for twelve months, what would become harder to ignore?','What are you asking your partner to understand that you may no longer be willing to explain repeatedly?','What part of yourself has grown stronger—or smaller—inside this relationship?','If fear were removed from the decision, what would you want to understand more clearly?','What concrete change would make you feel evidence of progress rather than hope for progress?'].map(x=>`<li>${x}</li>`).join('');$('conversationGuide').textContent='Choose one issue from your highest-strain dimension and describe it without accusation: what happens, how it affects you, and what observable change would help. The goal is not to win the conversation; it is to learn whether the relationship can respond to honesty.'}

function loadPayPalSdk(){
  return new Promise((resolve,reject)=>{
    if(window.paypal) return resolve(window.paypal);
    const existing=document.querySelector('script[data-trj-paypal]');
    if(existing){existing.addEventListener('load',()=>resolve(window.paypal));existing.addEventListener('error',reject);return;}
    const script=document.createElement('script');
    script.dataset.trjPaypal='1';
    script.src=`https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(PAYPAL_CLIENT_ID)}&currency=USD&intent=capture&components=buttons`;
    script.async=true;
    script.onload=()=>resolve(window.paypal);
    script.onerror=()=>reject(new Error('PayPal could not be loaded'));
    document.head.appendChild(script);
  });
}

async function renderPayPal(){
  if(paypalRendered) return;
  paypalRendered=true;
  $('unlockBtn').disabled=true;
  $('unlockBtn').textContent='Loading secure checkout…';
  $('payNote').textContent='Opening secure PayPal checkout…';
  try{
    const paypal=await loadPayPalSdk();
    $('unlockBtn').style.display='none';
    $('payNote').textContent='Choose PayPal below. Your report unlocks only after payment is confirmed.';
    await paypal.Buttons({
      style:{layout:'vertical',shape:'rect',label:'paypal'},
      createOrder:async()=>{
        const response=await fetch('/api/create-order',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
        const data=await response.json();
        if(!response.ok||!data.id) throw new Error(data.error||'Could not create order');
        return data.id;
      },
      onApprove:async data=>{
        $('payNote').textContent='Confirming your payment…';
        const response=await fetch('/api/capture-order',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({orderID:data.orderID})});
        const result=await response.json();
        if(!response.ok||!result.verified) throw new Error(result.error||'Payment verification failed');
        localStorage.setItem('trj_paid_order',result.orderID);
        window.TRJTrackPurchase(result.orderID);
        fullReport();
        show('report');
      },
      onCancel:()=>{$('payNote').textContent='Checkout was canceled. You have not been charged.';},
      onError:error=>{console.error('PayPal checkout error',error);$('payNote').textContent='We could not complete checkout. Please try again.';}
    }).render('#paypal-button-container');
  }catch(error){
    console.error('PayPal initialization error',error);
    paypalRendered=false;
    $('unlockBtn').disabled=false;
    $('unlockBtn').textContent='Try Secure Checkout Again';
    $('payNote').textContent='PayPal could not be loaded. Please try again.';
  }
}

$('startBtn').onclick=()=>{trackStartQuiz();show('quiz');renderQ();window.dispatchEvent(new CustomEvent('TRJ_START_QUIZ'))};
$('backBtn').onclick=()=>{if(idx>0){idx--;renderQ()}};
$('unlockBtn').onclick=()=>{trackInitiateCheckout();window.dispatchEvent(new CustomEvent('TRJ_INITIATE_CHECKOUT'));renderPayPal()};
$('restartBtn').onclick=()=>{answers=Array(questions.length).fill(null);idx=0;paypalRendered=false;$('paypal-button-container').innerHTML='';$('unlockBtn').style.display='';$('unlockBtn').disabled=false;$('unlockBtn').textContent='Continue to Secure Checkout';$('payNote').textContent='Pay securely with PayPal. Your report unlocks only after payment is confirmed.';show('landing')};
