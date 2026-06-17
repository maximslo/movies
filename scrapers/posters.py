import os
import pandas as pd
import requests
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
import time

# Load the dataset
csv_file = "dataset.csv"
df = pd.read_csv(csv_file)

# Extract the "Title" column
titles = df["Title"].tolist()

# Set up Selenium WebDriver
driver_path = "../chromedriver_mac_arm64/chromedriver"
driver = webdriver.Chrome(driver_path)

# Folder to save images
output_folder = "movie_posters"
os.makedirs(output_folder, exist_ok=True)

for title in titles:
    try:
        # Construct the search query
        query = f"{title} movie picture"
        driver.get("https://www.google.com")
        search_box = driver.find_element(By.NAME, "q")
        search_box.send_keys(query)
        search_box.send_keys(Keys.RETURN)
        time.sleep(2)  # Allow time for the page to load

        # Locate image URLs hosted on encrypted-tbn2.gstatic.com
        images = driver.find_elements(By.TAG_NAME, "img")
        image_url = None
        for img in images:
            src = img.get_attribute("src")
            if src and "encrypted-tbn2.gstatic.com" in src:
                image_url = src
                break

        if not image_url:
            print(f"No suitable image found for {title}")
            continue

        # Download the image
        response = requests.get(image_url)
        if response.status_code == 200:
            file_path = os.path.join(output_folder, f"{title.replace(' ', '_')}.jpg")
            with open(file_path, "wb") as file:
                file.write(response.content)
            print(f"Downloaded {title}")
        else:
            print(f"Failed to download {title}: {image_url}")

    except Exception as e:
        print(f"Error processing {title}: {e}")

# Close the browser
driver.quit()
