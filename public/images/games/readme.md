
1) How games.json should look with images
Add an optional image field per game record (string path). The schema already supports this. 

Example:
```
{
  "id": "blind-man-s-buff",
  "name": "Blind Man’s Buff",
  "image": "/images/games/blind-mans-buff.jpg",
  "description": "Find and tag another player while blindfolded.",
  "category": "Party",
  "ageMin": 8,
  "ageMax": 11,
  "playersMin": 5,
  "playersMax": null,
  "recommendedPlayersText": "4+",
  "equipment": "Soft blindfold",
  "generalRules": [],
  "variations": [],
  "skillsDeveloped": ["Spatial Awareness", "Confidence", "Agility"],
  "tags": ["tag"],
  "regionalPopularity": ["UK-wide"],
  "regionalNames": [],
  "keywords": ["blind", "tag"],
  "traditionality": "Traditional",
  "historicalNotes": "",
  "notes": "",
  "relatedGames": [],
  "links": [],
  "prepLevel": "Unknown"
}
```
If image is missing, the card automatically shows the placeholder area. 

2) Where to store image files
Put your images under:

public/images/games/

Then reference them in JSON as:

"/images/games/your-file.jpg"

Why this works:

Static data is loaded from public/games.json, and assets under public/ are served directly. 

The app is exported with a GitHub Pages base path (/Itsallfunandgames) and asset prefix, so public assets resolve correctly in deployment. 

3) Practical tips
Use lowercase-kebab filenames (blind-mans-buff.jpg) to avoid path/case issues on deploy.

Prefer compressed web images (.webp or optimized .jpg) for faster card grid loading.

Keep a consistent card look by using similar aspect ratios where possible (the UI enforces a 16:9 image area). 




Nice — for your current card layout, the best AI image size is 1600×900 (16:9).

Why this is the best fit
Your card image container is explicitly 16:9 (aspect-[16/9]), so 16:9 source images avoid awkward crops. 

The image is rendered with object-cover, so non‑16:9 images will be cropped more aggressively. 

The project uses static export with images.unoptimized: true, so shipping oversized images directly impacts load speed. 

Recommended workflow
Generate master image: 1600×900 (quality source, good for desktop + retina).

Export web version:

preferred: WebP

target file size: ~150–350 KB each (try to stay under 500 KB).

Optional if you want extra crispness for zoom/future reuse: also keep a source at 1920×1080, then export down to 1600×900 for the site.
