// 量子弦之链 · 个人主页

var supabase = window.supabaseClient;

// ====== 初始化 ======
async function loadProfile() {
  const params = new URLSearchParams(window.location.search);
  const userId = params.get('id');

  if (!userId) {
    // 没传 id，重定向到自己的主页
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      window.location.href = `profile.html?id=${session.user.id}`;
      return;
    }
    window.location.href = 'login.html';
    return;
  }

  // 加载用户资料
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !profile) {
    document.querySelector('.profile-name').textContent = '用户不存在';
    return;
  }

  // 渲染资料
  document.getElementById('profileNickname').textContent = profile.nickname || '未命名';
  document.getElementById('profileBio').textContent = profile.bio || '这个人很懒，什么都没有写...';
  document.getElementById('profileJoinDate').textContent = '🕐 ' + new Date(profile.created_at).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }) + ' 加入';

  // 头像
  const avatarImg = document.getElementById('profileAvatar');
  const placeholder = document.getElementById('avatarPlaceholder');
  if (profile.avatar_url) {
    avatarImg.src = profile.avatar_url;
    avatarImg.style.display = 'block';
    placeholder.style.display = 'none';
  }

  // 关于 tab
  document.getElementById('aboutJoinDate').textContent = new Date(profile.created_at).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
  document.getElementById('aboutWebsite').textContent = profile.website || '未设置';

  // 检查是否是本人（显示编辑按钮）
  const { data: { session } } = await supabase.auth.getSession();
  if (session && session.user.id === userId) {
    document.getElementById('profileActions').style.display = 'block';
  }

  document.title = `${profile.nickname || '用户'} · 量子弦之链`;

  // 加载帖子和评论
  loadUserPosts(userId);
  loadUserComments(userId);
}

// ====== 编辑资料 ======
window.editProfile = async function() {
  const params = new URLSearchParams(window.location.search);
  const userId = params.get('id');
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();

  document.getElementById('editNickname').value = profile.nickname || '';
  document.getElementById('editBio').value = profile.bio || '';
  document.getElementById('editAvatar').value = profile.avatar_url || '';
  document.getElementById('editWebsite').value = profile.website || '';
  document.getElementById('editModal').style.display = 'flex';
};

window.closeEditModal = function() {
  document.getElementById('editModal').style.display = 'none';
};

window.saveProfile = async function() {
  const params = new URLSearchParams(window.location.search);
  const userId = params.get('id');
  const errEl = document.getElementById('editError');

  const nickname = document.getElementById('editNickname').value.trim();
  if (!nickname) {
    errEl.textContent = '昵称不能为空';
    errEl.style.display = 'block';
    return;
  }

  const updates = {
    nickname,
    bio: document.getElementById('editBio').value.trim(),
    avatar_url: document.getElementById('editAvatar').value.trim(),
    website: document.getElementById('editWebsite').value.trim(),
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
  if (error) {
    errEl.textContent = '保存失败：' + error.message;
    errEl.style.display = 'block';
    return;
  }

  // 同步更新 auth metadata
  await supabase.auth.updateUser({ data: { nickname } });

  closeEditModal();
  loadProfile();
};

// ====== 加载用户帖子 ======
async function loadUserPosts(userId) {
  const list = document.getElementById('userPostsList');
  const { data: posts, error } = await supabase
    .from('posts')
    .select('*')
    .eq('author_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    list.innerHTML = '<div class="error-msg">加载失败</div>';
    return;
  }

  document.getElementById('aboutPostCount').textContent = posts?.length || 0;

  if (!posts || posts.length === 0) {
    list.innerHTML = '<div class="empty-state">还没有发布帖子</div>';
    return;
  }

  list.innerHTML = posts.map(post => `
    <a href="post.html?id=${post.id}" class="post-card">
      <h2 class="post-title">${escapeHtml(post.title)}</h2>
      <p class="post-excerpt">${escapeHtml(post.content.slice(0, 150))}${post.content.length > 150 ? '...' : ''}</p>
      <div class="post-meta">
        <span>🕐 ${timeAgo(post.created_at)}</span>
        <span>❤️ ${post.likes_count || 0}</span>
        ${post.tags && post.tags.length ? post.tags.map(t => `<span class="tag">#${escapeHtml(t)}</span>`).join('') : ''}
      </div>
    </a>
  `).join('');
}

// ====== 加载用户评论 ======
async function loadUserComments(userId) {
  const list = document.getElementById('userCommentsList');
  const { data: comments, error } = await supabase
    .from('comments')
    .select('*, posts!inner(title)')
    .eq('author_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    list.innerHTML = '<div class="error-msg">加载失败</div>';
    return;
  }

  if (!comments || comments.length === 0) {
    list.innerHTML = '<div class="empty-state">还没有发表评论</div>';
    return;
  }

  list.innerHTML = comments.map(c => `
    <div class="comment">
      <div class="comment-meta">
        <span>评论了 <a href="post.html?id=${c.post_id}" class="post-ref-link">《${escapeHtml(c.posts?.title || '已删除的帖子')}》</a></span>
        <span>${timeAgo(c.created_at)}</span>
      </div>
      <div class="comment-content">${escapeHtml(c.content)}</div>
    </div>
  `).join('');
}

// ====== 标签页切换 ======
document.addEventListener('click', function(e) {
  if (!e.target.classList.contains('tab-btn')) return;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  e.target.classList.add('active');
  document.getElementById('tab-' + e.target.dataset.tab).classList.add('active');
});

// ====== 工具函数 ======
function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return '刚刚';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return minutes + ' 分钟前';
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours + ' 小时前';
  const days = Math.floor(hours / 24);
  if (days < 30) return days + ' 天前';
  return date.toLocaleDateString('zh-CN');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', () => {
  if (typeof checkSession === 'function') checkSession();
  loadProfile();
});
