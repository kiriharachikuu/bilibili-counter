const express = require('express');
const axios = require('axios');
const app = express();
const port = 3000;

// 中间件配置
app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

// 动态 VMID 转发接口
app.get('/api/count', async (req, res) => {
  const vmid = req.query.vmid;

  // 参数校验
  if (!vmid || isNaN(vmid)) {
    return res.status(400).json({
      source: 'bilibili',
      key: '',
      failed: true,
      error: '无效的 VMID 参数'
    });
  }

  try {
    const response = await axios.get(`https://api.bilibili.com/x/relation/stat?vmid=${vmid}`, {
      timeout: 5000
    });

    if (response.data.code !== 0) {
      throw new Error(`B站 API 错误: ${response.data.message}`);
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
      error: error.message || '数据获取失败'
    });
  }
});

// 启动服务
app.listen(port, () => {
  console.log(`服务运行在 http://localhost:${port}/api/count?vmid=你的UID`);
});