
'use strict';
const landingCountry=document.body.dataset.country;
const API='https://nila-mobile-backend.kandiah-tk.workers.dev';
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const featured=[['Japan','🇯🇵','Asia','1493976040374-85c8e12f0c0e'],['Europe','🇪🇺','Regional','1502602898657-3e91760cbb34'],['United States','🇺🇸','Americas','1534430480872-3498386e7856'],['United Kingdom','🇬🇧','Europe','1513635269975-59663e0ac1ad'],['Thailand','🇹🇭','Asia','1507525428034-b723cf961d3e'],['United Arab Emirates','🇦🇪','Middle East','1512453979798-5ea266f8880c'],['France','🇫🇷','Europe','1502602898657-3e91760cbb34'],['Turkey','🇹🇷','Europe','1524231757912-21f4fe3a7200'],['Global','🌐','Regional','1488646953014-85cb44e25828'],['Spain','🇪🇸','Europe','1543783207-ec64e4d95325'],['Sri Lanka','🇱🇰','Asia','1586861635167-e5223aadc9fe'],['Singapore','🇸🇬','Asia','1525625293386-3f8f99389edd']];
const destinationAliases=new Map([
  ['China mainland',['🇨🇳','Asia',['mainland china']]],
  ['Hong Kong (China)',['🇭🇰','Asia',['hong kong']]],
  ['Macao (China)',['🇲🇴','Asia',['macau']]],
  ['United States',['🇺🇸','Americas',['usa','us','america']]],
  ['United Kingdom',['🇬🇧','Europe',['uk','great britain']]]
]);
const meta=name=>featured.find(f=>f[0]===name)||[name,...(destinationAliases.get(name)?.slice(0,2)??['🌍','Other']),null];
const image=m=>m[3]?`https://images.unsplash.com/photo-${m[3]}?auto=format&fit=crop&w=800&q=80`:'';
const destinationBatch=12;
let visibleDestinations=destinationBatch;
let countries=[],plans=[],region='Popular',currency='GBP',selected=null,buying=null,bag=[],live=false;
try{bag=JSON.parse(localStorage.getItem('nila-plan-bag-v1')||'[]');if(!Array.isArray(bag))bag=[];bag=bag.filter(x=>typeof x==='string').slice(0,30)}catch{}
const rates={GBP:1,USD:1.27,EUR:1.16};
const money=n=>new Intl.NumberFormat('en-GB',{style:'currency',currency}).format(Number(n)/100*rates[currency]);
function save(){try{localStorage.setItem('nila-plan-bag-v1',JSON.stringify(bag))}catch{}$('#count').textContent=bag.length}
function valid(p){return p&&typeof p.packageCode==='string'&&p.packageCode&&typeof p.country==='string'&&Number.isInteger(Number(p.amount))&&Number(p.amount)>0}
const countryCodes = 'AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW'.split(' ');
const countryNames = new Map();
if(typeof Intl.DisplayNames==='function'){
  const names=new Intl.DisplayNames(['en'],{type:'region'});
  for(const code of countryCodes) countryNames.set(names.of(code).toLowerCase(),code);
}
function destinationFlag(name,supplierFlag){
  const localFlag=meta(name)[1];
  if(localFlag!=='🌍') return localFlag;
  const code=countryNames.get(name.trim().toLowerCase());
  if(code) return String.fromCodePoint(...Array.from(code,letter=>0x1F1E6+letter.charCodeAt(0)-65));
  return typeof supplierFlag==='string'&&/^(?:[\u{1F1E6}-\u{1F1FF}]{2})$/u.test(supplierFlag.trim())?supplierFlag.trim():localFlag;
}
function setCountries(){const map=new Map();plans.forEach(p=>{if(!map.has(p.country))map.set(p.country,{name:p.country,flag:destinationFlag(p.country,p.flag),plans:[]});map.get(p.country).plans.push(p)});countries=[...map.values()].sort((a,b)=>{const ai=featured.findIndex(x=>x[0]===a.name),bi=featured.findIndex(x=>x[0]===b.name);return (ai<0?999:ai)-(bi<0?999:bi)||a.name.localeCompare(b.name)});if(!live)countries=featured.map(m=>({name:m[0],flag:m[1],plans:[]}))}
function searchRank(name,query){
  const normalized=name.toLowerCase();
  if(normalized===query) return 0;
  if(normalized.startsWith(query)) return 1;
  return 2;
}
function renderSearchResults(query,matches){
  const results=$('#searchResults');
  results.classList.toggle('hidden',!query);
  results.innerHTML=query?(matches.length?matches.map(country=>
    `<button type="button" data-country="${esc(country.name)}"><span>${esc(country.flag)} ${esc(country.name)}</span><span aria-hidden="true">→</span></button>`
  ).join(''):'<p role="status">No matching destinations.</p>'):'';
}
const normalizeDestination=name=>{const key=String(name).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'');return key==='srilankan'?'srilanka':key;};
const searchOnlyDestinations=new Set(['afghanistan','alandislands']);
function render(){const q=normalizeDestination($('#search').value);const list=countries.filter(c=>(q||!searchOnlyDestinations.has(normalizeDestination(c.name)))&&(normalizeDestination(c.name).includes(q)||meta(c.name)[2].toLowerCase().includes(q)||destinationAliases.get(c.name)?.[2].includes(q))&&(region==='All'||region==='Popular'&&featured.some(m=>m[0]===c.name)||meta(c.name)[2]===region));if(q)list.sort((a,b)=>searchRank(a.name,q)-searchRank(b.name,q));renderSearchResults(q,list);$('#destGrid').innerHTML=list.length?list.slice(0,visibleDestinations).map(c=>{const m=meta(c.name);return `<button class="destination${image(m)?'':' no-photo'}" data-country="${esc(c.name)}" aria-pressed="${selected===c.name}"><div class="image">${image(m)?`<img src="${image(m)}" alt="${esc(c.name)}" loading="lazy">`:esc(c.flag)}<span class="badge">${esc(c.flag)}</span></div><div class="info"><h3 data-flag="${esc(c.flag)}">${esc(c.name)}</h3><p>${c.plans.length?`From <strong>${money(Math.min(...c.plans.map(p=>Number(p.amount))))}</strong> · ${c.plans.length} plans`:'Explore travel data'}</p></div></button>`}).join(''):'<div class="empty">No destinations match your search and region.<br><button type="button" class="outline" id="resetDestinations" style="margin-top:12px">Show all destinations</button></div>';$('#showMore').classList.toggle('hidden',list.length<=visibleDestinations);$('#catalogueNote').textContent=live&&!list.length?'':live?`Showing ${Math.min(list.length,visibleDestinations)} of ${list.length} matching destinations. ${currency==='GBP'?'Prices shown in GBP.':'Indicative currency conversion only; checkout charges GBP.'}`:'Live prices will appear when the catalogue connection is available.';if(selected)renderPlans();renderBag()}
function choose(name,scroll=true){selected=name;render();const m=meta(name);if(image(m)){$('#heroImage').src=image(m);$('#heroImage').alt=name}$('#heroTitle').textContent=name;const c=countries.find(c=>c.name===name);$('#heroPrice').textContent=c?.plans.length?`From ${money(Math.min(...c.plans.map(p=>Number(p.amount))))}`:'Explore destination-specific data';if(scroll)$('#plans').scrollIntoView({block:'start'})}
function renderPlans(){const c=countries.find(c=>c.name===selected);if(!c)return;$('#plans').classList.remove('hidden');$('#planTitle').textContent=`${c.flag} ${c.name} plans`;$('#planGrid').innerHTML=c.plans.length?[...c.plans].sort((a,b)=>Number(a.amount)-Number(b.amount)).map(p=>`<article class="plan ${parseFloat(p.data)===20?'featured':''}"><div class="tag">${parseFloat(p.data)===20?'★ 20GB OPTION':'PREPAID TRAVEL DATA'}</div><h3>${esc(p.data||'Data plan')}</h3><p>Valid for ${esc(p.duration||'See package details')}</p><p>${esc(p.network||'Network details available from support')}<br>${esc(p.speed||'Speeds vary by network and location')}</p><div class="price">${money(p.amount)}</div><div class="actions"><button class="outline" data-save="${esc(p.packageCode)}" aria-label="Save ${esc(p.data)} ${esc(c.name)} plan">${bag.includes(p.packageCode)?'Saved ✓':'+ Bag'}</button><button class="primary" data-buy="${esc(p.packageCode)}">Buy now →</button></div></article>`).join(''):'<div class="empty">We couldn’t load current packages for this destination.<br><button class="outline" id="retryInline">Retry catalogue</button> <a class="primary" href="https://nilamobile.com/">Open existing Nila shop →</a></div>'}
function renderBag(){$('#count').textContent=bag.length;$('#bagItems').innerHTML=bag.length?bag.map(id=>{const p=plans.find(p=>p.packageCode===id);return `<article class="cart-item"><h3>${esc(p?.country||'Saved plan')}</h3><p>${p?`${esc(p.data)} · ${esc(p.duration)} · <b>${money(p.amount)}</b>`:'Reconnect to the catalogue to check this plan’s availability.'}</p><div class="actions">${p?`<button class="primary" data-buy="${esc(id)}">Checkout this eSIM →</button>`:''}<button class="outline" data-remove="${esc(id)}">Remove</button></div></article>`}).join(''):'<div class="empty">Your bag is empty.<br>Save a plan to compare it here.</div>'}
function openCheckout(id){const p=plans.find(p=>p.packageCode===id);if(!p)return;buying=p;$('#bag').close();$('#checkoutForm').reset();$('#checkoutStatus').textContent='';$('#pay').disabled=false;$('#pay').textContent='Continue to secure checkout →';$('#summary').innerHTML=`<div class="cart-item"><h3>${esc(p.country)}</h3><p>${esc(p.data)} · ${esc(p.duration)}</p><div class="price">${money(p.amount)}</div><p>Final charge: ${new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP'}).format(p.amount/100)}</p></div>`;$('#checkout').showModal()}
async function load(){$('#connection').classList.add('hidden');$('#destGrid').setAttribute('aria-busy','true');$('#catalogueNote').textContent='Loading destinations and prices…';if(landingCountry){$('#plans').classList.remove('hidden');$('#planTitle').textContent=landingCountry+' plans';$('#planGrid').innerHTML='<div class="empty" role="status">Loading live plans and prices…</div>';}try{const r=await fetch(`${API}/api/plans`,{signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error();const data=await r.json();plans=(Array.isArray(data.plans)?data.plans:[]).filter(valid);if(!plans.length)throw Error();live=true}catch{live=false;plans=[];$('#connection').classList.remove('hidden');$('#connection').innerHTML='The live catalogue could not be reached. <button class="outline" id="retry">Retry</button> or <a href="https://nilamobile.com/" style="text-decoration:underline">visit the existing Nila shop</a>.'}setCountries();
if(landingCountry){
  const destination=countries.find(country=>country.name===landingCountry);
  selected=destination?.name??null;
  if(!selected){
    $('#plans').classList.remove('hidden');
    $('#planTitle').textContent=landingCountry+' plans';
    $('#planGrid').innerHTML=live
      ? '<div class="empty">There are no plans listed for this destination right now. <a href="./">Browse all destinations</a>.</div>'
      : '<div class="empty">Live plans are temporarily unavailable. <button type="button" class="outline" id="retryInline">Retry catalogue</button></div>';
  }
}
render();$('#destGrid').removeAttribute('aria-busy')}
$('#checkoutForm').addEventListener('submit',async e=>{e.preventDefault();if(!buying||!$('#compatible').checked)return;$('#pay').disabled=true;$('#pay').textContent='Opening Stripe…';$('#checkoutStatus').textContent='';try{const r=await fetch(`${API}/api/checkout`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({packageCode:buying.packageCode}),signal:AbortSignal.timeout(20000)});const data=await r.json();if(!r.ok||!data.checkoutUrl)throw Error();const u=new URL(data.checkoutUrl);if(u.protocol!=='https:'||!['checkout.stripe.com','buy.stripe.com'].includes(u.hostname))throw Error();location.assign(u.href)}catch{$('#checkoutStatus').textContent='Secure checkout could not be opened. No payment was confirmed here. Please retry or use the existing shop at nilamobile.com.';$('#pay').disabled=false;$('#pay').textContent='Retry secure checkout →'}});
$('#quick').innerHTML=['Sri Lanka','Japan','United States','France'].map(n=>`<button class="chip" data-country="${esc(n)}">${meta(n)[1]} ${esc(n)}</button>`).join('');$('#filters').innerHTML=['All','Popular','Europe','Asia','Americas','Middle East','Regional','Other'].map(n=>`<button data-region="${n}" aria-pressed="${n===region}">${n}</button>`).join('');
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.close)$('#'+b.dataset.close).close();if(b.dataset.country){const c=countries.find(c=>c.name===b.dataset.country);if(c)choose(c.name);else{$('#search').value=b.dataset.country;region='All';render();$('#destinations').scrollIntoView()}}if(b.id==='resetDestinations'||b.dataset.region){const reset=b.id==='resetDestinations';region=reset?'All':b.dataset.region;
if(region==='All'||region==='Popular') {$('#search').value='';const dock=document.getElementById('dockDestination');if(dock)dock.value='';}
selected=null;
$('#plans').classList.add('hidden');
visibleDestinations=destinationBatch;document.querySelectorAll('[data-region]').forEach(x=>x.setAttribute('aria-pressed',x.dataset.region===region));render();if(reset)$('#filters [data-region=All]').focus()}if(b.dataset.save){if(!bag.includes(b.dataset.save)&&bag.length<30)bag.push(b.dataset.save);save();render();$('#bag').showModal()}if(b.dataset.remove){bag=bag.filter(x=>x!==b.dataset.remove);save();render()}if(b.dataset.buy)openCheckout(b.dataset.buy);if(b.id==='retry'||b.id==='retryInline')load()});
$('#showMore').addEventListener('click',()=>{
  const previousCount=visibleDestinations;
  visibleDestinations+=destinationBatch;
  render();
  $('#destGrid').children[previousCount]?.focus({preventScroll:true});
});
function searchDestinations(){
  region='All';
  selected=null;
  visibleDestinations=destinationBatch;
  $('#plans').classList.add('hidden');
  document.querySelectorAll('[data-region]').forEach(button=>button.setAttribute('aria-pressed',button.dataset.region===region));
  render();
}
$('#search').addEventListener('input',searchDestinations);
$('#searchForm').addEventListener('submit',event=>{
  event.preventDefault();
  searchDestinations();
  if($('#search').value.trim()) $('#search').blur();
  else $('#destinations').scrollIntoView();
});$('#currency').addEventListener('change',e=>{currency=e.target.value;render()});$('#cartOpen').onclick=()=>{renderBag();$('#bag').showModal()};document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close()}}));window.addEventListener('pageshow',()=>{$('#pay').disabled=false;$('#pay').textContent='Continue to secure checkout →'});$('#year').textContent=new Date().getFullYear();save();load();

