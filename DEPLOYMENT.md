# 部署指南：成长追踪 → 阿里云 ECS

## 架构概览

```
本地开发 → git push → GitHub → GitHub Actions → 构建 Docker 镜像
                                                      ↓
                                          推送到阿里云 ACR 镜像仓库
                                                      ↓
                                          SSH 连接 ECS → 拉取镜像 → 启动容器
                                                      ↓
                                              Nginx 反向代理 → 用户访问
```

---

## 第一步：创建 GitHub 仓库

在你自己的终端（本地）执行：

```bash
cd /Users/daichao/growth-tracker

# 初始化 Git
git init
git add .
git commit -m "feat: initial commit - growth tracker"

# 在 GitHub 上先创建一个新仓库（private），然后：
git remote add origin https://github.com/你的用户名/growth-tracker.git
git branch -M main
git push -u origin main
```

> ⚠️ `.env` 文件已在 `.gitignore` 中，**不会被提交**，密码安全。

---

## 第二步：购买并配置阿里云 ECS

### 推荐配置
| 项目 | 推荐值 |
|------|--------|
| 地域 | 就近选择（如华东-杭州）|
| 实例规格 | ecs.t6-c1m2.large（1核2G，约 ¥40/月）|
| 操作系统 | Ubuntu 22.04 LTS 64位 |
| 带宽 | 按使用流量计费 1Mbps 起步即可 |
| 磁盘 | 系统盘 40GB SSD |

### 安全组规则（必须配置）
在阿里云控制台 → 安全组 → 入方向规则，添加：

| 协议 | 端口 | 来源 |
|------|------|------|
| TCP | 22 | 你的本地 IP（SSH）|
| TCP | 80 | 0.0.0.0/0（HTTP）|
| TCP | 443 | 0.0.0.0/0（HTTPS）|

---

## 第三步：开通阿里云 ACR 镜像仓库

1. 进入 **容器镜像服务（ACR）** → 个人版（免费）
2. 创建命名空间，例如 `my-apps`
3. 创建镜像仓库，名称 `growth-tracker`，类型**私有**
4. 记录以下信息（后面配置 GitHub Secrets 用）：
   - 仓库地址：`registry.cn-hangzhou.aliyuncs.com`
   - 命名空间：`my-apps`
   - 用户名：阿里云账号（或 RAM 子账号）
   - 密码：ACR 访问密码（在 ACR 控制台设置）

---

## 第四步：初始化 ECS 服务器

SSH 连接到服务器后，运行初始化脚本：

```bash
# 在本地上传脚本
scp deploy/setup-ecs.sh root@你的ECS公网IP:/tmp/

# SSH 登录服务器
ssh root@你的ECS公网IP

# 执行初始化（安装 Docker、Nginx，创建数据目录）
bash /tmp/setup-ecs.sh
```

---

## 第五步：配置 GitHub Secrets

进入 GitHub 仓库 → **Settings → Secrets and variables → Actions → New repository secret**

逐一添加以下 Secrets：

| Secret 名称 | 说明 | 示例值 |
|-------------|------|--------|
| `ACR_REGISTRY` | ACR 仓库地址 | `registry.cn-hangzhou.aliyuncs.com` |
| `ACR_NAMESPACE` | 命名空间 | `my-apps` |
| `ACR_USERNAME` | 阿里云账号 | `your-aliyun-account` |
| `ACR_PASSWORD` | ACR 密码 | `your-acr-password` |
| `ECS_HOST` | ECS 公网 IP | `123.45.67.89` |
| `ECS_USER` | SSH 用户名 | `root` |
| `ECS_SSH_KEY` | SSH 私钥内容 | 见下方说明 |
| `AUTH_SECRET` | NextAuth 密钥 | 运行命令生成（见下方）|
| `AUTH_USERNAME` | 登录用户名 | `admin`（自己设置）|
| `AUTH_PASSWORD_HASH` | 密码哈希 | 运行命令生成（见下方）|
| `NEXTAUTH_URL` | 网站地址 | `http://你的IP` 或 `https://你的域名` |

### 生成 SSH 密钥对（在本地执行）
```bash
# 生成专用部署密钥
ssh-keygen -t ed25519 -C "github-deploy" -f ~/.ssh/growth-tracker-deploy

# 将公钥添加到 ECS 服务器
ssh-copy-id -i ~/.ssh/growth-tracker-deploy.pub root@你的ECS公网IP

# 查看私钥（复制全部内容粘贴到 ECS_SSH_KEY Secret）
cat ~/.ssh/growth-tracker-deploy
```

### 生成 AUTH_SECRET（在本地执行）
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 生成 AUTH_PASSWORD_HASH（在本地执行）
```bash
cd /Users/daichao/growth-tracker
node -e "const b=require('bcryptjs'); console.log(b.hashSync('你的密码', 10))"
```
> ⚠️ **把"你的密码"换成你真正想要的密码**，Hash 值粘贴到 Secret，原始密码自己记好。

---

## 第六步：触发自动部署

配置好所有 Secrets 后，推送代码即可自动部署：

```bash
git push origin main
```

访问 GitHub → **Actions** 标签查看部署进度（约 3-5 分钟）。

---

## 第七步：验证部署

```bash
# 在 ECS 服务器上检查容器状态
docker ps | grep growth-tracker

# 查看容器日志
docker logs growth-tracker --tail 50

# 测试本地访问
curl http://localhost:3000
```

浏览器访问 `http://你的ECS公网IP`，出现登录页即部署成功。

---

## 后续：配置域名 + HTTPS（可选）

### 绑定域名
1. 在阿里云 **云解析 DNS** 添加 A 记录，指向 ECS 公网 IP
2. 修改 `deploy/nginx.conf` 中的 `server_name` 为你的域名
3. 更新 GitHub Secret `NEXTAUTH_URL` 为 `https://你的域名`

### 配置 HTTPS（Let's Encrypt 免费证书）
```bash
# 在 ECS 服务器执行
apt install -y certbot python3-certbot-nginx
certbot --nginx -d 你的域名

# 自动续期
systemctl enable certbot.timer
```

---

## 日常维护

### 更新代码后重新部署
```bash
git add .
git commit -m "update: 说明修改内容"
git push origin main
# → GitHub Actions 自动构建并部署，无需手动操作
```

### 备份数据库
```bash
# 在 ECS 服务器执行
cp /opt/growth-tracker/data/growth.db /opt/growth-tracker/data/growth.db.backup.$(date +%Y%m%d)
```

### 手动重启容器
```bash
docker restart growth-tracker
```

### 查看实时日志
```bash
docker logs growth-tracker -f
```
