#!/usr/bin/env python3

#3D Graph
"""
import matplotlib.pyplot as plt
from mpl_toolkits import mplot3d
import matplotlib.dates as mdates
from datetime import datetime
import json

# Read JSON data from file
with open('data_file.json', 'r') as file:
    data = json.load(file)

# Convert date strings to datetime objects
dates = [datetime.strptime(entry["date"], "%d/%m/%Y %I:%M:%S %p") for entry in data]
rates = [entry["rate"] for entry in data]

# Convert datetime objects to timestamps
timestamps = mdates.date2num(dates)

# Create a 3D scatter plot
fig = plt.figure(figsize=(10, 8))
ax = fig.add_subplot(111, projection='3d')
ax.scatter3D(timestamps, rates, range(len(dates)), c=rates, cmap='viridis', marker='o', s=100)

# Customize the plot
ax.set_xlabel('Date')
ax.set_ylabel('Rate')
ax.set_zlabel('Data Point')
ax.set_title('3D Scatter Plot')
ax.xaxis.set_major_formatter(mdates.DateFormatter("%d/%m/%Y %I:%M %p"))  # Format x-axis date labels
ax.xaxis.set_major_locator(mdates.AutoDateLocator())  # Automatically set x-axis tick locations

# Add a color bar to represent the rate values
cbar = fig.colorbar(ax.collections[0])
cbar.set_label('Rate', rotation=270, labelpad=15)

# Show the plot
plt.show()
"""


#"""
import matplotlib.pyplot as plt
from datetime import datetime
import json

import argparse

# Create an argument parser
parser = argparse.ArgumentParser(description='History graph')

# Add the argument to the parser
parser.add_argument('JSONFilePath', type=str, help='JSON Data File path')

# Parse the command-line argument
args= parser.parse_args()

# Access the parsed argument
FilePath = args.JSONFilePath


# Read JSON data from file
with open(FilePath, 'r') as file:
    data = json.load(file)

# Convert date strings to datetime objects
dates = [datetime.strptime(entry["date"], "%d/%m/%Y %I:%M:%S %p") for entry in data]
rates = [entry["rate"] for entry in data]

# Plot the graph
plt.figure(figsize=(10, 6))
plt.plot(dates, rates, marker='o', linestyle='-')
plt.xlabel('Date')
plt.ylabel('Rate')
plt.title('Rate over Time')
plt.xticks(rotation=45)
plt.grid()
plt.tight_layout()

# Show the graph
plt.show()

#"""
