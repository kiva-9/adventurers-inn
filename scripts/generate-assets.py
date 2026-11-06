"""Generate the original pixel art for 归途旅店. Requires Pillow; shipped PNGs do not."""
from PIL import Image, ImageDraw
from pathlib import Path
import random
R=Path(__file__).resolve().parents[1]/'public'/'assets'; R.mkdir(parents=True, exist_ok=True)
random.seed(3042)
S=32
im=Image.new('RGBA',(S*8,S*4),(0,0,0,0)); d=ImageDraw.Draw(im)
def rect(x,y,box,c):
 a,b,e,f=box; d.rectangle((x+a,y+b,x+e,y+f),fill=c)
def px(x,y,pts,c):
 for a,b in pts: d.point((x+a,y+b),fill=c)
def tile(i,j,base):
 x=i*S;y=j*S;rect(x,y,(0,0,31,31),base);return x,y
# Terrain, each tile is seamless at its edge and pixel aligned.
x,y=tile(0,0,'#78975c')
for k in range(22):
 a=random.randrange(2,30);b=random.randrange(2,30);rect(x,y,(a,b,a+1,b+1),random.choice(['#87a968','#66874f','#94ae6b']))
x,y=tile(1,0,'#c5aa79')
for k in range(32):
 a=random.randrange(2,29);b=random.randrange(2,30);rect(x,y,(a,b,a+2,b),random.choice(['#d4bd8d','#b8996b','#aa8d62']))
x,y=tile(2,0,'#a77149')
for a in (0,8,16,24):
 rect(x,y,(0,a,31,a),'#6c4736');rect(x,y,(0,a+1,31,a+1),'#c0905e')
 for b in ([11] if a%16==0 else [23]):rect(x,y,(b,a+1,b,a+7),'#76503a')
x,y=tile(3,0,'#6e5142')
for a in (0,8,16,24):
 rect(x,y,(0,a,31,a),'#4d3c36');rect(x,y,(0,a+1,31,a+1),'#8d6c50')
x,y=tile(4,0,'#deca9c')
rect(x,y,(0,0,31,3),'#755140');rect(x,y,(0,27,31,31),'#755140');rect(x,y,(0,4,31,5),'#f0ddb1');rect(x,y,(0,25,31,26),'#a7825e')
for a in (0,16):rect(x,y,(a,5,a+2,25),'#8b6047')
x,y=tile(5,0,'#9c5144')
for a in range(0,32,8):
 rect(x,y,(0,a,31,a+1),'#6f403b')
 for b in range((-8 if a%16 else 0),32,16):rect(x,y,(max(0,b+7),a+1,min(31,b+8),a+7),'#bf6a50')
x,y=tile(6,0,'#629d9c')
for a,b in [(2,4),(14,11),(4,22),(23,26),(25,3)]:rect(x,y,(a,b,a+5,b),'#a5ccbc')
x,y=tile(7,0,'#a9a18a')
for a in range(0,32,8):
 rect(x,y,(0,a,31,a),'#7a796d')
 for b in range((0 if a%16 else 8),32,16):rect(x,y,(b,a,b,a+7),'#7a796d')
