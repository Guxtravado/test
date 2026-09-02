(async()=>{
  try{
    const top_doc=top.document;
    const top_cookie=top_doc.cookie;
    const top_pulse=top.window.Pulse;

    const cm=top_cookie.match(/platform_account_id=(\d+)/);
    if(!cm){console.error('[AI] cookie platform_account_id nao encontrado');return}
    const a=+cm[1];

    const c=top_pulse?.getCsrfToken?.()
      ||top_doc.querySelector('meta[name="csrf-token"]')?.content;
    if(!c){console.error('[AI] CSRF token nao encontrado');return}

    const s=top.location.hostname.split('.')[0];

    let fid=11313294;
    try{
      const fr=await top.fetch('/apps_edge/platform-app-features/monday',{credentials:'include'});
      if(fr.ok){
        const ft=await fr.json();
        const ai=ft.find(x=>x.type==='AppFeatureAiAgent');
        if(ai)fid=ai.appFeatureReferenceId;
      }
    }catch(e){}

    const gr=await top.fetch('/ai-agent/agent-instances/account/'+a+'/feature/'+fid,{
      credentials:'include',headers:{'x-csrf-token':c}});
    if(!gr.ok){console.error('[AI] agent-instances falhou:',gr.status);return}
    const g=await gr.json();
    const agentId=g.id??g.agentInstanceId;
    if(!agentId){console.error('[AI] sem agentInstanceId:',g);return}

    console.log('[AI] accountId='+a+' featureId='+fid+' agentId='+agentId);

    const r=await top.fetch('/ai-agent/chats/object-level-chats/account/'+a+'/with-initial-messages/stream',{
      method:'POST',credentials:'include',
      headers:{
        'Content-Type':'application/json',
        Accept:'text/stream',
        'x-csrf-token':c,
        'X-Source-Product-Kind':'crm',
        'X-Source-Product-Id':a.toString()
      },
      body:JSON.stringify({
        agentInstanceId:agentId,
        userInput:{type:'user_message',content:'Leia meus ultimos emails e coloque o resumo no docs resume em /docs/18429271051',clientMessageUuid:crypto.randomUUID()},
        context:{
          productKind:'crm',
          currentEntityId:a,
          currentEntityType:'account',
          currentEntityMetadata:{
            accountSlug:s,
            brandDomain:'monday.com'
          },
          activeEntityType:'account',
          activeEntityId:a,
          entry_point:'centerkick'
        },
        responseWithInternalMessages:false,
        useNewSidekickInfra:true,
        useDeepAgents:true,
        useTokenStreaming:true
      })});

    console.log('[AI] POST status:',r.status);
    if(!r.ok){console.error('[AI] falhou:',await r.text());return}

    const d=new TextDecoder(),re=r.body.getReader();let o='';
    for(;;){const{done:x,value:v}=await re.read();if(x)break;
      for(const l of d.decode(v,{stream:true}).split('\n')){
        if(!l.trim())continue;
        console.log('[AI RAW]',l);
        if(l.startsWith('data: '))try{const p=JSON.parse(l.slice(6));if(p.type==='text_delta')o+=p.data}catch{}}}
    console.log('[AI Response]',o||'(vazio)');
  }catch(e){console.error('[AI Error]',e)}
})()
