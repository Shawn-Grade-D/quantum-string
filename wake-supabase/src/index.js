/**
 * Quantum String - Supabase 防休眠 Worker
 * 每天自动请求 Supabase API 一次，防止免费层项目因不活跃被暂停。
 * 通过 Cloudflare Cron Trigger 定时执行（UTC 20:00 = 北京时间次日 04:00）
 */

export default {
  async scheduled(event, env, ctx) {
    const url = `${env.SUPABASE_URL}/rest/v1/`;
    const anonKey = env.SUPABASE_ANON_KEY;

    try {
      // 发一个简单的 HEAD 请求到 Supabase REST 端点
      // 不需要真实数据，仅触发流量统计即可
      const response = await fetch(url, {
        method: 'HEAD',
        headers: anonKey ? {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`
        } : {}
      });

      console.log(`Supabase wake: ${response.status} ${response.statusText}`);
    } catch (err) {
      console.error(`Supabase wake failed: ${err.message}`);
    }
  },

  // 也支持手动 HTTP 触发（可选，方便测试）
  async fetch(request, env, ctx) {
    const url = `${env.SUPABASE_URL}/rest/v1/`;
    const anonKey = env.SUPABASE_ANON_KEY;

    try {
      const response = await fetch(url, {
        method: 'HEAD',
        headers: anonKey ? {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`
        } : {}
      });

      return new Response(`Supabase wake: ${response.status} ${response.statusText}`, {
        status: 200
      });
    } catch (err) {
      return new Response(`Supabase wake failed: ${err.message}`, {
        status: 500
      });
    }
  }
};