# Furnishings are transparent overlays, intended atop floor.
def over(i,j):return i*S,j*S
x,y=over(0,1) # bed
for box,c in [((3,4,28,29),'#4d352e'),((5,3,26,27),'#9a6848'),((6,6,25,25),'#d5bd8d'),((7,7,24,13),'#eee0bd'),((6,15,25,26),'#8f594f'),((8,16,23,17),'#bb7965'),((3,25,6,30),'#543a30'),((25,25,28,30),'#543a30')]:rect(x,y,box,c)
x,y=over(1,1) # table
for box,c in [((5,10,26,23),'#503b31'),((4,7,27,19),'#714a35'),((5,6,26,17),'#b88556'),((7,8,24,9),'#d0a06b'),((7,20,10,27),'#503b31'),((22,20,25,27),'#503b31'),((14,9,19,13),'#d9c492'),((15,10,18,12),'#8d4b37')]:rect(x,y,box,c)
x,y=over(2,1) # counter
for box,c in [((0,10,31,28),'#4e382f'),((1,8,30,25),'#895c3e'),((0,6,31,11),'#c39360'),((2,12,29,12),'#5e3f31'),((4,14,13,22),'#aa784c'),((18,14,27,22),'#aa784c'),((7,15,10,16),'#d4a76b'),((21,15,24,16),'#d4a76b')]:rect(x,y,box,c)
x,y=over(3,1) # stool
for box,c in [((8,15,23,21),'#5a3e30'),((9,11,22,16),'#bc8d59'),((10,12,21,13),'#d0a570'),((10,20,12,27),'#654532'),((19,20,21,27),'#654532')]:rect(x,y,box,c)
x,y=over(4,1) # lamp
for box,c in [((13,4,18,6),'#5f4637'),((11,7,20,19),'#62473a'),((12,8,19,17),'#ffe096'),((14,9,17,15),'#fff2c7'),((10,19,21,21),'#674738'),((12,22,19,23),'#523c32')]:rect(x,y,box,c)
x,y=over(5,1) # crate
for box,c in [((4,9,27,27),'#594032'),((5,8,26,25),'#af8050'),((7,10,24,23),'#c7955e'),((6,15,25,16),'#79533a'),((14,9,16,25),'#79533a')]:rect(x,y,box,c)
x,y=over(6,1) # plant
for box,c in [((11,21,21,28),'#74463b'),((10,20,22,22),'#a9644d'),((15,10,17,21),'#547347'),((9,10,15,15),'#63894c'),((17,7,23,13),'#769956'),((12,5,17,10),'#83a85e'),((7,14,13,18),'#789c54')]:rect(x,y,box,c)
x,y=over(7,1) # door
for box,c in [((4,2,27,31),'#4c372f'),((7,4,24,31),'#966440'),((8,5,23,28),'#ad794e'),((10,7,21,16),'#774c38'),((10,19,21,26),'#8d5c3e'),((20,18,21,19),'#e7c37a')]:rect(x,y,box,c)
# Outdoor details.
x,y=over(0,2) # tree
for box,c in [((13,17,19,31),'#6c4a35'),((8,25,13,30),'#6c4a35'),((6,8,26,23),'#4e7349'),((3,13,27,21),'#5f854d'),((9,4,22,18),'#6e9654'),((6,10,14,14),'#86aa61'),((17,6,22,10),'#8bae64'),((18,16,25,19),'#719951')]:rect(x,y,box,c)
x,y=over(1,2) # sign
for box,c in [((14,13,17,31),'#634735'),((3,5,28,18),'#593e31'),((4,4,27,16),'#b98654'),((6,6,25,14),'#ddb37a'),((9,8,22,9),'#8e6345'),((9,11,19,12),'#8e6345')]:rect(x,y,box,c)
x,y=over(2,2) # flowers
for a,b,c in [(6,20,'#e9d18a'),(12,25,'#e5a2a0'),(22,17,'#eee1ad'),(26,27,'#e8b5a6')]:
 rect(x,y,(a,b+2,a,b+5),'#587e4d');rect(x,y,(a-1,b,a+1,b+2),c)
