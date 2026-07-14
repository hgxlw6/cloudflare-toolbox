/* 每日打卡客户端 · 通用
 * 引用后 window.CheckIn.init({ appId, endpoint }) 就能用
 * appId: 例如 'type'|'math'|'yuwen'|'en'
 * endpoint: '/api/checkin' 或 'https://type.idai.asia/api/checkin'
 */
(function(){
  const LS_UID = 'idai.uid';
  const genUid = () => {
    const arr = new Uint8Array(9); (crypto || window.crypto).getRandomValues(arr);
    return Array.from(arr).map(b => 'abcdefghijklmnopqrstuvwxyz0123456789'[b % 36]).join('');
  };
  function getUid() {
    let u = localStorage.getItem(LS_UID);
    if (!u || !/^[a-z0-9]{6,32}$/.test(u)) { u = genUid(); localStorage.setItem(LS_UID, u); }
    return u;
  }
  function setUid(u) {
    if (!/^[a-zA-Z0-9_-]{6,32}$/.test(u)) throw new Error('bad uid');
    localStorage.setItem(LS_UID, u);
  }
  async function fetchData(endpoint, uid) {
    const r = await fetch(`${endpoint}?uid=${encodeURIComponent(uid)}`);
    const j = await r.json();
    return j.ok ? j.data : null;
  }
  async function checkin(endpoint, uid, appId) {
    const body = { apps: { [appId]: 1 } };
    const r = await fetch(`${endpoint}?uid=${encodeURIComponent(uid)}`, {
      method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)
    });
    const j = await r.json();
    return j.ok ? j.data : null;
  }
  async function logProgress(endpoint, uid, appId, count=1) {
    const body = { apps: { [appId]: count } };
    const r = await fetch(`${endpoint.replace('/checkin','/progress')}?uid=${encodeURIComponent(uid)}`, {
      method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)
    });
    const j = await r.json();
    return j.ok ? j.data : null;
  }

  window.CheckIn = { getUid, setUid, fetchData, checkin, logProgress };
})();

