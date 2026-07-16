from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
import requests
import logging

logger = logging.getLogger(__name__)

def welcome_page(request):
    return render(request, "reception/welcome.html")

def personal_page(request):
    return render(request, "reception/welcome.html", {"show_profile": True})

@csrf_exempt
def chat_proxy(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            api_url = "https://chatbot-backend-452555374554.us-central1.run.app/api/v1/chat"
            response = requests.post(
                api_url,
                json=data,
                headers={
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
                timeout=120
            )
            try:
                response_data = response.json()
            except Exception:
                response_data = {"error": "Invalid JSON from backend", "raw": response.text[:500]}

            return JsonResponse(response_data, status=response.status_code, safe=False)

        except requests.exceptions.Timeout:
            logger.error("Chat proxy: backend timed out")
            return JsonResponse({"error": "The AI backend timed out. Please try again."}, status=504)
        except requests.exceptions.ConnectionError as e:
            logger.error(f"Chat proxy connection error: {e}")
            return JsonResponse({"error": "Could not reach the AI backend."}, status=503)
        except Exception as e:
            logger.error(f"Chat proxy unexpected error: {e}")
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Method not allowed"}, status=405)
