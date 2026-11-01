const SUPABASE_URL = "https://svpkaxatonqqymphlchv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_vu49xyFqwXGZJ6VDhRo5_g_KWmFzrwu";
const params = new URLSearchParams(location.search);
const slug = params.get("perfil");
const catalog = document.querySelector("#catalog");
document.querySelector("#year").textContent = new Date().getFullYear();
function esc(v) { return String(v == null ? "" : v).replace(/[&<>"\']/g, function(c) { return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","\'":"&#039;"}[c]; }); }
function money(v) { return v == null ? "Consultar" : new Intl.NumberFormat("pt-BR", {style:"currency", currency:"BRL"}).format(Number(v)); }
function render(person, categories, services, settings) {
  document.querySelector("#personName").textContent = person.name;
  document.querySelector("#personBio").textContent = person.bio || "Conheça os serviços e escolha seu próximo momento de cuidado.";
  if (settings && settings.studio_instagram_url) document.querySelector("#studioInstagram").href = settings.studio_instagram_url;
  var grouped = categories.map(function(cat) { return {cat:cat, items:services.filter(function(s) { return s.category_id === cat.id; })}; }).filter(function(g) { return g.items.length; });
  var html = grouped.map(function(group) {
    var rows = group.items.map(function(s) {
      var duration = s.duration_minutes ? " • " + Math.floor(s.duration_minutes / 60) + "h" + (s.duration_minutes % 60 ? String(s.duration_minutes % 60).padStart(2,"0") : "") : "";
      var price = (s.price_from ? "A partir de " : "") + money(s.price);
      return '<article class="service-row"><div><h3>' + esc(s.name) + '</h3><p>' + esc(s.description || "") + esc(duration) + '</p></div><div class="price">' + price + '</div></article>';
    }).join("");
    return '<section><h2 class="category-title">' + esc(group.cat.name) + '</h2>' + rows + '</section>';
  }).join("");
  if (!html) html = '<p class="loading">Os serviços desta profissional estão sendo cadastrados. Em breve, o catálogo estará completo.</p>';
  var phone = String(person.whatsapp_phone || (settings && settings.whatsapp_phone) || "").replace(/\D/g, "");
  if (phone) {
    var msg = encodeURIComponent("Olá, gostaria de informações e agendamento com " + person.name + ".");
    html += '<a class="book" href="https://wa.me/' + phone + '?text=' + msg + '" target="_blank" rel="noreferrer">Agendar pelo WhatsApp ↗</a>';
  }
  if (person.booking_policy) html += '<aside class="policy"><strong>Informações para agendamento</strong><br>' + esc(person.booking_policy) + '</aside>';
  catalog.innerHTML = html;
}
async function init() {
  if (!slug) { catalog.innerHTML = '<p class="loading">Profissional não informada. Volte ao início e escolha uma profissional.</p>'; return; }
  if (!window.supabase || !window.supabase.createClient) { catalog.textContent = "Não foi possível iniciar o catálogo."; return; }
  var db = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  try {
    var personResult = await db.from("professionals").select("*").eq("slug", slug).eq("is_active", true).maybeSingle();
    if (personResult.error) throw personResult.error;
    var person = personResult.data;
    if (!person) { catalog.textContent = "Profissional não encontrada."; return; }
    var results = await Promise.all([
      db.from("service_categories").select("id,name,sort_order").eq("professional_id", person.id).eq("is_active", true).order("sort_order"),
      db.from("services").select("id,category_id,name,description,price,duration_minutes,price_from,sort_order").eq("professional_id", person.id).eq("is_active", true).order("sort_order"),
      db.from("site_settings").select("studio_instagram_url,whatsapp_phone").limit(1).maybeSingle()
    ]);
    results.forEach(function(r) { if (r.error) throw r.error; });
    render(person, results[0].data || [], results[1].data || [], results[2].data);
  } catch (e) { console.error("Erro ao carregar profissional:", e); catalog.textContent = "Não foi possível carregar o catálogo neste momento."; }
}
init();