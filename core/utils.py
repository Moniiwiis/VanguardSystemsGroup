import io
import csv
import itertools
import re
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
    'ü': ('u', 'ú', 'ü', 'U', 'Ú', 'Ü'),
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


# =====================================================================
# VALIDACIÓN MATEMÁTICA Y NORMALIZACIÓN DE RUT CHILENO (MÓDULO 11)
# =====================================================================

def calcular_dv(cuerpo_str):
    """
    Calcula el dígito verificador para un cuerpo numérico de RUT mediante algoritmo Módulo 11.
    Retorna un caracter ('0'-'9' o 'K').
    """
    cuerpo = str(cuerpo_str).strip()
    if not cuerpo.isdigit():
        return None
    
    multiplicador = 2
    suma = 0
    for digito in reversed(cuerpo):
        suma += int(digito) * multiplicador
        multiplicador = 2 if multiplicador == 7 else multiplicador + 1
        
    resto = suma % 11
    resultado = 11 - resto
    if resultado == 11:
        return '0'
    elif resultado == 10:
        return 'K'
    return str(resultado)

def validar_rut(rut_completo):
    """
    Valida rigurosamente un RUT chileno:
    1. Verifica caracteres permitidos (dígitos, puntos, guion, K/k)
    2. Valida rango de longitud (entre 7 y 9 dígitos más DV)
    3. Comprueba el dígito verificador con el algoritmo Módulo 11
    
    Retorna una tupla: (es_valido: bool, rut_formateado_o_error: str)
    """
    if not rut_completo or not isinstance(rut_completo, str):
        return False, "El RUT es obligatorio."

    # Limpiar caracteres de formato
    rut_limpio = rut_completo.strip().replace('.', '').replace('-', '').replace(' ', '').upper()
    
    if len(rut_limpio) < 7 or len(rut_limpio) > 10:
        return False, "El RUT debe tener entre 7 y 9 dígitos más el dígito verificador."

    cuerpo = rut_limpio[:-1]
    dv = rut_limpio[-1]

    if not cuerpo.isdigit():
        return False, "El cuerpo del RUT debe contener únicamente números."

    if dv not in "0123456789K":
        return False, "El dígito verificador debe ser un número del 0 al 9 o la letra K."

    # Validar que no sea un número absurdo (menor a 50.000)
    if int(cuerpo) < 50000:
        return False, "El número de RUT ingresado no corresponde a un rango válido."

    dv_calculado = calcular_dv(cuerpo)
    if dv != dv_calculado:
        return False, f"El dígito verificador '{dv}' es incorrecto."

    # Formatear canónicamente como XX.XXX.XXX-Y
    rut_formateado = formatear_rut(cuerpo + dv)
    return True, rut_formateado

def formatear_rut(rut_str):
    """
    Convierte cualquier RUT limpio o sucio en el formato estándar chileno: 12.345.678-K
    """
    if not rut_str:
        return ""
    limpio = str(rut_str).strip().replace('.', '').replace('-', '').replace(' ', '').upper()
    if len(limpio) < 2:
        return limpio
    cuerpo = limpio[:-1]
    dv = limpio[-1]
    if not cuerpo.isdigit():
        return f"{cuerpo}-{dv}"
    cuerpo_fmt = "{:,}".format(int(cuerpo)).replace(',', '.')
    return f"{cuerpo_fmt}-{dv}"

def generar_rut_valido(numero):
    """Genera un RUT chileno válido dado un número base."""
    num_str = str(numero).strip()
    dv = calcular_dv(num_str)
    return formatear_rut(f"{num_str}{dv}")


# =====================================================================
# VALIDACIONES DE LONGITUD DE CARACTERES Y FORMATO GENERAL
# =====================================================================

def validar_largo(texto, max_len, nombre_campo):
    """
    Verifica que el texto no supere el largo máximo de caracteres.
    Retorna (valido: bool, mensaje_error: str o None)
    """
    if texto and len(str(texto).strip()) > max_len:
        return False, f"El campo '{nombre_campo}' excede el límite máximo permitido de {max_len} caracteres (actual: {len(str(texto).strip())})."
    return True, None


def validar_direccion(direccion, nombre_campo="Dirección", max_len=250):
    """
    Valida que una dirección o domicilio legal contenga obligatoriamente letras
    (nombre de calle, avenida o pasaje) y números (numeración), además de respetar el largo máximo.
    Si está vacía, retorna (True, None) para permitir campos opcionales vacíos.
    """
    if not direccion or not str(direccion).strip():
        return True, None
    texto = str(direccion).strip()
    ok_len, err_len = validar_largo(texto, max_len, nombre_campo)
    if not ok_len:
        return False, err_len
    tiene_letras = bool(re.search(r'[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]', texto))
    tiene_numeros = bool(re.search(r'\d', texto))
    if not (tiene_letras and tiene_numeros):
        return False, f"El campo '{nombre_campo}' debe contener tanto letras (calle o pasaje) como números (numeración)."
    return True, None

def validar_telefono_chileno(telefono):
    """
    Valida un número telefónico en formato chileno (+56 9 XXXX XXXX o 9 dígitos).
    """
    if not telefono or not str(telefono).strip():
        return True, None # Es opcional si no viene
    tel_limpio = re.sub(r'[\s\-\+\(\)]', '', str(telefono).strip())
    if tel_limpio in ('', '569', '56', '9'):
        return True, None # Solo el prefijo fijo sin dígitos adicionales
    if not tel_limpio.isdigit():
        return False, "El teléfono debe contener únicamente números y código internacional."
    if len(tel_limpio) < 8 or len(tel_limpio) > 12:
        return False, "El número de teléfono debe tener entre 8 y 12 dígitos."
    return True, None

