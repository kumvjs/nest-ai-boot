/**
 * WebSocket Node.js 测试客户端
 *
 * 使用方式：
 * 1. 安装依赖: npm install socket.io-client
 * 2. 修改下面的 JWT_TOKEN 为你的实际 token
 * 3. 运行: node test-client.js
 */

const { io } = require('socket.io-client')

// ========== 配置 ==========
const SERVER_URL = 'http://localhost:3000'
const NAMESPACE = '/chat'
const JWT_TOKEN = 'your-jwt-token-here'  // 👈 替换为实际的 JWT token

// ========== 连接 WebSocket ==========
console.log(`🔄 正在连接到 ${SERVER_URL}${NAMESPACE}...`)

const socket = io(SERVER_URL + NAMESPACE, {
  auth: {
    token: JWT_TOKEN,
  },
  // 或者使用 headers 方式传递 token
  // extraHeaders: {
  //   Authorization: `Bearer ${JWT_TOKEN}`
  // }
})

// ========== 事件监听 ==========

socket.on('connect', () => {
  console.log('✅ WebSocket 连接成功！')
  console.log(`客户端 ID: ${socket.id}`)
  console.log('\n开始测试...\n')

  // 测试 1: Ping (公开接口，无需认证)
  console.log('📤 测试 1: 发送 Ping')
  socket.emit('ping', {}, (response) => {
    console.log('📥 Ping 响应:', response)
  })

  // 测试 2: 发送消息 (需要登录)
  setTimeout(() => {
    console.log('\n📤 测试 2: 发送消息')
    socket.emit('message', { content: 'Hello from Node.js client!' }, (response) => {
      console.log('📥 消息响应:', response)
    })
  }, 1000)

  // 测试 3: 广播消息 (需要 system:broadcast 权限)
  setTimeout(() => {
    console.log('\n📤 测试 3: 发送广播 (可能因权限不足而失败)')
    socket.emit('broadcast', { content: 'Broadcast from Node.js!' }, (response) => {
      console.log('📥 广播响应:', response)
    })
  }, 2000)
})

socket.on('disconnect', (reason) => {
  console.log(`❌ 连接断开: ${reason}`)
})

socket.on('connect_error', (error) => {
  console.error('❌ 连接错误:', error.message)
  console.log('\n常见错误原因:')
  console.log('1. JWT Token 无效或已过期')
  console.log('2. 服务器未启动或地址错误')
  console.log('3. Token 未通过 auth.token 正确传递')
  process.exit(1)
})

socket.on('error', (error) => {
  console.error('❌ WebSocket 错误:', error)
})

// 监听服务器推送的消息
socket.on('message', (data) => {
  console.log('📨 收到消息:', data)
})

socket.on('broadcast', (data) => {
  console.log('📢 收到广播:', data)
})

socket.on('pong', (data) => {
  console.log('🏓 收到 Pong:', data)
})

// ========== 优雅退出 ==========
process.on('SIGINT', () => {
  console.log('\n\n👋 正在断开连接...')
  socket.disconnect()
  process.exit(0)
})

// 保持进程运行
console.log('按 Ctrl+C 退出\n')
