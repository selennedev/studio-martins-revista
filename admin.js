const SUPABASE_URL = "https://ocjoeevywucetraqauzs.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_bP0gL8Nj3RkMdq19GmAC2w_TFvsVgou";
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
const $ = s => document.querySelector(s);
const say = (id,msg) => { $(id).textContent = msg || ""; };
let professionals = [], categories = [], services = [];
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function options(items, selected){return items.map(x=>'<option value="'+esc(x.id)+'" '+(x.id===selected?'selected':'')+'>'+esc(x.name)+'</option>').join("");}
async function loadAll(){
 const [p,c,s,settings] = await Promise.all([
  db.from("professionals").select("*").order("sort_order"),
  db.from("service_categories").select("*").order("sort_order"),
  db.from("services").select("*").order("sort_order"),
  db.from("site_settings").select("*").limit(1).maybeSingle()
 ]);
 for(const r of [p,c,s,settings]) if(r.error) throw r.error;
 professionals=p.data||[];categories=c.data||[];services=s.data||[];
 $("#professionalSelect").innerHTML=options(professionals);
 $("#categoryProfessional").innerHTML=options(professionals);
 $("#serviceProfessional").innerHTML=options(professionals);
 $("#professionalSelect").onchange = fillProfessional;
 $("#serviceProfessional").onchange = fillCategories;
 fillProfessional();fillCategories();
 $("#professionalsList").innerHTML=professionals.map(x=>'<div class="admin-item"><span>'+esc(x.name)+' · '+(x.is_active?'Ativa':'Inativa')+'</span><button data-prof="'+esc(x.id)+'">Editar</button></div>').join("");
 $("#categoriesList").innerHTML=categories.map(x=>'<div class="admin-item"><span>'+esc(x.name)+' · '+esc(professionals.find(p=>p.id===x.professional_id)?.name||'')+'</span><button data-cat="'+esc(x.id)+'">Desativar</button></div>').join("");
 $("#servicesList").innerHTML=services.map(x=>'<div class="admin-item"><span>'+esc(x.name)+' · '+(x.price==null?'Consultar':new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(x.price))+'</span><button data-service="'+esc(x.id)+'">Desativar</button></div>').join("");
 $("#studioPhone").value=settings.data?.whatsapp_phone||"";
 $("#studioInstagram").value=settings.data?.studio_instagram_url||"https://www.instagram.com/studiomartinsudi/";
}
function fillProfessional(){const p=professionals.find(x=>x.id===$("#professionalSelect").value);if(!p)return;$("#professionalId").value=p.id;$("#professionalName").value=p.name||"";$("#professionalSlug").value=p.slug||"";$("#professionalPhone").value=p.whatsapp_phone||"";$("#professionalBio").value=p.bio||"";$("#professionalPolicy").value=p.booking_policy||"";}
function fillCategories(){const pid=$("#serviceProfessional").value;$("#serviceCategory").innerHTML=options(categories.filter(c=>c.professional_id===pid));}
async function verifySession(session){
 if(!session){$("#loginPanel").classList.remove("hidden");$("#dashboard").classList.add("hidden");return;}
 const {data,error}=await db.from("admin_profiles").select("email,role").eq("user_id",session.user.id).maybeSingle();
 if(error||!data||data.role!=="admin"){await db.auth.signOut();$("#loginPanel").classList.remove("hidden");$("#dashboard").classList.add("hidden");say("#loginMessage","Este usuário não possui perfil de administrador.");return;}
 $("#loginPanel").classList.add("hidden");$("#dashboard").classList.remove("hidden");$("#adminIdentity").textContent=data.email+" · Administradora";
 try{await loadAll();}catch(e){say("#dashboardMessage","Falha ao carregar dados: "+e.message);}
}
$("#loginForm").addEventListener("submit",async e=>{e.preventDefault();say("#loginMessage","Validando acesso...");const {data,error}=await db.auth.signInWithPassword({email:$("#email").value.trim(),password:$("#password").value});if(error){say("#loginMessage","Não foi possível entrar. Confira e-mail e senha.");return;}await verifySession(data.session);});
$("#logout").addEventListener("click",async()=>{await db.auth.signOut();location.reload();});
$("#professionalForm").addEventListener("submit",async e=>{e.preventDefault();const id=$("#professionalId").value;const payload={name:$("#professionalName").value.trim(),slug:$("#professionalSlug").value.trim(),whatsapp_phone:$("#professionalPhone").value.replace(/\D/g,"")||null,bio:$("#professionalBio").value.trim()||null,booking_policy:$("#professionalPolicy").value.trim()||null};const {error}=await db.from("professionals").update(payload).eq("id",id);say("#dashboardMessage",error?"Erro ao salvar profissional: "+error.message:"Profissional atualizada.");if(!error)await loadAll();});
$("#categoryForm").addEventListener("submit",async e=>{e.preventDefault();const {error}=await db.from("service_categories").insert({professional_id:$("#categoryProfessional").value,name:$("#categoryName").value.trim()});say("#dashboardMessage",error?"Erro ao criar categoria: "+error.message:"Categoria adicionada.");if(!error){$("#categoryName").value="";await loadAll();}});
$("#serviceForm").addEventListener("submit",async e=>{e.preventDefault();const raw=$("#servicePrice").value;const {error}=await db.from("services").insert({professional_id:$("#serviceProfessional").value,category_id:$("#serviceCategory").value,name:$("#serviceName").value.trim(),price:raw===""?null:Number(raw),duration_minutes:$("#serviceDuration").value?Number($("#serviceDuration").value):null,price_from:$("#serviceFrom").value==="true",description:$("#serviceDescription").value.trim()||null});say("#dashboardMessage",error?"Erro ao adicionar serviço: "+error.message:"Serviço adicionado.");if(!error){e.target.reset();await loadAll();}});
$("#settingsForm").addEventListener("submit",async e=>{e.preventDefault();const {data:existing,error:readError}=await db.from("site_settings").select("id").limit(1).maybeSingle();if(readError){say("#dashboardMessage",readError.message);return;}const payload={whatsapp_phone:$("#studioPhone").value.replace(/\D/g,"")||null,studio_instagram_url:$("#studioInstagram").value.trim()||null};const result=existing?await db.from("site_settings").update(payload).eq("id",existing.id):await db.from("site_settings").insert(payload);say("#dashboardMessage",result.error?"Erro ao salvar contato: "+result.error.message:"Contato atualizado.");});
document.addEventListener("click",async e=>{const p=e.target.dataset.prof,c=e.target.dataset.cat,s=e.target.dataset.service;if(p){$("#professionalSelect").value=p;fillProfessional();}if(c||s){const table=c?"service_categories":"services",id=c||s;const {error}=await db.from(table).update({is_active:false}).eq("id",id);say("#dashboardMessage",error?"Erro: "+error.message:"Item desativado.");if(!error)await loadAll();}});
db.auth.getSession().then(({data})=>verifySession(data.session));
db.auth.onAuthStateChange((_event,session)=>{if(!session){$("#dashboard").classList.add("hidden");$("#loginPanel").classList.remove("hidden");}});
