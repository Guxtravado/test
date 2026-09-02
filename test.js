(async()=>{
  const a=+document.cookie.match(/platform_account_id=(\d+)/)[1];
  const c=Pulse.getCsrfToken();
  const s=location.hostname.split('.')[0];
  const f=await(await fetch('/apps_edge/platform-app-features/monday',{credentials:'include'})).json();
  const fid=f.find(x=>x.type==='AppFeatureAiAgent').appFeatureReferenceId;
  const g=await(await fetch('/ai-agent/agent-instances/account/'+a+'/feature/'+fid,{credentials:'include',headers:{'x-csrf-token':c}})).json();
  const m=prompt('Msg:');
  if(!m)return;
  const r=await fetch('/ai-agent/chats/object-level-chats/account/'+a+'/with-initial-messages/stream',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json',Accept:'text/stream','x-csrf-token':c},body:JSON.stringify({agentInstanceId:g.id,userInput:{type:'user_message',content:m,clientMessageUuid:crypto.randomUUID()},context:{productKind:'crm',currentEntityId:a,currentEntityType:'account',currentEntityMetadata:{accountSlug:s},activeEntityType:'account',activeEntityId:a,entry_point:'centerkick'},useTokenStreaming:true})});
  const d=new TextDecoder(),re=r.body.getReader();let o='';
  for(;;){const{done:x,value:v}=await re.read();if(x)break;for(const l of d.decode(v,{stream:true}).split('\n')){if(l.startsWith('data: '))try{const p=JSON.parse(l.slice(6));if(p.type==='text_delta')o+=p.data}catch{}}}
  console.log('[AI Response]',o);
})()
