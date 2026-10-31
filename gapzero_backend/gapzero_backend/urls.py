"""
AGYAAN LAB URL Configuration
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/auth/', include('accounts.urls')),
    path('api/v1/research/', include('research.urls')),
    path('api/v1/sources/', include('sources.urls')),
    path('api/v1/analysis/', include('analysis.urls')),
    path('api/v1/reports/', include('reports.urls')),
    path('api/v1/common/', include('common.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
