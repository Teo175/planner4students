import requests
import pandas as pd
from bs4 import BeautifulSoup
from server.common.logger import setup_logger
from server.repositories.room_repository import RoomRepository


class RoomScrapper:
    """
    Clasa pentru extragerea si procesarea datelor despre sali din paginile web si fisiere Excel.
    Gestioneaza parsarea tabelelor cu sali si actualizarea link-urilor Google Maps.
    """
    logger = setup_logger(__name__)

    def __init__(self, session):
        """
        Initializeaza obiectul RoomScrapper cu sesiunea bazei de date.

        Argumente:
            session: Sesiunea SQLAlchemy pentru operatiuni cu baza de date
        """
        self.session = session
        self.roomRepository = RoomRepository(session)
        self.url = "https://www.cs.ubbcluj.ro/files/orar/2024-2/sali/legenda.html"
        self.excel_file = "C://Users//peter//Desktop//planner4students//server//server//docs//RoomsMaps.xlsx"

    def scrape_rooms(self):
        """
        Extrage salile din tabelul HTML si le adauga in baza de date.
        Proceseaza pagina web cu informatii despre sali si localizarile acestora.
        """
        try:
            self.logger.info(f"Se incepe extragerea salilor din: {self.url}")

            response = requests.get(self.url, timeout=30)
            response.raise_for_status()
            response.encoding = 'utf-8'

            self.logger.info("Continutul HTML a fost obtinut cu succes")

            soup = BeautifulSoup(response.content, 'html.parser')

            table = soup.find('table')
            if not table:
                self.logger.error("Nu s-a gasit niciun tabel in continutul HTML")
                return

            rows = table.find_all('tr')
            if len(rows) < 2:
                self.logger.error("Tabelul gasit dar nu sunt disponibile randuri de date")
                return

            data_rows = rows[1:]
            self.logger.info(f"S-au gasit {len(data_rows)} intrari de sali de procesat")

            rooms_added = 0
            rooms_updated = 0

            for i, row in enumerate(data_rows, 1):
                try:
                    cells = row.find_all(['td', 'th'])

                    if len(cells) < 2:
                        self.logger.warning(f"Randul {i}: Nu s-au gasit suficiente coloane, se omite")
                        continue

                    room_name = cells[0].get_text(strip=True)
                    room_location = cells[1].get_text(strip=True)

                    if not room_name or not room_location:
                        self.logger.warning(f"Randul {i}: Nume sala sau localizare goale, se omite")
                        continue

                    existing_room = self.roomRepository.get_room_by_name(room_name)
                    if existing_room:
                        if existing_room.location != room_location:
                            self.roomRepository.update_location_by_id(existing_room.room_id, room_location)
                            self.logger.info(
                                f"Actualizata localizarea salii '{room_name}' din '{existing_room.location}' in '{room_location}'")
                            rooms_updated += 1
                        else:
                            self.logger.debug(
                                f"Sala '{room_name}' are deja localizarea corecta, nu este necesara actualizarea")
                    else:
                        self.roomRepository.add_room(room_name, room_location)
                        self.logger.info(f"Adaugata sala: '{room_name}' la '{room_location}'")
                        rooms_added += 1

                except Exception as row_error:
                    self.logger.error(f"Eroare la procesarea randului {i}: {str(row_error)}")
                    continue

            self.logger.info(f"Extragerea salilor s-a finalizat cu succes!")
            self.logger.info(f"Sumar: {rooms_added} sali adaugate, {rooms_updated} sali actualizate")

        except requests.RequestException as e:
            self.logger.error(f"Esec la obtinerea continutului din URL: {str(e)}")
            raise

        except Exception as e:
            self.logger.error(f"Eroare neasteptata in timpul extragerii salilor: {str(e)}")
            raise

    def update_google_maps_urls_from_excel(self):
        """
        Actualizeaza URL-urile Google Maps pentru sali din fisierul Excel.
        Formatul asteptat: Coloana A = nume_sala, Coloana B = url_google_maps
        """
        try:
            self.logger.info(f"Se incepe actualizarea URL-urilor Google Maps din Excel: {self.excel_file}")

            rooms_updated = 0
            rooms_not_found = 0
            total_processed = 0

            df = pd.read_excel(self.excel_file, header=None)

            self.logger.info(f"S-au gasit {len(df)} randuri in fisierul Excel")

            for row_num, row in df.iterrows():
                try:
                    total_processed += 1

                    if len(row) < 2:
                        self.logger.warning(f"Randul Excel {row_num + 1}: Nu sunt suficiente coloane, se omite")
                        continue

                    name = str(row.iloc[0]).strip() if pd.notna(row.iloc[0]) else ""
                    google_maps_url = str(row.iloc[1]).strip() if pd.notna(row.iloc[1]) else ""

                    if not name or not google_maps_url or name == 'nan' or google_maps_url == 'nan':
                        self.logger.warning(f"Randul Excel {row_num + 1}: Nume sala sau URL gol, se omite")
                        continue

                    room = self.roomRepository.get_room_by_name(name)

                    if room:
                        self.roomRepository.update_google_maps_url(room.room_id, google_maps_url)
                        self.logger.info(f"Actualizat URL Google Maps pentru sala '{name}'")
                        rooms_updated += 1
                    else:
                        self.logger.warning(f"Sala '{name}' nu a fost gasita in baza de date")
                        rooms_not_found += 1

                except Exception as row_error:
                    self.logger.error(f"Eroare la procesarea randului Excel {row_num + 1}: {str(row_error)}")
                    continue

            self.logger.info(f"Actualizarea URL-urilor Google Maps s-a finalizat cu succes!")
            self.logger.info(
                f"Sumar: {rooms_updated} sali actualizate, {rooms_not_found} sali negasite, {total_processed} total procesate")

        except FileNotFoundError:
            self.logger.error(f"Fisierul Excel nu a fost gasit: {self.excel_file}")
            raise

        except Exception as e:
            self.logger.error(f"Eroare neasteptata in timpul procesarii Excel: {str(e)}")
            raise

    def scrape_and_update_complete(self):
        """
        Workflow complet: extrage salile si actualizeaza URL-urile Google Maps din Excel.
        Executa ambele operatiuni in ordine pentru o procesare completa a datelor.
        """
        try:
            self.scrape_rooms()

            self.logger.info("Se continua cu actualizarea URL-urilor Google Maps din Excel...")
            self.update_google_maps_urls_from_excel()
            self.logger.info("Actualizarea salilor s-a realizat cu succes!")

        except Exception as e:
            self.logger.error(f"Eroare in workflow-ul complet: {str(e)}")
            raise