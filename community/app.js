// 量子弦之链 · 社区核心逻辑

// 使用全局 supabaseClient
var supabase = window.supabaseClient;


// ====== 当前页面 ======
const isIndex = document.getElementById('postsList');
const isPostDetail = document.getElementById('postDetail');
const isNewPost = document.getElementById('newPostForm');

// ====== 工具函数 ======
function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return '刚刚';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} 天前`;
  return date.toLocaleDateString('zh-CN');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ====== 社区首页：加载帖子列表 ======
if (isIndex) {
  let currentFilter = 'latest';

  async function loadPosts(filter) {
    const list = document.getElementById('postsList');
    list.innerHTML = '<div class="loading">加载中...</div>';

    let query = supabase
      .from('posts')
      .select('*');

    if (filter === 'hot') {
      query = query.order('likes_count', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data: posts, error } = await query.limit(50);

    if (error) {
      list.innerHTML = `<div class="error-msg">加载失败：${error.message}</div>`;
      return;
    }

    if (!posts || posts.length === 0) {
      list.innerHTML = '<div class="empty-state">📭 还没有帖子，来做第一个发言的人吧！</div>';
      return;
    }

    list.innerHTML = posts.map(post => `
      <a href="post.html?id=${post.id}" class="post-card">
        <h2 class="post-title">${escapeHtml(post.title)}</h2>
        <p class="post-excerpt">${escapeHtml(post.content.slice(0, 200))}${post.content.length > 200 ? '...' : ''}</p>
        <div class="post-meta">
          <span class="post-author">👤 <a href="profile.html?id=${post.author_id}" class="author-link" onclick="event.stopPropagation()">${escapeHtml(post.author_name)}</a></span>
          <span class="post-time">${timeAgo(post.created_at)}</span>
          <span class="post-likes">❤️ ${post.likes_count || 0}</span>
          ${post.tags && post.tags.length ? post.tags.map(t => `<span class="tag">#${escapeHtml(t)}</span>`).join('') : ''}
        </div>
      </a>
    `).join('');
  }

  // 筛选按钮
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      currentFilter = this.dataset.filter;
      loadPosts(currentFilter);
    });
  });

  // 检查登录状态（显示/隐藏发帖按钮）
  document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const btn = document.getElementById('newPostBtn');
    if (!session) {
      btn.textContent = '🔒 登录后才能发帖';
      btn.href = 'login.html';
    }

    // 同步更新导航栏状态（如果有auth.js脚本的话）
    if (typeof checkSession === 'function') {
      checkSession();
    }
    loadPosts('latest');
  });
}

// ====== 帖子详情 ======
if (isPostDetail) {
  async function loadPostDetail() {
    const params = new URLSearchParams(window.location.search);
    const postId = params.get('id');
    const detail = document.getElementById('postDetail');

    if (!postId) {
      detail.innerHTML = '<div class="error-msg">无效的帖子ID</div>';
      return;
    }

    const { data: post, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .single();

    if (error || !post) {
      detail.innerHTML = '<div class="error-msg">帖子不存在或已被删除</div>';
      return;
    }

    document.title = `${post.title} · 量子弦之链`;
    document.getElementById('postDetailTitle').textContent = `${post.title} · 量子弦之链`;
    window._postAuthorId = post.author_id;

    detail.innerHTML = `
      <article class="post-full">
        <h1>${escapeHtml(post.title)}</h1>
        <div class="post-meta">
          <span>👤 <a href="profile.html?id=${post.author_id}" class="author-link">${escapeHtml(post.author_name)}</a></span>
          <span>🕐 ${new Date(post.created_at).toLocaleString('zh-CN')}</span>
          <span>❤️ <span id="likeCount">${post.likes_count || 0}</span></span>
          ${post.tags && post.tags.length ? post.tags.map(t => `<span class="tag">#${escapeHtml(t)}</span>`).join('') : ''}
        </div>
        <div class="post-content">${escapeHtml(post.content).replace(/\n/g, '<br>')}</div>
        <button id="likeBtn" class="btn btn-outline" onclick="toggleLike(${post.id})">❤️ 点赞</button>
        <button id="deletePostBtn" class="btn btn-danger" style="display:none;" onclick="deletePost(${post.id})">🗑️ 删除</button>
      </article>
    `;

    // 检查是否是作者
    const { data: { session } } = await supabase.auth.getSession();
    if (session && session.user.id === post.author_id) {
      document.getElementById('deletePostBtn').style.display = 'inline';
    }

    // 检查点赞状态
    if (session) {
      const { data: like } = await supabase
        .from('likes')
        .select('*')
        .eq('post_id', postId)
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (like) {
        document.getElementById('likeBtn').classList.add('liked');
        document.getElementById('likeBtn').textContent = '❤️ 已点赞';
      }
    }

    // 显示评论表单
    if (session) {
      document.getElementById('commentForm').style.display = 'block';
    }

    // 加载评论
    loadComments(postId);
  }

  async function loadComments(postId) {
    const { data: comments, error } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    const list = document.getElementById('commentsList');
    if (error || !comments || comments.length === 0) {
      list.innerHTML = '<p class="empty-state">还没有评论，来说点什么吧</p>';
      return;
    }

    // 构建作者映射（用于私密评论权限判断）
    const parentAuthorMap = new Map();
    comments.forEach(c => { parentAuthorMap.set(c.id, c.author_id); });
    window._parentAuthorMap = parentAuthorMap;

    // 获取帖主 ID（用于私密顶层评论可见性）
    let postAuthorId = window._postAuthorId;
    if (!postAuthorId) {
      const { data: postData } = await supabase
        .from('posts')
        .select('author_id')
        .eq('id', postId)
        .single();
      postAuthorId = postData?.author_id;
      window._postAuthorId = postAuthorId;
    }
      return;
    }

    // 构建嵌套评论树
    const commentMap = {};
    const roots = [];
    comments.forEach(c => {
      c.children = [];
      commentMap[c.id] = c;
    });
    comments.forEach(c => {
      if (c.parent_id && commentMap[c.parent_id]) {
        commentMap[c.parent_id].children.push(c);
      } else {
        roots.push(c);
      }
    });

    async function renderCommentTree(nodes, depth) {
      const sc = window.sessionCache || {};
      const session = sc.session;
      const currentUserId = session?.user?.id;
      const maxDepth = 6;
      if (depth > maxDepth) return '';

      let html = '';
      for (const c of nodes) {
        const isPrivate = c.visibility === 'private';

        // 客户端过滤私密评论（双保险）
        if (isPrivate) {
          if (!currentUserId) continue;
          const pmap = window._parentAuthorMap || new Map();
          // 顶层私密评论：仅帖主和作者可见
          if (!c.parent_id && currentUserId !== c.author_id && currentUserId !== window._postAuthorId) continue;
          // 回复私密评论：仅父评论作者和被回复者可见
          if (c.parent_id && currentUserId !== c.author_id && currentUserId !== pmap.get(c.parent_id)) continue;
        }

        const privateLabel = isPrivate ? ' <span class="private-badge">🔒 私密</span>' : '';
        const canReply = depth < maxDepth;

        html += `
          <div class="comment ${isPrivate ? 'comment-private' : ''}" id="comment-${c.id}" style="margin-left:${Math.min(depth, 5) * 24}px">
            <div class="comment-meta">
              <strong><a href="profile.html?id=${c.author_id}" class="author-link">${escapeHtml(c.author_name)}</a></strong>
              <span>${timeAgo(c.created_at)}${privateLabel}</span>
            </div>
            <div class="comment-content">${escapeHtml(c.content).replace(/\n/g, '<br>')}</div>
            <div class="comment-actions">
              ${canReply ? `<button class="btn-reply" onclick="showReplyForm(${c.id}, '${escapeHtml(c.author_name)}')">💬 回复</button>` : ''}
              ${currentUserId === c.author_id ? `<button class="btn-delete-comment" onclick="deleteComment(${c.id}, ${postId})">🗑️</button>` : ''}
            </div>
            <div id="replyForm-${c.id}" class="reply-form" style="display:none;"></div>
            ${c.children.length ? await renderCommentTree(c.children, depth + 1) : ''}
          </div>
        `;
      }
      return html;
    }

    // 缓存 session 供 renderCommentTree 使用
    const { data } = await supabase.auth.getSession();
    window.sessionCache = data;

    list.innerHTML = await renderCommentTree(roots, 0);
  }

  // ====== 提交评论（支持回复 + 可见性） ======
  window.submitComment = async function(parentId) {
    const params = new URLSearchParams(window.location.search);
    const postIdStr = params.get('id');
    const postId = parseInt(postIdStr, 10);
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) { alert('请先登录'); return; }

    const contentId = parentId ? `replyContent-${parentId}` : 'commentContent';
    const visibilityId = parentId ? `replyVisibility-${parentId}` : 'commentVisibility';
    const contentEl = document.getElementById(contentId);
    const visibilityEl = document.getElementById(visibilityId);

    if (!contentEl) {
      console.error('找不到评论输入框:', contentId);
      return;
    }

    const content = contentEl.value.trim();
    const visibility = visibilityEl ? visibilityEl.value : 'public';

    if (!content) return;

    const insertData = {
      post_id: postId,
      content,
      author_id: session.user.id,
      author_name: session.user.user_metadata?.nickname || session.user.email || '匿名'
    };

    if (parentId) insertData.parent_id = parseInt(parentId, 10);
    if (visibility) insertData.visibility = visibility;

    console.log('提交评论:', insertData);

    const { error } = await supabase.from('comments').insert(insertData);

    if (error) {
      console.error('评论失败:', error);
      alert('评论失败：' + error.message);
      return;
    }

    contentEl.value = '';
    loadComments(postId);
  };

  // ====== 显示回复表单 ======
  window.showReplyForm = function(parentId, authorName) {
    const container = document.getElementById(`replyForm-${parentId}`);
    if (container.style.display === 'block') {
      container.style.display = 'none';
      return;
    }
    container.style.display = 'block';
    container.innerHTML = `
      <textarea id="replyContent-${parentId}" rows="2" placeholder="回复 ${escapeHtml(authorName)}..."></textarea>
      <div class="reply-actions">
        <select id="replyVisibility-${parentId}" class="visibility-select">
          <option value="public">🌐 公开</option>
          <option value="private">🔒 仅对方可见</option>
        </select>
        <button class="btn btn-primary btn-sm" onclick="submitComment(${parentId})">发送</button>
        <button class="btn btn-outline btn-sm" onclick="document.getElementById('replyForm-${parentId}').style.display='none'">取消</button>
      </div>
    `;
  };

  // ====== 删除评论 ======
  window.deleteComment = async function(commentId, postId) {
    if (!confirm('确定要删除这条评论吗？')) return;
    await supabase.from('comments').delete().eq('id', commentId);
    loadComments(postId);
  };

  // ====== 点赞 ======
  window.toggleLike = async function(postId) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      alert('请先登录');
      window.location.href = 'login.html';
      return;
    }

    const { data: existing } = await supabase
      .from('likes')
      .select('*')
      .eq('post_id', postId)
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (existing) {
      await supabase.from('likes').delete().eq('id', existing.id);
    } else {
      await supabase.from('likes').insert({ post_id: postId, user_id: session.user.id });
    }

    // 刷新页面数据
    loadPostDetail();
  };

  // ====== 删除帖子 ======
  window.deletePost = async function(postId) {
    if (!confirm('确定要删除这篇帖子吗？')) return;
    await supabase.from('posts').delete().eq('id', postId);
    window.location.href = 'index.html';
  };

  document.addEventListener('DOMContentLoaded', () => {
    if (typeof checkSession === 'function') checkSession();
    loadPostDetail();
  });
}

// ====== 发新帖 ======
if (isNewPost) {
  document.getElementById('newPostForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('postTitle').value.trim();
    const content = document.getElementById('postContent').value.trim();
    const tagsRaw = document.getElementById('postTags').value.trim();
    const errEl = document.getElementById('postError');

    errEl.style.display = 'none';

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      errEl.textContent = '请先登录';
      errEl.style.display = 'block';
      return;
    }

    const tags = tagsRaw ? tagsRaw.split(/[,，]/).map(t => t.trim()).filter(t => t) : [];

    const { error } = await supabase.from('posts').insert({
      title,
      content,
      author_id: session.user.id,
      author_name: session.user.user_metadata?.nickname || session.user.email,
      tags
    });

    if (error) {
      errEl.textContent = '发布失败：' + error.message;
      errEl.style.display = 'block';
      return;
    }

    window.location.href = 'index.html';
  });

  document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      alert('请先登录');
      window.location.href = 'login.html';
    }
    if (typeof checkSession === 'function') checkSession();
  });
}
