npm install
npx quartz build

# 复制社区页面到输出目录（保留给手动构建使用）
mkdir -p public/community
cp -r community/* public/community/