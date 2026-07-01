npm install
npx quartz build
# 复制社区页面到 public/community/ 目录
rm -rf public/community
cp -r community public/community
touch public/community/*.html public/community/*.js public/community/*.css