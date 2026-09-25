import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

print("URL loaded:", SUPABASE_URL)
print("KEY length:", len(SUPABASE_KEY) if SUPABASE_KEY else "None")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)