/* ============================================================
   标注拖拽引擎
   - 所有 .annot、.annot-highlight、.annot-dim 均可拖动
   - 松开鼠标后自动保存位置到 localStorage
   - 刷新浏览器自动恢复上次调整的位置
   - 双击任意标注可重置该标注到默认位置
============================================================ */

(function () {
  'use strict';

  const STORAGE_KEY = 'annot_positions_v3';

  /* ==========================================================
     初始化：为每个标注元素分配唯一 ID（基于 wrapper + 索引）
     ========================================================== */
  function initAnnotIds() {
    document.querySelectorAll('.page-wrapper').forEach((wrapper) => {
      const layer = wrapper.querySelector('.annot-layer');
      if (!layer) return;
      const els = layer.querySelectorAll('.annot-dim, .annot-highlight, .annot');
      els.forEach((el, i) => {
        if (!el.dataset.annotId) {
          el.dataset.annotId = wrapper.id + '__' + i;
        }
        el.dataset.annotDefaultTop = el.style.top || '';
        el.dataset.annotDefaultLeft = el.style.left || '';
      });
    });
  }

  /* ==========================================================
     localStorage 读写
     ========================================================== */
  function loadAll() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      return JSON.parse(raw);
    } catch (_) {
      return {};
    }
  }

  function saveAll(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (_) {
      // quota exceeded, silently ignore
    }
  }

  function saveOne(annotId, top, left) {
    const data = loadAll();
    data[annotId] = { top: top, left: left };
    saveAll(data);
  }

  function clearOne(annotId) {
    const data = loadAll();
    delete data[annotId];
    saveAll(data);
  }

  /* ==========================================================
     恢复位置：将 localStorage 中的位置应用到元素
     ========================================================== */
  function restorePositions() {
    const data = loadAll();
    if (!Object.keys(data).length) return;

    document.querySelectorAll('.annot-dim, .annot-highlight, .annot').forEach((el) => {
      const pos = data[el.dataset.annotId];
      if (pos) {
        if (pos.top !== undefined) el.style.top = pos.top;
        if (pos.left !== undefined) el.style.left = pos.left;
      }
    });
  }

  /* ==========================================================
     动态创建拖拽手柄（每个标注右上角的小圪垯）
     ========================================================== */
  function initHandles() {
    document.querySelectorAll('.annot-dim, .annot-highlight, .annot').forEach((el) => {
      if (el.querySelector('.annot-handle')) return;
      const handle = document.createElement('span');
      handle.className = 'annot-handle';
      handle.textContent = '⋮';
      handle.title = '拖拽移动标注';
      el.appendChild(handle);
    });
  }

  /* ==========================================================
     拖拽逻辑（支持鼠标 + 触摸）
     ========================================================== */
  let dragTarget = null;
  let dragStartX = 0;
  let dragStartY = 0;
  let origTop = 0;
  let origLeft = 0;
  let hasMoved = false;

  function getPos(e) {
    if (e.touches && e.touches.length) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    return { x: e.clientX, y: e.clientY };
  }

  function onStart(e) {
    // 只响应左键或触摸
    if (e.button !== undefined && e.button !== 0) return;

    const target = e.target.closest('.annot-dim, .annot-highlight, .annot');
    if (!target) return;
    if (!target.dataset.annotId) return;

    // 标注本身已经移出卡片边界（避免遮挡卡片按钮），所以拖拽整块是安全的
    e.preventDefault();

    dragTarget = target;
    const pos = getPos(e);
    dragStartX = pos.x;
    dragStartY = pos.y;
    origTop = parseFloat(target.style.top) || 0;
    origLeft = parseFloat(target.style.left) || 0;
    hasMoved = false;

    target.classList.add('dragging');

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
    document.addEventListener('touchcancel', onEnd);
  }

  function onMove(e) {
    if (!dragTarget) return;
    e.preventDefault();

    const pos = getPos(e);
    const dx = pos.x - dragStartX;
    const dy = pos.y - dragStartY;

    if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
      hasMoved = true;
    }

    dragTarget.style.top = (origTop + dy) + 'px';
    dragTarget.style.left = (origLeft + dx) + 'px';
  }

  function onEnd() {
    if (dragTarget) {
      dragTarget.classList.remove('dragging');
      if (hasMoved && dragTarget.dataset.annotId) {
        saveOne(dragTarget.dataset.annotId, dragTarget.style.top, dragTarget.style.left);
      }
      dragTarget = null;
      hasMoved = false;
    }

    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onEnd);
    document.removeEventListener('touchmove', onMove);
    document.removeEventListener('touchend', onEnd);
    document.removeEventListener('touchcancel', onEnd);
  }

  /* ==========================================================
     双击重置单个标注到默认位置
     ========================================================== */
  function onDblClick(e) {
    const target = e.target.closest('.annot-dim, .annot-highlight, .annot');
    if (!target) return;
    if (!target.dataset.annotId) return;

    const defTop = target.dataset.annotDefaultTop;
    const defLeft = target.dataset.annotDefaultLeft;

    target.style.top = defTop || '';
    target.style.left = defLeft || '';

    if (defTop || defLeft) {
      saveOne(target.dataset.annotId, target.style.top, target.style.left);
      showDragToast('已重置位置');
    } else {
      clearOne(target.dataset.annotId);
      showDragToast('已重置位置');
    }
  }

  /* ==========================================================
     全局重置按钮（右下角浮动按钮）
     ========================================================== */
  function showDragToast(msg) {
    let toast = document.getElementById('drag-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'drag-toast';
      toast.style.cssText =
        'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);' +
        'background:rgba(20,24,40,0.92);color:#fff;font-size:13px;' +
        'padding:10px 20px;border-radius:8px;z-index:9999;' +
        'pointer-events:none;transition:opacity 0.3s ease;opacity:1;';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
      toast.style.opacity = '0';
    }, 1800);
  }

  function createResetButton() {
    if (document.getElementById('reset-annotations-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'reset-annotations-btn';
    btn.textContent = '↺ 重置标注';
    btn.title = '双击任意标注也可单独重置';
    btn.style.cssText =
      'position:fixed;bottom:24px;right:24px;z-index:9999;' +
      'background:rgba(255,255,255,0.12);backdrop-filter:blur(8px);' +
      'border:1px solid rgba(255,255,255,0.2);border-radius:20px;' +
      'color:#ccc;font-size:12px;padding:8px 18px;cursor:pointer;' +
      'transition:all 0.2s ease;';

    btn.addEventListener('mouseenter', () => {
      btn.style.background = 'rgba(255,255,255,0.22)';
      btn.style.color = '#fff';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.background = 'rgba(255,255,255,0.12)';
      btn.style.color = '#ccc';
    });

    btn.addEventListener('click', () => {
      if (!confirm('确定要将所有标注恢复到默认位置吗？')) return;

      localStorage.removeItem(STORAGE_KEY);
      document.querySelectorAll('.annot-dim, .annot-highlight, .annot').forEach((el) => {
        el.style.top = el.dataset.annotDefaultTop || '';
        el.style.left = el.dataset.annotDefaultLeft || '';
      });
      showDragToast('所有标注已恢复默认位置');
    });

    document.body.appendChild(btn);
  }

  /* ==========================================================
     启动
     ========================================================== */
  initAnnotIds();
  initHandles();
  restorePositions();
  createResetButton();

  document.addEventListener('mousedown', onStart);
  document.addEventListener('touchstart', onStart, { passive: false });
  document.addEventListener('dblclick', onDblClick);

  console.log('[标注拖拽] 已启用 — 拖动标注调整位置，刷新自动保存；双击重置单个，右下角按钮重置全部');
})();