x,y=over(3,2) # barrel
for box,c in [((7,8,24,27),'#584036'),((6,11,25,24),'#9b6b43'),((8,7,23,10),'#c4935e'),((7,13,24,14),'#5a4438'),((7,22,24,23),'#5a4438'),((14,9,15,26),'#765038')]:rect(x,y,box,c)
x,y=over(4,2) # fire
for box,c in [((5,26,26,29),'#5e4536'),((8,23,23,26),'#a36b47'),((10,14,21,23),'#ce6941'),((13,10,18,21),'#f3b45b'),((14,16,17,23),'#ffe39a')]:rect(x,y,box,c)
x,y=over(5,2) # pond edge plant
for box,c in [((8,22,23,25),'#587e68'),((10,15,12,23),'#658b59'),((17,11,19,23),'#658b59'),((22,17,23,23),'#658b59'),((9,12,12,16),'#7f6242'),((17,8,20,12),'#7f6242')]:rect(x,y,box,c)
x,y=over(6,2) # sack
for box,c in [((8,8,23,27),'#6b503c'),((9,11,22,25),'#c0a06f'),((11,7,20,11),'#d6ba85'),((10,10,21,12),'#886348'),((11,23,20,24),'#a6825a')]:rect(x,y,box,c)
x,y=over(7,2) # rug
for box,c in [((2,6,29,26),'#70433d'),((3,7,28,25),'#a85f4e'),((5,9,26,23),'#d6a36d'),((7,11,24,21),'#a85f4e'),((14,12,17,20),'#e2bd84'),((10,15,21,17),'#e2bd84')]:rect(x,y,box,c)
# Small roof/wall fixtures.
x,y=over(0,3) # window with glow
for box,c in [((4,3,27,27),'#6f4a39'),((6,5,25,25),'#cfa16a'),((8,7,23,23),'#ffe3a0'),((15,7,16,23),'#8b6245'),((8,15,23,16),'#8b6245'),((3,27,28,29),'#8c6042')]:rect(x,y,box,c)
x,y=over(1,3) # notices
for box,c in [((4,4,27,27),'#684a39'),((6,6,25,25),'#b88155'),((8,7,15,18),'#ebd8a7'),((17,10,23,21),'#dfc995'),((9,10,13,10),'#997854'),((18,13,22,13),'#997854'),((9,13,13,13),'#997854')]:rect(x,y,box,c)
x,y=over(2,3) # bookshelf
for box,c in [((3,2,28,30),'#523b31'),((5,4,26,28),'#986a46'),((6,5,25,13),'#4f3a32'),((6,16,25,24),'#4f3a32'),((7,6,9,12),'#b65e4c'),((10,7,12,12),'#d5b06d'),((14,6,17,12),'#689090'),((19,8,23,12),'#d5b06d'),((7,17,10,23),'#809a69'),((12,18,15,23),'#bf7257'),((17,17,19,23),'#d7b271'),((21,18,24,23),'#83a0a0')]:rect(x,y,box,c)
x,y=over(3,3) # bowl
for box,c in [((8,16,23,21),'#6d4937'),((9,15,22,19),'#e5d1a1'),((11,14,20,16),'#9b6548'),((13,12,14,14),'#85a15d')]:rect(x,y,box,c)
x,y=over(4,3) # rock
for box,c in [((5,20,27,27),'#726f64'),((7,16,24,25),'#999888'),((10,13,20,20),'#b5b3a0'),((8,21,13,22),'#c1bda8')]:rect(x,y,box,c)
# tiled sprite sheet, transparent
im.save(R/'town-tiles.png')
# 14 named actors, 4 directions (down/left/right/up), three gait frames each.
# All silhouettes share a 32px bounding tile. Palette colors are deliberately distinctive.
people=[
 ('店主','#5a3c34','#528b88','#ddbd8d','apron'),('林恩','#5a4031','#768d5b','#dec29b','cloak'),('阿岚','#523d35','#a75748','#e2b78f','sword'),('米拉','#9a673b','#6f8ea0','#eac49c','hat'),('布莱恩','#493d38','#786b86','#c89572','armor'),('薇拉','#6a4336','#bb8460','#efc9a7','hat'),('诺亚','#463a37','#677e64','#d9ac88','sword'),('伊莎','#a1794c','#93708c','#e7bf99','cloak'),('罗恩','#76543b','#b97e4b','#d6a984','armor'),('塞拉','#453832','#657c9b','#eac29e','hat'),('霍恩','#bba06d','#9c6752','#c9926f','apron'),('艾达','#59423a','#81a29a','#e5b993','apron'),('梅芙','#b66e4b','#a27a62','#efc6a0','cloak'),('加尔','#51423c','#68796b','#c99170','armor')]
sheet=Image.new('RGBA',(32*12,32*len(people)),(0,0,0,0)); sd=ImageDraw.Draw(sheet)
def spr(n,col,direction,frame):
 name,hair,coat,skin,gear=people[n];x=col*32;y=n*32
 def q(box,c):
  a,b,cx,cy=box;sd.rectangle((x+a,y+b,x+cx,y+cy),fill=c)
 # Shadow, shoes and legs form a readable gait at 1x.
 q((8,29,23,30),'#00000038')
 stride=[0,-1,1][frame]; q((10,24,14,28+max(0,stride)),'#443c38');q((18,24,22,28+max(0,-stride)),'#443c38')
 q((10,21,14,26+stride),'#615046');q((18,21,22,26-stride),'#615046')
 # clothing and arms
 q((9,15,23,24),'#443d39');q((10,14,22,23),coat);q((7,16,9,22),coat);q((23,16,25,22),coat)
 q((7,21,9,23),skin);q((23,21,25,23),skin)
 q((11,22,21,23),'#58473e');q((15,22,17,23),'#e4bf75')
 if gear=='apron':q((12,18,20,23),'#e2d2a9');q((14,18,18,18),'#bba985')
 if gear=='armor':q((11,15,21,19),'#a7a899');q((12,16,20,16),'#d7d6bf')
 if gear=='cloak':q((9,15,11,22),'#4e5f50');q((21,15,23,22),'#4e5f50')
 if gear=='sword':q((24,15,25,26),'#a9b1a2');q((23,22,26,23),'#dfc487')
 # head outline, face, side/back hair differ by facing
 q((10,5,22,16),'#493b35');q((11,6,21,14),skin)
 if direction==3:
  q((10,5,22,13),hair);q((12,6,20,7),'#ffffff25');q((11,12,21,15),hair)
 else:
  q((10,5,22,9),hair);q((10,8,12,12),hair);q((20,8,22,11),hair)
  if direction==0:
   q((12,10,13,10),'#413c39');q((19,10,20,10),'#413c39');q((15,13,17,13),'#ab7567')
  elif direction==1:q((11,10,12,10),'#413c39');q((11,12,13,13),skin)
  else:q((20,10,21,10),'#413c39');q((19,12,21,13),skin)
 if gear=='hat':q((9,4,23,7),'#655443');q((11,2,21,5),coat);q((10,6,22,7),'#ddbd80')
