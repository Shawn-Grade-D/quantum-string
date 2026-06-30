-- ====== 评论可见性 RLS 策略 v2（修复 NULL auth.uid() 问题） ======

-- 先删除旧策略
DROP POLICY IF EXISTS "所有人可看评论" ON comments;
DROP POLICY IF EXISTS "评论可见性规则" ON comments;
DROP POLICY IF EXISTS "评论可见性-v2" ON comments;

-- 策略：auth.uid() 为 NULL（匿名）时只能看公开评论
-- 登录用户：公开 + 自己的私密 + 帖主可见的私密 + 父评论作者可见的私密回复
CREATE POLICY "评论可见性-v2" ON comments
  FOR SELECT
  USING (
    visibility = 'public'
    OR (
      auth.uid() IS NOT NULL
      AND (
        author_id = auth.uid()
        OR (
          parent_id IS NULL
          AND post_id IN (SELECT id FROM posts WHERE author_id = auth.uid())
        )
        OR (
          parent_id IS NOT NULL
          AND parent_id IN (SELECT id FROM comments WHERE author_id = auth.uid())
        )
      )
    )
  );
