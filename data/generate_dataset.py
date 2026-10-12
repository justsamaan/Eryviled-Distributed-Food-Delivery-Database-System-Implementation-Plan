import csv
import random

random.seed(42)

restaurants = [
    (1, "Bella Italia Pizzeria", "Italian"),
    (2, "Sakura Japanese & Ramen", "Japanese"),
    (3, "The Big Apple Burger Co.", "American"),
    (4, "Taj Mahal Indian Spice", "Indian"),
    (5, "Green Goddess Bowl Lab", "Healthy")
]

weather_conditions = ["Clear", "Rainy", "Foggy", "Stormy"]
weather_weights = [0.60, 0.25, 0.10, 0.05]

traffic_densities = ["Low", "Medium", "High", "Jam"]
traffic_weights = [0.30, 0.40, 0.20, 0.10]

vehicles = ["Bike", "Scooter", "Electric_Bicycle", "Car"]
times_of_day = ["Morning", "Lunch", "Afternoon", "Dinner", "Late_Night"]

reviews_positive = [
    "Food arrived fast and piping hot!",
    "Amazing flavors and great packaging.",
    "Very quick delivery despite rush hour.",
    "Delicious meal, driver was very polite.",
    "Food was fresh, perfectly seasoned, and arrived earlier than expected."
]

reviews_neutral = [
    "Decent food, arrived slightly later than expected.",
    "Standard delivery time, taste was okay.",
    "Average experience, rider had slight trouble finding the address."
]

reviews_delayed = [
    "Delivery took over an hour due to heavy rain and gridlock traffic.",
    "Pizza was cold because delivery was delayed.",
    "Significant delay during peak dinner rush, food needed reheating.",
    "Storm delayed rider, order arrived 25 minutes late."
]

headers = [
    "order_id", "customer_id", "restaurant_id", "restaurant_name", "cuisine_type",
    "order_value_usd", "num_items", "prep_time_minutes", "delivery_distance_km",
    "weather_condition", "traffic_density", "vehicle_type", "driver_experience_years",
    "time_of_day", "delivery_time_minutes", "is_delayed", "customer_rating", "customer_review"
]

rows = []

for i in range(1, 501):
    order_id = 1000 + i
    customer_id = random.randint(1, 60)
    rest_id, rest_name, cuisine = random.choice(restaurants)
    num_items = random.randint(1, 6)
    order_value = round(random.uniform(14.0, 75.0) + (num_items * 6.5), 2)
    
    # Kitchen preparation time depends on number of items + restaurant load
    prep_time = round(random.uniform(8.0, 16.0) + (num_items * 2.8), 1)
    
    # Distance in km
    distance_km = round(random.uniform(0.8, 14.5), 2)
    
    weather = random.choices(weather_conditions, weights=weather_weights)[0]
    traffic = random.choices(traffic_densities, weights=traffic_weights)[0]
    vehicle = random.choice(vehicles)
    driver_exp = round(random.uniform(0.5, 6.0), 1)
    time_day = random.choice(times_of_day)
    
    # Transit speed modeling:
    base_speed_kmh = 24.0 # km/h
    if vehicle == "Car":
        base_speed_kmh = 22.0
    elif vehicle == "Electric_Bicycle":
        base_speed_kmh = 18.0
    elif vehicle == "Bike":
        base_speed_kmh = 20.0
    elif vehicle == "Scooter":
        base_speed_kmh = 25.0
        
    # Traffic multiplier
    traffic_mult = {"Low": 1.0, "Medium": 1.25, "High": 1.65, "Jam": 2.2}[traffic]
    
    # Weather multiplier
    weather_mult = {"Clear": 1.0, "Rainy": 1.30, "Foggy": 1.18, "Stormy": 1.70}[weather]
    
    transit_hours = (distance_km / base_speed_kmh) * traffic_mult * weather_mult
    transit_mins = transit_hours * 60.0
    
    # Delivery time = prep_time + transit_time + handover_delay
    handover = random.uniform(2.0, 5.0)
    noise = random.gauss(0, 1.5)
    total_delivery_time = round(max(12.0, prep_time + transit_mins + handover + noise), 1)
    
    is_delayed = 1 if total_delivery_time > 42.0 else 0
    
    if is_delayed == 1:
        rating = random.choices([1, 2, 3], weights=[0.45, 0.40, 0.15])[0]
        review = random.choice(reviews_delayed)
    elif total_delivery_time <= 28.0:
        rating = random.choices([4, 5], weights=[0.20, 0.80])[0]
        review = random.choice(reviews_positive)
    else:
        rating = random.choices([3, 4, 5], weights=[0.25, 0.55, 0.20])[0]
        review = random.choice(reviews_neutral)
        
    rows.append([
        order_id, customer_id, rest_id, rest_name, cuisine,
        order_value, num_items, prep_time, distance_km,
        weather, traffic, vehicle, driver_exp, time_day,
        total_delivery_time, is_delayed, rating, review
    ])

with open(r'd:\Semester 5\Database Systems\project\data\food_delivery_dataset.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerow(headers)
    writer.writerows(rows)

print(f"Successfully generated {len(rows)} records in data/food_delivery_dataset.csv")
