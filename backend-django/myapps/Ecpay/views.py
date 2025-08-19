from django.shortcuts import render
from .serializers import UserSubscriptionSerializer, OrderSerializer, EcpayLogsSerializer 
from .models import UserSubscription, Order, EcpayLogs , PaymentPlan
from myapps.Authorization.models import User
from myapps.Authorization.serializers import UserSimplifiedSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from django.http import HttpResponse
from django.utils import timezone
import requests , os
from rest_framework import status
from rest_framework.permissions import AllowAny , IsAuthenticated
import hashlib
import time
from datetime import datetime
from .config import config

# Create your views here.
DJANGO_BASE_URL = os.getenv("DJANGO_BASE_URL", "http://localhost:8000")
REACT_BASE_URL = os.getenv("REACT_BASE_URL", "http://localhost:3000")

class EcpayViewSet(APIView):
    permission_classes = [AllowAny]
    
    @staticmethod
    def generate_check_mac_value(params):
        """生成檢查碼"""
        if 'CheckMacValue' in params:
            del params['CheckMacValue']

        # 按照 key 依 A-Z 排序
        sorted_params = sorted(params.items())

        # 組合字串
        query_parts = []
        for key, value in sorted_params:
            query_parts.append(f"{key}={value}")
        query_string = "&".join(query_parts)
        
        # 加上 HashKey 和 HashIV
        raw_string = f"HashKey={config.HASH_KEY}&{query_string}&HashIV={config.HASH_IV}"
        
        # URL Encode
        from urllib.parse import quote_plus
        encoded_string = quote_plus(raw_string)
        
        # 字元替換
        encoded_string = encoded_string.replace('%2d', '-')
        encoded_string = encoded_string.replace('%5f', '_')
        encoded_string = encoded_string.replace('%2e', '.')
        encoded_string = encoded_string.replace('%21', '!')
        encoded_string = encoded_string.replace('%2a', '*')
        encoded_string = encoded_string.replace('%28', '(')
        encoded_string = encoded_string.replace('%29', ')')
        
        # 轉為小寫
        encoded_string = encoded_string.lower()
        
        # SHA256 加密並轉大寫
        sha256_hash = hashlib.sha256(encoded_string.encode('utf-8')).hexdigest()
        return sha256_hash.upper()
    
    # def get(self, request):
    #     """提供瀏覽器直接進入的測試入口（GET）。
    #     會產生一個自動提交到綠界的表單，方便你直接看到信用卡頁面。
    #     可用 query 參數覆蓋，例如：/ecpay/?amount=100&item=測試商品&desc=說明
    #     """
    #     amount = int(request.GET.get('amount', 100))
    #     item = request.GET.get('item', '測試商品')
    #     desc = request.GET.get('desc', '測試訂單')

    #     merchant_trade_no = f"ORDER{timezone.now().strftime('%Y%m%d%H%M%S')}"
    #     api_params = {
    #         "MerchantID": config.MERCHANT_ID,
    #         "MerchantTradeNo": merchant_trade_no,
    #         "MerchantTradeDate": timezone.now().strftime('%Y/%m/%d %H:%M:%S'),
    #         "PaymentType": "aio",
    #         "TotalAmount": amount,
    #         "TradeDesc": desc,
    #         "ItemName": item,
    #         "ReturnURL": config.RETURN_URL,
    #         "ClientBackURL": config.CLIENT_BACK_URL,
    #         "OrderResultURL": config.CLIENT_BACK_URL,
    #         "ChoosePayment": "Credit",
    #         "EncryptType": 1,
    #         "NeedExtraPaidInfo": "Y",
    #     }
    #     api_params["CheckMacValue"] = self.generate_check_mac_value(dict(api_params))
    #     html_form = self.generate_html_form(config.ACTION_URL, api_params)
    #     # 以 HttpResponse 回傳原始 HTML，避免被 DRF 當作字串轉義
    #     return HttpResponse(html_form, content_type="text/html; charset=utf-8")
    
    def post(self, request):
        # 訂單產生(整理訂單內容)
        payment_plan = PaymentPlan.objects.order_by('-created_at').first()
        if not payment_plan:
            return Response({"error": "No payment plan found"}, status=400)

        # 建立或取得訂單（若未登入，請改用 AllowAny + 不落地 DB）
        order = None
        if hasattr(request, 'user') and getattr(request.user, 'is_authenticated', False):
            order = Order.objects.filter(user=request.user, status="pending").first()
            if not order:
                order = Order.objects.create(
                    user_id=request.user.id,
                    amount=payment_plan.price,
                    status="pending",
                    payment_method=request.data.get("payment_method", "Credit")
                )

        amount = int(order.amount) if order else int(payment_plan.price)

        # 建立唯一的訂單編號
        merchant_trade_no = f"ORDER{timezone.now().strftime('%Y%m%d%H%M%S')}"

        # 整理 API 參數（手動表單方式）
        api_params = {
            "MerchantID": config.MERCHANT_ID,
            "MerchantTradeNo": merchant_trade_no,
            "MerchantTradeDate": timezone.now().strftime('%Y/%m/%d %H:%M:%S'),
            "PaymentType": "aio",
            "TotalAmount": str(amount),  # 確保是字串
            "TradeDesc": payment_plan.description,
            "ItemName": payment_plan.name,
            "ReturnURL": config.RETURN_URL,
            "ClientBackURL": config.CLIENT_BACK_URL,
            "OrderResultURL": config.CLIENT_BACK_URL,
            "ChoosePayment": "Credit",
            "EncryptType": "1",  # 確保是字串
            "NeedExtraPaidInfo": "Y",
        }
        api_params["CheckMacValue"] = self.generate_check_mac_value(dict(api_params))

        # 生成自動提交的 HTML 表單
        html_form = self.generate_html_form(config.ACTION_URL, api_params)
        # 以 HttpResponse 回傳原始 HTML，避免被 DRF 當作字串轉義
        return HttpResponse(html_form, content_type="text/html; charset=utf-8")
    
    def generate_html_form(self, action_url, params):
        """手動生成 HTML 表單"""
        form_inputs = ""
        for key, value in params.items():
            form_inputs += f'<input type="hidden" name="{key}" value="{value}" />\n'
        
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>正在跳轉到綠界金流...</title>
        </head>
        <body>
            <form id="ecpayForm" method="post" action="{action_url}" accept-charset="utf-8">
                {form_inputs}
            </form>
            <script>
                document.getElementById('ecpayForm').submit();
            </script>
            <p>正在跳轉到付款頁面，請稍候...</p>
        </body>
        </html>
        """
        return html

class EcpayReturnView(APIView):
    permission_classes = [AllowAny]  # ECPay 回調不需要驗證
    
    def post(self, request):
        """處理 ECPay 付款完成後的回調"""
        try:
            # 取得 ECPay 回傳的參數
            merchant_trade_no = request.data.get('MerchantTradeNo')
            payment_status = request.data.get('RtnCode')  # 1 表示成功
            
            print("ECPay 回調參數:", request.data)
            
            if payment_status == '1':  # 付款成功
                # 根據訂單編號找到對應的 order 和 user
                # 這裡需要根據你的 MerchantTradeNo 格式來解析
                
                # 暫時用最新的 pending 訂單來處理（實際應該根據 MerchantTradeNo）
                order = Order.objects.filter(status="pending").first()
                if order:
                    # 更新付款狀態
                    User.objects.filter(id=order.user.id).update(is_paid=True)
                    Order.objects.filter(id=order.id).update(status="completed")
                    
                    # 建立訂閱記錄
                    payment_plan = PaymentPlan.objects.order_by('-created_at').first()
                    
                    UserSubscription.objects.create(
                        user_id=order.user.id,
                        order_id=order.id,
                        plan_id=payment_plan.id,
                        start_date=timezone.now(),
                        end_date=timezone.now() + timezone.timedelta(days=payment_plan.duration_months * 30)
                    )
                    
                    # 記錄 ECPay 日誌
                    EcpayLogs.objects.create(
                        order_id=order.id,
                        status_code=200,
                        status_message="Payment successful",
                        trade_no=request.data.get('TradeNo', ''),
                        trade_date=timezone.now(),
                        payment_type=request.data.get('PaymentType', ''),
                        rtn_code=payment_status,
                        rtn_msg=request.data.get('RtnMsg', ''),
                        raw_post_data=str(request.data)
                    )
                
                # ECPay 要求回傳純文字而不是 JSON
                return HttpResponse("1|OK", content_type="text/plain; charset=utf-8")
            else:
                return HttpResponse("0|FAIL", content_type="text/plain; charset=utf-8")  # ECPay 要求的失敗回應格式
                
        except Exception as e:
            print(f"ECPay 回調處理錯誤: {e}")
            return HttpResponse("0|FAIL", content_type="text/plain; charset=utf-8")
