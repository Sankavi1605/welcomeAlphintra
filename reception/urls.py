from django.urls import path
from .views import welcome_page, chat_proxy

urlpatterns = [
    path("", welcome_page, name="welcome"),
    path("api/chat/", chat_proxy, name="chat_proxy"),
]
