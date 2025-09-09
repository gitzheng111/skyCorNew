#!/bin/bash

# 配置参数
USER=deploy                 # 服务器用户名 (比如 ubuntu 或 root)
SERVER=43.138.197.165       # 服务器IP地址
PROJECT_NAME=worktoolNew    # 项目名，用于服务器路径
LOCAL_DIST=dist             # 本地打包后的文件夹
REMOTE_DIR=/home/$USER/$PROJECT_NAME

echo "🚀 开始部署 $PROJECT_NAME 到 $SERVER ..."

# 1. 打包前端
npm run build

# 2. 上传到服务器
ssh $USER@$SERVER "rm -rf $REMOTE_DIR && mkdir -p $REMOTE_DIR"
scp -r $LOCAL_DIST/* $USER@$SERVER:$REMOTE_DIR/

# 3. 配置 Nginx
ssh $USER@$SERVER "sudo bash -c 'cat > /etc/nginx/sites-available/$PROJECT_NAME <<EOF
server {
    listen 80;
    server_name _;
    root $REMOTE_DIR;
    index index.html;
    location / {
        try_files \$uri /index.html;
    }
}
EOF
ln -sf /etc/nginx/sites-available/$PROJECT_NAME /etc/nginx/sites-enabled/$PROJECT_NAME
systemctl restart nginx'"

echo "✅ 部署完成！请访问 http://$SERVER"
