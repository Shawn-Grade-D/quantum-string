// Supabase 配置
// 在 Cloudflare Pages 部署时，建议将 key 设为环境变量
const SUPABASE_URL = 'https://nnyxnctxwjdtlyytvaee.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ueXhuY3R4d2pkdGx5eXR2YWVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0MDgxNjUsImV4cCI6MjA5Njk4NDE2NX0.9XYBQq5QYRO6QrbuEaM9tcQKeWP5l0S6Acgzm46jXlk';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
