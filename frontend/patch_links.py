import os, glob
for f in glob.glob('src/pages/customer/*.tsx'):
    with open(f, 'r', encoding='utf-8') as file: content = file.read()
    content = content.replace("navigate('/orders')", "navigate('/user/orders')")
    content = content.replace("navigate('/cart')", "navigate('/user/cart')")
    content = content.replace("navigate('/checkout')", "navigate('/user/checkout')")
    content = content.replace("navigate('/')", "navigate('/user/shop')")
    with open(f, 'w', encoding='utf-8') as file: file.write(content)

with open('src/components/Navbar.tsx', 'r', encoding='utf-8') as file: content = file.read()
content = content.replace("navigate('/profile')", "navigate('/user/profile')")
content = content.replace("navigate('/')", "navigate('/user/shop')")
with open('src/components/Navbar.tsx', 'w', encoding='utf-8') as file: file.write(content)
