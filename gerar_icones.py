from PIL import Image

# 1. Abre a imagem original (salve a imagem que você me mandou como 'bola_original.jpg' na raiz)
img = Image.open('bola_original.jpg')

# 2. Define o quadrado de corte focado na bola (ignorando refletores e traves)
width, height = img.size
crop_size = int(height * 0.85) # Pega 85% da altura (foca no círculo do campo)
left = (width - crop_size) / 2
top = (height - crop_size) / 2
right = (width + crop_size) / 2
bottom = (height + crop_size) / 2

img_cropped = img.crop((left, top, right, bottom))

# 3. Cria a arte final 512x512 (fundo verde oficial #1b5e20)
bg_color = (27, 94, 32) 
canvas_512 = Image.new('RGB', (512, 512), bg_color)

# 4. Redimensiona a imagem cortada para 400x400 (deixa 56px de margem para a "safe zone" do Android)
img_400 = img_cropped.resize((400, 400), Image.Resampling.LANCZOS)

# 5. Cola no centro e salva
canvas_512.paste(img_400, (56, 56))
canvas_512.save('public/icon-512.png')

# 6. Gera a versão 192x192 a partir da 512
canvas_192 = canvas_512.resize((192, 192), Image.Resampling.LANCZOS)
canvas_192.save('public/icon-192.png')

print("✅ Ícones gerados com sucesso na pasta public/")