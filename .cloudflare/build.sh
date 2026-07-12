npm install
npx quartz build
# 复制社区页面到 public/community/ 目录
rm -rf public/community
cp -r community public/community
touch public/community/*.html public/community/*.js public/community/*.css
# 复制小游戏到 public/games/ 目录
mkdir -p public/games
cp static/turtle-run.html public/games/turtle-run.html
# 复制小程序
mkdir -p public/apps/pipa-tuner
cp -r static/pipa-tuner/* public/apps/pipa-tuner/