def formatear_telefono_chileno(telefono):
    """
    Normaliza y formatea un número telefónico chileno al estándar canónico: +56 9 1234 5678.
    """
    if not telefono or not str(telefono).strip():
        return ""
    digits = re.sub(r'\D', '', str(telefono).strip())
    if digits in ('', '569', '56', '9'):
        return ""
    if digits.startswith('56'):
        digits = digits[2:]
    remaining = digits[1:] if digits.startswith('9') else digits
    if not remaining:
        return ""
    if len(remaining) == 8:
        return f"+56 9 {remaining[:4]} {remaining[4:]}"
    elif len(digits) == 9 and digits.startswith('9'):
        rem = digits[1:]
        return f"+56 9 {rem[:4]} {rem[4:]}"
    return str(telefono).strip()

def validar_imagen_subida(archivo, max_mb=2):
    """
    Valida que el archivo subido sea una imagen real JPEG o PNG de hasta 2 MiB.
    Verifica cabeceras mágicas para evitar spoofing de extensiones.
    """
    if not archivo:
        return False, "No se adjuntó ningún archivo de imagen."

    # Límite de tamaño: max_mb * 1024 * 1024 bytes
    limite_bytes = max_mb * 1024 * 1024
    if archivo.size > limite_bytes:
        return False, f"La imagen supera el tamaño máximo permitido de {max_mb} MiB ({round(archivo.size / (1024*1024), 2)} MiB)."

    # Validar extensión
    ext = archivo.name.lower().split('.')[-1] if '.' in archivo.name else ''
    if ext not in ['jpg', 'jpeg', 'png']:
        return False, "Formato no permitido. Solo se aceptan imágenes en formato JPEG o PNG (.jpg, .jpeg, .png)."

    # Validar cabeceras binarias reales (Magic bytes)
    try:
        pos_inicial = archivo.tell()
        cabecera = archivo.read(16)
        archivo.seek(pos_inicial)
        
        es_jpeg = cabecera.startswith(b'\xff\xd8\xff')
        es_png = cabecera.startswith(b'\x89PNG\r\n\x1a\n')
        if not (es_jpeg or es_png):
            return False, "El archivo no contiene una imagen JPEG o PNG válida y bien formada."
    except Exception as e:
        return False, f"Error al validar el archivo de imagen: {str(e)}"

    return True, None


# =====================================================================
# EXPORTACIÓN GENUINA A MICROSOFT EXCEL (.XLSX)
# =====================================================================

def export_to_excel_xlsx(filename, sheet_title, headers, rows):
    """
    Genera un archivo binario nativo de Microsoft Excel (.xlsx) usando openpyxl.
    Aplica diseño profesional institucional:
    - Encabezado con fondo azul oscuro/pizarra (#1E293B), texto blanco y negrita.
    - Bordes delgados y celdas legibles.
    - Auto-ajuste de ancho de columnas según el contenido.
    """
    import openpyxl
    from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
    from openpyxl.utils import get_column_letter

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = str(sheet_title)[:31]  # Excel limita el nombre de hoja a 31 caracteres

    # Estilos del encabezado
    header_font = Font(name='Segoe UI', size=11, bold=True, color='FFFFFF')
    header_fill = PatternFill(start_color='1E293B', end_color='1E293B', fill_type='solid')
    header_alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)

    thin_border = Border(
        left=Side(style='thin', color='E2E8F0'),
        right=Side(style='thin', color='E2E8F0'),
        top=Side(style='thin', color='E2E8F0'),
        bottom=Side(style='thin', color='E2E8F0')
    )
    cell_font = Font(name='Segoe UI', size=10, color='1E293B')
    cell_alignment = Alignment(vertical='center')

    # Escribir encabezados
    ws.append(headers)
    ws.row_dimensions[1].height = 26

    for col_idx in range(1, len(headers) + 1):
        cell = ws.cell(row=1, column=col_idx)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = header_alignment
        cell.border = thin_border

    # Escribir filas de datos
    for row_idx, row_data in enumerate(rows, start=2):
        ws.append(list(row_data))
        ws.row_dimensions[row_idx].height = 20
        for col_idx in range(1, len(headers) + 1):
            cell = ws.cell(row=row_idx, column=col_idx)
            cell.font = cell_font
            cell.border = thin_border
            cell.alignment = cell_alignment

    # Autoajustar ancho de columnas
    for col in ws.columns:
        max_len = 0
        col_letter = get_column_letter(col[0].column)
        for cell in col:
            val_str = str(cell.value or '')
            max_len = max(max_len, len(val_str))
        ws.column_dimensions[col_letter].width = max(max_len + 4, 12)

    # Preparar respuesta HTTP binaria
    output = io.BytesIO()
    wb.save(output)
    output.seek(0)

    clean_filename = f"{filename}.xlsx" if not filename.endswith('.xlsx') else filename
    response = HttpResponse(
        output.getvalue(),
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    response['Content-Disposition'] = f'attachment; filename="{clean_filename}"'
    return response

def export_to_excel_csv(filename, headers, rows):
    """Fallback a CSV en caso de ser necesario."""
    response = HttpResponse(content_type='text/csv; charset=utf-8-sig')
    response['Content-Disposition'] = f'attachment; filename="{filename}.csv"'
    response.write('\ufeff')
    writer = csv.writer(response, delimiter=';', dialect='excel')
    writer.writerow(headers)
    for row in rows:
        writer.writerow(row)
    return response
