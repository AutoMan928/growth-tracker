#!/bin/bash
# 阿里云 ECS 初始化脚本（Ubuntu 22.04）
# 第一次在服务器上运行，完成环境配置
# 用法: bash setup-ecs.sh

set -e

echo "====================================="
echo "  成长追踪 ECS 环境初始化脚本"
echo "====================================="

# 1. 更新系统
apt update && apt upgrade -y

# 2. 安装 Docker
if ! command -v docker &> /dev/null; then
    echo "📦 安装 Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
    echo "✅ Docker 安装完成"
else
    echo "✅ Docker 已安装: $(docker --version)"
fi

# 3. 安装 Nginx
if ! command -v nginx &> /dev/null; then
    echo "📦 安装 Nginx..."
    apt install -y nginx
    systemctl enable nginx
    echo "✅ Nginx 安装完成"
else
    echo "✅ Nginx 已安装: $(nginx -v 2>&1)"
fi

# 4. 创建数据目录（SQLite 持久化存储）
mkdir -p /opt/growth-tracker/data
chmod 755 /opt/growth-tracker/data
echo "✅ 数据目录已创建: /opt/growth-tracker/data"

# 5. 配置 Nginx
echo ""
echo "📝 请输入你的域名或服务器公网 IP:"
read -r DOMAIN

cp /dev/stdin /etc/nginx/sites-available/growth-tracker << NGINX_EOF
server {
    listen 80;
    server_name ${DOMAIN};

    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade \$http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host \$host;
        proxy_set_header   X-Real-IP \$remote_addr;
        proxy_set_header   X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        expires    365d;
        add_header Cache-Control "public, immutable";
    }

    client_max_body_size 10M;
}
NGINX_EOF

ln -sf /etc/nginx/sites-available/growth-tracker /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
echo "✅ Nginx 配置完成"

# 6. 配置防火墙（如果有 ufw）
if command -v ufw &> /dev/null; then
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw allow 22/tcp
    echo "✅ 防火墙规则已添加"
fi

echo ""
echo "====================================="
echo "✅ ECS 初始化完成！"
echo ""
echo "接下来："
echo "  1. 在阿里云控制台确认安全组放行 80/443 端口"
echo "  2. 配置 GitHub Secrets（见 DEPLOYMENT.md）"
echo "  3. 推送代码到 GitHub main 分支触发自动部署"
echo "====================================="
