/**
 * CyberFun 趣味解压玩具箱 核心逻辑
 */

// 提示信息 Toast
function showToast(text, duration = 1800) {
  let toast = document.querySelector('.toast-msg');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast-msg';
    document.body.appendChild(toast);
  }
  toast.innerText = text;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
}

// 振动反馈封装 (移动端友好)
function triggerVibrate(pattern = 20) {
  if (navigator.vibrate) {
    try { navigator.vibrate(pattern); } catch (e) {}
  }
}

// 主应用程序控制器
const App = {
  currentApp: null,
  autoMuyuTimer: null,
  cleanups: [],

  init() {
    this.bindGlobalEvents();
    this.renderCategoryFilter();
  },

  bindGlobalEvents() {
    // 静音切换
    const soundBtn = document.getElementById('theme-sound-toggle');
    soundBtn.addEventListener('click', () => {
      const state = window.soundEngine.toggleSound();
      soundBtn.innerText = state ? '🔊' : '🔇';
      showToast(state ? '音效已开启' : '音效已静音');
    });

    // 返回按钮
    document.getElementById('btn-back').addEventListener('click', () => {
      this.closeSubApp();
    });

    // 点击卡片进入对应子应用
    document.querySelectorAll('.tool-card').forEach(card => {
      card.addEventListener('click', () => {
        const appName = card.getAttribute('data-app');
        const appTitle = card.querySelector('.card-title').innerText;
        this.openSubApp(appName, appTitle);
      });
    });

    // 键盘 Esc 返回
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.currentApp) {
        this.closeSubApp();
      }
    });
  },

  // 分类筛选
  renderCategoryFilter() {
    const tabs = document.querySelectorAll('.tab-btn');
    const cards = document.querySelectorAll('.tool-card');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const cat = tab.getAttribute('data-cat');

        cards.forEach(card => {
          if (cat === 'all' || card.getAttribute('data-cat') === cat) {
            card.style.display = 'flex';
          } else {
            card.style.display = 'none';
          }
        });
      });
    });
  },

  openSubApp(appName, title) {
    this.currentApp = appName;
    const subView = document.getElementById('sub-app-view');
    const subTitle = document.getElementById('sub-title');
    const container = document.getElementById('sub-container');
    const actions = document.getElementById('sub-actions');

    subTitle.innerText = title;
    container.innerHTML = '';
    actions.innerHTML = '';
    subView.classList.remove('hidden');

    // 路由分发
    switch (appName) {
      case 'muyu':
        this.initMuyu(container, actions);
        break;
      case 'bubble':
        this.initBubble(container, actions);
        break;
      case 'answers':
        this.initAnswers(container, actions);
        break;
      case 'fakeupdate':
        this.initFakeUpdate(container, actions);
        break;
      case 'cracked':
        this.initCracked(container, actions);
        break;
      case 'fireworks':
        this.initFireworks(container, actions);
        break;
      case 'reaction':
        this.initReaction(container, actions);
        break;
      case 'whitenoise':
        this.initWhiteNoise(container, actions);
        break;
      default:
        container.innerHTML = '<p>开发中...</p>';
    }
  },

  closeSubApp() {
    // 执行清理逻辑
    this.cleanups.forEach(fn => fn());
    this.cleanups = [];
    if (this.autoMuyuTimer) {
      clearInterval(this.autoMuyuTimer);
      this.autoMuyuTimer = null;
    }
    window.soundEngine.stopAllContinuous();

    const subView = document.getElementById('sub-app-view');
    subView.classList.add('hidden');
    document.getElementById('sub-container').innerHTML = '';
    this.currentApp = null;
  },

  /* ===================================================
     1. 电子木鱼
     =================================================== */
  initMuyu(container, actions) {
    let meritCount = parseInt(localStorage.getItem('muyu_merit') || '0', 10);
    let activeText = '功德+1';

    container.innerHTML = `
      <div class="muyu-box">
        <div class="merit-counter">已积攒功德: <span id="muyu-num">${meritCount}</span></div>
        <div class="muyu-trigger" id="muyu-btn">
          <svg class="muyu-svg" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
          </svg>
        </div>
        <div class="muyu-controls">
          <button class="muyu-mode-btn active" data-txt="功德+1">功德+1</button>
          <button class="muyu-mode-btn" data-txt="头发+1">头发+1</button>
          <button class="muyu-mode-btn" data-txt="烦恼-1">烦恼-1</button>
          <button class="muyu-mode-btn" data-txt="财富+999">财富+999</button>
          <button class="muyu-mode-btn" data-txt="水逆退散">水逆退散</button>
          <button class="muyu-mode-btn" id="btn-muyu-auto">自动念经: 关</button>
        </div>
      </div>
    `;

    const numSpan = document.getElementById('muyu-num');
    const trigger = document.getElementById('muyu-btn');
    const autoBtn = document.getElementById('btn-muyu-auto');

    const knock = (e) => {
      meritCount++;
      numSpan.innerText = meritCount;
      localStorage.setItem('muyu_merit', meritCount);

      window.soundEngine.playMuyu();
      triggerVibrate(25);

      trigger.classList.add('knocked');
      setTimeout(() => trigger.classList.remove('knocked'), 80);

      // 创建跳字
      const floatEl = document.createElement('div');
      floatEl.className = 'float-text';
      floatEl.innerText = activeText;
      
      const rect = trigger.getBoundingClientRect();
      const clientX = (e && e.clientX) ? e.clientX : (rect.left + rect.width / 2);
      const clientY = (e && e.clientY) ? e.clientY : (rect.top + 30);
      
      floatEl.style.left = `${clientX - 35 + (Math.random() * 30 - 15)}px`;
      floatEl.style.top = `${clientY - 40}px`;
      document.body.appendChild(floatEl);

      setTimeout(() => {
        if (floatEl.parentNode) floatEl.parentNode.removeChild(floatEl);
      }, 850);
    };

    trigger.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      knock(e);
    });

    // 切换提示词
    container.querySelectorAll('.muyu-mode-btn[data-txt]').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.muyu-mode-btn[data-txt]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeText = btn.getAttribute('data-txt');
      });
    });

    // 自动敲击
    let isAuto = false;
    autoBtn.addEventListener('click', () => {
      isAuto = !isAuto;
      if (isAuto) {
        autoBtn.innerText = '自动念经: 开';
        autoBtn.classList.add('active');
        this.autoMuyuTimer = setInterval(() => knock(null), 700);
      } else {
        autoBtn.innerText = '自动念经: 关';
        autoBtn.classList.remove('active');
        clearInterval(this.autoMuyuTimer);
        this.autoMuyuTimer = null;
      }
    });

    this.cleanups.push(() => {
      if (this.autoMuyuTimer) clearInterval(this.autoMuyuTimer);
    });
  },

  /* ===================================================
     2. 赛博气泡膜
     =================================================== */
  initBubble(container, actions) {
    let poppedCount = 0;
    container.innerHTML = `
      <div class="bubble-container">
        <div class="bubble-stats">已捏爆: <b id="bubble-count">0</b> 个泡泡</div>
        <div class="bubble-grid" id="bubble-grid"></div>
      </div>
    `;

    const countEl = document.getElementById('bubble-count');
    const grid = document.getElementById('bubble-grid');

    const renderBubbles = () => {
      grid.innerHTML = '';
      for (let i = 0; i < 72; i++) {
        const bubble = document.createElement('div');
        bubble.className = 'bubble-item';
        grid.appendChild(bubble);
      }
    };

    renderBubbles();

    const popBubble = (bubble) => {
      if (!bubble.classList.contains('popped')) {
        bubble.classList.add('popped');
        poppedCount++;
        countEl.innerText = poppedCount;
        window.soundEngine.playPop();
        triggerVibrate(15);
      }
    };

    // 支持滑动连续捏泡 (Touch / Mouse move)
    let isMouseDown = false;
    grid.addEventListener('pointerdown', (e) => {
      isMouseDown = true;
      if (e.target.classList.contains('bubble-item')) {
        popBubble(e.target);
      }
    });

    window.addEventListener('pointerup', () => { isMouseDown = false; });

    grid.addEventListener('pointermove', (e) => {
      if (!isMouseDown) return;
      const target = document.elementFromPoint(e.clientX, e.clientY);
      if (target && target.classList.contains('bubble-item')) {
        popBubble(target);
      }
    });

    // 右上角添加换一张新气泡纸
    const refreshBtn = document.createElement('button');
    refreshBtn.className = 'nav-back-btn';
    refreshBtn.innerHTML = '🔄 换一张';
    refreshBtn.onclick = () => {
      renderBubbles();
      showToast('已换上全新气泡膜！');
    };
    actions.appendChild(refreshBtn);
  },

  /* ===================================================
     3. 答案之书 & 命运大转盘
     =================================================== */
  initAnswers(container, actions) {
    const answersList = [
      "毫无疑问", "相信你的第一直觉", "立即行动，不要犹豫", "换个时间再看", "你会后悔的",
      "尽情去享受吧", "多听听别人的意见", "保持耐心与专注", "顺其自然就好", "现在还不是时候",
      "勇敢一点，没人在意", "保持微笑，好运在路上", "大声说出来", "放弃不必要的执念",
      "明天会更好", "今天早点睡", "答案就在你心里", "全力以赴", "不如先吃顿好的", "去做吧！"
    ];

    container.innerHTML = `
      <div class="answers-container">
        <div class="answer-mode-toggle">
          <button class="mode-btn active" id="tab-book">答案之书</button>
          <button class="mode-btn" id="tab-wheel">命运大转盘</button>
        </div>

        <!-- 模式1：答案之书 -->
        <div id="view-book" class="book-card">
          <div class="book-tip">✨ 闭上眼睛默想心中的问题 ✨<br>随后轻触翻开</div>
          <div class="book-result" id="book-text">「 点我揭晓答案 」</div>
        </div>

        <!-- 模式2：转盘 -->
        <div id="view-wheel" class="wheel-wrapper" style="display:none;">
          <canvas id="wheel-canvas" width="300" height="300"></canvas>
          <div class="wheel-pointer" id="wheel-spin-btn">抽!</div>
        </div>
      </div>
    `;

    const bookView = document.getElementById('view-book');
    const wheelView = document.getElementById('view-wheel');
    const tabBook = document.getElementById('tab-book');
    const tabWheel = document.getElementById('tab-wheel');
    const bookText = document.getElementById('book-text');

    tabBook.onclick = () => {
      tabBook.classList.add('active');
      tabWheel.classList.remove('active');
      bookView.style.display = 'flex';
      wheelView.style.display = 'none';
    };

    tabWheel.onclick = () => {
      tabWheel.classList.add('active');
      tabBook.classList.remove('active');
      bookView.style.display = 'none';
      wheelView.style.display = 'block';
      drawWheel();
    };

    // 翻书逻辑
    bookView.onclick = () => {
      bookText.innerText = "正在感应星象与天意...";
      window.soundEngine.playTick();
      triggerVibrate(30);
      setTimeout(() => {
        const rand = answersList[Math.floor(Math.random() * answersList.length)];
        bookText.innerText = `「 ${rand} 」`;
        window.soundEngine.playChime();
        triggerVibrate([30, 50, 30]);
      }, 400);
    };

    // 转盘逻辑
    const canvas = document.getElementById('wheel-canvas');
    const ctx = canvas.getContext('2d');
    const wheelItems = ["火锅", "麻辣烫", "疯狂星期四", "自己做饭", "健康轻食", "螺蛳粉", "烧烤啤酒", "不吃了减肥"];
    const colors = ["#6366f1", "#ec4899", "#06b6d4", "#10b981", "#f59e0b", "#8b5cf6", "#f43f5e", "#14b8a6"];
    let currentRotation = 0;
    let isSpinning = false;

    const drawWheel = () => {
      const num = wheelItems.length;
      const arc = (2 * Math.PI) / num;
      ctx.clearRect(0, 0, 300, 300);

      ctx.save();
      ctx.translate(150, 150);
      ctx.rotate(currentRotation);

      for (let i = 0; i < num; i++) {
        const angle = i * arc;
        ctx.beginPath();
        ctx.fillStyle = colors[i % colors.length];
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, 140, angle, angle + arc);
        ctx.fill();
        ctx.stroke();

        ctx.save();
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 13px sans-serif";
        ctx.rotate(angle + arc / 2);
        ctx.textAlign = "right";
        ctx.fillText(wheelItems[i], 125, 5);
        ctx.restore();
      }
      ctx.restore();
    };

    const spinBtn = document.getElementById('wheel-spin-btn');
    spinBtn.onclick = () => {
      if (isSpinning) return;
      isSpinning = true;

      const spins = 5 + Math.random() * 5;
      const duration = 3500;
      const startRot = currentRotation;
      const targetRot = startRot + spins * 2 * Math.PI;
      const startTime = performance.now();

      let lastTick = 0;

      const animate = (time) => {
        const elapsed = time - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // easeOutQuart 减速曲线
        const ease = 1 - Math.pow(1 - progress, 4);

        currentRotation = startRot + (targetRot - startRot) * ease;
        drawWheel();

        // 旋转时咔哒声
        if (time - lastTick > (100 + progress * 200)) {
          window.soundEngine.playTick();
          lastTick = time;
        }

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          isSpinning = false;
          window.soundEngine.playChime();
          triggerVibrate([40, 60, 40]);
          
          // 计算命中的选项
          const num = wheelItems.length;
          const arc = (2 * Math.PI) / num;
          const normalized = (2 * Math.PI - (currentRotation % (2 * Math.PI)) + Math.PI / 2) % (2 * Math.PI);
          const index = Math.floor(normalized / arc) % num;
          showToast(`🎯 抽取结果：【${wheelItems[index]}】`, 3000);
        }
      };

      requestAnimationFrame(animate);
    };

    drawWheel();
  },

  /* ===================================================
     4. 假装系统升级 / 假装蓝屏 (摸鱼恶搞)
     =================================================== */
  initFakeUpdate(container, actions) {
    container.innerHTML = `
      <div class="fake-options">
        <h3 style="margin-bottom:8px;">选择恶搞伪装界面：</h3>
        <button class="primary-btn" id="btn-fake-win">💻 Windows 正在更新 (卡在99%)</button>
        <button class="primary-btn" id="btn-fake-bsod" style="background:#0078d7;">⚠️ 经典 Windows 蓝屏崩溃</button>
        <p style="font-size:0.85rem; color:var(--text-muted); margin-top:12px;">
          * 进入全屏后，随时<b>点击屏幕任意位置</b>或按 <b>Esc</b> 即可立即退出！
        </p>
      </div>
    `;

    const triggerFullscreenFake = (htmlContent, customClass) => {
      const fullEl = document.createElement('div');
      fullEl.className = `fake-fullscreen-view ${customClass}`;
      fullEl.innerHTML = htmlContent;
      document.body.appendChild(fullEl);

      // 请求浏览器全屏
      try {
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen();
        }
      } catch (e) {}

      const exit = () => {
        if (document.fullscreenElement && document.exitFullscreen) {
          try { document.exitFullscreen(); } catch (e) {}
        }
        if (fullEl.parentNode) fullEl.parentNode.removeChild(fullEl);
        window.removeEventListener('keydown', exitKey);
      };

      const exitKey = (e) => {
        if (e.key === 'Escape') exit();
      };

      fullEl.addEventListener('click', exit);
      fullEl.addEventListener('touchstart', exit);
      window.addEventListener('keydown', exitKey);
    };

    document.getElementById('btn-fake-win').onclick = () => {
      triggerFullscreenFake(`
        <div class="win-spinner"></div>
        <h1 style="font-size:1.8rem; font-weight:300; margin-bottom:12px;">正在配置更新 99%</h1>
        <p style="font-size:1rem; opacity:0.8;">请保持计算机处于开机状态，这可能需要一点时间。</p>
      `, 'fake-win-update');
    };

    document.getElementById('btn-fake-bsod').onclick = () => {
      triggerFullscreenFake(`
        <div class="bsod-face">:(</div>
        <div class="bsod-title">你的电脑遇到问题，需要重新启动。</div>
        <div class="bsod-desc">
          我们只收集某些错误信息，然后为你重新启动。<br>
          完成: 100%
        </div>
        <div style="font-size:0.9rem; opacity:0.8; margin-top:20px;">
          终止代码: CRITICAL_PROCESS_DIED<br>
          失败的操作: MOYU_MASTER_OVERFLOW.sys
        </div>
      `, 'fake-bsod');
    };
  },

  /* ===================================================
     5. 屏幕破坏粉碎模拟器
     =================================================== */
  initCracked(container, actions) {
    container.innerHTML = `
      <div class="cracked-canvas-container">
        <canvas id="cracked-canvas"></canvas>
        <div class="cracked-hud">
          <button class="tool-select-btn active" data-tool="crack">🔨 裂纹重锤</button>
          <button class="tool-select-btn" data-tool="bullet">🔫 穿甲弹孔</button>
          <button class="tool-select-btn" data-tool="cat">🐾 恶搞猫爪</button>
          <button class="tool-select-btn" id="btn-fix-screen">✨ 一键修复</button>
        </div>
      </div>
    `;

    const canvas = document.getElementById('cracked-canvas');
    const ctx = canvas.getContext('2d');
    let currentTool = 'crack';

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();

    const drawCrack = (x, y) => {
      window.soundEngine.playSmash();
      triggerVibrate([40, 20, 60]);

      if (currentTool === 'crack') {
        // 玻璃裂纹蜘蛛网
        ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
        ctx.lineWidth = 1.5;
        const branches = 8 + Math.floor(Math.random() * 5);
        for (let i = 0; i < branches; i++) {
          let curX = x, curY = y;
          const angle = (i / branches) * 2 * Math.PI + (Math.random() * 0.4 - 0.2);
          ctx.beginPath();
          ctx.moveTo(curX, curY);
          for (let step = 0; step < 4; step++) {
            const dist = 15 + Math.random() * 25;
            curX += Math.cos(angle + (Math.random() * 0.6 - 0.3)) * dist;
            curY += Math.sin(angle + (Math.random() * 0.6 - 0.3)) * dist;
            ctx.lineTo(curX, curY);
          }
          ctx.stroke();
        }
        // 撞击中心白坑
        ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();

      } else if (currentTool === 'bullet') {
        // 子弹孔
        ctx.fillStyle = "#000000";
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.stroke();

      } else if (currentTool === 'cat') {
        // 猫爪印
        ctx.fillStyle = "rgba(236, 72, 153, 0.75)";
        // 主肉垫
        ctx.beginPath();
        ctx.ellipse(x, y, 14, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        // 四个脚趾
        const toes = [[-12, -14], [-4, -18], [6, -18], [14, -14]];
        toes.forEach(([ox, oy]) => {
          ctx.beginPath();
          ctx.arc(x + ox, y + oy, 5, 0, Math.PI * 2);
          ctx.fill();
        });
      }
    };

    canvas.addEventListener('pointerdown', (e) => {
      const rect = canvas.getBoundingClientRect();
      drawCrack(e.clientX - rect.left, e.clientY - rect.top);
    });

    container.querySelectorAll('.tool-select-btn[data-tool]').forEach(btn => {
      btn.onclick = () => {
        container.querySelectorAll('.tool-select-btn[data-tool]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTool = btn.getAttribute('data-tool');
      };
    });

    document.getElementById('btn-fix-screen').onclick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      window.soundEngine.playChime();
      showToast('✨ 屏幕已完美修复！');
    };
  },

  /* ===================================================
     8. 指尖粒子流光烟花
     =================================================== */
  initFireworks(container, actions) {
    container.innerHTML = `
      <div class="fireworks-container">
        <canvas id="fireworks-canvas"></canvas>
        <div class="fireworks-tip">✨ 在屏幕任意位置轻触或滑动绽放烟花</div>
      </div>
    `;

    const canvas = document.getElementById('fireworks-canvas');
    const ctx = canvas.getContext('2d');
    let particles = [];
    let animationFrame = null;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();

    class Particle {
      constructor(x, y, hue) {
        this.x = x;
        this.y = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 + 2;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.hue = hue || Math.floor(Math.random() * 360);
        this.alpha = 1;
        this.decay = Math.random() * 0.02 + 0.015;
        this.radius = Math.random() * 2.5 + 1.5;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.08; // 重力
        this.alpha -= this.decay;
      }
      draw(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.alpha);
        ctx.fillStyle = `hsl(${this.hue}, 100%, 65%)`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    const createExplosion = (x, y) => {
      window.soundEngine.playFirework();
      triggerVibrate(20);
      const hue = Math.floor(Math.random() * 360);
      for (let i = 0; i < 40; i++) {
        particles.push(new Particle(x, y, hue));
      }
    };

    const render = () => {
      ctx.fillStyle = 'rgba(5, 5, 10, 0.2)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        p.draw(ctx);
        if (p.alpha <= 0) {
          particles.splice(i, 1);
        }
      }

      animationFrame = requestAnimationFrame(render);
    };

    canvas.addEventListener('pointerdown', (e) => {
      const rect = canvas.getBoundingClientRect();
      createExplosion(e.clientX - rect.left, e.clientY - rect.top);
    });

    render();

    this.cleanups.push(() => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
    });
  },

  /* ===================================================
     9. 毫秒反应力测试
     =================================================== */
  initReaction(container, actions) {
    let state = 'idle'; // idle | waiting | ready | early | done
    let startTime = 0;
    let timer = null;

    container.innerHTML = `
      <div class="reaction-box idle" id="reaction-target">
        <div class="reaction-icon" id="react-icon">⚡</div>
        <div class="reaction-title" id="react-title">点击开始测试</div>
        <div class="reaction-desc" id="react-desc">变绿时以最快速度点击！</div>
      </div>
    `;

    const box = document.getElementById('reaction-target');
    const icon = document.getElementById('react-icon');
    const title = document.getElementById('react-title');
    const desc = document.getElementById('react-desc');

    box.addEventListener('click', () => {
      if (state === 'idle' || state === 'done' || state === 'early') {
        state = 'waiting';
        box.className = 'reaction-box waiting';
        icon.innerText = '🔴';
        title.innerText = '等待变绿...';
        desc.innerText = '不要急，心急吃不了热豆腐';

        const delay = 1500 + Math.random() * 3000;
        timer = setTimeout(() => {
          state = 'ready';
          startTime = performance.now();
          box.className = 'reaction-box ready';
          icon.innerText = '🟢';
          title.innerText = '点！点！点！';
          desc.innerText = '以光速按下屏幕！';
          window.soundEngine.playChime();
          triggerVibrate(40);
        }, delay);

      } else if (state === 'waiting') {
        clearTimeout(timer);
        state = 'early';
        box.className = 'reaction-box early';
        icon.innerText = '⚠️';
        title.innerText = '太快了！抢跑违规！';
        desc.innerText = '还没变绿就按了，点击重新开始';
        window.soundEngine.playSmash();

      } else if (state === 'ready') {
        const reactionTime = Math.round(performance.now() - startTime);
        state = 'done';
        box.className = 'reaction-box idle';
        icon.innerText = '🏆';
        title.innerText = `${reactionTime} ms`;

        let rank = "老树盘根";
        if (reactionTime < 190) rank = "⚡ 赛博神仙 (超神)";
        else if (reactionTime < 240) rank = "🚀 电竞职业选手";
        else if (reactionTime < 300) rank = "😎 敏捷人类";
        else rank = "🐢 树懒转世";

        desc.innerText = `评级：${rank} (点击再次挑战)`;
        window.soundEngine.playChime();
        triggerVibrate([30, 40, 30]);
      }
    });

    this.cleanups.push(() => {
      if (timer) clearTimeout(timer);
    });
  },

  /* ===================================================
     10. 白噪音与发呆钟
     =================================================== */
  initWhiteNoise(container, actions) {
    container.innerHTML = `
      <div class="whitenoise-wrapper">
        <div class="noise-channel">
          <div class="channel-icon">🌧️</div>
          <div class="channel-info">
            <div class="channel-title">江南细雨 (Rain)</div>
            <input type="range" class="noise-slider" data-noise="rain" min="0" max="100" value="0">
          </div>
        </div>

        <div class="noise-channel">
          <div class="channel-icon">🔥</div>
          <div class="channel-info">
            <div class="channel-title">林间篝火 (Fireplace)</div>
            <input type="range" class="noise-slider" data-noise="fire" min="0" max="100" value="0">
          </div>
        </div>

        <div class="noise-channel">
          <div class="channel-icon">🌌</div>
          <div class="channel-info">
            <div class="channel-title">深空宇宙 (Deep Space)</div>
            <input type="range" class="noise-slider" data-noise="space" min="0" max="100" value="0">
          </div>
        </div>
      </div>
    `;

    container.querySelectorAll('.noise-slider').forEach(slider => {
      slider.addEventListener('input', (e) => {
        const type = e.target.getAttribute('data-noise');
        const val = parseFloat(e.target.value) / 100;
        if (val > 0) {
          if (!window.soundEngine.activeNoises[type]) {
            window.soundEngine.startWhiteNoise(type, val);
          } else {
            window.soundEngine.setNoiseVolume(type, val);
          }
        } else {
          window.soundEngine.stopNoise(type);
        }
      });
    });
  }
};

// 启动入口
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
