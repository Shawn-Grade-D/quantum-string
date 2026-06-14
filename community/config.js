// Supabase 配置
const SUPABASE_URL = 'https://nnyxnctxwjdtlyytvaee.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ueXhuY3R4d2pkdGx5eXR2YWVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0MDgxNjUsImV4cCI6MjA5Njk4NDE2NX0.9XYBQq5QYRO6QrbuEaM9tcQKeWP5l0S6Acgzm46jXlk';

// 初始化 Supabase 客户端到全局
(function init() {
  if (typeof supabaseClient !== 'undefined') return; // 防止重复初始化
  window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
})();
