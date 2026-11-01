const SUPABASE_URL = "https://ocjoeevywucetraqauzs.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_bP0gL8Nj3RkMdq19GmAC2w_TFvsVgou";
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
async function initMagazine(){
 const peopleEl=document.querySelector("#professionalList"), servicesEl=document.querySelector("#serviceHighlights");
 try{
  const [{data:people,error:pErr},{data:services,error:sErr},{data:settings,error:setErr}] = await Promise.all([
   db.from("professionals").select("id,name,slug,bio,is_active,sort_order").eq("is_active",true).order("sort_order"),
   db.from("services").select("id,professional_id,name,description,is_active,sort_order").eq("is_active",true).order("sort_order").limit(5),
   db.from("site_settings").select("studio_instagram_url,whatsapp_phone").limit(1).maybeSingle()
  ]);
  if(pErr)throw pErr;if(sErr)throw sErr;if(setErr)throw setErr;
  peopleEl.innerHTML=people?.length?people.map(person=>'<li><strong>'+esc(person.name)+'</strong><span>'+esc(person.bio||"Conheça os serviços desta profissional.")+'</span><a class="professional-link" href="./profissional.html?perfil='+encodeURIComponent(person.slug)+'">Ver catálogo ↗</a></li>').join(""):'<li><strong>Nosso time</strong><span>As profissionais serão apresentadas em breve.</span></li>';
  servicesEl.innerHTML=services?.length?services.map(service=>'<li><strong>'+esc(service.name)+'</strong><span>'+esc(service.description||"Consulte detalhes e valores no catálogo da profissional.")+'</span></li>').join(""):'<li><strong>Catálogo em atualização</strong><span>Os serviços serão publicados assim que os cadastros forem concluídos.</span></li>';
  if(settings?.studio_instagram_url){document.querySelector("#instagramCta").href=settings.studio_instagram_url;document.querySelector("#studioInstagramText").textContent=settings.studio_instagram_url.replace(/^https?:\/\/(www\.)?instagram\.com\//,"@").replace(/\/$/,"");}
 }catch(error){console.error("Erro ao carregar revista:",error);peopleEl.innerHTML='<li><strong>Não foi possível carregar o time</strong><span>Atualize a página em instantes.</span></li>';servicesEl.innerHTML='<li><strong>Catálogo temporariamente indisponível</strong><span>Tente novamente mais tarde.</span></li>';}
}
initMagazine();