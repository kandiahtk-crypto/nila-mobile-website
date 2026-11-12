/* Search metadata only. Does not change catalogue loading, checkout or fulfilment. */
'use strict';
(()=>{
 const grid=document.querySelector('#planGrid');
 const canonical=document.querySelector('link[rel="canonical"]')?.href;
 const country=document.body.dataset.country;
 if(!grid||!canonical||!country)return;
 function refresh(){
  let node=document.querySelector('#live-plan-structured-data');
  const rows=typeof live!=='undefined'&&live&&typeof plans!=='undefined'&&typeof selected!=='undefined'&&selected===country
   ?plans.filter(p=>p.country===country&&typeof p.packageCode==='string'&&Number.isInteger(Number(p.amount))&&Number(p.amount)>0):[];
  if(!rows.length){node?.remove();return;}
  if(!node){node=document.createElement('script');node.id='live-plan-structured-data';node.type='application/ld+json';document.head.append(node);}
  node.textContent=JSON.stringify({'@context':'https://schema.org','@type':'ItemList',name:country+' travel eSIM plans',itemListElement:rows.map((p,index)=>({'@type':'ListItem',position:index+1,item:{'@type':'Product',name:country+' '+(p.data||'travel data')+' eSIM',sku:p.packageCode,brand:{'@type':'Brand',name:'Nila Mobile'},description:[p.data,p.duration,p.network,p.speed].filter(Boolean).join(' · '),offers:{'@type':'Offer',price:(Number(p.amount)/100).toFixed(2),priceCurrency:'GBP',url:canonical,seller:{'@type':'Organization',name:'Nila Mobile'}}}}))});
 }
 new MutationObserver(refresh).observe(grid,{childList:true});refresh();
})();
