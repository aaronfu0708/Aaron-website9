from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

@csrf_exempt
@require_http_methods(["GET"])
def health_check(request):
    """
    健康檢查端點，用於 Railway 部署檢查
    """
    return JsonResponse({
        'status': 'healthy',
        'message': 'Django 後端服務正常運行',
        
    })
