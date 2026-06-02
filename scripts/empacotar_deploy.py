"""
Empacota o backend (já com o build do frontend em `frontend_dist`) num .zip
pronto para o `az webapp deploy`.

Por que existe: o `Compress-Archive` do Windows PowerShell 5.1 grava os caminhos
com barra invertida (`pasta\\arquivo`), o que quebra no Linux do App Service (o
Oryx trata como nome de arquivo, não pasta). Este script usa o módulo `zipfile`
do Python, que sempre grava com barra normal (`pasta/arquivo`), padrão do
formato e compatível com Linux.

Uso:
    python scripts/empacotar_deploy.py <pasta_origem> <arquivo_zip>

Exclui artefatos que não devem ir para produção (venv, caches, banco local).
"""

import os
import sys
import zipfile

EXCLUIR_DIRS = {'venv', '.venv', '__pycache__', 'staticfiles', '.pytest_cache'}
EXCLUIR_SUFIXOS = ('.pyc', '.sqlite3', '.sqlite3-journal')
EXCLUIR_ARQUIVOS = {'db.sqlite3'}


def empacotar(origem, destino):
    if os.path.exists(destino):
        os.remove(destino)

    total = 0
    with zipfile.ZipFile(destino, 'w', zipfile.ZIP_DEFLATED) as z:
        for raiz, dirs, arquivos in os.walk(origem):
            # Poda diretórios excluídos in-place (evita descer neles).
            dirs[:] = [d for d in dirs if d not in EXCLUIR_DIRS]
            for nome in arquivos:
                if nome in EXCLUIR_ARQUIVOS or nome.endswith(EXCLUIR_SUFIXOS):
                    continue
                caminho = os.path.join(raiz, nome)
                arc = os.path.relpath(caminho, origem).replace(os.sep, '/')
                z.write(caminho, arc)
                total += 1

    tamanho_mb = round(os.path.getsize(destino) / 1024 / 1024, 2)
    print(f'Empacotados {total} arquivos em {destino} ({tamanho_mb} MB).')


if __name__ == '__main__':
    if len(sys.argv) != 3:
        print('Uso: python scripts/empacotar_deploy.py <pasta_origem> <arquivo_zip>')
        sys.exit(1)
    empacotar(sys.argv[1], sys.argv[2])
