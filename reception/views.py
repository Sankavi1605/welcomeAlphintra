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
    profile_data = {
        "image": "https://pub-04643188b78b434d8c44735a34b1fe23.r2.dev/me.jpg",
        "name": "Sankavi",
        "title": "Frontend developer and Secretary of Alphintra",
        "description": "Specializing in full-stack architecture, generative AI workflows, and deeply immersive digital experiences. Building scalable SaaS platforms and interactive 3D web environments to architect the future of the web together.",
        "skills": ["React & Next.js", "Python & Django", "Generative AI", "3D WebGL", "Cloud Architecture"]
    }
    return render(request, "reception/welcome.html", {"show_profile": True, "profile": profile_data})

def rajendran_page(request):
    profile_data = {
        "image": "https://pub-04643188b78b434d8c44735a34b1fe23.r2.dev/WhatsApp%20Image%202026-07-21%20at%2012.19.27.jpeg",
        "name": "Rajendran Vasanthakumar",
        "title": "Co-Founder and Director",
        "description": "Rajendran Vasanthakumar is the Co-Founder and Director of ALPHINTRA, bringing a distinctive leadership perspective shaped by his background in aviation—an industry where precision, discipline, security, and reliability are fundamental.<br><br>Driven by a strong entrepreneurial mindset, his vision is to make enterprise-grade AI and automation solutions accessible, practical, and impactful for businesses of all sizes. He is committed to positioning ALPHINTRA as a globally recognized AI engineering company built on the principles of quality, security, and innovation.",
        "skills": ["Years of Experience: 4+ years", "Education: BBA (hons)", "Bsc.AVI (hons)", "LLB (hons)", "Msc IR (hons)", "MBA (R)"]
    }
    return render(request, "reception/welcome.html", {"show_profile": True, "profile": profile_data})

def custom_404(request, exception):
    return render(request, "reception/404.html", status=404)

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
