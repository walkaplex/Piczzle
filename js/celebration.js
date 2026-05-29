(() => {
  const modal = document.getElementById("modal");
  if (!modal || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const colors = ["#55d7ff", "#747cff", "#32e6a3", "#ffcf5a", "#ff6fb1"];
  let canvas;
  let ctx;
  let animationFrame;
  let stopTimer;

  function resize() {
    if (!canvas) return;
    const scale = window.devicePixelRatio || 1;
    canvas.width = Math.floor(window.innerWidth * scale);
    canvas.height = Math.floor(window.innerHeight * scale);
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
  }

  function burst(x, y) {
    const count = 24;
    return Array.from({ length: count }, (_, i) => {
      const angle = (Math.PI * 2 * i) / count;
      const speed = 2.4 + Math.random() * 3;
      return {
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 42 + Math.random() * 18,
        age: 0,
        color: colors[Math.floor(Math.random() * colors.length)]
      };
    });
  }

  function start() {
    if (canvas) canvas.remove();
    canvas = document.createElement("canvas");
    canvas.className = "celebrationCanvas";
    modal.prepend(canvas);
    ctx = canvas.getContext("2d");
    resize();

    const particles = [
      ...burst(window.innerWidth * 0.28, window.innerHeight * 0.32),
      ...burst(window.innerWidth * 0.72, window.innerHeight * 0.30),
      ...burst(window.innerWidth * 0.50, window.innerHeight * 0.22)
    ];

    function draw() {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      particles.forEach(p => {
        p.age += 1;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.045;
        const alpha = Math.max(0, 1 - p.age / p.life);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.4, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      if (particles.some(p => p.age < p.life)) {
        animationFrame = requestAnimationFrame(draw);
      }
    }

    cancelAnimationFrame(animationFrame);
    draw();
    clearTimeout(stopTimer);
    stopTimer = setTimeout(stop, 2600);
  }

  function stop() {
    cancelAnimationFrame(animationFrame);
    if (canvas) canvas.remove();
    canvas = null;
    ctx = null;
  }

  new MutationObserver(() => {
    if (modal.classList.contains("show")) start();
    else stop();
  }).observe(modal, { attributes: true, attributeFilter: ["class"] });

  window.addEventListener("resize", resize);
})();
