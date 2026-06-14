// 量子弦之链 · 社区主题切换

// 初始化主题
(function initTheme() {
  const saved = localStorage.getItem('community-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved || (prefersDark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme === 'dark' ? '' : 'light');
  // 更新按钮图标
  const btn = document.getElementById('themeToggle');
  if (btn) btn.textContent = theme === 'dark' ? '🌙' : '☀️';
})();

// 切换主题
function toggleTheme() {
  const html = document.documentElement;
  const isDark = !html.getAttribute('data-theme') || html.getAttribute('data-theme') === '';
  const newTheme = isDark ? 'light' : 'dark';
  
  if (newTheme === 'light') {
    html.setAttribute('data-theme', 'light');
  } else {
    html.removeAttribute('data-theme');
  }
  
  localStorage.setItem('community-theme', newTheme);
  
  const btn = document.getElementById('themeToggle');
  if (btn) btn.textContent = newTheme === 'dark' ? '🌙' : '☀️';
}
