/* Hyrule Command Center — real-life planning and Zelda-inspired progression */
(function(){
  const H = db.hyrule = Object.assign({
    orbEvents:[], quests:[], projects:[], badges:[], rewards:[], memories:[], lists:[]
  }, db.hyrule || {});
  ["orbEvents","quests","projects","badges","rewards","memories","lists"].forEach(k=>{if(!Array.isArray(H[k]))H[k]=[]});
  const $=id=>document.getElementById(id);
  const safe=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const id=()=>crypto.randomUUID();
  const total=()=>H.orbEvents.reduce((n,x)=>n+(+x.amount||0),0);
  const earned=()=>H.orbEvents.reduce((n,x)=>n+Math.max(0,+x.amount||0),0);
  const level=()=>Math.floor(earned()/100)+1;
  const progress=()=>earned()%100;
  const categories=["Daily Life","Work","Health & Wellness","Home","Personal Growth","Fun & Hobbies"];
  const completedDailyTasks=()=>Object.values(db.daily||{}).reduce((n,d)=>n+(d.todo||[]).filter(t=>t.done).length,0);
  const badgeRules=[
    {id:"first-steps",name:"First Steps",icon:"🌱",desc:"Complete your first daily quest",test:()=>completedDailyTasks()>=1},
    {id:"getting-it-done",name:"Getting It Done",icon:"⚒️",desc:"Complete 10 daily quests",test:()=>completedDailyTasks()>=10},
    {id:"big-adventure",name:"A Big Adventure",icon:"🗺️",desc:"Finish your first main quest",test:()=>H.projects.some(x=>x.done)},
    {id:"steady-hand",name:"Steady Hand",icon:"🏹",desc:"Complete 25 daily quests",test:()=>completedDailyTasks()>=25},
    {id:"memory-maker",name:"Memory Maker",icon:"📖",desc:"Record 5 moments or milestones",test:()=>H.memories.length>=5},
    {id:"treasure-hunter",name:"Treasure Hunter",icon:"🏆",desc:"Redeem your first reward",test:()=>H.rewards.some(x=>x.redeemed>0)},
    {id:"well-rounded",name:"Consistent Hero",icon:"🌟",desc:"Complete daily quests on 4 different days",test:()=>new Set(Object.entries(db.daily||{}).filter(([,d])=>(d.todo||[]).some(t=>t.done)).map(([date])=>date)).size>=4}
  ];
  function checkBadges(){
    badgeRules.forEach(b=>{if(b.test()&&!H.badges.some(x=>x.id===b.id)){H.badges.unshift({id:b.id,name:b.name,icon:b.icon,desc:b.desc,date:new Date().toISOString()});naviCelebrate("badge",b.name)}});
  }
  function award(amount,reason){
    amount=Math.max(0,Math.min(500,+amount||0));if(!amount)return;
    H.orbEvents.unshift({id:id(),amount,reason:String(reason||"A little progress").trim(),date:new Date().toISOString()});
    checkBadges();save();
  }

  // Navi celebrates real progress with a rotating, non-repeating set of messages.
  H.navi=Object.assign({message:"Hey! Listen! Your next adventure is waiting, hero.",lastIds:[],counts:{}},H.navi||{});
  const naviLines={
    quest:[["n1","Yahoo! Another quest complete! Keep that momentum going!"],["n2","Hey! Listen! You did the thing you set out to do. Nice work!"],["n3","One more task down. Hyrule is looking a little brighter already!"],["n4","Look at you go! Even the Hero of Time started with one small step."],["n5","Quest cleared! Take a second to enjoy that win, hero."]],
    main:[["m1","A major quest completed! That deserves a victory lap!"],["m2","Incredible! You stayed with the big challenge and saw it through!"],["m3","The kingdom celebrates a hero who finishes what they start!"],["m4","That was no side quest. You made real progress today!"]],
    wellness:[["w1","Hey! Listen! Taking care of yourself counts as progress, too."],["w2","A little check-in is a big act of self-awareness. Well done!"],["w3","Even heroes need to check their hearts. Thanks for looking after yours."],["w4","You made time to notice how you're doing. That's worth celebrating."]],
    badge:[["b1","A new medal shines in your collection! You earned that!"],["b2","Yahoo! A new achievement unlocked. Your legend grows!"],["b3","That milestone is yours now. Add it to the hero's record!"]],
    reward:[["r1","A well-earned treasure! Enjoy your reward, hero!"],["r2","Hey! Listen! You worked for this. Time to enjoy the loot!"],["r3","A little celebration is in order. Your effort paid off!"]]
  };
  function naviCelebrate(type,detail){
    const pool=naviLines[type]||naviLines.quest,counts=H.navi.counts||(H.navi.counts={});
    let start=counts[type]||0,choice=null;
    for(let step=0;step<pool.length;step++){const candidate=pool[(start+step)%pool.length];if(!(H.navi.lastIds||[]).includes(candidate[0])){choice=candidate;counts[type]=(start+step+1)%pool.length;break}}
    if(!choice){choice=pool[start%pool.length];counts[type]=(start+1)%pool.length}
    H.navi.message=choice[1];H.navi.event=type;H.navi.detail=String(detail||"").slice(0,90);H.navi.updatedAt=new Date().toISOString();H.navi.lastIds=[...(H.navi.lastIds||[]),choice[0]].slice(-3);save();
  }
  function naviPanel(){
    return '<section class="panel s12 navi-panel"><div class="navi-banner" role="img" aria-label="A glowing blue fairy inspired by Navi"><span class="navi-spark s1">✦</span><span class="navi-spark s2">✧</span><span class="navi-spark s3">✦</span><div class="navi-fairy"><span class="navi-wing left"></span><span class="navi-wing right"></span><span class="navi-core"></span></div><div class="navi-banner-title">HEY! LISTEN!</div></div><div class="navi-speech"><span class="navi-name">✦ NAVI SAYS ✦</span><p>'+safe(H.navi.message)+'</p>'+(H.navi.detail?'<small>'+safe(H.navi.detail)+'</small>':'')+'</div></section>';
  }
  window.hyruleNaviPanel=naviPanel;
  function status(){
    const done=completedDailyTasks(),todayTasks=db.daily?.[today()]?.todo||[],open=todayTasks.filter(x=>!x.done).length;
    return '<section class="panel s12 hyrule-status"><div class="hyrule-status-head"><div><div class="eyebrow">YOUR ADVENTURE, YOUR PACE</div><h2>HERO LEVEL '+level()+'</h2><p class="muted">'+earned().toLocaleString()+' SPIRIT ORBS EARNED</p></div><div class="hyrule-triforce">△</div></div><div class="hyrule-orbbar"><span style="width:'+progress()+'%"></span></div><div class="row between"><small class="muted">'+progress()+' / 100 to next level</small><small class="muted">'+done+' daily quests completed · '+open+' left today</small></div></section>';
  }
  function dailyQuestBoard(){
    const items=db.daily?.[today()]?.todo||[];
    const rows=items.map((t,i)=>'<label class="hyrule-daily-quest '+(t.done?'is-done':'')+'"><input type="checkbox" '+(t.done?'checked':'')+' onchange="hyruleDailyTaskToggle(\''+String(t.id||('legacy-'+i)).replace(/'/g,"&#39;")+'\',this.checked)"><span>'+safe(t.text)+'</span><small>'+(t.done?'✓ REWARD CLAIMED':'+10 SPIRIT ORBS')+'</small></label>').join('');
    return '<section class="panel s12 hyrule-quest-board"><div class="row between"><div><div class="eyebrow">TODAY’S QUEST BOARD</div><h3>DAILY QUESTS</h3></div><button class="btn gold" onclick="go(\'daily\')">Manage quests</button></div>'+(rows||'<p class="muted">No quests on today’s board yet. Add them on your Daily Page and they’ll appear here automatically.</p>')+'</section>';
  }
  function awardDailyTask(task,date){
    if(!task)return;
    task.id=task.id||id();
    if(H.orbEvents.some(e=>e.taskId===String(task.id)))return;
    H.orbEvents.unshift({id:'daily-task:'+task.id,taskId:String(task.id),amount:10,reason:'Daily quest completed: '+String(task.text||'Task').trim(),date:new Date().toISOString(),taskDate:date||today()});
    checkBadges();naviCelebrate("quest",task.text);save();
  }
  window.hyruleDailyTaskToggle=function(taskId,checked){
    const d=db.daily?.[today()];if(!d)return;
    const task=(d.todo||[]).find((t,i)=>String(t.id||('legacy-'+i))===String(taskId));if(!task)return;
    task.id=task.id||id();task.done=!!checked;
    if(checked)awardDailyTask(task,today());
    save();checkBadges();render();
  };
  window.taskDone=function(taskId,checked){
    const d=dRec(),task=(d.todo||[]).find(t=>String(t.id)===String(taskId));
    if(task){task.done=!!checked;if(checked)awardDailyTask(task,$('dailyDate')?.value||today());}
    save();checkBadges();render();
  };
  window.toggleTask=function(taskId,checked){
    const d=db.daily?.[today()],task=(d?.todo||[]).find(t=>String(t.id)===String(taskId));
    if(task){task.done=!!checked;if(checked)awardDailyTask(task,today());}
    save();checkBadges();render();
  };
  function hyruleMaskOutline(){return '<img class="mask-outline" src="./majora-mask-outline.webp?v=26" alt="" aria-hidden="true">'}function tile(key,icon,title,sub){
    return '<button class="module hyrule-module" onclick="go(\''+key+'\')">'+hyruleMaskOutline()+'<i>'+icon+'</i><b>'+title+'</b><small>'+sub+'</small></button>';
  }
  function homeExtras(){
    const recent=H.orbEvents.slice(0,3).map(x=>'<div class="stat"><span>'+safe(x.reason)+'</span><b>+'+x.amount+' orbs</b></div>').join("")||'<p class="muted">Your first reward is waiting for a meaningful win.</p>';
    const badges=H.badges.slice(0,4).map(x=>'<span class="tag">'+x.icon+' '+safe(x.name)+'</span>').join("")||'<p class="muted">Your first achievement is waiting.</p>';
    return naviPanel()+status()+
      '<div class="grid"><section class="panel s6"><h3>RECENT REWARDS</h3>'+recent+'</section><section class="panel s6"><h3>MEDALS & ACHIEVEMENTS</h3>'+badges+'<p><button class="btn" onclick="go(\'hyruleAchievements\')">View achievement case</button></p></section></div>'+
      '';
  }
  function questsPage(){
    const items=H.quests.map(q=>'<div class="hyrule-item"><div><b>'+safe(q.name)+'</b><small>'+safe(q.category)+' · '+(q.done?'COMPLETED':'OPEN')+' · '+q.reward+' Spirit Orbs</small>'+(q.notes?'<p class="muted">'+safe(q.notes)+'</p>':'')+'</div><div class="row">'+(q.done?'<span class="tag">✓ DONE</span>':'<button class="btn gold" onclick="hyruleFinishQuest(\''+q.id+'\')">Complete</button>')+'<button class="btn danger" onclick="hyruleRemove(\'quests\',\''+q.id+'\')">×</button></div></div>').join("")||'<p class="muted">Nothing on the quest log yet. Add a task or goal below.</p>';
    return '<div class="grid"><section class="panel s6"><h3>ADD A QUEST</h3><form id="hyruleQuestForm"><label>Task or goal</label><input name="name" required maxlength="100" placeholder="Something you actually want to get done"><label>Life area</label><select name="category">'+categories.map(x=>'<option>'+x+'</option>').join("")+'</select><label>Importance</label><select name="level"><option value="5">Small win · 5 orbs</option><option value="10" selected>Worthwhile task · 10 orbs</option><option value="20">Big effort · 20 orbs</option></select><label>Notes (optional)</label><input name="notes" maxlength="140" placeholder="Anything to remember"><button class="btn gold">Add to quest log</button></form></section><section class="panel s6"><h3>HOW REWARDS WORK</h3><p class="muted">Spirit Orbs are for progress that matters. Tiny routine actions do not need to become another chore. Choose the reward level honestly.</p><div class="stat"><span>Small win</span><b>5 orbs</b></div><div class="stat"><span>Worthwhile task</span><b>10 orbs</b></div><div class="stat"><span>Big effort</span><b>20 orbs</b></div></section><section class="panel s12"><h3>YOUR QUEST LOG</h3>'+items+'</section></div>';
  }
  function projectsPage(){
    const items=H.projects.map(p=>'<div class="hyrule-item"><div><b>'+safe(p.name)+'</b><small>'+safe(p.category)+' · '+(p.done?'COMPLETED':'IN PROGRESS')+'</small>'+(p.notes?'<p class="muted">'+safe(p.notes)+'</p>':'')+'</div><div class="row">'+(p.done?'<span class="tag">✓ COMPLETE</span>':'<button class="btn gold" onclick="hyruleFinishProject(\''+p.id+'\')">Finish · +40</button>')+'<button class="btn danger" onclick="hyruleRemove(\'projects\',\''+p.id+'\')">×</button></div></div>').join("")||'<p class="muted">No main quests yet. Save this space for projects that take more than one sitting.</p>';
    return '<div class="grid"><section class="panel s6"><h3>START A MAIN QUEST</h3><form id="hyruleProjectForm"><label>Project or bigger goal</label><input name="name" required maxlength="100" placeholder="A goal with a few steps"><label>Life area</label><select name="category">'+categories.map(x=>'<option>'+x+'</option>').join("")+'</select><label>First steps / notes</label><textarea name="notes" placeholder="What needs to happen?"></textarea><button class="btn gold">Start main quest</button></form></section><section class="panel s6"><h3>THE LONG GAME</h3><p class="muted">Use Main Quests for things that need planning: a home project, a savings goal, a trip, a course, or a personal goal. Finishing one earns 40 Spirit Orbs.</p><div class="big">'+H.projects.filter(x=>x.done).length+'</div><p class="muted">Main quests completed</p></section><section class="panel s12"><h3>ACTIVE & COMPLETED PROJECTS</h3>'+items+'</section></div>';
  }
  function achievementsPage(){
    checkBadges();
    const earned=H.badges.map(b=>'<div class="hyrule-item"><div><b>'+b.icon+' '+safe(b.name)+'</b><small>'+safe(b.desc)+' · '+new Date(b.date).toLocaleDateString()+'</small></div><span class="tag">EARNED</span></div>').join("")||'<p class="muted">No medals yet. They unlock naturally as you make progress.</p>';
    const locked=badgeRules.filter(b=>!H.badges.some(x=>x.id===b.id)).map(b=>'<div class="hyrule-item"><div><b>◇ '+safe(b.name)+'</b><small>'+safe(b.desc)+'</small></div><span class="tag">LOCKED</span></div>').join("");
    const memories=H.memories.length;
    return '<div class="grid"><section class="panel s6"><h3>HERO LEVEL</h3><div class="big">'+level()+'</div><p class="muted">'+earned()+' Spirit Orbs earned · '+progress()+'/100 toward next level</p><div class="hyrule-orbbar"><span style="width:'+progress()+'%"></span></div></section><section class="panel s6"><h3>YOUR RECORD</h3><div class="stat"><span>Daily quests completed</span><b>'+completedDailyTasks()+'</b></div><div class="stat"><span>Main quests completed</span><b>'+H.projects.filter(x=>x.done).length+'</b></div><div class="stat"><span>Moments recorded</span><b>'+memories+'</b></div><div class="stat"><span>Medals earned</span><b>'+H.badges.length+'</b></div></section><section class="panel s12"><h3>MEDAL CASE · EARNED</h3>'+earned+'</section><section class="panel s12"><h3>ON THE HORIZON</h3>'+locked+'</section></div>';
  }
  function rewardsPage(){
    const available=H.rewards.filter(x=>!x.archived).map(r=>'<div class="hyrule-item"><div><b>🎁 '+safe(r.name)+'</b><small>'+r.cost+' Spirit Orbs · Redeemed '+(r.redeemed||0)+' times</small></div><div class="row"><button class="btn gold" onclick="hyruleRedeem(\''+r.id+'\')" '+(total()<r.cost?'disabled':'')+'>Redeem</button><button class="btn danger" onclick="hyruleRemove(\'rewards\',\''+r.id+'\')">×</button></div></div>').join("")||'<p class="muted">Add a reward you would genuinely enjoy. Keep it realistic.</p>';
    return '<div class="grid"><section class="panel s6"><h3>SPIRIT ORB BALANCE</h3><div class="big">'+total()+'</div><p class="muted">Earned and available to spend</p></section><section class="panel s6"><h3>ADD A TREASURE</h3><form id="hyruleRewardForm"><label>Reward</label><input name="name" required maxlength="90" placeholder="A small treat, outing or something saved for"><label>Orb cost</label><input name="cost" type="number" min="1" max="5000" value="50" required><button class="btn gold">Add to treasure chest</button></form></section><section class="panel s12"><h3>REWARDS TO UNLOCK</h3>'+available+'</section><section class="panel s12"><h3>SPIRIT ORB HISTORY</h3>'+H.orbEvents.slice(0,20).map(x=>'<div class="stat"><span>'+safe(x.reason)+' <small class="muted">'+new Date(x.date).toLocaleDateString()+'</small></span><b>'+(x.amount>0?'+':'')+x.amount+' ◈</b></div>').join("")+'</section></div>';
  }
  function listsPage(){
    const groups=["Shopping","Packing","Home","Work","Someday","Other"];
    const entries=H.lists.map(x=>'<div class="hyrule-item"><div><b>'+safe(x.text)+'</b><small>'+safe(x.group)+' · '+(x.done?'DONE':'TO DO')+'</small></div><div class="row"><button class="btn '+(x.done?'':'gold')+'" onclick="hyruleToggleList(\''+x.id+'\')">'+(x.done?'Reopen':'Done')+'</button><button class="btn danger" onclick="hyruleRemove(\'lists\',\''+x.id+'\')">×</button></div></div>').join("")||'<p class="muted">No list items yet.</p>';
    return '<div class="grid"><section class="panel s6"><h3>ADD TO A LIST</h3><form id="hyruleListForm"><label>What do you need to remember?</label><input name="text" required maxlength="120" placeholder="An item, reminder or something to bring"><label>List</label><select name="group">'+groups.map(x=>'<option>'+x+'</option>').join("")+'</select><button class="btn gold">Add item</button></form></section><section class="panel s6"><h3>PERSONAL ORGANIZER</h3><p class="muted">A practical place for shopping, packing, errands, work reminders and ideas. No pretend game inventory.</p><div class="big">'+H.lists.filter(x=>!x.done).length+'</div><p class="muted">Items still to do</p></section><section class="panel s12"><h3>YOUR LISTS</h3>'+entries+'</section></div>';
  }
  function memoriesPage(){
    const entries=H.memories.map(x=>'<div class="hyrule-item"><div><b>'+safe(x.name)+'</b><small>'+safe(x.category)+' · '+new Date(x.date).toLocaleDateString()+'</small>'+(x.note?'<p class="muted">'+safe(x.note)+'</p>':'')+'</div><button class="btn danger" onclick="hyruleRemove(\'memories\',\''+x.id+'\')">×</button></div>').join("")||'<p class="muted">Save a milestone, a good day, an experience, or something you are proud of.</p>';
    return '<div class="grid"><section class="panel s6"><h3>RECORD A MOMENT</h3><form id="hyruleMemoryForm"><label>What happened?</label><input name="name" required maxlength="100" placeholder="A milestone or memory worth keeping"><label>Type</label><select name="category"><option>Personal milestone</option><option>Experience</option><option>Something I am proud of</option><option>Good memory</option><option>Other</option></select><label>Details</label><textarea name="note" placeholder="A few words to remember it by"></textarea><button class="btn gold">Save to memory book</button></form></section><section class="panel s6"><h3>WHY KEEP A RECORD?</h3><p class="muted">Not every win needs a score. The Memory Book is just a place to keep the good stuff and notice how far you have come.</p><div class="big">'+H.memories.length+'</div><p class="muted">Moments saved</p></section><section class="panel s12"><h3>MEMORY BOOK</h3>'+entries+'</section></div>';
  }
  function bind(idName,fn){const f=$(idName);if(f)f.onsubmit=e=>{e.preventDefault();fn(e.target)}}
  function bindForms(){
    bind("hyruleQuestForm",f=>{const reward=+f.level.value;H.quests.unshift({id:id(),name:f.elements.namedItem("name").value.trim(),category:f.category.value,notes:f.notes.value.trim(),reward,done:false,date:new Date().toISOString()});save();render()});
    bind("hyruleProjectForm",f=>{H.projects.unshift({id:id(),name:f.elements.namedItem("name").value.trim(),category:f.category.value,notes:f.notes.value.trim(),done:false,date:new Date().toISOString()});save();render()});
    bind("hyruleRewardForm",f=>{H.rewards.unshift({id:id(),name:f.elements.namedItem("name").value.trim(),cost:Math.max(1,+f.cost.value||1),redeemed:0});save();render()});
    bind("hyruleListForm",f=>{H.lists.unshift({id:id(),text:f.text.value.trim(),group:f.group.value,done:false});save();render()});
    bind("hyruleMemoryForm",f=>{H.memories.unshift({id:id(),name:f.elements.namedItem("name").value.trim(),category:f.category.value,note:f.note.value.trim(),date:new Date().toISOString()});checkBadges();save();render()});
  }
  window.hyruleFinishQuest=idValue=>{const q=H.quests.find(x=>x.id===idValue);if(!q||q.done)return;q.done=true;q.completedAt=new Date().toISOString();award(q.reward,"Quest complete: "+q.name);render()};
  window.hyruleFinishProject=idValue=>{const p=H.projects.find(x=>x.id===idValue);if(!p||p.done)return;p.done=true;p.completedAt=new Date().toISOString();award(40,"Main quest complete: "+p.name);naviCelebrate("main",p.name);render()};
  window.hyruleRedeem=idValue=>{const r=H.rewards.find(x=>x.id===idValue);if(!r||total()<r.cost)return;H.orbEvents.unshift({id:id(),amount:-r.cost,reason:"Treasure redeemed: "+r.name,date:new Date().toISOString()});r.redeemed=(r.redeemed||0)+1;checkBadges();naviCelebrate("reward",r.name);save();render()};
  window.hyruleToggleList=idValue=>{const x=H.lists.find(x=>x.id===idValue);if(x)x.done=!x.done;save();render()};
  window.hyruleRemove=(key,idValue)=>{if(!Array.isArray(H[key]))return;H[key]=H[key].filter(x=>x.id!==idValue);save();render()};

  // Symptom and wellness journal
  H.symptoms=Array.isArray(H.symptoms)?H.symptoms:[];
  H.calendarEvents=Array.isArray(H.calendarEvents)?H.calendarEvents:[];
  let healthDate=today(),calendarDate=today(),calendarMode="month";
  const symptomOptions=["Pain","Headache","Migraine","Fatigue","Dizziness","Nausea","Digestive issues","Bloating","Sleep trouble","Anxiety","Stress","Mood changes","Hot flashes","Skin changes","Other"];
  function symptomsPage(){
    const day=H.symptoms.filter(x=>x.date===healthDate).sort((a,b)=>(a.time||"").localeCompare(b.time||""));
    const all=[...H.symptoms].sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time));
    const avg=all.length?(all.reduce((n,x)=>n+(+x.severity||0),0)/all.length).toFixed(1):"—";
    const counts={};all.forEach(x=>counts[x.name]=(counts[x.name]||0)+1);
    const common=Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,5);
    return '<div class="eyebrow">HEALTH JOURNAL · NOTICE PATTERNS, NOT PERFECTION</div><div class="grid" style="margin-top:12px">'+
      '<section class="panel s12"><div class="row between"><div><h3>SYMPTOM & WELLNESS LOG</h3><p class="muted">Record what happened, when, and how it affected you.</p></div><input id="healthDate" type="date" value="'+healthDate+'" onchange="setHealthDate(this.value)" style="max-width:155px"></div>'+
      '<form id="symptomForm" class="grid"><div class="s6"><label>Symptom / experience</label><select name="name">'+symptomOptions.map(x=>'<option>'+safe(x)+'</option>').join("")+'</select></div><div class="s3"><label>Time</label><input name="time" type="time" value="'+new Date().toTimeString().slice(0,5)+'"></div><div class="s3"><label>Severity · 1–10</label><input name="severity" type="number" min="1" max="10" value="3" required></div><div class="s6"><label>Duration</label><input name="duration" placeholder="e.g. 30 minutes, all day"></div><div class="s6"><label>Possible trigger</label><input name="trigger" placeholder="Food, stress, activity, cycle, unknown…"></div><div class="s6"><label>Energy level</label><select name="energy"><option value="">Not recorded</option><option>Very low</option><option>Low</option><option>Okay</option><option>Good</option><option>High</option></select></div><div class="s6"><label>Mood / general wellness</label><select name="mood"><option value="">Not recorded</option><option>Great</option><option>Good</option><option>Okay</option><option>Low</option><option>Anxious</option><option>Overwhelmed</option></select></div><div class="s12"><label>Notes</label><textarea name="notes" placeholder="What did it feel like? What helped? Anything else worth noting?"></textarea></div><div class="s12"><button class="btn gold">Save entry</button></div></form></section>'+
      '<section class="panel s4"><h3>YOUR LOG AT A GLANCE</h3><div class="big">'+all.length+'</div><p class="muted">Entries recorded</p><div class="stat"><span>Average severity</span><b>'+avg+'/10</b></div><div class="stat"><span>Symptoms tracked</span><b>'+Object.keys(counts).length+'</b></div></section>'+
      '<section class="panel s8"><h3>MOST FREQUENTLY LOGGED</h3>'+ (common.map(([n,c])=>'<div class="stat"><span>'+safe(n)+'</span><b>'+c+' entries</b></div>').join("")||'<p class="muted">Your patterns will appear here as you log entries.</p>')+'</section>'+
      '<section class="panel s12"><h3>ENTRIES · '+new Date(healthDate+"T12:00:00").toLocaleDateString([],{weekday:"long",month:"long",day:"numeric",year:"numeric"})+'</h3>'+
      (day.map(x=>'<div class="hyrule-item"><div><b>'+safe(x.name)+' · '+x.severity+'/10</b><small>'+safe(x.time||"Time not set")+(x.duration?' · '+safe(x.duration):'')+(x.trigger?' · Trigger: '+safe(x.trigger):'')+'</small>'+(x.notes?'<p class="muted">'+safe(x.notes)+'</p>':'')+(x.energy||x.mood?'<small>'+[x.energy?'Energy: '+x.energy:'',x.mood?'Wellness: '+x.mood:''].filter(Boolean).join(" · ")+'</small>':'')+'</div><button class="btn danger" onclick="deleteSymptom(\''+x.id+'\')">Delete</button></div>').join("")||'<p class="muted">No entries for this date. Use the form above to add one.</p>')+'</section>'+
      '<section class="panel s12"><h3>HISTORY · RECENT ENTRIES</h3>'+(all.slice(0,30).map(x=>'<div class="stat"><span>'+safe(x.date)+' · '+safe(x.name)+' <small class="muted">'+safe(x.time||"")+'</small></span><b>'+x.severity+'/10</b></div>').join("")||'<p class="muted">Your history will build here.</p>')+'</section></div>';
  }
  window.healthDate=healthDate;
  window.setHealthDate=s=>{healthDate=s;render()};
  window.deleteSymptom=idValue=>{H.symptoms=H.symptoms.filter(x=>x.id!==idValue);save();render()};
  function bindSymptomForm(){const f=$("symptomForm");if(!f)return;f.onsubmit=e=>{e.preventDefault();const o=Object.fromEntries(new FormData(f));H.symptoms.unshift({id:id(),date:$("healthDate")?.value||healthDate,...o,severity:Math.max(1,Math.min(10,+o.severity||1)),createdAt:new Date().toISOString()});healthDate=$("healthDate")?.value||healthDate;naviCelebrate("wellness",o.name);save();render()}}
  // Calendar with month, week and day views; events are stored locally.
  const calDate=s=>new Date(s+"T12:00:00");
  const calKey=d=>dateKey(d);
  const calAdd=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
  const calStartWeek=d=>calAdd(d,-d.getDay());
  const calOccurs=(ev,day)=>{if(ev.date===day)return true;if(!ev.repeat||ev.repeat==="Never"||day<ev.date)return false;const a=calDate(ev.date),b=calDate(day);if(ev.repeat==="Daily")return true;if(ev.repeat==="Weekly")return a.getDay()===b.getDay();if(ev.repeat==="Monthly")return a.getDate()===b.getDate();return false};
  function calEventChip(ev,day){return '<button class="cal-event '+safe(ev.category||"Personal")+'" onclick="editCalendarEvent(\''+ev.id+'\')" title="'+safe(ev.title)+'">'+(ev.allDay?'':'<small>'+safe(ev.time||'')+'</small> ')+safe(ev.title)+'</button>'}
  function calendarPage(){
    const d=calDate(calendarDate),month=d.getMonth(),year=d.getFullYear(),first=new Date(year,month,1),start=calStartWeek(first),days=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    const events=H.calendarEvents;
    const header='<div class="row between calendar-toolbar"><button class="btn" onclick="calendarMove(-1)">‹</button><h2>'+d.toLocaleDateString([],{month:"long",year:"numeric"})+'</h2><button class="btn" onclick="calendarMove(1)">›</button></div><div class="row between calendar-controls"><button class="btn" onclick="calendarToday()">Today</button><div class="row"><button class="btn '+(calendarMode==="month"?"gold":"")+'" onclick="calendarSetMode(\'month\')">Month</button><button class="btn '+(calendarMode==="week"?"gold":"")+'" onclick="calendarSetMode(\'week\')">Week</button><button class="btn '+(calendarMode==="day"?"gold":"")+'" onclick="calendarSetMode(\'day\')">Day</button></div><button class="btn gold" onclick="newCalendarEvent(\''+calendarDate+'\')">+ Event</button></div>';
    let body="";
    if(calendarMode==="month"){
      const cells=Array.from({length:42},(_,i)=>{const day=calAdd(start,i),key=calKey(day),inMonth=day.getMonth()===month,found=events.filter(e=>calOccurs(e,key)).slice(0,3);return '<div class="cal-cell '+(inMonth?'':'outside')+(key===today()?' today':'')+'"><button class="cal-date" onclick="calendarChoose(\''+key+'\')">'+day.getDate()+'</button>'+found.map(e=>calEventChip(e,key)).join("")+(events.filter(e=>calOccurs(e,key)).length>3?'<small>+'+(events.filter(e=>calOccurs(e,key)).length-3)+' more</small>':'')+'</div>'}).join("");
      body='<div class="calendar-month"><div class="cal-weekdays">'+days.map(x=>'<b>'+x+'</b>').join("")+'</div><div class="cal-month-grid">'+cells+'</div></div>';
    }else{
      const start=calendarMode==="week"?calStartWeek(d):d,span=calendarMode==="week"?7:1;
      body='<div class="calendar-agenda">'+Array.from({length:span},(_,i)=>{const day=calAdd(start,i),key=calKey(day),list=events.filter(e=>calOccurs(e,key)).sort((a,b)=>(a.time||"").localeCompare(b.time||""));return '<section class="cal-agenda-day '+(key===today()?'today':'')+'"><button class="cal-date" onclick="calendarChoose(\''+key+'\')">'+day.toLocaleDateString([],{weekday:"long",month:"short",day:"numeric"})+'</button>'+(list.map(e=>calEventChip(e,key)).join("")||'<p class="muted">No events</p>')+'</section>'}).join("")+'</div>';
    }
    const upcoming=events.filter(e=>e.date>=today()).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)).slice(0,5);
    return '<div class="eyebrow">HYRULE CALENDAR · YOUR TIME, YOUR ADVENTURES</div><section class="panel s12 calendar-panel">'+header+body+'</section><div class="grid"><section class="panel s12"><h3>UP NEXT</h3>'+(upcoming.map(e=>'<div class="stat"><span>'+safe(e.date)+' · '+safe(e.title)+'</span><b>'+safe(e.time||"All day")+'</b></div>').join("")||'<p class="muted">No upcoming events yet.</p>')+'</section></div>';
  }
  function calEventForm(existing,selected){
    const e=existing||{title:"",date:selected||calendarDate,time:"09:00",endTime:"10:00",category:"Personal",repeat:"Never",allDay:false,notes:""};
    return '<section class="panel s12 calendar-editor"><div class="row between"><h3>'+(existing?'EDIT EVENT':'NEW EVENT')+'</h3><button class="btn" onclick="render()">Close</button></div><form id="calendarEventForm" class="grid"><div class="s8"><label>Event</label><input name="title" required maxlength="100" value="'+safe(e.title)+'" placeholder="Appointment, reminder, plans…"></div><div class="s4"><label>Category</label><select name="category">'+["Personal","Health","Work","Home","Fun","Important"].map(x=>'<option '+(e.category===x?'selected':'')+'>'+x+'</option>').join("")+'</select></div><div class="s4"><label>Date</label><input name="date" type="date" required value="'+safe(e.date)+'"></div><div class="s4"><label>Start time</label><input name="time" type="time" value="'+safe(e.time||"")+'"></div><div class="s4"><label>End time</label><input name="endTime" type="time" value="'+safe(e.endTime||"")+'"></div><div class="s4"><label>Repeat</label><select name="repeat">'+["Never","Daily","Weekly","Monthly"].map(x=>'<option '+((e.repeat||"Never")===x?'selected':'')+'>'+x+'</option>').join("")+'</select></div><div class="s4"><label><input type="checkbox" name="allDay" '+(e.allDay?'checked':'')+'> All day</label></div><div class="s12"><label>Notes</label><textarea name="notes">'+safe(e.notes||"")+'</textarea></div><div class="s12 row"><button class="btn gold">Save event</button>'+(existing?'<button type="button" class="btn danger" onclick="deleteCalendarEvent(\''+existing.id+'\')">Delete</button>':'')+'</div></form></section>';
  }
  let editingCalendarId=null;
  window.calendarChoose=s=>{calendarDate=s;calendarMode="day";render()};
  window.calendarSetMode=m=>{calendarMode=m;render()};
  window.calendarToday=()=>{calendarDate=today();render()};
  window.calendarMove=n=>{const d=calDate(calendarDate);if(calendarMode==="month")d.setMonth(d.getMonth()+n);else d.setDate(d.getDate()+n*(calendarMode==="week"?7:1));calendarDate=calKey(d);render()};
  window.newCalendarEvent=s=>{editingCalendarId=null;$("view").insertAdjacentHTML("beforeend",calEventForm(null,s));bindCalendarForm()};
  window.editCalendarEvent=idValue=>{const e=H.calendarEvents.find(x=>x.id===idValue);if(!e)return;editingCalendarId=idValue;const old=$("calendarEditor");if(old)old.remove();$("view").insertAdjacentHTML("beforeend",calEventForm(e));bindCalendarForm()};
  window.deleteCalendarEvent=idValue=>{H.calendarEvents=H.calendarEvents.filter(x=>x.id!==idValue);editingCalendarId=null;save();render()};
  function bindCalendarForm(){const f=$("calendarEventForm");if(!f)return;f.onsubmit=e=>{e.preventDefault();const o=Object.fromEntries(new FormData(f));o.allDay=!!f.elements.allDay.checked;const record={id:editingCalendarId||id(),...o};if(editingCalendarId){const ix=H.calendarEvents.findIndex(x=>x.id===editingCalendarId);if(ix>=0)H.calendarEvents[ix]=record}else H.calendarEvents.unshift(record);calendarDate=o.date;editingCalendarId=null;save();render()}}
  window.calendarEventForm=calEventForm;
  window.calendarDate=calendarDate;
  window.calendarMove=window.calendarMove;
  window.calendarSetMode=window.calendarSetMode;
  window.calendarToday=window.calendarToday;
  window.newCalendarEvent=window.newCalendarEvent;
  window.editCalendarEvent=window.editCalendarEvent;
  window.deleteCalendarEvent=window.deleteCalendarEvent;

  const routes={hyruleProjects:projectsPage, hyruleAchievements:achievementsPage, hyruleRewards:rewardsPage, hyruleLists:listsPage, hyruleMemories:memoriesPage, hyruleSymptoms:symptomsPage, hyruleCalendar:calendarPage};
  Object.entries(routes).forEach(([k,v])=>{window[k]=v;if(!pages.some(p=>p[0]===k))pages.push([k,"◇",({hyruleProjects:"Main Quests",hyruleAchievements:"Hero's Journey",hyruleRewards:"Treasure Chest",hyruleLists:"Personal Lists",hyruleMemories:"Memory Book",hyruleSymptoms:"Symptom Tracker",hyruleCalendar:"Monthly Overview"})[k]])});
  const previousRender=window.render;
  window.render=function(){if(routes[page]){document.body.dataset.page=page;$("view").innerHTML='<div class="dashboard-return"><button class="btn dashboard-back" onclick="go(\'home\')">← BACK TO DASHBOARD</button></div>'+routes[page]();bindForms();bindSymptomForm();return}previousRender()};
  const previousHome=window.home;
  window.home=function(){const base=previousHome();const start=base.lastIndexOf('<div class="modulegrid">');const end=base.lastIndexOf('</div>');if(start<0||end<start)return homeExtras()+dailyQuestBoard()+base;const five=tile("hyruleProjects","🗺️","Main Quests","Bigger projects, one step at a time")+tile("hyruleAchievements","🏅","Hero’s Journey","Badges and milestones")+tile("hyruleRewards","🎁","Treasure Chest","Rewards worth working toward")+tile("hyruleLists","🎒","Personal Lists","Shopping, packing and useful lists")+tile("hyruleMemories","📖","Memory Book","Moments, wins and experiences")+tile("hyruleSymptoms","✚","Wellness Tracker","Symptoms, energy and patterns")+tile("hyruleCalendar","▦","Monthly Overview","Events, plans and appointments");return homeExtras()+dailyQuestBoard()+base.slice(0,start)+base.slice(start,end)+five+base.slice(end)};
  const style=document.createElement("style");
  style.textContent=".hyrule-status{border-color:#c8a85b;background:linear-gradient(135deg,#234a49,#112b36 65%,#172b35);box-shadow:inset 0 0 28px #07151c99,0 0 18px #d6b35b20}.hyrule-status-head{display:flex;align-items:center;justify-content:space-between;gap:10px}.hyrule-status h2{font-size:24px;margin:3px 0}.hyrule-triforce{font-size:56px;color:#e8c56a;text-shadow:0 0 18px #e8c56a55}.hyrule-orbbar{height:10px;background:#071923;border:1px solid #688d80;margin:10px 0 6px;overflow:hidden}.hyrule-orbbar span{display:block;height:100%;background:linear-gradient(90deg,#4eaaa0,#9acb77,#e8c56a)}.hyrule-item{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:11px 0;border-bottom:1px solid #456b66}.hyrule-item>div:first-child{min-width:0}.hyrule-item small{display:block;color:var(--muted);font:10px system-ui;margin-top:4px}.hyrule-item .row{flex-wrap:nowrap}.hyrule-item .btn{padding:7px 9px}.hyrule-module small{display:block;font:10px system-ui;color:#d6e3d4;margin-top:7px;text-align:center}.hyrule-module i{font-style:normal}.hyrule-module b{font-size:16px}";style.textContent+="\n/* Version 23: reference multicolor neon mask outline on all tiles */\n.modulegrid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:18px 10px!important;align-items:center!important}\n.module,.hyrule-module{position:relative!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:7px!important;isolation:isolate!important;overflow:visible!important;background:transparent!important;background-image:none!important;border:0!important;border-radius:0!important;box-shadow:none!important;filter:none!important;clip-path:none!important;-webkit-clip-path:none!important;min-height:185px!important;aspect-ratio:1.08/1!important;padding:32px 16px 25px!important}\n.module:before,.hyrule-module:before{display:none!important}\n.module>svg.mask-outline,.hyrule-module>svg.mask-outline{display:block!important;visibility:visible!important;opacity:1!important;position:absolute!important;inset:0!important;width:100%!important;height:100%!important;overflow:visible!important;z-index:0!important;pointer-events:none!important;filter:drop-shadow(0 0 2px #fff) drop-shadow(0 0 5px #e51be8aa) drop-shadow(0 0 10px #20d9ff77)!important}\n.module>svg.mask-outline path,.hyrule-module>svg.mask-outline path{fill:none!important;stroke-width:8!important;stroke-linecap:round!important;stroke-linejoin:round!important;opacity:1!important;vector-effect:non-scaling-stroke!important}\n.module>svg.mask-outline path[stroke=\"#e51be8\"],.hyrule-module>svg.mask-outline path[stroke=\"#e51be8\"]{stroke:#e51be8!important}\n.module>svg.mask-outline path[stroke=\"#ff303b\"],.hyrule-module>svg.mask-outline path[stroke=\"#ff303b\"]{stroke:#ff303b!important}\n.module>svg.mask-outline path[stroke=\"#ffe22d\"],.hyrule-module>svg.mask-outline path[stroke=\"#ffe22d\"]{stroke:#ffe22d!important}\n.module>svg.mask-outline path[stroke=\"#20e8a1\"],.hyrule-module>svg.mask-outline path[stroke=\"#20e8a1\"]{stroke:#20e8a1!important}\n.module>svg.mask-outline path[stroke=\"#20d9ff\"],.hyrule-module>svg.mask-outline path[stroke=\"#20d9ff\"]{stroke:#20d9ff!important}\n.module>*:not(.mask-outline),.hyrule-module>*:not(.mask-outline){position:relative!important;z-index:1!important}\n.module i,.hyrule-module i,.module .tile-art,.hyrule-module .tile-art{width:42px!important;height:42px!important;margin:0 0 4px!important;background:transparent!important;border:0!important;box-shadow:none!important}\n.module b,.hyrule-module b{font:bold clamp(10px,2.8vw,14px) Georgia!important;text-align:center!important;text-shadow:0 0 5px currentColor,0 0 10px currentColor!important}\n.module small,.hyrule-module small{display:none!important}\n@media(max-width:560px){.module,.hyrule-module{min-height:175px!important;padding:30px 10px 22px!important;gap:6px!important}}\n";
  document.head.append(style);

  style.textContent+=`
  .calendar-toolbar h2{margin:0!important;text-align:center}
  .calendar-controls{flex-wrap:wrap;margin:12px 0 16px}
  .calendar-controls .row{gap:5px}
  .calendar-month{overflow-x:auto}
  .cal-weekdays,.cal-month-grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));min-width:520px}
  .cal-weekdays b{text-align:center;padding:8px 2px;color:#e8c56a;font:700 11px Georgia,serif}
  .cal-cell{min-height:95px;border:1px solid #355b59;background:#0b2028;padding:4px;overflow:hidden}
  .cal-cell.outside{opacity:.45;background:#08171d}
  .cal-cell.today,.cal-agenda-day.today{border-color:#e8c56a;box-shadow:inset 0 0 12px #e8c56a22}
  .cal-date{display:block!important;background:transparent!important;border:0!important;color:#f5efd9!important;font-weight:800!important;padding:3px 5px!important;margin-bottom:3px}
  .cal-event{display:block;width:100%;text-align:left;margin:3px 0;padding:4px 5px;border:0;border-left:3px solid #e8c56a;border-radius:3px;background:#244b49;color:#fff;font:10px system-ui;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .cal-event small{opacity:.85}
  .cal-event.Health{border-color:#68c8b1;background:#17463f}
  .cal-event.Work{border-color:#a98aff;background:#352b55}
  .cal-event.Home{border-color:#e9a96c;background:#563a28}
  .cal-event.Fun{border-color:#ff70bb;background:#552747}
  .cal-event.Important{border-color:#ff626e;background:#57262f}
  .calendar-agenda{display:grid;gap:8px}
  .cal-agenda-day{padding:10px;border:1px solid #355b59;background:#0b2028}
  .cal-agenda-day .cal-date{font-size:14px!important;color:#e8c56a!important}
  .calendar-editor{margin-top:14px}
  .calendar-editor form{gap:10px}
  @media(max-width:560px){.cal-cell{min-height:82px;padding:2px}.cal-event{font-size:9px;padding:3px}.calendar-controls .btn{padding:7px 9px!important}}
`;



  style.textContent += `\n/* Navi's fairy announcement panel */\n.navi-panel{padding:0!important;overflow:hidden!important;border-color:#72d9ff!important;background:linear-gradient(145deg,#172f42,#101e31)!important;box-shadow:0 0 22px #53caff30,inset 0 0 18px #53caff18!important}.navi-banner{position:relative;width:100%;aspect-ratio:3/1;min-height:125px;max-height:190px;display:flex;align-items:center;justify-content:center;overflow:hidden;background:radial-gradient(ellipse at 50% 45%,#d9fbff 0%,#70dfff 9%,#218bc7 23%,#163b71 48%,#101d3b 78%);border-bottom:2px solid #8bdfff;box-shadow:0 4px 18px #45bfff66,inset 0 0 35px #9eeaff55}.navi-banner:before,.navi-banner:after{content:"";position:absolute;inset:-35%;background:repeating-conic-gradient(from 0deg at 50% 50%,transparent 0deg 12deg,#c9f7ff22 13deg 14deg,transparent 15deg 28deg);animation:navi-rays 28s linear infinite}.navi-banner:after{inset:0;background:radial-gradient(circle at 18% 25%,#fff9 0 1px,transparent 3px),radial-gradient(circle at 78% 22%,#fff9 0 1px,transparent 3px),radial-gradient(circle at 30% 76%,#fff8 0 2px,transparent 4px),radial-gradient(circle at 83% 70%,#fff8 0 2px,transparent 4px)}.navi-fairy{position:absolute;z-index:1;top:12%;left:50%;width:78px;height:78px;transform:translateX(-50%);filter:drop-shadow(0 0 12px #9df6ff)}.navi-core{position:absolute;inset:22px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff 0 8%,#c9fbff 22%,#63dcff 55%,#1787da 100%);box-shadow:0 0 18px 8px #68dfffaa,0 0 40px 18px #42baff55}.navi-wing{position:absolute;top:17px;width:35px;height:45px;border-radius:80% 20% 80% 20%;background:linear-gradient(135deg,#fff,#a7edff99 60%,#6bbcff66);border:1px solid #e6fcff;box-shadow:0 0 10px #b8f4ff88}.navi-wing.left{left:0;transform:rotate(-28deg)}.navi-wing.right{right:0;transform:scaleX(-1) rotate(-28deg)}.navi-banner-title{position:absolute;z-index:2;bottom:10px;left:50%;transform:translateX(-50%);white-space:nowrap;padding:5px 22px;border:2px solid #e5faff;border-radius:24px;background:#182337e8;color:#82caff;font:bold clamp(18px,4vw,28px) Georgia,serif;letter-spacing:.05em;text-shadow:0 0 10px #43baff;box-shadow:0 0 15px #72dfff55}.navi-spark{position:absolute;z-index:2;color:#e8fcff;text-shadow:0 0 12px #6be3ff;font-size:18px;animation:navi-float 3s ease-in-out infinite}.navi-spark.s1{left:20%;top:24%}.navi-spark.s2{right:20%;top:32%;animation-delay:.8s}.navi-spark.s3{left:28%;bottom:18%;animation-delay:1.4s}@keyframes navi-rays{to{transform:rotate(360deg)}}@keyframes navi-float{50%{transform:translateY(-7px);opacity:.65}}.navi-speech{padding:12px 16px 16px;text-align:center}.navi-name{font:800 11px Cinzel,Georgia,serif;letter-spacing:.2em;color:#8bdfff;text-shadow:0 0 9px #45bfff99}.navi-speech p{font:700 16px Georgia,serif;line-height:1.45;color:#f3f7ff;margin:8px 0 3px;text-shadow:0 1px 4px #071321}.navi-speech small{display:block;color:#9fb9cc;font:10px system-ui;margin-top:6px}\n`;
  checkBadges();
  if(typeof window.header==="function")window.header();
  go("home");
})();