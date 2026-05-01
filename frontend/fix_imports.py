import os, glob
for f in glob.glob('src/pages/customer/*.tsx'):
    with open(f, 'r', encoding='utf-8') as file: content = file.read()
    content = content.replace("../../../api", "../../api")
    content = content.replace("../../../cartStore", "../../cartStore")
    content = content.replace("../../../store", "../../store")
    with open(f, 'w', encoding='utf-8') as file: file.write(content)
