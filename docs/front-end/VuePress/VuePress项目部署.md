---
title: VuePress 项目部署
---

# VuePress 项目使用 nginx 在云服务器中部署

> - 本站使用 [VuePress](https://vuepress.vuejs.org/zh/) 构建，官方文档提供了[`CloudBase`、`GitHub Pages` 等多个平台的部署](https://vuepress.vuejs.org/zh/guide/deploy.html)，本文主要介绍在自己的服务器中使用 nginx 进行部署。
> - 自动化部署部分[参考文章](https://juejin.cn/post/6948994029254082567)

准备工作：

- Linux 云服务器（最好购买域名，可以使用域名进行访问），云服务安全组入站规则中放行 `80` 端口（ `http` 默认端口，若使用 `https` 放行 `443` 端口）

- 使用 git 管理的 VuePress 项目

## 服务器配置 nginx

### 安装 nginx

安装方式：

- RPM
- Yum（CentOS）
- Docker
- 源码安装

RPM、Yum 以及 Docker安装方式自行搜索，本文主要介绍源码安装方式，虽然过程繁琐，但服务性能好，且方便配置。

#### 准备工作

手动创建 nginx 用户和用户组

```bash
groupadd nginx
useradd nginx -g nginx -s /sbin/nologin -M
```

> 使用非root用户运行 nginx，防止直接从服务器 80 端口获取到 root 用户权限

#### 安装依赖环境

```bash
yum install -y gcc-c++ pcre pcre-devel zlib zlib-devel openssl openssl-devel
```

#### 下载 nginx

[nginx 官网](https://nginx.org/en/download.html)

可以到官网下载后，上传服务器。

也可以直接在服务器上下载：

```bash
wget http://nginx.org/download/nginx-1.25.1.tar.gz
```

> `wget `后面的链接为官网下载链接，可以选择自己想要下载的版本的链接

#### 解压

```bash
tar -zxvf nginx-1.25.1.tar.gz
```

#### 编译

安装前配置

```bash
cd nginx-1.25.1

./configure --prefix=/usr/local/nginx --with-http_stub_status_module --with-http_ssl_module --user=nginx --group=nginx
```

> 参数说明：
>
> - `--prefix=/usr/local/nginx` 编译安装目录（默认 `/usr/local/nginx`）
> - `–-user=nginx` 所属用户nginx
> - `—-group=nginx` 所属组nginx
> - `–-with-http_stub_status_module `该模块提供nginx的基本状态信息
> - `–-with-http_ssl_module` 支持HTTPS

编译并安装

```bash
make && make install 
```



### 配置

#### 将 `nginx` 配置为全局命令

编辑环境变量

```bash
vim /etc/profile
```

加入

```bash
PATH=$PATH:/usr/local/nginx/sbin
export PATH
```

或者使用软链接的方式

```bash
ln -s /usr/local/nginx/sbin/nginx /usr/local/bin/
```

#### 修改配置文件

```bash
vim /usr/local/nginx/conf/nginx.conf
```

```bash
# user nobody 修改为： 
user nginx nginx
```

启动 nginx

```bash
# 检查配置文件
nginx -t

# 启动 nginx
nginx
```

此时如果启动没有问题，在浏览器中访问：`http://服务器IP或域名` 能看到 nginx 默认页面

![如何在 Ubuntu 22.04 上安装 Nginx_nginx_weixin_0010034-Linux](http://mydoc-pics.oss-cn-chengdu.aliyuncs.com/img/f0ffdfd9c6_default_page.jpg)

#### 配置 nginx 工作目录

nginx 默认页面存放在 `/usr/local/nginx/html` 中，我们可新建自己的页面存放目录并配置到 nginx 中

```bash
mkdir /var/www/html

# 给 nginx 用户操作目录权限
sudo chown nginx:nginx -R /var/www
```

修改 nginx 配置文件：

```
# HTTP server
server {
   listen       80;
   server_name  www.yourdomain.me yourdomain.me;
  
   location / {
       root   /var/www/html;
       index  index.html index.htm;
   }
}

# HTTPS server
server {
    listen       443 ssl;
    server_name  www.yourdomain.me yourdomain.me;
    ssl_certificate      /server.pem;
    ssl_certificate_key  /private.key;

    ssl_session_cache    shared:SSL:1m;
    ssl_session_timeout  5m;

    ssl_ciphers  HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers  on;

    location / {
        root   /var/www/html;
        index  index.html index.htm;
    }
}

```

此时将 VuePress 项目构建后 `dist ` 目录下文件上传至 `/var/www/html/` 目录下便能访问你的项目，但如果希望能够像 `GitHub Page` 一样，通过一条命令部署，还需要接着操作。



## 服务器配置 git

### 创建并配置 git 用户

```bash
sh sudo adduser git
su git
```

### 服务器配置SSH key

```sh
cd
mkdir .ssh && chmod 700 .ssh
touch .ssh/authorized_keys && chmod 600 .ssh/authorized_keys
```

配置好以后，我们就相当于使用 git 用户来进行操作了。

复制本地配置的 ssh 访问 git 的公钥，粘贴至 `~/.ssh/authorized_keys`

> 获取公钥的方法：
>
> - 打开`git bash` 
> - 执行生成公钥和私钥的命令: `ssh-keygen -t rsa` 
> - 在用户目录下的.ssh 文件夹中，会有公钥和私钥，将公钥复制到服务器的`authorized_keys`文件中。

这样做的目的就是，以后由本地向服务器提交资源，就不需要再进行身份验证了。

### 创建仓库与目录

找一个地方创建 git 仓库，比如在`/home/git`下创建`blog.git`文件夹，作为 git 仓库:

```sh
mkdir /home/git
cd /home/git
mkdir blog.git
cd blog.git
git init --bare
```

创建临时目录

```sh
mkdir /home/tmp
mkdir /home/tmp/blog
```

### 给 git 用户操作目录权限

```sh
sudo chown git:git -R /var/www
sudo chown git:git -R /home/tmp
```

### 配置 hooks

进入创建的 git 仓库

```
cd /home/git/blog.git/hooks
```

然后修改`post-update.sample`文件，并将其改名为`post-update`，将其修改为如下脚本：

```bash
cp post-update.sample post-update

vim post-update
```



```sh
#!/bin/sh
#
# An example hook script to prepare a packed repository for use over
# dumb transports.
#
# To enable this hook, rename this file to "post-update".

#exec git update-server-info
echo "Im update"
# 代码仓库目录
GIT_REPO=/home/git/blog.git
# 临时目录
TMP_GIT_CLONE=/home/tmp/blog
# Nginx的root目录
PUBLIC_WWW=/var/www/html

rm -rf ${TMP_GIT_CLONE}
git clone $GIT_REPO $TMP_GIT_CLONE
rm -rf ${PUBLIC_WWW}/*
mv -t ${PUBLIC_WWW} ${TMP_GIT_CLONE}/*
```



## 本地项目配置自动部署脚本

### 创建自动部署脚本

在 vuepress 项目根目录创建`deploy.sh`来运行自动部署命令

```sh
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
#git push -f git@github.com:<USERNAME>/<USERNAME>.github.io.git master

# 发布到云服务器
git push -f --set-upstream git@<服务器地址>:/home/git/docs.git master

# 如果发布到 https://<USERNAME>.github.io/<REPO>
#git push -f git@github.com:xBeTe/My_Docs.git master:gh-pages

cd -
```

### 在 package.json 中配置自动打包部署的命令

```json
{
  "scripts": {
    "dev": "vuepress dev docs",
    "build": "vuepress build docs",
    "deploy": "sh ./deploy.sh"
  }
}
```

### 运行自动打包部署命令

在项目根目录打开 `git bash` 运行一下命令：

```bash
npm run deploy
# 或者
yarn deploy
```