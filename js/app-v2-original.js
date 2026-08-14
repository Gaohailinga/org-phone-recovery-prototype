/* ============================================================
   页面跳转工具
============================================================ */
const PAGES = {
  forgot: 'page-forgot',
  bankVerify: 'page-bank-verify',
  changePhone: 'page-change-phone',
  success: 'page-success',
};

function showPage(name) {
  Object.values(PAGES).forEach((id) => {
    document.getElementById(id).classList.toggle('hidden', id !== PAGES[name]);
  });
  window.scrollTo(0, 0);
}

/* ============================================================
   表单校验工具
============================================================ */
function setError(input, hasError) {
  const item = input.closest('.form-item');
  if (item) item.classList.toggle('error', hasError);
}

function validate(inputs) {
  let ok = true;
  inputs.forEach(({ id, label, test }) => {
    const el = document.getElementById(id);
    const val = el.value.trim();
    const pass = test ? test(val) : val.length > 0;
    setError(el, !pass);
    if (!pass) {
      ok = false;
      showToast(`${label}`);
      el.focus();
    }
  });
  return ok;
}

const PHONE_RE = /^1[3-9]\d{9}$/;
const CODE_RE = /^\d{4}$/;

/* ============================================================
   Toast 轻提示
============================================================ */
function showToast(msg) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 2200);
}

/* ============================================================
   短信验证码倒计时
============================================================ */
function startCountdown(btn, seconds = 60) {
  if (btn.dataset.timer) return;
  const origin = btn.textContent;
  btn.disabled = true;
  let left = seconds;
  btn.textContent = `${left}s 后重新获取`;
  btn.dataset.timer = setInterval(() => {
    left -= 1;
    if (left <= 0) {
      clearInterval(btn.dataset.timer);
      delete btn.dataset.timer;
      btn.disabled = false;
      btn.textContent = origin;
    } else {
      btn.textContent = `${left}s 后重新获取`;
    }
  }, 1000);
}

/* ============================================================
   图片验证码刷新
============================================================ */
const CAPTCHAS = ['7316', '2F8K', '9M3Q', '6X4Z', '8P2D', '5T7V'];
let captchaIndex = 0;

function refreshCaptcha() {
  captchaIndex = (captchaIndex + 1) % CAPTCHAS.length;
  document.getElementById('captcha-box').textContent = CAPTCHAS[captchaIndex];
}

/* ============================================================
   页面1：找回密码（原有逻辑，保持不变）
============================================================ */
document.getElementById('forgot-cancel').addEventListener('click', () => {
  showToast('已取消找回密码');
});

document.getElementById('forgot-submit').addEventListener('click', () => {
  const ok = validate([
    { id: 'forgot-phone', label: '请输入绑定手机号', test: (v) => PHONE_RE.test(v) },
    { id: 'forgot-imgcode', label: '请输入正确的图片验证码', test: (v) => v === document.getElementById('captcha-box').textContent },
    { id: 'forgot-smscode', label: '请输入正确的短信验证码', test: (v) => CODE_RE.test(v) },
    { id: 'forgot-newpwd', label: '请输入新密码', test: (v) => v.length >= 6 },
  ]);
  if (ok) {
    showToast('密码重置成功');
  }
});

document.getElementById('forgot-getcode').addEventListener('click', (e) => {
  const phone = document.getElementById('forgot-phone').value.trim();
  if (!PHONE_RE.test(phone)) {
    showToast('请先输入正确的绑定手机号');
    return;
  }
  showToast('验证码已发送至绑定手机');
  startCountdown(e.currentTarget);
});

document.getElementById('captcha-box').addEventListener('click', refreshCaptcha);

/* ============================================================
   入口：我是一级机构 → 直接跳转结算账户信息验证
============================================================ */
document.getElementById('btn-to-org').addEventListener('click', () => {
  showPage('bankVerify');
});

/* ============================================================
   页面2：结算账户信息验证
============================================================ */
document.getElementById('bank-back').addEventListener('click', () => {
  showPage('forgot');
});

document.getElementById('bank-next').addEventListener('click', () => {
  const ok = validate([
    { id: 'bank-orgid', label: '请输入机构ID' },
    { id: 'bank-accountname', label: '请输入开户名称' },
    { id: 'bank-accountno', label: '请输入开户账号' },
  ]);
  if (ok) {
    showPage('changePhone');
  }
});

/* ============================================================
   页面4：换绑手机号
============================================================ */
document.getElementById('change-back').addEventListener('click', () => {
  showPage('bankVerify');
});

document.getElementById('new-getcode').addEventListener('click', (e) => {
  const phone = document.getElementById('new-phone').value.trim();
  if (!PHONE_RE.test(phone)) {
    showToast('请先输入正确的换绑手机号');
    return;
  }
  showToast('验证码已发送至新手机号');
  startCountdown(e.currentTarget);
});

document.getElementById('change-confirm').addEventListener('click', () => {
  const ok = validate([
    { id: 'new-phone', label: '请输入正确的换绑手机号', test: (v) => PHONE_RE.test(v) },
    { id: 'new-smscode', label: '请输入正确的短信验证码', test: (v) => CODE_RE.test(v) },
  ]);
  if (ok) {
    showPage('success');
  }
});

/* ============================================================
   页面5：换绑成功
============================================================ */
document.getElementById('success-done').addEventListener('click', () => {
  const newPhone = document.getElementById('new-phone').value.trim();
  if (newPhone) {
    document.getElementById('forgot-phone').value = newPhone;
  }
  showPage('forgot');
  showToast('已带入新手机号，请继续找回密码');
});

/* 输入时清除错误状态 */
document.querySelectorAll('.form-item input').forEach((input) => {
  input.addEventListener('input', () => {
    const item = input.closest('.form-item');
    if (item) item.classList.remove('error');
  });
});
