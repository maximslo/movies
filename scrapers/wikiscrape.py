# scraper to generate list of movie titles released in 2024 from wikipedia (buggy)

import requests
from bs4 import BeautifulSoup
import csv
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

def scrape_movies_to_csv(url, output_csv):
    try:
        # Send a GET request to the Wikipedia page
        response = requests.get(url)
        response.raise_for_status()  # Raise an exception for HTTP errors

        # Parse the HTML content using BeautifulSoup
        soup = BeautifulSoup(response.text, 'html.parser')

        # Find all tables with the specified class, skipping the first table (Box office)
        tables = soup.find_all('table', {'class': 'wikitable sortable'})[1:]
        logging.debug(f"Number of tables found (excluding the first table): {len(tables)}")

        # Prepare the CSV file
        with open(output_csv, mode='w', newline='', encoding='utf-8') as csvfile:
            csv_writer = csv.writer(csvfile)
            csv_writer.writerow(['Month', 'Opening Date', 'Title', 'Production Company'])

            # Loop through each table to extract data
            for table_index, table in enumerate(tables):
                rows = table.find_all('tr')
                logging.debug(f"Table {table_index + 1} has {len(rows) - 1} rows (excluding header).")

                current_month = None
                for row_index, row in enumerate(rows):
                    # Check if the row is a month header (e.g., <th> or <td> spanning multiple rows)
                    month_cell = row.find('th')
                    if month_cell:
                        current_month = month_cell.get_text(strip=True)
                        logging.debug(f"Detected new month: {current_month}")
                        continue

                    # For regular rows
                    cells = row.find_all('td')
                    logging.debug(f"Row {row_index + 1} in table {table_index + 1} has {len(cells)} cells.")

                    if len(cells) >= 3:
                        try:
                            # Extract the opening date
                            opening_date = cells[0].get_text(strip=True)

                            # Extract the title
                            title = cells[1].get_text(strip=True)

                            # Extract the production company
                            production_company = cells[2].get_text(strip=True)

                            # Write the row to the CSV file
                            csv_writer.writerow([current_month, opening_date, title, production_company])
                            logging.debug(f"Written row: {current_month}, {opening_date}, {title}, {production_company}")
                        except Exception as e:
                            logging.error(f"Error processing row {row_index + 1} in table {table_index + 1}: {e}")
                    else:
                        logging.debug(f"Skipping row {row_index + 1} due to insufficient cells.")

        print(f"Data successfully written to {output_csv}")

    except requests.exceptions.RequestException as e:
        logging.error(f"HTTP request error: {e}")
    except Exception as e:
        logging.error(f"An unexpected error occurred: {e}")

# URL of the Wikipedia page
url = "https://en.wikipedia.org/wiki/List_of_American_films_of_2024"

# Output CSV file name
output_csv = "movies_2024.csv"

# Scrape and generate the CSV file
scrape_movies_to_csv(url, output_csv)
