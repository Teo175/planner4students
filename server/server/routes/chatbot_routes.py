from flask import Blueprint, request
from dotenv import load_dotenv
import os
import requests
import json

from server.utils.handle_response import handle_response
from server.common.logger import setup_logger
from server.common.common_constants import HTTP_OK_CODE, HTTP_ERROR_CODE
from server.services.professor_service import ProfessorService

chatbot_bp = Blueprint('chatbot', __name__)
logger = setup_logger(__name__)
load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_API_URL = os.getenv("OPENAI_API_URL")
OPENAI_MODEL = os.getenv("OPENAI_MODEL")

def register_routes_chatbot(app, Session):
    logger.info("Inregistrare rute pentru chatbot")

    @chatbot_bp.route('/chat', methods=['POST'])
    def chat_with_bot():
        session = Session()
        try:
            data = request.get_json()
            user_message = data.get("message", "").strip()

            if not user_message:
                return handle_response(message="Mesajul este gol", status_code=HTTP_ERROR_CODE)

            professor_service = ProfessorService(session)
            professors = professor_service.get_all_professors()

            formatted_professors = []
            for p in professors:
                prof = professor_service.serialize_professor(p)
                subjects = professor_service.get_professor_subjects(p.professor_id)
                domains = ', '.join(prof.get('domains', [])) or 'N/A'
                subjects_str = ', '.join(subjects) or 'N/A'
                name = f"{prof['first_name']} {prof['last_name']}"
                line = f"{name} | {domains} | {subjects_str}"
                formatted_professors.append(line)

            professors_text = "\n".join(formatted_professors)

            prompt = f"""
Esti un asistent care ajuta studentii sa isi aleaga coordonatorul pentru lucrarea de licenta.Cand primesti lista de profesori si mesajul studentului raspunde **exclusiv** cu 2-3 nume de profesori recomandati si o justificare foarte scurta (1 propozitie).
Lista profesorilor este in formatul: Nume | Domenii | Materii.

Profesori disponibili:
{professors_text}

Mesajul studentului:
"{user_message}"

"""

            headers = {
                "Authorization": f"Bearer {OPENAI_API_KEY}",
                "Content-Type": "application/json"
            }

            payload = {
                "model": OPENAI_MODEL,
                "messages": [
                    {"role": "system", "content": "Esti un asistent academic."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.7
            }

            response = requests.post(OPENAI_API_URL, headers=headers, json=payload)
            response.raise_for_status()
            reply = response.json()["choices"][0]["message"]["content"].strip()

            return handle_response(
                message="Raspuns generat cu succes",
                data={"reply": reply},
                status_code=HTTP_OK_CODE
            )

        except Exception as e:
            logger.error(f"Eroare OpenAI Chatbot: {str(e)}")
            return handle_response(
                message=f"Eroare la generarea raspunsului: {str(e)}",
                status_code=HTTP_ERROR_CODE
            )
        finally:
            session.close()

    app.register_blueprint(chatbot_bp)
