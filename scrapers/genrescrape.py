import requests
from bs4 import BeautifulSoup
import csv
import logging
import time
import re

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Define headers for requests to mimic a browser
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
}

def search_rotten_tomatoes(title):
    """Search Google for the Rotten Tomatoes page of a movie."""
    try:
        query = f"{title} movie rotten tomatoes"
        search_url = f"https://www.google.com/search?q={query.replace(' ', '+')}"
        response = requests.get(search_url, headers=HEADERS)
        response.raise_for_status()

        # Parse the Google search results
        soup = BeautifulSoup(response.text, 'html.parser')
        link = soup.find('a', href=re.compile(r'https://www.rottentomatoes.com/m/'))

        if link:
            rt_url = link['href']
            logging.info(f"Found Rotten Tomatoes URL for {title}: {rt_url}")
            return rt_url

        logging.warning(f"No Rotten Tomatoes link found for title: {title}")
        return None
    except Exception as e:
        logging.error(f"Error searching Rotten Tomatoes for {title}: {e}")
        return None

def scrape_rotten_tomatoes_genre(url):
    """Scrape genres from a Rotten Tomatoes movie page."""
    try:
        response = requests.get(url, headers=HEADERS)
        response.raise_for_status()

        soup = BeautifulSoup(response.text, 'html.parser')
        genre_tags = soup.find_all('rt-text', {'slot': 'metadataGenre'})

        # Collect all genre text
        genres = [tag.get_text(strip=True) for tag in genre_tags]
        return ", ".join(genres) if genres else "Unknown"
    except Exception as e:
        logging.error(f"Error scraping Rotten Tomatoes URL {url}: {e}")
        return "Unknown"

def enrich_dataset_with_genres(input_csv, output_csv):
    """Enrich the dataset with genres."""
    try:
        with open(input_csv, mode='r', encoding='utf-8') as infile, \
             open(output_csv, mode='w', newline='', encoding='utf-8') as outfile:

            reader = csv.DictReader(infile)
            fieldnames = reader.fieldnames + ['Genre']
            writer = csv.DictWriter(outfile, fieldnames=fieldnames)
            writer.writeheader()

            for row in reader:
                title = row['Title']
                logging.info(f"Fetching genre for: {title}")

                # Search Rotten Tomatoes page
                rt_url = search_rotten_tomatoes(title)
                if rt_url:
                    genre = scrape_rotten_tomatoes_genre(rt_url)
                else:
                    genre = "Unknown"

                row['Genre'] = genre
                writer.writerow(row)
                logging.info(f"Added genres for {title}: {genre}")
                time.sleep(2)  # Pause to avoid being blocked by Google or Rotten Tomatoes

        logging.info(f"Enriched dataset saved to {output_csv}")
    except Exception as e:
        logging.error(f"Error processing dataset: {e}")

# Paths to the input and output CSV files
input_csv = "cleaned_dataset.csv"
output_csv = "movies_2024_with_genres.csv"

# Enrich the dataset with genres
enrich_dataset_with_genres(input_csv, output_csv)
