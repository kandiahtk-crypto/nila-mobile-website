const WORKER_URL='https://nila-mobile-backend.kandiah-tk.workers.dev';

const menu=document.querySelector('.menu');
const nav=document.querySelector('nav');
const checkout=document.querySelector('#checkout');

menu?.addEventListener('click',()=>{
  const open=nav.classList.toggle('open');
  menu.setAttribute('aria-expanded',open);
});

nav?.querySelectorAll('a').forEach(a=>
  a.addEventListener('click',()=>nav.classList.remove('open'))
);

function openLiveCheckout(){
  checkout?.showModal();
}

document.querySelector('.buy')
  ?.addEventListener('click',openLiveCheckout);

document.querySelector('.close')
  ?.addEventListener('click',()=>checkout?.close());

checkout?.addEventListener('click',e=>{
  if(e.target===checkout)checkout.close();
});

document.querySelector('#pay')
  ?.addEventListener('click',()=>{
    window.location.href=
      'https://buy.stripe.com/dRm4gz9Hb1D16gbfA4g7e01';
  });

document.querySelector('#compatBtn')
  ?.addEventListener('click',()=>{
    alert(
      'On iPhone, dial *#06#. If you see an EID number, '+
      'your phone supports eSIM. Your device must also be network-unlocked.'
    );
  });

const observer=new IntersectionObserver(
  entries=>entries.forEach(e=>{
    if(e.isIntersecting)e.target.classList.add('visible');
  }),
  {threshold:.12}
);

document.querySelectorAll('.reveal')
  .forEach(el=>observer.observe(el));

const catalogueSearch=document.querySelector('#catalogueSearch');
const catalogueType=document.querySelector('#catalogueType');
const catalogueData=document.querySelector('#catalogueData');
const catalogueGrid=document.querySelector('#catalogueGrid');
const catalogueCount=document.querySelector('#catalogueCount');
const catalogueMore=document.querySelector('#catalogueMore');

const featuredDestinations=[
  'Sri Lanka',
  'France',
  'India',
  'United States',
  'Canada',
  'United Kingdom',
  'Japan',
  'United Arab Emirates'
];

let cataloguePlans=[];
let visiblePlans=12;

