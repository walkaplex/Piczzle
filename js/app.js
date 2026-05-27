(()=>{const DEMO="assets/demo-splash.png";const $=id=>document.getElementById(id);const native=window.PiczzleNative||{};const el={app:$("app"),file:$("fileInput"),camera:$("cameraBtn"),demo:$("demoBtn"),source:$("sourcePreview"),cropImg:$("cropImg"),cropStage:$("cropStage"),zoom:$("zoomRange"),create:$("createBtn"),shareBtn:$("shareBtn"),newBtn:$("newBtn"),shareModal:$("shareModal"),missingShareModal:$("missingShareModal"),missingShareClose:$("missingShareCloseBtn"),shareLink:$("shareLink"),copyShare:$("copyShareBtn"),openShare:$("openShareBtn"),closeShare:$("closeShareBtn"),board:$("board"),tray:$("tray"),time:$("timeStat"),moves:$("movesStat"),left:$("leftStat"),size:$("sizeStat"),select:$("selectText"),toast:$("toast"),modal:$("modal"),modalTitle:$("modalTitle"),modalMessage:$("modalMessage"),again:$("againBtn"),close:$("closeBtn")};const state={src:DEMO,size:4,cropX:0,cropY:0,zoom:1,minZoom:1,img:null,pieces:[],board:[],tray:[],selected:null,moves:0,time:0,timer:null,solved:false,hint:false,shared:false,dragging:false,lastX:0,lastY:0,baseScale:1,square:DEMO,drag:null,cropRatio:4/3,outW:1200,outH:900};const SHARE_PREFIX="piczzle.share.";function tap(){if(native.selection)native.selection()}function impact(){if(native.lightImpact)native.lightImpact()}function success(){if(native.success)native.success()}function toast(t){el.toast.textContent=t;el.toast.classList.add("show");clearTimeout(state.tt);state.tt=setTimeout(()=>el.toast.classList.remove("show"),1700)}
function setMobileStep(step){
  const panel=document.querySelector(".panel");
  if(!panel)return;
  panel.classList.remove("mobile-upload","mobile-crop","mobile-size");
  panel.classList.add("mobile-"+step);
  const label=document.getElementById("mobileStepLabel");
  if(label){
    label.textContent=step==="upload"?"Choose photo":step==="crop"?"Step 2 of 3 - Frame photo":"Step 3 of 3 - Choose size";
  }
  const map={upload:0,crop:1,size:2};
  ["Upload","Crop","Size","Play"].forEach((x,i)=>$("step"+x).classList.toggle("active",i<=map[step]));
  if(window.matchMedia("(max-width:850px)").matches) window.scrollTo({top:0,behavior:"smooth"});
}function fmt(s){return String(Math.floor(s/60)).padStart(2,"0")+":"+String(s%60).padStart(2,"0")}function steps(n){["Upload","Crop","Size","Play"].forEach((x,i)=>$("step"+x).classList.toggle("active",i<=n))}function setSize(n){state.size=n;document.querySelectorAll(".sizeBtn").forEach(b=>b.classList.toggle("active",+b.dataset.size===n));el.size.textContent=n+"x"+n}document.querySelectorAll(".sizeBtn").forEach(b=>b.onclick=()=>{tap();setSize(+b.dataset.size)});function load(src){return new Promise((res,rej)=>{const im=new Image();im.onload=()=>res(im);im.onerror=rej;if(src.startsWith("data:")||src.startsWith("blob:")){im.src=src;return}fetch(src).then(r=>r.blob()).then(b=>{const fr=new FileReader();fr.onload=()=>{im.src=fr.result};fr.onerror=()=>{im.crossOrigin="anonymous";im.src=src};fr.readAsDataURL(b)}).catch(()=>{im.crossOrigin="anonymous";im.src=src})})}async function setImage(src){
  state.src=src;
  el.source.src=src;
  el.cropImg.src=src;
  state.img=await load(src);

  // Important mobile fix:
  // The cropStage has no real size while the crop screen is hidden.
  // Show the crop step first, then wait for layout before measuring and positioning the image.
  setMobileStep("crop");
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      resetCrop();
      toast("Image ready");
    });
  });
}function resetCrop(){
  const r=el.cropStage.getBoundingClientRect();
  const stageW = r.width || el.cropStage.offsetWidth || 320;
  const stageH = r.height || el.cropStage.offsetHeight || stageW;
  const iw=state.img.naturalWidth, ih=state.img.naturalHeight;

  // cover scale = current behavior (fills the 4:3 frame)
  const coverScale = Math.max(stageW/iw, stageH/ih);

  // contain scale = whole image fits inside the 4:3 frame (may leave empty room)
  const containScale = Math.min(stageW/iw, stageH/ih);

  state.baseScale = coverScale;
  state.minZoom = Math.max(0.2, Math.min(1, containScale / coverScale));
  state.zoom = 1;
  state.cropX = 0;
  state.cropY = 0;

  el.zoom.min = String(state.minZoom);
  el.zoom.max = "3";
  el.zoom.value = "1";

  applyCrop();
}function applyCrop(){if(!state.img)return;const iw=state.img.naturalWidth,ih=state.img.naturalHeight,s=state.baseScale*state.zoom;el.cropImg.style.width=iw*s+"px";el.cropImg.style.height=ih*s+"px";el.cropImg.style.transform=`translate(-50%, -50%) translate(${state.cropX}px, ${state.cropY}px)`}function clamp(){
  const r=el.cropStage.getBoundingClientRect();
  const stageW = r.width || el.cropStage.offsetWidth || 320;
  const stageH = r.height || el.cropStage.offsetHeight || stageW;
  const iw = state.img.naturalWidth * state.baseScale * state.zoom;
  const ih = state.img.naturalHeight * state.baseScale * state.zoom;

  if (iw <= stageW) state.cropX = 0;
  else state.cropX = Math.max(-(iw-stageW)/2, Math.min((iw-stageW)/2, state.cropX));

  if (ih <= stageH) state.cropY = 0;
  else state.cropY = Math.max(-(ih-stageH)/2, Math.min((ih-stageH)/2, state.cropY));
}el.zoom.oninput=()=>{state.zoom=Math.max(state.minZoom, +el.zoom.value);clamp();applyCrop()};el.cropStage.addEventListener("pointerdown",e=>{state.dragging=true;state.lastX=e.clientX;state.lastY=e.clientY;try{el.cropStage.setPointerCapture(e.pointerId)}catch(_){}});el.cropStage.addEventListener("pointermove",e=>{if(!state.dragging)return;state.cropX+=e.clientX-state.lastX;state.cropY+=e.clientY-state.lastY;state.lastX=e.clientX;state.lastY=e.clientY;clamp();applyCrop()});["pointerup","pointercancel","pointerleave"].forEach(ev=>el.cropStage.addEventListener(ev,()=>state.dragging=false));async function cropSquare(){
  const img = await load(state.src);
  const stage = el.cropStage.getBoundingClientRect();
  const stageW = stage.width || el.cropStage.offsetWidth || 320;
  const stageH = stage.height || el.cropStage.offsetHeight || Math.round(stageW * 3 / 4);

  const can = document.createElement("canvas");
  can.width = state.outW;
  can.height = state.outH;
  const ctx = can.getContext("2d");

  // Match the live 4:3 crop preview faithfully.
  // If the user zooms out, preserve the empty room instead of forcing the image to fill.
  ctx.fillStyle = "#090d16";
  ctx.fillRect(0, 0, state.outW, state.outH);

  const previewScale = (state.baseScale * state.zoom) || Math.max(stageW / img.naturalWidth, stageH / img.naturalHeight);
  const canvasScale = state.outW / stageW;
  const drawScale = previewScale * canvasScale;

  const drawW = img.naturalWidth * drawScale;
  const drawH = img.naturalHeight * drawScale;
  const dx = (state.outW - drawW) / 2 + (state.cropX * canvasScale);
  const dy = (state.outH - drawH) / 2 + (state.cropY * canvasScale);

  ctx.drawImage(img, dx, dy, drawW, drawH);
  return can.toDataURL("image/jpeg", .92);
}function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}function start(){if(!state.timer)state.timer=setInterval(()=>{state.time++;stats()},1000)}function stop(){clearInterval(state.timer);state.timer=null}function stats(){el.time.textContent=fmt(state.time);el.moves.textContent=state.moves;el.left.textContent=state.tray.length;el.size.textContent=state.size+"x"+state.size}
function hasTraySelection(){
  return state.selected && state.selected.from==="tray";
}
function goHome(){
  el.modal.classList.remove("show");
  if(el.shareModal) el.shareModal.classList.remove("show");
  if(el.missingShareModal) el.missingShareModal.classList.remove("show");
  el.app.classList.remove("playMode");
  state.board=[];
  state.tray=[];
  state.pieces=[];
  state.selected=null;
  state.moves=0;
  state.time=0;
  state.solved=false;
  state.hint=false;
  state.shared=false;
  stop();
  draw();
  setMobileStep("upload");
  if(new URLSearchParams(location.search).has("puzzle")) history.replaceState(null,"",location.pathname);
  window.scrollTo({top:0,behavior:"smooth"});
}
function hideHintAfterMove(){
  if(!state.hint) return;
  state.hint=false;
  const hintBtn=$("hintBtn");
  if(hintBtn) hintBtn.textContent="Hint";
  if(el.board) el.board.classList.remove("hintOn");
}
async function startPuzzleFromImage(image,n,message,options){
  state.square=image;
  state.size=n;
  state.shared=Boolean(options&&options.shared);
  const img=await load(state.square);
  const pieceW=img.naturalWidth/n;
  const pieceH=img.naturalHeight/n;
  state.pieces=[];
  for(let r=0;r<n;r++){
    for(let c=0;c<n;c++){
      const id=r*n+c,can=document.createElement("canvas");
      can.width=300;
      can.height=225;
      can.getContext("2d").drawImage(img,c*pieceW,r*pieceH,pieceW,pieceH,0,0,300,225);
      state.pieces.push({id,url:can.toDataURL("image/jpeg",.92)});
    }
  }
  state.board=Array(n*n).fill(null);
  state.tray=shuffle(state.pieces.map(p=>p.id));
  state.selected=null;
  state.moves=0;
  state.time=0;
  state.solved=false;
  state.hint=false;
  stop();
  draw();
  steps(3);
  el.app.classList.add("playMode");
  window.scrollTo({top:0,behavior:"smooth"});
  toast(message||"Puzzle created");
}
async function compactShareImage(image){
  const img=await load(image);
  const can=document.createElement("canvas");
  can.width=900;
  can.height=675;
  can.getContext("2d").drawImage(img,0,0,can.width,can.height);
  return can.toDataURL("image/jpeg",.78);
}
function publicShareBase(){
  const url=new URL(window.location.href);
  url.hash="";
  url.search="";
  url.pathname=url.pathname.replace(/[^/]*$/,"index.html");
  return url.toString();
}
function shareUrl(id){return `${publicShareBase()}?puzzle=${encodeURIComponent(id)}`}
function appShareUrl(id){
  const url=new URL(window.location.href);
  url.hash="";
  url.search="";
  url.searchParams.set("puzzle",id);
  return url.toString();
}
async function sharePuzzle(){
  impact();
  toast("Creating share link...");
  const cloud=window.PiczzleShareCloud;
  const image=cloud&&cloud.isReady()?await compactShareImage(await cropSquare()):await cropSquare();
  const id=(window.crypto&&window.crypto.randomUUID)?window.crypto.randomUUID().slice(0,12):Date.now().toString(36)+Math.random().toString(36).slice(2,8);
  const data={id,image,size:state.size,createdAt:new Date().toISOString(),v:1};
  let link=shareUrl(id);
  let message="Share preview saved";
  try{
    if(cloud&&cloud.isReady()){
      const saved=await cloud.savePuzzle(data);
      link=cloud.publicLink(saved.id||id);
      message="Share link created";
    }else{
      localStorage.setItem(SHARE_PREFIX+id,JSON.stringify(data));
    }
  }catch(_){
    localStorage.setItem(SHARE_PREFIX+id,JSON.stringify(data));
    message="Cloud unavailable - saved test link";
  }
  if(el.shareLink)el.shareLink.value=link;
  if(el.openShare){
    const inAppLink=native.isNative?appShareUrl(id):link;
    el.openShare.href=inAppLink;
    el.openShare.dataset.appHref=inAppLink;
  }
  if(el.shareModal)el.shareModal.classList.add("show");
  toast(message);
}
async function loadSharedPuzzle(data){
  if(!data||!data.image){
    throw new Error("Missing shared puzzle image");
  }
  await startPuzzleFromImage(data.image,data.size||4,"Puzzle received",{shared:true});
  if(el.select)el.select.textContent="Received puzzle - solve it to reveal the photo";
  requestAnimationFrame(()=>window.scrollTo({top:0,behavior:"smooth"}));
}
async function create(){impact();await startPuzzleFromImage(await cropSquare(),state.size,"Puzzle created")}function piece(id){return state.pieces.find(p=>p.id===id)}function select(from,index){if(state.drag&&state.drag.moved)return;tap();if(state.selected&&state.selected.from===from&&state.selected.index===index)state.selected=null;else state.selected={from,index};draw()}function place(i){if(!state.selected||state.solved)return;start();if(state.selected.from==="tray"){const id=state.tray[state.selected.index];if(id==null)return;const old=state.board[i];state.tray.splice(state.selected.index,1);if(old!=null)state.tray.push(old);state.board[i]=id}else{const from=state.selected.index;if(from===i){state.selected=null;draw();return}const a=state.board[from],b=state.board[i];state.board[i]=a;state.board[from]=b}impact();state.moves++;state.selected=null;hideHintAfterMove();draw();check()}function remove(){if(!state.selected||state.selected.from!=="board")return;start();const id=state.board[state.selected.index];state.board[state.selected.index]=null;state.tray.push(id);impact();state.selected=null;state.moves++;hideHintAfterMove();draw()}function dropPayloadToSlot(payload,i){state.selected=payload;place(i)}function dropPayloadToTray(payload){if(payload.from!=="board")return;state.selected=payload;remove()}function make(id,from,index){const b=document.createElement("button");b.className=(from==="tray"?"trayPiece ":"")+"piece";b.dataset.from=from;b.dataset.index=index;if(state.selected&&state.selected.from===from&&state.selected.index===index)b.classList.add("selected");const im=document.createElement("img");im.src=piece(id).url;b.appendChild(im);b.onclick=e=>{e.stopPropagation();select(from,index)};b.addEventListener("pointerdown",e=>beginDrag(e,b,{from,index,id}));return b}function beginDrag(e,node,payload){if(e.button!==undefined&&e.button!==0)return;state.drag={payload,startX:e.clientX,startY:e.clientY,x:e.clientX,y:e.clientY,moved:false,ghost:null};try{node.setPointerCapture(e.pointerId)}catch(_){}node.addEventListener("pointermove",dragMove);node.addEventListener("pointerup",dragEnd,{once:true});node.addEventListener("pointercancel",dragEnd,{once:true});function dragMove(ev){const d=state.drag;if(!d)return;d.x=ev.clientX;d.y=ev.clientY;if(!d.moved&&Math.hypot(d.x-d.startX,d.y-d.startY)>8){d.moved=true;d.ghost=node.cloneNode(true);d.ghost.className="dragGhost";document.body.appendChild(d.ghost)}if(d.ghost){d.ghost.style.left=d.x+"px";d.ghost.style.top=d.y+"px";markDrop(d.x,d.y)}}function dragEnd(ev){node.removeEventListener("pointermove",dragMove);clearDropMarks();const d=state.drag;if(!d)return;if(d.ghost)d.ghost.remove();if(d.moved){const target=document.elementFromPoint(ev.clientX,ev.clientY);const slot=target&&target.closest?target.closest(".slot"):null;const tray=target&&target.closest?target.closest("#tray"):null;if(slot){dropPayloadToSlot(d.payload,+slot.dataset.i)}else if(tray){dropPayloadToTray(d.payload)}}setTimeout(()=>{state.drag=null},0)}}function markDrop(x,y){clearDropMarks();const target=document.elementFromPoint(x,y);const slot=target&&target.closest?target.closest(".slot"):null;const tray=target&&target.closest?target.closest("#tray"):null;if(slot)slot.classList.add("dropTarget");if(tray)tray.classList.add("dropTarget")}function clearDropMarks(){document.querySelectorAll(".dropTarget").forEach(x=>x.classList.remove("dropTarget"))}function draw(){const n=state.size;el.board.innerHTML="";el.board.classList.remove("grid4","grid6","grid8");if(!state.pieces.length){el.tray.innerHTML="";el.select.textContent="No piece selected";stats();return}el.board.classList.add("grid"+n);el.board.style.gridTemplateColumns=`repeat(${n},1fr)`;el.board.style.gridTemplateRows=`repeat(${n},1fr)`;const h=document.createElement("div");h.className="hint";h.style.backgroundImage=`url(${state.square})`;h.style.opacity=state.hint?".18":"0";el.board.classList.toggle("hintOn", state.hint);el.board.appendChild(h);state.board.forEach((id,i)=>{const s=document.createElement("div");
s.className=hasTraySelection()&&id==null?"slot placementTarget":"slot";
s.dataset.i=i;
s.style.setProperty("--hint-img", `url(${piece(i).url})`);
if(state.selected&&state.selected.from==="board"&&state.selected.index===i)s.classList.add("target");
s.onclick=()=>place(i);
if(id!=null)s.appendChild(make(id,"board",i));
el.board.appendChild(s)});el.tray.innerHTML="";if(!state.tray.length){const p=document.createElement("p");p.className="muted";p.textContent="No loose pieces.";p.style.padding="8px";el.tray.appendChild(p)}else state.tray.forEach((id,i)=>el.tray.appendChild(make(id,"tray",i)));el.tray.onclick=e=>{if(e.target===el.tray)remove()};el.select.textContent=state.selected?(state.selected.from==="tray"?"Piece selected - tap a square":"Board piece selected - tap another square or Remove"):"No piece selected";stats()}function check(){if(state.board.length&&state.board.every((id,i)=>id===i)){state.solved=true;success();stop();$("modalTime").textContent=fmt(state.time);$("modalMoves").textContent=state.moves;$("modalSize").textContent=state.size+"x"+state.size;if(el.modalTitle)el.modalTitle.textContent=state.shared?"Puzzle solved":"Puzzle complete";if(el.modalMessage)el.modalMessage.textContent=state.shared?"You revealed the photo. Now send one back.":"Nice work. Your puzzle is finished.";if(el.again)el.again.textContent=state.shared?"Send One Back":"Play Again";if(el.close)el.close.textContent=state.shared?"Back to Piczzle":"Back to Start";el.modal.classList.add("show")}}$("shuffleBtn").onclick=()=>{tap();state.tray=shuffle(state.tray);draw();toast("Shuffled")};$("hintBtn").onclick=()=>{tap();state.hint=!state.hint;$("hintBtn").textContent=state.hint?"Hide":"Hint";draw()};$("restartBtn").onclick=()=>{impact();state.board=Array(state.size*state.size).fill(null);state.tray=shuffle(state.pieces.map(p=>p.id));state.selected=null;state.moves=0;state.time=0;state.solved=false;stop();draw();toast("Restarted")};$("solveBtn").onclick=()=>{impact();state.board=state.pieces.map(p=>p.id);state.tray=[];state.solved=true;stop();draw();check()};$("removeBtn").onclick=remove;$("unselectBtn").onclick=()=>{tap();state.selected=null;draw()};$("editBtn").onclick=()=>{tap();el.app.classList.remove("playMode");steps(2);window.scrollTo({top:0,behavior:"smooth"})};el.create.onclick=create;if(el.shareBtn)el.shareBtn.onclick=sharePuzzle;if(el.copyShare)el.copyShare.onclick=async()=>{if(!el.shareLink)return;el.shareLink.select();try{await navigator.clipboard.writeText(el.shareLink.value);toast("Link copied")}catch(_){document.execCommand("copy");toast("Link copied")}};if(el.openShare)el.openShare.onclick=e=>{if(!native.isNative)return;e.preventDefault();window.location.href=el.openShare.dataset.appHref||el.openShare.href};if(el.closeShare)el.closeShare.onclick=()=>el.shareModal.classList.remove("show");if(el.missingShareClose)el.missingShareClose.onclick=goHome;el.newBtn.onclick=()=>{el.app.classList.remove("playMode");state.board=[];state.tray=[];state.pieces=[];state.moves=0;state.time=0;stop();draw();setMobileStep("upload")};const mbu=$("mobileBackUpload"), mts=$("mobileToSize"), mbc=$("mobileBackCrop");
if(mbu) mbu.onclick=()=>{tap();setMobileStep("upload")};
if(mts) mts.onclick=()=>{tap();setMobileStep("size")};
if(mbc) mbc.onclick=()=>{tap();setMobileStep("crop")};
if (el.demo) el.demo.onclick=()=>setImage(DEMO);
document.querySelectorAll(".demoCard").forEach(btn=>{
  btn.addEventListener("click",()=>{
    tap();
    const src = btn.getAttribute("data-demo");
    if(src) setImage(src);
  });
});
if(el.camera) el.camera.onclick=()=>{
  tap();
  el.file.setAttribute("capture","environment");
  el.file.click();
};
el.file.onchange=e=>{const f=e.target.files&&e.target.files[0];el.file.removeAttribute("capture");if(!f)return;const r=new FileReader();r.onload=()=>setImage(r.result);r.readAsDataURL(f)};$("againBtn").onclick=()=>{if(state.shared){goHome();toast("Choose a photo to send back");return}$("restartBtn").click();el.modal.classList.remove("show")};
$("closeBtn").onclick=goHome;
el.newBtn.onclick=goHome;
const toolActions={
  shuffle:()=>{$("shuffleBtn").onclick()},
  hint:()=>{$("hintBtn").onclick()},
  restart:()=>{$("restartBtn").onclick()},
  solve:()=>{$("solveBtn").onclick()},
  remove:()=>{$("removeBtn").onclick()},
  edit:()=>{$("editBtn").onclick()}
};
const toolIds={shuffleBtn:"shuffle",hintBtn:"hint",restartBtn:"restart",solveBtn:"solve",removeBtn:"remove",editBtn:"edit"};
const toolsEl=document.querySelector(".tools");
if(toolsEl){
  toolsEl.addEventListener("pointerup",e=>{
    const btn=e.target&&e.target.closest?e.target.closest("button"):null;
    const action=btn&&toolIds[btn.id];
    if(!action)return;
    e.preventDefault();
    state.toolPointerHandled=true;
    state.toolPointerSuppressUntil=Date.now()+500;
    setTimeout(()=>{state.toolPointerHandled=false},0);
    toolActions[action]();
  });
  toolsEl.addEventListener("click",e=>{
    if(!state.toolPointerHandled && Date.now()>(state.toolPointerSuppressUntil||0))return;
    const btn=e.target&&e.target.closest?e.target.closest("button"):null;
    if(btn&&toolIds[btn.id]){
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);
}
/* Concept B.4: top stepper works on both mobile and desktop. */
const topUpload = $("stepUpload");
const topCrop = $("stepCrop");
const topSize = $("stepSize");
const topPlay = $("stepPlay");

function focusDesktopSection(selector){
  const target = document.querySelector(selector);
  if(!target) return;
  document.querySelectorAll(".stepFocus").forEach(x => x.classList.remove("stepFocus"));
  target.classList.add("stepFocus");
  target.scrollIntoView({behavior:"smooth", block:"center"});
  setTimeout(() => target.classList.remove("stepFocus"), 900);
}

function isMobileFlow(){
  return window.matchMedia("(max-width:850px)").matches;
}

if (topUpload) topUpload.onclick = () => {
  if(isMobileFlow()){
    el.app.classList.remove("playMode");
    setMobileStep("upload");
  } else {
    focusDesktopSection(".uploadChunk");
  }
};

if (topCrop) topCrop.onclick = () => {
  if(isMobileFlow()){
    el.app.classList.remove("playMode");
    setMobileStep("crop");
  } else {
    focusDesktopSection(".cropChunk");
  }
};

if (topSize) topSize.onclick = () => {
  if(isMobileFlow()){
    el.app.classList.remove("playMode");
    setMobileStep("size");
  } else {
    focusDesktopSection(".sizeChunk");
  }
};

if (topPlay) topPlay.onclick = () => {
  if(isMobileFlow()){
    if (state.pieces && state.pieces.length) {
      el.app.classList.add("playMode");
      steps(3);
      window.scrollTo({top:0,behavior:"smooth"});
    } else {
      create();
    }
  } else {
    focusDesktopSection(".game");
  }
};

function loadDefaultStart(){
  setSize(4);
  state.src=DEMO;
  el.source.src=DEMO;
  el.cropImg.src=DEMO;
  load(DEMO).then(img=>{
    state.img=img;
    draw();
    setMobileStep("upload");
  });
}
function showMissingSharedPuzzle(){
  loadDefaultStart();
  if(el.missingShareModal)el.missingShareModal.classList.add("show");
  toast("Shared puzzle unavailable");
}
const requestedPuzzle=new URLSearchParams(location.search).get("puzzle");
if(requestedPuzzle){
  const saved=localStorage.getItem(SHARE_PREFIX+requestedPuzzle);
  if(saved){
    setSize(4);
    loadSharedPuzzle(JSON.parse(saved)).catch(showMissingSharedPuzzle);
  }else{
    const cloud=window.PiczzleShareCloud;
    if(cloud&&cloud.isReady()){
      setSize(4);
      cloud.loadPuzzle(requestedPuzzle).then(data=>{
        if(data) return loadSharedPuzzle(data);
        showMissingSharedPuzzle();
      }).catch(showMissingSharedPuzzle);
    }else{
      showMissingSharedPuzzle();
    }
  }
}else{
  loadDefaultStart();
}})();
