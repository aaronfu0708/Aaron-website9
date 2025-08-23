# 动态max_tokens优化说明

## 问题背景

在生成15题时，系统经常出现"題目發送失敗，請稍後再試"的SafeAlert错误。经过分析发现，主要原因是OpenAI API的`max_tokens`设置过低，无法容纳大量题目的完整内容。

## 原始问题

- **固定设置**: `max_tokens=4000`
- **问题**: 对于15题，4000 tokens明显不足
- **结果**: OpenAI API响应被截断，JSON解析失败，触发错误处理

## 优化方案

### 动态max_tokens策略

根据题目数量动态调整`max_tokens`参数：

```python
# 根据题目数量动态调整 max_tokens
if count <= 5:
    max_tokens = 4000      # 1-5题：4000 tokens
elif count <= 10:
    max_tokens = 6000      # 6-10题：6000 tokens
else:
    max_tokens = 8000      # 11-15题：8000 tokens
```

### 优化效果

| 题目数量 | 原始设置 | 优化后设置 | 改进效果 |
|---------|---------|-----------|---------|
| 1-5题   | 4000    | 4000      | 保持稳定 |
| 6-10题  | 4000    | 6000      | +2000 tokens |
| 11-15题 | 4000    | 8000      | +4000 tokens |

## 技术实现

### 1. 核心优化代码

```python:ml-service/topic_apps.py
def generate_questions_with_ai(topic, difficulty, count):
    # 根据题目数量动态调整 max_tokens
    if count <= 5:
        max_tokens = 4000
    elif count <= 10:
        max_tokens = 6000
    else:
        max_tokens = 8000
    
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[...],
        max_tokens=max_tokens  # 动态调整的token限制
    )
```

### 2. 增强的错误处理

```python
# 检查是否因为token限制而截断
if response.choices[0].finish_reason == 'length':
    print(f"⚠️ 警告：达到token限制 {max_tokens}，回应可能被截断")
    print(f"建议：对于 {count} 题，考虑增加 max_tokens 到 {max_tokens + 2000}")
```

### 3. 详细的日志记录

```python
print(f"=== 动态调整 max_tokens ===")
print(f"题目数量: {count}, 设置 max_tokens: {max_tokens}")
print(f"实际使用的 tokens: {response.usage.total_tokens}")
print(f"是否达到token限制: {'是' if response.choices[0].finish_reason == 'length' else '否'}")
```

## 预期效果

### 解决的问题
1. ✅ 消除15题生成的SafeAlert错误
2. ✅ 提高大量题目生成的成功率
3. ✅ 保持少量题目的生成效率
4. ✅ 提供更好的错误诊断信息

### 性能影响
- **成本**: 对于6-15题，token使用量增加
- **成功率**: 大幅提升，特别是15题生成
- **用户体验**: 减少错误提示，提升满意度

## 监控建议

### 1. 日志监控
- 关注`finish_reason`字段
- 监控实际token使用量
- 记录生成失败的题目数量

### 2. 性能指标
- 题目生成成功率
- 平均token使用量
- API响应时间

### 3. 成本控制
- 定期评估token使用效率
- 根据实际使用情况调整阈值
- 考虑进一步优化提示词长度

## 测试验证

运行测试脚本验证优化效果：

```bash
cd ml-service
python3 test_token_optimization.py
```

## 后续优化方向

1. **智能token计算**: 根据题目难度和类型动态计算
2. **批量优化**: 考虑分批生成大量题目
3. **缓存机制**: 缓存常用题目的生成结果
4. **A/B测试**: 对比不同token设置的效果

## 总结

这次优化通过动态调整`max_tokens`参数，有效解决了15题生成失败的问题。虽然增加了部分成本，但显著提升了用户体验和系统稳定性。建议在生产环境中持续监控效果，并根据实际使用情况进一步优化。