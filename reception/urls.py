from django.urls import path
from .views import welcome_page, chat_proxy, personal_page, rajendran_page

urlpatterns = [
    path("", welcome_page, name="welcome"),
    path("1", personal_page, name="personal_page"),
    path("Rajendran_Vasanthakumar", rajendran_page, name="rajendran_page"),
    path("api/chat/", chat_proxy, name="chat_proxy"),
]
