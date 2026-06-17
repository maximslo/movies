import pandas as pd

# Load the dataset from a CSV file
file_path = "movies_2024_with_genres.csv"
df = pd.read_csv(file_path)

# Function to clean up the Genre column
def clean_genre(genre):
    if pd.isnull(genre):
        return genre
    # Handle "Kids & Family" as a special case
    if "Kids & Family" in genre:
        genre = genre.replace("Kids & Family", "KidsAndFamily")
    # Replace '&' with ',', remove slashes, and spaces
    genre = genre.replace("&", ",").replace("/", ",").replace(" ", "")
    # Restore "Kids & Family" as a single entity
    genre = genre.replace("KidsAndFamily", "Kids & Family")
    # Split the genres into a list, remove duplicates while preserving order
    genre_list = genre.split(",")
    cleaned_genre = ",".join(dict.fromkeys(genre_list))
    return cleaned_genre

# Apply the cleaning function to the Genre column
df['Genre'] = df['Genre'].apply(clean_genre)

# Save or display the cleaned DataFrame
output_file_path = "genre_cleaned_dataset.csv"
df.to_csv(output_file_path, index=False)
print(f"Cleaned dataset saved to {output_file_path}")

# import pandas as pd

# # Load the dataset from a CSV file
# file_path = "FINAL.csv"  # Replace with your actual file path
# df = pd.read_csv(file_path)

# # Function to clean up and extract genres
# def extract_genres(genre):
#     if pd.isnull(genre):
#         return []
#     # Handle "Kids & Family" as a special case
#     if "Kids & Family" in genre:
#         genre = genre.replace("Kids & Family", "KidsAndFamily")
#     # Replace '&' with ',', remove slashes, and spaces
#     genre = genre.replace("&", ",").replace("/", ",").replace(" ", "")
#     # Restore "Kids & Family" as a single entity
#     genre = genre.replace("KidsAndFamily", "Kids & Family")
#     # Split into individual genres
#     return genre.split(",")

# # Extract all genres from the Genre column
# all_genres = df['Genre'].dropna().apply(extract_genres)

# # Flatten the list of genres and get unique values
# unique_genres = set(genre for sublist in all_genres for genre in sublist)

# # Convert to a sorted list and display
# unique_genres_list = sorted(unique_genres)
# print("Unique genres in the dataset:")
# print(unique_genres_list)