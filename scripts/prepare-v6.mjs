import fs from 'node:fs';import {parse} from 'acorn';
const modules=['model-v6.js','screens-v6.js','planning-v6.js','focus-v6.js'];
const overrides=new Set(modules.flatMap(f=>parse(fs.readFileSync('src/'+f,'utf8'),{ecmaVersion:'latest'}).body.filter(n=>n.type==='FunctionDeclaration').map(n=>n.id.name)));
for(const f of ['app.js','features.js']){let src=fs.readFileSync('src/'+f,'utf8');const aliases=f==='app.js'?{validateState:'validateV4',goalWizard:'goalWizardV5',openGoal:'openGoalV5',toggleFocus:'toggleFocusV5',stopSound:'stopSoundV5'}:{save:'saveV5',renderSettings:'settingsV5',renderData:'dataV5',applyBackup:'applyBackupV5',resetBusinessData:'resetBusinessDataV5'};
for(const [name,alias]of Object.entries(aliases))src=src.replace(new RegExp('function '+name+'\\('),'function '+alias+'(');
const ast=parse(src,{ecmaVersion:'latest'});for(const n of ast.body.filter(n=>n.type==='FunctionDeclaration'&&overrides.has(n.id.name)).reverse())src=src.slice(0,n.start)+src.slice(n.end);
if(f==='app.js'){src=src.replace("journal:[],habitLogs:{}","journal:[],trash:[],reviews:[],habitLogs:{}");src=src.replace("settings:{focus:25", "settings:{density:'comfortable',favorites:['tasks','habits','planner'],domains:['Santé','Famille','Carrière','Finance','Développement','Spiritualité','Relations','Loisirs'],notifications:false,autoCycles:false,cycles:4,focus:25");}
src=src.replaceAll('V5','V6').replaceAll('5.0.0','6.0.0');
// Keep original compatibility aliases and existing V5 storage keys stable.
for(const alias of Object.values(aliases))src=src.replaceAll(alias.replace('V5','V6'),alias);
// V5 backup bridge and schema stay compatible; function name used by V6 boot.
src=src.replaceAll('bootV6(){await refreshNative()', 'bootV5(){await refreshNative()');
fs.writeFileSync('src/'+f,src);}
