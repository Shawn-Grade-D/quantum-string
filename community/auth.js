// 量子弦之链 · 社区认证模块

// 确保 supabase 客户端已就绪
const supabase = window._supabase;


// ====== 检查登录状态 ======
async function checkSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    const userDisplay = document.getElementById('userDisplay');
    if (userDisplay) {
      userDisplay.textContent = session.user.user_metadata?.nickname || session.user.email;
      userDisplay.style.display = 'inline';
    }
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    if (loginBtn) loginBtn.style.display = 'none';
    if (registerBtn) registerBtn.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'inline';
  }
  return session;
}

// ====== 退出登录 ======
async function logout() {
  await supabase.auth.signOut();
  window.location.href = 'index.html';
}

// ====== 注册 ======
if (document.getElementById('registerForm')) {
  document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nickname = document.getElementById('regNickname').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const errEl = document.getElementById('regError');

    if (!nickname) {
      errEl.textContent = '请填写昵称';
      errEl.style.display = 'block';
      return;
    }

    errEl.style.display = 'none';

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nickname }
      }
    });

    if (error) {
      errEl.textContent = error.message;
      errEl.style.display = 'block';
      return;
    }

    alert('注册成功！请前往邮箱验证确认。验证完成后即可登录。');
    window.location.href = 'login.html';
  });
}

// ====== 登录 ======
if (document.getElementById('loginForm')) {
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errEl = document.getElementById('loginError');

    errEl.style.display = 'none';

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      errEl.textContent = error.message;
      errEl.style.display = 'block';
      return;
    }

    window.location.href = 'index.html';
  });
}

// ====== GitHub OAuth 登录 ======
if (document.getElementById('githubLoginBtn')) {
  document.getElementById('githubLoginBtn').addEventListener('click', async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: window.location.origin + '/community/index.html'
      }
    });
  });
}

// ====== 页面加载时检查登录状态 ======
document.addEventListener('DOMContentLoaded', checkSession);
