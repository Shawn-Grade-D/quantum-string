-- ============================================
-- 社区评论系统升级：嵌套评论 + 可见性控制
-- 在 Supabase SQL Editor 中运行此脚本
-- ============================================

-- 1. 添加 parent_id（嵌套评论）和 visibility（可见性）字段
ALTER TABLE comments
  ADD COLUMN parent_id BIGINT REFERENCES comments(id) ON DELETE CASCADE,
  ADD COLUMN visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private'));

-- 2. 创建索引加速查询
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);

-- 3. 更新 RLS：私密评论规则
-- 先删除旧策略
DROP POLICY IF EXISTS "所有人可看评论" ON comments;

-- 新策略：公开评论所有人可见；私密评论仅作者和父评论作者可见
CREATE POLICY "评论可见性规则" ON comments
  FOR SELECT
  USING (
    visibility = 'public'
    OR auth.uid() = author_id
    OR (
      visibility = 'private'
      AND parent_id IS NOT NULL
      AND auth.uid() = (SELECT author_id FROM comments c2 WHERE c2.id = comments.parent_id)
    )
  );
