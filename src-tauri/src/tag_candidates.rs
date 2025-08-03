pub const TAG_CANDIDATES: [&str; 590] = [
    // --- People & Anatomy ---
    "person", "people", "man", "woman", "child", "baby", "boy", "girl", "teenager", "adult", "senior",
    "crowd", "group", "family", "couple", "portrait", "self-portrait", "candid", "face", "smile", "laughing",
    "crying", "thinking", "silhouette", "shadow", "hands", "feet",

    // --- Animals ---
    "animal", "pet", "wildlife", "dog", "puppy", "cat", "kitten", "bird", "horse", "cow", "sheep",
    "pig", "goat", "chicken", "duck", "lion", "tiger", "bear", "wolf", "fox", "deer", "moose",
    "elephant", "giraffe", "zebra", "monkey", "gorilla", "koala", "kangaroo", "panda", "squirrel",
    "rabbit", "hamster", "mouse", "rat", "snake", "lizard", "turtle", "frog", "fish", "shark",
    "whale", "dolphin", "seal", "penguin", "owl", "eagle", "hawk", "parrot", "swan", "peacock",
    "insect", "butterfly", "bee", "spider", "ant", "dragonfly",

    // --- Nature & Landscape ---
    "nature", "landscape", "mountain", "mountains", "hill", "valley", "canyon", "desert", "dunes",
    "forest", "woods", "jungle", "tree", "trees", "pine tree", "palm tree", "leaf", "leaves",
    "flower", "flowers", "rose", "tulip", "sunflower", "wildflower", "field", "meadow", "grass",
    "farm", "vineyard", "garden", "park", "beach", "sand", "coast", "shore", "ocean", "sea",
    "wave", "waves", "underwater", "coral reef", "river", "lake", "pond", "stream", "waterfall",
    "creek", "geyser", "hot spring", "island", "cave", "rock", "rocks", "stone", "boulder",
    "volcano", "glacier", "iceberg", "ice", "snow", "frost",

    // --- Sky & Weather ---
    "sky", "clouds", "cloudy", "sunny", "clear sky", "sun", "sunlight", "sunshine", "sunrise", "sunset",
    "dawn", "dusk", "twilight", "moon", "full moon", "crescent moon",
    "stars", "night sky", "galaxy", "milky way", "aurora", "constellation", "space", "planet",
    "weather", "rain", "rainy", "storm", "stormy", "thunderstorm", "lightning", "snowy", "blizzard",
    "fog", "foggy", "mist", "windy", "rainbow", "tornado", "hurricane",

    // --- Architecture & Urban ---
    "architecture", "building", "skyscraper", "city", "cityscape", "skyline", "urban", "downtown",
    "street", "road", "alley", "sidewalk", "highway", "bridge", "tunnel", "house", "home",
    "apartment", "cabin", "castle", "palace", "mansion", "hut", "barn", "farmhouse", "church",
    "cathedral", "mosque", "temple", "synagogue", "monastery", "tower", "lighthouse", "windmill",
    "ruins", "monument", "statue", "fountain", "door", "window", "roof", "wall", "brick",
    "staircase", "balcony", "patio", "interior", "room", "living room", "bedroom", "kitchen",
    "bathroom", "office", "library", "stadium", "arena", "theater", "museum", "gallery",
    "airport", "train station", "subway", "harbor", "pier", "dock",

    // --- Objects & Still Life ---
    "object", "still life", "table", "chair", "couch", "sofa", "bed", "desk", "bookshelf", "lamp",
    "clock", "vase", "mirror", "candle", "sculpture", "painting", "photograph", "frame", "toy",
    "doll", "teddy bear", "game", "puzzle", "instrument", "guitar", "piano", "violin", "drums",
    "book", "magazine", "newspaper", "pen", "pencil", "computer", "laptop", "keyboard", "mouse",
    "phone", "cell phone", "camera", "television", "remote", "headphones", "microphone", "speaker",
    "watch", "jewelry", "glasses", "sunglasses", "hat", "scarf", "gloves", "bag", "handbag",
    "backpack", "suitcase", "umbrella", "key", "lock", "tool", "hammer", "screwdriver", "wrench",
    "balloon", "kite", "flag",

    // --- Vehicles ---
    "vehicle", "car", "bicycle", "motorcycle", "bus", "train", "airplane", "boat", "ship", "truck", "van",
    "scooter", "skateboard",

    // --- Food & Drink ---
    "food", "drink", "meal", "dish", "plate", "bowl", "cup", "glass", "fork", "knife", "spoon",
    "chopsticks", "fruit", "apple", "banana", "orange", "strawberry", "grape", "lemon", "watermelon",
    "pineapple", "mango", "peach", "cherry", "vegetable", "carrot", "broccoli", "tomato", "lettuce",
    "potato", "onion", "garlic", "pepper", "corn", "bread", "toast", "baguette", "croissant",
    "cake", "cupcake", "pie", "cookie", "donut", "pastry", "ice cream", "chocolate", "candy",
    "pizza", "pasta", "sushi", "ramen", "taco", "burrito", "burger", "fries", "hot dog", "sandwich",
    "salad", "soup", "stew", "steak", "chicken", "fish", "shrimp", "egg", "cheese", "rice",
    "coffee", "tea", "juice", "soda", "water", "milk", "wine", "beer", "cocktail",

    // --- Activities & Events ---
    "activity", "event", "sports", "running", "jogging", "hiking", "climbing", "cycling", "swimming",
    "surfing", "sailing", "kayaking", "skiing", "snowboarding", "skating", "yoga", "meditation",
    "dancing", "ballet", "concert", "music", "festival", "party", "celebration", "wedding",
    "birthday", "holiday", "christmas", "halloween", "parade", "protest", "march", "meeting",
    "conference", "work", "studying", "reading", "writing", "painting", "drawing", "photography",
    "cooking", "baking", "gardening", "shopping", "travel", "vacation", "camping", "picnic",
    "bonfire", "fireworks",

    // --- Art, Design & Patterns ---
    "art", "abstract", "pattern", "texture", "lines", "dots", "shapes", "geometric", "symmetry",
    "asymmetry", "minimalist", "maximalist", "modern", "vintage", "retro", "classic", "futuristic",
    "rustic", "industrial", "bohemian", "grunge", "steampunk", "fantasy", "sci-fi", "surreal",
    "pop art", "impressionism", "expressionism", "cubism", "street art", "graffiti", "calligraphy",
    "design", "illustration", "graphic design", "logo", "typography",

    // --- Photography & Composition ---
    "composition", "macro", "close-up", "long exposure", "motion blur", "light painting", "bokeh",
    "depth of field", "high-key", "low-key", "sepia", "aerial view", "drone shot", "top-down",
    "wide angle", "telephoto", "fisheye", "reflection", "rule of thirds", "leading lines", "framing",

    // --- Lighting ---
    "lighting", "natural light", "artificial light", "hard light", "soft light", "backlighting",
    "golden hour", "blue hour",

    // --- Color ---
    "color", "colorful", "vibrant", "monochrome", "black and white", "red", "orange", "yellow",
    "green", "blue", "purple", "pink", "brown", "black", "white", "gray", "silver", "gold",
    "pastel", "neon", "bright", "dark", "light", "warm colors", "cool colors", "gradient",

    // --- Mood & Emotion ---
    "mood", "emotion", "happy", "joyful", "cheerful", "sad", "melancholy", "lonely", "angry",
    "dramatic", "intense", "calm", "peaceful", "serene", "tranquil", "relaxing", "cozy", "hygge",
    "energetic", "lively", "chaotic", "busy", "romantic", "love", "dreamy", "whimsical",
    "mysterious", "eerie", "spooky", "scary", "powerful", "epic", "majestic", "nostalgic",
    "hopeful", "playful", "fun", "adventure", "freedom", "solitude", "quiet", "silence"
];