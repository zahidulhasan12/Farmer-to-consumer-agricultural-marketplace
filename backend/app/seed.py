# Database seeder to populate sample agricultural marketplace products when table is empty.
from sqlmodel import Session, select
from app.products.models import Product


SAMPLE_PRODUCTS = [
    {
        "name": "Fresh Red Tomatoes",
        "category": "Vegetables",
        "price": 55.0,
        "unit": "kg",
        "quantity": 180,
        "description": "Farm-fresh, naturally sun-ripened red tomatoes without chemical pesticides. Harvested this morning from the fertile lands of Bogura.",
        "image_url": "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80",
        "farmer_name": "Farmer Abdul Karim",
        "farmer_location": "Bogura",
        "farmer_phone": "+8801712001122",
        "is_available": True,
    },
    {
        "name": "Organic Diamond Potatoes",
        "category": "Vegetables",
        "price": 35.0,
        "unit": "kg",
        "quantity": 350,
        "description": "Grade-A quality diamond potatoes straight from Munshiganj cold storage. Ideal for cooking curries, fries, and daily staples.",
        "image_url": "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop&q=80",
        "farmer_name": "Farmer Rafiqul Islam",
        "farmer_location": "Munshiganj",
        "farmer_phone": "+8801713554433",
        "is_available": True,
    },
    {
        "name": "Rajshahi Fazli Mangoes",
        "category": "Fruits",
        "price": 140.0,
        "unit": "kg",
        "quantity": 75,
        "description": "Famous sweet, aromatic Fazli mangoes from orchards in Bagha, Rajshahi. Hand-picked, 100% formalin-free.",
        "image_url": "https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&auto=format&fit=crop&q=80",
        "farmer_name": "Farmer Tariqul Hasan",
        "farmer_location": "Rajshahi",
        "farmer_phone": "+8801819665544",
        "is_available": True,
    },
    {
        "name": "Premium Miniket Rice",
        "category": "Grains",
        "price": 68.0,
        "unit": "kg",
        "quantity": 500,
        "description": "Aromatic, slender grain polished Miniket rice harvested from the rice bowl of Dinajpur. Aged naturally for superior flavor.",
        "image_url": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80",
        "farmer_name": "Farmer Mokbul Hossain",
        "farmer_location": "Dinajpur",
        "farmer_phone": "+8801911443322",
        "is_available": True,
    },
    {
        "name": "Pure Farm Fresh Cow Milk",
        "category": "Dairy",
        "price": 85.0,
        "unit": "liter",
        "quantity": 60,
        "description": "Raw unpasteurized 100% pure cow milk from grass-fed cattle in Sirajganj dairy belt. Collected daily at sunrise.",
        "image_url": "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80",
        "farmer_name": "Farmer Anisur Rahman",
        "farmer_location": "Sirajganj",
        "farmer_phone": "+8801611889900",
        "is_available": True,
    },
    {
        "name": "Pure Sundarban Wild Honey",
        "category": "Other",
        "price": 650.0,
        "unit": "kg",
        "quantity": 25,
        "description": "Collected directly from natural mangrove beehives in the Sundarban delta by licensed traditional honey hunters (Mawals).",
        "image_url": "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&auto=format&fit=crop&q=80",
        "farmer_name": "Farmer Joynal Abedin",
        "farmer_location": "Satkhira",
        "farmer_phone": "+8801511223344",
        "is_available": True,
    },
    {
        "name": "Fresh Green Chilies",
        "category": "Vegetables",
        "price": 90.0,
        "unit": "kg",
        "quantity": 80,
        "description": "Spicy, freshly plucked green chilies with vibrant color and intense natural punch from fields in Pabna.",
        "image_url": "https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?w=600&auto=format&fit=crop&q=80",
        "farmer_name": "Farmer Habibur Rahman",
        "farmer_location": "Pabna",
        "farmer_phone": "+8801718776655",
        "is_available": True,
    },
    {
        "name": "Free-Range Deshi Brown Eggs",
        "category": "Poultry",
        "price": 150.0,
        "unit": "dozen",
        "quantity": 120,
        "description": "Organic brown eggs from pasture-raised, free-range indigenous hens. Rich in nutrients and golden yolks.",
        "image_url": "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=600&auto=format&fit=crop&q=80",
        "farmer_name": "Farmer Nazrul Islam",
        "farmer_location": "Gazipur",
        "farmer_phone": "+8801815998877",
        "is_available": True,
    },
]


def seed_products_if_empty(session: Session) -> None:
    existing = session.exec(select(Product)).first()
    if existing is None:
        for p in SAMPLE_PRODUCTS:
            session.add(Product(**p))
        session.commit()
