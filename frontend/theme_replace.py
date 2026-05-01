import os

files = [
    r'c:\Users\deepe\Desktop\Commilk App\frontend\src\pages\customer\Checkout.tsx',
    r'c:\Users\deepe\Desktop\Commilk App\frontend\src\components\LocationPicker.tsx'
]

for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace primary color
    content = content.replace('blue-500', 'emerald-500')
    content = content.replace('blue-600', 'emerald-600')
    content = content.replace('blue-700', 'emerald-700')
    content = content.replace('blue-100', 'emerald-100')
    content = content.replace('blue-50', 'emerald-50')
    content = content.replace('blue-900', 'emerald-900')
    content = content.replace('blue-200', 'emerald-200')
    content = content.replace('blue-300', 'emerald-300')
    content = content.replace('blue-400', 'emerald-400')
    
    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)

print("Theme replaced successfully.")
