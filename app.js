// Somente a chave publishable deve ficar no navegador. Nunca use service_role aqui.
const SUPABASE_URL = "https://svpkaxatonqqymphlchv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_vu49xyFqwXGZJ6VDhRo5_g_KWmFzrwu";

const grid = document.querySelector("#professionalGrid");
document.querySelector("#year").textContent = new Date().getFullYear();

function renderProfessionals(items) {
  if (!items?.length) {
    grid.innerHTML = '<p class="loading">Nosso catálogo está sendo preparado. Em breve, você poderá explorar os serviços por aqui.</p>';
    return;
  }
  grid.innerHTML = items.map((person, index) => {
    const name = escapeHtml(person.name || "Profissional");
    const bio = escapeHtml(person.bio || "Conheça os serviços e encontre seu próximo momento de cuidado.");
    const slug = encodeURIComponent(person.slug || "");
    return `<article class="professional-card">
      <div><span class="number">0${index + 1} / STUDIO MARTINS</span><h3>${name}</h3><p>${bio}</p></div>
      <a href="./profissional.html?perfil=${slug}">Conhecer serviços ↗</a>
    </article>`;
  }).join("");
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;" }[char]));
}

async function init() {
  if (!window.supabase?.createClient) {
    renderProfessionals([]);
    return;
  }
  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  try {
    const [{ data: professionals, error }, { data: settings }] = await Promise.all([
      client.from("professionals").select("id,name,slug,bio,sort_order").eq("is_active", true).order("sort_order"),
      client.from("site_settings").select("studio_instagram_url").limit(1).maybeSingle()
    ]);
    if (error) throw error;
    if (settings?.studio_instagram_url) document.querySelector("#studioInstagram").href = settings.studio_instagram_url;
    renderProfessionals(professionals);
  } catch (error) {
    console.error("Não foi possível carregar o catálogo:", error);
    renderProfessionals([]);
  }
}
init();