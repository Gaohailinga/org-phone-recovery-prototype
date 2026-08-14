# AI 部署指南：将静态原型发布到 GitHub Pages

> 本指南用于发给另一位 AI 助手，由它协助用户把本地 HTML/CSS/JS 原型部署为公网可访问链接。

## 目标

将用户提供的静态原型目录（包含 `index.html`、`css/`、`js/` 等）部署到 GitHub Pages，生成永久公开的访问链接。

## 前置条件

- 用户已注册 GitHub 账号：https://github.com/signup
- 用户能访问手机浏览器或另一台可打开 github.com 的设备
- 本地环境已安装 `git`、`curl`
- 如使用本指南附带的脚本，环境需支持 Bash

## 部署步骤

### 步骤 1：确认原型目录

确认用户原型文件所在目录，例如：

```
/Users/username/prototype/
├── index.html
├── v2.html
├── css/
│   └── style.css
└── js/
    ├── app.js
    └── app-v2.js
```

如存在 `server.js`、`deploy.log`、`.git/` 等无关文件，建议删除或加入 `.gitignore`。

### 步骤 2：获取 GitHub 授权

由于用户可能无法在当前网络直接打开 github.com，使用 **GitHub device flow** 授权。

执行以下命令，生成授权码：

```bash
CLIENT_ID="178c6fc778ccc68e1d6a"

curl -s -X POST https://github.com/login/device/code \
  -H "Accept: application/json" \
  -d "client_id=$CLIENT_ID" \
  -d "scope=repo" | tee /tmp/github_device.json
```

从返回中提取 `user_code`，例如 `ABCD-1234`。

### 步骤 3：引导用户完成授权

让用户在手机浏览器打开：

```
https://github.com/login/device
```

输入步骤 2 得到的 `user_code`，点击 **Continue** → **Authorize GitHub CLI**。

用户确认完成后，继续下一步。

### 步骤 4：获取访问令牌

```bash
DEVICE_CODE=$(cat /tmp/github_device.json | grep -o '"device_code":"[^"]*' | cut -d'"' -f4)
CLIENT_ID="178c6fc778ccc68e1d6a"

for i in $(seq 1 20); do
  RESPONSE=$(curl -s -X POST https://github.com/login/oauth/access_token \
    -H "Accept: application/json" \
    -d "client_id=$CLIENT_ID" \
    -d "device_code=$DEVICE_CODE" \
    -d "grant_type=urn:ietf:params:oauth:grant-type:device_code")

  ACCESS_TOKEN=$(echo "$RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
  if [ -n "$ACCESS_TOKEN" ]; then
    echo "$RESPONSE" > /tmp/github_token.json
    break
  fi
  sleep 5
done
```

如成功，`/tmp/github_token.json` 中将包含 `access_token`。

### 步骤 5：创建 GitHub 仓库

询问用户期望的仓库名，例如 `my-prototype`，以及 GitHub 用户名。

执行：

```bash
GITHUB_USER="用户的GitHub用户名"
REPO_NAME="my-prototype"
TOKEN=$(cat /tmp/github_token.json | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

curl -s -X POST https://api.github.com/user/repos \
  -H "Authorization: token $TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  -d "{\"name\":\"$REPO_NAME\",\"description\":\"静态原型\",\"private\":false,\"auto_init\":true}"
```

### 步骤 6：推送原型代码

```bash
PROTOTYPE_DIR="/Users/username/prototype"
TOKEN=$(cat /tmp/github_token.json | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

cd "$PROTOTYPE_DIR"
git init
git config user.email "deploy@example.com"
git config user.name "Deploy Bot"
git remote remove origin 2>/dev/null || true
git remote add origin "https://$GITHUB_USER:$TOKEN@github.com/$GITHUB_USER/$REPO_NAME.git"
git add .
git commit -m "Initial prototype commit"
git push -f origin main
```

### 步骤 7：开启 GitHub Pages

```bash
TOKEN=$(cat /tmp/github_token.json | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

curl -s -X POST "https://api.github.com/repos/$GITHUB_USER/$REPO_NAME/pages" \
  -H "Authorization: token $TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  -d '{"source":{"branch":"main","path":"/"}}'
```

### 步骤 8：等待部署完成

GitHub Pages 首次部署通常需要 1-3 分钟。

验证方式：

```bash
sleep 60
curl -s -o /dev/null -w "%{http_code}" "https://$GITHUB_USER.github.io/$REPO_NAME/"
```

返回 `200` 表示部署成功。

### 步骤 9：返回访问链接

将以下链接返回给用户：

```
https://用户的GitHub用户名.github.io/my-prototype/
```

如果存在多方案页面（如 `v2.html`），一并提供：

```
https://用户的GitHub用户名.github.io/my-prototype/v2.html
```

### 步骤 10：清理临时文件

```bash
rm -f /tmp/github_token.json /tmp/github_device.json
```

## 备选方案

如果用户没有 GitHub 账号或无法完成授权，改用以下方式：

### 方案 A：EdgeOne Pages

1. 检查是否已连接 EdgeOne Pages 集成
2. 使用 `edgeone pages deploy` 命令部署
3. 获得临时预览链接
4. 如需永久公开，需绑定自定义域名

### 方案 B：打包发送

```bash
cd /Users/username/prototype
zip -r prototype.zip index.html v2.html css js
```

将 `prototype.zip` 发给用户，对方解压后双击 HTML 即可本地打开。

## 注意事项

1. `access_token` 是敏感信息，不要展示给用户，用完后立即删除。
2. 推送代码前建议删除 `.DS_Store`、`.git/`、日志文件等无关内容。
3. 仓库名建议使用小写字母、数字和短横线。
4. 如 GitHub Pages 访问返回 404，等待 1-3 分钟后重试。
