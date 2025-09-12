from diffusers import DiffusionPipeline
from transformers import pipeline
from supabase import create_client, Client
import os
import logging
from io import BytesIO

# Configure logging to show info-level messages
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# --- Initialization ---
try:
    # Load models
    pipe = DiffusionPipeline.from_pretrained("prompthero/openjourney")
    pipe_remove_background = pipeline("image-segmentation", model="briaai/RMBG-1.4", trust_remote_code=True)

    # Initialize Supabase client
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_KEY = os.getenv("SUPABASE_KEY")
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in environment variables.")
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

except Exception as e:
    logging.error(f"Fatal error during initialization: {e}")
    # Set to None so downstream functions can fail gracefully
    pipe = None
    pipe_remove_background = None
    supabase = None

# --- Core Functions ---
def get_element_specifications(brief_id: str) -> list:
    """Fetches element specification data for a given brief ID."""
    if not supabase:
        logging.error("Supabase client not initialized.")
        return []
    try:
        # Fetch only the data we need
        response = supabase.table("element_specifications").select("specification_data").eq("brief_id", brief_id).execute()
        return response.data or []
    except Exception as e:
        logging.error(f"Error fetching element specifications for brief_id {brief_id}: {e}")
        return []

def generate_image(prompt: str):
    """Generates a single image from a prompt using the diffusion model."""
    if not pipe:
        logging.error("Diffusion pipeline is not available.")
        return None
    try:
        logging.info(f"Generating image for prompt: '{prompt[:50]}...'")
        image = pipe(prompt).images[0]
        return image
    except Exception as e:
        logging.error(f"Failed to generate image: {e}")
        return None

def remove_background(image):
    """Removes the background from a given PIL image."""
    if not pipe_remove_background:
        logging.error("Background removal pipeline is not available.")
        return None
    try:
        logging.info("Removing background from image.")
        return pipe_remove_background(image)
    except Exception as e:
        logging.error(f"Failed to remove background: {e}")
        return None

def store_image(image, bucket_name: str, file_path: str):
    """Converts a PIL image to bytes and stores it in a Supabase bucket."""
    if not supabase:
        logging.error("Supabase client not initialized.")
        return False
    try:
        # Convert PIL Image to bytes
        with BytesIO() as buffer:
            image.save(buffer, "PNG")
            file_bytes = buffer.getvalue()

        # Use the .bucket().upload() syntax from the original script
        supabase.bucket(bucket_name).upload(file_path, file_bytes, {"contentType": "image/png"})
        logging.info(f"Successfully stored image at: {bucket_name}/{file_path}")
        return True
    except Exception as e:
        logging.error(f"Failed to store image at {bucket_name}/{file_path}: {e}")
        return False

def _build_detailed_prompt(element: dict) -> str:
    """
    Constructs a detailed, single-string prompt from various element
    specification attributes, prioritizing the regenerationPrompt.
    """
    # The regenerationPrompt is the primary instruction for the model.
    base_prompt = element.get('regenerationPrompt')
    if not base_prompt:
        return None

    # These attributes add crucial context and constraints.
    additional_details = [
        element.get('criticalConstraints'),
        element.get('lightingRequirements'),
        element.get('styleContinuityMarkers')
        element.get('transparencyRequirements')
        element.get('styleAnchors')
        element.get('perspective')
        element.get('type')
        element.get('purpose')
    ]

    # Combine the base prompt with any available additional details.
    # We filter out any None or empty values to keep the prompt clean.
    full_prompt_parts = [base_prompt] + [detail for detail in additional_details if detail]
    
    # Join with ", " which is a common delimiter for concepts in diffusion prompts.
    return ", ".join(full_prompt_parts)

# --- Main Processing Logic ---
def process_brief_images(brief_id: str):
    """
    Main orchestrator function.
    Fetches specifications for a brief, generates an image for each element and
    the background, and stores them in Supabase Storage.
    """
    spec_records = get_element_specifications(brief_id)
    if not spec_records:
        logging.warning(f"No specifications found for brief_id: {brief_id}. Aborting.")
        return

    for record in spec_records:
        spec_data = record.get('specification_data')
        if not spec_data:
            logging.warning("Skipping record due to missing 'specification_data'.")
            continue

        # 1. Process each element
        for element in spec_data.get('elements', []):
            element_id = element.get('id')
            prompt = _build_detailed_prompt(element)
            if not all([element_id, prompt]):
                logging.warning(f"Skipping element due to missing 'id' or 'regenerationPrompt': {element}")
                continue

            original_image = generate_image(prompt)
            if not original_image:
                continue

            # Store the original image with its background
            original_path = f"{brief_id}/{element_id}_original.png"
            store_image(original_image, "element-images", original_path)

            # Remove background and store the transparent version
            transparent_image = remove_background(original_image)
            if transparent_image:
                transparent_path = f"{brief_id}/{element_id}_transparent.png"
                store_image(transparent_image, "element-images", transparent_path)

        # 2. Process the background
        background_spec = spec_data.get('background')
        if background_spec and background_spec.get('regenerationPrompt'):
            prompt = background_spec['regenerationPrompt']
            background_image = generate_image(prompt)
            if background_image:
                background_path = f"{brief_id}/background.png"
                store_image(background_image, "element-images", background_path)
        else:
            logging.warning("No background specification with a prompt found.")

    logging.info(f"Finished processing all images for brief_id: {brief_id}")

# --- Script Execution ---
if __name__ == '__main__':
    # This allows the script to be run directly for testing.
    # Example from your provided CSV file.
    test_brief_id = "b0dd0528-d30d-4123-9c15-4f5ce0e83060"
    
    if all([pipe, pipe_remove_background, supabase]):
        logging.info(f"--- Starting image generation process for brief: {test_brief_id} ---")
        process_brief_images(test_brief_id)
        logging.info("--- Process finished ---")
    else:
        logging.error("Script cannot run because one or more services failed to initialize.")