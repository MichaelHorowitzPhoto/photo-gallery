# Michael Horowitz — photography

A minimal gallery: random order on each page load, edge-to-edge 4:3 tiles, full-photo viewer, and a small email button. One column on phones, two on tablets and typical laptops, three on wide screens. Native lazy loading delays offscreen photographs. No tracking, database, or server required.

## Open the prototype

Unzip the download, then open `preview.html` in your browser. This preview includes the generated images, works without a server, and is a snapshot; rebuild the site for later additions.

## Set up on GitHub Pages

1. Create a new GitHub repository with a `main` branch. Keep your current site running while testing this prototype.
2. Put the contents of this folder at the repository root. Include `.github/workflows/pages.yml` (a folder beginning with a dot can be hidden in Finder). GitHub Desktop is a convenient way to commit the whole folder.
3. In the repository open **Settings → Pages → Build and deployment → Source → GitHub Actions**.
4. Open **Actions → Build and publish gallery → Run workflow** if the first push happened before Pages was configured.
5. After a successful deployment, the Pages settings show the site URL. Project subfolder URLs work: all asset paths are relative.

GitHub's setup documentation: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages

## Add photos

Put JPEG, PNG, WebP, or TIFF files in `originals/`, then commit and push. Subfolders work. On GitHub's website you can open `originals/`, choose **Add file → Upload files**, drop your photographs, and commit. GitHub's browser uploader limits individual files to 25 MiB; use exported JPEGs for this workflow.

The workflow automatically creates thumbnails (up to 1000 px) and larger viewing images (up to 2560 px), strips metadata from those viewing copies, and publishes `dist/`. It never changes originals. EXIF orientation is applied; embedded color profiles are converted to sRGB. RAW and HEIC are not supported: export them as JPEG first.

The files included in `originals/` are copies of the photographs already on your current public site, for this prototype. Replace them with your preferred exported photographs whenever you like. They are viewing copies, not your camera originals.

Deleting a file from `originals/` removes its generated copies from the next deployment. Original files remain in Git history. On a public repository, the source photographs are public too. Prefer normal JPEG exports rather than very large camera files; larger collections can later use external storage.

## Adjust an individual photograph

Edit `photo-settings.json`, using paths relative to `originals/`:

```json
{
  "example.jpg": {
    "position": "65% 25%",
    "alt": "A squirrel peeking around a tree trunk"
  }
}
```

Position is horizontal then vertical, from 0% (left/top) to 100% (right/bottom). The default is centered. Thumbnails preserve the source proportions and CSS crops them inside uniform tiles, so changing the focal point does not require a separate manually cropped image. The enlarged photograph always shows the complete frame.

## Change the appearance or contact

- `site/style.css`: columns, tile ratio, spacing, and colors.
- `site/index.html`: page title and contact name/email.
- `site/gallery.js`: randomization and viewer behavior.
- `scripts/build.py`: output sizes and image quality.
- `dist/photos.json`: generated automatically; never edit by hand. It uses ordinary image URLs, which can later point at another storage provider.

## Preview on your computer (optional)

From this folder:

```sh
python3 -m pip install -r requirements.txt
python3 scripts/build.py
python3 -m http.server 8000 --directory dist
```

Open http://localhost:8000. Opening the HTML directly as a file won't load the JSON list reliably.

## Your existing domain

Once you like the prototype, configure your domain in the new repository's **Settings → Pages → Custom domain**, following GitHub's instructions. Domain ownership checks and DNS settings may be needed. The prototype does not change your current website or domain.

## Prototype verification

The image pipeline and local asset references were checked, including EXIF rotation, duplicate filenames, focal-point overrides, stale image removal, and relative paths. JavaScript syntax was checked. Browser interaction and the real GitHub deployment still need verification after import.
