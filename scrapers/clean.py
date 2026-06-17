import pandas as pd

def clean_dataset(file_path, output_path):
    # Open the file manually to process lines
    with open(file_path, 'r') as infile:
        lines = infile.readlines()

    # Process each line to keep only the first 4 columns
    cleaned_data = []
    for line in lines:
        # Split by commas
        columns = line.strip().split(',')

        # Keep only the first 4 columns
        trimmed_columns = columns[:4]

        # Join back into a single string
        cleaned_data.append(','.join(trimmed_columns))

    # Write the cleaned data to a new file
    with open(output_path, 'w') as outfile:
        outfile.write('\n'.join(cleaned_data))

    print(f"Cleaned dataset saved to: {output_path}")

    # Optional: Load and preview the cleaned data with pandas
    df = pd.read_csv(output_path)
    print(df.head())

# Example usage
if __name__ == "__main__":
    input_file = "movies_2024.csv"
    output_file = "cleaned_dataset.csv"

    clean_dataset(input_file, output_file)