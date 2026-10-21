"""
Amplia 2x as fotos da loja com super-resolução (modelo EDSR do OpenCV) e grava
em img/hd/<nome>.jpg, que o scripts/optimize-media.mjs usa automaticamente.

Requisitos (fora do projeto Node):
  pip install opencv-contrib-python-headless
  curl -LO https://raw.githubusercontent.com/Saafke/EDSR_Tensorflow/master/models/EDSR_x2.pb

Uso: python scripts/upscale.py caminho/EDSR_x2.pb entrada.webp saida.jpg
(leva alguns minutos por foto em CPU)
"""
import sys
import cv2

model, inp, outp = sys.argv[1], sys.argv[2], sys.argv[3]
sr = cv2.dnn_superres.DnnSuperResImpl_create()
sr.readModel(model)
sr.setModel('edsr', 2)
img = cv2.imread(inp, cv2.IMREAD_COLOR)
cv2.imwrite(outp, sr.upsample(img), [cv2.IMWRITE_JPEG_QUALITY, 95])
