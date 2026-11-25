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
    from app.auth.models import User
    farmer = session.exec(select(User).where(User.email == "farmer.rahim@agroconnect.com")).first()
    farmer_id = farmer.id if farmer else None

    existing = session.exec(select(Product)).first()
    if existing is None:
        for p in SAMPLE_PRODUCTS:
            session.add(Product(**p, user_id=farmer_id))
        session.commit()


def link_products_to_farmer_if_unowned(session: Session) -> None:
    from app.auth.models import User
    farmer = session.exec(select(User).where(User.email == "farmer.rahim@agroconnect.com")).first()
    if farmer:
        unowned = session.exec(select(Product).where(Product.user_id == None)).all()
        for p in unowned:
            p.user_id = farmer.id
            session.add(p)
        session.commit()


def seed_groups_if_empty(session: Session) -> None:
    from app.auth.models import User
    from app.groups.models import Group, GroupMember

    existing_group = session.exec(select(Group)).first()
    if existing_group is not None:
        return

    farmer = session.exec(select(User).where(User.email == "farmer.rahim@agroconnect.com")).first()
    if not farmer:
        return

    coop = Group(
        name="Bogura Organic Farmers Cooperative",
        description="A collective of organic fruit and vegetable growers in Bogura district sharing cold storage and direct consumer transport.",
        owner_id=farmer.id,
    )
    session.add(coop)
    session.commit()
    session.refresh(coop)

    # Add Rahim as ADMIN
    session.add(GroupMember(group_id=coop.id, user_id=farmer.id, permission="ADMIN"))

    # Also add Consumer Sourov as VIEW_ONLY
    consumer = session.exec(select(User).where(User.email == "consumer.sourov@agroconnect.com")).first()
    if consumer:
        session.add(GroupMember(group_id=coop.id, user_id=consumer.id, permission="VIEW_ONLY"))

    session.commit()


def seed_users_if_empty(session: Session) -> None:
    from pwdlib import PasswordHash
    from app.auth.models import User

    pwd_hash = PasswordHash.recommended()
    default_users = [
        User(
            email="mainadmin@agroconnect.com",
            hashed_password=pwd_hash.hash("Admin123!"),
            name="Main Administrator",
            role="ADMIN",
            phone="+8801700000000",
            location="Dhaka",
            is_banned=False,
            is_main_admin=True,
        ),
        User(
            email="admin@agroconnect.com",
            hashed_password=pwd_hash.hash("Admin123!"),
            name="System Administrator",
            role="ADMIN",
            phone="+8801700000001",
            location="Dhaka",
            is_banned=False,
            is_main_admin=True,
        ),
        User(
            email="moderator@agroconnect.com",
            hashed_password=pwd_hash.hash("Moderator123!"),
            name="Security & Quality Moderator",
            role="ADMIN",
            phone="+8801700000002",
            location="Dhaka",
            is_banned=False,
            is_main_admin=False,
        ),
        User(
            email="farmer.rahim@agroconnect.com",
            hashed_password=pwd_hash.hash("Farmer123!"),
            name="Farmer Abdul Karim",
            role="FARMER",
            phone="+8801712001122",
            location="Bogura",
            is_banned=False,
            is_main_admin=False,
        ),
        User(
            email="farmer.karim@agroconnect.com",
            hashed_password=pwd_hash.hash("Farmer123!"),
            name="Farmer Tariqul Hasan",
            role="FARMER",
            phone="+8801819665544",
            location="Rajshahi",
            is_banned=False,
            is_main_admin=False,
        ),
        User(
            email="consumer.sourov@agroconnect.com",
            hashed_password=pwd_hash.hash("Consumer123!"),
            name="Zahidul Hasan Sourov",
            role="CONSUMER",
            phone="+8801811223344",
            location="Dhaka",
            is_banned=False,
            is_main_admin=False,
        ),
    ]

    for u in default_users:
        existing = session.exec(select(User).where(User.email == u.email)).first()
        if not existing:
            session.add(u)
        elif u.is_main_admin and not existing.is_main_admin:
            existing.is_main_admin = True
            session.add(existing)
    session.commit()
