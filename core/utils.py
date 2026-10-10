import csv
from django.http import HttpResponse

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
