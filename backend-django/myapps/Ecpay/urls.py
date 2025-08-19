from django.urls import path, include ,re_path
from django.views.decorators.csrf import csrf_exempt
from .views import EcpayViewSet, EcpayReturnView

urlpatterns = [
    path('ecpay/', csrf_exempt(EcpayViewSet.as_view()), name='ecpay'),
    path('ECpay-return/', csrf_exempt(EcpayReturnView.as_view()), name='ecpay_return'),

]