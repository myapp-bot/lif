// LifeOS V6 improvements: icons, guided execution, lists, timer controls and practical guide.
const goalIconSet=[['🎯','Cible'],['🏆','Réussite'],['🌱','Croissance'],['💼','Carrière'],['💰','Finances'],['❤️','Santé'],['🏠','Famille'],['📚','Études'],['✈️','Voyage'],['🧘','Équilibre'],['🤝','Relations'],['🎨','Créativité'],['🧠','Développement'],['🏃','Forme'],['🛠️','Projet'],['🧭','Direction'],['💡','Idée'],['🌍','Impact']];
const habitIconSet=[['🔁','Routine'],['💧','Hydratation'],['🏃','Sport'],['📖','Lecture'],['🧘','Méditation'],['💊','Santé'],['😴','Sommeil'],['✍️','Écriture'],['🧹','Maison'],['🙏','Prière'],['🥗','Alimentation'],['🎸','Pratique'],['🚶','Marche'],['💰','Épargne'],['🧠','Apprentissage'],['🌳','Nature'],['📵','Déconnexion'],['📅','Planification']];
function iconPickerHtml(field,value,items){
 const selected=value||items[0][0];
 return '<div class="iconPicker" role="group" aria-label="Choisir une icône">'+items.map(([emoji,label])=>'<button type="button" class="iconPick '+(selected===emoji?'selected':'')+'" data-for="'+field+'" data-icon="'+esc(emoji)+'" title="'+esc(label)+'" aria-label="'+esc(label)+'" onclick="setEntityIcon(\''+field+'\',\''+esc(emoji)+'\')">'+emoji+'</button>').join('')+'</div><input type="hidden" id="'+field+'" value="'+esc(selected)+'">';
}
function setEntityIcon(field,value){
 const input=$('#'+field);if(!input)return;input.value=value;
 document.querySelectorAll('[data-for="'+field+'"]').forEach(b=>b.classList.toggle('selected',b.dataset.icon===value));
}
function goalWizard(g){
 let html=goalWizardBaseV6(g);
 html=html.replace('</div><div><label>Domaine de vie',iconPickerHtml('g_icon',g.icon,goalIconSet)+'</div><div><label>Domaine de vie');
 html=html.replace('<p class="muted">Après création, lie des projets, tâches et habitudes à cet objectif.</p>','<div class="formgrid" style="margin-top:14px"><div class="span2"><label>Créer un projet lié (facultatif)</label><input id="g_project_title" maxlength="160" placeholder="Ex. Préparer une course de 5 km"></div><div class="span2"><label>Jalons de ce projet — une ligne par jalon</label><textarea id="g_milestones" placeholder="Courir 2 km sans arrêt — semaine 3&#10;Courir 4 km — semaine 6"></textarea></div></div><p class="muted">Tu peux créer ces éléments maintenant ou plus tard dans la fiche de l’objectif.</p>');
 html=html.replace('</textarea><div class="card flat" style="margin-top:14px">','</textarea><label style="margin-top:14px">Créer des tâches liées — une ligne par action</label><textarea id="g_action_tasks" placeholder="Préparer mes chaussures la veille&#10;Courir 25 minutes lundi"></textarea><div class="card flat" style="margin-top:14px">');
 return html;
}
function saveGoal(id){
 const title=$('#g_title').value.trim(),mode=$('#g_progress').value;
 if(!title){goalStep=0;showGoalStep();return toast('Décris ton objectif');}
 const start=Number($('#g_start').value),target=Number($('#g_target').value),value=Number($('#g_current').value);
 if(![start,target,value].every(Number.isFinite)||mode==='focus'&&target<=0)return toast('Mesures invalides ; la cible focus doit être positive');
 const old=S.goals.find(g=>g.id===id),projectTitle=$('#g_project_title')?.value.trim()||'';
 const milestoneLines=cleanLines($('#g_milestones')?.value||''),actionLines=cleanLines($('#g_action_tasks')?.value||'');
 if(milestoneLines.length>50||actionLines.length>50)return toast('Maximum 50 jalons et 50 tâches par objectif');
 const g={...old,id:id||uid(),title,icon:$('#g_icon')?.value||old?.icon||'🎯',area:$('#g_area').value,why:$('#g_why').value,deadline:$('#g_deadline').value,priority:$('#g_priority').value,start,target,current:value,unit:$('#g_unit').value,status:$('#g_status').value,obstacles:$('#g_obstacles').value,skills:$('#g_skills').value,support:$('#g_support').value,plan:$('#g_plan').value,daily:$('#g_daily').value,progressMode:mode,habitWindow:Number($('#g_window').value),history:old?.history||[],createdAt:old?.createdAt||iso()};
 const i=S.goals.findIndex(x=>x.id===id);if(i>=0)S.goals[i]=g;else S.goals.push(g);
 let projectId='';
 if(projectTitle){projectId=uid();S.projects.push({id:projectId,title:projectTitle,goalId:g.id,status:'active',deadline:g.deadline||'',notes:'Créé depuis le plan de l’objectif « '+g.title+' ».',milestones:milestoneLines.map(title=>({id:uid(),title,due:'',done:false}))});}
 const existing=new Set(S.tasks.filter(t=>t.goalId===g.id).map(t=>t.title.toLocaleLowerCase()));
 for(const taskTitle of uniqueLines(actionLines))if(!existing.has(taskTitle.toLocaleLowerCase()))S.tasks.push({id:uid(),title:taskTitle,goalId:g.id,projectId,due:'',dueTime:'',priority:'medium',status:'todo',estimate:25,notes:'',repeat:'none',subtasks:[],createdAt:iso(),completedAt:null});
 save();closeModal();render();toast('Objectif enregistré'+(projectId?' avec son projet':''));
}
function cleanLines(text){return String(text||'').split(/\r?\n/).map(x=>x.trim().replace(/^[-*•]\s*/, '')).filter(Boolean);}
function uniqueLines(lines){return lines.filter((x,i)=>lines.findIndex(y=>y.toLocaleLowerCase()===x.toLocaleLowerCase())===i);}
let goalFilters={q:'',status:'active',area:'all',priority:'all',sort:'priority'};
function filteredGoals(){
 let rows=S.goals.filter(g=>(!goalFilters.q||[g.title,g.why,g.area].join(' ').toLocaleLowerCase().includes(goalFilters.q.toLocaleLowerCase()))&&(goalFilters.status==='all'||g.status===goalFilters.status)&&(goalFilters.area==='all'||g.area===goalFilters.area)&&(goalFilters.priority==='all'||g.priority===goalFilters.priority));
 const rank={high:0,medium:1,low:2},cmp={title:(a,b)=>a.title.localeCompare(b.title),priority:(a,b)=>(rank[a.priority]??3)-(rank[b.priority]??3),deadline:(a,b)=>(a.deadline||'9999').localeCompare(b.deadline||'9999'),progress:(a,b)=>pctGoal(b)-pctGoal(a),progressLow:(a,b)=>pctGoal(a)-pctGoal(b)};
 return rows.sort(cmp[goalFilters.sort]||cmp.priority);
}
function renderGoals(){
 const areas=[...new Set([...(S.settings.domains||[]),...S.goals.map(g=>g.area).filter(Boolean)])];
 return '<div class="sectionhead"><div><div class="eyebrow">Clarifier puis agir</div><h2>Mes objectifs</h2><small class="muted">Choisis un résultat important, puis transforme-le en projets et prochaines actions.</small></div><button class="btn primary" onclick="openGoal()">＋ Nouvel objectif</button></div><div class="card flat filters"><input aria-label="Rechercher un objectif" placeholder="Rechercher un objectif…" value="'+esc(goalFilters.q)+'" oninput="goalFilters.q=this.value;refreshGoalCards()"><select aria-label="Filtrer par statut" onchange="goalFilters.status=this.value;refreshGoalCards()">'+[['active','Actifs'],['paused','En pause'],['done','Atteints'],['all','Tous les statuts']].map(([v,l])=>'<option value="'+v+'" '+(goalFilters.status===v?'selected':'')+'>'+l+'</option>').join('')+'</select><select aria-label="Filtrer par domaine" onchange="goalFilters.area=this.value;refreshGoalCards()"><option value="all">Tous les domaines</option>'+areas.map(x=>'<option value="'+esc(x)+'" '+(goalFilters.area===x?'selected':'')+'>'+esc(x)+'</option>').join('')+'</select><select aria-label="Filtrer par priorité" onchange="goalFilters.priority=this.value;refreshGoalCards()">'+[['all','Toutes priorités'],['high','Essentielle'],['medium','Importante'],['low','Secondaire']].map(([v,l])=>'<option value="'+v+'" '+(goalFilters.priority===v?'selected':'')+'>'+l+'</option>').join('')+'</select><select aria-label="Trier les objectifs" onchange="goalFilters.sort=this.value;refreshGoalCards()">'+[['priority','Priorité'],['deadline','Échéance'],['progress','Progression · forte d’abord'],['progressLow','Progression · faible d’abord'],['title','Nom']].map(([v,l])=>'<option value="'+v+'" '+(goalFilters.sort===v?'selected':'')+'>'+l+'</option>').join('')+'</select></div><p class="muted" id="goalCount">'+filteredGoals().length+' objectif(s)</p><div class="grid g2" id="goalCards">'+(filteredGoals().map(goalCard).join('')||empty('Crée ton premier objectif significatif.'))+'</div>';
}
function refreshGoalCards(){const a=filteredGoals();$('#goalCards').innerHTML=a.map(goalCard).join('')||empty('Aucun objectif pour ces filtres.');$('#goalCount').textContent=a.length+' objectif(s)';}
function goalCard(g){
 const p=pctGoal(g),ts=S.tasks.filter(t=>t.goalId===g.id);
 return '<article class="card goalcard"><div class="goalHeading"><span class="tag">'+esc(g.area||'Personnel')+'</span><strong>'+p+'%</strong></div><button class="goalTitle" onclick="goalDetails(\''+g.id+'\')"><span class="entityIcon" aria-hidden="true">'+esc(g.icon||'🎯')+'</span>'+esc(g.title)+'</button><p class="muted caption">'+(g.deadline?'Échéance '+esc(g.deadline):'Sans échéance')+' · '+({manual:'Mesure manuelle',tasks:'Tâches liées',habits:'Régularité',focus:'Minutes focus'}[g.progressMode]||'Mesure manuelle')+'</p><div class="progress"><span style="width:'+p+'%"></span></div><div class="linked" style="margin:14px 0"><span>'+ts.filter(t=>t.status==='done').length+'/'+ts.length+' tâches</span><span>'+S.projects.filter(x=>x.goalId===g.id).length+' projets</span><span>'+S.habits.filter(h=>h.goalId===g.id).length+' habitudes</span></div><div class="miniActions"><button onclick="goalDetails(\''+g.id+'\')">Plan d’action →</button>'+iconButton('edit','Modifier l’objectif','openGoal(\''+g.id+'\')')+iconButton('trash','Mettre à la corbeille',"del('goal','"+g.id+"')")+'</div></article>';
}
function goalDetailsBasic(id){
 const g=S.goals.find(g=>g.id===id);if(!g)return;
 const relatedProjects=S.projects.filter(p=>p.goalId===id);
 modal(esc((g.icon||'🎯')+' '+g.title),'<div class="eyebrow">'+esc(g.area)+' · '+pctGoal(g)+' %</div><p style="margin-top:12px">'+esc(g.why||'Précise pourquoi cet objectif compte pour toi.')+'</p><div class="chips"><button class="btn primary" onclick="openTask(\'\',{goalId:\''+id+'\'})">+ Action</button><button class="btn" onclick="openProject(\'\',{goalId:\''+id+'\'})">+ Projet</button><button class="btn" onclick="openHabit(\'\',{goalId:\''+id+'\'})">+ Habitude</button><button class="btn" onclick="openLinked(\''+id+'\')">Lier des éléments existants</button></div><h3 style="margin-top:24px">Plan · créer un projet et ses jalons</h3><div class="formgrid"><div class="span2"><label>Nom du projet</label><input id="goalProjectTitle" placeholder="Ex. Préparer une course de 5 km"></div><div class="span2"><label>Jalons — une ligne par jalon</label><textarea id="goalMilestones" placeholder="Courir 2 km — semaine 3&#10;Courir 4 km — semaine 6"></textarea></div></div><button class="btn" style="margin-top:10px" onclick="createGoalProject(\''+id+'\')">Créer le projet et ses jalons</button><p class="muted caption">'+relatedProjects.length+' projet(s) déjà lié(s). Après création, ouvre le projet pour ajouter dates et suivre ses jalons.</p><h3 style="margin-top:24px">Plan · transformer des étapes en tâches</h3><p class="muted">Une ligne par tâche. Les tâches déjà liées ne seront pas dupliquées.</p><textarea id="planLines">'+esc(g.plan||'')+'</textarea><button class="btn" style="margin-top:10px" onclick="createPlanTasks(\''+id+'\',\'planLines\')">Créer les tâches de mon plan</button><h3 style="margin-top:24px">Action · prochaines étapes</h3><textarea id="goalActions">'+esc(g.daily||'')+'</textarea><label>Associer au projet (facultatif)</label><select id="goalTaskProject"><option value="">Sans projet</option>'+relatedProjects.map(p=>'<option value="'+p.id+'">'+esc(p.title)+'</option>').join('')+'</select><button class="btn" style="margin-top:10px" onclick="createPlanTasks(\''+id+'\',\'goalActions\',\'goalTaskProject\')">Créer les tâches d’action</button><h3 style="margin-top:24px">Actions liées</h3><div class="list">'+taskList(S.tasks.filter(t=>t.goalId===id))||empty('Aucune action liée')+'</div><h3 style="margin-top:24px">Historique de progression</h3>'+goalHistoryChart(g)+'<div class="grid g2" style="margin-top:20px"><div><h4>Obstacles</h4><p>'+esc(g.obstacles||'—')+'</p><h4>Compétences</h4><p>'+esc(g.skills||'—')+'</p></div><div><h4>Soutien</h4><p>'+esc(g.support||'—')+'</p><h4>Action régulière</h4><p>'+esc(g.daily||'—')+'</p></div></div>','<button class="btn" onclick="openGoal(\''+id+'\')">Modifier</button><button class="btn primary" onclick="closeModal()">Fermer</button>',true);
}
function createGoalProject(gid){
 const g=S.goals.find(g=>g.id===gid),title=$('#goalProjectTitle').value.trim(),lines=cleanLines($('#goalMilestones').value);
 if(!title)return toast('Donne un nom au projet');if(lines.length>50)return toast('Maximum 50 jalons');
 const p={id:uid(),title,goalId:gid,status:'active',deadline:g?.deadline||'',notes:'Projet créé depuis l’objectif « '+(g?.title||'')+' ».',milestones:lines.map(title=>({id:uid(),title,due:'',done:false}))};
 S.projects.push(p);save();goalDetails(gid);toast('Projet créé avec '+lines.length+' jalon(s)');
}
function createPlanTasks(gid,sourceId='planLines',projectSelectId=''){
 const lines=cleanLines($('#'+sourceId)?.value||'');if(!lines.length)return toast('Ajoute au moins une action');if(lines.length>50)return toast('Maximum 50 actions par création');
 const existing=new Set(S.tasks.filter(t=>t.goalId===gid).map(t=>t.title.toLocaleLowerCase())),fresh=uniqueLines(lines).filter(x=>!existing.has(x.toLocaleLowerCase()));
 if(!fresh.length)return toast('Ces actions sont déjà liées à cet objectif');
 const projectId=projectSelectId?$('#'+projectSelectId).value:'';
 if(projectId&&!S.projects.some(p=>p.id===projectId&&p.goalId===gid))return toast('Choisis un projet lié à cet objectif');
 for(const title of fresh)S.tasks.push({id:uid(),title,goalId:gid,projectId,due:$('#'+sourceId+'_due')?.value||'',dueTime:'',priority:$('#'+sourceId+'_priority')?.value||'medium',status:'todo',estimate:25,notes:'',repeat:'none',subtasks:[],createdAt:iso(),completedAt:null});
 save();goalDetails(gid);toast(fresh.length+' tâche(s) créée(s)');
}
function openHabit(id='',preset={}){
 openHabitBaseV6(id,preset);
 const h=S.habits.find(x=>x.id===id)||{...preset,icon:preset.icon||'🔁'};
 const target=$('#h_title');if(!target)return;
 target.insertAdjacentHTML('afterend',iconPickerHtml('h_icon',h.icon,habitIconSet));
}
function saveHabit(id){
 const icon=$('#h_icon')?.value||S.habits.find(h=>h.id===id)?.icon||'🔁',title=$('#h_title')?.value.trim(),before=new Set(S.habits.map(h=>h.id));
 saveHabitBaseV6(id);
 const row=S.habits.find(h=>h.id===id)||S.habits.find(h=>!before.has(h.id)&&h.title===title);
 if(row){row.icon=icon;save();render();}
}
let habitFilters={q:'',status:'active',freq:'all',sort:'streak'};
function filteredHabits(){
 let rows=S.habits.filter(h=>(!habitFilters.q||[h.title,h.unit].join(' ').toLocaleLowerCase().includes(habitFilters.q.toLocaleLowerCase()))&&(habitFilters.status==='all'||(habitFilters.status==='paused'?(!h.active||pausedOn(h,iso())):(h.active&&!pausedOn(h,iso()))))&&(habitFilters.freq==='all'||h.freq===habitFilters.freq));
 const rate=h=>{const p=habitPeriod(h,lastN(30)[0],iso());return p.expected?p.done/p.expected:0};
 return rows.sort((a,b)=>habitFilters.sort==='name'?a.title.localeCompare(b.title):habitFilters.sort==='rate'?rate(b)-rate(a):streak(b.id)-streak(a.id));
}
function renderHabits(){
 return '<div class="sectionhead"><div><div class="eyebrow">Répéter avec intention</div><h2>Mes habitudes</h2><small class="muted">Choisis un rythme réaliste et suis tes progrès sans chercher la perfection.</small></div><button class="btn primary" onclick="openHabit()">+ Nouvelle habitude</button></div><div class="card flat filters"><input aria-label="Rechercher une habitude" placeholder="Rechercher une habitude…" value="'+esc(habitFilters.q)+'" oninput="habitFilters.q=this.value;refreshHabitCards()"><select aria-label="Filtrer les habitudes" onchange="habitFilters.status=this.value;refreshHabitCards()">'+[['active','Actives'],['paused','En pause'],['all','Toutes']].map(([v,l])=>'<option value="'+v+'" '+(habitFilters.status===v?'selected':'')+'>'+l+'</option>').join('')+'</select><select aria-label="Filtrer par fréquence" onchange="habitFilters.freq=this.value;refreshHabitCards()">'+[['all','Toutes fréquences'],['daily','Quotidienne'],['weekdays','Jours ouvrés'],['days','Jours choisis'],['weekly','Objectif hebdomadaire'],['monthly','Mensuelle']].map(([v,l])=>'<option value="'+v+'" '+(habitFilters.freq===v?'selected':'')+'>'+l+'</option>').join('')+'</select><select aria-label="Trier les habitudes" onchange="habitFilters.sort=this.value;refreshHabitCards()">'+[['streak','Série'],['rate','Régularité · forte d’abord'],['name','Nom']].map(([v,l])=>'<option value="'+v+'" '+(habitFilters.sort===v?'selected':'')+'>'+l+'</option>').join('')+'</select></div><p class="muted" id="habitCount">'+filteredHabits().length+' habitude(s)</p><div class="list" id="habitCards">'+filteredHabits().map(h=>{const p=habitPeriod(h,lastN(30)[0],iso());return '<div class="card">'+habitList([h])+'<div class="linked" style="margin-top:12px"><span>Série : '+streak(h.id)+' '+(h.freq==='weekly'?'semaines':'jours prévus')+'</span><span>30 jours : '+p.done+'/'+p.expected+' réalisations attendues</span><span>'+focusFor('habit',h.id)+' min focus</span></div></div>';}).join('')||empty('Aucune habitude pour ces filtres.')+'</div>';
}
function refreshHabitCards(){const a=filteredHabits();$('#habitCards').innerHTML=a.map(h=>{const p=habitPeriod(h,lastN(30)[0],iso());return '<div class="card">'+habitList([h])+'<div class="linked" style="margin-top:12px"><span>Série : '+streak(h.id)+' '+(h.freq==='weekly'?'semaines':'jours prévus')+'</span><span>30 jours : '+p.done+'/'+p.expected+' réalisations attendues</span><span>'+focusFor('habit',h.id)+' min focus</span></div></div>';}).join('')||empty('Aucune habitude pour ces filtres.');$('#habitCount').textContent=a.length+' habitude(s)';}
function habitList(arr){
 return arr.map(h=>{const planned=scheduled(h,iso()),paused=pausedOn(h,iso())||!h.active;return '<article class="item habitrow"><div><b><span class="entityIcon" aria-hidden="true">'+esc(h.icon||'🔁')+'</span>'+esc(h.title)+'</b><small class="muted">'+freqText(h)+' · '+habitValue(h.id,iso())+'/'+(h.type==='check'?1:h.target)+' '+esc(h.type==='timer'?'min':h.unit)+'</small><div class="weekdots">'+last7().map(d=>'<button class="daydot '+(habitDone(h.id,d)?'done':scheduled(h,d)?'':'unplanned')+'" title="'+d+' : '+habitValue(h.id,d)+'" aria-label="Réalisation du '+d+'" onclick="logHabit(\''+h.id+'\');$(\'#log_date\').value=\''+d+'\';$(\'#log_value\').value=habitValue(\''+h.id+'\',\''+d+'\')">'+(habitDone(h.id,d)?'✓':scheduled(h,d)?new Date(d+'T12:00').toLocaleDateString('fr',{weekday:'narrow'}):'—')+'</button>').join('')+'</div>'+(paused?'<span class="tag">En pause</span>':!planned?'<span class="tag">Non prévue aujourd’hui</span>':'')+'</div><div class="miniActions">'+(h.type==='timer'?iconButton('focus','Démarrer le minuteur','habitTimer(\''+h.id+'\')'):'')+'<button onclick="logHabit(\''+h.id+'\')">Saisir</button>'+iconButton('edit','Modifier','openHabit(\''+h.id+'\')')+'<button onclick="toggleHabitPause(\''+h.id+'\')">'+(paused?'Reprendre':'Pause')+'</button>'+iconButton('trash','Corbeille','del(\'habit\',\''+h.id+'\')')+'</div></article>';}).join('');
}
let milestoneFilters={};
function milestoneState(id){return milestoneFilters[id]||(milestoneFilters[id]={q:'',status:'all',sort:'date'});}
function milestoneRows(pid){
 const p=S.projects.find(x=>x.id===pid);if(!p)return empty('Projet introuvable');const f=milestoneState(pid);
 let rows=p.milestones.filter(m=>(!f.q||m.title.toLocaleLowerCase().includes(f.q.toLocaleLowerCase()))&&(f.status==='all'||(f.status==='done'?m.done:!m.done)));
 rows.sort((a,b)=>f.sort==='title'?a.title.localeCompare(b.title):(a.due||'9999').localeCompare(b.due||'9999')||a.title.localeCompare(b.title));
 return rows.map(m=>'<div class="item"><button class="check '+(m.done?'done':'')+'" aria-label="'+(m.done?'Marquer non terminé':'Terminer le jalon')+'" onclick="toggleMilestone(\''+pid+'\',\''+m.id+'\')">'+(m.done?'✓':'')+'</button><div class="grow"><b>'+esc(m.title)+'</b><small>'+esc(m.due||'Sans date')+'</small></div><button class="btn" onclick="editMilestone(\''+pid+'\',\''+m.id+'\')">Modifier</button></div>').join('')||empty('Aucun jalon ne correspond au filtre.');
}
function projectDetails(id){
 projectDetailsBaseV6(id);
 const heads=[...$('#modal').querySelectorAll('h3')],heading=heads.find(h=>h.textContent.trim()==='Jalons');if(!heading)return;
 const oldList=heading.nextElementSibling;if(!oldList)return;
 const f=milestoneState(id);
 heading.insertAdjacentHTML('afterend','<div class="milestoneFilters"><input aria-label="Rechercher un jalon" placeholder="Rechercher un jalon…" value="'+esc(f.q)+'" oninput="setMilestoneFilter(\''+id+'\',\'q\',this.value)"><select aria-label="Filtrer les jalons" onchange="setMilestoneFilter(\''+id+'\',\'status\',this.value)">'+[['all','Tous les jalons'],['open','À faire'],['done','Terminés']].map(([v,l])=>'<option value="'+v+'" '+(f.status===v?'selected':'')+'>'+l+'</option>').join('')+'</select><select aria-label="Trier les jalons" onchange="setMilestoneFilter(\''+id+'\',\'sort\',this.value)">'+[['date','Échéance'],['title','Nom']].map(([v,l])=>'<option value="'+v+'" '+(f.sort===v?'selected':'')+'>'+l+'</option>').join('')+'</select></div>');
 oldList.id='milestoneRows';oldList.innerHTML=milestoneRows(id);
}
function setMilestoneFilter(id,key,value){milestoneState(id)[key]=value;$('#milestoneRows').innerHTML=milestoneRows(id);}
function renderMore(){
 return '<div class="pageIntro"><div class="eyebrow">Tous tes espaces</div><h2>Que souhaites-tu faire ?</h2><p class="muted">Tes trois raccourcis favoris se règlent dans Paramètres. Le guide t’explique un parcours simple pour commencer.</p></div><div class="grid g2">'+navs.map(([id,,name])=>'<button class="card menuTile" onclick="go(\''+id+'\');if([\'settings\',\'data\'].includes(\''+id+'\'))refreshNative()">'+icon(id)+'<b>'+esc(name)+'</b>'+icon('arrow')+'</button>').join('')+'<button class="card menuTile" onclick="go(\'guide\')">'+icon('journal')+'<b>Guide pratique</b>'+icon('arrow')+'</button></div>';
}
function renderGuideShort(){
 return '<div class="pageIntro"><div class="eyebrow">Un parcours simple, sans tout faire d’un coup</div><h2>Guide pratique LifeOS</h2><p class="muted">Pars d’un résultat important, transforme-le en étapes concrètes et réserve du temps pour les réaliser.</p></div><section class="card guideIntro"><h3>Le fil de l’application</h3><p><b>Objectif → projet → jalons → tâches → créneaux → focus → revue.</b> Les habitudes soutiennent le parcours ; le journal et les statistiques t’aident à ajuster.</p><p class="muted">Tu peux commencer par une seule tâche ou une seule habitude. Le guide est une aide, pas une obligation.</p></section><div class="guideSteps"><article class="card guideStep"><span class="guideNumber">1</span><div><h3>Choisis un résultat clair</h3><p>Dans <b>Objectifs</b>, décris ce que tu veux obtenir, pourquoi cela compte et à quelle date tu veux faire le point. Choisis une icône qui te le rappelle.</p><div class="example"><b>Exemple :</b> « Courir 5 km sans m’arrêter d’ici 8 semaines », plutôt que « faire plus de sport ».</div></div></article><article class="card guideStep"><span class="guideNumber">2</span><div><h3>Écris le plan et découpe-le</h3><p>Dans le formulaire de l’objectif, l’onglet <b>Plan</b> peut créer un projet et ses jalons. Dans <b>Action</b>, ajoute les prochaines tâches, une par ligne. Dans la fiche, tu peux encore créer des jalons et convertir un plan en tâches.</p><div class="example"><b>Exemple :</b> projet « Préparation 5 km » ; jalons « 2 km en semaine 3 », puis « 4 km en semaine 6 » ; tâches « choisir un parcours », « courir 25 min lundi ».</div></div></article><article class="card guideStep"><span class="guideNumber">3</span><div><h3>Décide de la priorité avant de remplir la journée</h3><p>LifeOS reprend une idée de Brian Tracy : repérer l’action qui rapproche le plus du résultat important et commencer par elle. Dans <b>Tâches</b>, règle la priorité, puis l’échéance et l’heure. Garde la liste du jour réaliste.</p><div class="example"><b>Exemple :</b> si l’objectif est de préparer un examen, faire un exercice d’annale peut compter davantage que ranger ses notes.</div></div></article><article class="card guideStep"><span class="guideNumber">4</span><div><h3>Réserve un créneau et concentre-toi</h3><p>Dans <b>Calendrier</b>, place l’action. Ouvre <b>Focus</b>, associe le minuteur à la tâche, puis fais une seule chose pendant le temps choisi. Le réglage courant par défaut est 25 min de travail et 5 min de pause, modifiable dans les réglages.</p><div class="example"><b>Exemple :</b> 25 minutes sur « rédiger le plan », 5 minutes de pause, puis décide si tu continues.</div></div></article><article class="card guideStep"><span class="guideNumber">5</span><div><h3>Installe un rythme soutenable</h3><p>Crée dans <b>Habitudes</b> une routine précise et adaptée à tes contraintes. Tu peux choisir des jours, une cible hebdomadaire ou des dates du mois. Une pause est possible : reprendre compte plus que viser une série parfaite.</p><div class="example"><b>Exemple :</b> « Lire 10 minutes, lundi à vendredi » ; règle le suivi et la fréquence selon ton usage.</div></div></article><article class="card guideStep"><span class="guideNumber">6</span><div><h3>Fais un point bref, puis ajuste</h3><p>Le soir, coche les actions réalisées et note une idée dans le <b>Journal</b>. Une fois par semaine, ouvre la <b>Revue</b> : qu’est-ce qui a avancé, qu’est-ce qui a bloqué, quelle est la prochaine action essentielle ? Les statistiques décrivent les données enregistrées ; elles ne jugent pas tes progrès.</p><div class="example"><b>Exemple :</b> si les entraînements du soir ne passent pas, essaie un créneau plus court le matin.</div></div></article></div><section class="card"><h3>La méthode en une minute</h3><ol><li>Choisis un objectif important et mesurable.</li><li>Crée un projet avec quelques jalons, puis des tâches courtes.</li><li>Choisis une priorité et réserve-lui un créneau.</li><li>Fais une séance de focus, puis enregistre ce qui a réellement été fait.</li><li>Revois le plan chaque semaine et adapte-le sans culpabiliser.</li></ol><p class="muted caption">Cette présentation reformule des principes de planification, de priorisation et de passage à l’action associés à Brian Tracy. Elle n’est pas un conseil personnalisé ni un texte reproduit de ses ouvrages.</p><div class="chips"><a class="btn" href="https://www.briantracy.com/blog/time-management/productivity-tips/" target="_blank" rel="noopener">Brian Tracy · Productivité</a><a class="btn" href="https://www.briantracy.com/blog/time-management/the-truth-about-frogs/" target="_blank" rel="noopener">Brian Tracy · Eat That Frog</a></div></section>';
}
function base_render(){
 const f={today:renderToday,goals:renderGoals,projects:renderProjects,tasks:renderTasks,habits:renderHabits,planner:renderPlanner,focus:renderFocus,journal:renderJournal,stats:renderStats,coach:renderCoach,data:renderData,settings:renderSettings,more:renderMore,guide:renderGuide}[current];
 $('#content').innerHTML=f?f():'';
}
function updateClock(){const x=$('#focusClock');if(x)x.textContent=fmt(focusRemain);}
function toggleFocus(){
 if(!focusSession){
  focusSelection=$('#focusLink')?.value||focusSelection||'free:';
  focusSession={id:uid(),selection:focusSelection,seconds:Math.max(1,Number(focusRemain)||1),remaining:Math.max(1,Number(focusRemain)||1),mode:focusMode,started:Date.now(),running:false};
 }
 if(focusRunning||focusSession.running){
  if(focusSession.running)focusRemain=Math.max(0,Math.ceil((focusSession.end-Date.now())/1000));
  if(focusRemain<=0){completeFocus();return;}
  focusSession.remaining=focusRemain;focusSession.running=false;focusRunning=false;clearInterval(focusInt);focusInt=null;
 }else{
  const remain=Math.max(0,Number(focusSession.remaining??focusRemain)||0);
  if(remain<=0){completeFocus();return;}
  focusRemain=remain;focusSession.end=Date.now()+remain*1000;focusSession.running=true;focusRunning=true;clearInterval(focusInt);focusInt=setInterval(tickFocus,250);
 }
 persistFocus();updateClock();render();syncFocusAlarm();
}
function elapsedFocusSeconds(){if(!focusSession)return 0;const remain=focusSession.running?Math.max(0,Math.ceil((focusSession.end-Date.now())/1000)):focusRemain;return Math.max(0,(Number(focusSession.seconds)||0)-remain);}
function resetFocus(){
 const elapsed=elapsedFocusSeconds();if(elapsed>0&&!confirm('Réinitialiser et abandonner les '+Math.ceil(elapsed/60)+' minute(s) déjà écoulées ?'))return;
 clearInterval(focusInt);focusInt=null;focusSession=null;focusRunning=false;focusRemain=focusDuration(focusMode);persistFocus();syncFocusAlarm();render();toast('Minuteur réinitialisé');
}
function finishPartialFocus(){
 if(!focusSession)return toast('Démarre une session avant de terminer.'); if(focusSession.mode!=='work'){completeFocus(true);return;}
 if(focusSession.running){focusRemain=Math.max(0,Math.ceil((focusSession.end-Date.now())/1000));if(focusRemain<=0){completeFocus();return;}focusSession.remaining=focusRemain;focusSession.running=false;focusRunning=false;clearInterval(focusInt);focusInt=null;}
 const seconds=elapsedFocusSeconds();if(seconds<1)return toast('Quelques secondes doivent être écoulées avant d’enregistrer.');
 completeFocus(true);
}
function completeFocus(partial=false){
 const r=focusSession;if(!r)return;
 clearInterval(focusInt);focusInt=null;focusRunning=false;
 const total=Math.max(0,Number(r.seconds)||0),seconds=partial?elapsedFocusSeconds():total,minutes=Math.round(seconds/60*100)/100;
 if(partial&&r.mode==='work'&&seconds<1)return toast('Quelques secondes doivent être écoulées avant d’enregistrer.');
 const [type,id]=String(r.selection||'free:').split(':'),isWork=r.mode==='work';
 if(isWork&&minutes>0&&!S.focus.some(f=>f.id===r.id)){
  const key={task:'tasks',habit:'habits',project:'projects',goal:'goals'}[type],x=key?S[key].find(x=>x.id===id):null;
  const projectId=type==='project'?id:(x?.projectId||''),goalId=type==='goal'?id:(x?.goalId||S.projects.find(p=>p.id===projectId)?.goalId||'');
  S.focus.push({id:r.id,date:partial?iso():iso(new Date(r.end||Date.now())),minutes,type,refId:id||'',label:x?.title||'Session libre',projectId,goalId,partial:!!partial});
  if(type==='habit'&&x?.type==='timer'){S.habitLogs[id]??={};S.habitLogs[id][iso()]={value:Math.round((habitValue(id,iso())+minutes)*100)/100,at:Date.now()};}
  if(!partial)S.settings.completedFocusCount=(S.settings.completedFocusCount||0)+1;save();
 }
 const wasLate=!!r.running&&Date.now()-(r.end||Date.now())>10000;
 focusSession=null;focusRunning=false;persistFocus();
 focusMode=isWork&&!partial?((S.settings.completedFocusCount||0)%(S.settings.cycles||4)===0?'long':'break'):'work';
 focusRemain=focusDuration(focusMode);finishTone();syncFocusAlarm();
 toast(partial?'Temps réalisé enregistré':isWork?'Session enregistrée':'Pause terminée');render();
 if(S.settings.autoCycles&&!partial&&!wasLate&&!document.hidden)setTimeout(()=>{if(!focusSession)toggleFocus();},500);
}

