(()=>{
  const prompt=document.getElementById("selectText");
  if(!prompt) return;

  const messages={
    "Piece selected — tap a square":"Piece selected — tap an open square",
    "Board piece selected — tap another square or Remove":"Board piece selected — tap another square, or Remove"
  };

  function updatePrompt(){
    const next=messages[prompt.textContent];
    if(next){
      prompt.textContent=next;
      prompt.classList.add("piecePrompt");
    }else{
      prompt.classList.remove("piecePrompt");
    }
  }

  new MutationObserver(updatePrompt).observe(prompt,{childList:true,characterData:true,subtree:true});
  updatePrompt();
})();
