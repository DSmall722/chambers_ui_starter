
(function(){
  const $ = (s, p=document)=>p.querySelector(s);
  const $$ = (s, p=document)=>Array.from(p.querySelectorAll(s));

  // API
  const apiInput = $('#apiUrl');
  const saved = localStorage.getItem('apiUrl');
  if(saved) apiInput.value = saved;
  $('#saveApi').onclick = ()=>{ localStorage.setItem('apiUrl', apiInput.value); alert('Saved API URL'); };
  const API = ()=> apiInput.value.replace(/\/$/, '');
  function absoluteUrl(rel){ let base = API(); return base.replace(/\/$/,'') + rel; }
  async function getJSON(url, opts={}){ const r = await fetch(url, {headers:{'Content-Type':'application/json'}, ...opts}); return await r.json(); }
  function debounce(fn, delay){ let t; return function(){ clearTimeout(t); const args=arguments; t=setTimeout(()=>fn.apply(this,args), delay); }; }

  // Tabs
  const tabBtns = Array.from(document.querySelectorAll('.tabs button'));
  const views = Array.from(document.querySelectorAll('section[data-view]'));
  tabBtns.forEach(btn=> btn.onclick = ()=>{
    tabBtns.forEach(b=>b.classList.remove('active'));
    views.forEach(v=>v.classList.remove('active'));
    btn.classList.add('active');
    const view = document.querySelector(`section[data-view="${btn.dataset.tab}"]`);
    if(view) view.classList.add('active');
  });

  // Personas & Sets
  const Personas = {
    drafter:   "Aquila (Drafter)",
    editor:    "Lucida (Editor)",
    citations: "Bluejay (Citation)",
    court:     "Docket (Court-Rules)",
    rag:       "Stacks (Research-RAG)",
    history:   "Canon (Leg-History)",
    scheduling:"Metron (Scheduling)",
    initial:   "Primus (Initial Review)"
  };
  const PersonaSets = {
    defense_standard: {name:"Defense Standard", drafter:"Aquila (Drafter)", editor:"Lucida (Editor)", citations:"Bluejay (Citation)", court:"Docket (Court-Rules)", rag:"Stacks (Research-RAG)", history:"Canon (Leg-History)", scheduling:"Metron (Scheduling)", initial:"Primus (Initial Review)"},
    dispositive_first: {name:"Dispositive First", drafter:"Aquila (Drafter)", editor:"Lucida (Editor)", citations:"Bluejay (Citation)", court:"Docket (Court-Rules)", rag:"Stacks (Research-RAG)", history:"Canon (Leg-History)", scheduling:"Metron (Scheduling)", initial:"Primus (Initial Review)"},
    removal_rebase: {name:"Removal & Rebase", drafter:"Forensis (Drafter)", editor:"Lucida (Editor)", citations:"Bluejay (Citation)", court:"Docket (Court-Rules)", rag:"Stacks (Research-RAG)", history:"Canon (Leg-History)", scheduling:"Metron (Scheduling)", initial:"Primus (Initial Review)"},
    employment_agency: {name:"Employment Agency Stage", drafter:"Aquila (Drafter)", editor:"Lucida (Editor)", citations:"Bluejay (Citation)", court:"Docket (Court-Rules)", rag:"Stacks (Research-RAG)", history:"Canon (Leg-History)", scheduling:"Metron (Scheduling)", initial:"Primus (Initial Review)"}
  };
  function savePersonas(){ localStorage.setItem('personas', JSON.stringify(Personas)); }
  function loadPersonas(){ try{ const s=localStorage.getItem('personas'); if(s) Object.assign(Personas, JSON.parse(s)); }catch{} }
  function renderBadges(){
    const box = $('#personaBadges'); if(!box) return; box.innerHTML='';
    [["Drafter", Personas.drafter],["Editor", Personas.editor],["Citation", Personas.citations],["Court-Rules", Personas.court],["Research-RAG", Personas.rag],["Leg-History", Personas.history],["Scheduling", Personas.scheduling],["Initial Review", Personas.initial]].forEach(([role,name])=>{
      const span=document.createElement('span'); span.className='badge';
      const n=document.createElement('span'); n.className='name'; n.textContent=name;
      const r=document.createElement('span'); r.className='role'; r.textContent=role;
      span.appendChild(n); span.appendChild(r); box.appendChild(span);
    });
  }
  loadPersonas(); renderBadges();
  const personaSetSel = $('#personaSet');
  const applyBtn = $('#applyPersonaSet');
  if(applyBtn) applyBtn.onclick = ()=>{
    const set = PersonaSets[personaSetSel.value]; if(!set) return;
    Personas.drafter=set.drafter; Personas.editor=set.editor; Personas.citations=set.citations; Personas.court=set.court;
    Personas.rag=set.rag; Personas.history=set.history; Personas.scheduling=set.scheduling; Personas.initial=set.initial;
    savePersonas(); renderBadges();
    // refresh persona bars
    mountPersonaBars();
  };

  const PersonaCatalog = {
    drafter: [
      { id: "Aquila (Drafter)", label: "Aquila", desc: "Structure-first brief drafting" },
      { id: "Forensis (Drafter)", label: "Forensis", desc: "Removal / venue / forensics-focused drafting" }
    ],
    editor: [
      { id: "Lucida (Editor)", label: "Lucida", desc: "Balanced polish; preserves voice.", defaults: { max_cut: 0.15 } },
      { id: "Bluepencil (Editor)", label: "Bluepencil", desc: "Aggressive tighten for briefs.", defaults: { max_cut: 0.30 } },
      { id: "Benchline (Editor)", label: "Benchline", desc: "Judicial register; low rhetoric.", defaults: { max_cut: 0.20 } },
      { id: "PlainSpeak (Editor)", label: "PlainSpeak", desc: "Client-facing simplification.", defaults: { max_cut: 0.20 } }
    ],
    citations: [
      { id: "Bluejay (Citation)", label: "Bluejay", desc: "Bluebook pin cites + reporter checks" }
    ],
    court: [
      { id: "Docket (Court-Rules)", label: "Docket", desc: "Forum-specific formatting & limits" }
    ],
    rag: [
      { id: "Stacks (Research-RAG)", label: "Stacks", desc: "Cite-aware retrieval and snippets" }
    ],
    history: [
      { id: "Canon (Leg-History)", label: "Canon", desc: "Statutes + session laws + committee notes" }
    ],
    scheduling: [
      { id: "Metron (Scheduling)", label: "Metron", desc: "Rule-based date math" }
    ],
    initial: [
      { id: "Primus (Initial Review)", label: "Primus", desc: "Intake pack: complaint / summons / cover sheet" }
    ],
    contacts: [
      { id: "Primus (Initial Review)", label: "Primus", desc: "Link parties & counsel to matters" }
    ],
    matters: [
      { id: "Primus (Initial Review)", label: "Primus", desc: "Create & manage matters" }
    ],
    workflow: [
      { id: "Aquila (Drafter)", label: "Aquila", desc: "Draft-focused workflow helpers" }
    ]
  };

  function personaApplied(roleKey, personaId){
    if(roleKey === 'editor'){
      try{
        const opts = (PersonaCatalog.editor||[]);
        const found = opts.find(o=> o.id === personaId);
        if(found && found.defaults && typeof found.defaults.max_cut === 'number'){
          const mc = document.querySelector('#editForm input[name="max_cut"]');
          if(mc){ mc.value = String(found.defaults.max_cut); }
        }
      }catch(e){}
    }
  }

  function renderPersonaBar(roleKey, containerId){
    const box = document.getElementById(containerId);
    if(!box) return;
    const options = PersonaCatalog[roleKey] || [];
    box.innerHTML = '';
    const chipsWrap = document.createElement('div');
    const desc = document.createElement('div'); desc.className='persona-desc';
    options.forEach(opt=>{
      const chip = document.createElement('button'); chip.type='button'; chip.className='persona-chip';
      if((Personas[roleKey]||'') === opt.id) chip.classList.add('active');
      const n = document.createElement('span'); n.className='name'; n.textContent = opt.label;
      const r = document.createElement('span'); r.className='role'; r.textContent = opt.id.replace(/.*\((.+)\).*/, '$1');
      chip.appendChild(n); chip.appendChild(r);
      chip.onclick = ()=>{
        Personas[roleKey] = opt.id;
        savePersonas();
        renderPersonaBar(roleKey, containerId);
        personaApplied(roleKey, opt.id);
        addChat && addChat('ai', `Persona for ${roleKey} set to ${opt.id}.`);
      };
      chipsWrap.appendChild(chip);
    });
    const active = options.find(o=> o.id === Personas[roleKey]) || options[0];
    if(active){ desc.textContent = `${active.label} — ${active.desc}`; Personas[roleKey] = active.id; savePersonas(); }
    box.appendChild(chipsWrap);
    box.appendChild(desc);
  }

  function mountPersonaBars(){
    renderPersonaBar('initial','pb-initial');
    renderPersonaBar('drafter','pb-drafter');
    renderPersonaBar('editor','pb-editor'); personaApplied('editor', Personas.editor);
    renderPersonaBar('citations','pb-citation');
    renderPersonaBar('court','pb-rules');
    renderPersonaBar('rag','pb-research');
    renderPersonaBar('scheduling','pb-scheduling');
    renderPersonaBar('matters','pb-matters');
    renderPersonaBar('contacts','pb-contacts');
    renderPersonaBar('drafter','pb-workflow');
  }

  // Dials
  const Dials = { preset:"None", tone:"neutral", headings:"descriptive", evidenceOnly:true, citations:"strict" };
  function syncDialsFromToggles(){
    const tgEvidence = $('#tgEvidence');
    const tgStrict = $('#tgStrict');
    const tgArgHead = $('#tgArgHead');
    const tone = (document.querySelector('input[name="tone"]:checked')||{}).value || "neutral";
    Dials.evidenceOnly = !!(tgEvidence && tgEvidence.checked);
    Dials.citations = (tgStrict && tgStrict.checked) ? "strict" : "relaxed";
    Dials.headings = (tgArgHead && tgArgHead.checked) ? "argument-carrying" : "descriptive";
    Dials.tone = tone;
  }
  ['tgEvidence','tgStrict','tgArgHead'].forEach(id=>{ const el=$('#'+id); if(el) el.onchange = syncDialsFromToggles; });
  $$('#chatForm input[name="tone"]').forEach(el=> el.onchange = syncDialsFromToggles);
  syncDialsFromToggles();

  // Defense Presets
  const DefensePresets = {
    state_standard_defense: { name:"State Answer — Standard Defense", about:"Answer with curated affirmative defenses, neutral tone, descriptive headings.", set:"defense_standard", dials:{tone:"neutral", headings:"descriptive", evidenceOnly:true, citations:"strict"} },
    federal_answer_dsc: { name:"Federal (D.S.C.) — Answer + Initial Papers", about:"Answer, JS-44, Rule 7.1; neutral tone; strict citations.", set:"defense_standard", dials:{tone:"neutral", headings:"descriptive", evidenceOnly:true, citations:"strict"} },
    removal_pack: { name:"Removal Pack", about:"Notice of Removal + attachments index + 7.1; evidence-only for amount/CAFA facts.", set:"removal_rebase", dials:{tone:"neutral", headings:"descriptive", evidenceOnly:true, citations:"strict"} },
    rule_12b_first: { name:"Rule 12(b) First", about:"Dispositive first; persuasive headings; strict pins.", set:"dispositive_first", dials:{tone:"persuasive-strong", headings:"argument-carrying", evidenceOnly:true, citations:"strict"} },
    arb_venue: { name:"Arbitration / Venue Enforcement", about:"Compel arbitration or transfer; persuasive-medium tone.", set:"dispositive_first", dials:{tone:"persuasive-medium", headings:"argument-carrying", evidenceOnly:true, citations:"strict"} },
    employment_agency: { name:"Employment — Agency Stage", about:"Position statement shell; neutral tone; evidence-only ON.", set:"employment_agency", dials:{tone:"neutral", headings:"descriptive", evidenceOnly:true, citations:"strict"} },
    protective_esi: { name:"Early Protective Orders & ESI", about:"Confidentiality, 502(d), ESI protocol; neutral tone.", set:"defense_standard", dials:{tone:"neutral", headings:"descriptive", evidenceOnly:false, citations:"relaxed"} }
  };
  function setDials(d){ Dials.preset=d.name||Dials.preset; Dials.tone=d.dials?.tone??Dials.tone; Dials.headings=d.dials?.headings??Dials.headings; Dials.evidenceOnly=(d.dials?.evidenceOnly??Dials.evidenceOnly); Dials.citations=d.dials?.citations??Dials.citations;
    $('#activePreset') && ($('#activePreset').textContent=Dials.preset);
    $('#dialTone') && ($('#dialTone').textContent=Dials.tone);
    $('#dialHeadings') && ($('#dialHeadings').textContent=Dials.headings);
    $('#dialEvidence') && ($('#dialEvidence').textContent=String(Dials.evidenceOnly));
    $('#dialCites') && ($('#dialCites').textContent=Dials.citations);
  }
  function renderDefensePresets(){
    const box = $('#defensePresets'); if(!box) return; box.innerHTML='';
    Object.entries(DefensePresets).forEach(([key,p])=>{
      const card=document.createElement('div'); card.className='preset-card';
      const h=document.createElement('h3'); h.textContent=p.name;
      const d=document.createElement('p'); d.textContent=p.about;
      const actions=document.createElement('div'); actions.className='preset-actions';
      const apply=document.createElement('button'); apply.textContent='Apply Preset';
      apply.onclick=()=>{ applyPersonaSet(p.set); setDials(p); };
      actions.appendChild(apply); card.appendChild(h); card.appendChild(d); card.appendChild(actions); box.appendChild(card);
    });
  }
  renderDefensePresets(); setDials({name:"None", dials:{}});

  // Preset suggester
  const presetForm = $('#presetForm');
  if(presetForm){
    presetForm.onsubmit = async (e)=>{
      e.preventDefault();
      const fd = new FormData(e.target);
      const body = JSON.stringify({ matter_id: fd.get('matter_id')||'', complaint_text: fd.get('complaint_text')||'' });
      const out = await getJSON(API()+"/preset/suggest",{method:'POST', body});
      const box = $('#presetOut'); box.classList.remove('hidden'); box.innerHTML = "Suggested preset: <b>"+out.suggested_preset+"</b>";
    };
  }

  // Workflow gate
  let firstTurnDone = false;
  function unlockWorkflow(){
    if(firstTurnDone) return;
    firstTurnDone = true;
    const gate = $('#wfGate'); if(gate) gate.style.display='none';
    ['defensePresets','currentDials','presetForm','presetOut','suggHeader'].forEach(id=>{
      const el = $('#'+id); el && el.classList.remove('hidden');
    });
  }

  // Chat client
  const ChatState = { history: [] };
  function addChat(role, text){
    const log = $('#chatLog'); if(!log) return;
    const wrap = document.createElement('div'); wrap.className = 'msg '+(role==='you'?'me':'ai');
    const r = document.createElement('div'); r.className = 'role'; r.textContent = role==='you'?'You':'Chambers';
    const b = document.createElement('div'); b.className = 'bubble'; b.textContent = text;
    wrap.appendChild(r); wrap.appendChild(b); log.appendChild(wrap); log.scrollTop = log.scrollHeight;
  }
  const chatForm = $('#chatForm');
  const saveMemoBtn = $('#saveMemo');
  if(chatForm){
    chatForm.onsubmit = async (e)=>{
      e.preventDefault();
      syncDialsFromToggles();
      const fd = new FormData(e.target);
      let matter_id = fd.get('matter_id')||'';
      if(!matter_id){ const sel = document.getElementById('caseSelect'); matter_id = (sel && sel.value) ? sel.value : (localStorage.getItem('lastMatterId')||''); }
      if(matter_id) localStorage.setItem('lastMatterId', matter_id);
      const message = fd.get('message')||'';
      if(!message.trim()) return;
      addChat('you', message);
      e.target.message.value = '';

      const payload = { matter_id, message, history: ChatState.history, personas: Personas, dials: { tone:Dials.tone, headings:Dials.headings, evidenceOnly:Dials.evidenceOnly, citations:Dials.citations } };
      const out = await getJSON(API()+"/chat",{method:'POST', body: JSON.stringify(payload)});
      let text = out.reply || "";
      if(out.result && out.result.type){
        if(out.result.type === 'draft'){
          lastDraftText = out.result.text;
          exportBtn && (exportBtn.disabled = false);
          text += (text?"\n\n":"") + "[Draft by "+out.result.persona+"]\n\n"+out.result.text;
        }
      }
      if(out.needs && out.needs.length){ text += (text?"\n\n":"") + "I need: " + out.needs.join("; "); }
      addChat('ai', text || "Okay.");
      ChatState.history.push({role:"user", content: message, matter_id});
      ChatState.history.push({role:"assistant", content: text});
      unlockWorkflow();
    };
  }
  if(saveMemoBtn){
    saveMemoBtn.onclick = async ()=>{
      const matterEl = document.querySelector('#chatForm input[name="matter_id"]');
      const matter_id = matterEl ? (matterEl.value||localStorage.getItem('lastMatterId')||'') : (localStorage.getItem('lastMatterId')||'');
      if(ChatState.history.length===0){ alert('No chat to save yet.'); return; }
      const title = prompt('Memo title (optional):','');
      const body = JSON.stringify({ matter_id, title, history: ChatState.history });
      const out = await getJSON(API()+"/chat/save_memo",{method:'POST', body});
      const full = API() + out.download_url;
      addChat('ai', "Saved memo: "+ full);
    };
  }

  // Export DOCX
  let lastDraftText = '';
  const exportBtn = document.getElementById('exportDocx');
  async function exportDocx(){
    if(!lastDraftText){ alert('No draft yet.'); return; }
    const matter = (document.querySelector('#chatForm input[name="matter_id"]').value || localStorage.getItem('lastMatterId') || 'general').trim();
    const when = new Date().toISOString().replace(/[:.]/g,'-');
    const filename = `${matter || 'general'}-draft-${when}.docx`.replace(/\s+/g,'_');
    const body = JSON.stringify({ text: lastDraftText, filename, title: 'Draft' });
    const out = await getJSON(API()+"/export/docx", { method:'POST', body });
    if(out.ok){ const url = absoluteUrl(out.download_url); addChat('ai', 'DOCX ready: '+ url); } else { addChat('ai', 'Export failed: '+ (out.error||'unknown')); }
  }
  if(exportBtn){ exportBtn.onclick = exportDocx; }

  // Sidebar recent matters
  let SB_FILTER = 'all';
  async function loadRecentMatters(){
    try{
      const list = await getJSON(API()+"/matters_recent");
      const box = document.getElementById('recentMatters'); if(!box) return;
      box.innerHTML = '';
      const lastMatter = localStorage.getItem('lastMatterId')||'';
      (list||[]).forEach(m=>{
        if(SB_FILTER==='files' && !(m.counts && m.counts.upload)) return;
        const item = document.createElement('div'); item.className='sb-item';
        const left = document.createElement('div'); left.innerHTML = '<b>'+m.id+'</b><div class="meta">'+(m.title||'')+' — '+(m.forum||'')+'</div>';
        const badges = document.createElement('div'); badges.className='badges';
        const fcount = (m.counts && m.counts.upload) ? m.counts.upload : 0;
        const d = document.createElement('span'); d.className='badge-mini'; d.textContent=fcount+' files'; badges.appendChild(d);
        item.appendChild(left); item.appendChild(badges);
        if(m.id===lastMatter){ item.style.borderColor = '#1d4ed8'; }
        item.onclick = ()=>{
          const sel = document.getElementById('caseSelect'); if(sel){ sel.value = m.id; sel.dispatchEvent(new Event('change')); }
          const chatTab = document.querySelector('.tabs button[data-tab="chat"]'); if(chatTab){ chatTab.click(); }
        };
        item.addEventListener('dragover', e=>{ e.preventDefault(); item.classList.add('drag'); });
        item.addEventListener('dragleave', e=>{ item.classList.remove('drag'); });
        item.addEventListener('drop', async e=>{
          e.preventDefault(); item.classList.remove('drag');
          const files = e.dataTransfer.files;
          if(files && files.length){
            Array.from(files).forEach(async f=>{
              const fd = new FormData(); fd.append('matter_id', m.id); fd.append('file', f);
              pushQueue('Uploading '+f.name+' → '+m.id);
              try{ const r = await fetch(API()+"/upload",{method:'POST', body:fd}); await r.json(); popQueue(); refreshAllZones(); loadRecentMatters(); }catch(e){ popQueue(); }
            });
          }
        });
        box.appendChild(item);
      });
    }catch(e){}
  }
  document.querySelectorAll('.sb-filter').forEach(b=>{ b.onclick = ()=>{ SB_FILTER = b.dataset.filter; loadRecentMatters(); }; });
  let queueCount = 0;
  function pushQueue(msg){ queueCount++; const div = document.getElementById('uploadQueue'); if(div){ div.textContent = queueCount+' in progress…'; } }
  function popQueue(){ queueCount = Math.max(0, queueCount-1); const div = document.getElementById('uploadQueue'); if(div){ div.textContent = queueCount? (queueCount+' in progress…') : 'No active uploads'; } }

  // Preview modal
  const modal = document.getElementById('previewModal');
  const frame = document.getElementById('previewFrame');
  const titleEl = document.getElementById('previewTitle');
  const openNew = document.getElementById('openNewTab');
  const closePrev = document.getElementById('closePreview');
  function openPreview(url, title){ if(frame){ frame.src = url; } if(titleEl){ titleEl.textContent = title || 'Preview'; } if(openNew){ openNew.onclick = ()=> window.open(url, '_blank'); } if(modal){ modal.classList.add('active'); } }
  if(closePrev){ closePrev.onclick = ()=> modal && modal.classList.remove('active'); }

  // Generic upload zones + list
  async function listUploads(matterId){ try{ return await getJSON(API()+"/uploads?matter_id="+encodeURIComponent(matterId)); }catch(e){ return { matter_id: matterId, files: [] }; } }
  async function refreshZoneList(zone, matterId){
    const listEl = zone.querySelector('.file-list'); if(!listEl) return;
    listEl.innerHTML = '';
    if(!matterId){ listEl.innerHTML = '<div class="file-item"><span class="name">No matter selected yet.</span></div>'; return; }
    const data = await listUploads(matterId);
    if(!data.files || data.files.length===0){ listEl.innerHTML = '<div class="file-item"><span class="name">No files uploaded yet.</span></div>'; return; }
    data.files.forEach(f=>{
      const row = document.createElement('div'); row.className='file-item';
      const name = document.createElement('span'); name.className='name'; name.textContent = f.filename;
      const actions = document.createElement('div'); actions.className='row-actions';
      const prev = document.createElement('button'); prev.className='btn-secondary'; prev.textContent='Preview'; prev.onclick = ()=>{ const url = API()+"/files/"+encodeURIComponent(matterId)+"/"+encodeURIComponent(f.filename); openPreview(url, f.filename); };
      const openBtn = document.createElement('button'); openBtn.className='btn-secondary'; openBtn.textContent='Open'; openBtn.onclick = ()=> window.open(API()+"/files/"+encodeURIComponent(matterId)+"/"+encodeURIComponent(f.filename), "_blank");
      const del = document.createElement('button'); del.className='btn-secondary'; del.textContent='Delete'; del.onclick = async ()=>{ await fetch(API()+"/uploads?matter_id="+encodeURIComponent(matterId)+"&filename="+encodeURIComponent(f.filename), {method:'DELETE'}); refreshZoneList(zone, matterId); loadRecentMatters(); };
      const tagbar = document.createElement('div'); tagbar.className='tagbar';
      const tagIn = document.createElement('input'); tagIn.className='tag-input'; tagIn.placeholder='tags comma-separated (e.g., Order, Exhibit A)'; tagIn.value = (f.tags||[]).join(', ');
      const note = document.createElement('textarea'); note.className='note-input'; note.placeholder='note'; note.value = f.note || '';
      const save = document.createElement('button'); save.className='btn-secondary'; save.textContent='Save meta'; save.onclick = async ()=>{ const tags = tagIn.value.split(',').map(s=>s.trim()).filter(Boolean); const body = JSON.stringify({ matter_id: matterId, filename: f.filename, tags, note: note.value }); await getJSON(API()+"/uploads/meta", {method:'POST', body}); loadRecentMatters(); };
      actions.appendChild(prev); actions.appendChild(openBtn); actions.appendChild(del);
      row.appendChild(name); row.appendChild(actions);
      row.appendChild(tagbar); row.appendChild(tagIn); row.appendChild(note); row.appendChild(save);
      listEl.appendChild(row);
    });
  }
  function getMatterForZone(zone){
    const sel = zone.getAttribute('data-matter-input') || "";
    if(sel){ const el = zone.closest('section')?.querySelector(sel); if(el && el.value) return el.value; }
    const chatMatter = document.querySelector('#chatForm input[name="matter_id"]');
    return (chatMatter && chatMatter.value) || localStorage.getItem('lastMatterId') || '';
  }
  function bindUploadZone(zone){
    const input = zone.querySelector('.file-input') || document.getElementById('chatFileInput');
    const browse = zone.querySelector('.browse-btn') || document.getElementById('chatBrowseFiles');
    let currentMatter = getMatterForZone(zone);
    refreshZoneList(zone, currentMatter);
    function doUpload(files){
      currentMatter = getMatterForZone(zone);
      if(!currentMatter){ addChat('ai','Please select or enter a Matter ID before uploading.'); return; }
      Array.from(files).forEach(async f=>{
        const fd = new FormData(); fd.append('matter_id', currentMatter); fd.append('file', f);
        try{ const r = await fetch(API()+"/upload", { method:'POST', body: fd }); await r.json(); refreshZoneList(zone, currentMatter); addChat && addChat('ai', `Uploaded: ${f.name}`); }catch(e){ addChat && addChat('ai','Upload failed: '+f.name); }
      });
    }
    zone.addEventListener('dragenter', e=>{ e.preventDefault(); e.stopPropagation(); zone.classList.add('drag'); });
    zone.addEventListener('dragover', e=>{ e.preventDefault(); e.stopPropagation(); zone.classList.add('drag'); });
    ;['dragleave','drop'].forEach(ev=> zone.addEventListener(ev, e=>{ e.preventDefault(); e.stopPropagation(); zone.classList.remove('drag'); }));
    zone.addEventListener('drop', e=>{ const files = e.dataTransfer.files; doUpload(files); });
    if(browse){ browse.onclick = ()=> input && input.click(); }
    if(input){ input.onchange = ()=>{ doUpload(input.files); input.value=''; }; }
  }
  function refreshAllZones(){
    document.querySelectorAll('.upload-zone').forEach(z=>{
      const matter = (document.querySelector('#chatForm input[name="matter_id"]').value || localStorage.getItem('lastMatterId') || '');
      const listEl = z.querySelector('.file-list');
      if(listEl){ refreshZoneList(z, getMatterForZone(z) || matter); }
    });
  }
  window.addEventListener('load', ()=>{ document.querySelectorAll('.upload-zone').forEach(bindUploadZone); });

  // Matters list + add
  async function loadMatters(){ const data=await getJSON(API()+"/matters"); const box=$('#matters'); if(!box) return; box.innerHTML=''; window.__matters = data; data.forEach(m=>{ const d=document.createElement('div'); d.textContent=m.id+" — "+m.title+" — "+(m.forum||''); box.appendChild(d); }); populateCaseSelect(); }
  const newMatterForm = $('#newMatter');
  if(newMatterForm){ newMatterForm.onsubmit = async (e)=>{ e.preventDefault(); const fd=new FormData(e.target); const body=JSON.stringify({title:fd.get('title'), forum:fd.get('forum'), client:fd.get('client')}); await getJSON(API()+"/matters",{method:'POST', body}); await loadMatters(); e.target.reset(); }; }
  async function populateCaseSelect(){ try{ const list = await getJSON(API()+"/matters"); const sel = document.getElementById('caseSelect'); if(!sel) return; sel.innerHTML = '<option value="">— Select matter —</option>'; list.forEach(m=>{ const opt = document.createElement('option'); opt.value = m.id; opt.textContent = m.id + ' — ' + m.title; sel.appendChild(opt); }); const last = localStorage.getItem('lastMatterId'); if(last){ sel.value = last; const input = document.querySelector('#chatForm input[name="matter_id"]'); if(input && !input.value) input.value = last; } sel.onchange = ()=>{ const v = sel.value || ''; localStorage.setItem('lastMatterId', v); const input = document.querySelector('#chatForm input[name="matter_id"]'); if(input) input.value = v; refreshAllZones(); }; }catch(e){} }

  // Initial Review
  const initForm = $('#initReviewForm');
  if(initForm){ initForm.onsubmit = async (e)=>{ e.preventDefault(); const fd=new FormData(e.target); const payload={matter_id:fd.get('matter_id'), facts:fd.get('facts'), persona:Personas.initial, dials:{ tone:Dials.tone, headings:Dials.headings, evidenceOnly:Dials.evidenceOnly, citations:Dials.citations }}; const out=await getJSON(API()+"/initial_review",{method:'POST', body:JSON.stringify(payload)}); $('#initReviewOut').textContent=JSON.stringify(out,null,2); }; }

  // Drafter
  const draftForm = $('#draftForm');
  if(draftForm){ draftForm.onsubmit = async (e)=>{ e.preventDefault(); syncDialsFromToggles(); const fd=new FormData(e.target); const outline=(fd.get('outline')||'').split('\n').filter(Boolean); const citations=(fd.get('citations')||'').split('\n').filter(Boolean); const payload={matter_id:fd.get('matter_id'), goal:fd.get('goal'), outline, citations, persona:Personas.drafter, dials:{ tone:Dials.tone, headings:Dials.headings, evidenceOnly:Dials.evidenceOnly, citations:Dials.citations }}; const out=await getJSON(API()+"/drafter",{method:'POST', body:JSON.stringify(payload)}); $('#draftOut').textContent=out.draft+"\n\n[Dials]\n"+JSON.stringify(out.dials,null,2); }; }

  // Editor
  const editForm = $('#editForm');
  if(editForm){ editForm.onsubmit = async (e)=>{ e.preventDefault(); const fd=new FormData(e.target); const max_cut=parseFloat(fd.get('max_cut')||'0')||0; const body=JSON.stringify({text:fd.get('text'), constraints:{max_cut}}); const out=await getJSON(API()+"/edit",{method:'POST', body}); $('#editOut').textContent=out.edited; }; }

  // Citation
  const citeForm = $('#citeForm');
  if(citeForm){ citeForm.onsubmit = async (e)=>{ e.preventDefault(); const fd=new FormData(e.target); const body=JSON.stringify({text:fd.get('text'), forum:fd.get('forum')}); const out=await getJSON(API()+"/cite/lint",{method:'POST', body}); $('#citeOut').textContent=JSON.stringify(out,null,2); }; }

  // Court Rules
  const rulesForm = $('#rulesForm');
  if(rulesForm){ rulesForm.onsubmit = async (e)=>{ e.preventDefault(); const fd=new FormData(e.target); const body=JSON.stringify({forum:fd.get('forum'), doc_type:fd.get('doc_type'), content:fd.get('content')}); const out=await getJSON(API()+"/rules/validate",{method:'POST', body}); $('#rulesOut').textContent=JSON.stringify(out,null,2); }; }

  // Research
  const ragForm = $('#ragForm');
  if(ragForm){ ragForm.onsubmit = async (e)=>{ e.preventDefault(); const fd=new FormData(e.target); const body=JSON.stringify({matter_id:fd.get('matter_id'), query:fd.get('query'), k:5}); const out=await getJSON(API()+"/rag/search",{method:'POST', body}); $('#ragOut').textContent=JSON.stringify(out,null,2); }; }

  // Scheduling
  const schedForm = $('#schedForm');
  if(schedForm){ schedForm.onsubmit = async (e)=>{ e.preventDefault(); const fd=new FormData(e.target); const body=JSON.stringify({ forum:fd.get('forum'), trigger:{ id:fd.get('trigger_id'), datetime:fd.get('datetime'), attrs:{ service_method:fd.get('service_method') } } }); const out=await getJSON(API()+"/schedule/compute",{method:'POST', body}); $('#schedOut').textContent=JSON.stringify(out,null,2); }; }

  // Contacts (search + cards)
  async function fetchContacts(filters){
    const params = new URLSearchParams();
    if(filters.q) params.set('q', filters.q);
    if(filters.role) params.set('role', filters.role);
    if(filters.matter_id) params.set('matter_id', filters.matter_id);
    if(filters.has_email) params.set('has_email', '1');
    const url = API()+"/contacts"+ (params.toString()? ("?"+params.toString()):"");
    return await getJSON(url);
  }
  function highlight(text, q){ if(!q) return text; try{ const esc = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); return text.replace(new RegExp(esc, 'ig'), (m)=> `<span class="hl">${m}</span>`); }catch(e){ return text; } }
  async function renderContacts(){
    const q = document.getElementById('contactQ').value.trim();
    const role = document.getElementById('contactRole').value;
    const matter_id = document.getElementById('contactMatter').value;
    const has_email = document.getElementById('contactHasEmail').checked;
    const list = await fetchContacts({q, role, matter_id, has_email});
    window.__contactsCache = list;
    const box = document.getElementById('contactResults'); if(!box) return;
    box.innerHTML = '';
    if(!list.length){ box.innerHTML = '<div class="contact-row">No contacts found.</div>'; return; }
    list.forEach(c=>{
      const row = document.createElement('div'); row.className = 'contact-row';
      const head = document.createElement('div'); head.className = 'contact-head';
      const name = document.createElement('div'); name.className = 'name'; name.innerHTML = highlight(c.name||'', q);
      const roles = document.createElement('div'); roles.className = 'roles'; roles.textContent = (c.roles||[]).join(', ');
      const right = document.createElement('div'); right.className = 'right';
      const emailBtn = document.createElement('button'); emailBtn.className='btn-secondary'; emailBtn.textContent='Copy email'; emailBtn.onclick = ()=>{ const first = (c.emails||[])[0] || ''; if(first){ navigator.clipboard && navigator.clipboard.writeText(first); } };
      const mailtoBtn = document.createElement('button'); mailtoBtn.className='btn-secondary'; mailtoBtn.textContent='Email'; mailtoBtn.onclick = ()=>{ const first = (c.emails||[])[0] || ''; if(first){ window.location.href = 'mailto:'+first; } };
      const linkSel = document.createElement('select'); linkSel.innerHTML = '<option value="">Link to matter…</option>'; (window.__matters||[]).forEach(m=>{ const opt = document.createElement('option'); opt.value = m.id; opt.textContent = m.id+' — '+m.title; linkSel.appendChild(opt); }); linkSel.onchange = async ()=>{ const v = linkSel.value; if(!v) return; await getJSON(API()+"/contacts/link",{method:'POST', body: JSON.stringify({id:c.id, matter_id:v})}); addChat && addChat('ai', `Linked ${c.name} to ${v}`); };
      const delBtn = document.createElement('button'); delBtn.className='btn-secondary'; delBtn.textContent='Delete'; delBtn.onclick = async ()=>{ if(!confirm('Delete '+(c.name||c.id)+'?')) return; await fetch(API()+"/contacts?id="+encodeURIComponent(c.id), {method:'DELETE'}); renderContacts(); };
      right.appendChild(emailBtn); right.appendChild(mailtoBtn); right.appendChild(linkSel); right.appendChild(delBtn);
      head.appendChild(name); head.appendChild(roles); head.appendChild(right);
      const body = document.createElement('div'); body.className='contact-body';
      const org = (c.org||''); const emails = (c.emails||[]).join(', '); const matters = (c.matters||[]).join(', ');
      body.innerHTML = `${highlight(org,q)}<br>${highlight(emails,q)}<br>Matters: ${highlight(matters,q)}`;
      row.appendChild(head); row.appendChild(body);
      box.appendChild(row);
    });
  }

  // Contacts Table View
  window.__contactsCache = [];
  let CT_SORT_COL = 'name'; let CT_SORT_DIR = 'asc'; let CT_SELECTED = new Set();
  function normalize(val){ if(Array.isArray(val)) return val.join('; '); return val == null ? '' : String(val); }
  function rowMatchesFilters(c){
    const q = ($('#contactQ')?.value || '').trim().toLowerCase();
    const cols = { name: ($('#f_name')?.value || '').trim().toLowerCase(), roles: ($('#f_roles')?.value || '').trim().toLowerCase(), org: ($('#f_org')?.value || '').trim().toLowerCase(), emails: ($('#f_emails')?.value || '').trim().toLowerCase(), matters: ($('#f_matters')?.value || '').trim().toLowerCase(), tags: ($('#f_tags')?.value || '').trim().toLowerCase(), note: ($('#f_note')?.value || '').trim().toLowerCase() };
    const hayAll = (normalize(c.name)+' '+normalize(c.roles)+' '+normalize(c.org)+' '+normalize(c.emails)+' '+normalize(c.matters)+' '+normalize(c.tags)+' '+normalize(c.note)).toLowerCase();
    if(q && hayAll.indexOf(q) === -1) return false;
    if(cols.name && normalize(c.name).toLowerCase().indexOf(cols.name) === -1) return false;
    if(cols.roles && normalize(c.roles).toLowerCase().indexOf(cols.roles) === -1) return false;
    if(cols.org && normalize(c.org).toLowerCase().indexOf(cols.org) === -1) return false;
    if(cols.emails && normalize(c.emails).toLowerCase().indexOf(cols.emails) === -1) return false;
    if(cols.matters && normalize(c.matters).toLowerCase().indexOf(cols.matters) === -1) return false;
    if(cols.tags && normalize(c.tags).toLowerCase().indexOf(cols.tags) === -1) return false;
    if(cols.note && normalize(c.note).toLowerCase().indexOf(cols.note) === -1) return false;
    return true;
  }
  function sortContacts(list){
    return list.slice().sort((a,b)=>{
      const av = normalize(a[CT_SORT_COL] || (CT_SORT_COL==='emails'||CT_SORT_COL==='matters'||CT_SORT_COL==='roles'||CT_SORT_COL==='tags' ? (a[CT_SORT_COL]||[]).join('; ') : a[CT_SORT_COL]));
      const bv = normalize(b[CT_SORT_COL] || (CT_SORT_COL==='emails'||CT_SORT_COL==='matters'||CT_SORT_COL==='roles'||CT_SORT_COL==='tags' ? (b[CT_SORT_COL]||[]).join('; ') : b[CT_SORT_COL]));
      if(av < bv) return CT_SORT_DIR==='asc' ? -1 : 1;
      if(av > bv) return CT_SORT_DIR==='asc' ? 1 : -1;
      return 0;
    });
  }
  function renderContactsTable(){
    const wrap = document.getElementById('contactTableWrap'); if(!wrap) return;
    const tb = wrap.querySelector('tbody'); if(!tb) return;
    tb.innerHTML = '';
    const list = (window.__contactsCache || []).filter(rowMatchesFilters);
    const sorted = sortContacts(list);
    sorted.forEach(c=>{
      const tr = document.createElement('tr');
      const tdSel = document.createElement('td'); tdSel.className='sticky-col';
      const cb = document.createElement('input'); cb.type='checkbox'; cb.checked = CT_SELECTED.has(c.id);
      cb.onchange = ()=>{ if(cb.checked) CT_SELECTED.add(c.id); else CT_SELECTED.delete(c.id); };
      tdSel.appendChild(cb); tr.appendChild(tdSel);
      const tdName = document.createElement('td'); tdName.className='sticky-col'; tdName.textContent = c.name||''; tr.appendChild(tdName);
      const tdRoles = document.createElement('td'); tdRoles.textContent = (c.roles||[]).join(', '); tr.appendChild(tdRoles);
      const tdOrg = document.createElement('td'); tdOrg.textContent = c.org||''; tr.appendChild(tdOrg);
      const tdEmails = document.createElement('td'); tdEmails.textContent = (c.emails||[]).join(', '); tr.appendChild(tdEmails);
      const tdMatters = document.createElement('td'); tdMatters.textContent = (c.matters||[]).join(', '); tr.appendChild(tdMatters);
      const tdTags = document.createElement('td'); tdTags.textContent = (c.tags||[]).join(', '); tr.appendChild(tdTags);
      const tdNote = document.createElement('td'); tdNote.textContent = c.note||''; tr.appendChild(tdNote);
      const tdLA = document.createElement('td'); tdLA.textContent = c.last_activity ? new Date(c.last_activity*1000).toLocaleString() : ''; tr.appendChild(tdLA);
      const tdAct = document.createElement('td');
      const copy = document.createElement('button'); copy.className='btn-secondary'; copy.textContent='Copy email'; copy.onclick=()=>{ const first=(c.emails||[])[0]||''; if(first && navigator.clipboard) navigator.clipboard.writeText(first); };
      const email = document.createElement('button'); email.className='btn-secondary'; email.textContent='Email'; email.onclick=()=>{ const first=(c.emails||[])[0]||''; if(first) window.location.href='mailto:'+first; };
      const linkSel = document.createElement('select'); linkSel.innerHTML = '<option value="">Link to matter…</option>'; (window.__matters||[]).forEach(m=>{ const opt=document.createElement('option'); opt.value=m.id; opt.textContent=m.id+' — '+m.title; linkSel.appendChild(opt); }); linkSel.onchange=async()=>{ const v=linkSel.value; if(!v) return; await getJSON(API()+"/contacts/link",{method:'POST', body: JSON.stringify({id:c.id, matter_id:v})}); };
      const del = document.createElement('button'); del.className='btn-secondary'; del.textContent='Delete'; del.onclick=async()=>{ if(!confirm('Delete '+(c.name||c.id)+'?')) return; await fetch(API()+"/contacts?id="+encodeURIComponent(c.id), {method:'DELETE'}); await reloadContactsCache(); };
      tdAct.appendChild(copy); tdAct.appendChild(email); tdAct.appendChild(linkSel); tdAct.appendChild(del);
      tr.appendChild(tdAct);
      tb.appendChild(tr);
    });
  }
  async function reloadContactsCache(){
    const q = document.getElementById('contactQ')?.value || '';
    const role = document.getElementById('contactRole')?.value || '';
    const matter_id = document.getElementById('contactMatter')?.value || '';
    const has_email = document.getElementById('contactHasEmail')?.checked || false;
    const list = await fetchContacts({q, role, matter_id, has_email});
    window.__contactsCache = list;
    renderContactsTable();
  }
  const toggleBtn = document.getElementById('contactViewToggle');
  if(toggleBtn){
    toggleBtn.onclick = ()=>{
      const cards = document.getElementById('contactResults');
      const table = document.getElementById('contactTableWrap');
      const bulk = document.getElementById('contactsBulkBar');
      const toTable = table.classList.contains('hidden');
      if(toTable){ cards.classList.add('hidden'); table.classList.remove('hidden'); bulk.classList.remove('hidden'); toggleBtn.textContent = 'Switch to Card View'; reloadContactsCache(); }
      else { cards.classList.remove('hidden'); table.classList.add('hidden'); bulk.classList.add('hidden'); toggleBtn.textContent = 'Switch to Table View'; }
    };
  }
  document.querySelectorAll('#contactsTable thead tr.head th.sort').forEach(th=>{
    th.addEventListener('click', ()=>{
      const col = th.getAttribute('data-col');
      if(CT_SORT_COL === col){ CT_SORT_DIR = (CT_SORT_DIR==='asc'?'desc':'asc'); } else { CT_SORT_COL = col; CT_SORT_DIR='asc'; }
      renderContactsTable();
    });
  });
  ['f_name','f_roles','f_org','f_emails','f_matters','f_tags','f_note'].forEach(id=>{ const el = document.getElementById(id); if(el){ el.addEventListener('input', debounce(renderContactsTable, 250)); } });
  const ctAll = document.getElementById('ctSelectAll'); if(ctAll){ ctAll.onchange = ()=>{ CT_SELECTED.clear(); if(ctAll.checked){ (window.__contactsCache||[]).filter(rowMatchesFilters).forEach(c=> CT_SELECTED.add(c.id)); } renderContactsTable(); }; }
  async function populateBulkMatter(){ const sel = document.getElementById('contactsBulkMatter'); if(!sel) return; const matters = await getJSON(API()+"/matters"); window.__matters = matters; sel.innerHTML = '<option value="">Link to matter…</option>'; matters.forEach(m=>{ const opt=document.createElement('option'); opt.value=m.id; opt.textContent=m.id+' — '+m.title; sel.appendChild(opt); }); }
  populateBulkMatter();
  const bulkLink = document.getElementById('contactsBulkLink'); if(bulkLink){ bulkLink.onclick = async ()=>{ const sel = document.getElementById('contactsBulkMatter'); const v = sel && sel.value; if(!v){ alert('Pick a matter first'); return; } const ids = Array.from(CT_SELECTED.values()); for(const id of ids){ await getJSON(API()+"/contacts/link",{method:'POST', body: JSON.stringify({id, matter_id:v})}); } alert('Linked '+ids.length+' contact(s) to '+v); reloadContactsCache(); }; }
  const bulkDel = document.getElementById('contactsBulkDelete'); if(bulkDel){ bulkDel.onclick = async ()=>{ const ids = Array.from(CT_SELECTED.values()); if(!ids.length) return; if(!confirm('Delete '+ids.length+' contact(s)?')) return; for(const id of ids){ await fetch(API()+"/contacts?id="+encodeURIComponent(id), {method:'DELETE'}); } CT_SELECTED.clear(); reloadContactsCache(); }; }
  const bulkExport = document.getElementById('contactsBulkExport'); if(bulkExport){ bulkExport.onclick = ()=>{ const rows = (window.__contactsCache||[]).filter(rowMatchesFilters).filter(c=> CT_SELECTED.size? CT_SELECTED.has(c.id) : true); const fields = ['id','name','roles','org','emails','matters','tags','note','last_activity']; const header = fields.join(','); const lines = [header]; rows.forEach(c=>{ const vals = fields.map(f=>{ let v = c[f]; if(Array.isArray(v)) v = v.join('; '); if(v == null) v = ''; v = String(v).replace(/"/g,'""'); if(/[",\n]/.test(v)) v = '"'+v+'"'; return v; }); lines.push(vals.join(',')); }); const when = new Date().toISOString().slice(0,10); const extra = prompt('Add tags to filename (optional, e.g., "defense,agency")',''); const tagPart = extra ? '-'+ extra.replace(/\s+/g,'_').replace(/[^A-Za-z0-9_,-]/g,'') : ''; const name = `contacts-${when}${tagPart}.csv`; const blob = new Blob([lines.join('\n')], {type:'text/csv'}); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); URL.revokeObjectURL(a.href); }; }

  // Contact search controls
  const qInput = document.getElementById('contactQ'); const roleSel = document.getElementById('contactRole'); const matterSel = document.getElementById('contactMatter'); const hasEmail = document.getElementById('contactHasEmail'); const clearBtn = document.getElementById('contactClear');
  const debouncedRenderContacts = debounce(()=>{ renderContacts(); renderContactsTable(); }, 300);
  if(qInput){ qInput.addEventListener('input', debouncedRenderContacts); }
  if(roleSel){ roleSel.addEventListener('change', ()=>{ renderContacts(); renderContactsTable(); }); }
  if(matterSel){ matterSel.addEventListener('change', ()=>{ renderContacts(); renderContactsTable(); }); }
  if(hasEmail){ hasEmail.addEventListener('change', ()=>{ renderContacts(); renderContactsTable(); }); }
  if(clearBtn){ clearBtn.onclick = ()=>{ qInput.value=''; roleSel.value=''; matterSel.value=''; hasEmail.checked=false; renderContacts(); renderContactsTable(); }; }

  // New Contact form
  const newContact = $('#newContact');
  if(newContact){ newContact.onsubmit = async (e)=>{ e.preventDefault(); const fd=new FormData(e.target); const body=JSON.stringify({ name:fd.get('name'), roles:[fd.get('role')].filter(Boolean), org:fd.get('org'), emails:[fd.get('email')].filter(Boolean), matter_id:fd.get('matter_id') }); await getJSON(API()+"/contacts",{method:'POST', body}); await renderContacts(); await reloadContactsCache(); e.target.reset(); }; }

  // PDF preview modal is ready

  // Init
  loadPersonas(); renderBadges(); mountPersonaBars();
  loadMatters(); loadRecentMatters(); renderMulti('initial'); renderMulti('drafter'); renderMulti('editor');
  populateCaseSelect();
  renderContacts();
})();

  // ---- Multi-persona state ----
  const MultiPersona = {
    initial: { on:false, debate:false, selected:[] },
    drafter: { on:false, debate:false, selected:[] },
    editor:  { on:false, debate:false, selected:[] },
  };
  function getPersonasFor(role){
    return (PersonaCatalog[role] || []).map(o=>o.id);
  }
  function collectFormPayload(section){
    const out = {};
    const root = document.querySelector('section[data-view="'+section+'"]');
    if(!root) return out;
    root.querySelectorAll('input,select,textarea').forEach(el=>{
      if(!el.name) return;
      if(el.type==='checkbox') out[el.name] = !!el.checked;
      else out[el.name] = el.value;
    });
    return out;
  }
  function renderMulti(role){
    const barId = 'mp-'+role;
    const bar = document.getElementById(barId);
    const out = document.getElementById(barId+'-out');
    if(!bar) return;
    const st = MultiPersona[role];
    // wire controls
    const on = document.getElementById(barId+'-on');
    const de = document.getElementById(barId+'-debate');
    const all= document.getElementById(barId+'-all');
    const run= document.getElementById(barId+'-run');
    if(on){ on.checked = st.on; on.onchange = ()=>{ st.on = on.checked; out && (out.classList.add('hidden')); st.selected = []; }; }
    if(de){ de.checked = st.debate; de.onchange = ()=> st.debate = de.checked; }
    if(all){ all.onclick = ()=>{ st.selected = getPersonasFor(role).slice(); addChat && addChat('ai', 'Selected all personas for '+role+'.'); }; }
    if(run){ run.onclick = ()=> multiRun(role); }
  }
  async function multiRun(role){
    const st = MultiPersona[role];
    const personas = st.on ? (st.selected.length ? st.selected.slice() : getPersonasFor(role).slice()) : [ (Personas[role] || (getPersonasFor(role)[0]||'')) ];
    const matter_id = (document.querySelector('#chatForm input[name="matter_id"]')?.value || localStorage.getItem('lastMatterId') || '').trim();
    const payload = collectFormPayload(role);
    const out = document.getElementById('mp-'+role+'-out');
    if(out){ out.classList.remove('hidden'); out.innerHTML = '<div class="multi-card"><div class="head"><div class="title">Running…</div><div class="progress">0/'+personas.length+'</div></div></div>'; }
    const body = JSON.stringify({ tool: role, personas, payload, rounds: (MultiPersona[role].debate?2:1), debate: !!MultiPersona[role].debate, matter_id });
    const res = await getJSON(API()+"/tool/multi_run", {method:'POST', body});
    const syn = res.synthesis || {text:''};
    // Render synthesis
    let html = '<div class="multi-card synthesis"><div class="head"><div class="title">Synthesis (Concordia)</div></div><div class="body">'+ (syn.text||'') +'</div></div>';
    // Persona cards
    const runs = res.runs || {};
    Object.keys(runs).forEach(pid=>{
      html += '<div class="multi-card"><div class="head"><div class="title">'+pid+'</div></div><div class="body">'+ (runs[pid].text||'') +'</div></div>';
    });
    if(out){ out.innerHTML = html; }
    addChat && addChat('ai', 'Multi-persona synthesis saved to Memos.');
  }
