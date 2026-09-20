const menu=document.querySelector('.menu');
const nav=document.querySelector('nav');
const checkout=document.querySelector('#checkout');

menu.addEventListener('click',()=>{
  const open=nav.classList.toggle('open');
  menu.setAttribute('aria-expanded',open);
});
nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>nav.classList.remove('open')));

function openLiveCheckout(){checkout.showModal()}
document.querySelector('.buy').addEventListener('click',openLiveCheckout);
document.querySelector('.close').addEventListener('click',()=>checkout.close());
checkout.addEventListener('click',e=>{if(e.target===checkout)checkout.close()});
document.querySelector('#pay').addEventListener('click',()=>{window.location.href='https://buy.stripe.com/dRm4gz9Hb1D16gbfA4g7e01'});
document.querySelector('#compatBtn').addEventListener('click',()=>alert('On iPhone, dial *#06#. If you see an EID number, your phone supports eSIM. Your device must also be network-unlocked.'));

const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible')}),{threshold:.12});
document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));

const catalogueSearch=document.querySelector('#catalogueSearch');
const catalogueType=document.querySelector('#catalogueType');
const catalogueData=document.querySelector('#catalogueData');
const catalogueGrid=document.querySelector('#catalogueGrid');
const catalogueCount=document.querySelector('#catalogueCount');
const catalogueMore=document.querySelector('#catalogueMore');
const featuredDestinations=['Sri Lanka','France','India','United States','Canada','United Kingdom','Japan','United Arab Emirates'];
let cataloguePlans=[];
let visiblePlans=12;

function escapeHtml(value=''){
  return String(value).replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'})[char]);
}

function flagFor(plan){
  const code=String(plan.coverage||'').trim();
  if(plan.type==='Single'&&/^[A-Z]{2}$/.test(code)){
    return String.fromCodePoint(...[...code].map(letter=>127397+letter.charCodeAt()));
  }
  return plan.type==='Single'?'📍':'🌍';
}

function dataLabel(plan){
  if(plan.dataType==='Daily Unlimited')return `${plan.gb} GB/day`;
  if(Number.isFinite(Number(plan.gb)))return `${Number(plan.gb)} GB`;
  return plan.dataType||'Data plan';
}

function matchesData(plan,filter){
  const gb=Number(plan.gb);
  if(filter==='all')return true;
  if(!Number.isFinite(gb))return false;
  if(filter==='small')return gb<=3;
  if(filter==='medium')return gb>=5&&gb<=10;
  return gb>=20;
}

function filteredPlans(){
  const query=catalogueSearch.value.trim().toLowerCase();
  const type=catalogueType.value;
  const data=catalogueData.value;
  return cataloguePlans.filter(plan=>{
    const searchable=`${plan.destination} ${plan.name} ${plan.coverage} ${plan.networks}`.toLowerCase();
    const typeMatch=type==='all'||(type==='Regional'?plan.type!=='Single':plan.type===type);
    return (!query||searchable.includes(query))&&typeMatch&&matchesData(plan,data);
  }).sort((a,b)=>{
    if(Boolean(a.live)!==Boolean(b.live))return a.live?-1:1;
    if(!query){
      const ai=featuredDestinations.indexOf(a.destination);
      const bi=featuredDestinations.indexOf(b.destination);
      const ar=ai===-1?999:ai;
      const br=bi===-1?999:bi;
      if(ar!==br)return ar-br;
    }
    return a.destination.localeCompare(b.destination)||Number(a.price)-Number(b.price);
  });
}

function planCard(plan){
  const live=Boolean(plan.live);
  const network=String(plan.networks||'Network details available').split(',')[0];
  return `<article class="catalogue-card${live?' live':''}">
    <div class="catalogue-card-top"><span class="catalogue-flag" aria-hidden="true">${flagFor(plan)}</span><span class="catalogue-tag">${live?'Live now':plan.type==='Single'?'Country plan':'Regional plan'}</span></div>
    <h3>${escapeHtml(plan.destination)}</h3>
    <p class="catalogue-plan-name">${escapeHtml(plan.name)}</p>
    <div class="catalogue-facts">
      <span><small>Data</small><b>${escapeHtml(dataLabel(plan))}</b></span>
      <span><small>Validity</small><b>${escapeHtml(plan.days)} days</b></span>
      <span><small>Speed</small><b>${escapeHtml(plan.speed||'Varies')}</b></span>
      <span><small>Network</small><b>${escapeHtml(network)}</b></span>
    </div>
    <div class="catalogue-card-bottom">
      <div class="catalogue-price"><small>${live?'Live price':'Indicative price'}</small><strong>£${Number(plan.price).toFixed(2)}</strong></div>
      <button class="catalogue-action" type="button" ${live?'data-live-plan="true"':'disabled'}>${live?'Choose plan':'Coming soon'}</button>
    </div>
  </article>`;
}

function renderCatalogue(){
  const plans=filteredPlans();
  const shown=plans.slice(0,visiblePlans);
  catalogueCount.textContent=`${plans.length.toLocaleString()} plan${plans.length===1?'':'s'} found`;
  catalogueGrid.innerHTML=shown.length?shown.map(planCard).join(''):'<p class="catalogue-error">No matching plans. Try another destination or filter.</p>';
  catalogueMore.hidden=shown.length>=plans.length;
  catalogueMore.textContent=`Show more plans (${plans.length-shown.length} remaining)`;
  catalogueGrid.querySelectorAll('[data-live-plan]').forEach(button=>button.addEventListener('click',openLiveCheckout));
}

function resetCatalogue(){visiblePlans=12;renderCatalogue()}
[catalogueSearch,catalogueType,catalogueData].forEach(control=>control.addEventListener('input',resetCatalogue));
catalogueMore.addEventListener('click',()=>{visiblePlans+=12;renderCatalogue()});

fetch('catalog.json')
  .then(response=>{if(!response.ok)throw new Error('Catalogue unavailable');return response.json()})
  .then(catalogue=>{cataloguePlans=Array.isArray(catalogue.plans)?catalogue.plans:[];renderCatalogue()})
  .catch(()=>{
    catalogueCount.textContent='Catalogue temporarily unavailable';
    catalogueGrid.innerHTML='<p class="catalogue-error">Please refresh the page or contact Nila Mobile support.</p>';
  });