function openTask(id='',preset={}){openTaskBasic(id,preset);const t=S.tasks.find(t=>t.id===id)||preset;$('#f_project').insertAdjacentHTML('afterend','<label style="margin-top:12px">Jalon</label><select id="f_milestone"></select>');updateTaskMilestones(t.milestoneId);}
function updateTaskMilestones(selected=''){const el=$('#f_milestone');if(!el)return;const p=S.projects.find(p=>p.id===$('#f_project').value);el.innerHTML='<option value="">Sans jalon</option>'+(p?.milestones||[]).map(m=>'<option value="'+m.id+'">'+esc(m.title)+'</option>').join('');el.value=selected||'';}
function goalDetails(id){goalDetailsBasic(id);const g=S.goals.find(g=>g.id===id);if(!g)return;const ps=S.projects.filter(p=>p.goalId===id);$('#modal .modalBody').insertAdjacentHTML('beforeend','<section class="card" style="margin-top:20px"><h3>Gérer le plan existant</h3>'+ps.map(p=>'<div class="item"><div class="grow"><b>'+esc(p.title)+'</b><small>'+p.milestones.length+' jalons</small></div><button class="btn" onclick="projectDetails(\''+p.id+'\')">Ouvrir</button><button class="btn" onclick="editMilestone(\''+p.id+'\')">+ Jalon daté</button><button class="btn" onclick="openTask(\'\',{goalId:\''+id+'\',projectId:\''+p.id+'\'})">+ Tâche détaillée</button></div>'+p.milestones.map(m=>'<div class="item"><div class="grow">'+esc(m.title)+' · '+esc(m.due||'Sans date')+'</div><button class="btn" onclick="editMilestone(\''+p.id+'\',\''+m.id+'\')">Modifier</button><button class="btn" onclick="openTask(\'\',{goalId:\''+id+'\',projectId:\''+p.id+'\',milestoneId:\''+m.id+'\'})">+ Tâche</button></div>').join('')).join('')+'</section>');for(const field of ['planLines','goalActions']){const el=$('#'+field);el.insertAdjacentHTML('afterend','<div class="formgrid"><div><label>Échéance des tâches créées</label><input type="date" id="'+field+'_due"></div><div><label>Priorité</label><select id="'+field+'_priority"><option value="high">Haute</option><option value="medium" selected>Normale</option><option value="low">Basse</option></select></div></div>');}}
let projectFilters={q:'',status:'all',goal:'all',sort:'date',view:'projects'};
function renderProjects(){return '<div class="sectionhead"><div><div class="eyebrow">Structurer et suivre</div><h2>Projets & jalons</h2></div><button class="btn primary" onclick="openProject()">+ Nouveau projet</button></div><div class="card flat filters"><input aria-label="Rechercher projets et jalons" placeholder="Rechercher…" value="'+esc(projectFilters.q)+'" oninput="projectFilters.q=this.value;refreshProjects()">'+projectSelect('view',[['projects','Projets'],['milestones','Tous les jalons']])+projectSelect('status',[['all','Tous les statuts'],['active','Actifs / à faire'],['paused','En pause'],['done','Terminés'],['late','En retard']])+projectSelect('goal',[['all','Tous les objectifs'],...S.goals.map(g=>[g.id,g.title])])+projectSelect('sort',[['date','Échéance'],['title','Nom']])+'</div><div id="projectsResults" class="list" style="margin-top:16px">'+projectResults()+'</div>';}
function projectSelect(key,options){return '<select aria-label="'+key+'" onchange="projectFilters.'+key+'=this.value;refreshProjects()">'+options.map(([v,l])=>'<option value="'+v+'" '+(projectFilters[key]===v?'selected':'')+'>'+esc(l)+'</option>').join('')+'</select>';}
function projectResults(){const f=projectFilters;let rows=f.view==='projects'?S.projects.map(p=>({p,title:p.title,due:p.deadline,status:p.status})):S.projects.flatMap(p=>p.milestones.map(m=>({p,m,title:m.title,due:m.due,status:m.done?'done':'active'})));rows=rows.filter(r=>(f.goal==='all'||r.p.goalId===f.goal)&&(!f.q||(r.title+' '+r.p.title).toLowerCase().includes(f.q.toLowerCase()))&&(f.status==='all'||(f.status==='late'?r.status!=='done'&&r.due&&r.due<iso():r.status===f.status)));rows.sort((a,b)=>f.sort==='title'?a.title.localeCompare(b.title):(a.due||'9999').localeCompare(b.due||'9999'));return '<p class="muted">'+rows.length+' résultat(s)</p>'+ (rows.map(r=>'<article class="item"><div class="grow"><b>'+esc(r.title)+'</b><small>'+esc(goalName(r.p.goalId)||'Sans objectif')+' · '+(r.m?esc(r.p.title)+' · ':'')+esc(r.due||'Sans échéance')+' · '+({active:'À faire',paused:'En pause',done:'Terminé'}[r.status]||r.status)+'</small></div><button class="btn" onclick="'+(r.m?'editMilestone(\''+r.p.id+'\',\''+r.m.id+'\')':'projectDetails(\''+r.p.id+'\')')+'">Ouvrir</button></article>').join('')||empty('Aucun résultat pour ces filtres.'));}
function refreshProjects(){$('#projectsResults').innerHTML=projectResults();}
function renderGuide(){return renderGuideShort()+'<section class="card" style="margin-top:20px"><h3>Utiliser chaque espace</h3>'+[
['Aujourd’hui et tâches','Prépare la veille les actions de demain. Choisis une tâche essentielle, donne-lui une priorité haute, une date et une durée réaliste. Exemple : préparer le rapport mensuel à 9 h pendant 45 minutes. Ouvre la tâche pour ajouter des sous-tâches, une récurrence ou un jalon.'],
['Un plan complet','Objectif : terminer mon rapport mensuel le 7. Projet : clôture du mois. Jalons : rapprochements le 3, contrôles le 5, validation le 7. Sous chaque jalon, crée les tâches correspondantes avec échéance et priorité. Dans la fiche objectif, Gérer le plan existant permet d’ajouter des jalons datés et des tâches détaillées.'],
['Brian Tracy : choisir avant d’agir','Clarifie ton résultat par écrit, découpe-le, puis identifie la prochaine action ayant le plus de conséquences utiles. Prépare ta liste avant de commencer. Une application pratique de Eat That Frog consiste à réserver ton meilleur créneau à cette action. Les priorités haute, normale et basse de LifeOS sont un classement simplifié ; elles ne constituent pas une méthode ABCDE complète.'],
['Pomodoro','Démarrer lance la phase choisie ; Mettre en pause suspend le compte à rebours ; Reprendre continue. Terminer & enregistrer conserve le temps de concentration effectué. Terminer la pause revient au travail sans ajouter de minutes productives. Réinitialiser abandonne le temps non enregistré après confirmation et remet la durée de la phase.'],
['Habitudes','Choisis un rythme et un type de mesure : case à cocher, quantité ou minutes. Exemple : lire 10 minutes les jours ouvrés. Saisir permet de corriger une date antérieure. Une pause suspend la routine. Les séries et taux reposent sur les réalisations enregistrées.'],
['Calendrier, journal et revue','Le calendrier présente les tâches datées et les échéances. Le journal conserve tes observations. Pendant la revue hebdomadaire, regarde les retards, adapte les échéances et choisis la prochaine priorité. Exemple : découper une tâche reportée trois fois en deux actions de 20 minutes.'],
['Statistiques et progression','Choisis le mode de progression de chaque objectif : mesure manuelle, tâches terminées, habitudes ou minutes focus. Ajouter des tâches peut faire baisser un pourcentage sans effacer le travail accompli. Vérifie la période et le mode avant de comparer les résultats.'],
['Réglages et sécurité','Dans Paramètres, personnalise le thème, la densité, les raccourcis et les durées. La biométrie dépend du support Android natif : un fichier HTML ouvert seul ne fournit pas toutes les fonctions de l’APK. Ne confonds pas verrouillage de l’accès et chiffrement des sauvegardes.'],
['Sauvegarder et restaurer','Dans Données & sauvegardes, exporte régulièrement un JSON ou une sauvegarde protégée par mot de passe. Garde une copie hors de l’appareil. Avant une restauration, exporte les données actuelles : restaurer peut les remplacer. Un point local de restauration ne remplace pas une copie externe. Le fichier HTML de l’application ne contient pas automatiquement tes données personnelles.'],
['Recherche et filtres','Objectifs : statut, domaine, priorité et progression. Habitudes : statut, fréquence et régularité. Tâches : statut, priorité, projet et échéance. Projets & jalons : bascule entre projets et tous les jalons, puis filtre par objectif ou retard. Si un élément paraît absent, vérifie les filtres actifs.']
].map(([t,p])=>'<details class="guideDetail"><summary>'+t+'</summary><p>'+p+'</p></details>').join('')+'</section>';}

