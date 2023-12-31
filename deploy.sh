#!/usr/bin/env sh

# 确保脚本抛出遇到的错误
set -e

# 生成静态文件
npm run build

# 进入生成的文件夹
cd docs/.vuepress/dist

# 如果是发布到自定义域名
# echo 'www.example.com' > CNAME

git init
git add -A
git commit -m 'deploy'

# 如果发布到 https://<USERNAME>.github.io
git push -f git@github.com:xBeTe/xBeTe.github.io.git master

# 发布到云服务器
git push -f --set-upstream git@xzxie.me:/home/git/docs.git master

# 如果发布到 https://<USERNAME>.github.io/<REPO>
#git push -f git@github.com:xBeTe/My_Docs.git master:gh-pages

cd -