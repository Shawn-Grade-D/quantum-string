// 量子弦之链 · 社区核心逻辑

// 使用全局 supabaseClient
var supabase = window.supabaseClient;

// ====== 图片上传（通用） ======
const POST_IMAGES_BUCKET = 'post-images';

window.uploadImage = async function(fileInputId, statusId, textareaId) {
  const fileInput = document.getElementById(fileInputId);
  const statusEl = document.getElementById(statusId);
  const textarea = document.getElementById(textareaId);

  const file = fileInput.files[0];
  if (!file) return;

  // 校验：类型 + 大小
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowed.includes(file.type)) {
    statusEl.textContent = '仅支持 JPG/PNG/WebP/GIF';
    statusEl.className = 'upload-status error';
    fileInput.value = '';
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    statusEl.textContent = '图片不能超过 5MB';
    statusEl.className = 'upload-status error';
    fileInput.value = '';
    return;
  }

  statusEl.textContent = '⏳ 上传中...';
  statusEl.className = 'upload-status';

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    statusEl.textContent = '请先登录';
    statusEl.className = 'upload-status error';
    fileInput.value = '';
    return;
  }

  const ext = file.name.split('.').pop() || 'jpg';
  const fileName = `${session.user.id}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage
    .from(POST_IMAGES_BUCKET)
    .upload(fileName, file, {
      cacheControl: '31536000',
      contentType: file.type
    });

  if (error) {
    statusEl.textContent = '上传失败: ' + error.message;
    statusEl.className = 'upload-status error';
    fileInput.value = '';
    return;
  }

  const { data: urlData } = supabase.storage
    .from(POST_IMAGES_BUCKET)
    .getPublicUrl(fileName);

  const mdImg = `\n![](${urlData.publicUrl})\n`;
  const cursor = textarea.selectionStart;
  textarea.value = textarea.value.slice(0, cursor) + mdImg + textarea.value.slice(cursor);
  textarea.focus();
  textarea.setSelectionRange(cursor + mdImg.length, cursor + mdImg.length);

  statusEl.textContent = '✅ 图片已插入';
  statusEl.className = 'upload-status success';
  fileInput.value = '';
  setTimeout(() => { statusEl.textContent = ''; statusEl.className = 'upload-status'; }, 3000);
};

// ====== 举报功能 ======
window.reportContent = async function(type, targetId, targetTitle) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    alert('请先登录');
    return;
  }

  const reason = prompt('请输入举报原因（色情、暴力、骚扰、垃圾广告、侵权、其他）：');
  if (!reason || !reason.trim()) return;

  const { error } = await supabase.from('reports').insert({
    reporter_id: session.user.id,
    target_type: type,
    target_id: targetId,
    target_title: targetTitle || '',
    reason: reason.trim()
  });

  if (error) {
    if (error.code === '23505') {
      alert('你已经举报过了');
    } else {
      alert('举报失败：' + error.message);
    }
    return;
  }

  alert('举报已提交，管理员将尽快处理。感谢你的监督！🙏');
};

// ====== Markdown 图片渲染 ======
function renderMarkdownImages(text) {
  if (!text) return escapeHtml(text || '');
  return escapeHtml(text)
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="content-image" loading="lazy" onclick="window.open(this.src)">')
    .replace(/\n/g, '<br>');
}

// ====== 简单敏感词过滤 ======
const SENSITIVE_PATTERNS = [
  /赌博|赌场|博彩|六合彩|老虎机/i,
  /代办.*证件|假证|枪支|毒品|摇头丸|冰毒/i,
  /招嫖|卖淫|小姐.*上门|一夜情.*约/i,
  /高利贷|裸贷|套路贷/i,
  /法轮|flg|falungong/i
];

function checkSensitive(text) {
  for (const p of SENSITIVE_PATTERNS) {
    if (p.test(text)) return true;
  }
  return false;
}

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
          ${post.tags && post.tags.length ? post.tags.map(t => `<span class="tag">#${escapeHtml(t)}</span>`).join('') : ''}
        </div>
        <div class="post-content">${renderMarkdownImages(post.content)}</div>
        <div class="post-footer-actions">
          <button id="likeBtn" class="btn btn-outline btn-action" onclick="toggleLike(${post.id})">❤️ <span class="action-label">点赞</span> <span class="count-inline">${post.likes_count || 0}</span></button>
          <button id="bookmarkBtn" class="btn btn-outline btn-action" onclick="toggleBookmark(${post.id})">⭐ <span class="action-label">收藏</span> <span class="count-inline">${post.bookmarks_count || 0}</span></button>
          <button class="btn btn-outline btn-action" onclick="sharePost(${post.id}, '${escapeHtml(post.title).replace(/'/g, "\\'")}')">🔗 <span class="action-label">转发</span></button>
          <button id="deletePostBtn" class="btn btn-danger" style="display:none;" onclick="deletePost(${post.id})">🗑️ 删除</button>
          <button class="btn btn-outline btn-report" onclick="reportContent('post', ${post.id}, '${escapeHtml(post.title).replace(/'/g, "\\'")}')">🚩 举报</button>
        </div>
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
        const btn = document.getElementById('likeBtn');
        btn.classList.add('liked');
        btn.innerHTML = `❤️ <span class="action-label">已赞</span> <span class="count-inline">${post.likes_count || 0}</span>`;
      }

      // 检查收藏状态
      const { data: bookmark } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('post_id', postId)
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (bookmark) {
        const btn = document.getElementById('bookmarkBtn');
        btn.classList.add('bookmarked');
        btn.innerHTML = `⭐ <span class="action-label">已收藏</span> <span class="count-inline">${post.bookmarks_count || 0}</span>`;
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

        const vc = window._voteCounts || {};
        const cv = vc[c.id] || { up: 0, down: 0 };
        const uv = (window._userVotes || {})[c.id];

        html += `
          <div class="comment ${isPrivate ? 'comment-private' : ''}" id="comment-${c.id}" style="margin-left:${Math.min(depth, 5) * 24}px">
            <div class="comment-meta">
              <strong><a href="profile.html?id=${c.author_id}" class="author-link">${escapeHtml(c.author_name)}</a></strong>
              <span>${timeAgo(c.created_at)}${privateLabel}</span>
            </div>
            <div class="comment-content">${renderMarkdownImages(c.content)}</div>
            <div class="comment-actions">
              <button class="btn-vote ${uv === true ? 'vote-active' : ''}" onclick="voteComment(${c.id}, true, ${postId})" title="认同">👍 <span>${cv.up || ''}</span></button>
              <button class="btn-vote ${uv === false ? 'vote-active' : ''}" onclick="voteComment(${c.id}, false, ${postId})" title="反对">👎 <span>${cv.down || ''}</span></button>
              ${canReply ? `<button class="btn-reply" onclick="showReplyForm(${c.id}, '${escapeHtml(c.author_name)}')">💬 回复</button>` : ''}
              ${currentUserId === c.author_id ? `<button class="btn-delete-comment" onclick="deleteComment(${c.id}, ${postId})">🗑️</button>` : ''}
              ${currentUserId && currentUserId !== c.author_id ? `<button class="btn-reply" onclick="reportContent('comment', ${c.id}, '评论')">🚩 举报</button>` : ''}
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

    // 获取当前用户在所有评论上的投票
    let userVotes = {};
    if (data?.session?.user) {
      const { data: votes } = await supabase
        .from('comment_votes')
        .select('*')
        .eq('user_id', data.session.user.id);
      if (votes) votes.forEach(v => { userVotes[v.comment_id] = v.up; });
    }

    // 获取评论的认同/反对计数
    let voteCounts = {};
    {
      const commentIds = comments.map(c => c.id);
      if (commentIds.length) {
        const { data: vc } = await supabase
          .from('comment_votes')
          .select('comment_id, up')
          .in('comment_id', commentIds);
        if (vc) {
          vc.forEach(v => {
            if (!voteCounts[v.comment_id]) voteCounts[v.comment_id] = { up: 0, down: 0 };
            v.up ? voteCounts[v.comment_id].up++ : voteCounts[v.comment_id].down++;
          });
        }
      }
    }
    window._voteCounts = voteCounts;
    window._userVotes = userVotes;

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

    // 敏感词检查
    if (checkSensitive(content)) {
      alert('内容包含违规信息，无法发送。');
      return;
    }

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
        <button type="button" class="btn-upload btn-upload-sm" onclick="document.getElementById('replyImageInput-${parentId}').click()">📷</button>
        <input type="file" id="replyImageInput-${parentId}" accept="image/jpeg,image/png,image/webp,image/gif" style="display:none;" onchange="uploadImage('replyImageInput-${parentId}', 'replyUploadStatus-${parentId}', 'replyContent-${parentId}')">
        <span id="replyUploadStatus-${parentId}" class="upload-status"></span>
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

  // ====== 收藏 ======
  window.toggleBookmark = async function(postId) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      alert('请先登录');
      return;
    }

    const { data: existing } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('post_id', postId)
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (existing) {
      await supabase.from('bookmarks').delete().eq('id', existing.id);
    } else {
      await supabase.from('bookmarks').insert({ post_id: postId, user_id: session.user.id });
    }

    loadPostDetail();
  };

  // ====== 转发（复制链接） ======
  window.sharePost = function(postId, title) {
    const url = `${window.location.origin}/community/post.html?id=${postId}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        alert('链接已复制！\n\n' + url);
      });
    } else {
      prompt('复制以下链接分享：', url);
    }
  };

  // ====== 评论投票（认同/反对） ======
  window.voteComment = async function(commentId, upBool, postId) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      alert('请先登录');
      return;
    }

    const { data: existing } = await supabase
      .from('comment_votes')
      .select('*')
      .eq('comment_id', commentId)
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (existing) {
      if (existing.up === upBool) {
        // 再次点击相同 → 取消投票
        await supabase.from('comment_votes').delete().eq('id', existing.id);
      } else {
        // 切换投票方向
        await supabase.from('comment_votes').update({ up: upBool }).eq('id', existing.id);
      }
    } else {
      await supabase.from('comment_votes').insert({ comment_id: commentId, user_id: session.user.id, up: upBool });
    }

    loadComments(postId);
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

    // 绑定评论图片上传按钮
    const cmtImgBtn = document.getElementById('commentImageBtn');
    const cmtImgInput = document.getElementById('commentImageInput');
    if (cmtImgBtn && cmtImgInput) {
      cmtImgBtn.addEventListener('click', () => cmtImgInput.click());
      cmtImgInput.addEventListener('change', () => uploadImage('commentImageInput', 'commentUploadStatus', 'commentContent'));
    }
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

    // 敏感词检查
    if (checkSensitive(title) || checkSensitive(content)) {
      errEl.textContent = '内容包含违规信息，无法发布。';
      errEl.style.display = 'block';
      return;
    }

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

    // 绑定图片上传按钮
    const postImgBtn = document.getElementById('postImageBtn');
    const postImgInput = document.getElementById('postImageInput');
    if (postImgBtn && postImgInput) {
      postImgBtn.addEventListener('click', () => postImgInput.click());
      postImgInput.addEventListener('change', () => uploadImage('postImageInput', 'postUploadStatus', 'postContent'));
    }
  });
}