// Bulk task triage: select the current results and apply one change to the group.
function updateTaskTriage(visible=filteredTasks()){
 const count=selectedTaskIds.size, label=$('#selectedTaskCount'), actions=$('#triageActions'), select=$('#selectVisibleTasks');
 if(label)label.textContent=count+' tâche'+(count===1?'':'s')+' sélectionnée'+(count===1?'':'s');
 if(actions)actions.hidden=count===0;
 if(select){const ids=visible.map(t=>t.id),picked=ids.filter(id=>selectedTaskIds.has(id)).length;select.checked=ids.length>0&&picked===ids.length;select.indeterminate=picked>0&&picked<ids.length;}
}
function toggleTaskSelection(id,checked){if(checked)selectedTaskIds.add(id);else selectedTaskIds.delete(id);refreshTaskList();}
function selectVisibleTasks(checked){for(const t of filteredTasks())checked?selectedTaskIds.add(t.id):selectedTaskIds.delete(t.id);refreshTaskList();}
function selectedTasks(){return S.tasks.filter(t=>selectedTaskIds.has(t.id));}
function finishTaskTriage(message){selectedTaskIds.clear();save();render();toast(message);}
function applyBulkTaskStatus(){const status=$('#bulkTaskStatus').value,items=selectedTasks();if(!status||!items.length)return toast('Choisis un statut et au moins une tâche');if(status==='done'&&!confirm('Terminer '+items.length+' tâche(s) sélectionnée(s) ? Les tâches récurrentes créeront leur prochaine occurrence.'))return;for(const t of items)setTaskStatus(t.id,status,{silent:true});finishTaskTriage(items.length+' tâche(s) mise(s) à jour');}
function applyBulkTaskPriority(){const priority=$('#bulkTaskPriority').value,items=selectedTasks();if(!priority||!items.length)return toast('Choisis une priorité et au moins une tâche');for(const t of items)t.priority=priority;finishTaskTriage('Priorité mise à jour pour '+items.length+' tâche(s)');}
function applyBulkTaskDue(){const due=$('#bulkTaskDue').value,items=selectedTasks();if(!/^\d{4}-\d{2}-\d{2}$/.test(due)||!items.length)return toast('Choisis une échéance valide et au moins une tâche');for(const t of items)t.due=due;finishTaskTriage(items.length+' tâche(s) planifiée(s)');}
function postponeSelectedTasks(){const items=selectedTasks().filter(t=>t.status!=='done');if(!items.length)return toast('Aucune tâche ouverte sélectionnée');for(const t of items)t.due=addDays(1);finishTaskTriage(items.length+' tâche(s) reportée(s) à demain');}
