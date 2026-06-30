-- ============================================
-- 用户系统升级：个人主页
-- 在 Supabase SQL Editor 中运行
-- ============================================

-- 1. 创建用户资料表（扩展 Supabase auth.users）
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  bio TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  website TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. RLS 策略
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "所有人可看个人资料" ON profiles FOR SELECT USING (true);
CREATE POLICY "用户可更新自己的资料" ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "用户可插入自己的资料" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 3. 新用户注册时自动创建 profile
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nickname)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nickname', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 删除旧触发器（如果存在）
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 创建触发器
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- 4. 为已有用户补齐 profile（如果用户已存在但没有 profile）
INSERT INTO profiles (id, nickname)
SELECT id, COALESCE(raw_user_meta_data->>'nickname', split_part(email, '@', 1))
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles)
ON CONFLICT DO NOTHING;