for n in range(len(people)):
 for direction in range(4):
  for frame in range(3):spr(n,direction*3+frame,direction,frame)
sheet.save(R/'people.png')
# Portraits intentionally match the same character art, nearest-neighbour enlarged.
portraits=Image.new('RGBA',(64*len(people),64),(0,0,0,0))
for n in range(len(people)):
 crop=sheet.crop((5,n*32+1,27,n*32+23)).resize((60,60),Image.Resampling.NEAREST)
 portraits.alpha_composite(crop,(n*64+2,2))
portraits.save(R/'portraits.png')
print('Generated',R)

# Six recognizable, self-contained street facades, 96 px square each.
bld=Image.new('RGBA',(96*6,96),(0,0,0,0)); bd=ImageDraw.Draw(bld)
for i in range(6):
 x=i*96
 roof=['#a45c49','#677b83','#ad7d55','#7d9084','#a97d5c','#647b72'][i]
 light=['#c87958','#82969b','#cb9a6b','#9bac99','#c69b6d','#80978a'][i]
 def B(box,color):
  a,b,c,e=box;bd.rectangle((x+a,b,x+c,e),fill=color)
 def P(points,color):bd.polygon([(x+a,b) for a,b in points],fill=color)
 # ground shadow, wall, timber posts, plinth and warm windows
 B((5,87,91,91),'#443d3528');B((9,40,86,85),'#64473b');B((12,38,83,82),'#dcc69b');B((12,78,83,85),'#81644d')
 for px0 in (13,46,79):B((px0,39,px0+3,80),'#76513d')
 B((14,39,81,42),'#9a6a49');B((14,60,81,63),'#987051')
 for wx in (21,61):
  B((wx-2,49,wx+13,64),'#674b3d');B((wx,51,wx+11,61),'#f4d994');B((wx+5,51,wx+6,61),'#9a6b48');B((wx,56,wx+11,57),'#9a6b48');B((wx-3,64,wx+14,66),'#a57753')
 # broad tiled gable roof with shadow and roof ridges
 P([(4,39),(15,17),(80,17),(91,39),(91,44),(4,44)],'#61443b')
 P([(7,37),(17,19),(78,19),(88,37),(88,40),(7,40)],roof)
 B((16,17,79,20),light)
 for yy in (24,30,36):
  B((12-(yy-24)//3,yy,83+(yy-24)//3,yy+1),'#68473c')
  for xx in range(19+(5 if yy==30 else 0),80,16):B((xx,yy+2,xx+1,yy+5),light)
 B((4,40,91,44),'#624238');B((7,40,88,41),light)
 # central door and handle
 B((37,58,59,86),'#513b32');B((40,60,56,84),'#98683f');B((42,62,54,73),'#b38250');B((42,75,54,82),'#80573e');B((52,73,53,74),'#f5d58f')
 # Hanging sign bearing a symbol, visible without depending on fonts.
 B((38,33,58,47),'#523e34');B((40,35,56,45),'#dfbd82')
 if i==0: # inn / bed
  B((42,40,54,43),'#88564a');B((43,38,46,40),'#f1dfb3');B((42,43,43,44),'#614238');B((53,43,54,44),'#614238')
 elif i==1: # guild / sword
  B((47,36,49,42),'#8b9b9b');B((44,41,52,42),'#8b6045');B((47,43,49,44),'#8b6045')
 elif i==2: # market / scales
  B((47,36,49,44),'#806147');B((42,38,54,39),'#806147');B((42,40,45,42),'#b57f4c');B((51,40,54,42),'#b57f4c')
 elif i==3: # clinic / cross
  B((47,36,49,44),'#a8564b');B((44,39,52,41),'#a8564b')
 elif i==4: # plaza / fountain
  B((43,42,53,43),'#708e94');B((45,40,51,41),'#708e94');B((47,36,49,39),'#708e94')
 else: # gate / arch
  B((42,37,44,44),'#827568');B((52,37,54,44),'#827568');B((44,36,52,38),'#827568')
 # Individual awnings and chimney.
 if i in (0,2):
  B((11,65,33,67),'#795346');B((12,63,32,65),light)
 if i in (0,3):
  B((68,11,77,20),'#6b4b3c');B((67,10,78,12),'#ad7955')
bld.save(R/'buildings.png')
