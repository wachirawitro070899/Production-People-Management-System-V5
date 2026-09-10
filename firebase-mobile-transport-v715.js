/* V715: mobile Firebase transport compatibility.
   Some iPhone/Safari networks block or stall WebSocket upgrades. Force the
   Realtime Database SDK to use HTTP long-polling before any database instance
   is created. */
(()=>{
 try{
  if(window.firebase?.database?.INTERNAL?.forceLongPolling){
   window.firebase.database.INTERNAL.forceLongPolling();
   window.__ppmsFirebaseTransport='long-polling-v715';
  }
 }catch(error){
  console.warn('V715 could not force Firebase long polling',error);
 }
})();