function escapeHtml(value=''){
  return String(value).replace(
    /[&<>'"]/g,
    char=>({
      '&':'&amp;',
      '<':'&lt;',
      '>':'&gt;',
      "'":'&#39;',
      '"':'&quot;'
    })[char]
  );
}

function flagFor(plan){
  if(plan.flag)return plan.flag;

  const code=String(
    plan.countryCode||plan.coverage||''
  ).trim();

  if(
    (plan.type==='Single'||plan.checkoutType==='automatic') &&
    /^[A-Z]{2}$/.test(code)
  ){
    return String.fromCodePoint(
      ...[...code].map(
        letter=>127397+letter.charCodeAt()
      )
    );
  }

  return plan.type==='Single'?'📍':'🌍';
}

function dataLabel(plan){
  if(plan.data)return plan.data;

  if(plan.dataType==='Daily Unlimited'){
    return `${plan.gb} GB/day`;
  }

  if(Number.isFinite(Number(plan.gb))){
    return `${Number(plan.gb)} GB`;
  }

  return plan.dataType||'Data plan';
}

function durationDays(plan){
  if(plan.days)return `${plan.days} days`;
  return plan.duration||'See plan';
}

function matchesData(plan,filter){
  const gb=Number(
    plan.gb ??
    String(plan.data||'').match(/[\d.]+/)?.[0]
  );

  if(filter==='all')return true;
  if(!Number.isFinite(gb))return false;
  if(filter==='small')return gb<=3;
  if(filter==='medium')return gb>=5&&gb<=10;

  return gb>=20;
}

function filteredPlans(){
  const query=catalogueSearch.value
    .trim()
    .toLowerCase();

  const type=catalogueType.value;
  const data=catalogueData.value;

  return cataloguePlans
    .filter(plan=>{
      const searchable=`
        ${plan.destination||plan.country||''}
        ${plan.name||''}
        ${plan.coverage||''}
        ${plan.networks||plan.network||''}
      `.toLowerCase();

      const planType=
        plan.type||
        (plan.checkoutType==='automatic'?'Single':'');

      const typeMatch=
        type==='all'||
        (
          type==='Regional'
            ? planType!=='Single'
            : planType===type
        );

      return (
        (!query||searchable.includes(query)) &&
        typeMatch &&
        matchesData(plan,data)
      );
    })
    .sort((a,b)=>{
      if(Boolean(a.live)!==Boolean(b.live)){
        return a.live?-1:1;
      }

      if(!query){
        const ai=featuredDestinations.indexOf(a.destination);
        const bi=featuredDestinations.indexOf(b.destination);
        const ar=ai===-1?999:ai;
        const br=bi===-1?999:bi;

        if(ar!==br)return ar-br;
      }

      return (
        a.destination.localeCompare(b.destination) ||
        Number(a.price)-Number(b.price)
      );
    });
}

function planCard(plan){
  const live=Boolean(plan.live);

  const network=String(
    plan.networks||
    plan.network||
    'Network details available'
  ).split(',')[0];

  const action=live
    ? `
      <button
        class="catalogue-action"
        type="button"
        data-checkout="${escapeHtml(plan.checkoutType||'legacy')}"
        data-package-code="${escapeHtml(plan.packageCode||'')}"
      >
        Choose plan
      </button>
    `
    : `
      <button
        class="catalogue-action"
        type="button"
        disabled
      >
        Coming soon
      </button>
    `;

  return `
    <article class="catalogue-card${live?' live':''}">
      <div class="catalogue-card-top">
        <span class="catalogue-flag" aria-hidden="true">
          ${flagFor(plan)}
        </span>

        <span class="catalogue-tag">
          ${
            live
              ?'Live now'
              :plan.type==='Single'
                ?'Country plan'
                :'Regional plan'
          }
        </span>
      </div>

      <h3>${escapeHtml(plan.destination)}</h3>

      <p class="catalogue-plan-name">
        ${escapeHtml(plan.name)}
      </p>

      <div class="catalogue-facts">
        <span>
          <small>Data</small>
          <b>${escapeHtml(dataLabel(plan))}</b>
        </span>

        <span>
          <small>Validity</small>
          <b>${escapeHtml(durationDays(plan))}</b>
        </span>

        <span>
          <small>Speed</small>
          <b>${escapeHtml(plan.speed||'Up to 5G')}</b>
        </span>

        <span>
          <small>Network</small>
          <b>${escapeHtml(network)}</b>
        </span>
      </div>

      <div class="catalogue-card-bottom">
        <div class="catalogue-price">
          <small>
            ${live?'Live price':'Indicative price'}
          </small>

          <strong>
            £${Number(plan.price).toFixed(2)}
          </strong>
        </div>

        ${action}
      </div>
    </article>
  `;
}

async function startAutomaticCheckout(
  packageCode,
  button
){
  const original=button.textContent;

  button.disabled=true;
  button.textContent='Opening secure checkout…';

  try{
    const response=await fetch(
      `${WORKER_URL}/api/checkout`,
      {
        method:'POST',
        headers:{
          'Content-Type':'application/json'
        },
        body:JSON.stringify({
          packageCode
        })
      }
    );

    const result=await response.json();

    if(!response.ok||!result.checkoutUrl){
      throw new Error(
        result.error||'Checkout unavailable'
      );
    }

    window.location.href=result.checkoutUrl;
  }catch(error){
    alert(
      'Secure checkout is temporarily unavailable. '+
      'Please try again shortly.'
    );

    button.disabled=false;
    button.textContent=original;
  }
}

function renderCatalogue(){
  const plans=filteredPlans();
  const shown=plans.slice(0,visiblePlans);

  catalogueCount.textContent=
    `${plans.length.toLocaleString()} `+
    `plan${plans.length===1?'':'s'} found`;

  catalogueGrid.innerHTML=shown.length
    ?shown.map(planCard).join('')
    :`
      <p class="catalogue-error">
        No matching plans. Try another destination or filter.
      </p>
    `;

  catalogueMore.hidden=
    shown.length>=plans.length;

  catalogueMore.textContent=
    `Show more plans `+
    `(${plans.length-shown.length} remaining)`;

  catalogueGrid
    .querySelectorAll('[data-checkout]')
    .forEach(button=>
      button.addEventListener('click',()=>{
        if(button.dataset.checkout==='automatic'){
          startAutomaticCheckout(
            button.dataset.packageCode,
            button
          );
        }else{
          openLiveCheckout();
        }
      })
    );
}

function resetCatalogue(){
  visiblePlans=12;
  renderCatalogue();
}

[
  catalogueSearch,
  catalogueType,
  catalogueData
].forEach(control=>
  control?.addEventListener(
    'input',
    resetCatalogue
  )
);

catalogueMore?.addEventListener(
  'click',
  ()=>{
    visiblePlans+=12;
    renderCatalogue();
  }
);

function normaliseAutomaticPlan(plan){
  return {
    ...plan,
    destination:plan.country,
    type:'Single',
    coverage:plan.countryCode,
    networks:plan.network,
    days:Number(
      String(plan.duration||'')
        .match(/\d+/)?.[0]||30
    ),
    gb:Number(
      String(plan.data||'')
        .match(/[\d.]+/)?.[0]||0
    ),
    price:Number(plan.amount)/100,
    speed:/5G/i.test(plan.network||'')
      ?'5G'
      :'4G',
    live:true,
    checkoutType:'automatic'
  };
}

Promise.all([
  fetch('catalog.json')
    .then(response=>{
      if(!response.ok){
        throw new Error(
          'Catalogue unavailable'
        );
      }

      return response.json();
    }),

  fetch(`${WORKER_URL}/api/plans`)
    .then(response=>{
      if(!response.ok){
        throw new Error(
          'Live plans unavailable'
        );
      }

      return response.json();
    })
])
.then(([catalogue,liveCatalogue])=>{
  const basePlans=
    Array.isArray(catalogue.plans)
      ?catalogue.plans
      :[];

  const automaticPlans=
    Array.isArray(liveCatalogue.plans)
      ?liveCatalogue.plans.map(
        normaliseAutomaticPlan
      )
      :[];

  const automaticCodes=new Set(
    automaticPlans.map(
      plan=>plan.packageCode
    )
  );

  cataloguePlans=[
    ...automaticPlans,
    ...basePlans.filter(
      plan=>!automaticCodes.has(
        plan.packageCode
      )
    )
  ];

  renderCatalogue();
})
.catch(()=>{
  fetch('catalog.json')
    .then(response=>response.json())
    .then(catalogue=>{
      cataloguePlans=
        Array.isArray(catalogue.plans)
          ?catalogue.plans
          :[];

      renderCatalogue();
    })
    .catch(()=>{
      catalogueCount.textContent=
        'Catalogue temporarily unavailable';

      catalogueGrid.innerHTML=`
        <p class="catalogue-error">
          Please refresh the page or contact
          Nila Mobile support.
        </p>
      `;
    });
});
