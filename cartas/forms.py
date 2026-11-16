from django import forms
from core.utils import formatear_telefono_chileno, validar_telefono_chileno, validar_largo
from .models import Carta


class CartaForm(forms.ModelForm):
    class Meta:
        model = Carta
        fields = [
            'fecha', 'numero', 'para', 'remite', 'fono_contacto', 'actividad_tema',
            'fecha_actividad', 'encargado_seguimiento', 'estado', 'pronunciamiento',
            'derivada_a', 'observacion', 'unidad',
        ]
        widgets = {
            'fecha': forms.DateInput(attrs={'type': 'date'}, format='%Y-%m-%d'),
            'numero': forms.TextInput(attrs={'placeholder': 'Ej: 9993 (opcional si es S/N)', 'maxlength': '60'}),
            'para': forms.Select(choices=Carta.PARA_CHOICES),
            'remite': forms.TextInput(attrs={'placeholder': 'Nombre o institución remitente', 'maxlength': '180'}),
            'fono_contacto': forms.TextInput(attrs={
                'data-phone-cl': 'true',
                'maxlength': '60',
                'placeholder': '+56 9 1234 5678',
            }),
            'actividad_tema': forms.Textarea(attrs={'rows': 3, 'maxlength': '1000'}),
            'fecha_actividad': forms.TextInput(attrs={
                'maxlength': '100',
                'placeholder': 'Ej: 17/07/2026 o 16 AL 19/07',
            }),
            'encargado_seguimiento': forms.TextInput(attrs={
                'list': 'cartas-encargados-list',
                'placeholder': 'Buscar funcionario, unidad o área...',
                'maxlength': '160',
            }),
            'estado': forms.Select(choices=Carta.ESTADOS),
            'pronunciamiento': forms.Select(choices=Carta.PRONUNCIAMIENTO_CHOICES),
            'derivada_a': forms.TextInput(attrs={
                'list': 'cartas-derivada-list',
                'placeholder': 'Buscar destinatario o área de derivación...',
                'maxlength': '180',
            }),
            'observacion': forms.Textarea(attrs={'rows': 3, 'maxlength': '1000'}),
            'unidad': forms.Select(choices=Carta.UNIDAD_CHOICES),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['fecha'].input_formats = ['%Y-%m-%d']
        self.fields['fecha'].required = True
        self.fields['numero'].required = False
        self.fields['unidad'].required = False
        self.fields['pronunciamiento'].required = False
        base_cls = 'w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium bg-white focus:ring-2 focus:ring-[#C41230] focus:outline-none'
        for field in self.fields.values():
            field.widget.attrs['class'] = base_cls

        # Si el registro histórico tiene un valor fuera de las opciones actuales, agregarlo temporalmente
        if self.instance and self.instance.pk:
            for field_name in ('para', 'pronunciamiento', 'unidad'):
                val = (getattr(self.instance, field_name, '') or '').strip()
                if val and val not in {c[0] for c in self.fields[field_name].choices}:
                    self.fields[field_name].choices = list(self.fields[field_name].choices) + [(val, val)]

    def clean_fono_contacto(self):
        val = (self.cleaned_data.get('fono_contacto') or '').strip()
        if not val or '@' in val:
            return val
        digits = ''.join(ch for ch in val if ch.isdigit())
        if len(digits) in (8, 9, 11):
            ok, err = validar_telefono_chileno(val)
            if not ok:
                raise forms.ValidationError(err)
            return formatear_telefono_chileno(val) or val
        return val

    def clean_actividad_tema(self):
        val = (self.cleaned_data.get('actividad_tema') or '').strip()
        ok, err = validar_largo(val, 1000, 'Actividad o tema')
        if not ok:
            raise forms.ValidationError(err)
        return val

    def clean_observacion(self):
        val = (self.cleaned_data.get('observacion') or '').strip()
        ok, err = validar_largo(val, 1000, 'Observación')
        if not ok:
            raise forms.ValidationError(err)
        return val

    def clean_unidad(self):
        val = (self.cleaned_data.get('unidad') or '').strip()
        return val or '1'

    def clean_pronunciamiento(self):
        val = (self.cleaned_data.get('pronunciamiento') or '').strip()
        return val or 'NO APLICA'
