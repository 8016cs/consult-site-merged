// Cloudflare Worker：与静态资源同处一个项目
// 只接管 /api/apply，其余请求交给 ASSETS 返回静态文件
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 只处理申请接口
    if (url.pathname === '/api/apply' && request.method === 'POST') {
      try {
        const data = await request.json();

        // 基础校验
        if (!data.name || !data.wechat) {
          return Response.json({ ok: false, error: '缺少必填字段' }, { status: 400 });
        }

        // 钉钉机器人 Webhook 只从 Secret 读取，绝不写进前端/仓库
        if (!env.DINGTALK_WEBHOOK) {
          return Response.json({ ok: false, error: '未配置 Webhook' }, { status: 500 });
        }

        const text =
          '### 📩 新的咨询申请\n' +
          `- **称呼**：${data.name}\n` +
          `- **联系方式**：${data.wechat}\n` +
          `- **需求**：${data.demand || '（未填写）'}\n` +
          `- **预算**：${data.budget || '（未填写）'}\n` +
          `- **时间**：${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`;

        const r = await fetch(env.DINGTALK_WEBHOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ msgtype: 'markdown', markdown: { title: '新的咨询申请', text } })
        });

        if (!r.ok) {
          const detail = await r.text().catch(() => '');
          return Response.json({ ok: false, error: '钉钉返回 ' + r.status, detail }, { status: 502 });
        }

        return Response.json({ ok: true });
      } catch (e) {
        return Response.json({ ok: false, error: String(e) }, { status: 500 });
      }
    }

    // 非 API 请求：直接返回静态资源
    return env.ASSETS.fetch(request);
  }
};
