// 量子弦之链 · Cloudflare Workers 路由
// 处理 /community/* 路径指向 community 目录的静态文件
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // 社区路径重定向到 community 目录下的文件
    if (path.startsWith('/community/') || path === '/community') {
      // 获取社区目录下的文件
      let filePath = path === '/community' || path === '/community/' ? '/community/index.html' : path;
      const asset = await env.ASSETS.fetch(new Request(url.origin + filePath));
      if (asset.status === 200) return asset;

      // 404 时返回社区404
      return new Response('社区页面未找到', { status: 404, headers: { 'Content-Type': 'text/html' } });
    }

    // 其他路径走默认的 Quartz 主站
    return env.ASSETS.fetch(request);
  }
};
