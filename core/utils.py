import csv
import itertools
from django.db.models import Q
from django.http import HttpResponse

# Mapeo bidireccional de vocales y caracteres especiales para búsquedas en español
VOWEL_MAP = {
    'a': ('a', 'á', 'A', 'Á'),
    'e': ('e', 'é', 'E', 'É'),
    'i': ('i', 'í', 'I', 'Í'),
    'o': ('o', 'ó', 'O', 'Ó'),
    'u': ('u', 'ú', 'ü', 'U', 'Ú', 'Ü'),
    'á': ('a', 'á', 'A', 'Á'),
    'é': ('e', 'é', 'E', 'É'),
    'í': ('i', 'í', 'I', 'Í'),
    'ó': ('o', 'ó', 'O', 'Ó'),
    'ú': ('u', 'ú', 'ü', 'U', 'Ú', 'Ü'),
    'n': ('n', 'ñ', 'N', 'Ñ'),
    'ñ': ('n', 'ñ', 'N', 'Ñ'),
}

def get_accent_variations(word):
    """
    Genera permutaciones fonéticas y con tildes para una palabra en español,
    permitiendo que búsquedas como 'medica', 'educacion' o 'compania' coincidan 
    con 'médica', 'educación' o 'compañía' en SQLite y PostgreSQL.
    """
    if not word:
        return []
    word = word.strip()
    if len(word) > 25:
        return [word]

    choices = [VOWEL_MAP.get(c.lower(), (c,)) for c in word]
    total = 1
    for ch in choices:
        total *= len(ch)
        if total > 64:
            # Si la palabra es muy larga, generar variaciones individuales directas
            base = ''.join(c[0] for c in choices)
            res = {word, base}
            for i, c in enumerate(base):
                if c in ('a', 'e', 'i', 'o', 'u', 'n'):
                    alt = VOWEL_MAP[c][1]
                    res.add(base[:i] + alt + base[i+1:])
            return list(res)
            
    return [''.join(p) for p in itertools.product(*choices)]

def build_accent_query(field_names, q):
    """
    Construye un objeto Q compuesto tolerante a tildes y mayúsculas/minúsculas.
    """
    if not q or not q.strip():
        return Q()
    
    words = q.strip().split()
    overall_q = Q()
    for word in words:
        variants = get_accent_variations(word)
        word_q = Q()
        for field in field_names:
            for v in variants:
                word_q |= Q(**{f"{field}__icontains": v})
        overall_q &= word_q
    return overall_q

def export_to_excel_csv(filename, headers, rows):
    """
    Genera una respuesta HTTP con un archivo CSV compatible directamente con Microsoft Excel en español.
    Incluye BOM UTF-8 (\ufeff) y delimitador ';' para renderizado perfecto de caracteres con tilde y eñes.
    """
    response = HttpResponse(content_type='text/csv; charset=utf-8-sig')
    response['Content-Disposition'] = f'attachment; filename="{filename}.csv"'
    
    # Escribir BOM para Excel
    response.write('\ufeff')
    writer = csv.writer(response, delimiter=';', dialect='excel')
    writer.writerow(headers)
    for row in rows:
        writer.writerow(row)
    return response
