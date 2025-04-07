'use strict';

const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// 跨域配置（Vercel 需要显式声明）
app.use(cors({
  origin: '*', // 生产环境建议限制为具体域名
  methods: ['GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 请求超时配置
const axiosInstance = axios.create({
  timeout: 3000, // 3秒超时
  headers: {
    'Cache-Control': 'no-cache, no-store, must-revalidate'
  }
});

// 动态 VMID 转发接口
app.get('/api/count', async (req, res) => {
  const vmid = req.query.vmid || '28826850'; // 默认值
  
  // 参数校验增强
  if (!/^\d+$/.test(vmid)) {
    return res.status(400).json({
      source: 'bilibili',
      key: '',
      failed: true,
      error: '无效的 VMID 参数（必须为数字）'
    });
  }

  try {
    const response = await axiosInstance.get(`https://api.bilibili.com/x/relation/stat?vmid=${vmid}`);
    
    // 验证 API 响应格式
    if (response.data.code !== 0) {
      throw new Error(`B站 API 错误 [${response.data.code}]: ${response.data.message}`);
    }

    const data = response.data.data;
    res.json({
      source: 'bilibili',
      key: data.mid,
      failed: false,
      count: data.follower
    });

  } catch (error) {
    console.error(`[${vmid}] 请求失败:`, error.message);
    
    res.status(500).json({
      source: 'bilibili',
      key: vmid,
      failed: true,
      error: error.message || '数据获取失败',
      timestamp: new Date().toISOString()
    });
  }
});

// 404 处理
app.use((req, res) => {
  res.status(404).json({
    error: '路由不存在',
    available: ['/api/count?vmid=你的UID']
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('[全局错误]', err.stack);
  res.status(500).json({
    error: '服务器内部错误',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 导出 Express 应用（Vercel 要求）
module.exports = app;