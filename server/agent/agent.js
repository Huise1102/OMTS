// 智能对话编排层：调用通义千问（OpenAI 兼容接口 + Function Calling），
// 维护多轮对话历史，执行"工具调用循环"直到模型给出最终回复
const axios = require('axios');
const pool = require('../config/db');
const { tools, executeTool } = require('./tools');

const SYSTEM_PROMPT = `你是"星辉影城"的智能购票助手。请遵守以下规则：
1. 你负责帮助用户完成：查影片/推荐、查场次、查座位、下单购票、查询订单、退票、观影指南问答。
2. 只做购票相关的事，遇到无关或敏感话题要礼貌拒绝并引导回购票主题。
3. 内容健康、积极向上，符合法律法规和社会主义核心价值观。
4. 当用户意图涉及工具但缺少必要参数时，用自然语言友好地追问补全（如缺影片、场次、座位、订单号）。
5. 下单和退票是重要操作，生成确认前，用清晰文字总结金额、场次、座位等信息。
6. 回复简洁、语气友好，使用中文。
7. 回复中不要使用任何 emoji 表情符号。`;

// 调用通义千问（OpenAI 兼容模式）
async function callQwen(messages) {
  const url = `${process.env.QWEN_BASE_URL}/chat/completions`;
  const resp = await axios.post(
    url,
    {
      model: process.env.QWEN_MODEL || 'qwen-plus',
      messages,
      tools,
      tool_choice: 'auto',
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.QWEN_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    }
  );
  return resp.data.choices[0].message;
}

// 处理一轮对话，返回 { reply, pendingAction }
async function chat({ sessionId, userId, message }) {
  if (!process.env.QWEN_API_KEY) {
    throw new Error('未配置大模型 API Key（请在 .env 中设置 QWEN_API_KEY）');
  }

  // 读取历史（仅 user/assistant，最多最近 30 条）
  const [history] = await pool.query(
    "SELECT role, content FROM chat_message WHERE session_id=? AND role IN ('user','assistant') ORDER BY id ASC LIMIT 30",
    [sessionId]
  );
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: message },
  ];

  // 记录用户消息
  await pool.query('INSERT INTO chat_message(session_id, role, content) VALUES (?,?,?)', [sessionId, 'user', message]);

  let reply = '';
  let pendingAction = null;

  // 工具调用循环：最多 3 轮，避免无限循环
  for (let i = 0; i < 3; i++) {
    const msg = await callQwen(messages);

    if (msg.tool_calls && msg.tool_calls.length) {
      // 回填 assistant 的工具调用消息
      messages.push({ role: 'assistant', content: msg.content || '', tool_calls: msg.tool_calls });
      for (const tc of msg.tool_calls) {
        const name = tc.function.name;
        let args = {};
        try { args = JSON.parse(tc.function.arguments || '{}'); } catch (e) { args = {}; }
        const result = await executeTool(name, args, { userId });

        // 记录工具调用
        await pool.query(
          'INSERT INTO chat_message(session_id, role, tool_name, tool_args, tool_result) VALUES (?,?,?,?,?)',
          [sessionId, 'tool', name, JSON.stringify(args), JSON.stringify(result)]
        );
        // 捕获"待确认"卡片，返回给前端
        if (result && result.pending) pendingAction = result;

        messages.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify(result) });
      }
      continue; // 让模型基于工具结果继续生成
    }

    reply = msg.content || '';
    break;
  }

  // 记录助手回复
  await pool.query('INSERT INTO chat_message(session_id, role, content) VALUES (?,?,?)', [sessionId, 'assistant', reply]);

  return { reply, pendingAction };
}

module.exports = { chat };