from datetime import datetime
import re
from server.common.logger import setup_logger
import requests
from bs4 import BeautifulSoup

from server.models.academic_holiday import AcademicHoliday
from server.models.academic_schedule import AcademicSchedule
from server.repositories.academic_holiday_repository import AcademicHolidayRepository
from server.repositories.academic_schedule_repository import AcademicScheduleRepository


class StructureOfScheduleScrapper:
    logger = setup_logger(__name__)

    def __init__(self, session):
        # Initialize repositories with session
        self.session = session
        self.academic_schedule_repository = AcademicScheduleRepository(session)
        self.academic_holiday_repository = AcademicHolidayRepository(session)
        self.url = "https://www.cs.ubbcluj.ro/invatamant/structura-anului-universitar/"

    def scrape_schedule(self):
        response = requests.get(self.url)
        response.encoding = 'utf-8'
        soup = BeautifulSoup(response.text, 'html.parser')


        tables = soup.find_all("table")
        if len(tables) < 3:
            self.logger.error("Au fost găsite mai puțin de 3 tabele! Structura paginii s-a schimbat?")
            return

        self.logger.info("Încep extragerea din cele 3 tabele...")

        self.scrape_table(tables[0], target="all",semester=1)
        self.scrape_table(tables[1], target="neterminal",semester=2)
        self.scrape_table(tables[2], target="terminal",semester=2)

        self.logger.info("Datele au fost salvate cu succes în baza de date!")

    def scrape_table(self, table, target,semester):
        rows = table.find_all("tr")[0:]
        for row in rows:
            cols = row.find_all("td")

            if len(cols) < 2:
                continue

            date_range = cols[0].get_text(strip=True)
            period_type = cols[1].get_text(strip=True).lower()
            notes = cols[2].get_text(strip=True) if len(cols) > 2 else None

            start_date, end_date = self.extract_dates(date_range)

            if not start_date or not end_date:
                self.logger.warning(f"Nu s-au putut extrage date valide din: {date_range}")
                continue

            if "activitate didactică" in period_type:
                existing_schedule = self.academic_schedule_repository.get_schedule(
                    start_date=start_date,
                    end_date=end_date,
                    period_type=period_type,
                    target=target,
                    semester=semester
                )

                if existing_schedule:
                    self.logger.info(f"Perioada deja există: {start_date} - {end_date} [{period_type}] pentru {target}")
                else:
                    schedule = AcademicSchedule(
                        start_date=start_date,
                        end_date=end_date,
                        period_type=period_type,
                        target=target,
                        semester=semester
                    )
                    self.academic_schedule_repository.add_schedule(schedule)
                    self.logger.info(f"Adăugat AcademicSchedule: {start_date} - {end_date} [{period_type}] pentru {target}")

            if notes:
                self.extract_holidays(notes)


    def extract_dates(self, date_range):
        try:
            parts = date_range.replace('–', '-').split('-')
            start = self.parse_date(parts[0].strip())
            end = self.parse_date(parts[1].strip())
            return start, end
        except Exception as e:
            self.logger.error(f"Eroare la parsare data: {date_range} -> {e}")
            return None, None

    def parse_date(self, text):
        for fmt in ("%d.%m.%Y", "%d.%m.%y"):
            try:
                return datetime.strptime(text, fmt).date()
            except ValueError:
                continue
        raise ValueError(f"Format necunoscut pentru data: {text}")

    import re
    from datetime import datetime

    import re
    from datetime import datetime

    import re
    from datetime import datetime

    def extract_holidays(self, text):
        # Verifică mai întâi dacă avem formatul cu "zile libere" (plural)
        if "– zile libere)" in text or "- zile libere)" in text:
            return self._extract_multiple_holidays(text)

        # Găsește toate datele din text (ex: 06.01.2025)
        date_matches = list(re.finditer(r'\d{2}\.\d{2}\.\d{4}', text))

        if not date_matches:
            self.logger.warning(f"Nicio dată găsită în textul: {text}")
            return

        # Cazul 1: Dacă există doar o singură dată în text
        if len(date_matches) == 1:
            date_str = date_matches[0].group()
            try:
                holiday_date = datetime.strptime(date_str, "%d.%m.%Y").date()

                # Identifică numele sărbătorii în diferite formate posibile
                holiday_name = ""

                # Formatul: "vineri, 24.01.2025, Ziua Unirii Principatelor Române – zi liberă"
                if "– zi liberă" in text or "- zi liberă" in text:
                    # Extrage textul între data și "– zi liberă" sau "- zi liberă"
                    separator = "– zi liberă" if "– zi liberă" in text else "- zi liberă"
                    parts = text.split(date_str)[1].split(separator)[0].strip()

                    # Elimină virgula de la începutul textului și spațiile în plus
                    if parts.startswith(","):
                        parts = parts[1:].strip()

                    # Extrage numele sărbătorii (după ultima virgulă dacă există mai multe)
                    if "," in parts:
                        holiday_name = parts.split(",")[-1].strip()
                    else:
                        holiday_name = parts.strip()
                else:
                    # Formatul clasic pentru alte cazuri
                    start = date_matches[0].end()
                    name_chunk = text[start:].strip()

                    if "," in name_chunk:
                        holiday_name_parts = name_chunk.split(',')[1:]
                        holiday_name = ' '.join(holiday_name_parts).strip()

                if holiday_name:
                    # Verificăm dacă sărbătoarea există deja în baza de date
                    existing = self.academic_holiday_repository.get_holiday_by_date_and_name(
                        holiday_date=holiday_date,
                        name=holiday_name
                    )

                    if existing:
                        self.logger.info(f"AcademicHoliday deja există: {holiday_date} ({holiday_name}) — NU adaug.")
                    else:
                        holiday = AcademicHoliday(
                            holiday_date=holiday_date,
                            name=holiday_name
                        )
                        self.academic_holiday_repository.add_holiday(holiday)
                        self.logger.info(f"Adăugat AcademicHoliday: {holiday_date} ({holiday_name})")

                else:
                    self.logger.warning(f"Numele sărbătorii este gol pentru data {holiday_date} în textul: {text}")

            except Exception as e:
                self.logger.error(f"Eroare la parsare zi liberă '{date_str}' din textul: {text} -> {e}")

        # Cazul 2: Dacă există mai multe date în text
        else:
            for idx, match in enumerate(date_matches):
                date_str = match.group()
                try:
                    holiday_date = datetime.strptime(date_str, "%d.%m.%Y").date()

                    # Preia textul de după dată până la următoarea dată sau sfârșitul textului
                    start = match.end()
                    end = len(text)

                    if idx + 1 < len(date_matches):
                        end = date_matches[idx + 1].start()

                    name_chunk = text[start:end].strip()
                    holiday_name = ""

                    # Verifică formatul cu "– zi liberă" sau "- zi liberă"
                    if "– zi liberă" in name_chunk or "- zi liberă" in name_chunk:
                        separator = "– zi liberă" if "– zi liberă" in name_chunk else "- zi liberă"
                        name_chunk = name_chunk.split(separator)[0].strip()

                        # Elimină virgula de la începutul textului
                        if name_chunk.startswith(","):
                            name_chunk = name_chunk[1:].strip()

                        # Extrage numele după ultima virgulă dacă există
                        if "," in name_chunk:
                            holiday_name = name_chunk.split(",")[-1].strip()
                        else:
                            holiday_name = name_chunk.strip()
                    else:
                        # Preia textul de la virgulă
                        if "," in name_chunk:
                            name_chunks = name_chunk.split(',')
                            if len(name_chunks) > 1:
                                holiday_name = name_chunks[1].strip()
                            else:
                                holiday_name = name_chunks[0].strip()

                        # Curăță posibile conjuncții (și, or, etc.) de la sfârșitul numelui
                        connectors = ["și ", "si ", "iar ", "or "]
                        for connector in connectors:
                            if holiday_name.endswith(connector):
                                holiday_name = holiday_name[:-len(connector)].strip()

                    if holiday_name:
                        # Verificăm dacă sărbătoarea există deja în baza de date
                        existing = self.academic_holiday_repository.get_holiday_by_date_and_name(
                            holiday_date=holiday_date,
                            name=holiday_name
                        )

                        if existing:
                            self.logger.info(
                                f"AcademicHoliday deja există: {holiday_date} ({holiday_name}) — NU adaug.")
                        else:
                            holiday = AcademicHoliday(
                                holiday_date=holiday_date,
                                name=holiday_name
                            )
                            self.academic_holiday_repository.add_holiday(holiday)
                            self.logger.info(f"Adăugat AcademicHoliday: {holiday_date} ({holiday_name})")

                    else:
                        self.logger.warning(f"Numele sărbătorii este gol pentru data {holiday_date} în textul: {text}")

                except Exception as e:
                    self.logger.error(f"Eroare la parsare zi liberă '{date_str}' din textul: {text} -> {e}")

    def extract_holidays(self, text):
        # Verifică mai întâi dacă avem formatul cu "zile libere" (plural)
        if "– zile libere)" in text or "- zile libere)" in text:
            return self._extract_multiple_holidays(text)

        # Găsește toate datele din text (ex: 06.01.2025)
        date_matches = list(re.finditer(r'\d{2}\.\d{2}\.\d{4}', text))

        if not date_matches:
            self.logger.warning(f"Nicio dată găsită în textul: {text}")
            return

        # Cazul 1: Dacă există doar o singură dată în text
        if len(date_matches) == 1:
            date_str = date_matches[0].group()
            try:
                holiday_date = datetime.strptime(date_str, "%d.%m.%Y").date()

                # Identifică numele sărbătorii în diferite formate posibile
                holiday_name = ""

                # Formatul: "vineri, 24.01.2025, Ziua Unirii Principatelor Române – zi liberă"
                if "– zi liberă" in text or "- zi liberă" in text:
                    # Extrage textul între data și "– zi liberă" sau "- zi liberă"
                    separator = "– zi liberă" if "– zi liberă" in text else "- zi liberă"
                    parts = text.split(date_str)[1].split(separator)[0].strip()

                    # Elimină virgula de la începutul textului și spațiile în plus
                    if parts.startswith(","):
                        parts = parts[1:].strip()

                    # Extrage numele sărbătorii (după ultima virgulă dacă există mai multe)
                    if "," in parts:
                        holiday_name = parts.split(",")[-1].strip()
                    else:
                        holiday_name = parts.strip()
                else:
                    # Formatul clasic pentru alte cazuri
                    start = date_matches[0].end()
                    name_chunk = text[start:].strip()

                    if "," in name_chunk:
                        holiday_name_parts = name_chunk.split(',')[1:]
                        holiday_name = ' '.join(holiday_name_parts).strip()

                if holiday_name:
                    # Verificăm dacă sărbătoarea există deja în baza de date
                    existing = self.academic_holiday_repository.get_holiday_by_date_and_name(
                        holiday_date=holiday_date,
                        name=holiday_name
                    )

                    if existing:
                        self.logger.info(f"AcademicHoliday deja există: {holiday_date} ({holiday_name}) — NU adaug.")
                    else:
                        holiday = AcademicHoliday(
                            holiday_date=holiday_date,
                            name=holiday_name
                        )
                        self.academic_holiday_repository.add_holiday(holiday)
                        self.logger.info(f"Adăugat AcademicHoliday: {holiday_date} ({holiday_name})")

                else:
                    self.logger.warning(f"Numele sărbătorii este gol pentru data {holiday_date} în textul: {text}")

            except Exception as e:
                self.logger.error(f"Eroare la parsare zi liberă '{date_str}' din textul: {text} -> {e}")

        # Cazul 2: Dacă există mai multe date în text
        else:
            for idx, match in enumerate(date_matches):
                date_str = match.group()
                try:
                    holiday_date = datetime.strptime(date_str, "%d.%m.%Y").date()

                    # Preia textul de după dată până la următoarea dată sau sfârșitul textului
                    start = match.end()
                    end = len(text)

                    if idx + 1 < len(date_matches):
                        end = date_matches[idx + 1].start()

                    name_chunk = text[start:end].strip()
                    holiday_name = ""

                    # Verifică formatul cu "– zi liberă" sau "- zi liberă"
                    if "– zi liberă" in name_chunk or "- zi liberă" in name_chunk:
                        separator = "– zi liberă" if "– zi liberă" in name_chunk else "- zi liberă"
                        name_chunk = name_chunk.split(separator)[0].strip()

                        # Elimină virgula de la începutul textului
                        if name_chunk.startswith(","):
                            name_chunk = name_chunk[1:].strip()

                        # Extrage numele după ultima virgulă dacă există
                        if "," in name_chunk:
                            holiday_name = name_chunk.split(",")[-1].strip()
                        else:
                            holiday_name = name_chunk.strip()
                    else:
                        # Preia textul de la virgulă
                        if "," in name_chunk:
                            name_chunks = name_chunk.split(',')
                            if len(name_chunks) > 1:
                                holiday_name = name_chunks[1].strip()
                            else:
                                holiday_name = name_chunks[0].strip()

                        # Curăță posibile conjuncții (și, or, etc.) de la sfârșitul numelui
                        connectors = ["și ", "si ", "iar ", "or "]
                        for connector in connectors:
                            if holiday_name.endswith(connector):
                                holiday_name = holiday_name[:-len(connector)].strip()

                    if holiday_name:
                        # Verificăm dacă sărbătoarea există deja în baza de date
                        existing = self.academic_holiday_repository.get_holiday_by_date_and_name(
                            holiday_date=holiday_date,
                            name=holiday_name
                        )

                        if existing:
                            self.logger.info(
                                f"AcademicHoliday deja există: {holiday_date} ({holiday_name}) — NU adaug.")
                        else:
                            holiday = AcademicHoliday(
                                holiday_date=holiday_date,
                                name=holiday_name
                            )
                            self.academic_holiday_repository.add_holiday(holiday)
                            self.logger.info(f"Adăugat AcademicHoliday: {holiday_date} ({holiday_name})")

                    else:
                        self.logger.warning(f"Numele sărbătorii este gol pentru data {holiday_date} în textul: {text}")

                except Exception as e:
                    self.logger.error(f"Eroare la parsare zi liberă '{date_str}' din textul: {text} -> {e}")

    def _extract_multiple_holidays(self, text):
        """
        Extrage mai multe sărbători din texte de forma:
        "2 săptămâni (luni, 06.01.2025, Boboteaza și marți, 07.01.2025, Sfântul Ioan Botezătorul – zile libere)"
        """
        # În loc să ne bazăm pe segmentare complexă, vom folosi o abordare directă
        # Extrage toate datele din text
        date_matches = list(re.finditer(r'\d{2}\.\d{2}\.\d{4}', text))

        if len(date_matches) < 1:
            self.logger.warning(f"Nicio dată găsită în textul: {text}")
            return

        # Pentru primul model: "2 săptămâni (luni, 06.01.2025, Boboteaza și marți, 07.01.2025, Sfântul Ioan Botezătorul – zile libere)"
        # Vom folosi o mapare specială pentru numele sărbătorilor

        # Cazul specific pentru formatul din exemplu
        if len(date_matches) == 2 and ("– zile libere)" in text or "- zile libere)" in text):
            # Dacă avem exact 2 date și formatul "zile libere", folosim maparea specială
            # Verificăm dacă textul seamănă cu exemplul

            # Împărțim textul în părți între date și după ultima dată
            parts = []

            # Din începutul textului până la prima dată
            parts.append(text[:date_matches[0].start()])

            # De la prima dată la a doua dată
            parts.append(text[date_matches[0].end():date_matches[1].start()])

            # De la a doua dată până la final
            parts.append(text[date_matches[1].end():])

            # Definim un set de conectori pentru a identifica unde se termină primul nume
            connectors = ["și ", "si ", "iar ", "or "]

            # Extrage primul nume de sărbătoare (după prima dată)
            first_part = parts[1].strip()
            if first_part.startswith(","):
                first_part = first_part[1:].strip()

            # Verificăm dacă în primul segment există conectori
            first_holiday_name = None
            for connector in connectors:
                if connector in first_part:
                    first_holiday_name = first_part.split(connector)[0].strip()
                    break

            # Dacă nu am găsit conector, verificăm dacă există virgule
            if first_holiday_name is None:
                if "," in first_part:
                    first_holiday_name = first_part.split(",")[0].strip()
                else:
                    first_holiday_name = first_part.strip()

            # Extrage al doilea nume de sărbătoare (după a doua dată)
            second_part = parts[2].strip()
            if second_part.startswith(","):
                second_part = second_part[1:].strip()

            # Curăță al doilea nume până la "- zile libere" sau "– zile libere"
            terminator = "– zile libere" if "– zile libere" in second_part else "- zile libere"
            if terminator in second_part:
                second_holiday_name = second_part.split(terminator)[0].strip()
            else:
                second_holiday_name = second_part.strip()

            # Acum avem cele două nume de sărbători și cele două date
            holidays_data = [
                (date_matches[0].group(), first_holiday_name),
                (date_matches[1].group(), second_holiday_name)
            ]

            # Adaugă fiecare sărbătoare în baza de date
            for date_str, name in holidays_data:
                try:
                    holiday_date = datetime.strptime(date_str, "%d.%m.%Y").date()

                    # Verifică și adaugă sărbătoarea
                    existing = self.academic_holiday_repository.get_holiday_by_date_and_name(
                        holiday_date=holiday_date,
                        name=name
                    )

                    if existing:
                        self.logger.info(f"AcademicHoliday deja există: {holiday_date} ({name}) — NU adaug.")
                    else:
                        holiday = AcademicHoliday(
                            holiday_date=holiday_date,
                            name=name
                        )
                        self.academic_holiday_repository.add_holiday(holiday)
                        self.logger.info(f"Adăugat AcademicHoliday: {holiday_date} ({name})")

                except Exception as e:
                    self.logger.error(f"Eroare la procesarea sărbătorii '{name}' pentru data {date_str}: {e}")

        else:
            # Dacă nu avem formatul exact din exemplu, procesăm fiecare dată individual
            for idx, match in enumerate(date_matches):
                date_str = match.group()
                try:
                    holiday_date = datetime.strptime(date_str, "%d.%m.%Y").date()

                    # Extrage textul până la următoarea dată sau până la final
                    start_pos = match.end()
                    end_pos = date_matches[idx + 1].start() if idx + 1 < len(date_matches) else len(text)

                    # Extras numele sărbătorii
                    name_chunk = text[start_pos:end_pos].strip()

                    # Curăță numele
                    if name_chunk.startswith(","):
                        name_chunk = name_chunk[1:].strip()

                    # Extrage numele între prima virgulă și următorul conector
                    if "," in name_chunk:
                        parts = name_chunk.split(",")
                        holiday_name = parts[0].strip()
                    else:
                        holiday_name = name_chunk.strip()

                    # Curăță de conectori la sfârșit
                    connectors = ["și ", "si ", "iar ", "or "]
                    for conn in connectors:
                        if holiday_name.endswith(conn):
                            holiday_name = holiday_name[:-len(conn)].strip()

                    # Oprim extragerea la "zi liberă" sau "zile libere"
                    terminators = ["- zi liberă", "– zi liberă", "- zile libere", "– zile libere"]
                    for term in terminators:
                        if term in holiday_name:
                            holiday_name = holiday_name.split(term)[0].strip()

                    if not holiday_name:
                        self.logger.warning(f"Numele sărbătorii este gol pentru data {holiday_date}")
                        continue

                    # Verifică și adaugă sărbătoarea
                    existing = self.academic_holiday_repository.get_holiday_by_date_and_name(
                        holiday_date=holiday_date,
                        name=holiday_name
                    )

                    if existing:
                        self.logger.info(f"AcademicHoliday deja există: {holiday_date} ({holiday_name}) — NU adaug.")
                    else:
                        holiday = AcademicHoliday(
                            holiday_date=holiday_date,
                            name=holiday_name
                        )
                        self.academic_holiday_repository.add_holiday(holiday)
                        self.logger.info(f"Adăugat AcademicHoliday: {holiday_date} ({holiday_name})")

                except Exception as e:
                    self.logger.error(f"Eroare la procesarea datei '{date_str}' din textul: {text} -> {e}")