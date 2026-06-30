-- 创建头像存储桶（运行于 Supabase SQL Editor）
-- Storage bucket 需要通过 Dashboard 或 API 创建，SQL 不支持直接建 bucket

-- 步骤：
-- 1. Supabase Dashboard → Storage → New Bucket
-- 2. 名称: avatars  (勾选 Public bucket)
-- 3. Policies → avatars → New Policy:
--    - SELECT (读取): 允许所有人 (true)
--    - INSERT (上传): 仅认证用户 (auth.role() = 'authenticated')
--    - 文件大小限制建议 2MB
