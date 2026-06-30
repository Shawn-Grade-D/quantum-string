// 量子弦之链 · 社区认证模块

var supabase = window.supabaseClient;

// ====== 缓存用户 profile ======
window._cachedProfile = null;

async function getUserProfile(userId) {
  if (window._cachedProfile && window._cachedProfile.id === userId) {
    return window._cachedProfile;
  }
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (!error && data) {
      window._cachedProfile = data;
      return data;
    }
  } catch (e) {
    console.warn('getUserProfile failed:', e);
  }
  return null;
}

// ====== 检查登录状态 ======
async function checkSession() {
  const { data: { session } } = await supabase.auth.getSession();

  const loginBtn = document.getElementById('loginBtn');
  const registerBtn = document.getElementById('registerBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const userDisplay = document.getElementById('userDisplay');

  if (session) {
    const userId = session.user.id;
    let profile = null;
    try {
      profile = await getUserProfile(userId);
    } catch (e) {
      console.warn('checkSession: getUserProfile failed', e);
    }
    const nickname = profile?.nickname || session.user.user_metadata?.nickname || session.user.email;
    const avatarUrl = profile?.avatar_url || '';

    // GitHub 风格：头像 + 昵称 胶囊
    if (userDisplay) {
      userDisplay.innerHTML = `
        <a href="profile.html?id=${userId}" class="user-capsule">
          <span class="user-avatar-xs">${avatarUrl ? `<img src="${escapeHtml(avatarUrl)}" class="avatar-xs-img" alt="">` : '👤'}</span>
          <span class="user-name-xs">${escapeHtml(nickname)}</span>
        </a>
      `;
      userDisplay.style.display = 'inline';
    }

    if (loginBtn) loginBtn.style.display = 'none';
    if (registerBtn) registerBtn.style.display = 'none';
    if (logoutBtn) {
      logoutBtn.innerHTML = '<span class="logout-icon">⏻</span>';
      logoutBtn.title = '退出登录';
      logoutBtn.style.display = 'inline';
    }
  } else {
    if (userDisplay) {
      userDisplay.style.display = 'none';
      userDisplay.innerHTML = '';
    }
    if (loginBtn) loginBtn.style.display = 'inline';
    if (registerBtn) registerBtn.style.display = 'inline';
    if (logoutBtn) logoutBtn.style.display = 'none';
  }

  return session;
}

// ====== 退出登录 ======
async function logout() {
  await supabase.auth.signOut();
  window._cachedProfile = null;
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

// ====== 工具 ======
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
