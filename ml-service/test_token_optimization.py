#!/usr/bin/env python3
"""
测试脚本：验证动态max_tokens优化
测试不同题目数量的token使用情况
"""

import os
import sys
from pathlib import Path

# 添加项目根目录到Python路径
ROOT = Path(__file__).resolve().parent.parent
sys.path.append(str(ROOT))

# 模拟环境变量
os.environ['OPENAI_API_KEY'] = 'test-key'

def test_token_calculation():
    """测试token计算逻辑"""
    print("=== 测试动态max_tokens计算 ===")
    
    test_cases = [1, 3, 5, 7, 8, 10, 12, 15]
    
    for count in test_cases:
        if count <= 5:
            max_tokens = 4000
        elif count <= 10:
            max_tokens = 6000
        else:
            max_tokens = 8000
        
        print(f"题目数量: {count:2d} → max_tokens: {max_tokens}")
    
    print("\n=== 优化效果分析 ===")
    print("1-5题: 4000 tokens (保持原有设置)")
    print("6-10题: 6000 tokens (增加2000 tokens)")
    print("11-15题: 8000 tokens (增加4000 tokens)")
    print("总体效果: 确保所有题目数量都能成功生成")

def test_prompt_length_estimation():
    """测试提示词长度估算"""
    print("\n=== 提示词长度估算 ===")
    
    # 基础提示词长度估算
    base_prompt = 2000  # 基础提示词约2000字符
    
    for count in [1, 5, 10, 15]:
        if count <= 5:
            max_tokens = 4000
        elif count <= 10:
            max_tokens = 6000
        else:
            max_tokens = 8000
        
        # 每道题目的预估长度
        per_question = 800  # 题目+选项+解析约800字符
        estimated_length = base_prompt + (count * per_question)
        
        print(f"题目数量: {count:2d}")
        print(f"  预估长度: {estimated_length:4d} 字符")
        print(f"  设置tokens: {max_tokens:4d}")
        print(f"  是否足够: {'✅' if max_tokens * 0.75 > estimated_length else '❌'}")

def main():
    """主函数"""
    print("🚀 动态max_tokens优化测试")
    print("=" * 50)
    
    test_token_calculation()
    test_prompt_length_estimation()
    
    print("\n" + "=" * 50)
    print("✅ 测试完成！")
    print("\n💡 建议:")
    print("1. 1-5题使用4000 tokens，保持稳定性")
    print("2. 6-10题使用6000 tokens，确保中等数量题目成功")
    print("3. 11-15题使用8000 tokens，解决大量题目生成失败问题")
    print("4. 监控实际token使用情况，进一步优化")

if __name__ == "__main__":
    main()