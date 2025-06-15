from typing import List, Optional
import requests
from bs4 import BeautifulSoup
import re

from server.common.logger import setup_logger
from server.models.professor import Professor
from server.repositories.domain_repository import DomainRepository
from server.repositories.professor_repository import ProfessorRepository
from server.repositories.professor_domains_repository import ProfessorDomainsRepository


class ProfessorsScrapper:
    """
    Clasa pentru extragerea si procesarea datelor profesorilor din paginile web.
    Gestioneaza parsarea paginilor cu informatii despre profesori si salvarea in baza de date.
    """
    logger = setup_logger(__name__)

    def __init__(self, session, urls):
        """
        Initializeaza obiectul ProfessorsScrapper cu sesiunea bazei de date si URL-urile.

        Argumente:
            session: Sesiunea SQLAlchemy pentru operatiuni cu baza de date
            urls: Lista URL-urilor de unde se extrag datele profesorilor
        """
        self.session = session
        self.professorRepository = ProfessorRepository(session)
        self.domainRepository = DomainRepository(session)
        self.professorDomainsRepository = ProfessorDomainsRepository(session)
        self.urls = urls

    def extract_domains(self, text_content: str) -> List[str]:
        """
        Extrage domeniile de interes din textul profesorului.

        Argumente:
            text_content: Continutul textual care contine domeniile

        Returneaza:
            Lista cu domeniile extrase
        """
        try:
            # Cautam pentru "Domenii de interes:" sau "Domenii:"
            domains_match = re.search(r'Domenii(?:\s+de\s+interes)?:\s*([^,\n]+(?:,\s*[^,\n]+)*)', text_content,
                                      re.IGNORECASE)

            if domains_match:
                domains_text = domains_match.group(1).strip()

                # Separăm domeniile după virgulă
                domains = [domain.strip() for domain in domains_text.split(',')]

                # Curățăm domeniile de caractere speciale și spații extra
                cleaned_domains = []
                for domain in domains:
                    cleaned_domain = re.sub(r'[^\w\s\-\'\.\(\)]', '', domain)
                    cleaned_domain = re.sub(r'\s+', ' ', cleaned_domain).strip()

                    if cleaned_domain and len(cleaned_domain) > 2:  # Verificăm că domeniul nu e prea scurt
                        cleaned_domains.append(cleaned_domain)

                self.logger.info(f"Domenii extrase: {cleaned_domains}")
                return cleaned_domains

            return []

        except Exception as e:
            self.logger.error(f"Eroare la extragerea domeniilor: {str(e)}")
            return []

    def save_professor_domains(self, professor_id, domains: List[str]):
        """
        Salvează domeniile pentru un profesor în baza de date.

        Argumente:
            professor_id: ID-ul profesorului
            domains: Lista cu domeniile de interes
        """
        try:
            for domain_name in domains:
                # Verificăm dacă domeniul există deja
                existing_domain = self.domainRepository.find_by_name(domain_name)

                if existing_domain:
                    domain_id = existing_domain.domain_id
                    self.logger.info(f"Domeniul '{domain_name}' există deja cu ID: {domain_id}")
                else:
                    # Adăugăm domeniul nou
                    new_domain = self.domainRepository.add_domain(domain_name)
                    domain_id = new_domain.domain_id
                    self.logger.info(f"Domeniul nou '{domain_name}' adăugat cu ID: {domain_id}")

                # Verificăm dacă asocierea profesor-domeniu există deja
                existing_association = self.professorDomainsRepository.find_by_professor_and_domain(
                    professor_id, domain_id
                )

                if not existing_association:
                    # Adăugăm asocierea profesor-domeniu
                    self.professorDomainsRepository.add(professor_id, domain_id)
                    self.logger.info(f"Asociere adăugată: profesor {professor_id} - domeniu {domain_id}")
                else:
                    self.logger.info(f"Asocierea profesor-domeniu există deja")

        except Exception as e:
            self.logger.error(f"Eroare la salvarea domeniilor profesorului: {str(e)}")

    def parse_professor_entry(self, entry_div) -> Optional[dict]:
        """
        Parseaza o singura intrare de profesor pentru a extrage informatiile.

        Argumente:
            entry_div: Elementul BeautifulSoup care contine informatiile profesorului

        Returneaza:
            Dict cu datele profesorului sau None daca parsarea esueaza
        """
        try:
            professor_data = {}

            inner_divs = entry_div.find_all("div", recursive=False)

            if len(inner_divs) < 2:
                self.logger.warning("Div-ul de intrare nu are structura asteptata (2 div-uri principale)")
                return None

            image_div = inner_divs[0]
            img = image_div.find("img")

            if img and img.get('src'):
                professor_data['image_url'] = img.get('src')
            else:
                professor_data['image_url'] = None
                self.logger.warning("Nu s-a gasit imagine in primul div")

            data_div = inner_divs[1]
            text_content = data_div.get_text()

            self.logger.info(f"Continut text pentru parsare: {repr(text_content[:200])}")

            name_data = self.extract_name(text_content)
            if name_data:
                professor_data['first_name'] = name_data.get('first_name')
                professor_data['last_name'] = name_data.get('last_name')
                professor_data['title'] = name_data.get('academic_title')
                self.logger.info(
                    f"Nume extras: prenume='{name_data.get('first_name')}', nume='{name_data.get('last_name')}', titlu='{name_data.get('academic_title')}'")
            else:
                self.logger.warning(f"Nu s-a putut extrage numele profesorului din intrare")
                return None

            details = self.extract_details(text_content)
            professor_data['details'] = details

            # Extragem domeniile de interes
            domains = self.extract_domains(text_content)
            professor_data['domains'] = domains

            if not professor_data['title']:
                if details and 'doctorand' in details.lower():
                    professor_data['title'] = 'Drd'
                else:
                    professor_data['title'] = '-'

            email_match = re.search(r'E-mail:\s*([a-zA-Z0-9._%+-]+(?:@|\[at\])[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})',
                                    text_content)
            if email_match:
                email = email_match.group(1)
                if '[at]' in email:
                    email = email.replace('[at]', '@')
                professor_data['email'] = email
            else:
                professor_data['email'] = None

            web_link = data_div.find("a", href=True)
            if web_link and web_link.get('href'):
                professor_data['web_page'] = web_link.get('href')
            else:
                professor_data['web_page'] = None

            self.logger.info(
                f"S-a procesat cu succes profesorul: {professor_data.get('first_name', '')} {professor_data.get('last_name', 'Necunoscut')}")
            return professor_data

        except Exception as e:
            self.logger.error(f"Eroare la procesarea intrarii profesorului: {str(e)}")
            return None

    def scrape_professors(self):
        """
        Extrage toti profesorii din toate URL-urile configurate.
        Proceseaza fiecare pagina si salveaza datele profesorilor in baza de date.
        """
        for url in self.urls:
            try:
                response = requests.get(url)
                response.encoding = 'utf-8'
                soup = BeautifulSoup(response.text, 'html.parser')

                content_div = soup.find("div", {"id": "content"})
                if not content_div:
                    self.logger.error("Nu s-a putut gasi div-ul content")
                    continue

                title_h2 = content_div.find("h2", {"class": "title"})
                department_name = title_h2.text.strip() if title_h2 else "Departament necunoscut"
                self.logger.info(f"Se extrag profesorii din: {department_name}")

                entry_container = content_div.find("div", {"class": "entry clearfix"})
                if not entry_container:
                    self.logger.error("Nu s-a putut gasi div-ul entry clearfix container")
                    continue

                entry_divs = entry_container.find_all("div", recursive=False)

                if len(entry_divs) <= 1:
                    self.logger.warning("Nu s-au gasit profesori sau doar intrarea header")
                    continue

                professors_processed = 0
                for entry_div in entry_divs[1:]:
                    professor_data = self.parse_professor_entry(entry_div)
                    if professor_data:
                        self.save_professor(professor_data, department_name)
                        professors_processed += 1

                self.logger.info(f"S-au procesat cu succes {professors_processed} profesori")

            except Exception as e:
                self.logger.error(f"Eroare la extragerea profesorilor: {str(e)}")

    def extract_name(self, text_content: str) -> Optional[dict]:
        """
        Extrage numele și titlul academic din textul profesorului.
        Titlul poate fi oricare combinație între Dr., Prof., Ing.
        Last name = cuvinte scrise complet cu majuscule
        First name = restul
        """
        try:
            line = text_content.strip().split('\n')[0]
            name_line = line.split(',')[0].strip()

            # Regex titluri: una sau mai multe din Dr., Prof., Ing.
            title_pattern = r'^((?:Dr\.|Prof\.|Ing\.)(?:\s+(?:Dr\.|Prof\.|Ing\.))*)\s+'
            title_match = re.match(title_pattern, name_line)

            academic_title = None
            if title_match:
                academic_title = title_match.group(1).strip()
                name_part = name_line[len(title_match.group(0)):].strip()
            else:
                name_part = name_line

            # === Dacă e un singur cuvânt lung și pare lipit ===
            if len(name_part.split()) == 1 and re.search(r'[A-Z][a-z]', name_part):
                # Ex: HOTEADiana-Lucia → HOTEA Diana-Lucia
                split_match = re.search(r'^([A-ZĂÂÎȘȚ]+)([A-Z][a-zăâîșț].*)$', name_part)
                if split_match:
                    name_part = f"{split_match.group(1)} {split_match.group(2)}"

            # Separăm în cuvinte după corecție
            name_parts = name_part.split()

            if len(name_parts) < 2:
                return None

            # Separăm last_name ca toate majusculele
            last_name_parts = [p for p in name_parts if p.isupper()]
            first_name_parts = [p for p in name_parts if not p.isupper()]

            if not last_name_parts or not first_name_parts:
                return None

            last_name = ' '.join(last_name_parts)
            first_name = ' '.join(first_name_parts)

            self.logger.info(
                f"Rezultat final parsare: nume='{last_name}', prenume='{first_name}', titlu='{academic_title}'"
            )

            return {
                'last_name': last_name[:100],
                'first_name': first_name[:100],
                'academic_title': academic_title
            }

        except Exception as e:
            self.logger.error(f"Eroare în extract_name(): {str(e)}")
            return None

    def extract_details(self, text_content: str) -> Optional[str]:
        """
        Extrage detaliile (tot ce urmeaza dupa virgula) din continutul textual.

        Argumente:
            text_content: Continutul textual care contine detaliile

        Returneaza:
            String cu detaliile extrase sau None daca nu gaseste
        """
        comma_match = re.search(r'[^,]+,\s*(.+)', text_content.strip())
        if comma_match:
            return comma_match.group(1).strip()
        return None

    def save_professor(self, professor_data: dict, department_name: str):
        """
        Salveaza datele profesorului in repository.
        Verifica daca profesorul exista deja si actualizeaza sau adauga nou.

        Argumente:
            professor_data: Dict cu informatiile profesorului
            department_name: Numele departamentului
        """
        try:
            first_name = professor_data.get('first_name', '')[:100] if professor_data.get('first_name') else None
            last_name = professor_data.get('last_name', '')[:100] if professor_data.get('last_name') else None
            title = professor_data.get('title', '')[:100] if professor_data.get('title') else None
            email = professor_data.get('email', '')[:255] if professor_data.get('email') else None
            web_page = professor_data.get('web_page', '')[:255] if professor_data.get('web_page') else None
            details = professor_data.get('details', '')[:500] if professor_data.get('details') else None
            image_url = professor_data.get('image_url', '')[:255] if professor_data.get('image_url') else None
            department = department_name[:255] if department_name else None
            domains = professor_data.get('domains', [])

            if not first_name or not last_name:
                if not first_name and last_name and email:
                    email_name = email.split('@')[0].split('.')[0] if '@' in email else None
                    if email_name:
                        first_name = email_name.capitalize()
                        self.logger.info(f"Folosit rezerva din email pentru prenume: {first_name}")

                if not first_name or not last_name:
                    self.logger.warning(
                        f"Nume incomplet pentru profesor: prenume='{first_name}', nume='{last_name}' - se omite")
                    return

            self.logger.info(f"Salvare profesor: {first_name} {last_name}, titlu={title}")

            existing_professor = None

            if email:
                existing_professor = self.professorRepository.get_professor_by_email(email)

            if not existing_professor and first_name and last_name:
                existing_professor = self.professorRepository.get_professor_by_name(first_name, last_name)

            if existing_professor:
                self.logger.info(
                    f"Profesorul {first_name} {last_name} exista deja in baza de date")
                self.update_professor(existing_professor, {
                    'first_name': first_name,
                    'last_name': last_name,
                    'title': title,
                    'email': email,
                    'web_page': web_page,
                    'image_url': image_url,
                    'details': details
                }, department)

                if domains:
                    self.save_professor_domains(existing_professor.professor_id, domains)

            else:
                added_professor = self.professorRepository.add_professor(
                    first_name=first_name,
                    last_name=last_name,
                    title=title,
                    email=email,
                    web_page=web_page,
                    image_url=image_url,
                    department=department,
                    details=details
                )

                self.logger.info(f"S-a adaugat profesorul nou: {first_name} {last_name}")

                if domains and added_professor:
                    self.save_professor_domains(added_professor.professor_id, domains)

        except Exception as e:
            self.logger.error(
                f"Eroare la salvarea profesorului {professor_data.get('first_name', '')} {professor_data.get('last_name', 'Necunoscut')}: {str(e)}")

    def update_professor(self, existing_professor: Professor, new_data: dict, department_name: str):
        """
        Actualizeaza profesorul existent cu date noi.

        Argumente:
            existing_professor: Obiectul Professor existent
            new_data: Dict cu datele noi ale profesorului
            department_name: Numele departamentului
        """
        try:
            updated_professor = Professor(
                first_name=new_data.get('first_name'),
                last_name=new_data.get('last_name'),
                title=new_data.get('title'),
                email=new_data.get('email'),
                web_page=new_data.get('web_page'),
                department=department_name,
                image_url=new_data.get('image_url'),
                details=new_data.get('details')
            )

            self.professorRepository.update_professor(existing_professor.professor_id, updated_professor)

            self.logger.info(f"S-a actualizat profesorul: {updated_professor.first_name} {updated_professor.last_name}")

        except Exception as e:
            self.logger.error(
                f"Eroare la actualizarea profesorului {existing_professor.first_name} {existing_professor.last_name}: {str(e)}")