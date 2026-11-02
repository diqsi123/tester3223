import json, urllib.request, pathlib, concurrent.futures, shutil
root=pathlib.Path(__file__).resolve().parent.parent
assets=json.loads("{\"avatar.png\":\"https://www.figma.com/api/mcp/asset/0ed23248-c9b3-4120-bc80-50a25c86857d/e96f1.png\",\"filter.svg\":\"https://www.figma.com/api/mcp/asset/0ed23248-c9b3-4120-bc80-50a25c86857d/8d2f2.svg\",\"search.svg\":\"https://www.figma.com/api/mcp/asset/0ed23248-c9b3-4120-bc80-50a25c86857d/b27ea.svg\",\"chats.svg\":\"https://www.figma.com/api/mcp/asset/0ed23248-c9b3-4120-bc80-50a25c86857d/57c73.svg\",\"profile.svg\":\"https://www.figma.com/api/mcp/asset/0ed23248-c9b3-4120-bc80-50a25c86857d/47071.svg\",\"female.svg\":\"https://www.figma.com/api/mcp/asset/0ed23248-c9b3-4120-bc80-50a25c86857d/d4a8a.svg\",\"any.svg\":\"https://www.figma.com/api/mcp/asset/0ed23248-c9b3-4120-bc80-50a25c86857d/6f954.svg\",\"male.svg\":\"https://www.figma.com/api/mcp/asset/0ed23248-c9b3-4120-bc80-50a25c86857d/2251f.svg\",\"diamond.svg\":\"https://www.figma.com/api/mcp/asset/0ed23248-c9b3-4120-bc80-50a25c86857d/205c2.svg\",\"online.svg\":\"https://www.figma.com/api/mcp/asset/0ed23248-c9b3-4120-bc80-50a25c86857d/32533.svg\",\"plus.svg\":\"https://www.figma.com/api/mcp/asset/35e3001c-5a64-45f0-85d5-9592028a28bf/f8cbe.svg\",\"music.svg\":\"https://www.figma.com/api/mcp/asset/35e3001c-5a64-45f0-85d5-9592028a28bf/05949.svg\",\"games.svg\":\"https://www.figma.com/api/mcp/asset/35e3001c-5a64-45f0-85d5-9592028a28bf/e0403.svg\",\"sport.svg\":\"https://www.figma.com/api/mcp/asset/35e3001c-5a64-45f0-85d5-9592028a28bf/9186c.svg\",\"cinema.svg\":\"https://www.figma.com/api/mcp/asset/35e3001c-5a64-45f0-85d5-9592028a28bf/a533d.svg\",\"books.svg\":\"https://www.figma.com/api/mcp/asset/35e3001c-5a64-45f0-85d5-9592028a28bf/6fe85.svg\"}")
def download(item):
 name,url=item
 urllib.request.urlretrieve(url, root/'public/assets/chatus'/name)
 return name
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
 print(list(pool.map(download,assets.items())))
for weight in ['Medium','Bold']:
 shutil.copyfile('/Users/nikitaacimov/Library/Fonts/Gerbera '+weight+'.otf',root/'public/assets/chatus'/('Gerbera-'+weight+'.otf'))
for name,url in [('source-home.png','https://www.figma.com/api/mcp/asset/b4dfd49f-aff3-4280-ae5d-728d6b7180ec.png'),('source-filters.png','https://www.figma.com/api/mcp/asset/02b32ffd-16f0-4535-98ff-898e40874d21.png')]:
 urllib.request.urlretrieve(url,root/'evidence'/name)

