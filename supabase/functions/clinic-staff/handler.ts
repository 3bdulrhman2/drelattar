// All privileged work stays on the server. Never return credentials or Auth tokens.
export function makeStaffHandler(client: any) {
  const headers = {'Content-Type':'application/json','Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info'};
  const reply = (status:number, body:unknown) => new Response(JSON.stringify(body),{status,headers});
  return async (req:Request) => {
    if(req.method==='OPTIONS') return new Response('ok',{headers});
    if(req.method!=='POST') return reply(405,{error:'method_not_allowed'});
    try {
      const token=req.headers.get('Authorization')?.replace(/^Bearer\s+/i,'');
      if(!token) return reply(401,{error:'unauthorized'});
      const {data:auth,error:authError}=await client.auth.getUser(token);
      if(authError||!auth?.user) return reply(401,{error:'unauthorized'});
      const {data:owner,error:ownerError}=await client.from('clinic_staff').select('role,is_active').eq('user_id',auth.user.id).maybeSingle();
      if(ownerError||owner?.role!=='admin'||!owner?.is_active) return reply(403,{error:'forbidden'});
      const body=await req.json();
      if(body.action==='list') {
        const {data:rows,error}=await client.from('clinic_staff').select('user_id,name,is_active').eq('role','secretary').limit(100);
        if(error) return reply(500,{error:'staff_read_failed'});
        const accounts=[];
        for(const row of rows||[]) {
          const {data,error}=await client.auth.admin.getUserById(row.user_id);
          if(error||!data?.user) return reply(500,{error:'staff_read_failed'});
          accounts.push({id:row.user_id,name:row.name,isActive:row.is_active,username:data.user.email,phone:data.user.user_metadata?.phone||null,createdAt:data.user.created_at});
        }
        return reply(200,{accounts});
      }
      if(body.action==='create') {
        const email=String(body.email||'').trim().toLowerCase();
        const name=String(body.name||'').trim();
        const password=String(body.password||'');
        if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||name.length<2||name.length>100||password.length<8||password.length>128) return reply(400,{error:'invalid_input'});
        const {data,error}=await client.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{name,phone:String(body.phone||'').slice(0,30)}});
        if(error||!data?.user) return reply(400,{error:'account_creation_failed'});
        const inserted=await client.from('clinic_staff').insert({user_id:data.user.id,name,role:'secretary',is_active:true});
        if(inserted.error) {
          const rollback=await client.auth.admin.deleteUser(data.user.id);
          return reply(500,{error:rollback.error?'staff_setup_failed_cleanup_needed':'staff_setup_failed'});
        }
        return reply(200,{ok:true});
      }
      if(!['update','delete'].includes(body.action)||typeof body.id!=='string') return reply(400,{error:'invalid_input'});
      const {data:target,error:targetError}=await client.from('clinic_staff').select('role').eq('user_id',body.id).maybeSingle();
      if(targetError||target?.role!=='secretary') return reply(403,{error:'not_secretary'});
      if(body.action==='delete') {
        const {error}=await client.auth.admin.deleteUser(body.id);
        return reply(error?500:200,error?{error:'delete_failed'}:{ok:true});
      }
      if(typeof body.isActive==='boolean') {
        const {error}=await client.from('clinic_staff').update({is_active:body.isActive}).eq('user_id',body.id).eq('role','secretary');
        return reply(error?500:200,error?{error:'update_failed'}:{ok:true});
      }
      if(typeof body.password==='string'&&body.password.length>=8&&body.password.length<=128) {
        const {error}=await client.auth.admin.updateUserById(body.id,{password:body.password});
        return reply(error?500:200,error?{error:'password_update_failed'}:{ok:true});
      }
      return reply(400,{error:'invalid_input'});
    } catch { return reply(500,{error:'request_failed'}); }
  };
}
