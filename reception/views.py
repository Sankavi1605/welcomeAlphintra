from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
import requests

def welcome_page(request):
    return render(request, "reception/welcome.html")

@csrf_exempt
def chat_proxy(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            # Forward the request to the Cloud Run endpoint
            api_url = "https://chatbot-backend-452555374554.us-central1.run.app/api/v1/chat"
            response = requests.post(
                api_url,
                json=data,
                headers={"Content-Type": "application/json"}
            )
            return JsonResponse(response.json(), status=response.status_code)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Method not allowed"}, status=405)
