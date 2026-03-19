#!/bin/bash

# 获取电脑的局域网 IP（排除 127.0.0.1）
IP=$(ifconfig | grep "inet " | grep -v "127.0.0.1" | awk '{print $2}' | head -n 1)

if [ -z "$IP" ]; then
  echo "❌ 无法获取局域网 IP，请检查网络连接"
  exit 1
fi

echo "📡 检测到电脑 IP: $IP"
echo "📝 更新 .env.local 配置..."

# 写入 .env.local
echo "EXPO_PUBLIC_API_URL=http://$IP:3000/v1" > .env.local

echo "✅ 配置完成，启动开发服务器..."
echo ""

# 启动 Expo
npx expo start --android
