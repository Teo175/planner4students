import requests
import pandas as pd
from bs4 import BeautifulSoup
from server.common.logger import setup_logger
from server.repositories.room_repository import RoomRepository


class RoomScrapper:
    logger = setup_logger(__name__)

    def __init__(self, session):
        # Initialize repositories with session
        self.session = session
        self.roomRepository = RoomRepository(session)
        self.url = "https://www.cs.ubbcluj.ro/files/orar/2024-2/sali/legenda.html"
        self.excel_file = "C://Users//peter//Desktop//planner4students//server//server//docs//RoomsMaps.xlsx"

    def scrape_rooms(self):
        """
        Scrape rooms from the HTML table and add them to the database
        """
        try:
            self.logger.info(f"Starting room scraping from: {self.url}")

            # Fetch the HTML content
            response = requests.get(self.url, timeout=30)
            response.raise_for_status()
            response.encoding = 'utf-8'  # Ensure proper encoding for Romanian characters

            self.logger.info("Successfully fetched HTML content")

            # Parse HTML with BeautifulSoup
            soup = BeautifulSoup(response.content, 'html.parser')

            # Find the table - looking for table with "Sala" and "Localizarea" headers
            table = soup.find('table')
            if not table:
                self.logger.error("No table found in the HTML content")
                return

            # Find all table rows, skip the header row
            rows = table.find_all('tr')
            if len(rows) < 2:
                self.logger.error("Table found but no data rows available")
                return

            # Skip header row, process data rows
            data_rows = rows[1:]  # Skip first row (header)
            self.logger.info(f"Found {len(data_rows)} room entries to process")

            rooms_added = 0
            rooms_updated = 0

            for i, row in enumerate(data_rows, 1):
                try:
                    # Extract cells from the row
                    cells = row.find_all(['td', 'th'])

                    if len(cells) < 2:
                        self.logger.warning(f"Row {i}: Not enough columns found, skipping")
                        continue

                    # Extract room name and location
                    room_name = cells[0].get_text(strip=True)
                    room_location = cells[1].get_text(strip=True)

                    # Skip empty rows
                    if not room_name or not room_location:
                        self.logger.warning(f"Row {i}: Empty room name or location, skipping")
                        continue

                    # Check if room already exists
                    existing_room = self.roomRepository.get_room_by_name(room_name)
                    if existing_room:
                        # Update existing room location if different
                        if existing_room.location != room_location:
                            self.roomRepository.update_location_by_id(existing_room.room_id, room_location)
                            self.logger.info(
                                f"Updated room '{room_name}' location from '{existing_room.location}' to '{room_location}'")
                            rooms_updated += 1
                        else:
                            self.logger.debug(f"Room '{room_name}' already has correct location, no update needed")
                    else:
                        # Add new room
                        self.roomRepository.add_room(room_name, room_location)
                        self.logger.info(f"Added room: '{room_name}' at '{room_location}'")
                        rooms_added += 1

                except Exception as row_error:
                    self.logger.error(f"Error processing row {i}: {str(row_error)}")
                    continue

            # Commit all changes
            self.session.commit()

            self.logger.info(f"Room scraping completed successfully!")
            self.logger.info(f"Summary: {rooms_added} rooms added, {rooms_updated} rooms updated")

        except requests.RequestException as e:
            self.logger.error(f"Failed to fetch content from URL: {str(e)}")

        except Exception as e:
            self.logger.error(f"Unexpected error during room scraping: {str(e)}")
            self.session.rollback()

    def update_google_maps_urls_from_excel(self):
        """
        Update Google Maps URLs for rooms from Excel file (.xlsx)
        Format: Column A = room_name, Column B = google_maps_url
        """
        try:
            self.logger.info(f"Starting Google Maps URLs update from Excel: {self.excel_file}")

            rooms_updated = 0
            rooms_not_found = 0
            total_processed = 0

            # Read Excel file using pandas
            df = pd.read_excel(self.excel_file, header=None)  # header=None to avoid header processing

            self.logger.info(f"Found {len(df)} rows in Excel file")

            for row_num, row in df.iterrows():
                try:
                    total_processed += 1

                    # Get values from first two columns (0 and 1)
                    if len(row) < 2:
                        self.logger.warning(f"Excel row {row_num + 1}: Not enough columns, skipping")
                        continue

                    # Extract room name (column A) and Google Maps URL (column B)
                    name = str(row.iloc[0]).strip() if pd.notna(row.iloc[0]) else ""
                    google_maps_url = str(row.iloc[1]).strip() if pd.notna(row.iloc[1]) else ""

                    # Skip empty values
                    if not name or not google_maps_url or name == 'nan' or google_maps_url == 'nan':
                        self.logger.warning(f"Excel row {row_num + 1}: Empty room name or URL, skipping")
                        continue

                    # Find room by name
                    room = self.roomRepository.get_room_by_name(name)

                    if room:
                        # Update Google Maps URL
                        self.roomRepository.update_google_maps_url(room.room_id, google_maps_url)
                        self.logger.info(f"Updated Google Maps URL for room '{name}'")
                        rooms_updated += 1
                    else:
                        self.logger.warning(f"Room '{name}' not found in database")
                        rooms_not_found += 1

                except Exception as row_error:
                    self.logger.error(f"Error processing Excel row {row_num + 1}: {str(row_error)}")
                    continue

            # Commit all changes
            self.session.commit()

            self.logger.info(f"Google Maps URLs update completed successfully!")
            self.logger.info(
                f"Summary: {rooms_updated} rooms updated, {rooms_not_found} rooms not found, {total_processed} total processed")

        except FileNotFoundError:
            self.logger.error(f"Excel file not found: {self.excel_file}")

        except Exception as e:
            self.logger.error(f"Unexpected error during Excel processing: {str(e)}")
            self.session.rollback()

    def scrape_and_update_complete(self):
        """
        Complete workflow: scrape rooms and update Google Maps URLs from Excel
        """
        try:
            # First, scrape rooms from HTML
            self.scrape_rooms()

            # Then, update Google Maps URLs from Excel
            self.logger.info("Proceeding with Google Maps URLs update from Excel...")
            self.update_google_maps_urls_from_excel()
            self.logger.info("Update rooms with success!")

        except Exception as e:
            self.logger.error(f"Error in complete workflow: {str(e)}")